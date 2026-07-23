import { Router } from "express";
import {
  createOffer,
  getOffers,
  updateOffer,
  deleteOffer,
  validateCoupon,
} from "../../../modules/offer/offer.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.post(
  "/",
  checkPermission("offers.create"),
  checkFeature(FEATURE_KEYS.SELL_OFFERS_DISCOUNTS),
  createOffer,
);
router.get(
  "/shop/:shopId",
  checkPermission("offers.view"),
  checkFeature(FEATURE_KEYS.SELL_OFFERS_DISCOUNTS),
  getOffers,
);
router.put(
  "/:id",
  checkPermission("offers.edit"),
  checkFeature(FEATURE_KEYS.SELL_OFFERS_DISCOUNTS),
  updateOffer,
);
router.delete(
  "/:id",
  checkPermission("offers.delete"),
  checkFeature(FEATURE_KEYS.SELL_OFFERS_DISCOUNTS),
  deleteOffer,
);
router.post(
  "/validate",
  checkPermission("offers.view"),
  checkFeature(FEATURE_KEYS.SELL_OFFERS_DISCOUNTS),
  validateCoupon,
);

export default router;
