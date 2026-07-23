import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { seasonalCollectionService } from "./seasonal-collection.service";

export const listCollections = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || req.params.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const activeOnly = req.query.activeOnly === "true";
  const list = await seasonalCollectionService.listCollections(shopId, activeOnly);
  return sendSuccess(res, list, "Seasonal collections fetched");
});

export const getCollection = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const collection = await seasonalCollectionService.getCollection(shopId, String(req.params.id));
  if (!collection) return sendError(res, "Seasonal collection not found", 404);

  return sendSuccess(res, collection, "Seasonal collection fetched");
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.body.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const { name, season, description, active, productIds } = req.body;
  if (!name || !season) {
    return sendError(res, "Name and Season are required", 400);
  }

  const collection = await seasonalCollectionService.createCollection(shopId, {
    name,
    season,
    description,
    active: active !== false,
    productIds: productIds || [],
  });

  return sendSuccess(res, collection, "Seasonal collection created successfully");
});

export const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.body.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const updated = await seasonalCollectionService.updateCollection(shopId, String(req.params.id), req.body);
  if (!updated) return sendError(res, "Seasonal collection not found", 404);

  return sendSuccess(res, updated, "Seasonal collection updated successfully");
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const success = await seasonalCollectionService.deleteCollection(shopId, String(req.params.id));
  if (!success) return sendError(res, "Seasonal collection not found", 404);

  return sendSuccess(res, null, "Seasonal collection deleted successfully");
});
