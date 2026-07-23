import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { shopService } from "./shop.service";
import { subscriptionService } from "../subscription/subscription.service";

export const checkSubdomainAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.body;
  if (!subdomain) return sendError(res, "Subdomain is required", 400);

  const result = await shopService.checkSubdomainAvailability(subdomain);
  if (!result.available && result.reason === "restricted") {
    return sendError(res, "Subdomain is restricted", 400);
  }
  if (!result.available) {
    return sendError(res, "Subdomain is already taken", 400);
  }

  return sendSuccess(res, { available: true }, "Subdomain is available");
});

export const createShop = asyncHandler(async (req: Request, res: Response) => {
  const result = await shopService.createShop(req.body);
  if (result.conflict) {
    return sendError(res, "Subdomain is already taken", 400);
  }
  return sendSuccess(res, result.shop, "Shop created successfully");
});

export const listShops = asyncHandler(async (req: Request, res: Response) => {
  const shops = await shopService.listShops({
    status: req.query.status ? String(req.query.status) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
  });
  return sendSuccess(res, shops, "Shops fetched");
});

export const getShop = asyncHandler(async (req: Request, res: Response) => {
  const shop = await shopService.getShop(String(req.params.id));
  if (!shop) return sendError(res, "Shop not found", 404);
  return sendSuccess(res, shop, "Shop fetched");
});

export const getShopFullDetails = asyncHandler(async (req: Request, res: Response) => {
  const details = await shopService.getShopFullDetails(String(req.params.id));
  if (!details) return sendError(res, "Shop not found", 404);
  return sendSuccess(res, details, "Shop full details fetched");
});

export const updateShop = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.id);
  const shop = await shopService.getShop(shopId);
  const isTrial = shop?.subscriptionPlan === "trial" || shop?.subscriptionStatus === "trial" || shop?.paymentStatus === "trial";
  
  if (req.body.customDomain && req.body.customDomain.trim() !== "") {
    if (isTrial) {
      return sendError(res, "Custom domains are locked during Free Trial. Please upgrade or start billing to connect a custom domain.", 403);
    }
    await subscriptionService.assertFeatureEnabled("web_domain", { shopId });
  }

  const result = await shopService.updateShop(shopId, req.body);
  if (result.conflict) {
    return sendError(res, "Subdomain is already taken", 400);
  }
  return sendSuccess(res, null, "Shop updated");
});

export const deleteShop = asyncHandler(async (req: Request, res: Response) => {
  await shopService.deleteShop(String(req.params.id));
  return sendSuccess(res, null, "Shop deleted");
});

export const createDeactivationRequest = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.id);
  const { reason } = req.body;
  const userId = (req as any).user?.uid || "unknown";
  
  if (!reason) return sendError(res, "Reason is required", 400);

  const shop = await shopService.getShop(shopId);
  if (!shop) return sendError(res, "Shop not found", 404);

  const request = await shopService.createDeactivationRequest(shopId, (shop as any).shopName || "Unknown Shop", reason, userId);
  return sendSuccess(res, request, "Deactivation request submitted");
});

export const createReactivationRequest = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.id);
  const userId = (req as any).user?.uid || "unknown";
  
  const shop = await shopService.getShop(shopId);
  if (!shop) return sendError(res, "Shop not found", 404);

  const request = await shopService.createReactivationRequest(shopId, (shop as any).shopName || "Unknown Shop", userId);
  return sendSuccess(res, request, "Reactivation request submitted");
});

export const getShopRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await shopService.getPendingRequests();
  return sendSuccess(res, requests, "Requests fetched");
});

export const processShopRequest = asyncHandler(async (req: Request, res: Response) => {
  const requestId = String(req.params.requestId);
  const { action } = req.body; // 'approve' | 'reject'
  
  if (action !== 'approve' && action !== 'reject') {
    return sendError(res, "Action must be 'approve' or 'reject'", 400);
  }
  
  await shopService.processRequest(requestId, action);
  return sendSuccess(res, null, `Request ${action}d successfully`);
});

export const generatePublicApiKey = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.id);
  
  await subscriptionService.assertFeatureEnabled("intg_api_access", { shopId });
  
  const newApiKey = await shopService.generatePublicApiKey(shopId);
  return sendSuccess(res, { publicApiKey: newApiKey }, "Public API Key generated successfully");
});
