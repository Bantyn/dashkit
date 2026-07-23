import { AsyncLocalStorage } from "async_hooks";

export interface DiagnosticsStore {
  reads: number;
  writes: number;
  updates: number;
  deletes: number;
  collections: Set<string>;
  cacheHits: number;
  cacheMisses: number;
}

export const diagnosticsLocalStorage = new AsyncLocalStorage<DiagnosticsStore>();

export function recordRead(collection: string, count: number) {
  const store = diagnosticsLocalStorage.getStore();
  if (store) {
    store.reads += count;
    store.collections.add(collection);
  }
}

export function recordWrite(collection: string, count: number) {
  const store = diagnosticsLocalStorage.getStore();
  if (store) {
    store.writes += count;
    store.collections.add(collection);
  }
}

export function recordUpdate(collection: string, count: number) {
  const store = diagnosticsLocalStorage.getStore();
  if (store) {
    store.updates = (store.updates ?? 0) + count;
    store.collections.add(collection);
  }
}

export function recordDelete(collection: string, count: number) {
  const store = diagnosticsLocalStorage.getStore();
  if (store) {
    store.deletes = (store.deletes ?? 0) + count;
    store.collections.add(collection);
  }
}

export function recordCacheHit() {
  const store = diagnosticsLocalStorage.getStore();
  if (store) {
    store.cacheHits++;
  }
}

export function recordCacheMiss() {
  const store = diagnosticsLocalStorage.getStore();
  if (store) {
    store.cacheMisses++;
  }
}
