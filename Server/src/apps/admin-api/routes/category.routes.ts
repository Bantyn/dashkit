import { Router } from "express";
import {
  createCategory,
  getCategoriesByShop,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../../../modules/category/category.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.post("/", checkPermission("categories.create"), createCategory);
router.get("/shop/:shopId", checkPermission("categories.view"), getCategoriesByShop);
router.get("/:id", checkPermission("categories.view"), getCategory);
router.put("/:id", checkPermission("categories.edit"), updateCategory);
router.delete("/:id", checkPermission("categories.delete"), deleteCategory);

export default router;
