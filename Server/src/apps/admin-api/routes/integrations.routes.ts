import { Router } from "express";
import {
  getIntegrations,
  updateIntegrations,
  deleteIntegration,
} from "../../../modules/integrations/integrations.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router({ mergeParams: true });

router.get("/", checkPermission("settings.view"), getIntegrations);
router.put("/", checkPermission("settings.edit"), updateIntegrations);
router.delete(
  "/:provider",
  checkPermission("settings.edit"),
  deleteIntegration,
);

export default router;
