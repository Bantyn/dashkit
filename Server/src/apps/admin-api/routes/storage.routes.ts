import { Router } from "express";
import {
  getStorageStatus,
  getDetailedUsage,
  recalculateStorage,
  purchaseAddon,
  cancelAddon,
  getStoragePricing
} from "../../../modules/subscription/storage.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router({ mergeParams: true });

router.get("/", checkPermission("plans.view"), getStorageStatus);
router.get("/usage", checkPermission("plans.view"), getDetailedUsage);
router.post("/recalculate", checkPermission("plans.edit"), recalculateStorage);
router.post("/addon", checkPermission("plans.edit"), purchaseAddon);
router.delete("/addon", checkPermission("plans.edit"), cancelAddon);
router.get("/pricing", checkPermission("plans.view"), getStoragePricing);

export default router;
