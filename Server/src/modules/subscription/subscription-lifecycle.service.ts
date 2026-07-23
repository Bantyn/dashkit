import { db } from "../../config/firebase.config";
import { paymentService } from "./payment.service";
import { subscriptionService } from "./subscription.service";
import { createNotification } from "../notification/notification.controller";
import { ValidationError, NotFoundError } from "../../shared/utils/errors";

export class SubscriptionLifecycleService {
  /**
   * Expire trials that have exceeded their trial expiry date.
   */
  async checkAndExpireTrials() {
    const now = new Date();
    const shopsSnapshot = await db
      .collection("shops")
      .where("paymentStatus", "==", "trial")
      .get();

    let expiredCount = 0;
    for (const doc of shopsSnapshot.docs) {
      const shop = doc.data();
      if (!shop.trialExpiresAt) continue;

      const trialExpiresAt = shop.trialExpiresAt.toDate ? shop.trialExpiresAt.toDate() : new Date(shop.trialExpiresAt);
      if (trialExpiresAt < now) {
        // Expire the trial
        await doc.ref.update({
          paymentStatus: "expired",
          subscriptionStatus: "expired",
          updatedAt: now,
        });

        // Send Notification
        await createNotification({
          shopId: doc.id,
          title: "Free Trial Expired",
          message: `Your free trial has expired. Upgrade your plan to resume full operations.`,
          type: "subscription",
          link: "/subscription",
        });

        expiredCount++;
      }
    }

    // Invalidate access cache
    if (expiredCount > 0) {
      subscriptionService["invalidateAccessCache"]();
    }
    return expiredCount;
  }

  /**
   * Check nextBillingDate and transition to past_due (grace period) or expired.
   */
  async checkAndExpirePayments() {
    const now = new Date();
    
    // 1. Handle ACTIVE subscriptions whose next billing date has passed
    const activeSnapshot = await db
      .collection("shops")
      .where("paymentStatus", "==", "active")
      .get();

    let statusUpdatedCount = 0;
    for (const doc of activeSnapshot.docs) {
      const shop = doc.data();
      if (!shop.nextBillingDate) continue;
      
      const nextBillingDate = shop.nextBillingDate.toDate ? shop.nextBillingDate.toDate() : new Date(shop.nextBillingDate);
      
      if (nextBillingDate < now) {
        // If AutoPay is active, Razorpay webhook handles automatic charging.
        // If charge fails/halted, webhook changes status to 'failed' / 'halted'.
        // For Manual Billing, we move it to 'past_due' (grace period).
        if (!shop.autoPayEnabled) {
          await doc.ref.update({
            paymentStatus: "past_due",
            subscriptionStatus: "cancelled", // Inactive/cancelled until paid
            gracePeriodStartedAt: now,
            updatedAt: now,
          });

          await createNotification({
            shopId: doc.id,
            title: "Payment Past Due (3-day Grace Period)",
            message: `Your monthly renewal payment of plan ${String(shop.subscriptionPlan || "Plus").toUpperCase()} was due on ${nextBillingDate.toLocaleDateString()}. Please complete renewal to avoid service suspension.`,
            type: "subscription",
            link: "/subscription",
          });

          statusUpdatedCount++;
        }
      }
    }

    // 2. Handle PAST_DUE subscriptions whose 3-day grace period has elapsed
    const pastDueSnapshot = await db
      .collection("shops")
      .where("paymentStatus", "==", "past_due")
      .get();

    for (const doc of pastDueSnapshot.docs) {
      const shop = doc.data();
      const graceStart = shop.gracePeriodStartedAt?.toDate 
        ? shop.gracePeriodStartedAt.toDate() 
        : shop.nextBillingDate?.toDate 
          ? shop.nextBillingDate.toDate() 
          : new Date(shop.gracePeriodStartedAt || shop.updatedAt);
      
      const graceExpiry = new Date(graceStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days grace
      
      if (graceExpiry < now) {
        await doc.ref.update({
          paymentStatus: "expired",
          subscriptionStatus: "expired",
          updatedAt: now,
        });

        await createNotification({
          shopId: doc.id,
          title: "Account Suspended (Subscription Expired)",
          message: `Your subscription has expired and your account has been suspended. Please renew your plan now to regain access.`,
          type: "subscription",
          link: "/subscription",
        });

        statusUpdatedCount++;
      }
    }

    // 3. Send billing reminders (7 days, 3 days, 1 day remaining)
    await this.sendBillingReminders(now);

    if (statusUpdatedCount > 0) {
      subscriptionService["invalidateAccessCache"]();
    }

    return statusUpdatedCount;
  }

  /**
   * Helper to send billing reminders
   */
  private async sendBillingReminders(now: Date) {
    const activeSnapshot = await db
      .collection("shops")
      .where("paymentStatus", "==", "active")
      .get();

    for (const doc of activeSnapshot.docs) {
      const shop = doc.data();
      if (!shop.nextBillingDate || shop.autoPayEnabled) continue;

      const nextBilling = shop.nextBillingDate.toDate ? shop.nextBillingDate.toDate() : new Date(shop.nextBillingDate);
      const diffMs = nextBilling.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Remind at 7 days, 3 days, 1 day
      if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
        // Check if reminder was already sent for this cycle to avoid duplicate spamming
        const lastReminderDay = shop.metadata?.lastReminderDay;
        const lastReminderCycle = shop.metadata?.lastReminderCycle;
        
        const currentCycleKey = nextBilling.toISOString().substring(0, 10);
        
        if (lastReminderDay === diffDays && lastReminderCycle === currentCycleKey) {
          continue; // Already sent
        }

        // Send reminder
        await createNotification({
          shopId: doc.id,
          title: `Subscription Renewal Reminder: ${diffDays} Day${diffDays > 1 ? "s" : ""} Left`,
          message: `Your subscription for plan ${String(shop.subscriptionPlan || "Plus").toUpperCase()} will renew on ${nextBilling.toLocaleDateString()}. Please ensure renewal payment is completed.`,
          type: "subscription",
          link: "/subscription",
        });

        // Update metadata
        await doc.ref.update({
          "metadata.lastReminderDay": diffDays,
          "metadata.lastReminderCycle": currentCycleKey,
          updatedAt: now
        });
      }
    }
  }

