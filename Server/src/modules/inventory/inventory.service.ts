import { CacheService } from "../../infrastructure/cache/cache.service";
import { Inventory } from "./inventory.model";
import { createNotification } from "../notification/notification.controller";
import { logActivity } from "../staff/staff.service";
import { productService } from "../product/product.service";
import { IInventoryRepository } from "../../application/repositories/interfaces/inventory-repository.interface";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

export type MovementType =
  | "opening_stock"
  | "purchase"
  | "purchase_return"
  | "sale"
  | "sales_return"
  | "manual_adjustment"
  | "closing_adjustment"
  | "stock_transfer_in"
  | "stock_transfer_out"
  | "damage"
  | "stock_correction";

export class InventoryService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 2 * 60 * 1000;

  private get inventoryRepository(): IInventoryRepository {
    return RepositoryFactory.getInventoryRepository();
  }

  private getInventoryKey(shopId: string) {
    return `inventory:list:${shopId}`;
  }

  private getHistoryKey(shopId: string) {
    return `inventory:history:${shopId}`;
  }

  private getLowStockKey(shopId: string) {
    return `inventory:low-stock:${shopId}`;
  }

  invalidateShopCache(shopId: string) {
    this.cache.delete(this.getInventoryKey(shopId));
    this.cache.delete(this.getHistoryKey(shopId));
    this.cache.delete(this.getLowStockKey(shopId));
    this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
    this.cache.deleteByPrefix(`analytics:collections:inventory:${shopId}`);
    this.cache.deleteByPrefix(`analytics:report:${shopId}`);
    this.cache.deleteByPrefix(`analytics:page:${shopId}`);
  }

  async getInventory(shopId: string) {
    const cacheKey = this.getInventoryKey(shopId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const inventoryItems = await this.inventoryRepository.getInventoryByShop(shopId);

    const productsList = await productService.getProductsByShop(shopId);
    const productsMap = new Map();
    productsList.forEach((prod: any) => {
      productsMap.set(prod.id, prod);
    });

    return this.cache.set(
      cacheKey,
      inventoryItems.map((item: any) => ({
        ...item,
        productName: productsMap.get(item.productId)?.name || "Unknown Product",
      })),
      this.cacheTtlMs,
    );
  }

  async isMovementDuplicate(
    referenceId: string,
    productId: string,
    variantSku: string,
    movementType: MovementType
  ): Promise<boolean> {
    return this.inventoryRepository.isMovementDuplicate(referenceId, productId, variantSku, movementType);
  }

  async updateStock(payload: {
    productId: string;
    shopId: string;
    newStock: number;
    reason?: string;
    changeType?: string;
    movementType?: MovementType;
    amount?: number;
    variantSku?: string;
    updatedBy?: string;
    referenceId?: string;
    referenceType?: string;
    branchId?: string;
  }) {
    const {
      productId,
      shopId,
      newStock,
      reason = "Manual Update",
      changeType = "set",
      movementType = "manual_adjustment",
      amount = 0,
      variantSku = "",
      updatedBy = "system",
      referenceId,
      referenceType,
      branchId,
    } = payload;

    const startTime = Date.now();

    if (referenceId) {
      const isDuplicate = await this.isMovementDuplicate(referenceId, productId, variantSku, movementType);
      if (isDuplicate) {
        console.warn(
          `[Inventory] Duplicate movement blocked: referenceId=${referenceId} product=${productId} sku=${variantSku} type=${movementType}`
        );
        return;
      }
    }

    const [invDoc, productDoc] = await Promise.all([
      this.inventoryRepository.getInventoryItem(shopId, productId, variantSku),
      this.inventoryRepository.getProduct(productId),
    ]);

    let previousStock = 0;
    let invId: string | undefined;
    let isNew = false;

    if (!invDoc) {
      isNew = true;
      invId = this.inventoryRepository.generateId();
    } else {
      const invData = invDoc.data || invDoc;
      previousStock = invData.currentStock;
      invId = invData.id;
    }

    const inventoryData: any = {
      productId,
      shopId,
      variantSku,
      currentStock: newStock,
      lowStockThreshold: 10,
      updatedAt: new Date(),
    };

    if (isNew) {
      inventoryData.id = invId;
    } else {
      const invData = invDoc.data || invDoc;
      if (newStock <= (invData.lowStockThreshold || 10)) {
        createNotification({
          shopId,
          title: "Low Stock Alert",
          message: `Product ${productId} (${variantSku}) is low on stock (${newStock} units left).`,
          type: "low_stock",
        }).catch((e) => console.error("Low stock notification failed:", e));
      }
    }

    const historyData = {
      shopId,
      branchId: branchId || null,
      productId,
      variantSku,
      movementType,
      changeType,
      amount,
      previousStock,
      newStock,
      quantityChanged: newStock - previousStock,
      reason,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      updatedBy,
      createdAt: new Date(),
    };

    let productUpdate: any;
    if (productDoc) {
      const productData = productDoc.data || productDoc;
      if (productData?.variants && Array.isArray(productData.variants)) {
        const updatedVariants = productData.variants.map((variant: any) => {
          if (variant.sku === variantSku) {
            return { ...variant, stock: newStock };
          }
          return variant;
        });
        productUpdate = {
          variants: updatedVariants,
          updatedAt: new Date(),
        };
      } else if (!variantSku || variantSku === "") {
        productUpdate = {
          stockQuantity: newStock,
          updatedAt: new Date(),
        };
      }
    }

    await this.inventoryRepository.saveStockUpdate({
      invId,
      isNew,
      inventoryData,
      historyData,
      productId,
      productUpdate,
    });

    logActivity({
      shopId,
      staffId: updatedBy,
      action: "Stock Updated",
      details: `[${movementType}] ${reason}: ${productId} (${variantSku}) ${previousStock} → ${newStock} (Δ${newStock - previousStock})`,
      type: "inventory",
    }).catch((e) => console.error("Activity log failed:", e));

    this.invalidateShopCache(shopId);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Inventory] updateStock took ${Date.now() - startTime}ms | ${movementType} | ${productId} | ${previousStock}→${newStock}`);
    }
  }

  async getInventoryHistory(shopId: string, opts?: { date?: string; movementType?: MovementType }) {
    if (opts?.date || opts?.movementType) {
      return this.inventoryRepository.getInventoryHistory(shopId, opts);
    }

    const cacheKey = this.getHistoryKey(shopId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const history = await this.inventoryRepository.getInventoryHistory(shopId);
    const productIds = [...new Set(history.map((record: any) => record.productId).filter(Boolean))];

    const productsMap = new Map<string, string>();
    if (productIds.length > 0) {
      await Promise.all(
        productIds.map(async (id: any) => {
          try {
            const product = await productService.getProduct(id);
            if (product) {
              productsMap.set(id, product.name || "Unknown");
            }
          } catch (err) {
            console.warn(`Failed to fetch product ${id} for inventory history:`, err);
          }
        })
      );
    }

    return this.cache.set(
      cacheKey,
      history.map((record: any) => ({
        ...record,
        productName: productsMap.get(record.productId) || record.productName || record.productId,
      })),
      this.cacheTtlMs,
    );
  }

  async calculateVariance(shopId: string, date: string): Promise<any[]> {
    const history = await this.getInventoryHistory(shopId, { date });

    const movementsMap = new Map<string, any>();

    for (const record of history) {
      const key = `${record.productId}__${record.variantSku || ""}`;
      if (!movementsMap.has(key)) {
        movementsMap.set(key, {
          productId: record.productId,
          variantSku: record.variantSku,
          opening: 0,
          purchases: 0,
          purchaseReturns: 0,
          sales: 0,
          salesReturns: 0,
          damage: 0,
          transferIn: 0,
          transferOut: 0,
          adjustments: 0,
        });
      }

      const entry = movementsMap.get(key);
      const qty = Math.abs(record.quantityChanged || record.amount || 0);

      switch (record.movementType as MovementType) {
        case "opening_stock":     entry.opening += qty; break;
        case "purchase":          entry.purchases += qty; break;
        case "purchase_return":   entry.purchaseReturns += qty; break;
        case "sale":              entry.sales += qty; break;
        case "sales_return":      entry.salesReturns += qty; break;
        case "damage":            entry.damage += qty; break;
        case "stock_transfer_in": entry.transferIn += qty; break;
        case "stock_transfer_out":entry.transferOut += qty; break;
        case "manual_adjustment":
        case "closing_adjustment":
        case "stock_correction":  entry.adjustments += (record.quantityChanged || 0); break;
      }
    }

    const inventoryItems = await this.inventoryRepository.getInventoryByShop(shopId);
    const currentStockMap = new Map<string, number>();
    inventoryItems.forEach((d: any) => {
      currentStockMap.set(`${d.productId}__${d.variantSku || ""}`, d.currentStock || 0);
    });

    return Array.from(movementsMap.values()).map((entry) => {
      const expectedClosing =
        entry.opening +
        entry.purchases +
        entry.salesReturns +
        entry.transferIn -
        entry.sales -
        entry.purchaseReturns -
        entry.damage -
        entry.transferOut +
        entry.adjustments;

      const actualStock = currentStockMap.get(`${entry.productId}__${entry.variantSku || ""}`) ?? 0;
      const variance = actualStock - expectedClosing;

      return {
        ...entry,
        expectedClosing,
        actualStock,
        variance,
      };
    });
  }

  async getLowStock(shopId: string) {
    const cacheKey = this.getLowStockKey(shopId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const allItems = await this.inventoryRepository.getLowStockItems(shopId);
    const lowStockItems = allItems.filter((item: Inventory) => item.currentStock <= item.lowStockThreshold);
    const productIds = [...new Set(lowStockItems.map((item: Inventory) => item.productId).filter(Boolean))];
    
    const productsMap = await this.inventoryRepository.getProductsByChunk(productIds);

    return this.cache.set(
      cacheKey,
      lowStockItems.map((item: Inventory) => ({
        ...item,
        productName: productsMap.get(item.productId)?.name || item.productId,
      })),
      this.cacheTtlMs,
    );
  }

  async deleteInventoryItem(id: string, shopId: string): Promise<void> {
    await this.inventoryRepository.deleteInventoryItem(id);
    this.invalidateShopCache(shopId);
  }
}

export const inventoryService = new InventoryService();
