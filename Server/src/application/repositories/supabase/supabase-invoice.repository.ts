import { Invoice } from "../../../modules/invoice/invoice.model";
import { IInvoiceRepository } from "../interfaces/invoice-repository.interface";
import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { randomUUID } from "crypto";
import { CacheService } from "../../../infrastructure/cache/cache.service";

const shopCache = new CacheService();
const SHOP_CACHE_TTL = 15 * 60 * 1000; // 15 mins

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  private async getClient() {
    return await SupabaseManager.getClient();
  }

  generateId(): string {
    return randomUUID();
  }

  // ─── Standard CRUD ───────────────────────────────────────────────────────────

  async getInvoices(): Promise<Invoice[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('invoices').select('data');
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Invoice);
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('invoices').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data as Invoice;
  }

  async updateInvoice(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    const invoice = await this.getInvoice(id);
    if (!invoice) return;

    const updatedData = { ...invoice, ...payload, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('invoices').update({ data: updatedData }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteInvoice(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getInvoicesByShop(shopId: string, employeeId?: string, branchId?: string): Promise<Invoice[]> {
    const supabase = await this.getClient();
    let query = supabase.from('invoices').select('data').eq('shopId', shopId);
    if (branchId) query = query.eq('branchId', branchId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let invoices = data.map((d: any) => d.data as Invoice);
    if (employeeId) {
      invoices = invoices.filter(inv => inv.employeeId === employeeId);
    }
    return invoices;
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('invoices')
      .select('data')
      .contains('data', { customerId });
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Invoice);
  }

  // ─── Transaction Read Operations ──────────────────────────────────────────────

  async getTransactionShop(_transaction: any, shopId: string): Promise<any> {
    const cacheKey = `repository:shop:${shopId}`;
    const cached = shopCache.get<any>(cacheKey);
    if (cached) {
      return { exists: true, data: () => cached };
    }

    const { db } = require("../../../config/firebase.config");
    const snapshot = await db.collection('shops').doc(shopId).get();
    if (snapshot.exists) {
      const data = snapshot.data();
      shopCache.set(cacheKey, data, SHOP_CACHE_TTL);
      return { exists: true, data: () => data };
    }
    return { exists: false };
  }

  async getTransactionCustomer(_transaction: any, shopId: string, phone: string): Promise<any> {
    const supabase = await this.getClient();
    const { data } = await supabase.from('customers')
      .select('data')
      .eq('shopId', shopId)
      .contains('data', { phoneNumber: phone })
      .limit(1)
      .single();
    return data
      ? { empty: false, docs: [{ data: () => data.data, ref: { id: data.data.id } }] }
      : { empty: true, docs: [] };
  }

  async getTransactionProducts(_transaction: any, productIds: string[]): Promise<any[]> {
    if (!productIds.length) return [];
    const supabase = await this.getClient();
    const { data } = await supabase.from('products').select('data').in('id', productIds);
    return (data || []).map((d: any) => ({
      exists: true,
      id: d.data.id,
      data: () => d.data,
      ref: { id: d.data.id },
    }));
  }

  /**
   * OPTIMIZED: Batch inventory lookup — 1 query instead of N.
   *
   * Previously: sequential `for` loop with `await supabase.single()` per item
   * → N round trips for N invoice items.
   *
   * Now: single `.in('productId', [...])` query, results mapped in memory by
   * `productId:variantSku` composite key. This preserves the exact same result
   * shape expected by `invoice.service.ts` (array of Firestore-style snapshot
   * objects, indexed 1:1 with `inventoryItems`).
   */
  async getTransactionInventoryItems(
    _transaction: any,
    shopId: string,
    items: { productId: string; variantSku: string }[]
  ): Promise<any[]> {
    if (!items.length) return [];

    const supabase = await this.getClient();

    // Collect unique productIds for the IN clause
    const uniqueProductIds = [...new Set(items.map(i => i.productId))];

    // Single batch query — replaces N sequential queries
    const { data, error } = await supabase
      .from('inventory')
      .select('id, productId, variantSku, data')
      .eq('shopId', shopId)
      .in('productId', uniqueProductIds);

    if (error) throw new Error(error.message);

    // Build composite-key lookup map: "productId:variantSku" → row
    const invMap = new Map<string, any>();
    for (const row of (data || [])) {
      const key = `${row.productId}:${row.variantSku || ""}`;
      invMap.set(key, row);
    }

    // Return results in the same index order as `items`, preserving Firestore-
    // compatible snapshot shape so invoice.service.ts requires zero changes.
    return items.map(item => {
      const key = `${item.productId}:${item.variantSku || ""}`;
      const found = invMap.get(key);
      if (found) {
        return {
          empty: false,
          docs: [{
            // Expose the Supabase row id so updateTransactionInventory can use it
            id: found.id,
            data: () => found.data,
            ref: { id: found.id },
          }],
        };
      }
      return { empty: true, docs: [] };
    });
  }

  // ─── Transaction Write Operations ────────────────────────────────────────────

  /**
   * OPTIMIZED: Now properly awaited — no more silent fire-and-forget failures.
   */
  async createTransactionInvoice(_transaction: any, invoice: Invoice): Promise<void> {
    const supabase = await this.getClient();
    invoice.id = invoice.id || this.generateId();
    const { error } = await supabase.from('invoices').insert({
      id: invoice.id,
      shopId: invoice.shopId,
      branchId: invoice.branchId || null,
      data: invoice,
    });
    if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  }

  /**
   * OPTIMIZED: Accepts pre-fetched `existingData` — skips the read round trip.
   *
   * Previously: read customer → merge in Node.js → write (2 round trips).
   * Now: merge in Node.js using already-fetched data → write (1 round trip).
   *
   * `existingData` is the raw customer object returned by `getTransactionCustomer`.
   * If not provided, falls back to a read (backward-compatible).
   */
  async updateTransactionCustomer(_transaction: any, customerId: string, customerData: any, existingData?: any): Promise<void> {
    const supabase = await this.getClient();
    let base = existingData;
    if (!base) {
      // Fallback: read if existingData was not passed (backward-compatible)
      const { data } = await supabase.from('customers').select('data').eq('id', customerId).single();
      base = data?.data;
    }
    if (!base) return;
    const updated = { ...base, ...customerData };
    const { error } = await supabase.from('customers').update({ data: updated }).eq('id', customerId);
    if (error) throw new Error(`Failed to update customer: ${error.message}`);
  }

  /**
   * OPTIMIZED: Now properly awaited — no more silent fire-and-forget failures.
   */
  async createTransactionCustomer(_transaction: any, customer: any): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('customers').insert({
      id: customer.id,
      shopId: customer.shopId,
      data: customer,
    });
    if (error) throw new Error(`Failed to create customer: ${error.message}`);
  }

  /**
   * OPTIMIZED: Accepts pre-fetched `existingData` — skips the read round trip.
   *
   * Previously: read inventory → merge in Node.js → write (2 round trips per item).
   * Now: merge in Node.js using already-fetched data → write (1 round trip per item).
   *
   * `existingData` is the JSONB `data` column value from `getTransactionInventoryItems`.
   * If not provided, falls back to a read (backward-compatible).
   */
  async updateTransactionInventory(_transaction: any, invId: string, stock: number, existingData?: any): Promise<void> {
    const supabase = await this.getClient();
    let base = existingData;
    if (!base) {
      // Fallback: read if existingData was not passed (backward-compatible)
      const { data } = await supabase.from('inventory').select('data').eq('id', invId).single();
      base = data?.data;
    }
    if (!base) return;
    const updated = { ...base, currentStock: stock, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('inventory').update({ data: updated }).eq('id', invId);
    if (error) throw new Error(`Failed to update inventory ${invId}: ${error.message}`);
  }

  /**
   * OPTIMIZED: Fully implemented — was previously a console.warn stub.
   * Now inserts into `inventory_history` table.
   */
  async createTransactionHistory(_transaction: any, historyRecord: any): Promise<void> {
    const supabase = await this.getClient();
    const id = historyRecord.id || this.generateId();
    const { error } = await supabase.from('inventory_history').insert({
      id,
      shopId: historyRecord.shopId,
      productId: historyRecord.productId,
      variantSku: historyRecord.variantSku || "",
      movementType: historyRecord.movementType || "sale",
      data: { ...historyRecord, id },
    });
    // Non-fatal: history insert failure should not fail the invoice
    if (error) {
      console.error(`[SupabaseInvoiceRepository] Failed to insert inventory_history: ${error.message}`);
    }
  }

  /**
   * OPTIMIZED: Accepts pre-fetched `existingData` — skips the read round trip.
   *
   * Previously: read product → merge variants in Node.js → write (2 round trips per item).
   * Now: merge using already-fetched data → write (1 round trip per item).
   *
   * `existingData` is the JSONB `data` column value from `getTransactionProducts`.
   * If not provided, falls back to a read (backward-compatible).
   */
  async updateTransactionProduct(_transaction: any, productId: string, productUpdate: any, existingData?: any): Promise<void> {
    const supabase = await this.getClient();
    let base = existingData;
    if (!base) {
      // Fallback: read if existingData was not passed (backward-compatible)
      const { data } = await supabase.from('products').select('data').eq('id', productId).single();
      base = data?.data;
    }
    if (!base) return;
    const updated = { ...base, ...productUpdate };
    const { error } = await supabase.from('products').update({ data: updated }).eq('id', productId);
    if (error) throw new Error(`Failed to update product ${productId}: ${error.message}`);
  }

  /**
   * OPTIMIZED: Batch inventory+product updates run in parallel via Promise.all.
   *
   * Previously: `invoice.service.ts` called updateTransactionInventory and
   * updateTransactionProduct per-item in a `for` loop — each with a hidden
   * read before the write (N reads + N writes + N reads + N writes = 4N ops).
   *
   * Now: all inventory updates and product updates launch in parallel.
   * For a 10-item invoice: 10 inventory writes + 10 product writes + 10 history
   * inserts = 30 concurrent Supabase calls resolved in a single Promise.all,
   * finishing in ~1 network round trip (concurrency limited by Supabase's
   * connection pool, not sequential awaits).
   *
   * Safety: all items use pre-fetched existingData — no reads inside this method.
   * If any write fails, Promise.all rejects immediately and the error propagates
   * to the invoice service, preventing invoice creation from completing.
   */
  async batchUpdateTransactionInventoryAndProducts(
    _transaction: any,
    updates: Array<{
      invId: string;
      newStock: number;
      existingInvData: any;
      productId: string;
      productUpdate: any;
      existingProductData: any;
      historyRecord: any;
    }>
  ): Promise<void> {
    if (!updates.length) return;

    await Promise.all(
      updates.flatMap(u => [
        this.updateTransactionInventory(null, u.invId, u.newStock, u.existingInvData),
        this.updateTransactionProduct(null, u.productId, u.productUpdate, u.existingProductData),
        this.createTransactionHistory(null, u.historyRecord),
      ])
    );
  }
}
