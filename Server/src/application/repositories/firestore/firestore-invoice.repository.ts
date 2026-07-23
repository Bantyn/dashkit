import { db } from "../../../config/firebase.config";
import { Invoice } from "../../../modules/invoice/invoice.model";
import { IInvoiceRepository } from "../interfaces/invoice-repository.interface";

const COLLECTION = "invoices";

export class FirestoreInvoiceRepository implements IInvoiceRepository {
  generateId(): string {
    return db.collection(COLLECTION).doc().id;
  }

  async getInvoices(): Promise<Invoice[]> {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs.map((doc: any) => doc.data() as Invoice);
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const docSnap = await db.collection(COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as Invoice;
  }

  async updateInvoice(id: string, payload: any): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      ...payload,
      updatedAt: new Date(),
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.collection(COLLECTION).doc(id).delete();
  }

  async getInvoicesByShop(shopId: string, employeeId?: string, branchId?: string): Promise<Invoice[]> {
    let query: any = db.collection(COLLECTION).where("shopId", "==", shopId);

    if (employeeId) {
      query = query.where("employeeId", "==", employeeId);
    }

    if (branchId && branchId !== "parent") {
      query = query.where("branchId", "==", branchId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as Invoice);
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("customerId", "==", customerId)
      .get();

    return snapshot.docs.map((doc: any) => doc.data() as Invoice);
  }

  // ─── Firestore Transaction Operations ────────────────────────────────────────

  async getTransactionShop(transaction: FirebaseFirestore.Transaction, shopId: string): Promise<any> {
    const ref = db.collection("shops").doc(shopId);
    return transaction.get(ref);
  }

  async getTransactionCustomer(transaction: FirebaseFirestore.Transaction, shopId: string, phone: string): Promise<any> {
    const query = db.collection("customers")
      .where("shopId", "==", shopId)
      .where("phoneNumber", "==", phone)
      .limit(1);
    return transaction.get(query);
  }

  async getTransactionProducts(transaction: FirebaseFirestore.Transaction, productIds: string[]): Promise<any[]> {
    if (productIds.length === 0) return [];
    const refs = productIds.map(id => db.collection("products").doc(id));
    return transaction.getAll(...refs);
  }

  async getTransactionInventoryItems(
    transaction: FirebaseFirestore.Transaction,
    shopId: string,
    items: { productId: string; variantSku: string }[]
  ): Promise<any[]> {
    const queries = items.map((item) =>
      db.collection("inventory")
        .where("shopId", "==", shopId)
        .where("productId", "==", item.productId)
        .where("variantSku", "==", item.variantSku || "")
        .limit(1)
    );
    return Promise.all(queries.map((q) => transaction.get(q)));
  }

  async createTransactionInvoice(transaction: FirebaseFirestore.Transaction, invoice: Invoice): Promise<void> {
    const ref = db.collection(COLLECTION).doc(invoice.id);
    transaction.set(ref, invoice);
  }

  // existingData is unused — Firestore transaction handles reads internally
  async updateTransactionCustomer(transaction: FirebaseFirestore.Transaction, customerId: string, customerData: any, _existingData?: any): Promise<void> {
    const ref = db.collection("customers").doc(customerId);
    transaction.update(ref, customerData);
  }

  async createTransactionCustomer(transaction: FirebaseFirestore.Transaction, customer: any): Promise<void> {
    const ref = db.collection("customers").doc(customer.id);
    transaction.set(ref, customer);
  }

  // existingData is unused — Firestore transaction handles reads internally
  async updateTransactionInventory(transaction: FirebaseFirestore.Transaction, invId: string, stock: number, _existingData?: any): Promise<void> {
    const ref = db.collection("inventory").doc(invId);
    transaction.update(ref, {
      currentStock: stock,
      updatedAt: new Date(),
    });
  }

  async createTransactionHistory(transaction: FirebaseFirestore.Transaction, historyRecord: any): Promise<void> {
    const ref = db.collection("inventory_history").doc();
    transaction.set(ref, {
      id: ref.id,
      ...historyRecord,
    });
  }

  // existingData is unused — Firestore transaction handles reads internally
  async updateTransactionProduct(transaction: FirebaseFirestore.Transaction, productId: string, productUpdate: any, _existingData?: any): Promise<void> {
    const ref = db.collection("products").doc(productId);
    transaction.update(ref, productUpdate);
  }

  /**
   * Firestore: batch inventory+product updates are handled by the Firestore
   * transaction natively — each individual call is buffered in the transaction
   * and committed atomically. We simply delegate to per-item methods.
   */
  async batchUpdateTransactionInventoryAndProducts(
    transaction: any,
    updates: Array<{
      invId: string;
      newStock: number;
      existingInvData: any;
      productId: string;
      productUpdate: any;
      existingProductData: any;
      historyRecord: any;
    }>
  ): Promise<void> {
    for (const u of updates) {
      await this.updateTransactionInventory(transaction, u.invId, u.newStock, u.existingInvData);
      await this.updateTransactionProduct(transaction, u.productId, u.productUpdate, u.existingProductData);
      await this.createTransactionHistory(transaction, u.historyRecord);
    }
  }
}

