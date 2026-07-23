import { Router } from "express";
import { getBrands, createBrand, updateBrand, deleteBrand } from "../../../modules/brand/brand.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/", checkPermission("brands.view"), checkFeature(FEATURE_KEYS.INV_BRANDS), getBrands);
router.post("/", checkPermission("brands.create"), checkFeature(FEATURE_KEYS.INV_BRANDS), createBrand);
router.put("/:id", checkPermission("brands.edit"), checkFeature(FEATURE_KEYS.INV_BRANDS), updateBrand);
router.delete("/:id", checkPermission("brands.delete"), checkFeature(FEATURE_KEYS.INV_BRANDS), deleteBrand);

export default router;
