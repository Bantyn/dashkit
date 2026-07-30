import { Request, Response } from "express";
import { db } from "../../config/firebase.config";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { CacheService } from "../../infrastructure/cache/cache.service";
import {
  AdminNotification,
  AdminNotificationCategory,
  AdminNotificationPriority,
  CATEGORY_META,
} from "./admin-notification.model";

const COLLECTION = "admin_notifications";
const cache = new CacheService();
const CACHE_KEY = "admin_notifications";
const CACHE_TTL = 10 * 1000; // 10 seconds

function invalidateCache() {
  cache.deleteByPrefix(CACHE_KEY);
}

// ─── Internal: Create Admin Notification (used by backend services) ───────────
export const createAdminNotification = async (
  data: Pick<AdminNotification, "title" | "message" | "category"> & {
    actionLink?: string;
    metadata?: Record<string, any>;
  }
): Promise<AdminNotification> => {
  const meta = CATEGORY_META[data.category] || CATEGORY_META.platform;
  const ref = db.collection(COLLECTION).doc();

  const notification: AdminNotification = {
    id: ref.id,
    title: data.title,
    message: data.message,
    category: data.category,
    priority: meta.priority,
    icon: meta.icon,
    status: "unread",
    actionLink: data.actionLink || undefined,
    metadata: data.metadata || {},
    createdAt: new Date(),
    readAt: null,
  };

  await ref.set(notification);
  invalidateCache();
  return notification;
};

// ─── Seed Initial System Admin Notifications if Empty ─────────────────────────
async function seedInitialAdminNotifications() {
  const defaultNotifs = [
    {
      title: "Platform Admin System Operational",
      message: "Platform Admin dashboard is operational. Real-time observability, security logging, and monitoring active.",
      category: "system_update" as AdminNotificationCategory,
      actionLink: "/admin/dashboard",
    },
    {
      title: "GST Verification Module Active",
      message: "Pluggable GST verification system initialized with Local Checksum, Sandbox, & Self-Declaration fallback.",
      category: "platform" as AdminNotificationCategory,
      actionLink: "/admin/gst-verification",
    },
    {
      title: "Security & Lockout Engine Ready",
      message: "RBAC permissions, JWT authentication, and progressive login lockout rules are enforced.",
      category: "security" as AdminNotificationCategory,
      actionLink: "/roles",
    },
  ];

  for (const n of defaultNotifs) {
    await createAdminNotification(n);
  }
}

// ─── GET /admin-notifications ──────────────────────────────────────────────────
export const getAdminNotifications = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const category = req.query.category as AdminNotificationCategory | undefined;
  const status = req.query.status as "unread" | "read" | undefined;

  const cacheKey = `${CACHE_KEY}:${limit}:${category || "all"}:${status || "all"}`;
  const cached = cache.get<any>(cacheKey);
  if (cached) return sendSuccess(res, cached, "Admin notifications fetched");

  let query: FirebaseFirestore.Query = db.collection(COLLECTION).orderBy("createdAt", "desc");

  if (category) query = query.where("category", "==", category);
  if (status) query = query.where("status", "==", status);
  query = query.limit(limit);

  let [snapshot, unreadSnap] = await Promise.all([
    query.get(),
    db.collection(COLLECTION).where("status", "==", "unread").count().get(),
  ]);

  // Seed default notifications if collection is completely empty
  if (snapshot.empty && !category && !status) {
    await seedInitialAdminNotifications();
    snapshot = await query.get();
    unreadSnap = await db.collection(COLLECTION).where("status", "==", "unread").count().get();
  }

  const notifications = snapshot.docs.map((doc) => doc.data());
  const unreadCount = unreadSnap.data().count;

  const result = { notifications, unreadCount };
  cache.set(cacheKey, result, CACHE_TTL);
  return sendSuccess(res, result, "Admin notifications fetched");
});

// ─── PATCH /:id/read ──────────────────────────────────────────────────────────
export const markAdminNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ref = db.collection(COLLECTION).doc(String(id));
  const doc = await ref.get();
  if (!doc.exists) return sendError(res, "Notification not found", 404);

  await ref.update({ status: "read", readAt: new Date() });
  invalidateCache();
  return sendSuccess(res, null, "Notification marked as read");
});

// ─── PATCH /mark-all-read ─────────────────────────────────────────────────────
export const markAllAdminNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await db.collection(COLLECTION).where("status", "==", "unread").get();

  if (snapshot.empty) {
    return sendSuccess(res, null, "No unread notifications");
  }

  const batch = db.batch();
  const now = new Date();
  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    batch.update(doc.ref, { status: "read", readAt: now });
  });

  await batch.commit();
  invalidateCache();
  return sendSuccess(res, null, "All notifications marked as read");
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
export const deleteAdminNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ref = db.collection(COLLECTION).doc(String(id));
  const doc = await ref.get();
  if (!doc.exists) return sendError(res, "Notification not found", 404);

  await ref.delete();
  invalidateCache();
  return sendSuccess(res, null, "Notification deleted");
});

// ─── DELETE /all ──────────────────────────────────────────────────────────────
export const deleteAllAdminNotifications = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await db.collection(COLLECTION).get();

  if (snapshot.empty) {
    return sendSuccess(res, null, "No notifications to delete");
  }

  const batchSize = 500;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(doc.ref));
    await batch.commit();
  }

  invalidateCache();
  return sendSuccess(res, null, `Deleted ${docs.length} notifications`);
});

// ─── POST / (Manual admin notification — for testing) ─────────────────────────
export const createAdminNotificationEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { title, message, category, actionLink, metadata } = req.body;

  if (!title || !message || !category) {
    return sendError(res, "title, message, and category are required", 400);
  }

  if (!CATEGORY_META[category as AdminNotificationCategory]) {
    return sendError(res, `Invalid category. Valid: ${Object.keys(CATEGORY_META).join(", ")}`, 400);
  }

  const notif = await createAdminNotification({ title, message, category, actionLink, metadata });
  return sendSuccess(res, notif, "Admin notification created");
});
