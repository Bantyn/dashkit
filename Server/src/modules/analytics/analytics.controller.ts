import { Request, Response } from "express";
import { sendSuccess, sendError, asyncHandler } from "../../shared/utils/response";
import { analyticsService } from "./analytics.service";

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const shopId = req.params.shopId ? String(req.params.shopId) : "";
  const staffId = req.query.staffId ? String(req.query.staffId) : undefined;
  const period = req.query.period ? String(req.query.period) : "this_month";
  const branchId = (req as any).branchId || undefined;

  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const dashboardData = await analyticsService.getDashboardStats(shopId, staffId, period, branchId);
  return sendSuccess(res, dashboardData, "Dashboard data fetched successfully");
});

export const getStaffLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const shopId = req.params.shopId ? String(req.params.shopId) : "";
  const branchId = (req as any).branchId || undefined;

  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  const leaderboard = await analyticsService.getStaffLeaderboard(shopId, branchId);
  return sendSuccess(res, leaderboard, "Staff leaderboard fetched successfully");
});

export const getReportData = asyncHandler(async (req: Request, res: Response) => {
  const shopId = req.params.shopId ? String(req.params.shopId) : "";
  const reportKey = req.params.reportKey ? String(req.params.reportKey) : "";
  const branchId = (req as any).branchId || undefined;

  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  if (!reportKey) {
    return sendError(res, "Report key is required", 400);
  }

  const reportData = await analyticsService.getReportData(shopId, reportKey as any, {
    dateRange: req.query.dateRange ? String(req.query.dateRange) : "30d",
    segment: req.query.segment ? String(req.query.segment) : "all",
    channel: req.query.channel ? String(req.query.channel) : "all",
  }, branchId);

  return sendSuccess(res, reportData, "Report data fetched successfully");
});

export const getAnalyticsPageData = asyncHandler(async (req: Request, res: Response) => {
  const shopId = req.params.shopId ? String(req.params.shopId) : "";
  const pageKey = req.params.pageKey ? String(req.params.pageKey) : "";
  const branchParam = req.query.branch ? String(req.query.branch) : "all";
  const branchId = (req as any).branchId || (branchParam !== 'all' ? branchParam : undefined);

  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  if (!pageKey) {
    return sendError(res, "Analytics page key is required", 400);
  }

  const analyticsData = await analyticsService.getAnalyticsPageData(shopId, pageKey as any, {
    dateRange: req.query.dateRange ? String(req.query.dateRange) : "30d",
    branch: branchId || "all",
  }, (req as any).branchId || undefined);

  return sendSuccess(res, analyticsData, "Analytics page data fetched successfully");
});
