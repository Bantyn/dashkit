import { db } from "../../../config/firebase.config";
import { MovementType } from "../../../modules/inventory/inventory.service";
import { IInventoryRepository } from "../interfaces/inventory-repository.interface";

const COLLECTION = "inventory";
const HISTORY_COLLECTION = "inventory_history";
const PRODUCTS_COLLECTION = "products";

export class FirestoreInventoryRepository implements IInventoryRepository {
  generateId(): string {
    return db.collection(COLLECTION).doc().id;
  }

  async getInventoryByShop(shopId: string): Promise<any[]> {
    const snapshot = await db.collection(COLLECTION).where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: any) => doc.data());
  }

  async isMovementDuplicate(
    referenceId: string,
    productId: string,
    variantSku: string,
    movementType: MovementType
  ): Promise<boolean> {
    if (!referenceId) return false;
    const snap = await db
      .collection(HISTORY_COLLECTION)
      .where("referenceId", "==", referenceId)
      .where("productId", "==", productId)
      .where("variantSku", "==", variantSku)
      .where("movementType", "==", movementType)
      .limit(1)
      .get();
    return !snap.empty;
  }

  async getInventoryItem(shopId: string, productId: string, variantSku: string): Promise<any | null> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("productId", "==", productId)
      .where("variantSku", "==", variantSku)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return {
      ref: snapshot.docs[0].ref,
      data: snapshot.docs[0].data(),
    };
  }

  async getProduct(productId: string): Promise<any | null> {
    const docSnap = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
    if (!docSnap.exists) return null;
    return {
      ref: docSnap.ref,
      data: docSnap.data(),
    };
  }

  async saveStockUpdate(params: {
    invId?: string;
    isNew: boolean;
    inventoryData: any;
    historyData: any;
    productId: string;
    productUpdate?: any;
  }): Promise<void> {
    const batch = db.batch();

    // 1. Inventory update/set
    const invRef = params.invId 
      ? db.collection(COLLECTION).doc(params.invId)
      : db.collection(COLLECTION).doc();
    
    if (params.isNew) {
      batch.set(invRef, {
        id: invRef.id,
        ...params.inventoryData,
      });
    } else {
      batch.update(invRef, params.inventoryData);
    }

    // 2. History record set
    const historyRef = db.collection(HISTORY_COLLECTION).doc();
    batch.set(historyRef, {
      id: historyRef.id,
      ...params.historyData,
    });

    // 3. Product variant stock sync
    if (params.productUpdate) {
      const productRef = db.collection(PRODUCTS_COLLECTION).doc(params.productId);
      batch.update(productRef, params.productUpdate);
    }

    await batch.commit();
  }

  async getInventoryHistory(shopId: string, filters?: { date?: string; movementType?: MovementType }): Promise<any[]> {
    if (filters?.date || filters?.movementType) {
      let query: FirebaseFirestore.Query = db
        .collection(HISTORY_COLLECTION)
        .where("shopId", "==", shopId);

      if (filters.movementType) {
        query = query.where("movementType", "==", filters.movementType);
      }
      if (filters.date) {
        const start = new Date(`${filters.date}T00:00:00.000Z`);
        const end = new Date(`${filters.date}T23:59:59.999Z`);
        query = query.where("createdAt", ">=", start).where("createdAt", "<=", end);
      }

      const snapshot = await query.orderBy("createdAt", "desc").limit(500).get();
      return snapshot.docs.map((doc: any) => doc.data());
    }

    const snapshot = await db
      .collection(HISTORY_COLLECTION)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    return snapshot.docs.map((doc: any) => doc.data());
  }

  async getLowStockItems(shopId: string): Promise<any[]> {
    const snapshot = await db.collection(COLLECTION).where("shopId", "==", shopId).get();
    return snapshot.docs.map((doc: any) => doc.data());
  }

  async getProductsByChunk(productIds: string[]): Promise<Map<string, any>> {
    const productsMap = new Map<string, any>();
    if (productIds.length === 0) return productsMap;

    const refs = productIds.map((id) => db.collection(PRODUCTS_COLLECTION).doc(id));
    for (let i = 0; i < refs.length; i += 100) {
      const chunk = refs.slice(i, i + 100);
      const docs = await db.getAll(...chunk);
      docs.forEach((doc: any) => {
        if (doc.exists) {
          productsMap.set(doc.id, doc.data());
        }
      });
    }

    return productsMap;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  }
}
