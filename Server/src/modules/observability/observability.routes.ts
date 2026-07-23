import { Router } from "express";
import { getLiveMetrics, getHistoricalSnapshots, getPlatformHealth } from "./observability.controller";
import { checkPermission } from "../../middlewares/role.middleware";

const router = Router();

router.get("/metrics", checkPermission("overview.view"), getLiveMetrics);
router.get("/history", checkPermission("overview.view"), getHistoricalSnapshots);
router.get("/platform-health", checkPermission("overview.view"), getPlatformHealth);

export default router;
