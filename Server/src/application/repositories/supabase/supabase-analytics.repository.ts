import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { 
  IAnalyticsRepository, 
  CollectionKey, 
  AnalyticsCollectionsBundle 
} from "../interfaces/analytics-repository.interface";
import { CacheService } from "../../../infrastructure/cache/cache.service";

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  private readonly cache = new CacheService();
  private readonly collectionsCacheTtlMs = 15 * 60 * 1000; // 15 minutes

  private async getClient() {
    return await SupabaseManager.getClient();
  }

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
    try {
      const supabase = await this.getClient();
      let query = supabase.from(collection).select('data');
      
      // All migrated tables have "shopId" column
      query = query.eq('shopId', shopId);

      // Branch filter
      if (branchId) {
        if (collection === 'branches') {
          query = query.eq('id', branchId);
        } else {
          // products, inventory, customers, orders, invoices all have "branchId" column in setup-supabase.ts DDL
          query = query.eq('branchId', branchId);
        }
      }

      // Date range filter (startDate is passed)
      if (startDate && ['invoices', 'orders', 'expenses', 'customers'].includes(collection)) {
        // products, inventory, customers, orders, invoices all have "createdAt" TIMESTAMP column in DDL
        query = query.gte('createdAt', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        // Return empty array gracefully if table or columns don't exist yet
        console.warn(`[SupabaseAnalyticsRepository] Query for ${collection} returned error: ${error.message}`);
        return [];
      }

      const result = (data || []).map((d: any) => {
        const rowData = d.data || {};
        return {
          id: rowData.id,
          ...rowData
        };
      });

      if (process.env.NODE_ENV !== "production") {
        console.log(`[Analytics Instrumentation] Supabase Query: ${collection} for shop ${shopId} read ${result.length} rows in ${Date.now() - startTime}ms`);
      }

      return result;
    } catch (err: any) {
      console.warn(`[SupabaseAnalyticsRepository] Failed to query ${collection}: ${err.message}`);
      return [];
    }
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
