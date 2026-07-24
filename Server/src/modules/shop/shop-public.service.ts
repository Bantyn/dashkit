import { db } from "../../config/firebase.config";
import { Shop } from "./shop.model";
import { shopPublicCacheService } from "./shop-public-cache.service";

export class ShopPublicService {
  getShopConfig(shop: Shop) {
    return {
      id: shop.id,
      shopName: shop.shopName,
      displayName: shop.displayName,
      description: shop.description,
      theme: shop.theme,
      pages: shop.pages,
      socialLinks: shop.socialLinks,
      address: shop.address,
      contactEmail: shop.email,
      contactPhone: shop.phone,
      phone: shop.phone,
      email: shop.email,
      gstNumber: shop.gstNumber,
      invoiceConfig: shop.invoiceConfig,
      slug: shop.subdomain,
      subdomain: shop.subdomain,
      subscriptionPlan: shop.subscriptionPlan,
      websiteEnabled: shop.websiteEnabled !== false,
      paymentModes: shop.paymentModes,
      orderAcceptance: shop.orderAcceptance,
      bankDetails: shop.bankDetails,
      upiDetails: shop.upiDetails,
      razorpay: shop.razorpay ? {
        keyId: shop.razorpay.keyId,
        connected: shop.razorpay.connected,
      } : undefined,
      googleAnalytics: shop.integrations?.googleAnalytics ? {
        measurementId: shop.integrations.googleAnalytics.measurementId,
        connected: shop.integrations.googleAnalytics.connected,
      } : undefined,
    };
  }

