import { Router } from "express";
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getCategories, createCategory, deleteCategory
} from "../../../modules/expense/expense.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/shop/:shopId", checkPermission("expenses.view"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), getExpenses);
router.post("/shop/:shopId", checkPermission("expenses.create"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), createExpense);
router.put("/:id", checkPermission("expenses.edit"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), updateExpense);
router.delete("/:id", checkPermission("expenses.delete"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), deleteExpense);

router.get("/shop/:shopId/categories", checkPermission("expenses.view"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), getCategories);
router.post("/shop/:shopId/categories", checkPermission("expenses.create"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), createCategory);
router.delete("/categories/:id", checkPermission("expenses.delete"), checkFeature(FEATURE_KEYS.FIN_EXPENSES), deleteCategory);

export default router;
