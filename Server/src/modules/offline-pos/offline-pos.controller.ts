import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { offlinePosService } from "./offline-pos.service";

export const getCounters = asyncHandler(async (req: any, res: Response) => {
  const shopId = req.user?.shopId || req.params?.shopId || req.query?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 404);

  const counters = await offlinePosService.getCounters(String(shopId));
  return sendSuccess(res, counters, "POS Counters fetched successfully");
});

export const getCounter = asyncHandler(async (req: Request, res: Response) => {
  const counter = await offlinePosService.getCounter(String(req.params.id));
  if (!counter) return sendError(res, "POS Counter not found", 404);
  return sendSuccess(res, counter, "POS Counter fetched successfully");
});

export const createCounter = asyncHandler(async (req: any, res: Response) => {
  const shopId = req.user?.shopId || req.body?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 400);

  const { name, description, branchId, location } = req.body;
  if (!name) return sendError(res, "Counter name is required", 400);

  const result = await offlinePosService.createCounter(
    String(shopId),
    { name, description, branchId, location },
    req.user?.email || "shop_owner"
  );
  return sendSuccess(res, result, "POS Counter created successfully", 201);
});

export const updateCounter = asyncHandler(async (req: any, res: Response) => {
  const shopId = req.user?.shopId || req.body?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 400);

  const updated = await offlinePosService.updateCounter(
    String(req.params.id),
    String(shopId),
    req.body,
    req.user?.email || "shop_owner"
  );
  return sendSuccess(res, updated, "POS Counter updated successfully");
});

export const deleteCounter = asyncHandler(async (req: any, res: Response) => {
  const shopId = req.user?.shopId || req.query?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 400);

  await offlinePosService.deleteCounter(
    String(req.params.id),
    String(shopId),
    req.user?.email || "shop_owner"
  );
  return sendSuccess(res, null, "POS Counter deleted successfully");
});

export const regenerateCredentials = asyncHandler(async (req: any, res: Response) => {
  const shopId = req.user?.shopId || req.body?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 400);

  const newCredentials = await offlinePosService.regenerateCredentials(
    String(req.params.id),
    String(shopId),
    req.user?.email || "shop_owner"
  );
  return sendSuccess(res, newCredentials, "POS Counter credentials regenerated successfully");
});

export const getLogs = asyncHandler(async (req: any, res: Response) => {
  const shopId = req.user?.shopId || req.query?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 400);

  const logs = await offlinePosService.getLogs(String(shopId));
  return sendSuccess(res, logs, "POS Audit logs fetched successfully");
});

export const authenticateDesktop = asyncHandler(async (req: Request, res: Response) => {
  const { counterId, apiKey, secretKey, appVersion, os, desktopName, shopId } = req.body;
  if (!counterId || !apiKey || !secretKey) {
    return sendError(res, "Missing counterId, apiKey, or secretKey", 400);
  }

  const result = await offlinePosService.authenticateDesktop({
    shopId,
    counterId,
    apiKey,
    secretKey,
    appVersion,
    os,
    desktopName,
    ipAddress: req.ip,
  });

  return sendSuccess(res, result, "Desktop POS Authenticated Successfully");
});

export const heartbeat = asyncHandler(async (req: Request, res: Response) => {
  const { counterId, apiKey, appVersion, os } = req.body;
  if (!counterId || !apiKey) {
    return sendError(res, "Missing counterId or apiKey", 400);
  }

  const ok = await offlinePosService.heartbeat(counterId, apiKey, {
    appVersion,
    os,
    ipAddress: req.ip,
  });

  if (!ok) return sendError(res, "Device heartbeat failed", 400);
  return sendSuccess(res, { status: "online", timestamp: new Date() }, "Heartbeat received");
});

export const syncInvoice = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body || {};
  const shopId = payload.shopId || (req.headers["x-shop-id"] as string) || req.query.shopId;
  
  if (!shopId) {
    return sendError(res, "Missing shopId in invoice payload or headers", 400);
  }

  const { invoiceService } = await import("../invoice/invoice.service");
  
  const invoiceData = payload.invoice || payload;
  const createdInvoice = await invoiceService.createInvoice({
    ...invoiceData,
    shopId: String(shopId),
    source: "offline_pos_counter",
    counterId: payload.counterId || invoiceData.counterId,
  });

  return sendSuccess(res, createdInvoice, "Offline POS Invoice synced successfully", 201);
});
