import { NextFunction, Response } from "express";
import { authService } from "../modules/auth/auth.service";
import { asyncHandler } from "../shared/utils/response";
import { ForbiddenError, UnauthorizedError } from "../shared/utils/errors";
import { AuthRequest } from "./auth.middleware";
import { db } from "../config/firebase.config";
import { userService } from "../modules/user/user.service";
import { CacheService } from "../infrastructure/cache/cache.service";

const branchCache = new CacheService();


function readHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveRequestedShopId(req: AuthRequest) {
  return (
    req.params?.shopId ||
    req.body?.shopId ||
    req.query?.shopId ||
    readHeaderValue(req.headers["x-shop-id"]) ||
    req.user?.shopId ||
    req.shopId
  )
    ? String(
        req.params?.shopId ||
          req.body?.shopId ||
          req.query?.shopId ||
          readHeaderValue(req.headers["x-shop-id"]) ||
          req.user?.shopId ||
          req.shopId,
      )
    : undefined;
}

function hasPermission(permissions: string[], requiredPermission: string) {
  if (permissions.includes("*") || permissions.includes(requiredPermission)) {
    return true;
  }

  const [resource] = requiredPermission.split(".");
  return permissions.includes(`${resource}.*`);
}

async function populateBranchContext(req: AuthRequest) {
  if (!req.user || !req.user.uid) return;

  const uid = req.user.uid;
  const shopId = req.shopId || "";
  const cacheKey = `branch-context:${uid}:${shopId}`;
  
  const cachedContext = branchCache.get<any>(cacheKey);
  if (cachedContext) {
    req.branchId = cachedContext.branchId;
    req.branchName = cachedContext.branchName;
    req.branchType = cachedContext.branchType;
    if (req.branchId) {
      req.headers["x-branch-id"] = req.branchId;
    }
    return;
  }

  const roles = req.user.roleNames || [];
  const isOwnerOrAdmin =
    roles.includes("owner") ||
    roles.includes("admin") ||
    roles.includes("shop_owner");

  const rawBranchId = readHeaderValue(req.headers["x-branch-id"]);

  let resolvedContext: any = { branchId: null, branchName: "Parent Branch", branchType: "parent" };

  if (isOwnerOrAdmin) {
    if (rawBranchId && rawBranchId !== "parent") {
      try {
        const docCacheKey = `raw-branch:${rawBranchId}`;
        let branchName = branchCache.get<string>(docCacheKey);
        if (!branchName) {
          const doc = await db.collection("branches").doc(rawBranchId).get();
          branchName = doc.data()?.name || "Child Branch";
          branchCache.set(docCacheKey, branchName, 5 * 60 * 1000); // 5 mins cache
        }
        resolvedContext = {
          branchId: rawBranchId,
          branchName: branchName || "Child Branch",
          branchType: "child",
        };
      } catch {
        resolvedContext = {
          branchId: rawBranchId,
          branchName: "Child Branch",
          branchType: "child",
        };
      }
    }
  } else {
    // Staff member: find their staff document
    try {
      const staff = await userService.findStaffByUserIdentity(req.user.uid, req.user.email);
      if (staff) {
        if (staff.status === "Inactive") {
          throw new ForbiddenError("Staff account is inactive");
        }
        
        // Find matching branch ID
        const branchListCacheKey = `branches:list:${shopId}`;
        let branchesList = branchCache.get<any[]>(branchListCacheKey);
        if (!branchesList) {
          const branchesSnap = await db
            .collection("branches")
            .where("shopId", "==", req.shopId)
            .get();
          branchesList = branchesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          branchCache.set(branchListCacheKey, branchesList, 5 * 60 * 1000); // 5 mins cache
        }
          
        const matchedBranch = (branchesList || []).find(
          (b: any) =>
            b.name?.toLowerCase() === staff.branch?.toLowerCase() ||
            b.id === staff.branch
        );

        if (matchedBranch) {
          resolvedContext = {
            branchId: matchedBranch.id,
            branchName: matchedBranch.name,
            branchType: "child",
          };
        } else {
          resolvedContext = {
            branchId: staff.branch,
            branchName: staff.branch,
            branchType: "child",
          };
        }
      }
    } catch (e: any) {
      if (e instanceof ForbiddenError) throw e;
    }
  }

  req.branchId = resolvedContext.branchId;
  req.branchName = resolvedContext.branchName;
  req.branchType = resolvedContext.branchType;
  if (req.branchId) {
    req.headers["x-branch-id"] = req.branchId;
  }
  
  branchCache.set(cacheKey, resolvedContext, 5 * 60 * 1000); // 5 mins cache
}

async function hydrateAccess(req: AuthRequest) {
  if (!req.user?.uid) {
    throw new UnauthorizedError("Authentication required");
  }

  const requestedShopId = resolveRequestedShopId(req);
  const isAccessAlreadyHydrated =
    !!req.user.profile &&
    Array.isArray(req.user.roleIds) &&
    Array.isArray(req.user.roleNames) &&
    Array.isArray(req.user.permissions) &&
    req.user.shopId === requestedShopId;

  if (isAccessAlreadyHydrated) {
    req.shopId = req.user.shopId;
    if (req.branchId === undefined) {
      await populateBranchContext(req);
    }
    return req.user;
  }

  const access = await authService.resolveAccessContext(
    req.user.uid,
    requestedShopId,
  );

  req.user = {
    ...req.user,
    profile: access.profile,
    shopId: access.shopId,
    roleId: access.profile.roleId,
    planId: access.profile.planId,
    roleIds: access.roleIds,
    roleNames: access.roleNames,
    permissions: access.permissions,
  };

  req.shopId = access.shopId;
  await populateBranchContext(req);
  return req.user;
}

export const attachUserRoles = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await hydrateAccess(req);
    next();
  },
);

export const checkPermission = (permission: string) =>
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await hydrateAccess(req);
    const permissions = user.permissions || [];

    if (!hasPermission(permissions, permission)) {
      throw new ForbiddenError(`Access denied: ${permission} is required`);
    }

    next();
  });
