import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { customerCreditService } from "./customer-credit.service";

export const getCustomerCredit = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, customerId } = req.query;
  if (!shopId || !customerId) {
    return sendError(res, "shopId and customerId are required", 400);
  }
  const cc = await customerCreditService.getCustomerCredit(String(shopId), String(customerId));
  return sendSuccess(res, cc, "Customer credit fetched");
});

export const getCreditsByShop = asyncHandler(async (req: Request, res: Response) => {
  const ccs = await customerCreditService.getCreditsByShop(String(req.params.shopId));
  return sendSuccess(res, ccs, "Customer credits fetched");
});

export const adjustCredit = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, customerId, customerName, customerPhone, customerEmail, amount, type, reason, referenceId } = req.body;
  if (!shopId || !customerId || amount === undefined || !type || !reason) {
    return sendError(res, "Required fields missing", 400);
  }
  const cc = await customerCreditService.adjustCredit(
    shopId,
    customerId,
    customerName || "Customer",
    customerPhone || "",
    customerEmail || "",
    amount,
    type,
    reason,
    referenceId
  );
  return sendSuccess(res, cc, "Customer credit adjusted");
});
