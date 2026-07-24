import { Router } from "express";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrdersByShop,
  sendOrderWhatsApp,
  shopDecision,
  assignDeliveryStaff,
  deliveryDecision,
  updateDeliveryStatus,
  getStaffDeliveries,
} from "../../../modules/order/order.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/", checkPermission("orders.view"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), getOrders);
router.get("/shop/:shopId", checkPermission("orders.view"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), getOrdersByShop);
router.get("/staff-deliveries/:staffId", getStaffDeliveries);
router.get("/:id", checkPermission("orders.view"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), getOrder);
router.put("/:id/status", checkPermission("orders.edit"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), updateOrderStatus);
router.post("/:id/shop-decision", checkPermission("orders.edit"), shopDecision);
router.post("/:id/assign-delivery", checkPermission("orders.edit"), assignDeliveryStaff);
router.post("/:id/delivery-decision", deliveryDecision);
router.post("/:id/delivery-status", updateDeliveryStatus);
router.put("/:id/payment-status", checkPermission("orders.edit"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), updatePaymentStatus);
router.delete("/:id", checkPermission("orders.delete"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), deleteOrder);
router.post("/:id/send-whatsapp", checkPermission("orders.view"), checkFeature(FEATURE_KEYS.SELL_POS_BILLING), sendOrderWhatsApp);

export default router;
