import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { tailorJobCardService } from "./tailor-job-card.service";

export const listJobCards = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || req.params.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const list = await tailorJobCardService.listJobCards(shopId);
  return sendSuccess(res, list, "Job cards fetched");
});

export const getJobCard = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const card = await tailorJobCardService.getJobCard(shopId, String(req.params.id));
  if (!card) return sendError(res, "Job card not found", 404);

  return sendSuccess(res, card, "Job card fetched");
});

export const createJobCard = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.body.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const { tailorId, tailorName, assignedWork, status, notes, assignedDate } = req.body;
  if (!tailorId || !tailorName || !Array.isArray(assignedWork)) {
    return sendError(res, "Missing required job card details", 400);
  }

  const card = await tailorJobCardService.createJobCard(shopId, {
    tailorId,
    tailorName,
    assignedWork,
    status: status || "assigned",
    notes,
    assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
  });

  return sendSuccess(res, card, "Job card created successfully");
});

export const updateJobCard = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.body.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const updated = await tailorJobCardService.updateJobCard(shopId, String(req.params.id), req.body);
  if (!updated) return sendError(res, "Job card not found or failed to update", 404);

  return sendSuccess(res, updated, "Job card updated successfully");
});

export const deleteJobCard = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || (req as any).user?.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const success = await tailorJobCardService.deleteJobCard(shopId, String(req.params.id));
  if (!success) return sendError(res, "Job card not found", 404);

  return sendSuccess(res, null, "Job card deleted successfully");
});
