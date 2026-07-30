import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { platformSettingsService } from "./platform-settings.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const getThemeSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getThemeSettings();
  return sendSuccess(res, settings, "Theme settings fetched");
});

export const updateThemeSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.updateThemeSettings(req.body);
  return sendSuccess(res, settings, "Theme settings updated");
});

export const getBillingSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getBillingSettings();
  return sendSuccess(res, settings, "Billing settings fetched");
});

export const updateBillingSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.updateBillingSettings(req.body);
  return sendSuccess(res, settings, "Billing settings updated");
});

// ─── Platform GST Handlers ─────────────────────────────────────────────────

export const getGstSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getGstSettings();
  return sendSuccess(res, settings, "Platform GST settings fetched");
});

export const saveGstSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.uid || "system";
  const settings = await platformSettingsService.updateGstSettings(req.body, adminId);
  return sendSuccess(res, settings, "Platform GST settings saved");
});

import { createAdminNotification } from "../admin-notification/admin-notification.controller";

export const verifyPlatformGstController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.uid || "system";
  const providedGstNumber = req.body?.gstNumber || req.body?.gstin;
  try {
    const result = await platformSettingsService.verifyPlatformGst(adminId, providedGstNumber);
    
    // Create background admin notification
    createAdminNotification({
      title: `GST Status Updated: ${result.gstStatus.toUpperCase()}`,
      message: `Platform GSTIN ${result.gstNumber} status updated to ${result.gstStatus}.`,
      category: "platform",
      actionLink: "/admin/gst-verification",
    }).catch(() => {});

    return sendSuccess(res, result, `Platform GST verification ${result.gstStatus}`);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to verify GST details", 400);
  }
});

export const toggleGstCollectionController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.uid || "system";
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({ success: false, message: "'enabled' must be a boolean" });
  }

  const result = await platformSettingsService.toggleGstCollection(enabled, adminId);
  return sendSuccess(
    res,
    result,
    enabled ? "GST collection enabled" : "GST collection disabled",
  );
});

export const getCostSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getCostSettings();
  return sendSuccess(res, settings, "Platform cost protection settings fetched");
});

export const updateCostSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.uid || "system";
  const settings = await platformSettingsService.updateCostSettings(req.body, adminId);
  return sendSuccess(res, settings, "Platform cost protection settings updated");
});

export const getTelemetrySettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getTelemetrySettings();
  return sendSuccess(res, settings, "Platform telemetry settings fetched");
});

export const updateTelemetrySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.uid || "system";
  const settings = await platformSettingsService.updateTelemetrySettings(req.body, adminId);
  return sendSuccess(res, settings, "Platform telemetry settings updated");
});

export const getIntegrationSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getIntegrationSettings();
  return sendSuccess(res, settings, "Platform integration settings fetched");
});

export const updateIntegrationSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.uid || "system";
  const settings = await platformSettingsService.updateIntegrationSettings(req.body, adminId);
  return sendSuccess(res, settings, "Platform integration settings updated");
});

// ── General Settings ──────────────────────────────────────────────────────

export const getGeneralSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await platformSettingsService.getGeneralSettings();
  return sendSuccess(res, settings, "Platform general settings fetched");
});

export const updateGeneralSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await platformSettingsService.updateGeneralSettings(req.body);
  return sendSuccess(res, settings, "Platform general settings updated");
});
