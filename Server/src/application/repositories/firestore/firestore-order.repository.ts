import { db } from "../../../config/firebase.config";
import { Order } from "../../../modules/order/order.model";
import { IOrderRepository } from "../interfaces/order-repository.interface";

const COLLECTION = "orders";
const PRODUCTS_COLLECTION = "products";
const INVENTORY_COLLECTION = "inventory";
const HISTORY_COLLECTION = "inventory_history";
const SHOPS_COLLECTION = "shops";

export class FirestoreOrderRepository implements IOrderRepository {
  
  generateId(): string {
    return db.collection(COLLECTION).doc().id;
  }

  async getOrders(): Promise<Order[]> {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Order);
  }

  async getOrder(id: string): Promise<Order | null> {
    const docSnap = await db.collection(COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Order;
  }

  async createOrder(order: Order): Promise<void> {
    const ref = db.collection(COLLECTION).doc(order.id);
    await ref.set(order);
  }

  async updateOrder(id: string, payload: any): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      ...payload,
      updatedAt: new Date(),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  }

  async getOrdersByShop(shopId: string, branchId?: string): Promise<Order[]> {
    let query: any = db.collection(COLLECTION).where("shopId", "==", shopId);
    if (branchId && branchId !== "parent") {
      query = query.where("branchId", "==", branchId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Order);
  }

  async getMyOrders(customerId: string, shopId: string): Promise<Order[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("customerId", "==", customerId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Order);
  }

  async getMyOrdersByEmail(email: string, shopId: string): Promise<Order[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("customerEmail", "==", email.toLowerCase())
      .get();
    return snapshot.docs.map((doc: any) => doc.data() as Order);
  }

  async getShop(shopId: string): Promise<any | null> {
    const docSnap = await db.collection(SHOPS_COLLECTION).doc(shopId).get();
    if (!docSnap.exists) return null;
    return docSnap.data();
  }

  async commitOrderStockUpdates(shopId: string, orderId: string, items: any[]): Promise<void> {
    const batch = db.batch();
    const itemUpdates = await Promise.all(
      items
        .filter((item) => item.productId && item.productId !== "temp-id")
        .map(async (item) => {
          const productRef = db.collection(PRODUCTS_COLLECTION).doc(item.productId);
          const [invQuery, productDoc] = await Promise.all([
            db
              .collection(INVENTORY_COLLECTION)
              .where("shopId", "==", shopId)
              .where("productId", "==", item.productId)
              .where("variantSku", "==", item.variantSku || "")
              .limit(1)
              .get(),
            productRef.get(),
          ]);

          return { item, invQuery, productRef, productDoc };
        }),
    );

    for (const { item, invQuery, productRef, productDoc } of itemUpdates) {
      if (!invQuery.empty) {
        const invDoc = invQuery.docs[0];
        const currentStock = invDoc.data().currentStock || 0;
        const newStock = currentStock - item.quantity;

        batch.update(invDoc.ref, {
          currentStock: newStock,
          updatedAt: new Date(),
        });

        const historyRef = db.collection(HISTORY_COLLECTION).doc();
        batch.set(historyRef, {
          id: historyRef.id,
          shopId,
          productId: item.productId,
          variantSku: item.variantSku || "",
          changeType: "sale",
          amount: item.quantity,
          previousStock: currentStock,
          newStock: newStock,
          reason: `Sale - Online Order #${orderId.slice(-8).toUpperCase()}`,
          createdAt: new Date(),
        });
      }

      if (productDoc.exists) {
        const productData = productDoc.data();
        if (productData && productData.variants) {
          const updatedVariants = productData.variants.map((variant: any) => {
            if (variant.sku === item.variantSku) {
              return { ...variant, stock: (variant.stock || 0) - item.quantity };
            }
            return variant;
          });
          const currentSalesCount = productData.salesCount || 0;
          batch.update(productRef, {
            variants: updatedVariants,
            salesCount: currentSalesCount + item.quantity,
            updatedAt: new Date(),
          });
        }
      }
    }
    await batch.commit();
  }
}
