/**
 * Universal Database Operation Store
 * Per-request AsyncLocalStorage store — automatically resets after each HTTP request.
 * Thread-safe. No memory leaks.
 */

import { AsyncLocalStorage } from "async_hooks";
import { DbProvider, ProviderStats, TotalStats, createEmptyProviderStats } from "./database-operation-types";

export interface MultiDbStore {
  byProvider: Record<string, ProviderStats>;  // keyed by DbProvider string
  requestStart: number;                        // epoch ms when request began
}

export const dbOperationStorage = new AsyncLocalStorage<MultiDbStore>();

/**
 * Creates a fresh empty store for each incoming HTTP request.
 */
export function createFreshStore(): MultiDbStore {
  return {
    byProvider: {},
    requestStart: Date.now(),
  };
}

/**
 * Returns the current request-scoped store, or undefined if called outside a request context.
 */
export function getCurrentStore(): MultiDbStore | undefined {
  return dbOperationStorage.getStore();
}

/**
 * Returns or creates a ProviderStats bucket for a given provider in the current store.
 */
export function getOrCreateProviderBucket(store: MultiDbStore, provider: DbProvider): ProviderStats {
  if (!store.byProvider[provider]) {
    store.byProvider[provider] = createEmptyProviderStats();
  }
  return store.byProvider[provider];
}

/**
 * Computes aggregate totals across all providers in the current store.
 */
export function computeTotals(store: MultiDbStore): TotalStats {
  const totals: TotalStats = {
    reads: 0,
    writes: 0,
    updates: 0,
    deletes: 0,
    transactions: 0,
    batchWrites: 0,
    aggregations: 0,
    failed: 0,
    totalOperations: 0,
    totalDurationMs: 0,
  };

  for (const stats of Object.values(store.byProvider)) {
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
