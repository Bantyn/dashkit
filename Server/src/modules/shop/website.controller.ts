import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { shopPublicService } from "./shop-public.service";

import { db } from "../../config/firebase.config";

export const getShopConfig = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const config = shopPublicService.getShopConfig(req.shop);
  
  let cartEnabled = false;
  let subdomainEnabled = false;
  
  if (req.shop.subscriptionPlan) {
    try {
      // Check both 'plans' and 'subscription_plans' just in case
      let planDoc = await db.collection("plans").doc(req.shop.subscriptionPlan).get();
      if (!planDoc.exists) {
        planDoc = await db.collection("subscription_plans").doc(req.shop.subscriptionPlan).get();
      }
      
      if (planDoc.exists) {
        const features = planDoc.data()?.features || [];
        cartEnabled = features.includes("sell_checkout");
        subdomainEnabled = features.includes("custom_domain") || features.includes("custom_subdomain") || features.includes("domain");
      } else {
        cartEnabled = ['pro', 'custom', 'trial', 'plus'].includes(req.shop.subscriptionPlan);
        subdomainEnabled = ['pro', 'custom'].includes(req.shop.subscriptionPlan);
      }
    } catch (e) {
      console.error("Failed to fetch subscription plan for shop config:", e);
      cartEnabled = ['pro', 'custom', 'trial', 'plus'].includes(req.shop.subscriptionPlan);
      subdomainEnabled = ['pro', 'custom'].includes(req.shop.subscriptionPlan);
    }
  }

  return sendSuccess(res, { ...config, cartEnabled, subdomainEnabled }, "Shop configuration fetched successfully");
});

export const getShopCategories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const categories = await shopPublicService.getShopCategories(req.shop);
  return sendSuccess(res, categories, "Categories fetched successfully");
});

export const getShopSubcategories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const { category } = req.query;
  const subcategories = await shopPublicService.getShopSubcategories(
    req.shop,
    category ? String(category) : undefined,
  );

  return sendSuccess(res, subcategories, "Subcategories fetched successfully");
});

export const getShopProducts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const { category, minPrice, maxPrice, sort, search, collection, limit } = req.query;
  const products = await shopPublicService.getShopProducts(req.shop, {
    category: category ? String(category) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sort ? String(sort) : undefined,
    search: search ? String(search) : undefined,
    collection: collection ? String(collection) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return sendSuccess(res, products, "Products fetched successfully");
});

export const getShopOffers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const offers = await shopPublicService.getShopOffers(req.shop);
  return sendSuccess(res, offers, "Offers fetched successfully");
});

export const getShopProductById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const { id } = req.params as { id: string };
  const product = await shopPublicService.getShopProductById(req.shop, id);

  if (!product) {
    return sendError(res, "Product not found", 404);
  }

  return sendSuccess(res, product, "Product fetched successfully");
});

export const getShopSeasonalCollections = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const collections = await shopPublicService.getShopSeasonalCollections(req.shop);
  return sendSuccess(res, collections, "Seasonal collections fetched successfully");
});
