import { Request, Response } from "express";
import { asyncHandler, sendError, sendSuccess } from "../../shared/utils/response";
import { branchService } from "./branch.service";

export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId || req.query.shopId || "");
  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const branches = await branchService.getBranches(shopId);
  return sendSuccess(res, branches, "Branches fetched successfully");
});

export const getBranchById = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || "");
  const branchId = String(req.params.id || "");

  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const branch = await branchService.getBranchById(shopId, branchId);
  if (!branch) {
    return sendError(res, "Branch not found", 404);
  }

  return sendSuccess(res, branch, "Branch fetched successfully");
});

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body?.shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const branch = await branchService.createBranch(req.body);
  return sendSuccess(res, branch, "Branch created successfully");
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  await branchService.updateBranch(String(req.params.id), req.body);
  return sendSuccess(res, null, "Branch updated successfully");
});

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId || "");
  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const result = await branchService.deleteBranch(String(req.params.id), shopId);
  if (!result.success) {
    return sendError(res, "Branch not found", 404);
  }

  return sendSuccess(res, null, "Branch deleted successfully");
});

export const getBranchSummaries = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId || "");
  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const summaries = await branchService.getBranchSummaries(shopId);
  return sendSuccess(res, summaries, "Branch summaries fetched successfully");
});

export const getBranchAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId || "");
  const branchId = String(req.params.branchId || "");
  if (!shopId || !branchId) {
    return sendError(res, "Shop ID and branch ID are required", 400);
  }

  const analytics = await branchService.getBranchAnalytics(
    shopId,
    branchId,
    req.query.dateRange ? String(req.query.dateRange) : "30d",
  );

  if (!analytics) {
    return sendError(res, "Branch analytics not found", 404);
  }

  return sendSuccess(res, analytics, "Branch analytics fetched successfully");
});

export const getBranchPermissions = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId || "");
  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const permissions = await branchService.getBranchPermissions(shopId);
  return sendSuccess(res, permissions, "Branch permissions fetched successfully");
});

export const getBranchActivity = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId || "");
  const branchId = String(req.params.branchId || "");
  if (!shopId || !branchId) {
    return sendError(res, "Shop ID and branch ID are required", 400);
  }

  const activity = await branchService.getBranchActivity(
    shopId,
    branchId,
    req.query.limit ? Number(req.query.limit) : 10,
  );
  return sendSuccess(res, activity, "Branch activity fetched successfully");
});
