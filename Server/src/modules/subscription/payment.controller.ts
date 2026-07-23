import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { paymentService } from "./payment.service";

export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, planCode, billingCycle } = req.body;

  if (!planCode || !billingCycle) {
    return sendError(res, "planCode and billingCycle are required", 400);
  }

  try {
    const order = await paymentService.createOrder(shopId, planCode, billingCycle);
    return sendSuccess(res, order, "Razorpay order created successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create Razorpay order", 500);
  }
});

export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, shopId, planCode, billingCycle } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !shopId) {
    return sendError(res, "Missing required payment verification fields", 400);
  }

  try {
    const result = await paymentService.verifyPayment({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      shopId,
      planCode,
      billingCycle
    });

    return sendSuccess(res, result, "Payment verified and subscription activated successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to verify Razorpay payment", 400);
  }
});

export const createLimitUpgradeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, limitKey, quantity } = req.body;

  if (!shopId || !limitKey) {
    return sendError(res, "shopId and limitKey are required", 400);
  }

  try {
    const order = await paymentService.createLimitUpgradeOrder(shopId, limitKey, quantity || 1);
    return sendSuccess(res, order, "Limit upgrade order created successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create limit upgrade order", 500);
  }
});

export const verifyLimitUpgradePayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return sendError(res, "Missing required verification fields", 400);
  }

  try {
    const result = await paymentService.verifyLimitUpgradePayment({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature
    });

    return sendSuccess(res, result, "Payment verified and limit updated successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to verify limit upgrade payment", 400);
  }
});

export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const platformSettingsService = (await import("../platform-settings/platform-settings.service")).platformSettingsService;
  const billingSettings = await platformSettingsService.getBillingSettings();
  
  // Use a fallback environment variable if webhook secret is not in DB yet
  const webhookSecret = billingSettings.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Razorpay webhook secret not configured.");
    return sendError(res, "Webhook secret not configured", 500);
  }

  if (!signature) {
    return sendError(res, "Missing webhook signature", 400);
  }

  try {
    await paymentService.handleRazorpayWebhook(req.body, signature, webhookSecret);
    return res.status(200).json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook processing failed:", error.message);
    // Return 200 anyway so Razorpay doesn't keep retrying if signature fails, or 400 depending on preference.
    return res.status(400).json({ error: error.message });
  }
});

// ─── AutoPay / eMandate (Razorpay Subscriptions API) ──────────────────────────

export const createSubscriptionOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, planCode, billingCycle, totalCount } = req.body;

  if (!shopId || !planCode || !billingCycle) {
    return sendError(res, "shopId, planCode, and billingCycle are required", 400);
  }
  if (!["monthly", "yearly"].includes(billingCycle)) {
    return sendError(res, "billingCycle must be 'monthly' or 'yearly'", 400);
  }

  try {
    const result = await paymentService.createRazorpaySubscription({
      shopId,
      planCode,
      billingCycle,
      totalCount: totalCount ? Number(totalCount) : undefined,
    });
    return sendSuccess(res, result, "Razorpay subscription created. Redirect user to paymentUrl to register mandate.");
  } catch (error: any) {
    const status = error.message && (
      error.message.includes('has no valid') || 
      error.message.includes('already has an active') || 
      error.message.includes('not found') ||
      error.message.includes('shopId is required')
    ) ? 400 : 500;
    return sendError(res, error.message || "Failed to create AutoPay subscription", status);
  }
});

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, cancelAtCycleEnd } = req.body;

  if (!shopId) {
    return sendError(res, "shopId is required", 400);
  }

  try {
    await paymentService.cancelRazorpaySubscription(shopId, cancelAtCycleEnd !== false);
    return sendSuccess(res, null, "AutoPay subscription cancelled successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to cancel AutoPay subscription", 500);
  }
});

export const pauseSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.body;

  if (!shopId) {
    return sendError(res, "shopId is required", 400);
  }

  try {
    await paymentService.pauseRazorpaySubscription(shopId);
    return sendSuccess(res, null, "AutoPay subscription paused");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to pause AutoPay subscription", 500);
  }
});

export const resumeSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.body;

  if (!shopId) {
    return sendError(res, "shopId is required", 400);
  }

  try {
    await paymentService.resumeRazorpaySubscription(shopId);
    return sendSuccess(res, null, "AutoPay subscription resumed");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to resume AutoPay subscription", 500);
  }
});

export const generateRenewalLink = asyncHandler(async (req: Request, res: Response) => {
  const { shopId } = req.body;
  if (!shopId) {
    return sendError(res, "shopId is required", 400);
  }
  try {
    const { subscriptionLifecycleService } = await import("./subscription-lifecycle.service");
    const result = await subscriptionLifecycleService.generateRenewalPaymentLink(shopId);
    return sendSuccess(res, result, "Renewal payment link generated and notification sent successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to generate renewal link", 500);
  }
});

export const triggerBillingCron = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { billingCronService } = await import("./billing-cron.service");
    await billingCronService.runBillingJob();
    return sendSuccess(res, null, "Billing cron job triggered and run successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to trigger billing cron job", 500);
  }
});

