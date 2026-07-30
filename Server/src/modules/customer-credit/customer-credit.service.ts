import { db } from "../../config/firebase.config";
import { CustomerCredit, CreditHistoryEntry } from "./customer-credit.model";
import { createNotification } from "../notification/notification.controller";
import * as admin from "firebase-admin";

const COLLECTION = "customer_credits";
const TRANSACTIONS_SUBCOLLECTION = "transactions";

export class CustomerCreditService {

  /**
   * Helper to fetch transactions for a credit document from the transactions subcollection.
   * If subcollection is empty BUT master doc has a legacy history array, performs automatic migration.
   */
  private async getTransactionsAndMigrate(
    docRef: FirebaseFirestore.DocumentReference,
    data: any
  ): Promise<CreditHistoryEntry[]> {
    const txSubRef = docRef.collection(TRANSACTIONS_SUBCOLLECTION);
    const txSnap = await txSubRef.orderBy("date", "desc").get();

    if (!txSnap.empty) {
      return txSnap.docs.map((txDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const txData = txDoc.data();
        return {
          id: txDoc.id,
          amount: txData.amount || 0,
          type: txData.type || "credit",
          reason: txData.reason || "",
          date: txData.date?.toDate?.() || new Date(txData.date || Date.now()),
          referenceId: txData.referenceId,
        } as CreditHistoryEntry;
      });
    }

    // Check if legacy history array exists on master document
    const legacyHistory: any[] = Array.isArray(data?.history) ? data.history : [];
    if (legacyHistory.length > 0) {
      console.log(`[CustomerCredit] Migrating legacy history array (${legacyHistory.length} items) to subcollection for doc ${docRef.id}...`);
      
      const batch = db.batch();
      const migratedEntries: CreditHistoryEntry[] = [];

      legacyHistory.forEach((item: any, idx: number) => {
        const txDocRef = txSubRef.doc(`tx_migrated_${idx}_${Date.now()}`);
        const txDate = item.date?.toDate?.() || new Date(item.date || Date.now());
        const entry: CreditHistoryEntry = {
          id: txDocRef.id,
          amount: Number(item.amount || 0),
          type: item.type === "debit" ? "debit" : "credit",
          reason: item.reason || "",
          date: txDate,
          referenceId: item.referenceId,
        };

        batch.set(txDocRef, {
          ...entry,
          createdAt: txDate,
        });

        migratedEntries.push(entry);
      });

      // Remove legacy history array field from master document
      batch.update(docRef, {
        history: admin.firestore.FieldValue.delete(),
        updatedAt: new Date(),
      });

      await batch.commit();
      console.log(`[CustomerCredit] Legacy history migration committed for doc ${docRef.id}.`);

      return migratedEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    return [];
  }

  async getCustomerCredit(shopId: string, customerId: string): Promise<CustomerCredit | null> {
    const docRef = db.collection(COLLECTION).doc(`${shopId}_${customerId}`);
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    const history = await this.getTransactionsAndMigrate(docRef, data);

    return {
      id: doc.id,
      shopId: data.shopId || shopId,
      customerId: data.customerId || customerId,
      customerName: data.customerName || "Customer",
      customerPhone: data.customerPhone || "",
      customerEmail: data.customerEmail || "",
      balance: Number(data.balance || 0),
      history,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
    };
  }

  async getCreditsByShop(shopId: string): Promise<CustomerCredit[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .get();

    if (snapshot.empty) return [];

    const credits = await Promise.all(
      snapshot.docs.map(async (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        const history = await this.getTransactionsAndMigrate(doc.ref, data);

        return {
          id: doc.id,
          shopId: data.shopId || shopId,
          customerId: data.customerId || "",
          customerName: data.customerName || "Customer",
          customerPhone: data.customerPhone || "",
          customerEmail: data.customerEmail || "",
          balance: Number(data.balance || 0),
          history,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
        } as CustomerCredit;
      })
    );

    return credits;
  }

  async adjustCredit(
    shopId: string,
    customerId: string,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string,
    referenceId?: string
  ): Promise<CustomerCredit> {
    const docRef = db.collection(COLLECTION).doc(`${shopId}_${customerId}`);
    const doc = await docRef.get();

    let balance = 0;
    const now = new Date();

    if (doc.exists) {
      const data = doc.data()!;
      balance = data.balance || 0;

      // Migrate legacy history array if still present on master doc
      if (Array.isArray(data.history) && data.history.length > 0) {
        await this.getTransactionsAndMigrate(docRef, data);
      }
    }

    if (type === 'credit') {
      balance += amount;
    } else {
      balance -= amount;
      if (balance < 0) balance = 0;
    }

    // 1. Create subcollection transaction doc
    const txRef = docRef.collection(TRANSACTIONS_SUBCOLLECTION).doc();
    const historyEntry: CreditHistoryEntry = {
      id: txRef.id,
      amount,
      type,
      reason,
      date: now,
      referenceId,
    };

    await txRef.set({
      id: txRef.id,
      amount,
      type,
      reason,
      date: now,
      referenceId: referenceId || null,
      createdAt: now,
    });

    // 2. Update master document (OMITTING history array)
    const masterData: any = {
      id: `${shopId}_${customerId}`,
      shopId,
      customerId,
      customerName,
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      balance,
      createdAt: doc.exists ? (doc.data()?.createdAt?.toDate?.() || new Date(doc.data()?.createdAt || now)) : now,
      updatedAt: now,
    };

    // Ensure legacy history array is stripped from master document
    if (doc.exists && (doc.data() as any)?.history) {
      masterData.history = admin.firestore.FieldValue.delete();
    }

    await docRef.set(masterData, { merge: true });

    if (type === 'credit') {
      await createNotification({
        shopId,
        title: "Store Credit Issued",
        message: `₹${amount} credit issued to ${customerName} (${reason})`,
        type: "credit",
        link: `/${shopId}/customers`,
      });
    }

    // Return complete CustomerCredit object with updated transaction history
    const allTransactions = await docRef.collection(TRANSACTIONS_SUBCOLLECTION).orderBy("date", "desc").get();
    const history: CreditHistoryEntry[] = allTransactions.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const t = d.data();
      return {
        id: d.id,
        amount: t.amount || 0,
        type: t.type || "credit",
        reason: t.reason || "",
        date: t.date?.toDate?.() || new Date(t.date || Date.now()),
        referenceId: t.referenceId,
      };
    });

    return {
      id: `${shopId}_${customerId}`,
      shopId,
      customerId,
      customerName,
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      balance,
      history,
      createdAt: masterData.createdAt,
      updatedAt: now,
    };
  }

  /**
   * Bulk migration helper for all credit records of a shop.
   */
  async migrateAllCreditsForShop(shopId: string): Promise<{ migratedShops: number; totalTransactionsMigrated: number }> {
    const snapshot = await db.collection(COLLECTION).where("shopId", "==", shopId).get();
    let migratedShops = 0;
    let totalTransactionsMigrated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (Array.isArray(data.history) && data.history.length > 0) {
        const migrated = await this.getTransactionsAndMigrate(doc.ref, data);
        migratedShops++;
        totalTransactionsMigrated += migrated.length;
      }
    }

    return { migratedShops, totalTransactionsMigrated };
  }
}

export const customerCreditService = new CustomerCreditService();
