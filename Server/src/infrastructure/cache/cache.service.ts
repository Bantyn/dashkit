import { recordCacheHit, recordCacheMiss } from "../../shared/utils/diagnostics-context";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class CacheService {
  private static readonly store = new Map<string, CacheEntry<unknown>>();
  public static hits = 0;
  public static misses = 0;
  public static lookups = 0;
  public static totalLookupTimeMs = 0;

  get<T>(key: string): T | null {
    CacheService.lookups++;
    const start = Date.now();
    const entry = CacheService.store.get(key);
    CacheService.totalLookupTimeMs += (Date.now() - start);

    if (!entry) {
      CacheService.misses++;
      recordCacheMiss();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      CacheService.store.delete(key);
      CacheService.misses++;
      recordCacheMiss();
      return null;
    }

    CacheService.hits++;
    recordCacheHit();
    return entry.value as T;
  }

  static getStats() {
    return {
      hits: CacheService.hits,
      misses: CacheService.misses,
      lookups: CacheService.lookups,
      totalLookupTimeMs: CacheService.totalLookupTimeMs,
      size: CacheService.store.size,
      keys: Array.from(CacheService.store.keys()),
      memoryEstimateBytes: CacheService.estimateMemoryUsage(),
    };
  }

  private static estimateMemoryUsage(): number {
    let bytes = 0;
    for (const [key, entry] of CacheService.store.entries()) {
      bytes += key.length * 2;
      try {
        bytes += JSON.stringify(entry.value).length * 2;
      } catch {
        bytes += 1024;
      }
    }
    return bytes;
  }

  set<T>(key: string, value: T, ttlMs: number): T {
    CacheService.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    return value;
  }

  delete(key: string) {
    CacheService.store.delete(key);
  }

  deleteByPrefix(prefix: string) {
    for (const key of CacheService.store.keys()) {
      if (key.startsWith(prefix)) {
        CacheService.store.delete(key);
      }
    }
  }

  deleteByMatch(predicate: (key: string) => boolean) {
    for (const key of CacheService.store.keys()) {
      if (predicate(key)) {
        CacheService.store.delete(key);
      }
    }
  }

  clear() {
    CacheService.store.clear();
  }
}

