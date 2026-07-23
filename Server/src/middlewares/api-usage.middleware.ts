import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { db } from "../config/firebase.config";
import { observabilityService } from "../modules/observability/observability.service";
import { diagnosticsLocalStorage, DiagnosticsStore } from "../shared/utils/diagnostics-context";
import { dbOperationStorage, createFreshStore } from "../infrastructure/database/database-operation-store";
import { DatabaseOperationLogger } from "../infrastructure/database/database-operation-logger";
import { liveMonitoringService } from "../modules/observability/live-monitoring.service";
import { DB_CONFIG } from "../application/repositories/providers/db-provider.config";
import { platformSettingsService } from "../modules/platform-settings/platform-settings.service";

// In-memory buffers for API request usage aggregates
const aggregatedUsage: Map<string, {
  count: number;
  success: number;
  failed: number;
  totalResponseTime: number;
  lastUpdated: Date;
}> = new Map();

const FLUSH_INTERVAL_MS = 15 * 1000; // Flush every 15 seconds
let flushTimer: NodeJS.Timeout | null = null;

// Helper to flush buffers to Firestore in batch/transaction
export async function flushBuffer() {
  if (aggregatedUsage.size === 0) {
    return;
  }

  const usageToFlush = new Map(aggregatedUsage);
  aggregatedUsage.clear();

  try {

    // 2. Flush aggregated usage statistics using transactions
    if (usageToFlush.size > 0) {
      for (const [shopId, increment] of usageToFlush.entries()) {
        const aggRef = db.collection("api_usage_aggregation").doc(shopId);

        await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
          const doc = (await transaction.get(aggRef)) as unknown as FirebaseFirestore.DocumentSnapshot;
          const data = doc.exists ? doc.data() : null;

          const now = new Date();
          let lastUpdated = data?.lastUpdated ? (data.lastUpdated.toDate?.() || new Date(data.lastUpdated)) : now;

          const sameDay = isSameDay(lastUpdated, now);
          const sameWeek = isSameWeek(lastUpdated, now);
          const sameMonth = isSameMonth(lastUpdated, now);

          const today = sameDay ? (data?.today || { count: 0, success: 0, failed: 0, totalResponseTime: 0 }) : { count: 0, success: 0, failed: 0, totalResponseTime: 0 };
          const thisWeek = sameWeek ? (data?.thisWeek || { count: 0, success: 0, failed: 0, totalResponseTime: 0 }) : { count: 0, success: 0, failed: 0, totalResponseTime: 0 };
          const thisMonth = sameMonth ? (data?.thisMonth || { count: 0, success: 0, failed: 0, totalResponseTime: 0 }) : { count: 0, success: 0, failed: 0, totalResponseTime: 0 };
          const total = data?.total || { count: 0, success: 0, failed: 0, totalResponseTime: 0 };

          today.count += increment.count;
          today.success += increment.success;
          today.failed += increment.failed;
          today.totalResponseTime += increment.totalResponseTime;

          thisWeek.count += increment.count;
          thisWeek.success += increment.success;
          thisWeek.failed += increment.failed;
          thisWeek.totalResponseTime += increment.totalResponseTime;

          thisMonth.count += increment.count;
          thisMonth.success += increment.success;
          thisMonth.failed += increment.failed;
          thisMonth.totalResponseTime += increment.totalResponseTime;

          total.count += increment.count;
          total.success += increment.success;
          total.failed += increment.failed;
          total.totalResponseTime += increment.totalResponseTime;

          transaction.set(aggRef, {
            shopId,
            today,
            thisWeek,
            thisMonth,
            total,
            lastUpdated: now
          }, { merge: true });
        }).catch((err: any) => console.error(`Transaction for shop ${shopId} failed:`, err));
      }
    }
  } catch (err) {
    console.error("Flush buffer error:", err);
  }
}

const startFlushTimer = () => {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flushBuffer();
  }, FLUSH_INTERVAL_MS);
};

// Start background flusher
startFlushTimer();

// Clean up flusher on process termination
process.once("SIGINT", () => {
  flushBuffer().finally(() => process.exit(0));
});
process.once("SIGTERM", () => {
  flushBuffer().finally(() => process.exit(0));
});