  async getShopProducts(
    shop: Shop,
    filters: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      search?: string;
      collection?: string;
      limit?: number;
    },
  ) {
    const cacheSuffix = JSON.stringify(filters);
    const cached = shopPublicCacheService.get<any[]>(shop.id, "products", cacheSuffix);
    if (cached) return cached;

    let query = db
      .collection("products")
      .where("shopId", "==", shop.id);

    if (filters.category) {
      query = query.where("category", "==", filters.category);
    }

    const snapshot = await query.get();
    let products = snapshot.docs
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      .filter((p: any) => p.isActive !== false);

    if (filters.minPrice || filters.maxPrice || filters.search || filters.collection) {
      products = products.filter((product: any) => {
        const price = product.price || 0;
        if (filters.minPrice !== undefined && price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = product.name?.toLowerCase().includes(searchLower);
          const descMatch = product.description?.toLowerCase().includes(searchLower);
          if (!nameMatch && !descMatch) return false;
        }

        if (filters.collection) {
          // Check if it is a real database seasonal collection ID
          if (filters.collection.startsWith("col_")) {
            // Handled separately below to support async loading safely or handled inline
          } else {
            const colLower = filters.collection.toLowerCase();
            
            // 1. Direct tag matching
            if (product.tags && Array.isArray(product.tags)) {
              const hasTag = product.tags.some((t: string) => {
                const tagLower = t.toLowerCase();
                return tagLower === colLower || 
                       tagLower.includes(colLower) || 
                       colLower.includes(tagLower);
              });
              if (hasTag) return true;
            }

            // 2. Keyword fallback
            const nameLower = (product.name || "").toLowerCase();
            const descLower = (product.description || "").toLowerCase();
            const subcatLower = (product.subcategory || "").toLowerCase();

            if (colLower === "party and events") {
              const keywords = ["party", "event", "wedding", "tuxedo", "suit", "dress", "evening", "jumpsuit", "celebration", "gown"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            if (colLower === "office looks") {
              const keywords = ["office", "work", "formal", "shirt", "blazer", "trousers", "pant", "shoes", "oxford", "derby", "loafers", "tie", "suit", "coat"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            if (colLower === "selection") {
              const keywords = ["selection", "featured", "premium", "luxury", "designer", "exclusive", "special", "classic", "signature"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            if (colLower === "online exclusive") {
              const keywords = ["online", "exclusive", "web-only", "limited"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            if (colLower === "knitwear") {
              const keywords = ["knitwear", "knit", "sweater", "cardigan", "pullover", "woolen", "hoodie", "jacket", "winter"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            if (colLower === "total look") {
              const keywords = ["total look", "co-ord", "set", "suit", "combo", "tracksuit", "outfit"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            if (colLower === "basics") {
              const keywords = ["basic", "t-shirt", "tshirt", "tee", "jeans", "denim", "polo", "casual", "everyday"];
              return keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || subcatLower.includes(kw));
            }

            return false;
          }
        }

        return true;
      });
    }

    // Handle database collections (requires async resolution)
    if (filters.collection && filters.collection.startsWith("col_")) {
      const colDoc = await db.collection("seasonal_collections").doc(filters.collection).get();
      if (colDoc.exists) {
        const colData = colDoc.data();
        const productIds = colData?.productIds || [];
        products = products.filter((p: any) => productIds.includes(p.id));
      } else {
        products = [];
      }
    }

    if (filters.sort === "price_asc") {
      products.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
    } else if (filters.sort === "price_desc") {
      products.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
    } else if (filters.sort === "newest") {
      products.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (filters.sort === "bestsellers") {
      products.sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0));
    } else if (filters.sort === "trending") {
      products.sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    if (filters.limit && Number.isFinite(filters.limit) && filters.limit > 0) {
      products = products.slice(0, filters.limit);
    }

    return shopPublicCacheService.set(shop.id, "products", products, {
      suffix: cacheSuffix,
      ttlMs: 60 * 1000,
    });
  }

  async getShopCategories(shop: Shop) {
    const cached = shopPublicCacheService.get<string[]>(shop.id, "categories");
    if (cached) return cached;

    const snapshot = await db
      .collection("products")
      .where("shopId", "==", shop.id)
      .get();

    const categories = Array.from(
      new Set(
        snapshot.docs
          .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data())
          .filter((docData: any) => docData.isActive !== false && typeof docData.category === "string" && docData.category.trim().length > 0)
          .map((docData: any) => docData.category),
      ),
    );

    return shopPublicCacheService.set(shop.id, "categories", categories, {
      ttlMs: 60 * 1000,
    });
  }

  async getShopSubcategories(shop: Shop, category?: string) {
    const cacheSuffix = category || "all";
    const cached = shopPublicCacheService.get<string[]>(shop.id, "subcategories", cacheSuffix);
    if (cached) return cached;

    let query = db
      .collection("products")
      .where("shopId", "==", shop.id);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    const subcategories = Array.from(
      new Set(
        snapshot.docs
          .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data())
          .filter((docData: any) => docData.isActive !== false && typeof docData.subcategory === "string" && docData.subcategory.trim().length > 0)
          .map((docData: any) => docData.subcategory),
      ),
    );

    return shopPublicCacheService.set(shop.id, "subcategories", subcategories, {
      suffix: cacheSuffix,
      ttlMs: 60 * 1000,
    });
  }

  async getShopOffers(shop: Shop) {
    const cached = shopPublicCacheService.get<any[]>(shop.id, "offers");
    if (cached) return cached;

    const now = new Date();
    const convertDate = (value: any) => (value?.toDate ? value.toDate() : new Date(value));

    const snapshot = await db
      .collection("offers")
      .where("shopId", "==", shop.id)
      .where("isActive", "==", true)
      .get();

    let offers = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: convertDate(data.startDate),
        endDate: convertDate(data.endDate),
      };
    });

    offers = offers.filter((offer: any) => {
      // If dates are invalid, just consider it active
      const hasStart = offer.startDate && !isNaN(offer.startDate.getTime());
      const hasEnd = offer.endDate && !isNaN(offer.endDate.getTime());
      
      const started = hasStart ? offer.startDate <= now : true;
      const notExpired = hasEnd ? offer.endDate >= now : true;
      
      return started && notExpired;
    });

    return shopPublicCacheService.set(shop.id, "offers", offers, {
      ttlMs: 60 * 1000,
    });
  }

  async getShopProductById(shop: Shop, id: string) {
    const cached = shopPublicCacheService.get<any>(shop.id, "product", id);
    if (cached) return cached;

    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists) return null;

    const product = { id: doc.id, ...doc.data() } as any;
    if (product.shopId !== shop.id || !product.isActive) {
      return null;
    }

    // Increment views
    const currentViews = product.viewCount || 0;
    await db.collection("products").doc(id).update({
      viewCount: currentViews + 1,
      updatedAt: new Date(),
    });
    product.viewCount = currentViews + 1;

    return shopPublicCacheService.set(shop.id, "product", product, {
      suffix: id,
      ttlMs: 60 * 1000,
    });
  }

  async getShopSeasonalCollections(shop: Shop) {
    const cached = shopPublicCacheService.get<any[]>(shop.id, "seasonal-collections");
    if (cached) return cached;

    const snapshot = await db
      .collection("seasonal_collections")
      .where("shopId", "==", shop.id)
      .where("active", "==", true)
      .get();

    const collections = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });

    return shopPublicCacheService.set(shop.id, "seasonal-collections", collections, {
      ttlMs: 60 * 1000,
    });
  }
}

export const shopPublicService = new ShopPublicService();
