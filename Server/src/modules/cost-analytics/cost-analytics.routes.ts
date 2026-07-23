import { Router } from "express";
import {
  getCostReport,
  exportCostReport,
  getPricingSettings,
  updatePricingSettings,
  getPricingHistory,
  triggerSnapshotRefresh,
  getSnapshotStatus,
} from "./cost-analytics.controller";
import { checkPermission } from "../../middlewares/role.middleware";

const router = Router();

// Pricing Configurations
router.get("/pricing", checkPermission("billing.view"), getPricingSettings);
router.put("/pricing", checkPermission("billing.edit"), updatePricingSettings);
router.get("/pricing/history", checkPermission("billing.view"), getPricingHistory);

// Cost Reports
router.get("/report", checkPermission("overview.view"), getCostReport);
router.get("/report/export", checkPermission("overview.view"), exportCostReport);
router.post("/report/refresh", checkPermission("overview.view"), triggerSnapshotRefresh);
router.get("/report/status", checkPermission("overview.view"), getSnapshotStatus);

export default router;
