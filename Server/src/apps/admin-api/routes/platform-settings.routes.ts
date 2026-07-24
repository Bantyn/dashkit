import { Router } from "express";
import {
  getBillingSettings,
  getThemeSettings,
  updateBillingSettings,
  updateThemeSettings,
  getGstSettings,
  saveGstSettings,
  verifyPlatformGstController,
  toggleGstCollectionController,
  getCostSettings,
  updateCostSettings,
  getTelemetrySettings,
  updateTelemetrySettings,
  getIntegrationSettings,
  updateIntegrationSettings,
  getGeneralSettings,
  updateGeneralSettings,
} from "../../../modules/platform-settings/platform-settings.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

// Theme settings
router.get("/themes", checkPermission("themes.view"), getThemeSettings);
router.put("/themes", checkPermission("themes.edit"), updateThemeSettings);

// Billing settings
router.get("/billing", checkPermission("billing.view"), getBillingSettings);
router.put("/billing", checkPermission("billing.edit"), updateBillingSettings);

// Cost Protection thresholds
router.get("/cost-protection", checkPermission("billing.view"), getCostSettings);
router.put("/cost-protection", checkPermission("billing.edit"), updateCostSettings);

// Platform GST settings — Super Admin only
router.get("/gst", checkPermission("platform.gst.manage"), getGstSettings);
router.put("/gst", checkPermission("platform.gst.manage"), saveGstSettings);
router.post("/gst/verify", checkPermission("platform.gst.manage"), verifyPlatformGstController);
router.patch("/gst/toggle", checkPermission("platform.gst.manage"), toggleGstCollectionController);

// Telemetry & Observability settings
router.get("/telemetry", checkPermission("platform.settings.manage"), getTelemetrySettings);
router.put("/telemetry", checkPermission("platform.settings.manage"), updateTelemetrySettings);

// API Integrations settings
router.get("/integrations", checkPermission("platform.settings.manage"), getIntegrationSettings);
router.put("/integrations", checkPermission("platform.settings.manage"), updateIntegrationSettings);

// General settings (platform name, support email, admin notification email)
router.get("/general", checkPermission("platform.settings.manage"), getGeneralSettings);
router.put("/general", checkPermission("platform.settings.manage"), updateGeneralSettings);

export default router;
