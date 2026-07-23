import { db } from "../../config/firebase.config";
import { TailoringJob } from "./tailoring.model";

const COLLECTION = "tailoring_jobs";

export class TailoringService {
  async getJobs(shopId: string): Promise<TailoringJob[]> {
    const snapshot = await db.collection(COLLECTION)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .get();
      
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as TailoringJob);
  }

  async getJob(id: string): Promise<TailoringJob> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Tailoring job not found");
    }
    return doc.data() as TailoringJob;
  }

  async createJob(payload: Partial<TailoringJob>): Promise<TailoringJob> {
    const ref = db.collection(COLLECTION).doc();
    const now = new Date();
    
    const job: TailoringJob = {
      id: ref.id,
      shopId: payload.shopId!,
      customerId: payload.customerId!,
      customerName: payload.customerName || "Unknown",
      phoneNumber: payload.phoneNumber,
      type: payload.type || 'alteration',
      status: payload.status || 'measurement_taken',
      tailorId: payload.tailorId,
      tailorName: payload.tailorName,
      deadline: payload.deadline || now.toISOString(),
      measurements: payload.measurements || {},
      notes: payload.notes || '',
      amount: payload.amount || 0,
      paidAmount: payload.paidAmount || 0,
      fabricIssued: payload.fabricIssued,
      fabricLength: payload.fabricLength,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(job);
    return job;
  }

  async updateJob(id: string, payload: Partial<TailoringJob>): Promise<void> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Tailoring job not found");
    }

    const updateData = { ...payload, updatedAt: new Date() };
    await db.collection(COLLECTION).doc(id).update(updateData);
  }

  async deleteJob(id: string): Promise<void> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Tailoring job not found");
    }
    await db.collection(COLLECTION).doc(id).delete();
  }
}

export const tailoringService = new TailoringService();
