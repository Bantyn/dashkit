import { MovementType } from "../../../modules/inventory/inventory.service";
import { IInventoryRepository } from "../interfaces/inventory-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class MongoInventoryRepository implements IInventoryRepository {
  generateId(): string {
    throw new NotImplementedError("MongoInventoryRepository.generateId is not implemented.");
  }
  async getInventoryByShop(_shopId: string): Promise<any[]> {
    throw new NotImplementedError("MongoInventoryRepository.getInventoryByShop is not implemented.");
  }
  async isMovementDuplicate(_referenceId: string, _productId: string, _variantSku: string, _movementType: MovementType): Promise<boolean> {
    throw new NotImplementedError("MongoInventoryRepository.isMovementDuplicate is not implemented.");
  }
  async getInventoryItem(_shopId: string, _productId: string, _variantSku: string): Promise<any | null> {
    throw new NotImplementedError("MongoInventoryRepository.getInventoryItem is not implemented.");
  }
  async getProduct(_productId: string): Promise<any | null> {
    throw new NotImplementedError("MongoInventoryRepository.getProduct is not implemented.");
  }
  async saveStockUpdate(_params: {
    invId?: string;
    isNew: boolean;
    inventoryData: any;
    historyData: any;
    productId: string;
    productUpdate?: any;
  }): Promise<void> {
    throw new NotImplementedError("MongoInventoryRepository.saveStockUpdate is not implemented.");
  }
  async getInventoryHistory(_shopId: string, _filters?: { date?: string; movementType?: MovementType }): Promise<any[]> {
    throw new NotImplementedError("MongoInventoryRepository.getInventoryHistory is not implemented.");
  }
  async getLowStockItems(_shopId: string): Promise<any[]> {
    throw new NotImplementedError("MongoInventoryRepository.getLowStockItems is not implemented.");
  }
  async getProductsByChunk(_productIds: string[]): Promise<Map<string, any>> {
    throw new NotImplementedError("MongoInventoryRepository.getProductsByChunk is not implemented.");
  }
  async deleteInventoryItem(_id: string): Promise<void> {
    throw new NotImplementedError("MongoInventoryRepository.deleteInventoryItem is not implemented.");
  }
}
