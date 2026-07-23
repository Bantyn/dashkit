import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { db } from "../../config/firebase.config";

export const getHeadlessShop = asyncHandler(async (req: Request, res: Response) => {
  const shop = req.headlessShop;
  // Omit sensitive data
  const publicShopData = {
    id: shop?.id,
    shopName: shop?.shopName,
    displayName: shop?.displayName,
    description: shop?.description,
    address: shop?.address,
    theme: shop?.theme,
    socialLinks: shop?.socialLinks,
    seo: shop?.seo,
    paymentModes: shop?.paymentModes,
    customDomain: shop?.customDomain,
  };
  
  return sendSuccess(res, publicShopData, "Shop details fetched");
});

export const getHeadlessProducts = asyncHandler(async (req: Request, res: Response) => {
  const shopId = req.headlessShop?.id;
  const { limit = 20, page = 1 } = req.query;
  
  // Basic query for active products of the shop
  const productsSnapshot = await db
    .collection("products")
    .where("shopId", "==", shopId)
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .limit(Number(limit))
    .get();
    
  const products = productsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return sendSuccess(res, products, "Products fetched");
});

export const getHeadlessCategories = asyncHandler(async (req: Request, res: Response) => {
  const shopId = req.headlessShop?.id;
  
  const categoriesSnapshot = await db
    .collection("categories")
    .where("shopId", "==", shopId)
    .where("status", "==", "active")
    .get();
    
  const categories = categoriesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return sendSuccess(res, categories, "Categories fetched");
});
