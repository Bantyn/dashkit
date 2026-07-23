import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.config";
import { UnauthorizedError } from "../shared/utils/errors";
import { asyncHandler } from "../shared/utils/response";
import type { User } from "../modules/user/user.model";
import type { SubscriptionAccessContext } from "../modules/subscription/subscription.service";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
    profile?: User;
    shopId?: string;
    roleId?: string;
    planId?: string;
    roleIds?: string[];
    roleNames?: string[];
    permissions?: string[];
    subscription?: SubscriptionAccessContext;
  };
  shopId?: string;
  branchId?: string | null;
  branchName?: string;
  branchType?: 'parent' | 'child';
}

export const verifyToken = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const headerValue = req.headers.authorization || req.headers.Authorization;
    const token = String(headerValue || "").replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);

      req.user = {
        ...(req.user || {}),
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };

      next();
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  },
);

export const isShopOwner = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const roleNames = req.user?.roleNames || [];
    if (!roleNames.includes("owner")) {
      throw new UnauthorizedError("Shop owner access required");
    }
    next();
  },
);
