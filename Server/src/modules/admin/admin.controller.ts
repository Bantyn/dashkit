import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { adminService } from "./admin.service";

export const getAdminOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await adminService.getOverview();
  return sendSuccess(res, overview, "Admin overview fetched");
});

export const getAdminUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await adminService.listUsers(String(req.query.search || ""));
  return sendSuccess(res, users, "Admin users fetched");
});

export const getAdminAdmins = asyncHandler(async (req: Request, res: Response) => {
  const admins = await adminService.listAdmins(String(req.query.search || ""));
  return sendSuccess(res, admins, "Platform admins fetched");
});

export const getAdminTransactions = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 50);
  const transactions = await adminService.listTransactions(limit);
  return sendSuccess(res, transactions, "Admin transactions fetched");
});

export const getAdminStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await adminService.listStaff(String(req.query.search || ""));
  return sendSuccess(res, staff, "Admin staff fetched");
});

export const getAdminCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customers = await adminService.listPlatformCustomers(String(req.query.search || ""));
  return sendSuccess(res, customers, "Admin customers fetched");
});

export const getAdminActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await adminService.listActivityLogs(String(req.query.search || ""));
  return sendSuccess(res, logs, "Admin activity logs fetched");
});

export const getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.getRevenueReport();
  return sendSuccess(res, report, "Revenue report fetched");
});

export const getUsageReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.getUsageReport();
  return sendSuccess(res, report, "Usage report fetched");
});
