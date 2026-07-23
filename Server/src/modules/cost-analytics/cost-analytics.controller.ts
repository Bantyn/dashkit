import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { costAnalyticsService } from "./cost-analytics.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const getPricingSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await costAnalyticsService.getPricingSettings();
  return sendSuccess(res, settings, "Pricing configurations fetched successfully");
});

export const updatePricingSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payload = req.body;
  const userEmail = req.user?.email || "admin@clothify.com";

  if (!payload.serviceName) {
    return sendError(res, "Service name is required to update pricing", 400);
  }

  const updatedSetting = await costAnalyticsService.updatePricingSettings(payload, userEmail);
  return sendSuccess(res, updatedSetting, "Pricing configuration updated successfully");
});

export const getPricingHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await costAnalyticsService.getPricingHistory();
  return sendSuccess(res, history, "Pricing configurations history fetched successfully");
});

export const getCostReport = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  const report = await costAnalyticsService.getSnapshot();

  if (type === "summary") {
    const summaryPayload = {
      summary: report.summary,
      alerts: report.alerts,
      generatedAt: report.generatedAt,
      version: report.version,
      isStale: report.isStale,
    };
    return sendSuccess(res, summaryPayload, "Infrastructure Cost Analytics summary fetched successfully");
  }

  return sendSuccess(res, report, "Infrastructure Cost Analytics snapshot fetched successfully");
});

export const exportCostReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await costAnalyticsService.getSnapshot();
  const csv = costAnalyticsService.exportReportCSV(report);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=platform_infra_cost_report_${new Date().toISOString().split('T')[0]}.csv`);
  return res.status(200).send(csv);
});

export const triggerSnapshotRefresh = asyncHandler(async (req: Request, res: Response) => {
  costAnalyticsService.refreshSnapshotAsync();
  return sendSuccess(res, null, "Platform cost analytics snapshot refresh triggered in the background");
});

export const getSnapshotStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await costAnalyticsService.getSnapshotStatus();
  return sendSuccess(res, status, "Platform cost analytics snapshot status fetched successfully");
});

