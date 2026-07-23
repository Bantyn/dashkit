import { Request, Response } from "express";
import { asyncHandler, sendError, sendSuccess } from "../../shared/utils/response";
import { subscriptionPlanService } from "./subscription-plan.service";

export const listSubscriptionPlans = asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = String(req.query.activeOnly || "false") === "true";
  const plans = await subscriptionPlanService.listPlans(activeOnly);
  return sendSuccess(res, plans, "Subscription plans fetched");
});

export const getSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await subscriptionPlanService.getPlan(String(req.params.id));
  if (!plan) {
    return sendError(res, "Subscription plan not found", 404);
  }
  return sendSuccess(res, plan, "Subscription plan fetched");
});

export const createSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await subscriptionPlanService.createPlan(req.body);
  return sendSuccess(res, plan, "Subscription plan created");
});

export const updateSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await subscriptionPlanService.updatePlan(String(req.params.id), req.body);
  if (!plan) {
    return sendError(res, "Subscription plan not found", 404);
  }
  return sendSuccess(res, plan, "Subscription plan updated");
});

export const deleteSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  await subscriptionPlanService.deletePlan(String(req.params.id));
  return sendSuccess(res, null, "Subscription plan deleted");
});

export const createCustomPlanRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await subscriptionPlanService.createCustomPlanRequest(req.body);
  return sendSuccess(res, request, "Custom plan request submitted successfully");
});

// ── Admin: Custom Plan Request Management ──────────────────────────────────

export const listCustomPlanRequests = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, limit } = req.query;
  const requests = await subscriptionPlanService.listCustomPlanRequests({
    status: status ? String(status) : undefined,
    search: search ? String(search) : undefined,
    limit: limit ? parseInt(String(limit)) : undefined,
  });
  return sendSuccess(res, requests, "Custom plan requests fetched");
});

export const getCustomPlanRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await subscriptionPlanService.getCustomPlanRequest(String(req.params.id));
  if (!request) return sendError(res, "Custom plan request not found", 404);
  return sendSuccess(res, request, "Custom plan request fetched");
});

export const updateCustomPlanRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = String(req.body.status || '');
  const note = req.body.note ? String(req.body.note) : undefined;
  if (!status) return sendError(res, "Status is required", 400);
  const updated = await subscriptionPlanService.updateCustomPlanRequestStatus(
    String(req.params.id),
    status as any,
    note,
    (req as any).user?.uid
  );
  return sendSuccess(res, updated, "Status updated successfully");
});

export const generateCustomPlanQuote = asyncHandler(async (req: Request, res: Response) => {
  const finalPrice = req.body.finalPrice;
  const billingCycle = String(req.body.billingCycle || '');
  const adminNote = req.body.adminNote ? String(req.body.adminNote) : undefined;
  if (!finalPrice || !billingCycle) return sendError(res, "finalPrice and billingCycle are required", 400);
  const updated = await subscriptionPlanService.generateQuote(
    String(req.params.id),
    Number(finalPrice),
    billingCycle as any,
    adminNote,
    (req as any).user?.uid
  );
  return sendSuccess(res, updated, "Quote generated successfully");
});

export const cancelCustomPlanRequest = asyncHandler(async (req: Request, res: Response) => {
  const reason = req.body.reason ? String(req.body.reason) : undefined;
  await subscriptionPlanService.cancelCustomPlanRequest(String(req.params.id), reason, (req as any).user?.uid);
  return sendSuccess(res, null, "Custom plan request cancelled");
});

export const generateCustomPlanPaymentLink = asyncHandler(async (req: Request, res: Response) => {
  const updated = await subscriptionPlanService.generatePaymentLinkForRequest(String(req.params.id), (req as any).user?.uid);
  return sendSuccess(res, updated, "Payment link generated successfully");
});

export const syncCustomPlanPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const updated = await subscriptionPlanService.syncPaymentStatus(String(req.params.id), (req as any).user?.uid);
  return sendSuccess(res, updated, "Payment status synced successfully");
});
