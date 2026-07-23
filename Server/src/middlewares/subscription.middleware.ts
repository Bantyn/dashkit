import { NextFunction, Response } from "express";
import { subscriptionService } from "../modules/subscription/subscription.service";
import { AuthRequest } from "./auth.middleware";
import { asyncHandler } from "../shared/utils/response";
import { ReadOnlyError } from "../shared/utils/errors";

function readHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveRequestedShopId(req: AuthRequest) {
  const value =
    req.params?.shopId ||
    req.body?.shopId ||
    req.query?.shopId ||
    readHeaderValue(req.headers["x-shop-id"]) ||
    req.user?.shopId ||
    req.shopId;

  return value ? String(value) : undefined;
}

async function hydrateSubscription(req: AuthRequest) {
  const shopId = resolveRequestedShopId(req);
  const access = await subscriptionService.resolveAccessContext({
    userId: req.user?.uid,
    shopId,
  });

  req.shopId = access.shopId;
  if (req.user) {
    req.user.shopId = access.shopId;
    req.user.planId = access.plan.id;
    req.user.subscription = access;
  }

  return access;
}

export const attachSubscription = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    await hydrateSubscription(req);
    next();
  },
);

export const checkFeature = (featureKey: string) =>
  asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const shopId = resolveRequestedShopId(req);
    const access = await subscriptionService.assertFeatureEnabled(featureKey, {
      userId: req.user?.uid,
      shopId,
    });

    req.shopId = access.shopId;
    if (req.user) {
      req.user.planId = access.plan.id;
      req.user.subscription = access;
    }

    next();
  });

export const checkLimit = (
  limitKey: string,
  options?: {
    incrementBy?: number;
    period?: "monthly" | "daily" | "yearly" | "lifetime";
    scope?: "shop" | "user";
  },
) =>
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const shopId = resolveRequestedShopId(req);
    const access = await subscriptionService.assertLimitAvailable({
      userId: req.user?.uid,
      shopId,
      limitKey,
      incrementBy: options?.incrementBy ?? 1,
      period: options?.period || "monthly",
      subjectType: options?.scope || (shopId ? "shop" : "user"),
    });

    const originalJson = res.json.bind(res);
    let usageRecorded = false;

    res.json = ((body: unknown) => {
      if (!usageRecorded && res.statusCode < 400) {
        usageRecorded = true;
        void subscriptionService.incrementUsage({
          userId: req.user?.uid,
          shopId: access.shopId,
          limitKey,
          incrementBy: options?.incrementBy ?? 1,
          period: options?.period || "monthly",
          subjectType: options?.scope || (access.shopId ? "shop" : "user"),
        });
      }

      return originalJson(body);
    }) as typeof res.json;

    next();
  });

export const enforceBillingStatus = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const access = req.user?.subscription || (await hydrateSubscription(req));
    
    // If shop is restricted (expired/suspended/failed) and attempting a write/create/delete
    if (access.isRestricted && req.method !== "GET") {
      const url = req.originalUrl || req.url;
      
      const isAllowedRoute = 
        url.includes("/api/v1/payment") || 
        url.includes("/api/v1/support") ||
        url.includes("/api/v1/auth/logout");

      if (!isAllowedRoute) {
        throw new ReadOnlyError();
      }
    }
    
    next();
  }
);
