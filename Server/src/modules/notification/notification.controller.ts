import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { Notification } from "./notification.model";

const COLLECTION = "notifications";
const cache = new CacheService();
const cacheTtlMs = 15 * 1000;

function getShopNotificationsCacheKey(shopId: string) {
  return `notifications:${shopId}`;
}

export const getNotificationsByShop = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const cacheKey = `${getShopNotificationsCacheKey(shopId)}:limit:${limit}`;
  const cached = cache.get<any[]>(cacheKey);

  if (cached) {
    return sendSuccess(res, cached, "Notifications fetched");
  }

  const [snapshot, unreadSnap] = await Promise.all([
    db.collection(COLLECTION)
      .where("shopId", "==", shopId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get(),
    db.collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("status", "==", "unread")
      .count()
      .get(),
  ]);

  const unreadCount = unreadSnap.data().count;
  const notifications = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    return {
      ...doc.data(),
      unreadCount,
    };
  });

  cache.set(cacheKey, notifications, cacheTtlMs);
  return sendSuccess(res, notifications, "Notifications fetched");
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notificationDoc = await db.collection(COLLECTION).doc(String(req.params.id)).get();
  await db.collection(COLLECTION).doc(String(req.params.id)).update({ status: "read" });
  const shopId = notificationDoc.data()?.shopId;
  if (shopId) {
    cache.deleteByPrefix(getShopNotificationsCacheKey(String(shopId)));
  }
  return sendSuccess(res, null, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const snapshot = await db.collection(COLLECTION)
    .where("shopId", "==", shopId)
    .where("status", "==", "unread")
    .get();

  if (snapshot.empty) {
    return sendSuccess(res, null, "No unread notifications");
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    batch.update(doc.ref, { status: "read" });
  });

  await batch.commit();
  cache.deleteByPrefix(getShopNotificationsCacheKey(shopId));
  
  return sendSuccess(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notificationDoc = await db.collection(COLLECTION).doc(String(req.params.id)).get();
  if (notificationDoc.exists) {
    await db.collection(COLLECTION).doc(String(req.params.id)).delete();
    const shopId = notificationDoc.data()?.shopId;
    if (shopId) {
      cache.deleteByPrefix(getShopNotificationsCacheKey(String(shopId)));
    }
  }
  return sendSuccess(res, null, "Notification deleted");
});

export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const snapshot = await db.collection(COLLECTION)
    .where("shopId", "==", shopId)
    .get();

  if (snapshot.empty) {
    return sendSuccess(res, null, "No notifications to delete");
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  cache.deleteByPrefix(getShopNotificationsCacheKey(shopId));
  
  return sendSuccess(res, null, "All notifications deleted");
});

export const createNotification = async (notification: Partial<Notification>) => {
  const ref = db.collection(COLLECTION).doc();
  const newNotification = {
    ...notification,
    id: ref.id,
    status: "unread",
    createdAt: new Date(),
  };
  await ref.set(newNotification);
  if (newNotification.shopId) {
    cache.deleteByPrefix(getShopNotificationsCacheKey(String(newNotification.shopId)));
  }
  return newNotification;
};

const DEFAULT_TEMPLATES = [
  {
    code: "order_confirmation",
    type: "email",
    name: "Order Confirmation Email",
    subject: "Order Confirmation - #{{orderNumber}}",
    content: "<h3>Hello {{customerName}},</h3><p>Thank you for your order! We have received your order <strong>#{{orderNumber}}</strong>.</p><p><strong>Total Amount:</strong> INR {{totalAmount}}<br><strong>Payment Method:</strong> {{paymentMethod}}</p><p>We will notify you once it is shipped.</p><p>Best regards,<br>Clothify Store</p>",
    isActive: true
  },
  {
    code: "order_confirmation",
    type: "sms",
    name: "Order Confirmation SMS",
    content: "Hello {{customerName}}, your order #{{orderNumber}} of INR {{totalAmount}} has been received! Thank you.",
    isActive: true
  },
  {
    code: "order_confirmation",
    type: "whatsapp",
    name: "Order Confirmation WhatsApp",
    content: "Hello {{customerName}}, your order #{{orderNumber}} has been received successfully! Total: INR {{totalAmount}}. Thank you for shopping with us!",
    isActive: true
  },
  {
    code: "order_status_update",
    type: "email",
    name: "Order Status Update Email",
    subject: "Order #{{orderNumber}} Update - {{status}}",
    content: "<h3>Hello {{customerName}},</h3><p>Your order <strong>#{{orderNumber}}</strong> status has been updated to: <strong>{{status}}</strong>.</p><p>Best regards,<br>Clothify Store</p>",
    isActive: true
  },
  {
    code: "order_status_update",
    type: "sms",
    name: "Order Status Update SMS",
    content: "Hello {{customerName}}, your order #{{orderNumber}} status has been updated to: {{status}}.",
    isActive: true
  },
  {
    code: "order_status_update",
    type: "whatsapp",
    name: "Order Status Update WhatsApp",
    content: "Hello {{customerName}}, your order #{{orderNumber}} status has been updated to: {{status}}.",
    isActive: true
  },
  // ── Invoice Templates ──────────────────────────────────────────────────────
  {
    code: "invoice_generated",
    type: "whatsapp",
    name: "Invoice Generated WhatsApp",
    content: "Hello {{customerName}},\n\nYour invoice *{{invoiceNumber}}* has been generated.\nAmount: *₹{{totalAmount}}*\nStatus: {{status}}\n\nView & download your invoice here:\n{{invoiceLink}}\n\nThank you for shopping with us! 🛍️",
    isActive: true
  },
  {
    code: "invoice_generated",
    type: "sms",
    name: "Invoice Generated SMS",
    content: "Hello {{customerName}}, your invoice {{invoiceNumber}} of ₹{{totalAmount}} is ready. Download: {{invoiceLink}}",
    isActive: true
  },
  {
    code: "invoice_generated",
    type: "email",
    name: "Invoice Generated Email",
    subject: "Your Invoice {{invoiceNumber}} is Ready",
    content: "<h3>Hello {{customerName}},</h3><p>Your invoice <strong>{{invoiceNumber}}</strong> has been generated.</p><p><strong>Amount:</strong> ₹{{totalAmount}}<br><strong>Status:</strong> {{status}}</p><p><a href='{{invoiceLink}}'>Click here to view and download your invoice</a></p><p>Thank you for shopping with us!</p>",
    isActive: true
  }
];

