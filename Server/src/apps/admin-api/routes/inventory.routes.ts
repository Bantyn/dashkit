import { Router } from "express";
import {
  getInventory,
  updateStock,
  getLowStock,
  getInventoryHistory,
  deleteInventory,
} from "../../../modules/inventory/inventory.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get(
  "/:shopId",
  checkPermission("inventory.view"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRACKING),
  getInventory,
);
router.put(
  "/update-stock",
  checkPermission("inventory.edit"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRACKING),
  checkFeature(FEATURE_KEYS.INV_STOCK_IN_OUT),
  updateStock,
);
router.delete(
  "/:id",
  checkPermission("inventory.edit"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRACKING),
  deleteInventory,
);
router.get(
  "/low-stock/:shopId",
  checkPermission("inventory.view"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRACKING),
  getLowStock,
);
router.get(
  "/history/:shopId",
  checkPermission("inventory.view"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRACKING),
  getInventoryHistory,
);

export default router;
