import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { delhiveryService } from "./delhivery.service";
import { db } from "../../config/firebase.config";

export const checkServiceability = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { pincode } = req.body;

  if (!pincode) {
    return sendError(res, "Pincode is required", 400);
  }

  try {
    const data = await delhiveryService.checkServiceability(shopId, String(pincode));
    return sendSuccess(res, data, "Serviceability checked successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to check serviceability", 500);
  }
});

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { orderId } = req.body;

  if (!orderId) {
    return sendError(res, "orderId is required", 400);
  }

  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) {
    return sendError(res, "Order not found", 404);
  }

  const order = { id: orderSnap.id, ...orderSnap.data() };

  try {
    const data = await delhiveryService.createShipment(shopId, order);
    if (data.success === false) {
      return sendError(res, data.error || "Failed to create shipment with Delhivery", 400);
    }
    
    // Save waybill to the order tracking info if created successfully
    const waybill = data.packages?.[0]?.waybill;
    if (waybill) {
      await orderSnap.ref.update({
        "tracking.awb": waybill,
        "tracking.provider": "delhivery",
        "tracking.status": "pickup_scheduled",
        "tracking.updatedAt": new Date(),
        updatedAt: new Date(),
      });
    }

    return sendSuccess(res, data, "Shipment created successfully in Delhivery");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create shipment", 500);
  }
});

export const getTracking = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const awb = String(req.params.awb);

  try {
    const data = await delhiveryService.getTrackingDetails(shopId, awb);
    return sendSuccess(res, data, "Tracking details fetched successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch tracking details", 500);
  }
});

export const getPackingSlip = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const awb = String(req.params.awb);

  try {
    const url = await delhiveryService.getPackingSlipUrl(shopId, awb);
    return sendSuccess(res, { url }, "Packing slip URL generated");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to generate packing slip URL", 500);
  }
});
