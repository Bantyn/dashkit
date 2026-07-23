import { Router } from "express";
import {
  getSegmentedCustomers,
  getVIPCustomers,
  getTodaysBirthdays,
  getUpcomingBirthdays,
  getTodaysAnniversaries,
  getUpcomingAnniversaries,
  recalculateSegments,
} from "../../../modules/crm/crm.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/:shopId/segments", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CRM_CUSTOMER_SEGMENTATION), getSegmentedCustomers);
router.get("/:shopId/vip", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CRM_VIP_LEADERBOARD), getVIPCustomers);
router.get("/:shopId/birthdays/today", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CRM_BIRTHDAY_WISHES), getTodaysBirthdays);
router.get("/:shopId/birthdays/upcoming", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CRM_BIRTHDAY_WISHES), getUpcomingBirthdays);
router.get("/:shopId/anniversaries/today", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CRM_BIRTHDAY_WISHES), getTodaysAnniversaries);
router.get("/:shopId/anniversaries/upcoming", checkPermission("customers.view"), checkFeature(FEATURE_KEYS.CRM_BIRTHDAY_WISHES), getUpcomingAnniversaries);
router.post("/:shopId/recalculate-segments", checkPermission("customers.edit"), checkFeature(FEATURE_KEYS.CRM_CUSTOMER_SEGMENTATION), recalculateSegments);

export default router;
