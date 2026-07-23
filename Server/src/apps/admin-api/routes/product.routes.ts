import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductsByShop,
  bulkImportProducts,
  getProductByBarcode,
  deleteAllProducts,
} from "../../../modules/product/product.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature, checkLimit } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS, LIMIT_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

// IMPORTANT: Specific routes MUST come before dynamic /:id routes to avoid conflicts

// Collection / list routes
router.get("/", checkPermission("products.view"), getProducts);
router.get("/shop/:shopId", checkPermission("products.view"), getProductsByShop);
router.get("/barcode/:shopId/:barcode", checkPermission("products.view"), getProductByBarcode);

// Mutation routes
router.post(
  "/",
  checkPermission("products.create"),
  checkLimit(LIMIT_KEYS.PRODUCTS_COUNT, { scope: "shop", period: "lifetime" }),
  createProduct
);
router.post(
  "/bulk-import",
  checkPermission("products.create"),
  checkFeature(FEATURE_KEYS.INV_BULK_IMPORT),
  bulkImportProducts,
);
router.delete("/shop/:shopId/all", checkPermission("products.delete"), deleteAllProducts);

// Dynamic /:id routes — MUST come last
router.get("/:id", checkPermission("products.view"), getProduct);
router.put("/:id", checkPermission("products.edit"), updateProduct);
router.delete("/:id", checkPermission("products.delete"), deleteProduct);

export default router;
