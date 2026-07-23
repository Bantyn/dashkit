import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { dailyStockService } from "./daily-stock.service";

export const getTodayRecord = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { type, date } = req.query as { type: string; date?: string };
  const today = date || new Date().toISOString().substring(0, 10);
  const record = await dailyStockService.getTodayRecord(shopId, today, type || "opening");
  return sendSuccess(res, record, "Record fetched");
});

export const createRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await dailyStockService.createRecord(req.body);
  return sendSuccess(res, record, "Stock record created", 201);
});

export const updateRecord = asyncHandler(async (req: Request, res: Response) => {
  await dailyStockService.updateRecord(String(req.params.id), req.body);
  return sendSuccess(res, null, "Stock record updated");
});

export const getVarianceReport = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { date } = req.query as { date?: string };
  const today = date || new Date().toISOString().substring(0, 10);
  const report = await dailyStockService.getVarianceReport(shopId, today);
  return sendSuccess(res, report, "Variance report fetched");
});
