import { Router } from "express";
import {
  createBranch,
  deleteBranch,
  getBranchActivity,
  getBranchAnalytics,
  getBranchById,
  getBranchPermissions,
  getBranches,
  getBranchSummaries,
  updateBranch,
} from "../../../modules/branch/branch.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature, checkLimit } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS, LIMIT_KEYS } from "../../../modules/subscription/subscription.constants";
import { sendBranchSwitchOtp, verifyBranchSwitchOtp } from "../../../modules/branch/branch-auth.controller";

const router = Router();

router.get(
  "/shop/:shopId",
  checkPermission("view_branches"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  getBranches,
);
router.post(
  "/shop/:shopId/branches/:branchId/switch-otp/send",
  checkPermission("view_branches"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  sendBranchSwitchOtp,
);
router.post(
  "/shop/:shopId/branches/:branchId/switch-otp/verify",
  checkPermission("view_branches"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  verifyBranchSwitchOtp,
);
router.get(
  "/shop/:shopId/summaries",
  checkPermission("view_branches"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  getBranchSummaries,
);
router.get(
  "/shop/:shopId/analytics-summaries",
  checkPermission("view_branch_analytics"),
  checkFeature(FEATURE_KEYS.ANALYTICS_BRANCHES),
  getBranchSummaries,
);
router.get(
  "/shop/:shopId/permissions",
  checkPermission("manage_branch_permissions"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  getBranchPermissions,
);
router.get(
  "/shop/:shopId/:branchId/activity",
  checkPermission("view_branches"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  getBranchActivity,
);
router.get(
  "/shop/:shopId/:branchId/analytics",
  checkPermission("view_branch_analytics"),
  checkFeature(FEATURE_KEYS.ANALYTICS_BRANCHES),
  getBranchAnalytics,
);
router.get(
  "/:id",
  checkPermission("view_branches"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  getBranchById,
);
router.post(
  "/",
  checkPermission("edit_branch"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  checkLimit(LIMIT_KEYS.BRANCH_COUNT, { scope: "shop", period: "lifetime" }),
  createBranch,
);
router.put(
  "/:id",
  checkPermission("edit_branch"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  updateBranch,
);
router.delete(
  "/:id",
  checkPermission("edit_branch"),
  checkFeature(FEATURE_KEYS.ENT_MULTI_BRANCH),
  deleteBranch,
);

export default router;
