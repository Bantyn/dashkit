import { db, admin } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../../shared/utils/errors";
import { roleService } from "../role/role.service";
import { userRoleService } from "../user-role/user-role.service";
import { userService } from "../user/user.service";
import { User } from "../user/user.model";

const USERS_COLLECTION = "users";

export interface UserAccessContext {
  profile: User;
  shopId?: string;
  roleIds: string[];
  roleNames: string[];
  permissions: string[];
}

export class AuthService {
  private readonly accessCache = new CacheService();
  private readonly accessCacheTtlMs = 15 * 60 * 1000;

  private uniquePermissions(permissions: string[]) {
    return Array.from(new Set(permissions));
  }

  private buildAccessCacheKey(uid: string, shopId?: string) {
    return `access:${uid}:${shopId || "default"}`;
  }

  invalidateAccessContext(uid: string, shopId?: string) {
    if (shopId) {
      this.accessCache.delete(this.buildAccessCacheKey(uid, shopId));
      return;
    }

    this.accessCache.deleteByPrefix(`access:${uid}:`);
  }

  async registerUser(input: {
    uid: string;
    email: string;
    name?: string;
    displayName?: string;
    phone?: string;
    mobile?: string;
    shopId?: string;
    role?: string;
    additionalPermissions?: string[];
    restrictedPermissions?: string[];
  }) {
    const user = await userService.upsertUser({
      uid: input.uid,
      email: input.email,
      phone: input.phone || input.mobile,
      mobile: input.mobile || input.phone,
      name: input.name || input.displayName || input.email,
      displayName: input.displayName || input.name || input.email,
      shopId: input.shopId,
      planId: "free",
      isActive: true,
      emailVerified: false,
      mobileVerified: false,
      isBlocked: false,
      additionalPermissions: input.additionalPermissions || [],
      restrictedPermissions: input.restrictedPermissions || [],
    });

    if (input.role && input.shopId) {
      const role = await roleService.ensureDefaultRoleForLegacyRole(input.role);
      if (role) {
        await userRoleService.assignRole({
          userId: user.uid,
          roleId: role.id,
          shopId: input.shopId,
        });

        await userService.updateUser(user.uid, {
          roleId: role.id,
          shopId: input.shopId,
        });
      }
    }

    await db.collection(USERS_COLLECTION).doc(user.uid).set(
      { role: admin.firestore.FieldValue.delete() },
      { merge: true },
    );

    this.invalidateAccessContext(user.uid);

    return user;
  }

  async getUserProfile(uid: string) {
    const profile = await userService.getByUid(uid);
    if (!profile) {
      throw new NotFoundError("User not found");
    }
    return profile;
  }

  async updateUserProfile(uid: string, payload: Partial<User>) {
    const allowedFields: Partial<User> = {
      name: payload.name,
      displayName: payload.displayName,
      phone: payload.phone,
      mobile: payload.mobile,
      shopId: payload.shopId,
      roleId: payload.roleId,
      planId: payload.planId,
      gstNumber: payload.gstNumber,
      panNumber: payload.panNumber,
      additionalPermissions: payload.additionalPermissions,
      restrictedPermissions: payload.restrictedPermissions,
      emailVerified: payload.emailVerified,
      mobileVerified: payload.mobileVerified,
      isActive: payload.isActive,
      isBlocked: payload.isBlocked,
      lastLogin: payload.lastLogin,
      lastLoginAt: payload.lastLoginAt,
    };

    await userService.updateUser(uid, allowedFields);
    this.invalidateAccessContext(uid);
  }

  async resolveAccessContext(uid: string, requestedShopId?: string): Promise<UserAccessContext> {
    const cacheKey = this.buildAccessCacheKey(uid, requestedShopId);
    const cached = this.accessCache.get<UserAccessContext>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await userService.getByUid(uid);
    if (!profile) {
      throw new NotFoundError("User not found");
    }

    if (profile.isBlocked || profile.isActive === false) {
      throw new UnauthorizedError("User account is inactive");
    }

    await roleService.ensureDefaultRoles();

    const adminDoc = await db.collection("admins").doc(uid).get();
    const isPlatformAdmin = adminDoc.exists || profile.metadata?.userType === "platform_admin";
    const shopId = requestedShopId || profile.shopId;
    const targetShopIdForRoles = isPlatformAdmin ? (profile.shopId || shopId) : shopId;
    let mappings = targetShopIdForRoles ? await userRoleService.getUserRoles(uid, targetShopIdForRoles) : [];

    if (!mappings.length && targetShopIdForRoles) {
      const legacyRole = (profile as any)?.role || "owner";
      const legacyRoleDoc = await roleService.ensureDefaultRoleForLegacyRole(legacyRole);

      if (legacyRoleDoc) {
        await userRoleService.assignRole({
          userId: uid,
          roleId: legacyRoleDoc.id,
          shopId: targetShopIdForRoles,
        });
        mappings = await userRoleService.getUserRoles(uid, targetShopIdForRoles);
      }
    }

    const roleIds = mappings.map((mapping) => mapping.roleId);
    let roles = await roleService.getRolesByIds(roleIds);

    // Combine template role permissions + user additional permissions
    let permissions = this.uniquePermissions([
      ...roles.flatMap((role) => role.permissions || []),
      ...(profile.additionalPermissions || []),
    ]);

    // Subtract user restricted permissions
    if (profile.restrictedPermissions && profile.restrictedPermissions.length > 0) {
      const restrictedSet = new Set(profile.restrictedPermissions);
      permissions = permissions.filter((p) => !restrictedSet.has(p));
    }

    if (isPlatformAdmin) {
      if (!roles.length) {
        roles = [{ id: "admin", name: "admin", permissions: ["*"] }];
      }
      permissions = this.uniquePermissions([...permissions, "*"]);
    }

    if (shopId && !roles.length && !isPlatformAdmin) {
      throw new ForbiddenError("No role mapping found for the requested shop");
    }

    const accessContext = {
      profile,
      shopId,
      roleIds,
      roleNames: roles.map((role) => role.name),
      permissions,
    };

    this.accessCache.set(cacheKey, accessContext, this.accessCacheTtlMs);
    return accessContext;
  }
}

export const authService = new AuthService();
