import { Product } from "../../../modules/product/product.model";
import { IProductRepository } from "../interfaces/product-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class SqlServerProductRepository implements IProductRepository {
  generateId(): string {
    throw new NotImplementedError("SqlServerProductRepository.generateId is not implemented.");
  }

  async createProduct(_product: Product, _variants?: any[]): Promise<Product> {
    throw new NotImplementedError("SqlServerProductRepository.createProduct is not implemented.");
  }
  async getProducts(): Promise<Product[]> {
    throw new NotImplementedError("SqlServerProductRepository.getProducts is not implemented.");
  }
  async getProduct(_id: string): Promise<Product | null> {
    throw new NotImplementedError("SqlServerProductRepository.getProduct is not implemented.");
  }
  async updateProduct(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.updateProduct is not implemented.");
  }
  async deleteProduct(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.deleteProduct is not implemented.");
  }
  async deleteAllProducts(_shopId: string, _branchId?: string): Promise<{ deletedCount: number }> {
    throw new NotImplementedError("SqlServerProductRepository.deleteAllProducts is not implemented.");
  }
  async getProductsByShop(_shopId: string, _branchId?: string): Promise<Product[]> {
    throw new NotImplementedError("SqlServerProductRepository.getProductsByShop is not implemented.");
  }
  async incrementViewCount(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.incrementViewCount is not implemented.");
  }
  async findInventoryBySku(_shopId: string, _sku: string): Promise<any | null> {
    throw new NotImplementedError("SqlServerProductRepository.findInventoryBySku is not implemented.");
  }
  async getExistingCategories(_shopId: string): Promise<any[]> {
    throw new NotImplementedError("SqlServerProductRepository.getExistingCategories is not implemented.");
  }
  async getExistingBrands(_shopId: string): Promise<any[]> {
    throw new NotImplementedError("SqlServerProductRepository.getExistingBrands is not implemented.");
  }
  async saveCategories(_categories: any[]): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.saveCategories is not implemented.");
  }
  async saveBrands(_brands: any[]): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.saveBrands is not implemented.");
  }
  async createProductsAndInventoryInBulk(_products: any[], _inventoryItems: any[]): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.createProductsAndInventoryInBulk is not implemented.");
  }

  // Category CRUD
  generateCategoryId(): string {
    throw new NotImplementedError("SqlServerProductRepository.generateCategoryId is not implemented.");
  }
  async createCategory(_category: any): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.createCategory is not implemented.");
  }
  async getCategoriesByShop(_shopId: string): Promise<any[]> {
    throw new NotImplementedError("SqlServerProductRepository.getCategoriesByShop is not implemented.");
  }
  async getCategory(_id: string): Promise<any | null> {
    throw new NotImplementedError("SqlServerProductRepository.getCategory is not implemented.");
  }
  async updateCategory(_id: string, _data: any): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.updateCategory is not implemented.");
  }
  async deleteCategory(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.deleteCategory is not implemented.");
  }

  // Brand CRUD
  generateBrandId(): string {
    throw new NotImplementedError("SqlServerProductRepository.generateBrandId is not implemented.");
  }
  async createBrand(_brand: any): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.createBrand is not implemented.");
  }
  async getBrandsByShop(_shopId: string): Promise<any[]> {
    throw new NotImplementedError("SqlServerProductRepository.getBrandsByShop is not implemented.");
  }
  async getBrand(_id: string): Promise<any | null> {
    throw new NotImplementedError("SqlServerProductRepository.getBrand is not implemented.");
  }
  async updateBrand(_id: string, _data: any): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.updateBrand is not implemented.");
  }
  async deleteBrand(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerProductRepository.deleteBrand is not implemented.");
  }
}
