/**
 * Universal Database Operation Tracker — Central Engine
 *
 * This is the SINGLE source of truth for all database operation metrics.
 * All database adapters (Firestore, Supabase, MongoDB, PostgreSQL, etc.)
 * call this class to report their operations.
 *
 * Design Principles:
 *  - Never estimate. Never guess. Track only actual executed operations.
 *  - Lightweight: minimal allocations, no cloning.
 *  - Request-scoped: per-request store via AsyncLocalStorage.
 *  - Safe for concurrent requests.
 */

import {
  DbProvider,
  DbOperation,
  OperationRecord,
  ProviderStats,
  TotalStats,
} from "./database-operation-types";
import {
  dbOperationStorage,
  getCurrentStore,
  getOrCreateProviderBucket,
  computeTotals,
  MultiDbStore,
} from "./database-operation-store";

/**
 * Global (process-lifetime) cumulative stats per provider.
 * Survives across requests — useful for Admin analytics dashboards.
 */
const globalStats: Record<string, ProviderStats> = {};

function getOrCreateGlobalBucket(provider: DbProvider): ProviderStats {
  if (!globalStats[provider]) {
    globalStats[provider] = {
      reads: 0, writes: 0, updates: 0, deletes: 0,
      transactions: 0, batchWrites: 0, aggregations: 0,
      failed: 0, retried: 0,
      totalDurationMs: 0, maxDurationMs: 0, minDurationMs: Infinity, avgDurationMs: 0,
      operations: [], // global keeps last 1000 for analytics
    };
  }
  return globalStats[provider];
}

function updateTimingStats(bucket: ProviderStats, durationMs: number) {
  bucket.totalDurationMs += durationMs;
  if (durationMs > bucket.maxDurationMs) bucket.maxDurationMs = durationMs;
  if (durationMs < bucket.minDurationMs) bucket.minDurationMs = durationMs;
  const opCount = bucket.reads + bucket.writes + bucket.updates + bucket.deletes + bucket.failed;
  bucket.avgDurationMs = opCount > 0 ? Math.round(bucket.totalDurationMs / opCount) : 0;
}

export class DatabaseOperationTracker {
  /**
   * Record a completed database operation.
   * Called by every database adapter after an operation completes.
   *
   * @param provider   — "firestore" | "supabase" | "mongodb" | "postgresql" | etc.
   * @param table      — collection/table name
   * @param operation  — "read" | "write" | "update" | "delete" | etc.
   * @param durationMs — how long the operation took in milliseconds
   * @param success    — true if operation succeeded, false if it threw/failed
   * @param shopId     — optional shop isolation context
   * @param error      — optional error message on failure
   */
  static record(
    provider: DbProvider,
    table: string,
    operation: DbOperation,
    durationMs: number,
    success: boolean,
    shopId?: string,
    error?: string
  ): void {
    const record: OperationRecord = {
      provider,
      table,
      operation,
      startTime: Date.now() - durationMs,
      endTime: Date.now(),
      durationMs,
      success,
      shopId,
      error,
    };

    // ── Per-request store (request-scoped, resets after response) ──
    const store = getCurrentStore();
    if (store) {
      const bucket = getOrCreateProviderBucket(store, provider);
      this._applyToBucket(bucket, operation, durationMs, success);
      // Keep last 100 operations per request for detailed logging
      if (bucket.operations.length < 100) {
        bucket.operations.push(record);
      }
    }

    // ── Global store (process-lifetime, for Admin analytics) ──
    const global = getOrCreateGlobalBucket(provider);
    this._applyToBucket(global, operation, durationMs, success);
    updateTimingStats(global, durationMs);
    // Keep last 1000 global records for analytics queries
    if (global.operations.length >= 1000) global.operations.shift();
    global.operations.push(record);
  }

  private static _applyToBucket(
    bucket: ProviderStats,
    operation: DbOperation,
    durationMs: number,
    success: boolean
  ): void {
    if (!success) {
      bucket.failed++;
      return;
    }
    switch (operation) {
      case "read":            bucket.reads++;         break;
      case "write":
      case "bulk_insert":     bucket.writes++;        break;
      case "update":
      case "bulk_update":     bucket.updates++;       break;
      case "delete":
      case "bulk_delete":     bucket.deletes++;       break;
      case "transaction":     bucket.transactions++;  break;
      case "batch_write":     bucket.batchWrites++;   break;
      case "aggregation":
      case "count":           bucket.aggregations++;  break;
      // raw_query / stored_procedure contribute to writes as a safe default
      default:                bucket.writes++;        break;
    }
    updateTimingStats(bucket, durationMs);
  }

  /**
   * Returns the current request-scoped totals across all providers.
   * Returns zeros if called outside request context.
   */
  static getTotals(): TotalStats {
    const store = getCurrentStore();
    if (!store) {
      return {
        reads: 0, writes: 0, updates: 0, deletes: 0,
        transactions: 0, batchWrites: 0, aggregations: 0,
        failed: 0, totalOperations: 0, totalDurationMs: 0,
      };
    }
    return computeTotals(store);
  }

  /**
   * Returns per-request stats for a specific provider.
   */
  static getByProvider(provider: DbProvider): ProviderStats | null {
    const store = getCurrentStore();
    if (!store) return null;
    return store.byProvider[provider] ?? null;
  }

  /**
   * Returns the full current request store.
   */
  static getStore(): MultiDbStore | undefined {
    return getCurrentStore();
  }

  /**
   * Returns global (process-lifetime) stats for a provider.
   * Used by Admin analytics dashboard.
   */
  static getGlobalStats(): Record<string, ProviderStats> {
    return globalStats;
  }

  /**
   * Returns global totals across all providers for Admin analytics.
   */
  static getGlobalTotals(): TotalStats {
    const totals: TotalStats = {
      reads: 0, writes: 0, updates: 0, deletes: 0,
      transactions: 0, batchWrites: 0, aggregations: 0,
      failed: 0, totalOperations: 0, totalDurationMs: 0,
    };
    for (const stats of Object.values(globalStats)) {
      totals.reads          += stats.reads;
      totals.writes         += stats.writes;
      totals.updates        += stats.updates;
      totals.deletes        += stats.deletes;
      totals.transactions   += stats.transactions;
      totals.batchWrites    += stats.batchWrites;
      totals.aggregations   += stats.aggregations;
      totals.failed         += stats.failed;
      totals.totalDurationMs += stats.totalDurationMs;
      totals.totalOperations += stats.reads + stats.writes + stats.updates + stats.deletes;
    }
    return totals;
  }

  /**
   * Increment retried operations for a provider (called by retry logic in adapters).
   */
  static recordRetry(provider: DbProvider): void {
    const store = getCurrentStore();
    if (store) {
      const bucket = getOrCreateProviderBucket(store, provider);
      bucket.retried++;
    }
    const global = getOrCreateGlobalBucket(provider);
    global.retried++;
  }
}
