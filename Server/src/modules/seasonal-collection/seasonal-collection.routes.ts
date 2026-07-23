import { Router } from "express";
import {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
} from "./seasonal-collection.controller";
import { checkPermission } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", checkPermission("seasonal_collections"), listCollections);
router.post("/", checkPermission("seasonal_collections"), createCollection);
router.get("/:id", checkPermission("seasonal_collections"), getCollection);
router.put("/:id", checkPermission("seasonal_collections"), updateCollection);
router.delete("/:id", checkPermission("seasonal_collections"), deleteCollection);

export default router;
