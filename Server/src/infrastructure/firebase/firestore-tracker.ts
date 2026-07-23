import { Firestore, CollectionReference, DocumentReference, Query, WriteBatch, Transaction, DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { recordRead, recordWrite, recordUpdate, recordDelete } from "../../shared/utils/diagnostics-context";
import { DatabaseOperationTracker } from "../database/database-operation-tracker";
import { platformSettingsService } from "../../modules/platform-settings/platform-settings.service";

interface OperationCount {
  reads: number;
  writes: number;
  deletes: number;
}

export const globalFirestoreStats = {
  readsToday: 0,
  writesToday: 0,
  deletesToday: 0,
  byCollection: {} as Record<string, { reads: number; writes: number; deletes: number }>,
  transactionCount: 0,
  avgTransactionTimeMs: 0,
  failedTransactions: 0,
  slowTransactions: 0,
  batchWrites: 0,
  retries: 0,
  locks: 0
};

// In-memory buffer to aggregate stats before flushing to DB to minimize cost
const statsBuffer: {
  [shopId: string]: {
    [collection: string]: OperationCount;
  };
} = {};

// In-memory daily aggregation so we don't need to read from DB for live metrics
export const dailyShopStats: {
  [shopId: string]: {
    reads: number;
    writes: number;
    deletes: number;
  };
} = {};

let rawDb: Firestore | null = null;
const METRICS_COLLECTION = "firestore_operations_metrics";

export function initFirestoreTracker(originalDb: any) {
  rawDb = originalDb;
  // Start periodic flush (every 5 minutes instead of 15 seconds to reduce writes)
  setInterval(flushStats, 5 * 60 * 1000);
}

function recordStat(
  shopId: string,
  collectionName: string,
  type: "reads" | "writes" | "updates" | "deletes",
  count: number,
  durationMs: number = 0
) {
  // ── Existing globalFirestoreStats (unchanged, backward compatible) ──
  if (type === "reads") {
    globalFirestoreStats.readsToday += count;
    recordRead(collectionName, count);
  } else if (type === "updates") {
    globalFirestoreStats.writesToday += count; // updates count as writes in legacy stat
    recordUpdate(collectionName, count);
  } else if (type === "deletes") {
    globalFirestoreStats.deletesToday += count;
    recordDelete(collectionName, count);
    recordWrite(collectionName, count);
  } else {
    globalFirestoreStats.writesToday += count;
    recordWrite(collectionName, count);
  }

  if (!globalFirestoreStats.byCollection[collectionName]) {
    globalFirestoreStats.byCollection[collectionName] = { reads: 0, writes: 0, deletes: 0 };
  }
  const legacyType = (type === "updates") ? "writes" : type;
  globalFirestoreStats.byCollection[collectionName][legacyType as "reads" | "writes" | "deletes"] += count;

  if (!statsBuffer[shopId]) statsBuffer[shopId] = {};
  if (!statsBuffer[shopId][collectionName]) {
    statsBuffer[shopId][collectionName] = { reads: 0, writes: 0, deletes: 0 };
  }
  statsBuffer[shopId][collectionName][legacyType as "reads" | "writes" | "deletes"] += count;

  if (!dailyShopStats[shopId]) {
    dailyShopStats[shopId] = { reads: 0, writes: 0, deletes: 0 };
  }
  dailyShopStats[shopId][legacyType as "reads" | "writes" | "deletes"] += count;

  // ── Universal tracker (new — forwards to central engine) ──
  const operation = type === "reads" ? "read"
    : type === "updates" ? "update"
    : type === "deletes" ? "delete"
    : "write";
  DatabaseOperationTracker.record("firestore", collectionName, operation as any, durationMs, true, shopId);
}

async function flushStats() {
  if (!rawDb || Object.keys(statsBuffer).length === 0) return;
  const telemetrySettings = await platformSettingsService.getTelemetrySettings();
  if (!telemetrySettings.enabled) {
    // Clear buffer without flushing
    for (const shopId in statsBuffer) delete statsBuffer[shopId];
    return;
  }

  const batch = rawDb.batch();
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const monthStr = dateStr.substring(0, 7); // YYYY-MM

  const currentBuffer = { ...statsBuffer };
  // Clear buffer immediately to avoid race conditions
  for (const shopId in statsBuffer) {
    delete statsBuffer[shopId];
  }

  try {
    for (const shopId of Object.keys(currentBuffer)) {
      for (const collectionName of Object.keys(currentBuffer[shopId])) {
        const stats = currentBuffer[shopId][collectionName];
        if (stats.reads === 0 && stats.writes === 0 && stats.deletes === 0) continue;

        // Document ID: shopId_collection_YYYY-MM-DD
        const docId = `${shopId}_${collectionName}_${dateStr}`;
        // We write to rawDb directly to bypass the proxy tracker and avoid infinite recursion
        const docRef = rawDb.collection(METRICS_COLLECTION).doc(docId);

        const incrementData: any = {};
        if (stats.reads > 0) incrementData.reads = require("firebase-admin").firestore.FieldValue.increment(stats.reads);
        if (stats.writes > 0) incrementData.writes = require("firebase-admin").firestore.FieldValue.increment(stats.writes);
        if (stats.deletes > 0) incrementData.deletes = require("firebase-admin").firestore.FieldValue.increment(stats.deletes);

        batch.set(docRef, {
          shopId,
          collectionName,
          date: dateStr,
          month: monthStr,
          updatedAt: new Date(),
          ...incrementData
        }, { merge: true });
      }
    }
    await batch.commit();
  } catch (error) {
    console.error("[FirestoreTracker] Failed to flush stats to Firestore:", error);
    // Re-buffer values on failure
    for (const shopId of Object.keys(currentBuffer)) {
      for (const collectionName of Object.keys(currentBuffer[shopId])) {
        const stats = currentBuffer[shopId][collectionName];
        recordStat(shopId, collectionName, "reads", stats.reads);
        recordStat(shopId, collectionName, "writes", stats.writes);
        recordStat(shopId, collectionName, "deletes", stats.deletes);
      }
    }
  }
}

function extractShopIdFromPath(path: string): string | null {
  const parts = path.split("/");
  // Check if shops/XYZ is in path
  const shopIdx = parts.indexOf("shops");
  if (shopIdx !== -1 && parts[shopIdx + 1]) {
    return parts[shopIdx + 1];
  }
  return null;
}

function extractShopId(path: string, data?: any): string {
  const pathShopId = extractShopIdFromPath(path);
  if (pathShopId) return pathShopId;

  if (data) {
    if (data.shopId) return String(data.shopId);
    if (data.linkedShopId) return String(data.linkedShopId);
  }
  return "platform_global";
}

function getCollectionFromPath(path: string): string {
  const parts = path.split("/");
  // Get collection name (odd indexes in a document path)
  // e.g. "products/docId" -> parts[0] is "products"
  // e.g. "shops/shopId/orders/orderId" -> parts[2] is "orders"
  if (parts.length % 2 === 0) {
    return parts[parts.length - 2];
  }
  return parts[parts.length - 1];
}

// Proxies
export function wrapFirestore(firestore: any): any {
  return new Proxy(firestore, {
    get(target, prop, receiver) {
      if (prop === "collection") {
        return (collectionName: string) => {
          const colRef = target.collection(collectionName);
          return wrapCollectionReference(colRef, collectionName);
        };
      }
      if (prop === "collectionGroup") {
        return (collectionName: string) => {
          const colGroup = target.collectionGroup(collectionName);
          return wrapQuery(colGroup, collectionName);
        };
      }
      if (prop === "doc") {
        return (docPath: string) => {
          const docRef = target.doc(docPath);
          return wrapDocumentReference(docRef, getCollectionFromPath(docPath));
        };
      }
      if (prop === "batch") {
        return () => {
          const batch = target.batch();
          return wrapWriteBatch(batch);
        };
      }
      if (prop === "runTransaction") {
        return (updateFunction: (transaction: Transaction) => Promise<any>) => {
          globalFirestoreStats.transactionCount++;
          const startTime = Date.now();
          return target.runTransaction(async (transaction: Transaction) => {
            const wrappedTransaction = wrapTransaction(transaction);
            return updateFunction(wrappedTransaction);
          })
          .then((result: any) => {
            const duration = Date.now() - startTime;
            const count = globalFirestoreStats.transactionCount;
            globalFirestoreStats.avgTransactionTimeMs = Math.round(
              (globalFirestoreStats.avgTransactionTimeMs * (count - 1) + duration) / count
            );
            if (duration > 500) {
              globalFirestoreStats.slowTransactions++;
            }
            return result;
          })
          .catch((err: any) => {
            globalFirestoreStats.failedTransactions++;
            throw err;
          });
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
  });
}

function wrapCollectionReference(colRef: any, collectionName: string): any {
  return new Proxy(colRef, {
    get(target, prop, receiver) {
      if (prop === "doc") {
        return (docId?: string) => {
          const docRef = docId ? target.doc(docId) : target.doc();
          return wrapDocumentReference(docRef, collectionName);
        };
      }
      if (prop === "add") {
        return async (data: any) => {
          const shopId = extractShopId(target.path, data);
          recordStat(shopId, collectionName, "writes", 1);
          return target.add(data);
        };
      }
      // Inherit Query methods
      if (["where", "limit", "orderBy", "startAt", "startAfter", "endAt", "endBefore"].includes(prop as string)) {
        return (...args: any[]) => {
          const newQuery = Reflect.get(target, prop, receiver).apply(target, args);
          // Store shopId metadata on query if filter matches shopId
          let shopId: string | null = null;
          if (prop === "where" && (args[0] === "shopId" || args[0] === "linkedShopId") && args[1] === "==") {
            shopId = String(args[2]);
          }
          return wrapQuery(newQuery, collectionName, shopId);
        };
      }
      if (prop === "get") {
        return async () => {
          const snapshot = await target.get();
          const count = Math.max(1, snapshot.size);
          // Extract shop ID from the retrieved documents
          let shopId = "platform_global";
          if (snapshot.size > 0) {
            const firstDoc = snapshot.docs[0].data();
            shopId = extractShopId(target.path, firstDoc);
          }
          recordStat(shopId, collectionName, "reads", count);
          return snapshot;
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
  });
}

function wrapDocumentReference(docRef: any, collectionName: string): any {
  return new Proxy(docRef, {
    get(target, prop, receiver) {
      if (prop === "get") {
        return async () => {
          const start = Date.now();
          const snapshot = await target.get();
          const shopId = extractShopId(target.path, snapshot.data());
          recordStat(shopId, collectionName, "reads", 1, Date.now() - start);
          return snapshot;
        };
      }
      if (prop === "set") {
        return async (data: any, options?: any) => {
          const start = Date.now();
          const shopId = extractShopId(target.path, data);
          const result = await target.set(data, options);
          recordStat(shopId, collectionName, "writes", 1, Date.now() - start);
          return result;
        };
      }
      if (prop === "update") {
        return async (data: any) => {
          const start = Date.now();
          const shopId = extractShopId(target.path, data);
          const result = await target.update(data);
          recordStat(shopId, collectionName, "updates", 1, Date.now() - start);
          return result;
        };
      }
      if (prop === "delete") {
        return async () => {
          const start = Date.now();
          const shopId = extractShopId(target.path);
          const result = await target.delete();
          recordStat(shopId, collectionName, "deletes", 1, Date.now() - start);
          return result;
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
  });
}

function wrapQuery(query: any, collectionName: string, initialShopId: string | null = null): any {
  let queryShopId = initialShopId;

  return new Proxy(query, {
    get(target, prop, receiver) {
      if (["where", "limit", "orderBy", "startAt", "startAfter", "endAt", "endBefore"].includes(prop as string)) {
        return (...args: any[]) => {
          const newQuery = Reflect.get(target, prop, receiver).apply(target, args);
          if (prop === "where" && (args[0] === "shopId" || args[0] === "linkedShopId") && args[1] === "==") {
            queryShopId = String(args[2]);
          }
          return wrapQuery(newQuery, collectionName, queryShopId);
        };
      }
      if (prop === "get") {
        return async () => {
          const snapshot = await target.get();
          const count = Math.max(1, snapshot.size);
          let shopId = queryShopId || "platform_global";
          if (shopId === "platform_global" && snapshot.size > 0) {
            const firstDoc = snapshot.docs[0].data();
            shopId = extractShopId(target.path || "", firstDoc);
          }
          recordStat(shopId, collectionName, "reads", count);
          return snapshot;
        };
      }
      if (prop === "count" || prop === "aggregate") {
        return () => {
          const aggQuery = target[prop]();
          return new Proxy(aggQuery, {
            get(aggTarget, aggProp) {
              if (aggProp === "get") {
                return async () => {
                  const shopId = queryShopId || "platform_global";
                  recordStat(shopId, collectionName, "reads", 1); // Count queries count as 1 read
                  return aggTarget.get();
                };
              }
              const val = Reflect.get(aggTarget, aggProp);
              return typeof val === "function" ? val.bind(aggTarget) : val;
            }
          });
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
  });
}

function wrapWriteBatch(batch: any): any {
  const pendingOperations: Array<{
    type: "writes" | "deletes";
    shopId: string;
    collection: string;
  }> = [];

  return new Proxy(batch, {
    get(target, prop, receiver) {
      if (prop === "set" || prop === "update") {
        return (...args: any[]) => {
          const docRef = args[0];
          const data = args[1];
          const shopId = extractShopId(docRef.path, data);
          const colName = getCollectionFromPath(docRef.path);
          pendingOperations.push({ type: "writes", shopId, collection: colName });
          // Forward all arguments exactly as received
          return (target[prop] as any)(...args);
        };
      }
      if (prop === "delete") {
        return (docRef: any) => {
          const shopId = extractShopId(docRef.path);
          const colName = getCollectionFromPath(docRef.path);
          pendingOperations.push({ type: "deletes", shopId, collection: colName });
          return target.delete(docRef);
        };
      }
      if (prop === "commit") {
        return async () => {
          globalFirestoreStats.batchWrites++;
          const result = await target.commit();
          // Flush pending operations on commit success
          pendingOperations.forEach((op) => {
            recordStat(op.shopId, op.collection, op.type, 1);
          });
          pendingOperations.length = 0;
          return result;
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
  });
}

function wrapTransaction(transaction: any): any {
  const pendingOperations: Array<{
    type: "reads" | "writes" | "deletes";
    shopId: string;
    collection: string;
    count: number;
  }> = [];

  return new Proxy(transaction, {
    get(target, prop, receiver) {
      if (prop === "get") {
        return async (refOrQuery: any) => {
          const snapshot = await target.get(refOrQuery);
          const colName = getCollectionFromPath(refOrQuery.path || "");
          let shopId = "platform_global";
          let count = 1;
          if (snapshot.docs) { // It's a query snapshot
            count = Math.max(1, snapshot.size);
            if (snapshot.size > 0) {
              shopId = extractShopId(refOrQuery.path || "", snapshot.docs[0].data());
            }
          } else { // Document snapshot
            shopId = extractShopId(refOrQuery.path || "", snapshot.data());
          }
          pendingOperations.push({ type: "reads", shopId, collection: colName, count });
          return snapshot;
        };
      }
      if (prop === "set" || prop === "update") {
        return (...args: any[]) => {
          const docRef = args[0];
          const data = args.length > 1 ? args[1] : undefined;
          const shopId = docRef ? extractShopId(docRef.path, data) : "unknown";
          const colName = docRef ? getCollectionFromPath(docRef.path) : "unknown";
          pendingOperations.push({ type: "writes", shopId, collection: colName, count: 1 });
          return (target as any)[prop](...args);
        };
      }
      if (prop === "delete") {
        return (docRef: any) => {
          const shopId = extractShopId(docRef.path);
          const colName = getCollectionFromPath(docRef.path);
          pendingOperations.push({ type: "deletes", shopId, collection: colName, count: 1 });
          return target.delete(docRef);
        };
      }
      // Note: The actual transaction commit/resolve is handled by firestore.runTransaction wrapper,
      // but we record the operations immediately as Node.js SDK executes them in transaction.
      // Since it could rerun on conflict, let's flush them. To prevent duplicate logs during transaction retries,
      // in production we could track retry attempts, but here we record them.
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
  });
}
