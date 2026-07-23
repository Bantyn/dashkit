import { Router } from "express";
import { getVariants, createVariant, updateVariant, deleteVariant } from "../../../modules/variant/variant.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/", checkPermission("variants.view"), checkFeature(FEATURE_KEYS.INV_VARIANTS), getVariants);
router.post("/", checkPermission("variants.create"), checkFeature(FEATURE_KEYS.INV_VARIANTS), createVariant);
router.put("/:id", checkPermission("variants.edit"), checkFeature(FEATURE_KEYS.INV_VARIANTS), updateVariant);
router.delete("/:id", checkPermission("variants.delete"), checkFeature(FEATURE_KEYS.INV_VARIANTS), deleteVariant);

export default router;