export const trackApiUsage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Prevent self-monitoring of observability routes to avoid infinite write amplification
  if (req.originalUrl?.includes("/admin/observability") || req.path?.includes("/admin/observability")) {
    return next();
  }

  const telemetrySettings = await platformSettingsService.getTelemetrySettings();
  if (!telemetrySettings.enabled) {
    return next();
  }

  const startTime = process.hrtime();
  observabilityService.incrementActiveRequests();
  liveMonitoringService.incrementActiveRequests();
  
  const store: DiagnosticsStore = {
    reads: 0,
    writes: 0,
    updates: 0,
    deletes: 0,
    collections: new Set<string>(),
    cacheHits: 0,
    cacheMisses: 0,
  };
  const multiDbStore = createFreshStore();

  diagnosticsLocalStorage.run(store, () => {
    dbOperationStorage.run(multiDbStore, () => {
    res.on("finish", () => {
      observabilityService.decrementActiveRequests();
      liveMonitoringService.decrementActiveRequests();
      try {
        const shopId = req.shopId || req.params.shopId || req.user?.shopId;
        if (!shopId) return;

        const diff = process.hrtime(startTime);
        const responseTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
        
        const branchId = req.branchId || "N/A";
        const endpoint = req.baseUrl + (req.route?.path || req.path);
        const method = req.method;
        const status = res.statusCode;
        const timestamp = new Date();
        const isSuccess = status >= 200 && status < 400;

        observabilityService.recordRequest(
          endpoint,
          method,
          responseTimeMs,
          status,
          store.reads,
          store.writes,
          store.cacheHits,
          store.cacheMisses,
          (res as any).locals?.error?.stack || (req as any).err?.stack,
          (res as any).locals?.error?.message || (req as any).err?.message
        );

        // Record request in live memory Circular Buffer
        liveMonitoringService.recordRequest({
          timestamp: timestamp.toISOString(),
          method,
          endpoint,
          statusCode: status,
          responseTime: responseTimeMs,
          shopId: String(shopId || "N/A"),
          branchId: String(branchId || "N/A"),
          supabaseReads: multiDbStore.byProvider["supabase"]?.reads || 0,
          supabaseWrites: (multiDbStore.byProvider["supabase"]?.writes || 0) + (multiDbStore.byProvider["supabase"]?.updates || 0) + (multiDbStore.byProvider["supabase"]?.deletes || 0),
          firestoreReads: multiDbStore.byProvider["firestore"]?.reads || store.reads || 0,
          firestoreWrites: (multiDbStore.byProvider["firestore"]?.writes || 0) + (multiDbStore.byProvider["firestore"]?.updates || 0) + (multiDbStore.byProvider["firestore"]?.deletes || 0) + store.writes || 0,
          cacheHits: store.cacheHits || 0,
          cacheMisses: store.cacheMisses || 0,
          databaseProvider: DB_CONFIG.PROVIDER,
          success: isSuccess
        });

        // 2. Buffer Aggregation
        let current = aggregatedUsage.get(String(shopId));
        if (!current) {
          current = { count: 0, success: 0, failed: 0, totalResponseTime: 0, lastUpdated: new Date() };
          aggregatedUsage.set(String(shopId), current);
        }
        current.count += 1;
        if (isSuccess) current.success += 1; else current.failed += 1;
        current.totalResponseTime += responseTimeMs;

        // Log diagnostics — Universal Multi-DB Summary (replaces old Firestore-only log)
        if (process.env.NODE_ENV !== "production") {
          DatabaseOperationLogger.printSummary(req, multiDbStore);
          // Fallback compact log for requests with no tracked DB ops
          const hasOps = Object.keys(multiDbStore.byProvider).length > 0;
          if (!hasOps) {
            console.log(`--------------------------------------`);
            console.log(`${method} ${req.originalUrl || req.url}`);
            console.log(`Execution:\n${responseTimeMs} ms`);
            console.log(`Reads:\n${store.reads}`);
            console.log(`Writes:\n${store.writes}`);
            const totalCache = store.cacheHits + store.cacheMisses;
            const cacheHitRate = totalCache > 0 ? ((store.cacheHits / totalCache) * 100).toFixed(1) + "%" : "N/A";
            console.log(`Cache:\n${totalCache > 0 ? (store.cacheMisses === 0 ? "HIT" : "MISS") : "N/A"} (Hits: ${store.cacheHits}, Misses: ${store.cacheMisses}, Hit Rate: ${cacheHitRate})`);
            console.log(`--------------------------------------`);
          }
        }

      } catch (err) {
        console.error("Error in trackApiUsage middleware:", err);
      }
    });

    next();
    }); // close dbOperationStorage.run
  });
};

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function isSameWeek(d1: Date, d2: Date) {
  const oneJan = new Date(d1.getFullYear(), 0, 1);
  const w1 = Math.ceil((((d1.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
  const w2 = Math.ceil((((d2.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
  return d1.getFullYear() === d2.getFullYear() && w1 === w2;
}

function isSameMonth(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
}
