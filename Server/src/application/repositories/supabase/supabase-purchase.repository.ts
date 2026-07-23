import {
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierPayment,
  PurchaseReturn,
} from "../../../modules/purchase/purchase.model";
import { IPurchaseRepository } from "../interfaces/purchase-repository.interface";
import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { randomUUID } from "crypto";

export class SupabasePurchaseRepository implements IPurchaseRepository {
  private async getClient() {
    return await SupabaseManager.getClient();
  }

  generateSupplierId(): string {
    return randomUUID();
  }
  generatePurchaseOrderId(): string {
    return randomUUID();
  }
  generateGoodsReceivedId(): string {
    return randomUUID();
  }
  generateSupplierPaymentId(): string {
    return randomUUID();
  }
  generatePurchaseReturnId(): string {
    return randomUUID();
  }

  async getPurchaseOrdersCount(shopId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count } = await supabase.from('purchase_orders').select('id', { count: 'exact' }).eq('shopId', shopId);
    return count || 0;
  }
  async getGoodsReceivedCount(shopId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count } = await supabase.from('goods_received').select('id', { count: 'exact' }).eq('shopId', shopId);
    return count || 0;
  }
  async getSupplierPaymentsCount(shopId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count } = await supabase.from('supplier_payments').select('id', { count: 'exact' }).eq('shopId', shopId);
    return count || 0;
  }
  async getPurchaseReturnsCount(shopId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count } = await supabase.from('purchase_returns').select('id', { count: 'exact' }).eq('shopId', shopId);
    return count || 0;
  }

  async getSuppliers(shopId: string): Promise<Supplier[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('suppliers').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Supplier);
  }
  async createSupplier(supplier: Supplier): Promise<void> {
    const supabase = await this.getClient();
    supplier.id = supplier.id || this.generateSupplierId();
    const { error } = await supabase.from('suppliers').insert({ id: supplier.id, shopId: supplier.shopId, data: supplier });
    if (error) throw new Error(error.message);
  }
  async updateSupplier(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'suppliers',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const { data } = await supabase.from('suppliers').select('data').eq('id', id).single();
    if (!data) return;
    const updated = { ...data.data, ...payload };
    const { error } = await supabase.from('suppliers').update({ data: updated }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async deleteSupplier(id: string): Promise<void> {
    const supabase = await this.getClient();
    await supabase.from('suppliers').delete().eq('id', id);
  }

  async getPurchaseOrders(shopId: string): Promise<PurchaseOrder[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('purchase_orders').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as PurchaseOrder);
  }
  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('purchase_orders').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data as PurchaseOrder;
  }
  async createPurchaseOrder(po: PurchaseOrder): Promise<void> {
    const supabase = await this.getClient();
    po.id = po.id || this.generatePurchaseOrderId();
    const { error } = await supabase.from('purchase_orders').insert({ id: po.id, shopId: po.shopId, data: po });
    if (error) throw new Error(error.message);
  }
  async updatePurchaseOrder(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'purchase_orders',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const { data } = await supabase.from('purchase_orders').select('data').eq('id', id).single();
    if (!data) return;
    const updated = { ...data.data, ...payload };
    const { error } = await supabase.from('purchase_orders').update({ data: updated }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async deletePurchaseOrder(id: string): Promise<void> {
    const supabase = await this.getClient();
    await supabase.from('purchase_orders').delete().eq('id', id);
  }

  async getGoodsReceived(shopId: string): Promise<GoodsReceivedNote[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('goods_received').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as GoodsReceivedNote);
  }
  async createGoodsReceived(grn: GoodsReceivedNote): Promise<void> {
    const supabase = await this.getClient();
    grn.id = grn.id || this.generateGoodsReceivedId();
    const { error } = await supabase.from('goods_received').insert({ id: grn.id, shopId: grn.shopId, data: grn });
    if (error) throw new Error(error.message);
  }

  async getSupplierPayments(shopId: string): Promise<SupplierPayment[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('supplier_payments').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as SupplierPayment);
  }
  async createSupplierPayment(payment: SupplierPayment): Promise<void> {
    const supabase = await this.getClient();
    payment.id = payment.id || this.generateSupplierPaymentId();
    const { error } = await supabase.from('supplier_payments').insert({ id: payment.id, shopId: payment.shopId, data: payment });
    if (error) throw new Error(error.message);
  }

  async getPurchaseReturns(shopId: string): Promise<PurchaseReturn[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('purchase_returns').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as PurchaseReturn);
  }
  async createPurchaseReturn(pr: PurchaseReturn): Promise<void> {
    const supabase = await this.getClient();
    pr.id = pr.id || this.generatePurchaseReturnId();
    const { error } = await supabase.from('purchase_returns').insert({ id: pr.id, shopId: pr.shopId, data: pr });
    if (error) throw new Error(error.message);
  }

  async getInventoryStock(shopId: string, productId: string, variantSku: string): Promise<number> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory')
      .select('data')
      .eq('shopId', shopId)
      .eq('productId', productId)
      .eq('variantSku', variantSku || "")
      .limit(1)
      .single();
      
    if (error || !data) return 0;
    return Number(data.data.currentStock) || 0;
  }
}
