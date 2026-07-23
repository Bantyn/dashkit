import { db } from "../../config/firebase.config";
import { SupportTicket } from "./support.model";
import { sendShopReactivationEmail } from "../../shared/utils/email.util";

const COLLECTION = "support_tickets";

class SupportService {
  async createTicket(data: Omit<SupportTicket, "id" | "status" | "createdAt" | "updatedAt">) {
    const ticket: Omit<SupportTicket, "id"> = {
      ...data,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await db.collection(COLLECTION).add(ticket);
    return { id: docRef.id, ...ticket };
  }

  async getTickets(status?: string) {
    let query: any = db.collection(COLLECTION);
    if (status) {
      query = query.where("status", "==", status);
    }
    const snapshot = await query.get();
    const tickets = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return tickets.sort((a: any, b: any) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
      return tb - ta;
    });
  }

  async replyToTicket(ticketId: string, adminReply: string, adminEmail: string) {
    const ticketRef = db.collection(COLLECTION).doc(ticketId);
    const ticketDoc = await ticketRef.get();
    if (!ticketDoc.exists) throw new Error("Ticket not found");

    const ticketData = ticketDoc.data() as SupportTicket;

    await ticketRef.update({
      status: "replied",
      adminReply,
      repliedAt: new Date(),
      updatedAt: new Date(),
    });

    // Send email notification to shop owner
    try {
      const { sendSupportReplyEmail } = await import("../../shared/utils/email.util");
      await sendSupportReplyEmail(
        ticketData.reporterEmail,
        ticketData.shopName,
        ticketData.subject,
        adminReply,
        adminEmail
      );
    } catch (e) {
      console.error("Failed to send reply email:", e);
    }

    return { success: true };
  }

  async closeTicket(ticketId: string) {
    const ticketRef = db.collection(COLLECTION).doc(ticketId);
    await ticketRef.update({ status: "closed", updatedAt: new Date() });
    return { success: true };
  }
}

export const supportService = new SupportService();
