import { auth, db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { Staff } from "./staff.model";
import { authService } from "../auth/auth.service";
import { userService } from "../user/user.service";
import { roleService } from "../role/role.service";
import { userRoleService } from "../user-role/user-role.service";
import { createNotification } from "../notification/notification.controller";
import { shopCountersService } from "../../infrastructure/cache/shop-counters.service";
import { costAnalyticsService } from "../cost-analytics/cost-analytics.service";

const COLLECTION = "staff";
const LOGS_COLLECTION = "staff_activities";

export class StaffService {
  private readonly cache = new CacheService();
  private readonly listCacheTtlMs = 60 * 1000;
  private readonly itemCacheTtlMs = 60 * 1000;
  private readonly logsCacheTtlMs = 30 * 1000;

  private getStaffListCacheKey(shopId: string) {
    return `staff:list:${shopId}`;
  }

  private getStaffItemCacheKey(id: string) {
    return `staff:item:${id}`;
  }

  private getStaffLogsCacheKey(shopId: string, staffId?: string) {
    return `staff:logs:${shopId}:${staffId || "all"}`;
  }

  private invalidateShopCache(shopId?: string) {
    if (!shopId) {
      return;
    }

    this.cache.delete(this.getStaffListCacheKey(shopId));
    this.invalidateLogsCache(shopId);
  }

  private invalidateLogsCache(shopId?: string) {
    if (!shopId) {
      return;
    }

    this.cache.deleteByPrefix(`staff:logs:${shopId}:`);
  }

  private invalidateStaffCache(staffId?: string, shopId?: string) {
    if (staffId) {
      this.cache.delete(this.getStaffItemCacheKey(staffId));
    }

    this.invalidateShopCache(shopId);
  }

  async logActivity(data: {
    shopId: string;
    staffId: string;
    staffName?: string;
    action: string;
    details: string;
    type: "sale" | "inventory" | "staff" | "setting";
  }) {
    try {
      await db.collection(LOGS_COLLECTION).add({
        ...data,
        timestamp: new Date(),
      });
      this.invalidateLogsCache(data.shopId);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  async staffLogin(uid: string, email?: string) {
    const staffData = await userService.findStaffByUserIdentity(uid, email);

    if (!staffData) {
      return { status: "not_found" as const };
    }

    if (staffData.status !== "Active") {
      return { status: "inactive" as const };
    }

    const shopDoc = await db.collection("shops").doc(staffData.shopId).get();
    const shopName = shopDoc.exists ? shopDoc.data()?.shopName : "Clothify";

    await this.logActivity({
      shopId: staffData.shopId,
      staffId: staffData.id,
      staffName: staffData.fullName,
      action: "Login",
      details: `Staff logged into the mobile app for shop: ${shopName}`,
      type: "staff",
    });

    await createNotification({
      shopId: staffData.shopId,
      title: "Staff Logged In",
      message: `${staffData.fullName} logged into the app`,
      type: "staff_login",
      link: `/${staffData.shopId}/staff`,
    });

    const { password: _password, ...profile } = staffData;

    return {
      status: "ok" as const,
      data: {
        profile: { ...profile, shopName },
        id: staffData.id,
      },
    };
  }

  async getStaffByShop(shopId: string) {
    const cacheKey = this.getStaffListCacheKey(shopId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const snapshot = await db
      .collection(COLLECTION)
      .where("shopId", "==", shopId)
      .get();
    return this.cache.set(
      cacheKey,
      snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
      this.listCacheTtlMs,
    );
  }

  async getStaffById(id: string) {
    const cacheKey = this.getStaffItemCacheKey(id);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const doc = await db.collection(COLLECTION).doc(id).get();
    const staff = doc.exists ? { id: doc.id, ...doc.data() } : null;
    if (!staff) {
      return null;
    }

    return this.cache.set(cacheKey, staff, this.itemCacheTtlMs);
  }

  async createStaff(payload: any) {
    const { email, phoneNumber, fullName, role, shopId } = payload;

    const existingEmail = await db
      .collection(COLLECTION)
      .where("email", "==", email)
      .get();
    if (!existingEmail.empty) {
      return { status: "email_exists" as const };
    }

    const existingPhone = await db
      .collection(COLLECTION)
      .where("phoneNumber", "==", phoneNumber)
      .get();
    if (!existingPhone.empty) {
      return { status: "phone_exists" as const };
    }

    if (!shopId) {
      return { status: "missing_shop" as const };
    }

    const staffId = `staff_${Date.now()}`;
    let userId: string;

    try {
      const firebaseUser = await auth.createUser({
        email: String(email).trim().toLowerCase(),
        password: String(
          payload.password ||
            `Clothify@${Math.random().toString(36).slice(-8)}Aa1`,
        ),
        displayName: String(fullName),
        disabled: false,
      });
      userId = firebaseUser.uid;
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        const existingUser = await auth.getUserByEmail(
          String(email).trim().toLowerCase(),
        );
        userId = existingUser.uid;
      } else {
        throw error;
      }
    }

    const newStaff: Staff = {
      ...payload,
      id: staffId,
      userId: userId,
      totalSales: 0,
      totalOrders: 0,
      commissionEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: payload.permissions || {
        invoices: { view: true, create: true, edit: false, delete: false },
        products: { view: true, create: false, edit: false, delete: false },
        inventory: { view: true, edit: false },
        returns: { view: true, create: true, edit: false, delete: false },
        customers: { view: true, create: true, edit: false, delete: false },
        staff: { view: false, create: false, edit: false, delete: false },
        analytics: { view: true },
        settings: { view: false, edit: false },
      },
      authProvider: "firebase",
    };

    const { password: _password, ...staffRecord } = newStaff;
    await db.collection(COLLECTION).doc(staffId).set(staffRecord);
    this.invalidateStaffCache(staffId, newStaff.shopId);

    await userService.upsertUser({
      uid: userId,
      email: newStaff.email,
      phone: newStaff.phoneNumber,
      mobile: newStaff.phoneNumber,
      name: newStaff.fullName,
      displayName: newStaff.fullName,
      shopId: newStaff.shopId,
      isActive: newStaff.status === "Active",
    });

    const roleDoc = await roleService.ensureLegacyStaffRole({
      staffId,
      shopId: newStaff.shopId,
      displayName: newStaff.fullName,
      permissions: newStaff.permissions as any,
    });

    await userRoleService.assignRole({
      userId: userId,
      roleId: roleDoc.id,
      shopId: newStaff.shopId,
    });

    authService.invalidateAccessContext(userId, newStaff.shopId);

    await this.logActivity({
      shopId,
      staffId: "admin",
      staffName: "Admin",
      action: "Staff Added",
      details: `Added new staff member: ${fullName} (${role})`,
      type: "staff",
    });

    void shopCountersService.incrementCounter(shopId, "staff", 1);
    void costAnalyticsService.invalidateSnapshot("new_staff");

    return { status: "ok" as const, data: staffRecord };
  }

  async updateStaff(
    id: string,
    payload: any,
    actingStaffId?: string | string[],
  ) {
    const { shopId, fullName } = payload;
    const existingDoc = await db.collection(COLLECTION).doc(id).get();
    const existingStaff = existingDoc.exists
      ? (existingDoc.data() as Staff)
      : null;
    const updateData = {
      ...payload,
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc(id).update(updateData);
    this.invalidateStaffCache(id, existingStaff?.shopId);
    if (shopId && shopId !== existingStaff?.shopId) {
      this.invalidateShopCache(shopId);
    }

    if (existingStaff?.userId) {
      await userService.upsertUser({
        uid: existingStaff.userId,
        email: payload.email || existingStaff.email,
        phone: payload.phoneNumber || existingStaff.phoneNumber,
        mobile: payload.phoneNumber || existingStaff.phoneNumber,
        name: payload.fullName || existingStaff.fullName,
        displayName: payload.fullName || existingStaff.fullName,
        shopId: payload.shopId || existingStaff.shopId,
        isActive: (payload.status || existingStaff.status) === "Active",
      });

      if (payload.permissions) {
        const roleDoc = await roleService.ensureLegacyStaffRole({
          staffId: id,
          shopId: payload.shopId || existingStaff.shopId,
          displayName: payload.fullName || existingStaff.fullName,
          permissions: payload.permissions as any,
        });

        await userRoleService.assignRole({
          userId: existingStaff.userId,
          roleId: roleDoc.id,
          shopId: payload.shopId || existingStaff.shopId,
        });

        authService.invalidateAccessContext(
          existingStaff.userId,
          payload.shopId || existingStaff.shopId,
        );
      }
    }

    const headerStaffId = Array.isArray(actingStaffId)
      ? actingStaffId[0]
      : actingStaffId;
    await this.logActivity({
      shopId: shopId || "unknown",
      staffId: String(headerStaffId || "system"),
      staffName: headerStaffId === id ? fullName : "Admin",
      action: "Staff Updated",
      details: `${headerStaffId === id ? "Self-updated" : "Updated"} details for staff: ${fullName || id}`,
      type: "staff",
    });
  }

  async deleteStaff(id: string, shopId: string) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return { status: "not_found" as const };
    }

    const staffData = doc.data() as Staff;
    await db.collection(COLLECTION).doc(id).delete();
    const targetShopId = shopId || staffData.shopId;
    this.invalidateStaffCache(id, targetShopId);

    if (targetShopId) {
      try {
        const { subscriptionService } = await import("../subscription/subscription.service");
        const { LIMIT_KEYS } = await import("../subscription/subscription.constants");
        await subscriptionService.incrementUsage({
          shopId: targetShopId,
          limitKey: LIMIT_KEYS.STAFF_COUNT,
          incrementBy: -1,
          period: "lifetime",
          subjectType: "shop"
        });
      } catch (e) {
        console.error("Failed to decrement staff usage limit:", e);
      }
    }

    if (staffData.userId) {
      await userService.updateUser(staffData.userId, {
        isActive: false,
      } as any);
      authService.invalidateAccessContext(staffData.userId, staffData.shopId);
    }

    await this.logActivity({
      shopId,
      staffId: "admin",
      staffName: "Admin",
      action: "Staff Deleted",
      details: `Removed staff member: ${staffData?.fullName}`,
      type: "staff",
    });

    if (targetShopId) {
      void shopCountersService.incrementCounter(targetShopId, "staff", -1);
      void costAnalyticsService.invalidateSnapshot("delete_staff");
    }
    
    return { status: "ok" as const };
  }

  async getStaffLogs(shopId: string, staffId?: string) {
    const cacheKey = this.getStaffLogsCacheKey(shopId, staffId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let query: any = db
      .collection(LOGS_COLLECTION)
      .where("shopId", "==", shopId);

    if (staffId) {
      query = query.where("staffId", "==", staffId);
    }

    const snapshot = await query.limit(100).get();
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logs.sort((a: any, b: any) => {
      const timeA = a.timestamp?.toDate
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      const timeB = b.timestamp?.toDate
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      return timeB - timeA;
    });

    return this.cache.set(cacheKey, logs, this.logsCacheTtlMs);
  }
}

export const staffService = new StaffService();

export const logActivity = staffService.logActivity.bind(staffService);
