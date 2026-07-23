import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { SeasonalCollection } from "./seasonal-collection.model";

const COLLECTION = "seasonal_collections";

export class SeasonalCollectionService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 60 * 1000;

  private getCacheKey(shopId: string, id: string) {
    return `seasonal-collection:${shopId}:${id}`;
  }

  private getListCacheKey(shopId: string, activeOnly: boolean) {
    return `seasonal-collections:${shopId}:${activeOnly ? "active" : "all"}`;
  }

  async listCollections(shopId: string, activeOnly = false): Promise<SeasonalCollection[]> {
    const cacheKey = this.getListCacheKey(shopId, activeOnly);
    const cached = this.cache.get<SeasonalCollection[]>(cacheKey);
    if (cached) return cached;

    let query = db.collection(COLLECTION).where("shopId", "==", shopId);
    if (activeOnly) {
      query = query.where("active", "==", true);
    }

    const snapshot = await query.get();

    const list = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      } as SeasonalCollection;
    }).sort((a: SeasonalCollection, b: SeasonalCollection) => b.createdAt.getTime() - a.createdAt.getTime());

    this.cache.set(cacheKey, list, this.ttlMs);
    return list;
  }

  async getCollection(shopId: string, id: string): Promise<SeasonalCollection | null> {
    const cacheKey = this.getCacheKey(shopId, id);
    const cached = this.cache.get<SeasonalCollection>(cacheKey);
    if (cached) return cached;

    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (data?.shopId !== shopId) return null;

    const collection = {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() || new Date(data?.createdAt),
      updatedAt: data?.updatedAt?.toDate?.() || new Date(data?.updatedAt),
    } as SeasonalCollection;

    this.cache.set(cacheKey, collection, this.ttlMs);
    return collection;
  }

  async createCollection(shopId: string, payload: Omit<SeasonalCollection, "id" | "shopId" | "createdAt" | "updatedAt">): Promise<SeasonalCollection> {
    const id = `col_${Date.now()}`;
    const collection: SeasonalCollection = {
      ...payload,
      id,
      shopId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc(id).set(collection);
    this.cache.set(this.getCacheKey(shopId, id), collection, this.ttlMs);
    this.invalidateCaches(shopId);

    return collection;
  }

  async updateCollection(shopId: string, id: string, payload: Partial<SeasonalCollection>): Promise<SeasonalCollection | null> {
    const existing = await this.getCollection(shopId, id);
    if (!existing) return null;

    const updated: SeasonalCollection = {
      ...existing,
      ...payload,
      id,
      shopId,
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc(id).set(updated, { merge: true });
    this.cache.set(this.getCacheKey(shopId, id), updated, this.ttlMs);
    this.invalidateCaches(shopId);

    return updated;
  }

  async deleteCollection(shopId: string, id: string): Promise<boolean> {
    const existing = await this.getCollection(shopId, id);
    if (!existing) return false;

    await db.collection(COLLECTION).doc(id).delete();
    this.cache.delete(this.getCacheKey(shopId, id));
    this.invalidateCaches(shopId);

    return true;
  }

  private invalidateCaches(shopId: string) {
    this.cache.delete(this.getListCacheKey(shopId, true));
    this.cache.delete(this.getListCacheKey(shopId, false));
  }
}

export const seasonalCollectionService = new SeasonalCollectionService();
