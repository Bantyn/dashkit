import { db } from "../../config/firebase.config";
import { CustomerCredit, CreditHistoryEntry } from "./customer-credit.model";
import { createNotification } from "../notification/notification.controller";

const COLLECTION = "customer_credits";

export class CustomerCreditService {
  async getCustomerCredit(shopId: string, customerId: string): Promise<CustomerCredit | null> {
    const docRef = db.collection(COLLECTION).doc(`${shopId}_${customerId}`);
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as CustomerCredit;
  }

  async getCreditsByShop(shopId: string): Promise<CustomerCredit[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as CustomerCredit);
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
    let history: CreditHistoryEntry[] = [];
    const now = new Date();

    if (doc.exists) {
      const data = doc.data() as CustomerCredit;
      balance = data.balance || 0;
      history = data.history || [];
    }

    if (type === 'credit') {
      balance += amount;
    } else {
      balance -= amount;
      if (balance < 0) balance = 0; // prevent negative balance unless intended, but let's cap at 0
    }

    const historyEntry: CreditHistoryEntry = {
      amount,
      type,
      reason,
      date: now,
      referenceId,
    };

    history.push(historyEntry);

    const record: CustomerCredit = {
      id: `${shopId}_${customerId}`,
      shopId,
      customerId,
      customerName,
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      balance,
      history,
      createdAt: doc.exists ? (doc.data() as CustomerCredit).createdAt || now : now,
      updatedAt: now,
    };

    await docRef.set(record);

    if (type === 'credit') {
      await createNotification({
        shopId,
        title: "Store Credit Issued",
        message: `₹${amount} credit issued to ${customerName} (${reason})`,
        type: "credit",
        link: `/${shopId}/customers`,
      });
    }

    return record;
  }
}

export const customerCreditService = new CustomerCreditService();
