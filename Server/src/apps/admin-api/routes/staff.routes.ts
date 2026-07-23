import { Router } from "express";
import {
  createStaff,
  getStaffByShop,
  getStaffById,
  updateStaff,
  deleteStaff,
  getStaffLogs,
  staffLogin,
} from "../../../modules/staff/staff.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature, checkLimit } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS, LIMIT_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post("/login", staffLogin);
router.post(
  "/",
  checkPermission("staff.create"),
  checkFeature(FEATURE_KEYS.STAFF_MANAGEMENT),
  checkLimit(LIMIT_KEYS.STAFF_COUNT, { scope: "shop", period: "lifetime" }),
  createStaff
);
router.get(
  "/shop/:shopId",
  checkPermission("staff.view"),
  checkFeature(FEATURE_KEYS.STAFF_MANAGEMENT),
  getStaffByShop,
);
router.get("/:id", checkPermission("staff.view"), checkFeature(FEATURE_KEYS.STAFF_MANAGEMENT), getStaffById);
router.put("/:id", checkPermission("staff.edit"), checkFeature(FEATURE_KEYS.STAFF_MANAGEMENT), updateStaff);
router.delete(
  "/:id",
  checkPermission("staff.delete"),
  checkFeature(FEATURE_KEYS.STAFF_MANAGEMENT),
  deleteStaff,
);
router.get(
  "/shop/:shopId/logs",
  checkPermission("staff.view"),
  checkFeature(FEATURE_KEYS.STAFF_MANAGEMENT),
  getStaffLogs,
);

export default router;
