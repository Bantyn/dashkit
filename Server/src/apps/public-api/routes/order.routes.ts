import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  trackOrder,
  verifyPayment,
} from "../../../modules/order/order.controller";
import { checkFeature, checkLimit } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS, LIMIT_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post(
  "/",
  checkFeature(FEATURE_KEYS.SELL_CHECKOUT),
  checkLimit(LIMIT_KEYS.ORDERS_PER_MONTH, { scope: "shop", period: "monthly" }),
  createOrder,
);
router.get("/my-orders", getMyOrders);
router.get("/track/:id", trackOrder);
router.post("/:id/verify-payment", verifyPayment);

export default router;
