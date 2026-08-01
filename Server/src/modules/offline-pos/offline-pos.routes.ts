import { Router } from "express";
import {
  getCounters,
  getCounter,
  createCounter,
  updateCounter,
  deleteCounter,
  regenerateCredentials,
  getLogs,
  authenticateDesktop,
  heartbeat
} from "./offline-pos.controller";
import { checkPermission } from "../../middlewares/role.middleware";
import { checkFeature, checkLimit } from "../../middlewares/subscription.middleware";
import { FEATURE_KEYS, LIMIT_KEYS } from "../subscription/subscription.constants";

const router = Router();

// Merchant Admin Routes (Guarded by Subscription & Permissions)
router.get(
  "/counters",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkPermission("admin.access"),
  getCounters
);

router.post(
  "/counters",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkLimit(LIMIT_KEYS.OFFLINE_POS_COUNTERS_COUNT, { scope: "shop", period: "lifetime" }),
  checkPermission("admin.access"),
  createCounter
);

router.get(
  "/counters/:id",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkPermission("admin.access"),
  getCounter
);

router.put(
  "/counters/:id",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkPermission("admin.access"),
  updateCounter
);

router.delete(
  "/counters/:id",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkPermission("admin.access"),
  deleteCounter
);

router.post(
  "/counters/:id/regenerate",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkPermission("admin.access"),
  regenerateCredentials
);

router.get(
  "/logs",
  checkFeature(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS),
  checkPermission("admin.access"),
  getLogs
);

// Public / Desktop Device Auth Routes
router.post("/auth", authenticateDesktop);
router.post("/heartbeat", heartbeat);

export default router;
