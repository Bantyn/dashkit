import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { orderService } from "./order.service";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.body);
  return sendSuccess(res, order, "Order created");
});

export const getOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await orderService.getOrders();
  return sendSuccess(res, orders, "Orders fetched");
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrder(String(req.params.id));
  if (!order) return sendError(res, "Order not found", 404);
  return sendSuccess(res, order, "Order fetched");
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  await orderService.updateOrderStatus(String(req.params.id), req.body.status);
  return sendSuccess(res, null, "Order status updated");
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  await orderService.updatePaymentStatus(String(req.params.id), req.body.paymentStatus);
  return sendSuccess(res, null, "Payment status updated");
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  await orderService.deleteOrder(String(req.params.id));
  return sendSuccess(res, null, "Order deleted");
});

export const getOrdersByShop = asyncHandler(async (req: any, res: Response) => {
  const orders = await orderService.getOrdersByShop(String(req.params.shopId), req.branchId);
  return sendSuccess(res, orders, "Shop orders fetched");
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, shopId, email } = req.query;
  if (!shopId) {
    return sendError(res, "Shop ID is required", 400);
  }

  // Prefer email-based lookup if email is provided
  if (email) {
    const orders = await orderService.getMyOrdersByEmail(String(email), String(shopId));
    return sendSuccess(res, orders, "My orders fetched");
  }

  if (!customerId) {
    return sendError(res, "Customer ID or email is required", 400);
  }
  const orders = await orderService.getMyOrders(String(customerId), String(shopId));
  return sendSuccess(res, orders, "My orders fetched");
});

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.trackOrder(String(req.params.id));
  if (!order) return sendError(res, "Order not found", 404);
  return sendSuccess(res, order, "Order tracking info fetched");
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
  const result = await orderService.verifyPayment(
    String(req.params.id),
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature
  );
  return sendSuccess(res, result, "Payment verified successfully");
});

export const sendOrderWhatsApp = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const order = await orderService.getOrder(String(id));
  
  if (!order) {
    return sendError(res, "Order not found", 404);
  }

  const rawPhone = 
    order.shippingAddress?.phone || 
    (order as any).customerDetails?.phone || 
    (order as any).customerPhone;

  const phone = rawPhone?.replace(/\D/g, "");
  if (!phone) {
    return sendError(res, "No valid phone number for customer", 400);
  }

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const name = 
    order.shippingAddress?.fullName || 
    (order as any).customerName || 
    'Customer';

  const defaultMessage = `Hello {{customerName}},\n\nYour order *{{orderNumber}}* has been placed successfully.\nAmount: *₹{{totalAmount}}*\nDate: ${dateStr}\nStatus: {{status}}\n\nThank you for shopping with us! 🛍️`;

  try {
    const { notificationSenderService } = await import("../../shared/utils/notification-sender.service");
    await notificationSenderService.sendTemplatedNotification(
      order.shopId,
      "whatsapp",
      "order_confirmation",
      phone,
      {
        customerName: name,
        orderNumber: order.displayId || order.id.slice(-8).toUpperCase(),
        totalAmount: order.totalAmount?.toLocaleString() || "0",
        status: order.status || order.orderStatus || "Pending",
      },
      "",
      defaultMessage
    );
    return sendSuccess(res, null, "WhatsApp sent successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to send WhatsApp", 400);
  }
});