  /**
   * Unified subscription activation / renewal
   */
  async activateSubscription(
    shopId: string,
    planCode: string,
    billingCycle: "monthly" | "yearly",
    paymentId: string,
    amount: number,
    paymentMethod: string = "online"
  ) {
    const db = (await import("../../config/firebase.config")).db;
    const now = new Date();
    const nextBillingDate = new Date(now);

    if (billingCycle === "yearly") {
      nextBillingDate.setFullYear(now.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(now.getMonth() + 1);
    }

    const plan = await subscriptionService.getPlan(planCode);
    const includedStorageMB = plan?.includedStorageMB ?? 500;
    const includedStorageBytes = plan?.includedStorageBytes ?? (includedStorageMB * 1024 * 1024);
    const storageUnit = plan?.storageUnit ?? "MB";
    const humanReadableStorage = plan?.storageDisplay ?? `${includedStorageMB} MB`;

    await db.collection("shops").doc(shopId).update({
      subscriptionPlan: planCode,
      selectedPlan: planCode,
      paymentStatus: "active",
      subscriptionStatus: "active",
      billingCycle: billingCycle,
      subscriptionUpdatedAt: now,
      paidAt: now,
      paymentId: paymentId,
      nextBillingDate: nextBillingDate,
      gracePeriodStartedAt: null,
      
      // Copy storage limits directly to the subscription
      includedStorageBytes,
      includedStorageMB,
      includedStorageGB: Number((includedStorageBytes / (1024 * 1024 * 1024)).toFixed(4)),
      humanReadableStorage,

      // Clear trial fields
      trialExpiresAt: null,
      trialStartedAt: null,
      trialDays: null,
      updatedAt: now,
    });

    // Create Billing Transaction
    const txnRef = db.collection("billing_transactions").doc();
    await txnRef.set({
      id: txnRef.id,
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      shopId,
      type: "subscription",
      planCode,
      billingPeriod: billingCycle,
      amount,
      paymentGateway: "razorpay",
      paymentMethod,
      paymentId,
      status: "success",
      createdAt: now,
      completedAt: now,
      notes: `Subscription renewed/activated successfully for ${planCode.toUpperCase()} (${billingCycle})`
    });

    // Send confirmation notification
    await createNotification({
      shopId,
      title: "Subscription Activated / Renewed",
      message: `Thank you! Your subscription for plan ${planCode.toUpperCase()} has been activated successfully until ${nextBillingDate.toLocaleDateString()}.`,
      type: "subscription",
      link: "/subscription",
    });

    // Invalidate access cache
    subscriptionService["invalidateAccessCache"](undefined, shopId);

    return { success: true, nextBillingDate };
  }

  /**
   * Admin generates renewal link for a shop
   */
  async generateRenewalPaymentLink(shopId: string) {
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) throw new NotFoundError("Shop not found");
    const shop = shopDoc.data() as any;

    const planCode = shop.subscriptionPlan || "plus";
    if (planCode === "free" || planCode === "trial") {
      throw new ValidationError("Free/Trial plans cannot generate renewal link");
    }

    const plan = await subscriptionService.getPlan(planCode);
    if (!plan) throw new NotFoundError("Plan details not found");

    const billingCycle = shop.billingCycle || "monthly";
    const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    if (!price || price <= 0) {
      throw new ValidationError("Renewal price must be greater than zero");
    }

    // Call paymentService order endpoint
    const orderData = await paymentService.createOrder(shopId, planCode, billingCycle);

    // Update shop doc with generated renewal details
    await db.collection("shops").doc(shopId).update({
      renewalOrderId: orderData.order_id,
      renewalAmount: price,
      renewalLinkGeneratedAt: new Date(),
      updatedAt: new Date(),
    });

    // Notify shop
    await createNotification({
      shopId,
      title: "Manual Renewal Payment Due",
      message: `Your monthly manual renewal payment of ₹${price} is due. Please click here to pay.`,
      type: "subscription",
      link: "/subscription",
    });

    return {
      orderId: orderData.order_id,
      amount: price,
      keyId: orderData.key_id,
    };
  }
}

export const subscriptionLifecycleService = new SubscriptionLifecycleService();
