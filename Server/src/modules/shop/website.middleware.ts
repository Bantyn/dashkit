import { Request, Response, NextFunction } from "express";
import { db } from "../../config/firebase.config";
import { Shop } from "./shop.model";
import { tenantCacheService } from "../../infrastructure/cache/tenant-cache.service";

declare global {
  namespace Express {
    interface Request {
      shop?: Shop;
    }
  }
}

export const resolveShopMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const directShopId = (req.query.shopId as string) || (req.headers["x-shop-id"] as string) || (req.headers["shop-id"] as string);
    if (directShopId) {
      const cached = tenantCacheService.getShopBySlug(directShopId);
      if (cached) {
        req.shop = cached;
        return next();
      }
      const shopDoc = await db.collection("shops").doc(directShopId).get();
      if (shopDoc.exists) {
        const shopData = { id: shopDoc.id, ...shopDoc.data() } as Shop;
        tenantCacheService.setShopBySlug(directShopId, shopData);
        req.shop = shopData;
        return next();
      }
    }

    const normalizeSubdomain = (value?: string | null) =>
      String(value || "")
        .trim()
        .toLowerCase();

    const hostname = req.hostname;
    const parts = hostname.split(".");

    let subdomain = normalizeSubdomain(req.query.subdomain as string);
    const hasQuerySubdomain = !!subdomain;

    if (!subdomain) {
      subdomain = normalizeSubdomain(parts[0]);
    }

    const restrictedSubdomains = [
      "www",
      "app",
      "api",
      "admin",
      "clothify",
      "localhost",
    ];

    if (
      !hasQuerySubdomain &&
      (restrictedSubdomains.includes(subdomain) || parts.length < 2)
    ) {
      const origin = req.get("Origin");
      if (origin) {
        try {
          const originUrl = new URL(origin);
          const originParts = originUrl.hostname.split(".");
          if (
            originParts.length > 0 &&
            !restrictedSubdomains.includes(originParts[0])
          ) {
            subdomain = normalizeSubdomain(originParts[0]);
          } else {
            return next();
          }
        } catch (e) {
          return next();
        }
      } else {
        return next();
      }
    }

    if (restrictedSubdomains.includes(subdomain)) {
      return next();
    }

    // 1. Check for custom domain first (exact match on hostname)
    let shop: Shop | null = null;
    
    // Use the origin hostname if available, else request hostname
    const fullDomain = req.get("Origin") ? new URL(req.get("Origin")!).hostname : hostname;
    
    // Only check custom domain if it's not a clothify subdomain or restricted
    const isClothifyDomain = fullDomain.includes("clothify") || fullDomain === "localhost";
    
    if (!isClothifyDomain) {
      const cachedShopByDomain = tenantCacheService.getShopByDomain(fullDomain);
      
      if (cachedShopByDomain) {
        shop = cachedShopByDomain;
      } else {
        const domainSnapshot = await db
          .collection("shops")
          .where("customDomain", "==", fullDomain)
          .limit(1)
          .get();

        if (!domainSnapshot.empty) {
          const doc = domainSnapshot.docs[0];
          shop = tenantCacheService.setShopByDomain(
            fullDomain,
            { id: doc.id, ...doc.data() } as Shop,
          );
        }
      }
    }

    // 2. If no custom domain match, check by subdomain
    if (!shop) {
      const cachedShop = tenantCacheService.getShopBySlug(subdomain);
      shop = cachedShop
        ? cachedShop
        : await (async () => {
            const exactSnapshot = await db
              .collection("shops")
              .where("subdomain", "==", subdomain)
              .limit(1)
              .get();

            if (!exactSnapshot.empty) {
              const doc = exactSnapshot.docs[0];
              return tenantCacheService.setShopBySlug(
                subdomain,
                { id: doc.id, ...doc.data() } as Shop,
              );
            }

            // Mixed-case legacy support is handled by ensuring subdomains are lowercased upon shop creation.
            // Full collection scans are disabled to prevent security (DDOS) and billing vulnerabilities.
            return null;
          })();
    }

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    req.shop = shop;

    const isWebsiteDisabled = shop.websiteEnabled === false;
    if (isWebsiteDisabled && !req.path.endsWith("/config")) {
      return res
        .status(403)
        .json({ message: "This shop's website is currently disabled." });
    }

    next();
  } catch (error) {
    console.error("Error resolving shop:", error);
    res.status(500).json({ message: "Internal Server Error during shop resolution" });
  }
};
