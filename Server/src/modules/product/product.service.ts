import { CacheService } from "../../infrastructure/cache/cache.service";
import { Product } from "./product.model";
import { logActivity } from "../staff/staff.service";
import { shopCountersService } from "../../infrastructure/cache/shop-counters.service";
import { costAnalyticsService } from "../cost-analytics/cost-analytics.service";
import { IProductRepository } from "../../application/repositories/interfaces/product-repository.interface";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

export class ProductService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private get productRepository(): IProductRepository {
    return RepositoryFactory.getProductRepository();
  }

  private getShopProductsKey(shopId: string, branchId?: string) {
    return `products:shop:${shopId}:${branchId || "all"}`;
  }

  private getProductKey(id: string) {
    return `product:${id}`;
  }

  invalidateShopCache(shopId: string, productId?: string) {
    this.cache.deleteByPrefix(`products:shop:${shopId}`);
    if (productId) {
      this.cache.delete(this.getProductKey(productId));
    }
    this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
    this.cache.deleteByPrefix(`analytics:collections:products:${shopId}`);
    this.cache.deleteByPrefix(`analytics:report:${shopId}`);
    this.cache.deleteByPrefix(`analytics:page:${shopId}`);
  }

  async createProduct(payload: any) {
    const product: Product = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedProduct = await this.productRepository.createProduct(product, product.variants);

    const performerId = payload.createdBy || "admin";
    void logActivity({
      shopId: savedProduct.shopId,
      staffId: performerId,
      action: "Created Product",
      details: `Created new product: ${savedProduct.name}`,
      type: "inventory",
    });

    this.invalidateShopCache(savedProduct.shopId, savedProduct.id);

    void shopCountersService.incrementCounter(savedProduct.shopId, "products", 1);
    void costAnalyticsService.invalidateSnapshot("new_product");

    return savedProduct;
  }

  async getProducts() {
    return this.productRepository.getProducts();
  }

  async getProduct(id: string) {
    const cached = this.cache.get<any>(this.getProductKey(id));
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.getProduct(id);
    if (!product) {
      return null;
    }

    this.cache.set(this.getProductKey(id), product, this.cacheTtlMs);
    return product;
  }

  async updateProduct(id: string, payload: any) {
    await this.productRepository.updateProduct(id, payload);

    const performerId = payload.updatedBy || "admin";
    const productData = await this.getProduct(id);

    if (productData) {
      this.invalidateShopCache(productData.shopId, id);
      void logActivity({
        shopId: productData.shopId,
        staffId: performerId,
        action: "Updated Product",
        details: `Updated product: ${productData.name}`,
        type: "inventory",
      });
    }
  }

  async deleteProduct(id: string) {
    const existing = await this.getProduct(id);
    await this.productRepository.deleteProduct(id);
    if ((existing as any)?.shopId) {
      const shopId = (existing as any).shopId;
      this.invalidateShopCache(shopId, id);
      void shopCountersService.incrementCounter(shopId, "products", -1);
      void costAnalyticsService.invalidateSnapshot("delete_product");
      try {
        const { subscriptionService } = await import("../subscription/subscription.service");
        const { LIMIT_KEYS } = await import("../subscription/subscription.constants");
        void subscriptionService.incrementUsage({
          shopId,
          limitKey: LIMIT_KEYS.PRODUCTS_COUNT,
          incrementBy: -1,
          period: "lifetime",
          subjectType: "shop"
        });
      } catch (e) {
        console.error("Failed to decrement products count usage:", e);
      }
    } else {
      this.cache.delete(this.getProductKey(id));
    }
  }

  async deleteAllProducts(shopId: string, branchId?: string) {
    const result = await this.productRepository.deleteAllProducts(shopId, branchId);
    if (result.deletedCount === 0) return { deletedCount: 0 };

    this.invalidateShopCache(shopId);

    void shopCountersService.incrementCounter(shopId, "products", -result.deletedCount);
    void costAnalyticsService.invalidateSnapshot("delete_all_products");

    try {
      const { subscriptionService } = await import("../subscription/subscription.service");
      const { LIMIT_KEYS } = await import("../subscription/subscription.constants");
      void subscriptionService.incrementUsage({
        shopId,
        limitKey: LIMIT_KEYS.PRODUCTS_COUNT,
        incrementBy: -result.deletedCount,
        period: "lifetime",
        subjectType: "shop"
      });
    } catch (e) {
      console.error("Failed to decrement products count usage on delete all:", e);
    }

    return { deletedCount: result.deletedCount };
  }

  async getProductsByShop(shopId: string, branchId?: string) {
    const cacheKey = this.getShopProductsKey(shopId, branchId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.productRepository.getProductsByShop(shopId, branchId);

    return this.cache.set(
      cacheKey,
      products,
      this.cacheTtlMs,
    );
  }

  async incrementViewCount(id: string) {
    const doc = await this.getProduct(id);
    if (!doc) return null;
    await this.productRepository.incrementViewCount(id);
    this.invalidateShopCache(doc.shopId, id);
  }

  async getProductByBarcode(shopId: string, barcode: string) {
    const cacheKey = `barcode:${shopId}:${barcode}`;
    let productId = this.cache.get<string>(cacheKey);

    if (!productId) {
      const invData = await this.productRepository.findInventoryBySku(shopId, barcode);
      if (invData && invData.productId) {
        productId = invData.productId;
        this.cache.set(cacheKey, productId, this.cacheTtlMs);
      }
    }

    if (productId) {
      const product = await this.getProduct(productId);
      if (product) {
        const hasVariant = product.variants?.some((v: any) => v.sku === barcode);
        if (hasVariant) {
          return product;
        }
      }
    }

    const products = (await this.getProductsByShop(shopId)) as Product[];
    return (
      products.find((product) => product.variants.some((variant) => variant.sku === barcode)) ||
      null
    );
  }

  async bulkImportProducts(shopId: string, rawProducts: any[], staffId?: string, branchId?: string) {
    const groupedProducts = new Map<string, any>();

    rawProducts.forEach((item) => {
      const key = `${item.name}-${item.brand}-${item.subcategory}`.toLowerCase();
      if (!groupedProducts.has(key)) {
        groupedProducts.set(key, {
          shopId,
          branchId,
          name: item.name,
          category: item.category || "men",
          subcategory: item.subcategory || "",
          brand: item.brand || "",
          description: item.description || "",
          variants: [],
          isActive: true,
          showOnStorefront: true,
          tags: [],
          images: [],
          seo: {
            metaTitle: item.name,
            metaDescription: item.description || "",
            slug: item.name.toLowerCase().replace(/ /g, "-"),
          },
        });
      }

      const rawStock = Number(item.stock);
      const stock = isNaN(rawStock) ? 0 : rawStock;

      const rawPrice = Number(item.price);
      const price = isNaN(rawPrice) ? 0 : rawPrice;

      const discountedPrice = item.discountedPrice && !isNaN(Number(item.discountedPrice)) 
        ? Number(item.discountedPrice) 
        : undefined;

      const wholesalePrice = item.wholesalePrice && !isNaN(Number(item.wholesalePrice)) 
        ? Number(item.wholesalePrice) 
        : undefined;

      const wholesaleMinQty = item.wholesaleMinQty && !isNaN(Number(item.wholesaleMinQty)) 
        ? Number(item.wholesaleMinQty) 
        : undefined;

      groupedProducts.get(key).variants.push({
        sku: item.barcode ? String(item.barcode).trim() : "",
        size: item.size,
        color: item.color || "",
        price,
        discountedPrice,
        stock,
        wholesalePrice,
        wholesaleMinQty,
      });
    });

    const uniqueCategories = new Set<string>();
    const uniqueBrands = new Set<string>();

    rawProducts.forEach((item) => {
      if (item.category) uniqueCategories.add(item.category.trim());
      if (item.subcategory) uniqueCategories.add(item.subcategory.trim());
      if (item.brand) uniqueBrands.add(item.brand.trim());
    });

    const existingCats = await this.productRepository.getExistingCategories(shopId);
    const existingBrands = await this.productRepository.getExistingBrands(shopId);
    
    const existingCatNames = new Set(existingCats.map((d: any) => d.name.toLowerCase()));
    const existingBrandNames = new Set(existingBrands.map((d: any) => d.name.toLowerCase()));
    
    const catsToSave = [];
    for (const cat of uniqueCategories) {
      if (cat && !existingCatNames.has(cat.toLowerCase())) {
        catsToSave.push({
          shopId,
          name: cat,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        existingCatNames.add(cat.toLowerCase());
      }
    }
    await this.productRepository.saveCategories(catsToSave);
    
    const brandsToSave = [];
    for (const brand of uniqueBrands) {
      if (brand && !existingBrandNames.has(brand.toLowerCase())) {
        brandsToSave.push({
          shopId,
          name: brand,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        existingBrandNames.add(brand.toLowerCase());
      }
    }
    await this.productRepository.saveBrands(brandsToSave);

    const results = [];
    const productsToCreate: any[] = [];
    const inventoryItemsToCreate: any[] = [];

    for (const product of groupedProducts.values()) {
      const generatedId = this.productRepository.generateId();
      product.id = generatedId;
      product.createdAt = new Date();
      product.updatedAt = new Date();

      productsToCreate.push(product);

      product.variants.forEach((variant: any) => {
        inventoryItemsToCreate.push({
          id: this.productRepository.generateId(),
          shopId: product.shopId,
          branchId: product.branchId,
          productId: product.id,
          variantSku: variant.sku,
          currentStock: variant.stock,
          lowStockThreshold: 10,
          updatedAt: new Date(),
        });
      });

      results.push(product);
    }

    await this.productRepository.createProductsAndInventoryInBulk(productsToCreate, inventoryItemsToCreate);

    void logActivity({
      shopId,
      staffId: staffId || "admin",
      action: "Bulk Import",
      details: `Imported ${results.length} products via CSV`,
      type: "inventory",
    });

    this.invalidateShopCache(shopId);

    return { count: results.length };
  }
}

export const productService = new ProductService();

