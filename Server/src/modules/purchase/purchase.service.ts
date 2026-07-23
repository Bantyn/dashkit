import { inventoryService } from "../inventory/inventory.service";
import { CacheService } from "../../infrastructure/cache/cache.service";
import {
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierPayment,
  PurchaseReturn,
} from "./purchase.model";
import { IPurchaseRepository } from "../../application/repositories/interfaces/purchase-repository.interface";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

export class PurchaseService {
  private readonly cache = new CacheService();
  private readonly paymentsCacheTtlMs = 5 * 60 * 1000;

  private get purchaseRepository(): IPurchaseRepository {
    return RepositoryFactory.getPurchaseRepository();
  }

  private getPaymentsCacheKey(shopId: string) {
    return `purchase:payments:${shopId}`;
  }

  // ─── Suppliers ─────────────────────────────────────────────────────────────
  async getSuppliers(shopId: string): Promise<Supplier[]> {
    return this.purchaseRepository.getSuppliers(shopId);
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const generatedId = this.purchaseRepository.generateSupplierId();
    const supplier: Supplier = {
      ...data,
      id: generatedId,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Supplier;
    await this.purchaseRepository.createSupplier(supplier);
    return supplier;
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<void> {
    await this.purchaseRepository.updateSupplier(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.purchaseRepository.deleteSupplier(id);
  }

  // ─── Purchase Orders ────────────────────────────────────────────────────────
  async getPurchaseOrders(shopId: string): Promise<PurchaseOrder[]> {
    return this.purchaseRepository.getPurchaseOrders(shopId);
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    return this.purchaseRepository.getPurchaseOrder(id);
  }

  async createPurchaseOrder(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const generatedId = this.purchaseRepository.generatePurchaseOrderId();
    
    let poNumber = data.poNumber;
    if (!poNumber && data.shopId) {
      const count = await this.purchaseRepository.getPurchaseOrdersCount(data.shopId);
      poNumber = `PO-${1001 + count}`;
    }

    const order: PurchaseOrder = {
      ...data,
      id: generatedId,
      poNumber,
      paidAmount: data.paidAmount || 0,
      status: data.status || "ordered",
      paymentStatus: data.paymentStatus || "unpaid",
      orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PurchaseOrder;

    await this.purchaseRepository.createPurchaseOrder(order);
    return order;
  }

  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<void> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.orderDate) updateData.orderDate = new Date(data.orderDate);
    await this.purchaseRepository.updatePurchaseOrder(id, updateData);
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await this.purchaseRepository.deletePurchaseOrder(id);
  }

  // ─── Goods Received (GRN) ──────────────────────────────────────────────────
  async getGoodsReceived(shopId: string): Promise<GoodsReceivedNote[]> {
    return this.purchaseRepository.getGoodsReceived(shopId);
  }

  async createGoodsReceived(data: Partial<GoodsReceivedNote>): Promise<GoodsReceivedNote> {
    const generatedId = this.purchaseRepository.generateGoodsReceivedId();

    let grnNumber = data.grnNumber;
    if (!grnNumber && data.shopId) {
      const count = await this.purchaseRepository.getGoodsReceivedCount(data.shopId);
      grnNumber = `GRN-${1001 + count}`;
    }

    const grn: GoodsReceivedNote = {
      ...data,
      id: generatedId,
      grnNumber,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
      createdAt: new Date(),
    } as GoodsReceivedNote;

    await this.purchaseRepository.createGoodsReceived(grn);

    // Business Logic: Adjust Inventory Stock & Update PO status
    if (grn.items && grn.items.length > 0) {
      for (const item of grn.items) {
        if (!item.receivedQty || item.receivedQty <= 0) continue;

        const currentStock = await this.purchaseRepository.getInventoryStock(
          grn.shopId,
          item.productId,
          item.variantSku || ""
        );
        const newStock = currentStock + Number(item.receivedQty || 0);

        await inventoryService.updateStock({
          productId: item.productId,
          shopId: grn.shopId,
          newStock,
          reason: `Goods Received (GRN #${grn.grnNumber})`,
          changeType: "addition",
          movementType: "purchase",
          amount: item.receivedQty,
          variantSku: item.variantSku,
          updatedBy: "system",
          referenceId: grn.id,
          referenceType: "grn",
          branchId: (grn as any).branchId,
        });
      }
    }

    // Update corresponding Purchase Order status
    if (grn.purchaseOrderId) {
      const poData = await this.getPurchaseOrder(grn.purchaseOrderId);
      if (poData) {
        let allReceived = true;
        let anyReceived = false;

        for (const poItem of poData.items) {
          const matchingGrnItem = grn.items.find(
            (gi) => gi.productId === poItem.productId && gi.variantSku === poItem.variantSku
          );
          
          const grnQty = matchingGrnItem ? matchingGrnItem.receivedQty : 0;
          if (grnQty > 0) {
            anyReceived = true;
          }
          if (grnQty < poItem.quantity) {
            allReceived = false;
          }
        }

        const newStatus = allReceived ? "received" : (anyReceived ? "partially_received" : "ordered");
        await this.purchaseRepository.updatePurchaseOrder(grn.purchaseOrderId, {
          status: newStatus,
          updatedAt: new Date(),
        });
      }
    }

    return grn;
  }

  // ─── Supplier Payments ─────────────────────────────────────────────────────
  async getSupplierPayments(shopId: string): Promise<SupplierPayment[]> {
    const cacheKey = this.getPaymentsCacheKey(shopId);
    const cached = this.cache.get<SupplierPayment[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const payments = await this.purchaseRepository.getSupplierPayments(shopId);
    const sortedPayments = payments.sort((a: SupplierPayment, b: SupplierPayment) => {
      const tA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const tB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });

    return this.cache.set(cacheKey, sortedPayments, this.paymentsCacheTtlMs);
  }

  async createSupplierPayment(data: Partial<SupplierPayment>): Promise<SupplierPayment> {
    const generatedId = this.purchaseRepository.generateSupplierPaymentId();

    let paymentNumber = data.paymentNumber;
    if (!paymentNumber && data.shopId) {
      const count = await this.purchaseRepository.getSupplierPaymentsCount(data.shopId);
      paymentNumber = `SP-${1001 + count}`;
    }

    const payment: SupplierPayment = {
      ...data,
      id: generatedId,
      paymentNumber,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      createdAt: new Date(),
    } as SupplierPayment;

    await this.purchaseRepository.createSupplierPayment(payment);

    if (data.shopId) {
      this.cache.delete(this.getPaymentsCacheKey(data.shopId));
    }

    // Business Logic: Update PO paid amount & paymentStatus
    if (payment.purchaseOrderId) {
      const poData = await this.getPurchaseOrder(payment.purchaseOrderId);
      if (poData) {
        const newPaidAmount = (poData.paidAmount || 0) + payment.amount;
        const newPaymentStatus =
          newPaidAmount >= poData.totalAmount
            ? "paid"
            : newPaidAmount > 0
            ? "partial"
            : "unpaid";

        await this.purchaseRepository.updatePurchaseOrder(payment.purchaseOrderId, {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date(),
        });
      }
    }

    return payment;
  }

  // ─── Purchase Returns ──────────────────────────────────────────────────────
  async getPurchaseReturns(shopId: string): Promise<PurchaseReturn[]> {
    return this.purchaseRepository.getPurchaseReturns(shopId);
  }

  async createPurchaseReturn(data: Partial<PurchaseReturn>): Promise<PurchaseReturn> {
    const generatedId = this.purchaseRepository.generatePurchaseReturnId();

    let returnNumber = data.returnNumber;
    if (!returnNumber && data.shopId) {
      const count = await this.purchaseRepository.getPurchaseReturnsCount(data.shopId);
      returnNumber = `PR-${1001 + count}`;
    }

    const prReturn: PurchaseReturn = {
      ...data,
      id: generatedId,
      returnNumber,
      returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
      createdAt: new Date(),
    } as PurchaseReturn;

    await this.purchaseRepository.createPurchaseReturn(prReturn);

    // Business Logic: Decrement inventory stock
    if (prReturn.items && prReturn.items.length > 0) {
      for (const item of prReturn.items) {
        if (!item.returnQty || item.returnQty <= 0) continue;

        const currentStock = await this.purchaseRepository.getInventoryStock(
          prReturn.shopId,
          item.productId,
          item.variantSku || ""
        );
        const newStock = Math.max(0, currentStock - item.returnQty);

        await inventoryService.updateStock({
          productId: item.productId,
          shopId: prReturn.shopId,
          newStock,
          reason: `Purchase Return (PR #${prReturn.returnNumber})`,
          changeType: "subtraction",
          movementType: "purchase_return",
          amount: item.returnQty,
          variantSku: item.variantSku,
          updatedBy: "system",
          referenceId: prReturn.id,
          referenceType: "purchase_return",
          branchId: (prReturn as any).branchId,
        });
      }
    }

    return prReturn;
  }
}

export const purchaseService = new PurchaseService();
