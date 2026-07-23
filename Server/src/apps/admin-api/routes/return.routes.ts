import { Router } from "express";
import {
  createReturnRequest,
  getReturnRequestsByShop,
  updateReturnStatus,
  getReturnById,
  getRefundsByShop,
  sendReturnWhatsApp,
} from "../../../modules/return/return.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post("/", checkPermission("returns.create"), checkFeature(FEATURE_KEYS.SELL_RETURNS), createReturnRequest);
router.get("/shop/:shopId", checkPermission("returns.view"), checkFeature(FEATURE_KEYS.SELL_RETURNS), getReturnRequestsByShop);
router.get("/shop/:shopId/refunds", checkPermission("returns.view"), checkFeature(FEATURE_KEYS.SELL_RETURNS), getRefundsByShop);
router.get("/:id", checkPermission("returns.view"), checkFeature(FEATURE_KEYS.SELL_RETURNS), getReturnById);
router.put("/:id/status", checkPermission("returns.edit"), checkFeature(FEATURE_KEYS.SELL_RETURNS), updateReturnStatus);
router.post("/:id/send-whatsapp", checkPermission("returns.view"), checkFeature(FEATURE_KEYS.SELL_RETURNS), sendReturnWhatsApp);

export default router;
