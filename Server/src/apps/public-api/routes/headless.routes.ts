import { Router } from "express";
import { verifyHeadlessApiKey } from "../../../middlewares/headless-auth.middleware";
import {
  getHeadlessShop,
  getHeadlessProducts,
  getHeadlessCategories,
} from "../../../modules/shop/headless.controller";

const router = Router();

router.use(verifyHeadlessApiKey);

router.get("/shop", getHeadlessShop);
router.get("/products", getHeadlessProducts);
router.get("/categories", getHeadlessCategories);

export default router;
