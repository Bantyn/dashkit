/**
 * Universal Database Operation Context Helpers
 *
 * Lightweight helpers for database adapters to record operations.
 * Each adapter (Firestore, Supabase, MongoDB, SQL, etc.) uses these
 * functions — no direct imports from the tracker engine needed.
 *
 * Usage in any adapter:
 *
 *   const start = startDbOperation();
 *   try {
 *     const result = await supabase.from("products").select("*");
 *     recordDbOperation("supabase", "products", "read", Date.now() - start, true, shopId);
 *     return result;
 *   } catch (err: any) {
 *     recordDbOperation("supabase", "products", "read", Date.now() - start, false, shopId, err.message);
 *     throw err;
 *   }
 */

import { DatabaseOperationTracker } from "./database-operation-tracker";
import { DbOperation, DbProvider } from "./database-operation-types";

/**
 * Returns the current epoch timestamp in ms.
 * Call this BEFORE executing the database operation.
 */
export function startDbOperation(): number {
  return Date.now();
}

/**
 * Records a completed database operation into the tracker.
 *
 * @param provider   — "firestore" | "supabase" | "mongodb" | "postgresql" | etc.
 * @param table      — collection / table name
 * @param operation  — operation type: "read" | "write" | "update" | "delete" | etc.
 * @param durationMs — elapsed ms (Date.now() - startTime)
 * @param success    — true if succeeded, false if threw
 * @param shopId     — optional shop isolation context
 * @param error      — optional error message
 */
export function recordDbOperation(
  provider: DbProvider,
  table: string,
  operation: DbOperation,
  durationMs: number,
  success: boolean,
  shopId?: string,
  error?: string
): void {
  DatabaseOperationTracker.record(provider, table, operation, durationMs, success, shopId, error);
}

/**
 * Convenience wrapper: executes an async database operation and automatically
 * records it into the tracker on both success and failure.
 *
 * @example
 *   const result = await trackDbOperation(
 *     "supabase", "products", "read", shopId,
 *     () => supabase.from("products").select("*")
 *   );
 */
export async function trackDbOperation<T>(
  provider: DbProvider,
  table: string,
  operation: DbOperation,
  shopId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const start = startDbOperation();
  try {
    const result = await fn();
    recordDbOperation(provider, table, operation, Date.now() - start, true, shopId);
    return result;
  } catch (err: any) {
    recordDbOperation(provider, table, operation, Date.now() - start, false, shopId, err?.message);
    throw err;
  }
}

/**
 * Records a retry attempt for a given provider.
 */
export function recordRetry(provider: DbProvider): void {
  DatabaseOperationTracker.recordRetry(provider);
}

/**
 * Returns the current request-scoped tracker store.
 * Useful for middleware to read the full summary at request end.
 */
export { getCurrentStore } from "./database-operation-store";
