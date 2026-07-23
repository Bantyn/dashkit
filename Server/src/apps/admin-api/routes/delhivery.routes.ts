import { Router } from "express";
import {
  checkServiceability,
  createShipment,
  getTracking,
  getPackingSlip,
} from "../../../modules/integrations/delhivery.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router({ mergeParams: true });

router.post(
  "/serviceability",
  checkPermission("settings.view"),
  checkFeature(FEATURE_KEYS.SHIP_SETUP),
  checkServiceability,
);

router.post(
  "/shipment",
  checkPermission("settings.edit"),
  checkFeature(FEATURE_KEYS.SHIP_SETUP),
  createShipment,
);

router.get(
  "/track/:awb",
  checkPermission("settings.view"),
  checkFeature(FEATURE_KEYS.SHIP_SETUP),
  getTracking,
);

router.get(
  "/packingslip/:awb",
  checkPermission("settings.view"),
  checkFeature(FEATURE_KEYS.SHIP_SETUP),
  getPackingSlip,
);

export default router;
