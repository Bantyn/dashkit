import { Router } from "express";
import {
  getNotificationsByShop,
  markAsRead,
  markAllAsRead,
  getTemplates,
  saveTemplate,
  updateTemplate,
  getNotificationLogs,
  sendTestNotification,
  deleteNotification,
  deleteAllNotifications,
} from "../../../modules/notification/notification.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/shop/:shopId", checkPermission("notifications.view"), getNotificationsByShop);
router.put("/shop/:shopId/read-all", checkPermission("notifications.view"), markAllAsRead);
router.delete("/shop/:shopId/delete-all", checkPermission("notifications.view"), deleteAllNotifications);
router.patch("/:id/read", checkPermission("notifications.view"), markAsRead);
router.delete("/:id", checkPermission("notifications.view"), deleteNotification);

// Templates & Logs
router.get("/templates", checkPermission("notifications.view"), checkFeature(FEATURE_KEYS.MKTG_TEMPLATES), getTemplates);
router.post("/templates", checkPermission("notifications.edit"), checkFeature(FEATURE_KEYS.MKTG_TEMPLATES), saveTemplate);
router.put("/templates/:id", checkPermission("notifications.edit"), checkFeature(FEATURE_KEYS.MKTG_TEMPLATES), updateTemplate);
router.get("/logs", checkPermission("notifications.view"), checkFeature(FEATURE_KEYS.MKTG_TEMPLATES), getNotificationLogs);
router.post("/send-test", checkPermission("notifications.edit"), checkFeature(FEATURE_KEYS.MKTG_TEMPLATES), sendTestNotification);

export default router;
