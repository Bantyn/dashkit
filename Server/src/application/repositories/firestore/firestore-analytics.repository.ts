import { db } from "../../../config/firebase.config";
import { 
  IAnalyticsRepository, 
  CollectionKey, 
  AnalyticsCollectionsBundle 
} from "../interfaces/analytics-repository.interface";
import { CacheService } from "../../../infrastructure/cache/cache.service";

export class FirestoreAnalyticsRepository implements IAnalyticsRepository {
  private readonly cache = new CacheService();
  private readonly collectionsCacheTtlMs = 15 * 60 * 1000; // 15 minutes

  private getIndividualCollectionCacheKey(shopId: string, collection: string, branchId?: string, startDate?: Date) {
    const dateStr = startDate ? startDate.toISOString().split("T")[0] : "all";
    return `analytics:collections:${collection}:${shopId}:${branchId || "all"}:${dateStr}`;
  }

  private async queryCollection(
    shopId: string, 
    collection: CollectionKey, 
    branchId?: string,
    startDate?: Date
  ): Promise<any[]> {
    const startTime = Date.now();
    let query: any = db.collection(collection).where("shopId", "==", shopId);

    if (branchId && branchId !== "parent") {
      if (collection === "branches") {
        query = query.where("id", "==", branchId);
      } else if (["invoices", "orders", "expenses", "staff", "inventory", "products"].includes(collection)) {
        query = query.where("branchId", "==", branchId);
      }
    }

    if (startDate && ["invoices", "orders", "expenses", "customers"].includes(collection)) {
      query = query.where("createdAt", ">=", startDate);
    }

    const snapshot = await query.get();
    const result = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics Instrumentation] Firestore Query: ${collection} for shop ${shopId} read ${snapshot.size} docs in ${Date.now() - startTime}ms`);
    }
    return result;
  }

  async loadShopData(
    shopId: string, 
    needed: CollectionKey[] = ["invoices", "orders", "expenses", "products", "customers", "staff", "inventory", "branches"],
    branchId?: string, 
    startDate?: Date
  ): Promise<AnalyticsCollectionsBundle> {
    const bundle: Partial<AnalyticsCollectionsBundle> = {};
    const fetchPromises: Promise<any[]>[] = [];
    const fetchKeys: { collection: CollectionKey; cacheKey: string }[] = [];

    let hitCount = 0;
    let missCount = 0;

    for (const key of needed) {
      const cacheKey = this.getIndividualCollectionCacheKey(shopId, key, branchId, startDate);
      const cached = this.cache.get<any[]>(cacheKey);
      if (cached) {
        bundle[key] = cached;
        hitCount++;
      } else {
        fetchKeys.push({ collection: key, cacheKey });
        fetchPromises.push(this.queryCollection(shopId, key, branchId, startDate));
        missCount++;
      }
    }

    if (fetchPromises.length > 0) {
      const startTime = Date.now();
      const results = await Promise.all(fetchPromises);
      
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Analytics Instrumentation] loadShopCollections cold fetch of [${fetchKeys.map(k => k.collection).join(", ")}] took ${Date.now() - startTime}ms`);
      }

      for (let i = 0; i < results.length; i++) {
        const { collection, cacheKey } = fetchKeys[i];
        const data = results[i];
        this.cache.set(cacheKey, data, this.collectionsCacheTtlMs);
        bundle[collection] = data;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics Instrumentation] loadShopCollections cache stats: Hits: ${hitCount}, Misses: ${missCount}`);
    }

    return {
      invoices: bundle.invoices || [],
      orders: bundle.orders || [],
      expenses: bundle.expenses || [],
      products: bundle.products || [],
      customers: bundle.customers || [],
      staff: bundle.staff || [],
      inventory: bundle.inventory || [],
      branches: bundle.branches || [],
    };
  }
}
