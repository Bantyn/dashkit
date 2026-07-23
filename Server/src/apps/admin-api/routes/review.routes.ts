import { Router } from "express";
import { getAllReviews, updateReviewStatus, deleteReview } from "../../../modules/review/review.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get("/", checkPermission("reviews.view"), checkFeature(FEATURE_KEYS.CUST_REVIEWS), getAllReviews);
router.put("/:reviewId/status", checkPermission("reviews.edit"), checkFeature(FEATURE_KEYS.CUST_REVIEWS), updateReviewStatus);
router.delete("/:reviewId", checkPermission("reviews.delete"), checkFeature(FEATURE_KEYS.CUST_REVIEWS), deleteReview);

export default router;
