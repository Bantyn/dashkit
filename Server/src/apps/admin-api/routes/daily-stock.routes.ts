import { Router } from "express";
import { getTodayRecord, createRecord, updateRecord, getVarianceReport } from "../../../modules/daily-stock/daily-stock.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/shop/:shopId/today", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_OPENING_STOCK), getTodayRecord);
router.get("/shop/:shopId/variance", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_OPENING_STOCK), getVarianceReport);
router.post("/", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_OPENING_STOCK), createRecord);
router.put("/:id", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_OPENING_STOCK), updateRecord);

export default router;
