import { Router } from "express";
import {
  getSubscriptionPlan,
  listSubscriptionPlans,
  createCustomPlanRequest
} from "../../../modules/subscription-plan/subscription-plan.controller";

const router = Router();

router.get("/", listSubscriptionPlans);
router.post("/custom-request", createCustomPlanRequest);
router.get("/:id", getSubscriptionPlan);

export default router;
