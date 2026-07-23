/**
 * Universal Database Operation Tracker — Core Types
 * Supports Firestore, Supabase, MongoDB, PostgreSQL, MySQL, SQLite, SQL Server, and any future database.
 */

export type DbProvider =
  | "firestore"
  | "supabase"
  | "mongodb"
  | "postgresql"
  | "mysql"
  | "sqlite"
  | "sqlserver"
  | string; // allows custom future providers

export type DbOperation =
  | "read"
  | "write"
  | "update"
  | "delete"
  | "transaction"
  | "batch_write"
  | "batch_read"
  | "aggregation"
  | "count"
  | "raw_query"
  | "stored_procedure"
  | "bulk_insert"
  | "bulk_update"
  | "bulk_delete";

export interface OperationRecord {
  provider: DbProvider;
  table: string;        // Firestore collection name or SQL table name
  operation: DbOperation;
  startTime: number;    // epoch ms
  endTime: number;      // epoch ms
  durationMs: number;
  success: boolean;
  error?: string;
  shopId?: string;
}

export interface ProviderStats {
  reads: number;
  writes: number;
  updates: number;
  deletes: number;
  transactions: number;
  batchWrites: number;
  aggregations: number;
  failed: number;
  retried: number;
  totalDurationMs: number;
  maxDurationMs: number;
  minDurationMs: number;
  avgDurationMs: number;
  operations: OperationRecord[];
}

export function createEmptyProviderStats(): ProviderStats {
  return {
    reads: 0,
    writes: 0,
    updates: 0,
    deletes: 0,
    transactions: 0,
    batchWrites: 0,
    aggregations: 0,
    failed: 0,
    retried: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    minDurationMs: Infinity,
    avgDurationMs: 0,
    operations: [],
  };
}

export interface TotalStats {
  reads: number;
  writes: number;
  updates: number;
  deletes: number;
  transactions: number;
  batchWrites: number;
  aggregations: number;
  failed: number;
  totalOperations: number;
  totalDurationMs: number;
}
