import { Router } from "express";
import { getTransfers, createTransfer } from "../../../modules/stock-transfer/stock-transfer.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get(
  "/:shopId",
  checkPermission("inventory.view"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRANSFER),
  getTransfers
);

router.post(
  "/",
  checkPermission("inventory.edit"),
  checkFeature(FEATURE_KEYS.INV_STOCK_TRANSFER),
  createTransfer
);

export default router;
