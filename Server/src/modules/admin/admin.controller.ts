import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { adminService } from "./admin.service";

export const getAdminOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await adminService.getOverview();
  return sendSuccess(res, overview, "Admin overview fetched");
});

export const getAdminUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await adminService.listUsers(String(req.query.search || ""));
  return sendSuccess(res, users, "Admin users fetched");
});

export const getAdminAdmins = asyncHandler(async (req: Request, res: Response) => {
  const admins = await adminService.listAdmins(String(req.query.search || ""));
  return sendSuccess(res, admins, "Platform admins fetched");
});

export const getAdminTransactions = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 50);
  const transactions = await adminService.listTransactions(limit);
  return sendSuccess(res, transactions, "Admin transactions fetched");
});

export const getAdminStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await adminService.listStaff(String(req.query.search || ""));
  return sendSuccess(res, staff, "Admin staff fetched");
});

export const getAdminCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customers = await adminService.listPlatformCustomers(String(req.query.search || ""));
  return sendSuccess(res, customers, "Admin customers fetched");
});

export const getAdminActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await adminService.listActivityLogs(String(req.query.search || ""));
  return sendSuccess(res, logs, "Admin activity logs fetched");
});

export const getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.getRevenueReport();
  return sendSuccess(res, report, "Revenue report fetched");
});

export const getUsageReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.getUsageReport();
  return sendSuccess(res, report, "Usage report fetched");
});

export const getShopSecurityStatus = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const db = (await import("../../config/firebase.config")).db;
  const { auditLogService } = await import("../audit/audit-log.service");

  const shopDoc = await db.collection("shops").doc(shopId).get();
  const shopData = shopDoc.exists ? shopDoc.data() : null;

  let ownerUser: any = null;
  if (shopData?.ownerId) {
    const userDoc = await db.collection("users").doc(shopData.ownerId).get();
    if (userDoc.exists) {
      ownerUser = userDoc.data();
    }
  }

  if (!ownerUser) {
    const userSnap = await db.collection("users").where("shopId", "==", shopId).limit(1).get();
    if (!userSnap.empty) {
      ownerUser = userSnap.docs[0].data();
    }
  }

  const now = new Date();
  let remainingSeconds = 0;
  if (ownerUser?.lockUntil) {
    const lockUntilDate = new Date(ownerUser.lockUntil);
    if (now < lockUntilDate) {
      remainingSeconds = Math.ceil((lockUntilDate.getTime() - now.getTime()) / 1000);
    }
  }

  const logs = await auditLogService.getLogsForShopOrEmail(shopId, ownerUser?.email);

  return sendSuccess(
    res,
    {
      shopId,
      email: ownerUser?.email || "N/A",
      failedLoginAttempts: ownerUser?.failedLoginAttempts || 0,
      lockoutStatus: remainingSeconds > 0 ? "LOCKED" : "NORMAL",
      lockUntil: ownerUser?.lockUntil || null,
      remainingLockTime: remainingSeconds,
      accountStatus: ownerUser?.accountStatus || (shopData?.status === "suspended" ? "suspended" : "active"),
      suspensionReason: ownerUser?.suspensionReason || shopData?.suspensionReason || null,
      lastLogin: ownerUser?.lastLogin || ownerUser?.lastLoginAt || null,
      lastFailedLogin: ownerUser?.lastFailedLoginAt || null,
      securityLogs: logs,
    },
    "Shop security status fetched"
  );
});

export const reactivateShop = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const db = (await import("../../config/firebase.config")).db;
  const { auditLogService } = await import("../audit/audit-log.service");

  // 1. Update shop document
  await db.collection("shops").doc(shopId).update({
    status: "active",
    suspensionReason: (await import("firebase-admin/firestore")).FieldValue.delete(),
    suspendedAt: (await import("firebase-admin/firestore")).FieldValue.delete(),
    updatedAt: new Date(),
  });

  // 2. Find and update owner/user document
  const shopDoc = await db.collection("shops").doc(shopId).get();
  const shopData = shopDoc.data();
  let userId = shopData?.ownerId;
  let userEmail = "";

  if (userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      userEmail = userDoc.data()?.email;
    }
  } else {
    const userSnap = await db.collection("users").where("shopId", "==", shopId).limit(1).get();
    if (!userSnap.empty) {
      userId = userSnap.docs[0].id;
      userEmail = userSnap.docs[0].data()?.email;
    }
  }

  if (userId) {
    await db.collection("users").doc(userId).update({
      failedLoginAttempts: 0,
      lockUntil: null,
      accountStatus: "active",
      isBlocked: false,
      isActive: true,
      suspensionReason: (await import("firebase-admin/firestore")).FieldValue.delete(),
      suspendedAt: (await import("firebase-admin/firestore")).FieldValue.delete(),
      suspendedBy: (await import("firebase-admin/firestore")).FieldValue.delete(),
    });
  }

  // 3. Log audit event
  await auditLogService.logEvent({
    shopId,
    email: userEmail || "N/A",
    userId: userId || "N/A",
    eventType: "ACCOUNT_REACTIVATED",
    details: { reactivatedBy: "ADMIN" },
    req,
  });

  return sendSuccess(res, { shopId, status: "active" }, "Shop account reactivated successfully");
});


