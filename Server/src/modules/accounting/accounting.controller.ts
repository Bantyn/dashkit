import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { accountingService } from "./accounting.service";

function getDateRange(req: Request): { start: string; end: string } | undefined {
  const { start, end } = req.query as { start?: string; end?: string };
  if (start && end) return { start, end };
  return undefined;
}

export const getCashBook = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await accountingService.getCashBook(shopId, getDateRange(req));
  return sendSuccess(res, data, "Cash book fetched");
});

export const getBankBook = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await accountingService.getBankBook(shopId, getDateRange(req));
  return sendSuccess(res, data, "Bank book fetched");
});

export const getLedger = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await accountingService.getLedger(shopId, getDateRange(req));
  return sendSuccess(res, data, "Ledger fetched");
});

export const getReceivables = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await accountingService.getReceivables(shopId);
  return sendSuccess(res, data, "Receivables fetched");
});

export const getPayables = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await accountingService.getPayables(shopId);
  return sendSuccess(res, data, "Payables fetched");
});

export const getGSTReport = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params["shopId"]);
  const data = await accountingService.getGSTReport(shopId, getDateRange(req));
  return sendSuccess(res, data, "GST report fetched");
});
