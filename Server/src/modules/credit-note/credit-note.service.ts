import { db } from "../../config/firebase.config";
import { CreditNote } from "./credit-note.model";
import { customerCreditService } from "../customer-credit/customer-credit.service";
import { createNotification } from "../notification/notification.controller";

const COLLECTION = "credit_notes";

export class CreditNoteService {
  async createCreditNote(payload: Partial<CreditNote>): Promise<CreditNote> {
    const ref = db.collection(COLLECTION).doc();
    const now = new Date();
    const creditNote: CreditNote = {
      id: ref.id,
      shopId: payload.shopId || "",
      orderId: payload.orderId || "",
      invoiceId: payload.invoiceId || "",
      customerId: payload.customerId || "",
      customerName: payload.customerName || "Customer",
      customerPhone: payload.customerPhone || "",
      customerEmail: payload.customerEmail || "",
      amount: payload.amount || 0,
      reason: payload.reason || "Return/Refund",
      status: payload.status || 'pending',
      convertedToCredit: false,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(creditNote);

    await createNotification({
      shopId: creditNote.shopId,
      title: "Sales Return Processed",
      message: `Credit note of â‚¹${creditNote.amount} created for ${creditNote.customerName}`,
      type: "credit_note",
      link: `/${creditNote.shopId}/credit-notes`,
    });

    return creditNote;
  }

  async getCreditNotesByShop(shopId: string): Promise<CreditNote[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as CreditNote);
  }

  async updateCreditNoteStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'converted'): Promise<void> {
    await db.collection(COLLECTION).doc(id).update({
      status,
      updatedAt: new Date(),
    });
  }

  async convertToCredit(id: string): Promise<CreditNote> {
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Credit Note not found");
    }

    const cn = doc.data() as CreditNote;
    if (cn.convertedToCredit) {
      throw new Error("Credit Note already converted to store credit");
    }

    // Convert CN amount to Customer Credit
    const customerCredit = await customerCreditService.adjustCredit(
      cn.shopId,
      cn.customerId,
      cn.customerName,
      cn.customerPhone || "",
      cn.customerEmail || "",
      cn.amount,
      'credit',
      `Converted from Credit Note ${cn.id.toUpperCase()}`,
      cn.id
    );

    // Update CN status
    await docRef.update({
      status: 'converted',
      convertedToCredit: true,
      creditTransactionId: customerCredit.id,
      updatedAt: new Date(),
    });

    return {
      ...cn,
      status: 'converted',
      convertedToCredit: true,
      creditTransactionId: customerCredit.id,
    };
  }
}

export const creditNoteService = new CreditNoteService();
