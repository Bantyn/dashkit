import { SubscriptionPlan } from "./subscription-plan.model";
import { subscriptionService } from "../subscription/subscription.service";
import { paymentService } from "../subscription/payment.service";
import { db } from "../../config/firebase.config";
import { FieldValue } from "firebase-admin/firestore";
import { APP_CONFIG } from "../../config/app.config";
import {
  CustomPlanRequest,
  CustomPlanRequestStatus,
  CustomPlanActivity,
} from "./custom-plan-request.model";

const COLLECTION = "custom_plan_requests";

export class SubscriptionPlanService {
  async listPlans(activeOnly = false) {
    return (await subscriptionService.listPlans(activeOnly)) as SubscriptionPlan[];
  }

  async getPlan(id: string) {
    return (await subscriptionService.getPlan(id)) as SubscriptionPlan | null;
  }

  async createPlan(payload: Partial<SubscriptionPlan>) {
    return (await subscriptionService.createPlan(payload)) as SubscriptionPlan;
  }

  async updatePlan(id: string, payload: Partial<SubscriptionPlan>) {
    return (await subscriptionService.updatePlan(id, payload)) as SubscriptionPlan | null;
  }

  async deletePlan(id: string) {
    await subscriptionService.deletePlan(id);
  }

  // ── Custom Plan Requests ────────────────────────────────────────────────────

  async createCustomPlanRequest(payload: Partial<CustomPlanRequest>): Promise<CustomPlanRequest> {
    const now = new Date();
    const firstActivity: CustomPlanActivity = {
      status: "SUBMITTED",
      note: "Request submitted from pricing page",
      performedBy: "system",
      timestamp: now,
    };
    const requestData = {
      ...payload,
      status: "SUBMITTED" as CustomPlanRequestStatus,
      activityLog: [firstActivity],
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection(COLLECTION).add(requestData);
    return { id: docRef.id, ...requestData } as CustomPlanRequest;
  }

  async listCustomPlanRequests(filters?: {
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<CustomPlanRequest[]> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION).orderBy("createdAt", "desc");
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    const snap = await query.get();
    let results = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CustomPlanRequest));
    // Client-side search filter (Firestore doesn't support full-text)
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.contactName?.toLowerCase().includes(q) ||
          r.shopName?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.phone?.includes(q)
      );
    }
    return results;
  }

  async getCustomPlanRequest(id: string): Promise<CustomPlanRequest | null> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as CustomPlanRequest;
  }

  async updateCustomPlanRequestStatus(
    id: string,
    status: CustomPlanRequestStatus,
    note?: string,
    performedBy?: string
  ): Promise<CustomPlanRequest> {
    const now = new Date();
    const activity: CustomPlanActivity = {
      status,
      note,
      performedBy: performedBy || "admin",
      timestamp: now,
    };
    await db
      .collection(COLLECTION)
      .doc(id)
      .update({
        status,
        adminNote: note || null,
        updatedAt: now,
        activityLog: FieldValue.arrayUnion(activity),
      });
    const updated = await this.getCustomPlanRequest(id);
    return updated!;
  }

  async generateQuote(
    id: string,
    finalPrice: number,
    billingCycle: "monthly" | "yearly",
    adminNote?: string,
    performedBy?: string
  ): Promise<CustomPlanRequest> {
    const now = new Date();
    const activity: CustomPlanActivity = {
      status: "QUOTED",
      note: adminNote || `Quote generated: ₹${finalPrice}/${billingCycle}`,
      performedBy: performedBy || "admin",
      timestamp: now,
    };
    await db.collection(COLLECTION).doc(id).update({
      status: "QUOTED" as CustomPlanRequestStatus,
      finalPrice,
      billingCycle,
      adminNote: adminNote || null,
      quoteGeneratedAt: now,
      updatedAt: now,
      activityLog: FieldValue.arrayUnion(activity),
    });
    const updated = await this.getCustomPlanRequest(id);
    return updated!;
  }

  async generatePaymentLinkForRequest(id: string, performedBy?: string): Promise<CustomPlanRequest> {
    const request = await this.getCustomPlanRequest(id);
    if (!request) throw new Error("Custom plan request not found");
    if (request.status !== "QUOTED") throw new Error("Request must be in QUOTED state to generate a payment link");
    if (!request.finalPrice) throw new Error("Final price is not set");

    const customerData = {
      name: request.contactName,
      email: request.email,
      contact: request.phone || "9999999999", // Razorpay usually requires contact
    };

    const linkData = await paymentService.generatePaymentLink(
      request.finalPrice,
      "INR", // Default currency
      customerData,
      request.id
    );

    const now = new Date();
    const activity: CustomPlanActivity = {
      status: "PAYMENT_PENDING",
      note: `Payment link generated (${linkData.paymentLinkId})`,
      performedBy: performedBy || "admin",
      timestamp: now,
    };

    await db.collection(COLLECTION).doc(id).update({
      status: "PAYMENT_PENDING" as CustomPlanRequestStatus,
      paymentLinkId: linkData.paymentLinkId,
      paymentLinkUrl: linkData.paymentLinkUrl,
      updatedAt: now,
      activityLog: FieldValue.arrayUnion(activity),
    });

    return (await this.getCustomPlanRequest(id))!;
  }

  async cancelCustomPlanRequest(
    id: string,
    reason?: string,
    performedBy?: string
  ): Promise<void> {
    const now = new Date();
    const activity: CustomPlanActivity = {
      status: "CANCELLED",
      note: reason || "Cancelled by admin",
      performedBy: performedBy || "admin",
      timestamp: now,
    };
    await db.collection(COLLECTION).doc(id).update({
      status: "CANCELLED" as CustomPlanRequestStatus,
      updatedAt: now,
      activityLog: FieldValue.arrayUnion(activity),
    });
  }

  async syncPaymentStatus(id: string, performedBy?: string): Promise<CustomPlanRequest> {
    const request = await this.getCustomPlanRequest(id);
    if (!request) throw new Error("Request not found");
    if (!request.paymentLinkId) throw new Error("No payment link associated with this request");

    const { paymentService } = await import("../subscription/payment.service");
    const razorpay = await paymentService.getRazorpayInstance();
    
    try {
      const link = await razorpay.paymentLink.fetch(request.paymentLinkId);
      
      if (link.status === "paid" && request.status !== "PAYMENT_COMPLETED") {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(16).toString("hex");
        const baseUrl = APP_CONFIG.FRONTEND_URL;
        const registrationLink = `${baseUrl}/register?reqId=${id}&token=${token}`;
        const now = new Date();
        
        await db.collection(COLLECTION).doc(id).update({
          status: "PAYMENT_COMPLETED" as CustomPlanRequestStatus,
          paymentCompletedAt: now,
          registrationToken: token,
          registrationLink: registrationLink,
          updatedAt: now,
          activityLog: FieldValue.arrayUnion({
            status: "PAYMENT_COMPLETED",
            note: "Payment synced manually. Registration link generated.",
            performedBy: performedBy || "admin",
            timestamp: now
          })
        });
        
        return (await this.getCustomPlanRequest(id))!;
      }
      
      return request;
    } catch (e: any) {
      console.error("Failed to sync payment status from Razorpay:", e);
      throw new Error(e.message || "Failed to fetch payment link status");
    }
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();

