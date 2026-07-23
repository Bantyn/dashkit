import { Router } from "express";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  deleteAllAdminNotifications,
  createAdminNotificationEndpoint,
} from "../../../modules/admin-notification/admin-notification.controller";

const router = Router();

// GET    /superadmin/notifications
router.get("/", getAdminNotifications);

// POST   /superadmin/notifications  (manual / test)
router.post("/", createAdminNotificationEndpoint);

// PATCH  /superadmin/notifications/mark-all-read
router.patch("/mark-all-read", markAllAdminNotificationsRead);

// PATCH  /superadmin/notifications/:id/read
router.patch("/:id/read", markAdminNotificationRead);

// DELETE /superadmin/notifications/all
router.delete("/all", deleteAllAdminNotifications);

// DELETE /superadmin/notifications/:id
router.delete("/:id", deleteAdminNotification);

export default router;
