import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { storageService } from "./storage.service";

/**
 * GET /api/v1/storage
 * Get storage status for the shop
 */
export const getStorageStatus = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.params.shopId;
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const status = await storageService.getStorageStatus(shopId);
  return sendSuccess(res, status, "Storage status fetched successfully");
});

/**
 * GET /api/v1/storage/usage
 * Get detailed usage stats
 */
export const getDetailedUsage = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.params.shopId;
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const usage = await storageService.getDetailedUsage(shopId);
  return sendSuccess(res, usage, "Detailed storage usage fetched successfully");
});

/**
 * POST /api/v1/storage/recalculate
 * Triggers manual recalculation
 */
export const recalculateStorage = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.body.shopId || req.params.shopId;
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const result = await storageService.recalculateStorage(shopId);
  return sendSuccess(res, result, "Storage usage recalculated successfully");
});

/**
 * POST /api/v1/storage/addon
 * Purchase storage add-on (returns Razorpay link)
 */
export const purchaseAddon = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.body.shopId;
  const adminId = (req as any).user?.uid;
  const { addonSizeGB, price } = req.body;

  if (!shopId) return sendError(res, "Shop ID is required", 400);
  if (!addonSizeGB || ![1, 2, 5].includes(Number(addonSizeGB))) {
    return sendError(res, "Valid addonSizeGB (1, 2, or 5) is required", 400);
  }
  if (!price || Number(price) <= 0) {
    return sendError(res, "Valid pricing is required", 400);
  }

  const result = await storageService.purchaseStorageAddon({
    shopId,
    addonSizeGB: Number(addonSizeGB) as 1 | 2 | 5,
    price: Number(price),
    adminId,
  });

  return sendSuccess(res, result, "Storage addon checkout link generated successfully");
});

/**
 * DELETE /api/v1/storage/addon
 * Cancel active storage add-on
 */
export const cancelAddon = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.body.shopId;
  const adminId = (req as any).user?.uid;

  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const result = await storageService.cancelStorageAddon(shopId, adminId);
  return sendSuccess(res, result, "Storage addon cancelled successfully");
});

/**
 * GET /api/v1/storage/pricing
 * Get current storage pricing config
 */
export const getStoragePricing = asyncHandler(async (req: Request, res: Response) => {
  const pricing = await storageService.getStoragePricing();
  return sendSuccess(res, pricing, "Storage pricing configuration fetched successfully");
});
