import { Product } from "../../../modules/product/product.model";

export interface IProductRepository {
  generateId(): string;
  createProduct(product: Product, variants?: any[]): Promise<Product>;
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  updateProduct(id: string, payload: any): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  deleteAllProducts(shopId: string, branchId?: string): Promise<{ deletedCount: number }>;
  getProductsByShop(shopId: string, branchId?: string): Promise<Product[]>;
  incrementViewCount(id: string): Promise<void>;
  
  // Barcode / SKU lookups
  findInventoryBySku(shopId: string, sku: string): Promise<any | null>;
  
  // Bulk import dependencies
  getExistingCategories(shopId: string): Promise<any[]>;
  getExistingBrands(shopId: string): Promise<any[]>;
  saveCategories(categories: any[]): Promise<void>;
  saveBrands(brands: any[]): Promise<void>;
  createProductsAndInventoryInBulk(products: any[], inventoryItems: any[]): Promise<void>;

  // Category CRUD
  generateCategoryId(): string;
  createCategory(category: any): Promise<void>;
  getCategoriesByShop(shopId: string): Promise<any[]>;
  getCategory(id: string): Promise<any | null>;
  updateCategory(id: string, data: any): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Brand CRUD
  generateBrandId(): string;
  createBrand(brand: any): Promise<void>;
  getBrandsByShop(shopId: string): Promise<any[]>;
  getBrand(id: string): Promise<any | null>;
  updateBrand(id: string, data: any): Promise<void>;
  deleteBrand(id: string): Promise<void>;
}
