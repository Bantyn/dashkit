import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { crmService } from "./crm.service";

export const getSegmentedCustomers = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await crmService.getSegmentedCustomers(shopId);
  return sendSuccess(res, data, "Customer segments fetched");
});

export const getVIPCustomers = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await crmService.getVIPCustomers(shopId);
  return sendSuccess(res, data, "VIP customers fetched");
});

export const getTodaysBirthdays = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await crmService.getTodaysBirthdays(shopId);
  return sendSuccess(res, data, "Today's birthdays fetched");
});

export const getUpcomingBirthdays = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const days = parseInt(req.query["days"] as string) || 30;
  const data = await crmService.getUpcomingBirthdays(shopId, days);
  return sendSuccess(res, data, "Upcoming birthdays fetched");
});

export const getTodaysAnniversaries = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await crmService.getTodaysAnniversaries(shopId);
  return sendSuccess(res, data, "Today's anniversaries fetched");
});

export const getUpcomingAnniversaries = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const days = parseInt(req.query["days"] as string) || 30;
  const data = await crmService.getUpcomingAnniversaries(shopId, days);
  return sendSuccess(res, data, "Upcoming anniversaries fetched");
});

export const recalculateSegments = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await crmService.recalculateSegments(shopId);
  return sendSuccess(res, data, `${data.updated} customer segments updated`);
});
