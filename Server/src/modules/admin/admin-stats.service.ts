import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { subscriptionService } from "../subscription/subscription.service";
import { SubscriptionPlan } from "../subscription/plan.model";

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getCollectionGroupRecent(collectionName: string, startDate: Date): Promise<any[]> {
  try {
    const snapshot = await db.collectionGroup(collectionName).where("createdAt", ">=", startDate).get();
    return snapshot.docs;
  } catch (error: any) {
    if (error?.message?.includes("FAILED_PRECONDITION") || error?.code === 9) {
      console.error(`[AdminStatsService] MISSING INDEX for ${collectionName}. Please create it! Error: ${error.message}`);
      // Returning empty array instead of doing a full database scan which takes 14+ seconds
      return [];
    }
    throw error;
  }
}

export class AdminStatsService {
  private readonly cache = new CacheService();
  private readonly REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private isAggregating = false;

  async getAggregatedStats() {
    const docRef = db.collection("admin_stats").doc("global_overview");
    const snapshot = await docRef.get();
    const now = Date.now();

    if (!snapshot.exists) {
      // First time, block and generate
      return await this.generateAndSaveStats(docRef);
    }

    const data = snapshot.data();
    const lastUpdatedAt = data?.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0;

    // Trigger background refresh if stale
    if (now - lastUpdatedAt > this.REFRESH_INTERVAL_MS && !this.isAggregating) {
      this.isAggregating = true;
      this.generateAndSaveStats(docRef)
        .catch(err => console.error("[AdminStatsService] Background aggregation failed:", err))
        .finally(() => { this.isAggregating = false; });
    }

    return data;
  }

  private async generateAndSaveStats(docRef: FirebaseFirestore.DocumentReference) {
    try {
      // console.log("[AdminStatsService] Starting heavy stats aggregation...");
      
      const now = new Date();
      const dates: Date[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
      }
      const startDate = dates[0];
      const last10DaysStart = dates[2];

      // Note: In production we'd optimize this even further (e.g. tracking increments).
      // But for now, we'll do the queries once per hour instead of on every request.
      
      // Get shops first since they're needed for active/suspended metrics
      const allShopsSnap = await db.collection("shops").get();
      const allShops = allShopsSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
      const eligibleShops = allShops.filter((shop: Record<string, unknown>) => shop?.systemType !== "platform_admin" && !shop?.isPlatformManaged);

      const activeShops = eligibleShops.filter((s: Record<string, unknown>) => String(s.status || "active").toLowerCase() === "active").length;
      const suspendedShops = eligibleShops.filter((s: Record<string, unknown>) => String(s.status || "").toLowerCase() === "suspended").length;

      const results = await Promise.all([
        db.collection("users").count().get(),
        db.collection("products").count().get(),
        db.collectionGroup("orders").count().get(),
        db.collectionGroup("invoices").count().get(),
        db.collection("shops").orderBy("createdAt", "desc").limit(6).get(),
        db.collection("staff").count().get(),
        db.collectionGroup("branches").count().get(),
        db.collection("customers").count().get(),
        db.collectionGroup("inventory").count().get(),
        db.collection("shops").where("createdAt", ">=", new Date(now.getFullYear(), now.getMonth(), 1)).count().get(),
        db.collection("users").where("createdAt", ">=", new Date(now.getFullYear(), now.getMonth(), 1)).count().get(),
        getCollectionGroupRecent("orders", new Date(now.getFullYear(), now.getMonth(), 1)).then(docs => ({ data: () => ({ count: docs.length }) })),
        getCollectionGroupRecent("invoices", new Date(now.getFullYear(), now.getMonth(), 1)).then(docs => ({ data: () => ({ count: docs.length }) })),
        subscriptionService.listPlans(false),
        db.collection("users").where("createdAt", "<", startDate).count().get(),
        db.collection("users").where("createdAt", ">=", startDate).get(),
        getCollectionGroupRecent("orders", last10DaysStart),
        getCollectionGroupRecent("invoices", last10DaysStart),
        db.collection("billing_transactions").where("createdAt", ">=", last10DaysStart).get(),
      ]);

      const [
        totalUsersSnap, totalProductsSnap, totalOrdersSnap, totalInvoicesSnap,
        recentShopsSnap, totalStaffSnap, totalBranchesSnap, totalCustomersSnap, totalInventorySnap,
        newShopsThisMonthSnap, newUsersThisMonthSnap, ordersThisMonthSnap, invoicesThisMonthSnap,
        plans, baseUsersCountSnap, recentUsersSnap, recentOrdersSnap, recentInvoicesSnap, recentTransactionsSnap
      ] = results;

      const baseShopsCount = eligibleShops.filter((shop: any) => {
        const createdAt = toDate(shop.createdAt);
        return createdAt && createdAt < startDate;
      }).length;

      const stats = {
        counts: {
          shops: eligibleShops.length,
          activeShops,
          suspendedShops,
          users: totalUsersSnap.data().count,
          products: totalProductsSnap.data().count,
          orders: totalOrdersSnap.data().count,
          invoices: totalInvoicesSnap.data().count,
          staff: totalStaffSnap.data().count,
          branches: totalBranchesSnap.data().count,
          customers: totalCustomersSnap.data().count,
          inventory: totalInventorySnap.data().count,
          newShopsThisMonth: newShopsThisMonthSnap.data().count,
          newUsersThisMonth: newUsersThisMonthSnap.data().count,
          ordersThisMonth: ordersThisMonthSnap.data().count,
          invoicesThisMonth: invoicesThisMonthSnap.data().count,
          baseUsersCount: baseUsersCountSnap.data().count,
          baseShopsCount: baseShopsCount
        },
        raw: {
          recentShops: recentShopsSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })),
          eligibleShops: eligibleShops,
          recentUsers: recentUsersSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data()),
          recentOrders: recentOrdersSnap.map((d: any) => d.data()),
          recentInvoices: recentInvoicesSnap.map((d: any) => d.data()),
          recentTransactions: recentTransactionsSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data()),
          plans: plans
        },
        dates: {
          startDate: startDate.getTime(),
          last10DaysStart: last10DaysStart.getTime(),
          datesList: dates.map(d => d.getTime())
        },
        updatedAt: new Date()
      };

      await docRef.set(stats);
      // console.log("[AdminStatsService] Heavy stats aggregation completed.");
      return stats;
    } catch (error) {
      console.error("[AdminStatsService] Failed to aggregate stats:", error);
      throw error;
    }
  }
}

export const adminStatsService = new AdminStatsService();
