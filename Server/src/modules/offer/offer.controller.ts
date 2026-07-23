import { Request, Response, NextFunction } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { offerService } from "./offer.service";

export const createOffer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const result = await offerService.createOffer(req.body);
  if (result.conflict) {
    return sendError(res, "Active coupon with this code already exists", 400);
  }
  return sendSuccess(res, result.offer, "Offer created successfully");
});

export const getOffers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const offers = await offerService.getOffers(
    String(req.params.shopId),
    req.query.type ? String(req.query.type) : undefined,
    req.query.status ? String(req.query.status) : undefined,
  );

  return sendSuccess(res, offers, "Offers fetched successfully");
});

export const updateOffer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const updatedOffer = await offerService.updateOffer(String(req.params.id), req.body);
  if (!updatedOffer) {
    return sendError(res, "Offer not found", 404);
  }
  return sendSuccess(res, updatedOffer, "Offer updated successfully");
});

export const deleteOffer = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const deleted = await offerService.deleteOffer(String(req.params.id));
  if (!deleted) {
    return sendError(res, "Offer not found", 404);
  }
  return sendSuccess(res, null, "Offer deleted successfully");
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { code, shopId, cartAmount, customerId } = req.body;
  const result = await offerService.validateCoupon(code, shopId, cartAmount, customerId);

  if (result.status === "invalid") {
    return sendError(res, "Invalid coupon code", 404);
  }
  if (result.status === "inactive") {
    return sendError(res, "Coupon is expired or not yet active", 400);
  }
  if (result.status === "limit_exceeded") {
    return sendError(res, "Coupon usage limit exceeded", 400);
  }
  if (result.status === "invalid_birthday") {
    return sendError(res, result.reason || "This coupon is only valid on your birthday", 400);
  }
  if (result.status === "min_amount") {
    return sendError(
      res,
      `Minimum cart value of ₹${result.offer?.minCalculatedAmount} required`,
      400,
    );
  }

  return sendSuccess(res, result.offer, "Coupon is valid");
});
