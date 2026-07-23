import { Router } from "express";
import {
  createPromotion,
  getPromotionsByShop,
  getPromotion,
  updatePromotion,
  deletePromotion,
  activateCampaign,
  getCampaignAnalytics
} from "../../../modules/promotions/promotions.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post(
  "/",
  checkPermission("promotions.create"),
  checkFeature(FEATURE_KEYS.MKTG_PROMOTIONS),
  createPromotion,
);
router.get(
  "/shop/:shopId",
  checkPermission("promotions.view"),
  checkFeature(FEATURE_KEYS.MKTG_PROMOTIONS),
  getPromotionsByShop,
);
router.get(
  "/:id",
  checkPermission("promotions.view"),
  checkFeature(FEATURE_KEYS.MKTG_PROMOTIONS),
  getPromotion,
);
router.put(
  "/:id",
  checkPermission("marketing.campaigns"),
  updatePromotion,
);
router.delete(
  "/:id",
  checkPermission("marketing.campaigns"),
  deletePromotion,
);
router.post(
  "/:id/activate",
  checkPermission("marketing.campaigns"),
  activateCampaign,
);
router.get(
  "/:id/analytics",
  checkPermission("marketing.campaigns"),
  getCampaignAnalytics,
);

export default router;
