import { MovementType } from "../../../modules/inventory/inventory.service";

export interface IInventoryRepository {
  generateId(): string;
  getInventoryByShop(shopId: string): Promise<any[]>;
  isMovementDuplicate(referenceId: string, productId: string, variantSku: string, movementType: MovementType): Promise<boolean>;
  getInventoryItem(shopId: string, productId: string, variantSku: string): Promise<any | null>;
  getProduct(productId: string): Promise<any | null>;
  saveStockUpdate(params: {
    invId?: string;
    isNew: boolean;
    inventoryData: any;
    historyData: any;
    productId: string;
    productUpdate?: any;
  }): Promise<void>;
  getInventoryHistory(shopId: string, filters?: { date?: string; movementType?: MovementType }): Promise<any[]>;
  getLowStockItems(shopId: string): Promise<any[]>;
  getProductsByChunk(productIds: string[]): Promise<Map<string, any>>;
  deleteInventoryItem(id: string): Promise<void>;
}
