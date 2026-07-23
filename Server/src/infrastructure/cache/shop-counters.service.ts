import { db } from "../../config/firebase.config";
import { CacheService } from "../cache/cache.service";
import { FieldValue } from "firebase-admin/firestore";
import { ShopCounters } from "../../modules/cost-analytics/cost-analytics.snapshot.model";

const COUNTERS_COLLECTION = "shop_counters";
const CACHE_PREFIX = "shop_counters:";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type CounterField = "orders" | "invoices" | "products" | "customers" | "staff" | "branches";

/**
 * ShopCountersService
 *
 * Maintains per-shop document count counters via atomic FieldValue.increment.
 * This eliminates the need to full-scan orders/invoices/products/customers/staff/branches
 * during analytics report generation.
 *
 * Cost: 1 write per entity mutation (extremely cheap vs 600+ reads on every report).
 */
export class ShopCountersService {
  private readonly cache = new CacheService();

  private getCacheKey(shopId: string) {
    return `${CACHE_PREFIX}${shopId}`;
  }

  /**
   * Atomically increment (or decrement) a counter field for a shop.
   * Uses Firestore FieldValue.increment — safe under concurrent writes.
   * Fire-and-forget: does not block the caller's response.
   */
  async incrementCounter(shopId: string, field: CounterField, delta: number = 1): Promise<void> {
    try {
      const ref = db.collection(COUNTERS_COLLECTION).doc(shopId);
      await ref.set(
        {
          shopId,
          [field]: FieldValue.increment(delta),
          updatedAt: new Date(),
          createdBy: "system",
          updatedBy: "system",
        },
        { merge: true }
      );

      // Invalidate cached counters for this shop
      this.cache.delete(this.getCacheKey(shopId));
    } catch (err) {
      // Non-fatal — log and continue. Counter will self-heal on next seed.
      console.warn(`[ShopCounters] Failed to increment ${field} for shop ${shopId}:`, err);
    }
  }

  /**
   * Read counters for a single shop. Cached for 10 minutes.
   */
  async getCounters(shopId: string): Promise<ShopCounters | null> {
    const cached = this.cache.get<ShopCounters>(this.getCacheKey(shopId));
    if (cached) return cached;

    const doc = await db.collection(COUNTERS_COLLECTION).doc(shopId).get();
    if (!doc.exists) return null;

    const counters = doc.data() as ShopCounters;
    this.cache.set(this.getCacheKey(shopId), counters, CACHE_TTL_MS);
    return counters;
  }

  /**
   * Read counters for ALL shops in a single collection scan.
   * Returns a Map<shopId, ShopCounters> for O(1) lookup.
   * Cached for 10 minutes.
   */
  async getAllCounters(): Promise<Map<string, ShopCounters>> {
    const cacheKey = `${CACHE_PREFIX}all`;
    const cached = this.cache.get<Map<string, ShopCounters>>(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection(COUNTERS_COLLECTION).get();
    const map = new Map<string, ShopCounters>();

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data() as ShopCounters;
      map.set(doc.id, data);
    });

    this.cache.set(cacheKey, map, CACHE_TTL_MS);
    return map;
  }

  /**
   * Seed counters for a single shop from current Firestore counts.
   * Used by the one-time migration script and for new shop initialization.
   */
  async seedCountersForShop(shopId: string): Promise<ShopCounters> {
    const { getSyncProvider } = require("../../application/repositories/providers/db-provider.config");
    
    let ordersCount = 0;
    let invoicesCount = 0;
    let productsCount = 0;
    let customersCount = 0;

    if (getSyncProvider() === "supabase") {
      try {
        const { SupabaseManager } = require("../supabase/supabase.client");
        const supabase = await SupabaseManager.getClient();
        
        const [ordersRes, invoicesRes, productsRes, customersRes] = await Promise.all([
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("shopId", shopId),
          supabase.from("invoices").select("*", { count: "exact", head: true }).eq("shopId", shopId),
          supabase.from("products").select("*", { count: "exact", head: true }).eq("shopId", shopId),
          supabase.from("customers").select("*", { count: "exact", head: true }).eq("shopId", shopId),
        ]);

        ordersCount = ordersRes.count || 0;
        invoicesCount = invoicesRes.count || 0;
        productsCount = productsRes.count || 0;
        customersCount = customersRes.count || 0;
      } catch (err) {
        console.warn("[ShopCounters] Failed to fetch counts from Supabase:", err);
      }
    } else {
      const [ordersSnap, invoicesSnap, productsSnap, customersSnap] = await Promise.all([
        db.collection("orders").where("shopId", "==", shopId).count().get(),
        db.collection("invoices").where("shopId", "==", shopId).count().get(),
        db.collection("products").where("shopId", "==", shopId).count().get(),
        db.collection("customers").where("shopId", "==", shopId).count().get(),
      ]);
      ordersCount = ordersSnap.data().count;
      invoicesCount = invoicesSnap.data().count;
      productsCount = productsSnap.data().count;
      customersCount = customersSnap.data().count;
    }

    const [staffSnap, branchesSnap] = await Promise.all([
      db.collection("staff").where("shopId", "==", shopId).count().get(),
      db.collection("branches").where("shopId", "==", shopId).count().get(),
    ]);

    const now = new Date();
    const counters: ShopCounters = {
      shopId,
      orders: ordersCount,
      invoices: invoicesCount,
      products: productsCount,
      customers: customersCount,
      staff: staffSnap.data().count,
      branches: branchesSnap.data().count,
      updatedAt: now,
      createdAt: now,
      createdBy: "system",
      updatedBy: "system",
    };

    await db.collection(COUNTERS_COLLECTION).doc(shopId).set(counters);
    this.cache.delete(this.getCacheKey(shopId));
    this.cache.delete(`${CACHE_PREFIX}all`);

    return counters;
  }
}

export const shopCountersService = new ShopCountersService();
