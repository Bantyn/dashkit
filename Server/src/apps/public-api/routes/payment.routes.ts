import { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createLimitUpgradeOrder,
  verifyLimitUpgradePayment,
  razorpayWebhook,
  createSubscriptionOrder,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  generateRenewalLink,
  triggerBillingCron,
} from "../../../modules/subscription/payment.controller";
import { verifyToken } from "../../../middlewares/auth.middleware";

const router = Router();

// Payment routes (authenticated)
router.post("/create-order", verifyToken, createRazorpayOrder);
router.post("/guest-order", createRazorpayOrder); // Public route for registration
router.post("/verify-payment", verifyToken, verifyRazorpayPayment);

// Limit upgrade routes (authenticated)
router.post("/create-upgrade-order", verifyToken, createLimitUpgradeOrder);
router.post("/verify-upgrade-payment", verifyToken, verifyLimitUpgradePayment);

// AutoPay / eMandate routes (authenticated)
router.post("/create-subscription", verifyToken, createSubscriptionOrder);
router.post("/cancel-subscription", verifyToken, cancelSubscription);
router.post("/pause-subscription", verifyToken, pauseSubscription);
router.post("/resume-subscription", verifyToken, resumeSubscription);

// Manual Billing & Testing routes
router.post("/generate-renewal-link", verifyToken, generateRenewalLink);
router.post("/trigger-cron", triggerBillingCron);

// Webhooks (Public — must remain unauthenticated for Razorpay to call)
router.post("/webhook", razorpayWebhook);

export default router;