export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const snapshot = await db.collection("notification_templates").where("shopId", "==", shopId).get();

  if (snapshot.empty) {
    // Brand new shop — seed all default templates
    const batch = db.batch();
    const seededTemplates = DEFAULT_TEMPLATES.map((tmpl) => {
      const docRef = db.collection("notification_templates").doc();
      const newTmpl = { ...tmpl, id: docRef.id, shopId, createdAt: new Date(), updatedAt: new Date() };
      batch.set(docRef, newTmpl);
      return newTmpl;
    });
    await batch.commit();
    return sendSuccess(res, seededTemplates, "Default templates seeded and fetched");
  }

  // Existing shop — check for any missing templates and add them
  const existingKeys = new Set(
    snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const d = doc.data();
      return `${d.code}::${d.type}`;
    })
  );

  const missingTemplates = DEFAULT_TEMPLATES.filter(
    (tmpl) => !existingKeys.has(`${tmpl.code}::${tmpl.type}`)
  );

  if (missingTemplates.length > 0) {
    const batch = db.batch();
    const newDocs = missingTemplates.map((tmpl) => {
      const docRef = db.collection("notification_templates").doc();
      const newTmpl = { ...tmpl, id: docRef.id, shopId, createdAt: new Date(), updatedAt: new Date() };
      batch.set(docRef, newTmpl);
      return newTmpl;
    });
    await batch.commit();
    const existingTemplates = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
    return sendSuccess(res, [...existingTemplates, ...newDocs], "Templates fetched (with new defaults added)");
  }

  const templates = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
  return sendSuccess(res, templates, "Templates fetched successfully");
});

export const saveTemplate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.shopId || !data.code || !data.type) {
    return sendError(res, "Shop ID, Code, and Type are required", 400);
  }

  const ref = db.collection("notification_templates").doc();
  const template = {
    ...data,
    id: ref.id,
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await ref.set(template);
  return sendSuccess(res, template, "Template saved successfully");
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  await db.collection("notification_templates").doc(String(id)).update({
    ...data,
    updatedAt: new Date()
  });
  return sendSuccess(res, null, "Template updated successfully");
});

export const getNotificationLogs = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const snapshot = await db
    .collection("notification_logs")
    .where("shopId", "==", shopId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const logs = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
  return sendSuccess(res, logs, "Notification logs fetched successfully");
});

// Import sendShopCustomerEmail dynamically to avoid circular dependencies
import { sendShopCustomerEmail } from "../../shared/utils/email.util";
import { notificationSenderService } from "../../shared/utils/notification-sender.service";

export const sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, type, recipient, subject, content } = req.body;
  if (!shopId || !type || !recipient || !content) {
    return sendError(res, "Shop ID, Type, Recipient, and Content are required", 400);
  }

  let success = false;
  try {
    if (type === "email") {
      await sendShopCustomerEmail(shopId, recipient, subject || "Test Email", content, content);
      success = true;
    } else if (type === "sms") {
      success = await notificationSenderService.sendSMS(shopId, recipient, content);
    } else if (type === "whatsapp") {
      success = await notificationSenderService.sendWhatsApp(shopId, recipient, content);
    }

    await db.collection("notification_logs").add({
      shopId,
      type,
      recipient,
      subject: subject || null,
      content,
      status: success ? "success" : "failed",
      createdAt: new Date(),
    });

    if (success) {
      return sendSuccess(res, null, "Test notification sent successfully");
    } else {
      return sendError(res, "Failed to send test notification", 500);
    }
  } catch (err: any) {
    await db.collection("notification_logs").add({
      shopId,
      type,
      recipient,
      subject: subject || null,
      content,
      status: "failed",
      error: err.message,
      createdAt: new Date(),
    });
    return sendError(res, `Failed to send: ${err.message}`, 500);
  }
});
