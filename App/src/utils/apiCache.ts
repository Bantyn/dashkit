interface CacheEntry {
  data: any;
  timestamp: number;
}

const apiCache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes TTL

export const getCachedData = (key: string): any | null => {
  const cached = apiCache[key];
  if (!cached) return null;
  const now = Date.now();
  if (now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  // Evict expired cache
  delete apiCache[key];
  return null;
};

export const setCachedData = (key: string, data: any) => {
  apiCache[key] = {
    data,
    timestamp: Date.now(),
  };
};

export const invalidateCacheKey = (keyPrefix: string) => {
  for (const key in apiCache) {
    if (key.startsWith(keyPrefix)) {
      delete apiCache[key];
    }
  }
};

export const clearApiCache = () => {
  for (const key in apiCache) {
    delete apiCache[key];
  }
};
