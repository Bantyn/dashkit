import { db } from "../../../config/firebase.config";
import {
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierPayment,
  PurchaseReturn,
} from "../../../modules/purchase/purchase.model";
import { IPurchaseRepository } from "../interfaces/purchase-repository.interface";

const SUPPLIERS = "suppliers";
const PURCHASE_ORDERS = "purchase_orders";
const GOODS_RECEIVED = "goods_received";
const SUPPLIER_PAYMENTS = "supplier_payments";
const PURCHASE_RETURNS = "purchase_returns";
const INVENTORY = "inventory";

export class FirestorePurchaseRepository implements IPurchaseRepository {
  generateSupplierId(): string {
    return db.collection(SUPPLIERS).doc().id;
  }
  generatePurchaseOrderId(): string {
    return db.collection(PURCHASE_ORDERS).doc().id;
  }
  generateGoodsReceivedId(): string {
    return db.collection(GOODS_RECEIVED).doc().id;
  }
  generateSupplierPaymentId(): string {
    return db.collection(SUPPLIER_PAYMENTS).doc().id;
  }
  generatePurchaseReturnId(): string {
    return db.collection(PURCHASE_RETURNS).doc().id;
  }

  async getPurchaseOrdersCount(shopId: string): Promise<number> {
    const snap = await db.collection(PURCHASE_ORDERS).where("shopId", "==", shopId).get();
    return snap.size;
  }
  async getGoodsReceivedCount(shopId: string): Promise<number> {
    const snap = await db.collection(GOODS_RECEIVED).where("shopId", "==", shopId).get();
    return snap.size;
  }
  async getSupplierPaymentsCount(shopId: string): Promise<number> {
    const snap = await db.collection(SUPPLIER_PAYMENTS).where("shopId", "==", shopId).get();
    return snap.size;
  }
  async getPurchaseReturnsCount(shopId: string): Promise<number> {
    const snap = await db.collection(PURCHASE_RETURNS).where("shopId", "==", shopId).get();
    return snap.size;
  }

  async getSuppliers(shopId: string): Promise<Supplier[]> {
    const snapshot = await db
      .collection(SUPPLIERS)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Supplier));
  }

  async createSupplier(data: Supplier): Promise<void> {
    await db.collection(SUPPLIERS).doc(data.id).set(data);
  }

  async updateSupplier(id: string, data: any): Promise<void> {
    await db.collection(SUPPLIERS).doc(id).update(data);
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.collection(SUPPLIERS).doc(id).delete();
  }

  async getPurchaseOrders(shopId: string): Promise<PurchaseOrder[]> {
    const snapshot = await db
      .collection(PURCHASE_ORDERS)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    const docSnap = await db.collection(PURCHASE_ORDERS).doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as any;
  }

  async createPurchaseOrder(data: PurchaseOrder): Promise<void> {
    await db.collection(PURCHASE_ORDERS).doc(data.id).set(data);
  }

  async updatePurchaseOrder(id: string, data: any): Promise<void> {
    await db.collection(PURCHASE_ORDERS).doc(id).update(data);
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await db.collection(PURCHASE_ORDERS).doc(id).delete();
  }

  async getGoodsReceived(shopId: string): Promise<GoodsReceivedNote[]> {
    const snapshot = await db
      .collection(GOODS_RECEIVED)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GoodsReceivedNote));
  }

  async createGoodsReceived(data: GoodsReceivedNote): Promise<void> {
    await db.collection(GOODS_RECEIVED).doc(data.id).set(data);
  }

  async getSupplierPayments(shopId: string): Promise<SupplierPayment[]> {
    const snapshot = await db
      .collection(SUPPLIER_PAYMENTS)
      .where("shopId", "==", shopId)
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as SupplierPayment));
  }

  async createSupplierPayment(data: SupplierPayment): Promise<void> {
    await db.collection(SUPPLIER_PAYMENTS).doc(data.id).set(data);
  }

  async getPurchaseReturns(shopId: string): Promise<PurchaseReturn[]> {
    const snapshot = await db
      .collection(PURCHASE_RETURNS)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as PurchaseReturn));
  }

  async createPurchaseReturn(data: PurchaseReturn): Promise<void> {
    await db.collection(PURCHASE_RETURNS).doc(data.id).set(data);
  }

  async getInventoryStock(shopId: string, productId: string, variantSku: string): Promise<number> {
    const snapshot = await db
      .collection(INVENTORY)
      .where("shopId", "==", shopId)
      .where("productId", "==", productId)
      .where("variantSku", "==", variantSku)
      .limit(1)
      .get();

    if (snapshot.empty) return 0;
    return Number(snapshot.docs[0].data().currentStock || 0);
  }
}
