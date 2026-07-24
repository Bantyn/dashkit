import { auth, db, admin } from "../../config/firebase.config";
import { ConflictError, NotFoundError } from "../../shared/utils/errors";
import { User } from "./user.model";
import { Staff } from "../staff/staff.model";
import { roleService } from "../role/role.service";
import { userRoleService } from "../user-role/user-role.service";
import { CacheService } from "../../infrastructure/cache/cache.service";

const USERS_COLLECTION = "users";
const STAFF_COLLECTION = "staff";

function sanitizePhone(phone?: string) {
  const normalized = phone?.trim();
  return normalized ? normalized : undefined;
}

function omitUndefinedFields<T extends Record<string, any>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as T;
}

function createTemporaryPassword() {
  return `Clothify@${Math.random().toString(36).slice(-10)}A1`;
}

export class UserService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 15 * 60 * 1000; // 15 minutes

  private getCacheKey(uid: string) {
    return `user:${uid}`;
  }

  private getStaffIdentityKey(uid: string, email?: string) {
    return `staff-identity:${uid}:${email ? email.trim().toLowerCase() : "none"}`;
  }

  invalidateStaffIdentityCache(uid: string, email?: string) {
    this.cache.deleteByMatch((key) =>
      key.startsWith("staff-identity:") &&
      (key.includes(`:${uid}:`) || (!!email && key.includes(`:${email.trim().toLowerCase()}`)))
    );
  }

  async getByUid(uid: string): Promise<User | null> {
    const key = this.getCacheKey(uid);
    const cached = this.cache.get<User>(key);
    if (cached) {
      return cached;
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }

    const user = userDoc.data() as User;
    this.cache.set(key, user, this.ttlMs);
    return user;
  }

  async getByEmail(email: string): Promise<User | null> {
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where("email", "==", email.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as User;
  }

  async upsertUser(input: {
    uid: string;
    email: string;
    phone?: string;
    name: string;
    shopId?: string;
    roleId?: string;
    planId?: string;
    isActive?: boolean;
    displayName?: string;
    mobile?: string;
    emailVerified?: boolean;
    mobileVerified?: boolean;
    isBlocked?: boolean;
    kycStatus?: "pending" | "verified" | "rejected";
    gstNumber?: string;
    panNumber?: string;
    additionalPermissions?: string[];
    restrictedPermissions?: string[];
    metadata?: Record<string, any>;
  }): Promise<User> {
    const existing = await this.getByUid(input.uid);
    const now = new Date();

    const user: User = {
      id: input.uid,
      uid: input.uid,
      email: input.email.trim().toLowerCase(),
      phone: sanitizePhone(input.phone || input.mobile),
      name: input.name,
      shopId: input.shopId || existing?.shopId,
      roleId: input.roleId ?? existing?.roleId,
      planId: input.planId ?? existing?.planId,
      isActive: input.isActive ?? existing?.isActive ?? true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      displayName: input.displayName || input.name,
      mobile: sanitizePhone(input.mobile || input.phone),
      emailVerified: input.emailVerified ?? existing?.emailVerified ?? false,
      mobileVerified: input.mobileVerified ?? existing?.mobileVerified ?? false,
      isBlocked: input.isBlocked ?? existing?.isBlocked ?? false,
      kycStatus: input.kycStatus ?? existing?.kycStatus,
      gstNumber: input.gstNumber ?? existing?.gstNumber,
      panNumber: input.panNumber ?? existing?.panNumber,
      additionalPermissions: input.additionalPermissions ?? existing?.additionalPermissions,
      restrictedPermissions: input.restrictedPermissions ?? existing?.restrictedPermissions,
      metadata: {
        ...(existing?.metadata || {}),
        ...(input.metadata || {}),
      },
    };

    const sanitizedUser = omitUndefinedFields(user);

    await db
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .set(sanitizedUser, { merge: true });

    this.cache.delete(this.getCacheKey(user.uid));
    this.invalidateStaffIdentityCache(user.uid, user.email);

    return sanitizedUser as User;
  }

  async updateUser(uid: string, payload: Partial<User>) {
    const existing = await this.getByUid(uid);
    if (!existing) {
      throw new NotFoundError("User not found");
    }

    const updatePayload = omitUndefinedFields({
      ...payload,
      metadata:
        payload.metadata !== undefined
          ? {
              ...(existing.metadata || {}),
              ...(payload.metadata || {}),
            }
          : undefined,
      updatedAt: new Date(),
    });

    await db.collection(USERS_COLLECTION).doc(uid).set(updatePayload, { merge: true });
    
    this.cache.delete(this.getCacheKey(uid));
    this.invalidateStaffIdentityCache(uid, payload.email || existing.email);
  }

  async updateLastLogin(uid: string): Promise<void> {
    const now = new Date();
    await db.collection(USERS_COLLECTION).doc(uid).set(
      {
        lastLogin: now,
        lastLoginAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    this.cache.delete(this.getCacheKey(uid));
  }

  async findStaffByUserIdentity(uid: string, email?: string): Promise<Staff | null> {
    const cacheKey = this.getStaffIdentityKey(uid, email);
    const cached = this.cache.get<Staff>(cacheKey);
    if (cached) {
      return cached;
    }

    let snapshot = await db
      .collection(STAFF_COLLECTION)
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (snapshot.empty && email) {
      snapshot = await db
        .collection(STAFF_COLLECTION)
        .where("email", "==", email.trim().toLowerCase())
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return null;
    }

    const staff = snapshot.docs[0].data() as Staff;
    this.cache.set(cacheKey, staff, this.ttlMs);
    return staff;
  }


  async ensureFirebaseIdentityForStaff(staff: Staff) {
    if (staff.userId) {
      try {
        return await auth.getUser(staff.userId);
      } catch {
      }
    }

    if (staff.email) {
      try {
        return await auth.getUserByEmail(staff.email.trim().toLowerCase());
      } catch {
      }
    }

    if (!staff.email) {
      throw new ConflictError(
        `Staff ${staff.id} is missing email. Firebase auth migration requires an email.`,
      );
    }

    return auth.createUser({
      email: staff.email.trim().toLowerCase(),
      password: staff.password || createTemporaryPassword(),
      displayName: staff.fullName,
      disabled: staff.status !== "Active",
    });
  }

  async migrateStaffToUsers(shopId?: string) {
    await roleService.ensureDefaultRoles();

    let query: any = db.collection(STAFF_COLLECTION);
    if (shopId) {
      query = query.where("shopId", "==", shopId);
    }

    const snapshot = await query.get();
    const summary = {
      migrated: 0,
      skipped: 0,
      failed: [] as Array<{ staffId: string; reason: string }>,
    };

    for (const doc of snapshot.docs) {
      const staff = doc.data() as Staff;

      try {
        const firebaseUser = await this.ensureFirebaseIdentityForStaff(staff);
        const user = await this.upsertUser({
          uid: firebaseUser.uid,
          email: staff.email,
          phone: staff.phoneNumber,
          name: staff.fullName,
          displayName: staff.fullName,
          mobile: staff.phoneNumber,
          shopId: staff.shopId,
          isActive: staff.status === "Active",
        });

        const role = await roleService.ensureLegacyStaffRole({
          staffId: staff.id,
          shopId: staff.shopId,
          displayName: staff.fullName,
          permissions: staff.permissions as any,
        });

        await userRoleService.assignRole({
          userId: user.uid,
          roleId: role.id,
          shopId: staff.shopId,
        });

        await db.collection(STAFF_COLLECTION).doc(doc.id).set(
          {
            userId: user.uid,
            password: admin.firestore.FieldValue.delete(),
            authProvider: "firebase",
            authMigratedAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true },
        );

        summary.migrated += 1;
      } catch (error: any) {
        summary.failed.push({
          staffId: doc.id,
          reason: error.message || "Unknown migration failure",
        });
      }
    }

    summary.skipped = snapshot.size - summary.migrated - summary.failed.length;
    return summary;
  }
}

export const userService = new UserService();
