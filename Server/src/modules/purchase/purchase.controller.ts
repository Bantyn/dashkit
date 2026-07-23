import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { purchaseService } from "./purchase.service";

// ─── Suppliers ───────────────────────────────────────────────────────────────
export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const suppliers = await purchaseService.getSuppliers(shopId);
  return sendSuccess(res, suppliers, "Suppliers fetched successfully");
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.shopId || !data.name) {
    return sendError(res, "Shop ID and Name are required", 400);
  }

  const supplier = await purchaseService.createSupplier(data);
  return sendSuccess(res, supplier, "Supplier created successfully", undefined);
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  await purchaseService.updateSupplier(String(id), data);
  return sendSuccess(res, null, "Supplier updated successfully");
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await purchaseService.deleteSupplier(String(id));
  return sendSuccess(res, null, "Supplier deleted successfully");
});

// ─── Purchase Orders ────────────────────────────────────────────────────────
export const getPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const orders = await purchaseService.getPurchaseOrders(shopId);
  return sendSuccess(res, orders, "Purchase orders fetched successfully");
});

export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await purchaseService.getPurchaseOrder(String(id));
  if (!order) return sendError(res, "Purchase order not found", 404);
  return sendSuccess(res, order, "Purchase order fetched successfully");
});

export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.shopId || !data.supplierId || !data.items || data.items.length === 0) {
    return sendError(res, "Shop ID, Supplier ID, and Items are required", 400);
  }

  const order = await purchaseService.createPurchaseOrder(data);
  return sendSuccess(res, order, "Purchase order created successfully");
});

export const updatePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  await purchaseService.updatePurchaseOrder(String(id), data);
  return sendSuccess(res, null, "Purchase order updated successfully");
});

export const deletePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await purchaseService.deletePurchaseOrder(String(id));
  return sendSuccess(res, null, "Purchase order deleted successfully");
});

// ─── Goods Received Note (GRN) ──────────────────────────────────────────────────
export const getGoodsReceived = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const grns = await purchaseService.getGoodsReceived(shopId);
  return sendSuccess(res, grns, "Goods received notes fetched successfully");
});

export const createGoodsReceived = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.shopId || !data.purchaseOrderId || !data.items || data.items.length === 0) {
    return sendError(res, "Shop ID, Purchase Order ID, and Items are required", 400);
  }

  const grn = await purchaseService.createGoodsReceived(data);
  return sendSuccess(res, grn, "Goods received note created successfully");
});

// ─── Supplier Payments ─────────────────────────────────────────────────────────
export const getSupplierPayments = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const payments = await purchaseService.getSupplierPayments(shopId);
  return sendSuccess(res, payments, "Supplier payments fetched successfully");
});

export const createSupplierPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.shopId || !data.purchaseOrderId || !data.amount) {
    return sendError(res, "Shop ID, Purchase Order ID, and Amount are required", 400);
  }

  const payment = await purchaseService.createSupplierPayment(data);
  return sendSuccess(res, payment, "Supplier payment recorded successfully");
});

// ─── Purchase Returns ──────────────────────────────────────────────────────────
export const getPurchaseReturns = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.query.shopId);
  if (!shopId) return sendError(res, "Shop ID is required", 400);

  const returns = await purchaseService.getPurchaseReturns(shopId);
  return sendSuccess(res, returns, "Purchase returns fetched successfully");
});

export const createPurchaseReturn = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.shopId || !data.supplierId || !data.items || data.items.length === 0) {
    return sendError(res, "Shop ID, Supplier ID, and Items are required", 400);
  }

  const ret = await purchaseService.createPurchaseReturn(data);
  return sendSuccess(res, ret, "Purchase return recorded successfully");
});
