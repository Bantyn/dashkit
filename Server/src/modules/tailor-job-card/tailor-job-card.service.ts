import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { TailorJobCard } from "./tailor-job-card.model";

const COLLECTION = "tailor_job_cards";

export class TailorJobCardService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 60 * 1000;

  private getCacheKey(shopId: string, id: string) {
    return `tailor-job-card:${shopId}:${id}`;
  }

  private getListCacheKey(shopId: string) {
    return `tailor-job-cards:${shopId}`;
  }

  async listJobCards(shopId: string): Promise<TailorJobCard[]> {
    const cacheKey = this.getListCacheKey(shopId);
    const cached = this.cache.get<TailorJobCard[]>(cacheKey);
    if (cached) return cached;

    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .get();

    const list = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedDate: data.assignedDate?.toDate?.() || new Date(data.assignedDate),
        completedDate: data.completedDate ? (data.completedDate?.toDate?.() || new Date(data.completedDate)) : undefined,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      } as TailorJobCard;
    }).sort((a: TailorJobCard, b: TailorJobCard) => b.createdAt.getTime() - a.createdAt.getTime());

    this.cache.set(cacheKey, list, this.ttlMs);
    return list;
  }

  async getJobCard(shopId: string, id: string): Promise<TailorJobCard | null> {
    const cacheKey = this.getCacheKey(shopId, id);
    const cached = this.cache.get<TailorJobCard>(cacheKey);
    if (cached) return cached;

    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (data?.shopId !== shopId) return null;

    const card = {
      id: doc.id,
      ...data,
      assignedDate: data?.assignedDate?.toDate?.() || new Date(data?.assignedDate),
      completedDate: data?.completedDate ? (data?.completedDate?.toDate?.() || new Date(data?.completedDate)) : undefined,
      createdAt: data?.createdAt?.toDate?.() || new Date(data?.createdAt),
      updatedAt: data?.updatedAt?.toDate?.() || new Date(data?.updatedAt),
    } as TailorJobCard;

    this.cache.set(cacheKey, card, this.ttlMs);
    return card;
  }

  async createJobCard(shopId: string, payload: Omit<TailorJobCard, "id" | "shopId" | "createdAt" | "updatedAt">): Promise<TailorJobCard> {
    const id = `job_${Date.now()}`;
    const card: TailorJobCard = {
      ...payload,
      id,
      shopId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc(id).set(card);
    this.cache.set(this.getCacheKey(shopId, id), card, this.ttlMs);
    this.cache.delete(this.getListCacheKey(shopId));

    return card;
  }

  async updateJobCard(shopId: string, id: string, payload: Partial<TailorJobCard>): Promise<TailorJobCard | null> {
    const existing = await this.getJobCard(shopId, id);
    if (!existing) return null;

    const updated: TailorJobCard = {
      ...existing,
      ...payload,
      id,
      shopId,
      updatedAt: new Date(),
    };

    // If status transitioned to completed, set completedDate
    if (payload.status === "completed" && existing.status !== "completed") {
      updated.completedDate = new Date();
    }

    await db.collection(COLLECTION).doc(id).set(updated, { merge: true });
    this.cache.set(this.getCacheKey(shopId, id), updated, this.ttlMs);
    this.cache.delete(this.getListCacheKey(shopId));

    return updated;
  }

  async deleteJobCard(shopId: string, id: string): Promise<boolean> {
    const existing = await this.getJobCard(shopId, id);
    if (!existing) return false;

    await db.collection(COLLECTION).doc(id).delete();
    this.cache.delete(this.getCacheKey(shopId, id));
    this.cache.delete(this.getListCacheKey(shopId));

    return true;
  }
}

export const tailorJobCardService = new TailorJobCardService();
