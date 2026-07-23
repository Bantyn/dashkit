import { Router } from "express";
import {
  createFeature,
  deleteFeature,
  getFeature,
  listFeatures,
  updateFeature,
} from "../../../modules/subscription/subscription.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/", checkPermission("features.view"), listFeatures);
router.get("/:key", checkPermission("features.view"), getFeature);
router.post("/", checkPermission("features.edit"), createFeature);
router.put("/:key", checkPermission("features.edit"), updateFeature);
router.delete("/:key", checkPermission("features.edit"), deleteFeature);

export default router;
