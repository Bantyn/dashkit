import { CacheService } from "../../infrastructure/cache/cache.service";
import { createNotification } from "../notification/notification.controller";
import { logActivity } from "../staff/staff.service";
import { calculateTax } from "../../shared/utils/taxCalculator";
import { Shop } from "../shop/shop.model";
import { Invoice, InvoiceItem } from "./invoice.model";
import { inventoryService } from "../inventory/inventory.service";
import { productService } from "../product/product.service";
import { customerCreditService } from "../customer-credit/customer-credit.service";
import { shopCountersService } from "../../infrastructure/cache/shop-counters.service";
import { costAnalyticsService } from "../cost-analytics/cost-analytics.service";
import { IInvoiceRepository } from "../../application/repositories/interfaces/invoice-repository.interface";
import { ITransactionManager } from "../../application/repositories/transactions/transaction-manager.interface";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

export class InvoiceService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 30 * 1000;

  private get invoiceRepository(): IInvoiceRepository {
    return RepositoryFactory.getInvoiceRepository();
  }

  private get transactionManager(): ITransactionManager {
    return RepositoryFactory.getTransactionManager();
  }

  private getShopInvoicesKey(shopId: string, employeeId?: string, branchId?: string) {
    return `invoices:shop:${shopId}:${employeeId || "all"}:${branchId || "all"}`;
  }

  private getInvoiceKey(id: string) {
    return `invoice:${id}`;
  }

  private invalidateInvoiceCache(shopId?: string, invoiceId?: string) {
    if (shopId) {
      this.cache.deleteByPrefix(`invoices:shop:${shopId}:`);
      try {
        const { analyticsService } = require("../analytics/analytics.service");
        analyticsService.invalidateShopAnalyticsCache(shopId);
      } catch (err) {
        console.error("Failed to invalidate analytics cache:", err);
      }
    }
    if (invoiceId) {
      this.cache.delete(this.getInvoiceKey(invoiceId));
    }
  }

  async createInvoice(payload: any) {
    const { shopId, customerName, customerPhone } = payload;

    const isWholesale = payload.invoiceType === "wholesale";
    const uniqueProductIds = Array.from(
      new Set(
        (payload.items || [])
          .filter((item: any) => item.productId && item.productId !== "temp-id")
          .map((item: any) => item.productId)
      )
    ) as string[];

    const inventoryItems = (payload.items || []).filter((item: any) => item.productId && item.productId !== "temp-id");

    const transactionStartTime = Date.now();
    const result = await this.transactionManager.runTransaction(async (transaction) => {
      const readsStartTime = Date.now();
      const [
        shopDoc,
        customerDocs,
        productDocs,
        inventorySnapshots
      ] = await Promise.all([
        this.invoiceRepository.getTransactionShop(transaction, shopId),
        this.invoiceRepository.getTransactionCustomer(transaction, shopId, customerPhone || ""),
        this.invoiceRepository.getTransactionProducts(transaction, uniqueProductIds),
        this.invoiceRepository.getTransactionInventoryItems(transaction, shopId, inventoryItems)
      ]);

      if (process.env.NODE_ENV !== "production") {
        console.log(`[Invoice Instrumentation] Parallel reads took ${Date.now() - readsStartTime}ms`);
      }

      if (!shopDoc || !shopDoc.exists || typeof shopDoc.data !== 'function') {
        throw new Error("Shop not found or invalid shop document.");
      }

      const shopData = shopDoc.data() as Shop;
      const taxConfig = shopData?.taxConfig || {
        gstEnabled: false,
        gstRate: 0,
        gstType: "exclusive",
        splitGst: false,
        igstOnInterstate: false,
      };

      const customerAddress = payload.customerAddress || { state: "" };
      const shopAddress = shopData?.pickupAddress || { state: "" };

      let customerId = "";
      let newCustomerData: any = null;
      let existingCustomerData: any = null;

      if (customerDocs.empty) {
        customerId = this.invoiceRepository.generateId();
        newCustomerData = {
          id: customerId,
          shopId,
          name: customerName || "Walk-in Customer",
          phoneNumber: customerPhone || "Not Provided",
          totalOrders: 1,
          totalSpent: payload.total || 0,
          lastPurchase: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        const customerDoc = customerDocs.docs[0];
        customerId = customerDoc.id;
        existingCustomerData = customerDoc.data();
      }

      const productDataMap = new Map<string, any>();
      productDocs.forEach((doc: any) => {
        if (doc.exists) {
          productDataMap.set(doc.id, doc.data());
        }
      });

      const inventoryDocsMap = new Map<string, any>();
      for (let i = 0; i < inventoryItems.length; i++) {
        const item = inventoryItems[i];
        const invDocs = inventorySnapshots[i];
        if (!invDocs.empty) {
          const doc = invDocs.docs[0];
          inventoryDocsMap.set(`${item.productId}_${item.variantSku}`, {
            id: doc.id,
            data: doc.data(),
            item
          });
        }
      }

      let subtotal = 0;
      let totalTaxAmount = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let isInterstate = false;
      const processedItems: InvoiceItem[] = [];

      for (const item of (payload.items || [])) {
        let unitPrice = item.unitPrice;

        if (item.productId && item.productId !== "temp-id") {
          const productData = productDataMap.get(item.productId);
          if (productData) {
            const variant = productData?.variants?.find((v: any) => v.sku === item.variantSku);
            
            if (isWholesale && variant) {
              const minQty = variant.wholesaleMinQty || 1;
              if (item.quantity < minQty) {
                throw new Error(`Wholesale minimum quantity of ${minQty} not met for item ${item.productName}`);
              }
              if (variant.wholesalePrice && !item.manualPriceOverride) {
                unitPrice = variant.wholesalePrice;
              }
            }
          }
        }

        const lineTax = calculateTax(
          unitPrice * item.quantity,
          taxConfig,
          shopAddress as any,
          customerAddress,
        );

        subtotal += lineTax.taxableValue;
        totalTaxAmount += lineTax.totalTax;
        totalCGST += lineTax.cgst;
        totalSGST += lineTax.sgst;
        totalIGST += lineTax.igst;
        isInterstate = lineTax.isInterstate;

        processedItems.push({
          ...item,
          unitPrice,
          taxRate: taxConfig.gstRate || 0,
          taxAmount: lineTax.totalTax,
          cgst: lineTax.cgst,
          sgst: lineTax.sgst,
          igst: lineTax.igst,
          taxableValue: lineTax.taxableValue,
          total: lineTax.totalAmount,
        });
      }

      const invoiceTotal = subtotal + totalTaxAmount - (payload.discount || 0) - (payload.appliedCredit || 0);

      for (const [key, inv] of inventoryDocsMap.entries()) {
        const currentStock = inv.data.currentStock || 0;
        if (currentStock < inv.item.quantity) {
           throw new Error(`Insufficient stock for ${inv.item.productName}. Available: ${currentStock}`);
        }
      }

      const invoiceId = this.invoiceRepository.generateId();
      const invoiceNumber = payload.invoiceNumber || `INV-${Date.now()}`;

      // ── Batch inventory + product updates ──────────────────────────────────
      // Collect all per-item update payloads first, then dispatch in a single
      // batch call. This eliminates N sequential awaits and N hidden DB reads.
      // Business logic (stock calc, variant update, history fields) is identical.
      const batchUpdates: Array<{
        invId: string;
        newStock: number;
        existingInvData: any;
        productId: string;
        productUpdate: any;
        existingProductData: any;
        historyRecord: any;
      }> = [];

      for (const [key, inv] of inventoryDocsMap.entries()) {
        const currentStock = inv.data.currentStock || 0;
        const newStock = currentStock - inv.item.quantity;

        const historyRecord = {
          shopId,
          branchId: payload.branchId || null,
          productId: inv.item.productId,
          variantSku: inv.item.variantSku || "",
          movementType: "sale",
          changeType: "sale",
          amount: inv.item.quantity,
          previousStock: currentStock,
          newStock,
          quantityChanged: -inv.item.quantity,
          reason: `Sale - Invoice #${invoiceNumber}`,
          referenceId: invoiceId,
          referenceType: "invoice",
          updatedBy: payload.createdBy || "system",
          createdAt: new Date(),
        };

        // Compute productUpdate — identical logic to before
        let productUpdate: any = {};
        let existingProductData: any = null;
        const productDocSnap = productDocs.find((d: any) => d.id === inv.item.productId);
        if (productDocSnap && productDocSnap.exists) {
          existingProductData = productDocSnap.data();
          if (existingProductData?.variants && Array.isArray(existingProductData.variants)) {
            const updatedVariants = existingProductData.variants.map((variant: any) => {
              if (variant.sku === inv.item.variantSku) {
                return { ...variant, stock: newStock };
              }
              return variant;
            });
            productUpdate = { variants: updatedVariants, updatedAt: new Date() };
          } else {
            productUpdate = { stockQuantity: newStock, updatedAt: new Date() };
          }
        }

        batchUpdates.push({
          invId: inv.id,
          newStock,
          existingInvData: inv.data,      // pre-fetched — no extra DB read
          productId: inv.item.productId,
          productUpdate,
          existingProductData,            // pre-fetched — no extra DB read
          historyRecord,
        });
      }

      // Single batched call — runs all writes in parallel for Supabase,
      // buffered in the atomic transaction for Firestore.
      const invoice: Invoice = {
        ...payload,
        id: invoiceId,
        invoiceNumber,
        items: processedItems,
        subtotal,
        taxRate: taxConfig.gstRate || 0,
        taxAmount: totalTaxAmount,
        cgst: totalCGST,
        sgst: totalSGST,
        igst: totalIGST,
        isInterstate,
        total: invoiceTotal,
        appliedCredit: payload.appliedCredit || 0,
        customerId: customerId || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Await all writes concurrently so errors surface and latency is minimized
      const writePromises: Promise<any>[] = [
        this.invoiceRepository.batchUpdateTransactionInventoryAndProducts(transaction, batchUpdates),
        this.invoiceRepository.createTransactionInvoice(transaction, invoice)
      ];

      if (newCustomerData) {
        newCustomerData.totalSpent = invoiceTotal;
        writePromises.push(this.invoiceRepository.createTransactionCustomer(transaction, newCustomerData));
      } else if (existingCustomerData) {
        // Pass existingCustomerData so Supabase skips the internal re-read
        writePromises.push(
          this.invoiceRepository.updateTransactionCustomer(transaction, customerId, {
            name: customerName || existingCustomerData.name || "Walk-in Customer",
            totalOrders: (existingCustomerData.totalOrders || 0) + 1,
            totalSpent: (existingCustomerData.totalSpent || 0) + invoiceTotal,
            lastPurchase: new Date(),
            updatedAt: new Date(),
          }, existingCustomerData)
        );
      }

      await Promise.all(writePromises);

      return invoice;
    });

    const cacheStartTime = Date.now();
    this.invalidateInvoiceCache(shopId, result.id);
    this.cache.deleteByPrefix(`analytics:leaderboard:${shopId}`);
    this.cache.deleteByPrefix(`analytics:collections:invoices:${shopId}`);
    this.cache.deleteByPrefix(`analytics:collections:inventory:${shopId}`);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Invoice Instrumentation] Invalidate caches took ${Date.now() - cacheStartTime}ms`);
      console.log(`[Invoice Instrumentation] createInvoice transaction duration: ${Date.now() - transactionStartTime}ms`);
    }

    void shopCountersService.incrementCounter(shopId, "invoices", 1);
    void costAnalyticsService.invalidateSnapshot("new_invoice");

    // Generate and upload PDF asynchronously
    void this.generateAndUploadPdf(result).catch(err => console.error("Failed to generate/upload invoice PDF:", err));

    return result;
  }

  private async generateAndUploadPdf(invoice: Invoice) {
    try {
      const { pdfGeneratorService } = await import("../../shared/utils/pdf-generator.service");
      const { mediaService } = await import("../media/media.service");
      const { db } = await import("../../config/firebase.config");

      const shopDoc = await db.collection("shops").doc(invoice.shopId).get();
      const shopData = shopDoc.data() as Shop;

      const shopName = shopData?.shopName || "Invoice";
      const shopAddress = shopData?.address || "";
      const shopPhone = shopData?.phone || "";

      const pdfBuffer = await pdfGeneratorService.generateInvoicePdf(invoice, shopName, shopAddress, shopPhone);
      
      const fileName = `INV-${invoice.invoiceNumber}.pdf`;
      const pdfUrl = await mediaService.uploadAdminCloudinaryPdf(pdfBuffer, fileName, invoice.shopId);

      await this.invoiceRepository.updateInvoice(invoice.id, { pdfUrl });
      this.invalidateInvoiceCache(invoice.shopId, invoice.id);
      console.log(`[Invoice PDF] Successfully generated and uploaded for ${invoice.id} -> ${pdfUrl}`);
    } catch (error) {
      console.error(`[Invoice PDF] Error for ${invoice.id}:`, error);
    }
  }

  async getInvoices() {
    return this.invoiceRepository.getInvoices();
  }

  async getInvoice(id: string) {
    const cached = this.cache.get<any>(this.getInvoiceKey(id));
    if (cached) {
      return cached;
    }

    const invoice = await this.invoiceRepository.getInvoice(id);
    if (!invoice) {
      return null;
    }

    this.cache.set(this.getInvoiceKey(id), invoice, this.cacheTtlMs);
    return invoice;
  }

  async updateInvoice(id: string, payload: any) {
    await this.invoiceRepository.updateInvoice(id, payload);
    this.invalidateInvoiceCache(payload.shopId, id);
    void costAnalyticsService.invalidateSnapshot("update_invoice");
  }

  async deleteInvoice(id: string) {
    const existing = (await this.getInvoice(id)) as any;
    await this.invoiceRepository.deleteInvoice(id);
    this.invalidateInvoiceCache(existing?.shopId, id);

    if (existing?.shopId) {
      void shopCountersService.incrementCounter(existing.shopId, "invoices", -1);
      void costAnalyticsService.invalidateSnapshot("delete_invoice");
    }
  }

  async getInvoicesByShop(shopId: string, employeeId?: string, branchId?: string) {
    const cacheKey = this.getShopInvoicesKey(shopId, employeeId, branchId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.invoiceRepository.getInvoicesByShop(shopId, employeeId, branchId);
    return this.cache.set(cacheKey, data, this.cacheTtlMs);
  }

  async getInvoicesByCustomer(customerId: string) {
    return this.invoiceRepository.getInvoicesByCustomer(customerId);
  }
}

export const invoiceService = new InvoiceService();

