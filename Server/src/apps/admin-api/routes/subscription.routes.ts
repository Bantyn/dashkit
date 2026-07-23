import { Router } from "express";
import {
  assignPlanToUser,
  resolveSubscriptionAccess,
} from "../../../modules/subscription/subscription.controller";
import { checkPermission } from "../../../middlewares/role.middleware";

const router = Router();

router.get("/access/:userId", checkPermission("plans.view"), resolveSubscriptionAccess);
router.put("/users/:userId/plan", checkPermission("subscriptions.assign"), assignPlanToUser);

export default router;
