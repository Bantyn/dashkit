import { db } from "../../../config/firebase.config";
import { Product } from "../../../modules/product/product.model";
import { IProductRepository } from "../interfaces/product-repository.interface";

const COLLECTION = "products";

export class FirestoreProductRepository implements IProductRepository {
  generateId(): string {
    return db.collection(COLLECTION).doc().id;
  }

  async createProduct(product: Product, variants?: any[]): Promise<Product> {
    const ref = db.collection(COLLECTION).doc(product.id || undefined);
    product.id = ref.id;
    await ref.set(product);

    if (variants && variants.length > 0) {
      const batch = db.batch();
      variants.forEach((variant) => {
        const invRef = db.collection("inventory").doc();
        batch.set(invRef, {
          id: invRef.id,
          shopId: product.shopId,
          productId: product.id,
          variantSku: variant.sku || "",
          currentStock: variant.stock || 0,
          lowStockThreshold: 10,
          updatedAt: new Date(),
        });
      });
      await batch.commit();
    }

    return product;
  }

  async getProducts(): Promise<Product[]> {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs.map((doc: any) => doc.data() as Product);
  }

  async getProduct(id: string): Promise<Product | null> {
    const docSnap = await db.collection(COLLECTION).doc(id).get();
    if (!docSnap.exists) {
      return null;
    }
    return docSnap.data() as Product;
  }

  async updateProduct(id: string, payload: any): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      ...payload,
      updatedAt: new Date(),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  }

  async deleteAllProducts(shopId: string, branchId?: string): Promise<{ deletedCount: number }> {
    let query: any = db.collection(COLLECTION).where("shopId", "==", shopId);
    if (branchId) {
      query = query.where("branchId", "==", branchId);
    }
    const snapshot = await query.get();
    if (snapshot.empty) return { deletedCount: 0 };

    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    let invQuery: any = db.collection("inventory").where("shopId", "==", shopId);
    if (branchId) {
      invQuery = invQuery.where("branchId", "==", branchId);
    }
    const invSnapshot = await invQuery.get();
    invSnapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { deletedCount: snapshot.size };
  }

  async getProductsByShop(shopId: string, branchId?: string): Promise<Product[]> {
    const query = db.collection(COLLECTION).where("shopId", "==", shopId);
    const snapshot = await query.get();
    const allProducts = snapshot.docs.map((doc: any) => doc.data() as Product);

    if (!branchId || branchId === "parent") {
      return allProducts;
    }

    return allProducts.filter((p: any) => {
      if (p.branchId === branchId || p.branchId === "all") return true;
      if (Array.isArray(p.branchIds) && p.branchIds.includes(branchId)) return true;
      return false;
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    const productRef = db.collection(COLLECTION).doc(id);
    const doc = await productRef.get();
    if (!doc.exists) return;
    const currentViews = doc.data()?.viewCount || 0;
    await productRef.update({
      viewCount: currentViews + 1,
      updatedAt: new Date(),
    });
  }

  async findInventoryBySku(shopId: string, sku: string): Promise<any | null> {
    const invSnapshot = await db
      .collection("inventory")
      .where("shopId", "==", shopId)
      .where("variantSku", "==", sku)
      .limit(1)
      .get();

    if (invSnapshot.empty) return null;
    return invSnapshot.docs[0].data();
  }

  async getExistingCategories(shopId: string): Promise<any[]> {
    const snapshot = await db.collection("categories").where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: any) => doc.data());
  }

  async getExistingBrands(shopId: string): Promise<any[]> {
    const snapshot = await db.collection("brands").where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: any) => doc.data());
  }

  async saveCategories(categories: any[]): Promise<void> {
    if (categories.length === 0) return;
    const batch = db.batch();
    categories.forEach((cat) => {
      const ref = db.collection("categories").doc(cat.id || undefined);
      cat.id = ref.id;
      batch.set(ref, cat);
    });
    await batch.commit();
  }

  async saveBrands(brands: any[]): Promise<void> {
    if (brands.length === 0) return;
    const batch = db.batch();
    brands.forEach((brand) => {
      const ref = db.collection("brands").doc(brand.id || undefined);
      brand.id = ref.id;
      batch.set(ref, brand);
    });
    await batch.commit();
  }

  async createProductsAndInventoryInBulk(products: any[], inventoryItems: any[]): Promise<void> {
    const productBatch = db.batch();
    const invBatch = db.batch();

    products.forEach((p) => {
      const ref = db.collection(COLLECTION).doc(p.id || undefined);
      p.id = ref.id;
      productBatch.set(ref, p);
    });

    inventoryItems.forEach((inv) => {
      const ref = db.collection("inventory").doc(inv.id || undefined);
      inv.id = ref.id;
      invBatch.set(ref, inv);
    });

    await productBatch.commit();
    await invBatch.commit();
  }

  // Category CRUD
  generateCategoryId(): string {
    return db.collection("categories").doc().id;
  }

  async createCategory(category: any): Promise<void> {
    await db.collection("categories").doc(category.id).set(category);
  }

  async getCategoriesByShop(shopId: string): Promise<any[]> {
    const snapshot = await db.collection("categories").where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: any) => doc.data());
  }

  async getCategory(id: string): Promise<any | null> {
    const docSnap = await db.collection("categories").doc(id).get();
    if (!docSnap.exists) return null;
    return docSnap.data();
  }

  async updateCategory(id: string, data: any): Promise<void> {
    await db.collection("categories").doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await db.collection("categories").doc(id).delete();
  }

  // Brand CRUD
  generateBrandId(): string {
    return db.collection("brands").doc().id;
  }

  async createBrand(brand: any): Promise<void> {
    await db.collection("brands").doc(brand.id).set(brand);
  }

  async getBrandsByShop(shopId: string): Promise<any[]> {
    const snapshot = await db.collection("brands").where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: any) => doc.data());
  }

  async getBrand(id: string): Promise<any | null> {
    const docSnap = await db.collection("brands").doc(id).get();
    if (!docSnap.exists) return null;
    return docSnap.data();
  }

  async updateBrand(id: string, data: any): Promise<void> {
    await db.collection("brands").doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async deleteBrand(id: string): Promise<void> {
    await db.collection("brands").doc(id).delete();
  }
}
