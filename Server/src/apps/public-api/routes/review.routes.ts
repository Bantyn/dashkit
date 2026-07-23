import { Router } from "express";
import { addReview, getProductReviews } from "../../../modules/review/review.controller";
import { resolveShopMiddleware } from "../../../modules/shop/website.middleware";

const router = Router();

router.use(resolveShopMiddleware);
router.post("/", addReview);
router.get("/:productId", getProductReviews);

export default router;
