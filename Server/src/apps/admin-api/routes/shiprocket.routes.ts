import { Router } from "express";
import {
  connectShiprocket,
  getShiprocketStatus,
  getPickupLocations,
  testConnection,
  setDefaultPickupLocation,
  disconnectShiprocket,
} from "../../../modules/integrations/shiprocket.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router({ mergeParams: true });

router.post(
  "/connect",
  checkPermission("shiprocket.edit"),
  checkFeature(FEATURE_KEYS.SHIP_SHIPROCKET),
  connectShiprocket,
);
router.get(
  "/status",
  checkPermission("shiprocket.view"),
  checkFeature(FEATURE_KEYS.SHIP_SHIPROCKET),
  getShiprocketStatus,
);
router.get(
  "/pickup-locations",
  checkPermission("shiprocket.view"),
  checkFeature(FEATURE_KEYS.SHIP_SHIPROCKET),
  getPickupLocations,
);
router.post(
  "/test",
  checkPermission("shiprocket.view"),
  checkFeature(FEATURE_KEYS.SHIP_SHIPROCKET),
  testConnection,
);
router.put(
  "/pickup-location",
  checkPermission("shiprocket.edit"),
  checkFeature(FEATURE_KEYS.SHIP_SHIPROCKET),
  setDefaultPickupLocation,
);
router.post(
  "/disconnect",
  checkPermission("shiprocket.edit"),
  checkFeature(FEATURE_KEYS.SHIP_SHIPROCKET),
  disconnectShiprocket,
);

export default router;
