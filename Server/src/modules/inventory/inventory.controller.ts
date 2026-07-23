import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { inventoryService } from "./inventory.service";

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const enrichedInventory = await inventoryService.getInventory(String(req.params.shopId));
  return sendSuccess(res, enrichedInventory, "Inventory fetched");
});

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  await inventoryService.updateStock(req.body);
  return sendSuccess(res, null, "Stock updated and logged");
});

export const getInventoryHistory = asyncHandler(async (req: Request, res: Response) => {
  const enriched = await inventoryService.getInventoryHistory(String(req.params.shopId));
  return sendSuccess(res, enriched, "Inventory history fetched");
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const enriched = await inventoryService.getLowStock(String(req.params.shopId));
  return sendSuccess(res, enriched, "Low stock items fetched");
});

export const deleteInventory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const shopId: string = String(req.query.shopId || req.body.shopId || (req as any).user?.shopId || "");
  await inventoryService.deleteInventoryItem(String(id), shopId);
  return sendSuccess(res, null, "Inventory record deleted successfully");
});
