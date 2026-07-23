import { Router } from "express";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
  listCustomPlanRequests,
  getCustomPlanRequest,
  updateCustomPlanRequestStatus,
  generateCustomPlanQuote,
  cancelCustomPlanRequest,
  generateCustomPlanPaymentLink,
  syncCustomPlanPaymentStatus,
} from "../../../modules/subscription-plan/subscription-plan.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

// Custom plan request management (admin) - MUST BE BEFORE /:id ROUTES
router.get("/custom-requests", checkPermission("plans.view"), listCustomPlanRequests);
router.get("/custom-requests/:id", checkPermission("plans.view"), getCustomPlanRequest);
router.patch("/custom-requests/:id/status", checkPermission("plans.edit"), updateCustomPlanRequestStatus);
router.post("/custom-requests/:id/quote", checkPermission("plans.edit"), generateCustomPlanQuote);
router.post("/custom-requests/:id/payment-link", checkPermission("plans.edit"), generateCustomPlanPaymentLink);
router.post("/custom-requests/:id/sync-payment", checkPermission("plans.edit"), syncCustomPlanPaymentStatus);
router.delete("/custom-requests/:id", checkPermission("plans.edit"), cancelCustomPlanRequest);

// Standard plans CRUD
router.get("/", checkPermission("plans.view"), listSubscriptionPlans);
router.get("/:id", checkPermission("plans.view"), getSubscriptionPlan);
router.post("/", checkPermission("plans.edit"), createSubscriptionPlan);
router.put("/:id", checkPermission("plans.edit"), updateSubscriptionPlan);
router.delete("/:id", checkPermission("plans.edit"), deleteSubscriptionPlan);

export default router;
