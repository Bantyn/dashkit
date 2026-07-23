import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db } from "../../config/firebase.config";
import * as ShiprocketService from "./shiprocket.service";
import { saveToken, getValidToken } from "./token-manager.service";

const COLLECTION = "shops";

export const connectShiprocket = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  let authResult: ShiprocketService.ShiprocketAuthResult;
  try {
    authResult = await ShiprocketService.authenticate(email, password);
  } catch (err: any) {
    return sendError(res, err.message || "Invalid Shiprocket credentials", 401);
  }

  await saveToken(shopId, authResult.token, authResult.expiry, email);

  let pickupLocations: ShiprocketService.PickupLocation[] = [];
  try {
    pickupLocations = await ShiprocketService.getPickupLocations(authResult.token);
  } catch {}

  return sendSuccess(
    res,
    { pickupLocations },
    "Shiprocket account connected successfully",
  );
});

export const getShiprocketStatus = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const docSnap = await db.collection(COLLECTION).doc(shopId).get();

  if (!docSnap.exists) return sendError(res, "Shop not found", 404);

  const sr = docSnap.data()?.shiprocket;
  if (!sr) {
    return sendSuccess(res, { connected: false, status: "not_connected" });
  }

  const expiry: Date = sr.tokenExpiry?.toDate
    ? sr.tokenExpiry.toDate()
    : new Date(sr.tokenExpiry || 0);

  const isExpired = expiry <= new Date();
  let status: "connected" | "not_connected" | "token_expired";
  if (!sr.connected) {
    status = isExpired && sr.encryptedToken ? "token_expired" : "not_connected";
  } else if (isExpired) {
    status = "token_expired";
  } else {
    status = "connected";
  }

  return sendSuccess(res, {
    connected: sr.connected && !isExpired,
    status,
    email: sr.email || null,
    defaultPickupLocation: sr.defaultPickupLocation || null,
    tokenExpiry: isExpired ? null : expiry,
  });
});

export const getPickupLocations = asyncHandler(async (req: Request, res: Response) => {
  const token = await getValidToken(String(req.params.shopId));
  if (!token) {
    return sendError(
      res,
      "Shiprocket not connected or token expired. Please reconnect.",
      401,
    );
  }

  try {
    const locations = await ShiprocketService.getPickupLocations(token);
    return sendSuccess(res, { pickupLocations: locations });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch pickup locations", 500);
  }
});

export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const token = await getValidToken(String(req.params.shopId));
  if (!token) {
    return sendError(
      res,
      "Shiprocket not connected or token expired. Please reconnect.",
      401,
    );
  }

  try {
    await ShiprocketService.getPickupLocations(token);
    return sendSuccess(res, { ok: true }, "Connection is active");
  } catch (err: any) {
    return sendError(res, err.message || "Connection test failed", 500);
  }
});

export const setDefaultPickupLocation = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { pickupLocationName } = req.body;

  if (!pickupLocationName) {
    return sendError(res, "pickupLocationName is required", 400);
  }

  await db.collection(COLLECTION).doc(shopId).update({
    "shiprocket.defaultPickupLocation": pickupLocationName,
    updatedAt: new Date(),
  });

  return sendSuccess(res, null, "Default pickup location updated");
});

export const disconnectShiprocket = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);

  await db.collection(COLLECTION).doc(shopId).update({
    shiprocket: {
      connected: false,
      email: "",
      encryptedToken: "",
      tokenExpiry: null,
      defaultPickupLocation: "",
    },
    updatedAt: new Date(),
  });

  return sendSuccess(res, null, "Shiprocket account disconnected");
});

export const shiprocketWebhook = asyncHandler(async (req: Request, res: Response) => {
  const event = req.body;

  console.log("[Shiprocket Webhook]", JSON.stringify(event, null, 2));

  const awb = event?.awb || event?.awb_code;
  const status = event?.current_status;
  const orderId = event?.order_id;

  if (orderId && status) {
    try {
      const snapshot = await db
        .collection("orders")
        .where("shiprocketOrderId", "==", String(orderId))
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const orderDoc = snapshot.docs[0];
        await orderDoc.ref.update({
          "tracking.awb": awb || orderDoc.data()?.tracking?.awb || null,
          "tracking.status": status,
          "tracking.updatedAt": new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      console.error("[Shiprocket Webhook] DB update error:", err);
    }
  }

  return res.status(200).json({ received: true });
});
