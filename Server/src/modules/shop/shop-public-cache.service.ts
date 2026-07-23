import { CacheService } from "../../infrastructure/cache/cache.service";

type PublicCacheOptions = {
  suffix?: string;
  ttlMs?: number;
};

export class ShopPublicCacheService {
  private readonly cache = new CacheService();
  private readonly defaultTtlMs = 60 * 1000;

  private getKey(shopId: string, resource: string, suffix?: string) {
    return `public:${shopId}:${resource}:${suffix || "default"}`;
  }

  get<T>(shopId: string, resource: string, suffix?: string) {
    return this.cache.get<T>(this.getKey(shopId, resource, suffix));
  }

  set<T>(shopId: string, resource: string, value: T, options: PublicCacheOptions = {}) {
    return this.cache.set(
      this.getKey(shopId, resource, options.suffix),
      value,
      options.ttlMs || this.defaultTtlMs,
    );
  }

  clear(shopId: string, resource?: string) {
    if (!resource) return;
    this.cache.delete(this.getKey(shopId, resource));
  }
}

export const shopPublicCacheService = new ShopPublicCacheService();
