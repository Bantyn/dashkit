import { CacheService } from "./cache.service";
import { Shop } from "../../modules/shop/shop.model";

export class TenantCacheService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 5 * 60 * 1000;

  getShopIdBySlug(slug: string): string | null {
    return this.cache.get<string>(`shop-slug:${slug}`);
  }

  setShopIdBySlug(slug: string, shopId: string) {
    this.cache.set(`shop-slug:${slug}`, shopId, this.ttlMs);
    return shopId;
  }

  getShopBySlug(slug: string): Shop | null {
    return this.cache.get<Shop>(`shop:${slug}`);
  }

  setShopBySlug(slug: string, shop: Shop) {
    this.cache.set(`shop:${slug}`, shop, this.ttlMs);
    this.setShopIdBySlug(slug, shop.id);
    return shop;
  }

  invalidateShopSlug(slug: string) {
    this.cache.delete(`shop-slug:${slug}`);
    this.cache.delete(`shop:${slug}`);
  }

  getShopByDomain(domain: string): Shop | null {
    return this.cache.get<Shop>(`shop-domain:${domain}`);
  }

  setShopByDomain(domain: string, shop: Shop) {
    this.cache.set(`shop-domain:${domain}`, shop, this.ttlMs);
    return shop;
  }

  invalidateShopDomain(domain: string) {
    this.cache.delete(`shop-domain:${domain}`);
  }
}

export const tenantCacheService = new TenantCacheService();
