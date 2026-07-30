import { Router } from "express";
import {
  getOverview,
  getProviderConfig,
  saveProviderConfig,
  testProviderConnection,
  switchDatabaseProvider,
  getHealth,
  getLogs,
  getEnv,
  backupDatabase,
  restoreDatabase,
  flushCache,
  reconnectCache,
  resetConfiguration,
  seedDatabase,
  validateSeedConfig,
  previewSeed,
  getSeedReport,
  previewCleanup,
  cleanupDatabase,
  getCleanupReport,
  runCleanupWorker,
} from "../../../modules/db-management/db-management.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/overview", checkPermission("platform.gst.manage"), getOverview);
router.get("/config/:provider", checkPermission("platform.gst.manage"), getProviderConfig);
router.post("/config/:provider", checkPermission("platform.gst.manage"), saveProviderConfig);
router.post("/test-connection/:provider", checkPermission("platform.gst.manage"), testProviderConnection);
router.post("/switch-provider", checkPermission("platform.gst.manage"), switchDatabaseProvider);
router.get("/health", checkPermission("platform.gst.manage"), getHealth);
router.get("/logs", checkPermission("platform.gst.manage"), getLogs);
router.get("/env", checkPermission("platform.gst.manage"), getEnv);
router.post("/backup/:provider", checkPermission("platform.gst.manage"), backupDatabase);
router.post("/restore/:provider", checkPermission("platform.gst.manage"), restoreDatabase);
router.post("/cache/flush", checkPermission("platform.gst.manage"), flushCache);
router.post("/cache/reconnect", checkPermission("platform.gst.manage"), reconnectCache);
router.post("/advanced/reset", checkPermission("platform.gst.manage"), resetConfiguration);

// Seeding and Cleanup Maintenance Routes
router.post("/maintenance/seed", checkPermission("platform.gst.manage"), seedDatabase);
router.post("/maintenance/validate-seed", checkPermission("platform.gst.manage"), validateSeedConfig);
router.post("/maintenance/preview-seed", checkPermission("platform.gst.manage"), previewSeed);
router.get("/maintenance/seed-report", checkPermission("platform.gst.manage"), getSeedReport);
router.post("/maintenance/preview-cleanup", checkPermission("platform.gst.manage"), previewCleanup);
router.post("/maintenance/cleanup", checkPermission("platform.gst.manage"), cleanupDatabase);
router.get("/maintenance/cleanup-report", checkPermission("platform.gst.manage"), getCleanupReport);
router.post("/maintenance/cleanup-worker/run", checkPermission("platform.gst.manage"), runCleanupWorker);

export default router;

