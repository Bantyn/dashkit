import { CacheService } from "./cache.service";
import { Shop } from "../../modules/shop/shop.model";

export class TenantCacheService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 5 * 60 * 1000;

  getShopIdBySlug(slug: string): string | null {
    if (!slug) return null;
    return this.cache.get<string>(`shop-slug:${slug.toLowerCase()}`) || this.cache.get<string>(`shop-slug:${slug}`);
  }

  setShopIdBySlug(slug: string, shopId: string) {
    if (!slug) return shopId;
    this.cache.set(`shop-slug:${slug.toLowerCase()}`, shopId, this.ttlMs);
    this.cache.set(`shop-slug:${slug}`, shopId, this.ttlMs);
    return shopId;
  }

  getShopBySlug(slug: string): Shop | null {
    if (!slug) return null;
    return this.cache.get<Shop>(`shop:${slug.toLowerCase()}`) || this.cache.get<Shop>(`shop:${slug}`);
  }

  setShopBySlug(slug: string, shop: Shop) {
    if (!slug) return shop;
    this.cache.set(`shop:${slug.toLowerCase()}`, shop, this.ttlMs);
    this.cache.set(`shop:${slug}`, shop, this.ttlMs);
    this.setShopIdBySlug(slug, shop.id);
    return shop;
  }

  invalidateShopSlug(slug: string) {
    if (!slug) return;
    this.cache.delete(`shop-slug:${slug}`);
    this.cache.delete(`shop-slug:${slug.toLowerCase()}`);
    this.cache.delete(`shop:${slug}`);
    this.cache.delete(`shop:${slug.toLowerCase()}`);
  }

  getShopByDomain(domain: string): Shop | null {
    if (!domain) return null;
    return this.cache.get<Shop>(`shop-domain:${domain.toLowerCase()}`) || this.cache.get<Shop>(`shop-domain:${domain}`);
  }

  setShopByDomain(domain: string, shop: Shop) {
    if (!domain) return shop;
    this.cache.set(`shop-domain:${domain.toLowerCase()}`, shop, this.ttlMs);
    this.cache.set(`shop-domain:${domain}`, shop, this.ttlMs);
    return shop;
  }

  invalidateShopDomain(domain: string) {
    if (!domain) return;
    this.cache.delete(`shop-domain:${domain}`);
    this.cache.delete(`shop-domain:${domain.toLowerCase()}`);
  }
}

export const tenantCacheService = new TenantCacheService();
