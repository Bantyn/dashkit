import { Request, Response, NextFunction } from "express";
import { db } from "../config/firebase.config";
import { UnauthorizedError } from "../shared/utils/errors";
import { asyncHandler } from "../shared/utils/response";
import { Shop } from "../modules/shop/shop.model";
import { subscriptionService } from "../modules/subscription/subscription.service";

declare global {
  namespace Express {
    interface Request {
      headlessShop?: Shop;
    }
  }
}

export const verifyHeadlessApiKey = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new UnauthorizedError("API Key is missing (x-api-key header required)");
    }

    // In a real production system, this could be cached with Redis or memory cache.
    // We are looking up the shop by the publicApiKey.
    const snapshot = await db
      .collection("shops")
      .where("publicApiKey", "==", apiKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new UnauthorizedError("Invalid API Key");
    }

    const shopDoc = snapshot.docs[0];
    const shopData = { id: shopDoc.id, ...shopDoc.data() } as Shop;

    if (shopData.status !== "active") {
      throw new UnauthorizedError("Shop is not active");
    }

    try {
      await subscriptionService.assertFeatureEnabled("intg_api_access", { shopId: shopData.id });
    } catch (e) {
      throw new UnauthorizedError("API access is not enabled for your subscription plan");
    }

    req.headlessShop = shopData;
    next();
  },
);
