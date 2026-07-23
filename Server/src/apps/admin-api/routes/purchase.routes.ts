import { Router } from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getGoodsReceived,
  createGoodsReceived,
  getSupplierPayments,
  createSupplierPayment,
  getPurchaseReturns,
  createPurchaseReturn,
} from "../../../modules/purchase/purchase.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

// Suppliers
router.get("/suppliers", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_SUPPLIERS), getSuppliers);
router.post("/suppliers", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_SUPPLIERS), createSupplier);
router.put("/suppliers/:id", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_SUPPLIERS), updateSupplier);
router.delete("/suppliers/:id", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_SUPPLIERS), deleteSupplier);

// Purchase Orders
router.get("/orders", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), getPurchaseOrders);
router.get("/orders/:id", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), getPurchaseOrder);
router.post("/orders", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), createPurchaseOrder);
router.put("/orders/:id", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), updatePurchaseOrder);
router.delete("/orders/:id", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), deletePurchaseOrder);

// Goods Received Note
router.get("/received", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), getGoodsReceived);
router.post("/received", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), createGoodsReceived);

// Supplier Payments
router.get("/payments", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), getSupplierPayments);
router.post("/payments", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), createSupplierPayment);

// Purchase Returns
router.get("/returns", checkPermission("inventory.view"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), getPurchaseReturns);
router.post("/returns", checkPermission("inventory.edit"), checkFeature(FEATURE_KEYS.INV_PURCHASE_ORDERS), createPurchaseReturn);

export default router;
