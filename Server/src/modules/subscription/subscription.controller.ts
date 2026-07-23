import { Request, Response } from "express";
import { asyncHandler, sendError, sendSuccess } from "../../shared/utils/response";
import { subscriptionService } from "./subscription.service";

export const listFeatures = asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = String(req.query.activeOnly || "false") === "true";
  const features = await subscriptionService.listFeatures(activeOnly);
  return sendSuccess(res, features, "Features fetched");
});

export const getFeature = asyncHandler(async (req: Request, res: Response) => {
  const feature = await subscriptionService.getFeature(String(req.params.key));
  if (!feature) {
    return sendError(res, "Feature not found", 404);
  }
  return sendSuccess(res, feature, "Feature fetched");
});

export const createFeature = asyncHandler(async (req: Request, res: Response) => {
  const feature = await subscriptionService.createFeature(req.body);
  return sendSuccess(res, feature, "Feature created");
});

export const updateFeature = asyncHandler(async (req: Request, res: Response) => {
  const feature = await subscriptionService.updateFeature(String(req.params.key), req.body);
  if (!feature) {
    return sendError(res, "Feature not found", 404);
  }
  return sendSuccess(res, feature, "Feature updated");
});

export const deleteFeature = asyncHandler(async (req: Request, res: Response) => {
  await subscriptionService.deleteFeature(String(req.params.key));
  return sendSuccess(res, null, "Feature deleted");
});

export const resolveSubscriptionAccess = asyncHandler(async (req: Request, res: Response) => {
  const access = await subscriptionService.resolveAccessContext({
    userId: req.params.userId ? String(req.params.userId) : undefined,
    shopId: req.query.shopId ? String(req.query.shopId) : undefined,
  });
  return sendSuccess(res, access, "Subscription access resolved");
});

export const assignPlanToUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.assignPlanToUser({
    userId: String(req.params.userId),
    planId: String(req.body.planId),
    syncShopPlan: req.body.syncShopPlan !== false,
  });
  return sendSuccess(res, result, "Plan assigned to user");
});
