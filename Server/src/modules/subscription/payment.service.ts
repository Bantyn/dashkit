import Razorpay from "razorpay";
import crypto from "crypto";
import { platformSettingsService } from "../platform-settings/platform-settings.service";
import { subscriptionService } from "./subscription.service";
import { SubscriptionItem } from "./subscription-item.model";
import { APP_CONFIG } from "../../config/app.config";

const SUBSCRIPTION_ITEMS_COLLECTION = "subscription_items";
const ADDON_AUDIT_COLLECTION = "addon_audit_logs";

export class PaymentService {
  
  async getRazorpayInstance() {
    const billingSettings = await platformSettingsService.getBillingSettings();
    if (!billingSettings.razorpayKeyId || !billingSettings.razorpayKeySecret) {
      throw new Error("Payment gateway is not configured (missing Razorpay keys in Admin Settings).");
    }

    return new Razorpay({
      key_id: billingSettings.razorpayKeyId,
      key_secret: billingSettings.razorpayKeySecret,
    });
  }

  async createOrder(shopId: string | undefined, planCode: string, billingCycle: "monthly" | "yearly") {
    // 1. Get plan details to calculate amount
    const plan = await subscriptionService.getPlan(planCode);
    if (!plan) {
      throw new Error("Invalid subscription plan");
    }

    let price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    if (planCode === "custom") {
      if (!shopId) {
        throw new Error("shopId is required for custom plans");
      }
      const db = (await import("../../config/firebase.config")).db;
      const shopDoc = await db.collection("shops").doc(shopId).get();
      if (!shopDoc.exists) {
        throw new Error("Shop not found");
      }
      const shopData = shopDoc.data();
      price = shopData?.customPrice;

      if (!price || price <= 0) {
        throw new Error("Custom price is not set for this shop. Please contact the admin.");
      }
    } else if (!price || price <= 0) {
      throw new Error("Selected plan does not require payment");
    }

    // 2. Check Platform GST eligibility
    const gstInfo = await platformSettingsService.getGstCollectionInfo();
    const baseAmount = price;
    let gstAmount = 0;
    let gstRate = 0;

    if (gstInfo.enabled) {
      gstRate = gstInfo.gstRate;
      gstAmount = Math.round(baseAmount * (gstRate / 100) * 100) / 100;
    }

    const totalAmount = baseAmount + gstAmount;

    // Razorpay amount is in paise (multiply by 100)
    const amountInPaise = Math.round(totalAmount * 100);

    // 3. Initialize Razorpay
    const razorpay = await this.getRazorpayInstance();

    // 4. Create order
    const safeShopId = shopId || "guest";
    const options = {
      amount: amountInPaise,
      currency: plan.currency || "INR",
      receipt: `r_${safeShopId.substring(0, 10)}_${Date.now()}`, // Max 40 chars
      notes: {
        shopId: safeShopId,
        planCode,
        billingCycle,
        baseAmount: String(baseAmount),
        gstApplied: String(gstInfo.enabled),
        gstRate: String(gstRate),
        gstAmount: String(gstAmount),
        platformGstNumber: gstInfo.gstNumber,
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError: any) {
      console.error("Razorpay Order Creation Failed:", razorpayError);
      throw new Error(razorpayError?.error?.description || razorpayError?.message || "Failed to communicate with Razorpay. Please verify API keys in Admin.");
    }
    
    // Also return the key_id so frontend can use it
    const billingSettings = await platformSettingsService.getBillingSettings();

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: billingSettings.razorpayKeyId,
      // GST breakdown for UI display
      baseAmount,
      gstApplied: gstInfo.enabled,
      gstRate,
      gstAmount,
      totalAmount,
    };
  }


  async generatePaymentLink(amount: number, currency: string, customerData: { name: string; email: string; contact: string }, referenceId: string) {
    const razorpay = await this.getRazorpayInstance();
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || "INR",
      accept_partial: false,
      description: "Payment for Clothify Custom Plan Subscription",
      customer: customerData,
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        requestId: referenceId
      }
    };

    try {
      // paymentLink.create is a razorpay feature, access it securely
      const response = await (razorpay as any).paymentLink.create(options);
      return {
        paymentLinkId: response.id,
        paymentLinkUrl: response.short_url,
        status: response.status
      };
    } catch (error: any) {
      console.error("Razorpay Payment Link Creation Failed:", error);
      throw new Error(error?.error?.description || error?.message || "Failed to generate payment link via Razorpay.");
    }
  }

  async verifyPayment(params: {
    paymentId: string;
    orderId: string;
    signature: string;
    shopId: string;
    planCode: string;
    billingCycle: "monthly" | "yearly";
  }) {
    const billingSettings = await platformSettingsService.getBillingSettings();
    const key_secret = billingSettings.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(params.orderId + "|" + params.paymentId)
      .digest("hex");

    if (generated_signature !== params.signature) {
      throw new Error("Payment verification failed. Invalid signature.");
    }

    // Payment is valid, activate the subscription for the shop
    const db = (await import("../../config/firebase.config")).db;
    
    try {
      // Fetch payment details to get amount
      const razorpay = await this.getRazorpayInstance();
      const payment = await razorpay.payments.fetch(params.paymentId);
      const amountPaid = payment.amount ? Number(payment.amount) / 100 : 0;

      // Read the shop to get selectedPlan if planCode wasn't passed correctly
      const shopDoc = await db.collection("shops").doc(params.shopId).get();
      const shopData = shopDoc.exists ? shopDoc.data() : null;
      
      // Use selectedPlan from shop document as fallback (set during registration)
      const activePlanCode = params.planCode || shopData?.selectedPlan || "free";

      const now = new Date();
      const nextBillingDate = new Date(now);
      if (params.billingCycle === "yearly") {
        nextBillingDate.setFullYear(now.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(now.getMonth() + 1);
      }

      const { subscriptionLifecycleService } = await import("./subscription-lifecycle.service");
      await subscriptionLifecycleService.activateSubscription(
        params.shopId,
        activePlanCode,
        params.billingCycle,
        params.paymentId,
        amountPaid,
        payment.method || 'online'
      );
    } catch (e: any) {
       console.error("Failed to update subscription record after payment", e);
    }

    return { success: true, paymentId: params.paymentId };
  }

  // ─── Proration ───────────────────────────────────────────────────────────────

  /**
   * Compute prorated charge for remaining days in the current billing cycle.
   * Formula: (monthlyPrice / 30) * remainingDays
   */
  computeProration(shopNextBillingDate: Date | null, monthlyPrice: number): { proratedAmount: number; proratedDays: number } {
    if (!shopNextBillingDate) {
      // No billing date set — charge full first month
      return { proratedAmount: monthlyPrice, proratedDays: 30 };
    }
    const now = new Date();
    const msRemaining = shopNextBillingDate.getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const dailyRate = monthlyPrice / 30;
    const proratedAmount = Math.round(dailyRate * daysRemaining * 100) / 100;
    return { proratedAmount, proratedDays: daysRemaining };
  }

  // ─── Add-on Management ───────────────────────────────────────────────────────

  /**
   * Admin creates an add-on for a shop. Generates a Razorpay payment link for the
   * prorated first charge, then stores a subscription_items document in pending state.
   * The feature/limit is NOT activated until payment webhook confirms.
   */
  async createAddonPaymentLink(params: {
    shopId: string;
    itemKey: string;
    itemType: 'feature_addon' | 'limit_addon';
    name: string;
    price: number;             // Monthly recurring price
    quantity?: number;
    currency?: string;
    adminId?: string;
    notes?: string;
  }) {
    const db = (await import("../../config/firebase.config")).db;
    const FieldValue = (await import("firebase-admin/firestore")).FieldValue;
    const now = new Date();

    // Fetch shop for customer info and billing date
    const shopDoc = await db.collection("shops").doc(params.shopId).get();
    if (!shopDoc.exists) throw new Error("Shop not found");
    const shop = shopDoc.data() as any;

    // Compute proration
    const nextBillingDate = shop.nextBillingDate
      ? (shop.nextBillingDate.toDate ? shop.nextBillingDate.toDate() : new Date(shop.nextBillingDate))
      : null;
    const { proratedAmount, proratedDays } = this.computeProration(nextBillingDate, params.price * (params.quantity || 1));

    // Create subscription_item doc in pending state
    const itemRef = db.collection(SUBSCRIPTION_ITEMS_COLLECTION).doc();
    const subscriptionItemId = itemRef.id;

    const subscriptionItem: SubscriptionItem = {
      id: subscriptionItemId,
      shopId: params.shopId,
      type: params.itemType,
      itemKey: params.itemKey,
      name: params.name,
      price: params.price,
      currency: params.currency || "INR",
      billingCycle: "monthly",
      quantity: params.quantity || 1,
      status: "pending_payment",
      paymentStatus: "pending",
      proratedAmount,
      proratedDays,
      nextBillingDate: nextBillingDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      recurringEnabled: true,
      isDeleted: false,
      createdBy: params.adminId,
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };

    await itemRef.set(subscriptionItem);

    // Fetch owner's user details if email or phone is missing in shop
    const ownerId = shop.ownerId;
    let ownerEmail = shop.email || shop.ownerEmail || "";
    let ownerPhone = shop.phone || "";

    if (ownerId && (!ownerEmail || !ownerPhone)) {
      const ownerDoc = await db.collection("users").doc(ownerId).get();
      if (ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        if (!ownerEmail) ownerEmail = ownerData?.email || "";
        if (!ownerPhone) ownerPhone = ownerData?.phone || ownerData?.mobile || "";
      }
    }

    // Generate Razorpay payment link for the prorated amount
    const razorpay = await this.getRazorpayInstance();
    const amountInPaise = Math.round(proratedAmount * 100);

    const linkOptions: any = {
      amount: amountInPaise,
      currency: params.currency || "INR",
      accept_partial: false,
      description: `${params.name} — Add-on for ${shop.shopName || params.shopId} (${proratedDays} days proration)`,
      customer: {
        name: shop.shopName || "",
        email: ownerEmail,
        contact: ownerPhone
      },
      notify: { sms: true, email: true },
      reminder_enable: true,
      notes: {
        subscriptionItemId,
        shopId: params.shopId,
        itemKey: params.itemKey,
        itemType: params.itemType,
        type: "addon_payment"
      },
      expire_by: Math.floor((now.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days
    };

    let paymentLink: any;
    try {
      paymentLink = await (razorpay as any).paymentLink.create(linkOptions);
    } catch (err: any) {
      // Rollback — delete the pending item if link creation fails
      await itemRef.delete();
      throw new Error(err?.error?.description || err?.message || "Failed to generate Razorpay payment link");
    }

    // Update subscription item with payment link details
    await itemRef.update({
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      paymentLinkExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });

    // Write audit log
    await db.collection(ADDON_AUDIT_COLLECTION).add({
      shopId: params.shopId,
      subscriptionItemId,
      action: "payment_link_generated",
      itemKey: params.itemKey,
      price: params.price,
      proratedAmount,
      performedBy: params.adminId || "system",
      paymentLinkId: paymentLink.id,
      timestamp: now,
    });

    return {
      subscriptionItemId,
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      proratedAmount,
      proratedDays,
      monthlyRecurringPrice: params.price * (params.quantity || 1),
    };
  }

  /**
   * Cancel an active add-on subscription item.
   * Removes from shop's customFeatures/additionalLimits and marks item as cancelled.
   */
  async cancelAddon(shopId: string, subscriptionItemId: string, adminId?: string) {
    const db = (await import("../../config/firebase.config")).db;
    const FieldValue = (await import("firebase-admin/firestore")).FieldValue;
    const now = new Date();

    const itemRef = db.collection(SUBSCRIPTION_ITEMS_COLLECTION).doc(subscriptionItemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) throw new Error("Subscription item not found");

    const item = itemDoc.data() as SubscriptionItem;
    if (item.shopId !== shopId) throw new Error("Item does not belong to this shop");
    if (item.status === "cancelled") throw new Error("Item is already cancelled");

    // Remove from shop's active features/limits
    const shopRef = db.collection("shops").doc(shopId);
    if (item.type === "feature_addon") {
      await shopRef.update({
        customFeatures: FieldValue.arrayRemove(item.itemKey),
        updatedAt: now,
      });
    } else if (item.type === "limit_addon") {
      // Decrement additionalLimits
      const shopDoc = await shopRef.get();
      const shopData = shopDoc.data() as any;
      const currentExtra = shopData?.additionalLimits?.[item.itemKey] || 0;
      const decrement = item.quantity || 1;
      
      const updateData: any = {
        [`additionalLimits.${item.itemKey}`]: Math.max(0, currentExtra - decrement),
        updatedAt: now,
      };

      if (["storage_1gb", "storage_2gb", "storage_5gb"].includes(item.itemKey)) {
        updateData.storageAddonEnabled = false;
        updateData.storageAddonPlan = null;
        updateData.storageAddonAmount = 0;
        updateData.storageWarningSent = null;
        updateData.storageLimitReached = false;
      }

      await shopRef.update(updateData);
    }

    // Mark item as cancelled
    await itemRef.update({
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: adminId || "system",
      recurringEnabled: false,
      isDeleted: true,
      updatedAt: now,
    });

    // Write audit log
    await db.collection(ADDON_AUDIT_COLLECTION).add({
      shopId,
      subscriptionItemId,
      action: "cancelled",
      itemKey: item.itemKey,
      performedBy: adminId || "system",
      timestamp: now,
    });

    // Invalidate access cache
    subscriptionService["invalidateAccessCache"](undefined, shopId);

    return { success: true, subscriptionItemId, itemKey: item.itemKey };
  }

  async handleRazorpayWebhook(body: any, signature: string, webhookSecret: string) {
    const crypto = await import("crypto");
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");
      
    if (expectedSignature !== signature) {
      throw new Error("Invalid webhook signature");
    }

    const event = body.event;
    if (event === "payment_link.paid") {
      const entity = body.payload.payment_link.entity;
      const paymentLinkId = entity.id;
      const notes = entity.notes || {};
      const db = (await import("../../config/firebase.config")).db;
      const FieldValue = (await import("firebase-admin/firestore")).FieldValue;
      const now = new Date();

      // ── Handle Add-on Payment ────────────────────────────────────────────────
      if (notes.type === "addon_payment" && notes.subscriptionItemId) {
        await this._activateAddonFromWebhook(db, FieldValue, notes, entity, now);
        return { success: true };
      }

      // ── Handle Manual Renewal Payment webhook ─────────────────────────────
      if (notes.type === "manual_renewal") {
        const { subscriptionLifecycleService } = await import("./subscription-lifecycle.service");
        const amountPaid = entity.amount_paid ? Number(entity.amount_paid) / 100 : 0;
        const paymentId = entity.payments?.items?.[0]?.payment_id || entity.id;
        await subscriptionLifecycleService.activateSubscription(
          notes.shopId,
          notes.planCode,
          notes.billingCycle || "monthly",
          paymentId,
          amountPaid,
          "payment_link"
        );
        return { success: true };
      }

      // ── Handle Custom Plan Request ───────────────────────────────────────────
      const requestId = notes.requestId;
      let requestRef;
      let requestDoc;

      if (requestId) {
        requestRef = db.collection("custom_plan_requests").doc(requestId);
        requestDoc = await requestRef.get();
      } else {
        const querySnapshot = await db.collection("custom_plan_requests")
          .where("paymentLinkId", "==", paymentLinkId)
          .limit(1).get();
        if (!querySnapshot.empty) {
          requestDoc = querySnapshot.docs[0];
          requestRef = requestDoc.ref;
        }
      }

      if (requestDoc && requestDoc.exists && requestRef) {
        const token = crypto.randomBytes(16).toString("hex");
        const registrationLink = `${APP_CONFIG.FRONTEND_URL}/register?reqId=${requestDoc.id}&token=${token}`;
        
        await requestRef.update({
          status: "PAYMENT_COMPLETED",
          paymentCompletedAt: now,
          registrationToken: token,
          registrationLink: registrationLink,
          updatedAt: now,
          activityLog: FieldValue.arrayUnion({
            status: "PAYMENT_COMPLETED",
            note: "Customer completed the payment.",
            performedBy: "system",
            timestamp: now
          })
        });

        console.log(`Payment successful for custom plan request ${requestDoc.id}. Registration link generated: ${registrationLink}`);
      }
    }

    // ── Handle Razorpay Subscription Events ─────────────────────────────────
    if (event.startsWith("subscription.") || event.startsWith("invoice.")) {
      await this._handleSubscriptionWebhookEvent(body, event);
    }

    return { success: true };
  }

  private async _handleSubscriptionWebhookEvent(body: any, event: string) {
    const db = (await import("../../config/firebase.config")).db;
    const now = new Date();

    try {
      // Extract subscription entity from the appropriate payload key
      const subscriptionEntity =
        body.payload?.subscription?.entity ||
        body.payload?.payment?.entity?.subscription_id ||
        null;

      const subscriptionId: string | null =
        typeof subscriptionEntity === "string"
          ? subscriptionEntity
          : subscriptionEntity?.id || null;

      // For invoice events, get subscription id from invoice
      const invoiceEntity = body.payload?.invoice?.entity || null;
      const resolvedSubscriptionId =
        subscriptionId ||
        invoiceEntity?.subscription_id ||
        null;

      if (!resolvedSubscriptionId) {
        console.warn(`Subscription webhook '${event}': could not resolve subscription ID`);
        return;
      }

      // Find shop by razorpaySubscriptionId
      const shopQuery = await db
        .collection("shops")
        .where("razorpaySubscriptionId", "==", resolvedSubscriptionId)
        .limit(1)
        .get();

      if (shopQuery.empty) {
        // Check notes on subscription entity for shopId fallback
        const notes = subscriptionEntity?.notes || {};
        const shopId = notes.shopId;
        if (!shopId) {
          console.warn(`Subscription webhook '${event}': no shop found for subscription ${resolvedSubscriptionId}`);
          return;
        }
        const shopRef = db.collection("shops").doc(shopId);
        await this._applySubscriptionEvent(db, shopRef, shopId, event, body, resolvedSubscriptionId, now);
        return;
      }

      const shopDoc = shopQuery.docs[0];
      const shopId = shopDoc.id;
      const shopRef = shopDoc.ref;
      await this._applySubscriptionEvent(db, shopRef, shopId, event, body, resolvedSubscriptionId, now);
    } catch (err) {
      console.error(`Failed to handle subscription webhook event '${event}':`, err);
    }
  }

  private async _applySubscriptionEvent(
    db: any,
    shopRef: any,
    shopId: string,
    event: string,
    body: any,
    subscriptionId: string,
    now: Date
  ) {
    const subscriptionEntity = body.payload?.subscription?.entity || {};
    const invoiceEntity = body.payload?.invoice?.entity || {};
    const paymentEntity = body.payload?.payment?.entity || {};

    switch (event) {
      case "subscription.activated": {
        // Mandate registered — AutoPay is now live
        await shopRef.update({
          autoPayEnabled: true,
          autoPayStatus: "active",
          autoPayActivatedAt: now,
          subscriptionStatus: "active",
          paymentStatus: "active",
          updatedAt: now,
        });
        console.log(`AutoPay activated for shop ${shopId} (subscription: ${subscriptionId})`);
        break;
      }

      case "subscription.authenticated": {
        // Mandate authenticated but first charge not yet processed
        await shopRef.update({
          autoPayStatus: "authenticated",
          autoPayActivatedAt: now,
          updatedAt: now,
        });
        break;
      }

      case "subscription.charged": {
        // Recurring charge successful
        const amountPaid = (invoiceEntity.amount_paid || paymentEntity.amount || 0) / 100;
        const paymentId = paymentEntity.id || invoiceEntity.payment_id || subscriptionId;

        // Update shop billing date
        let nextBillingDate: Date | null = null;
        if (subscriptionEntity.current_end) {
          nextBillingDate = new Date(subscriptionEntity.current_end * 1000);
        } else if (subscriptionEntity.charge_at) {
          nextBillingDate = new Date(subscriptionEntity.charge_at * 1000);
        }

        const shopUpdate: any = {
          paymentStatus: "active",
          subscriptionStatus: "active",
          autoPayStatus: "active",
          lastAutoChargeAt: now,
          lastAutoChargeAmount: amountPaid,
          paidAt: now,
          updatedAt: now,
        };
        if (nextBillingDate) {
          shopUpdate.nextBillingDate = nextBillingDate;
        }

        await shopRef.update(shopUpdate);

        // Create billing transaction record
        const shopData = (await shopRef.get()).data() as any;
        const txnRef = db.collection("billing_transactions").doc();
        await txnRef.set({
          id: txnRef.id,
          transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          shopId,
          type: "subscription",
          planCode: shopData?.autoPayPlanCode || shopData?.subscriptionPlan || "unknown",
          billingPeriod: shopData?.autoPayBillingCycle || "monthly",
          amount: amountPaid,
          paymentGateway: "razorpay",
          paymentMethod: "autopay",
          paymentId,
          razorpaySubscriptionId: subscriptionId,
          status: "success",
          createdAt: now,
          completedAt: now,
          notes: `AutoPay recurring charge via Razorpay Subscription`,
        });

        // Audit log
        await db.collection(ADDON_AUDIT_COLLECTION).add({
          shopId,
          action: "autopay_charge_success",
          razorpaySubscriptionId: subscriptionId,
          amountPaid,
          paymentId,
          performedBy: "webhook",
          timestamp: now,
        });

        console.log(`AutoPay charge ₹${amountPaid} for shop ${shopId} — txn created`);
        break;
      }

      case "subscription.halted": {
        // Auto-debit failed after retries — shop access should be restricted
        await shopRef.update({
          paymentStatus: "failed",
          autoPayStatus: "halted",
          subscriptionStatus: "past_due",
          updatedAt: now,
        });

        await db.collection(ADDON_AUDIT_COLLECTION).add({
          shopId,
          action: "autopay_charge_halted",
          razorpaySubscriptionId: subscriptionId,
          performedBy: "webhook",
          timestamp: now,
        });

        console.warn(`AutoPay halted for shop ${shopId} — payment failed repeatedly`);
        break;
      }

      case "subscription.cancelled": {
        await shopRef.update({
          autoPayEnabled: false,
          autoPayStatus: "cancelled",
          autoPayCancelledAt: now,
          updatedAt: now,
        });

        await db.collection(ADDON_AUDIT_COLLECTION).add({
          shopId,
          action: "autopay_subscription_cancelled_by_razorpay",
          razorpaySubscriptionId: subscriptionId,
          performedBy: "webhook",
          timestamp: now,
        });
        break;
      }

      case "subscription.resumed": {
        await shopRef.update({
          autoPayEnabled: true,
          autoPayStatus: "active",
          paymentStatus: "active",
          updatedAt: now,
        });
        break;
      }

      case "subscription.paused": {
        await shopRef.update({
          autoPayStatus: "paused",
          autoPayPausedAt: now,
          updatedAt: now,
        });
        break;
      }

      case "subscription.pending":
      case "subscription.completed": {
        // Log only
        await db.collection(ADDON_AUDIT_COLLECTION).add({
          shopId,
          action: `autopay_event_${event.replace(".", "_")}`,
          razorpaySubscriptionId: subscriptionId,
          performedBy: "webhook",
          timestamp: now,
        });
        break;
      }

      default:
        console.log(`Unhandled subscription webhook event: ${event} for shop ${shopId}`);
    }

    // Invalidate subscription access cache after any event
    subscriptionService["invalidateAccessCache"](undefined, shopId);
  }



  private async _activateAddonFromWebhook(db: any, FieldValue: any, notes: any, entity: any, now: Date) {
    const subscriptionItemId = String(notes.subscriptionItemId);
    const shopId = String(notes.shopId);
    const itemKey = String(notes.itemKey);
    const itemType = String(notes.itemType);

    const itemRef = db.collection(SUBSCRIPTION_ITEMS_COLLECTION).doc(subscriptionItemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      console.error(`Webhook: subscription_item ${subscriptionItemId} not found`);
      return;
    }
    const item = itemDoc.data() as SubscriptionItem;
    if (item.status !== "pending_payment") {
      console.warn(`Webhook: subscription_item ${subscriptionItemId} is not in pending state, skipping`);
      return;
    }

    const amountPaid = entity.amount_paid ? Number(entity.amount_paid) / 100 : 0;
    const paymentId = entity.payments?.items?.[0]?.payment_id || entity.id;

    // 1. Activate the feature/limit on the shop
    const shopRef = db.collection("shops").doc(shopId);
    if (itemType === "feature_addon") {
      await shopRef.update({
        customFeatures: FieldValue.arrayUnion(itemKey),
        updatedAt: now,
      });
    } else if (itemType === "limit_addon") {
      const shopDoc = await shopRef.get();
      const shopData = shopDoc.data() as any;
      const current = shopData?.additionalLimits?.[itemKey] || 0;
      
      const updateData: any = {
        [`additionalLimits.${itemKey}`]: current + (item.quantity || 1),
        updatedAt: now,
      };

      if (["storage_1gb", "storage_2gb", "storage_5gb"].includes(itemKey)) {
        let addonSize = "";
        if (itemKey === "storage_1gb") addonSize = "+1 GB";
        else if (itemKey === "storage_2gb") addonSize = "+2 GB";
        else if (itemKey === "storage_5gb") addonSize = "+5 GB";

        updateData.storageAddonEnabled = true;
        updateData.storageAddonPlan = addonSize;
        updateData.storageAddonAmount = item.price * (item.quantity || 1);
        updateData.storageBillingCycle = "monthly";
        updateData.storageRenewDate = item.nextBillingDate || shopData.nextBillingDate || null;
        updateData.storageLimitReached = false;
        updateData.storageWarningSent = null;
      }

      await shopRef.update(updateData);
    }

    // 2. Mark subscription item as active
    await itemRef.update({
      status: "active",
      paymentStatus: "paid",
      paymentId,
      activatedAt: now,
      purchasedAt: now,
      updatedAt: now,
    });

    // 3. Create billing transaction
    const txnRef = db.collection("billing_transactions").doc();
    await txnRef.set({
      id: txnRef.id,
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      shopId,
      type: "extra_feature",
      featureCode: itemKey,
      billingPeriod: "monthly",
      amount: amountPaid,
      paymentGateway: "razorpay",
      paymentMethod: "payment_link",
      paymentId,
      subscriptionItemId,
      status: "success",
      createdAt: now,
      completedAt: now,
      notes: `Add-on activated: ${item.name} (${item.proratedDays} day proration)`,
    });

    // 4. Audit log
    await db.collection(ADDON_AUDIT_COLLECTION).add({
      shopId,
      subscriptionItemId,
      action: "activated",
      itemKey,
      amountPaid,
      paymentId,
      performedBy: "webhook",
      timestamp: now,
    });

    // 5. Invalidate subscription access cache
    subscriptionService["invalidateAccessCache"](undefined, shopId);

    console.log(`Add-on ${itemKey} activated for shop ${shopId} via webhook. Amount: ₹${amountPaid}`);
  }

  async createLimitUpgradeOrder(shopId: string, limitKey: string, quantity: number = 1) {
    const prices = {
      staff_count: { price: 199, increment: 1 },
      branch_count: { price: 500, increment: 1 },
      invoices_per_month: { price: 199, increment: 500 },
      products_count: { price: 99, increment: 1000 }
    };

    const config = prices[limitKey as keyof typeof prices];
    if (!config) {
      throw new Error("Invalid limit key for upgrade");
    }

    const price = config.price * quantity;
    const amountInPaise = Math.round(price * 100);

    const razorpay = await this.getRazorpayInstance();

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `l_${shopId.substring(0, 10)}_${Date.now()}`,
      notes: {
        shopId,
        limitKey,
        quantity: String(quantity),
        incrementAmount: String(config.increment * quantity),
        type: "limit_upgrade"
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError: any) {
      console.error("Razorpay Limit Upgrade Order Creation Failed:", razorpayError);
      throw new Error(razorpayError?.error?.description || razorpayError?.message || "Failed to create order");
    }

    const billingSettings = await platformSettingsService.getBillingSettings();

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: billingSettings.razorpayKeyId
    };
  }

  async verifyLimitUpgradePayment(params: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) {
    const billingSettings = await platformSettingsService.getBillingSettings();
    const key_secret = billingSettings.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(params.orderId + "|" + params.paymentId)
      .digest("hex");

    if (generated_signature !== params.signature) {
      throw new Error("Payment verification failed. Invalid signature.");
    }

    const db = (await import("../../config/firebase.config")).db;
    
    try {
      const razorpay = await this.getRazorpayInstance();
      const payment = await razorpay.payments.fetch(params.paymentId);
      const amountPaid = payment.amount ? Number(payment.amount) / 100 : 0;

      const order = await razorpay.orders.fetch(params.orderId);
      const notes = (order.notes as any) || {};
      const shopId = String(notes.shopId || "");
      const limitKey = String(notes.limitKey || "");
      const incrementAmount = Number(notes.incrementAmount || 0);

      if (!shopId || !limitKey || !incrementAmount) {
        throw new Error("Invalid order notes in Razorpay order");
      }

      const shopRef = db.collection("shops").doc(shopId);
      const shopDoc = await shopRef.get();
      if (!shopDoc.exists) {
        throw new Error("Shop not found");
      }
      const shopData = shopDoc.data();

      const now = new Date();
      
      const updateData: any = {};
      updateData[`additionalLimits.${limitKey}`] = (shopData?.additionalLimits?.[limitKey] || 0) + incrementAmount;
      updateData.updatedAt = now;

      // Append to purchase history
      const purchaseEntry = {
        limitKey,
        incrementAmount,
        amountPaid,
        paymentId: params.paymentId,
        purchasedAt: now
      };
      updateData.limitPurchases = (shopData?.limitPurchases || []).concat(purchaseEntry);

      await shopRef.update(updateData);

      // Create Billing Transaction
      const txnRef = db.collection("billing_transactions").doc();
      await txnRef.set({
        id: txnRef.id,
        transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        shopId,
        type: 'extra_feature',
        featureCode: `${limitKey}_upgrade`,
        billingPeriod: limitKey === "branch_count" ? "monthly" : "one-time",
        amount: amountPaid,
        paymentGateway: 'razorpay',
        paymentMethod: payment.method || 'online',
        paymentId: params.paymentId,
        status: 'success',
        createdAt: now,
        completedAt: now,
        notes: `Increased ${limitKey} limit by ${incrementAmount}`
      });

      return { success: true, shopId, limitKey, incrementAmount };
    } catch (e: any) {
      console.error("Failed to verify limit upgrade payment and update shop", e);
      throw e;
    }
  }
  // ─── Razorpay AutoPay / eMandate (Subscriptions API) ───────────────────────

  /**
   * Lazily creates a Razorpay Plan entity (or fetches cached plan ID from Firestore).
   * Razorpay requires a Plan object to create Subscriptions.
   * Plans are stored on the Firestore plan document to avoid duplicate creation.
   */
  async ensureRazorpayPlan(planCode: string, billingCycle: "monthly" | "yearly", shopId?: string): Promise<string> {
    const db = (await import("../../config/firebase.config")).db;

    let price = 0;
    let planName = "";
    let currency = "INR";
    let planDescription = "";
    let internalPlanId = planCode;

    // Handle legacy 'base' plan mapping
    if (planCode === 'base') {
       planCode = 'starter';
    }

    const cycleProp = billingCycle === "yearly" ? "yearly" : "monthly";

    if (planCode === 'custom') {
       if (!shopId) throw new Error("shopId is required to create a custom Razorpay Plan");
       const shopDoc = await db.collection("shops").doc(shopId).get();
       if (!shopDoc.exists) throw new Error("Shop not found");
       const shop = shopDoc.data() as any;
       
       const customPrice = billingCycle === "yearly" ? (shop.customYearlyPrice || shop.customPrice * 10) : shop.customPrice;
       if (!customPrice || customPrice <= 0) throw new Error(`Custom plan has no valid ${billingCycle} price`);
       
       // Check if custom razorpay plan ID is already created for this shop
       if (shop.razorpayCustomPlanId?.[cycleProp]) {
          return shop.razorpayCustomPlanId[cycleProp] as string;
       }

       price = customPrice;
       planName = `Custom Plan for ${shop.shopName || shopId}`;
       planDescription = `Clothify custom subscription for ${shop.shopName || shopId}`;
    } else {
       // Load standard plan from Firestore
       const planDoc = await db.collection("plans").doc(planCode).get();
       if (!planDoc.exists) throw new Error(`Plan '${planCode}' not found`);
       const plan = planDoc.data() as any;

       // Return existing Razorpay Plan ID if already created
       if (plan.razorpayPlanId?.[cycleProp]) {
         return plan.razorpayPlanId[cycleProp] as string;
       }

       price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
       if (!price || price <= 0) {
         throw new Error(`Plan '${planCode}' has no valid ${billingCycle} price for AutoPay`);
       }

       planName = `Clothify ${plan.name} Plan (${billingCycle})`;
       planDescription = plan.description || `Clothify ${plan.name} subscription`;
       currency = plan.currency || "INR";
       internalPlanId = plan.id;
    }

    const razorpay = await this.getRazorpayInstance();
    const platformSettingsService = (await import("../platform-settings/platform-settings.service")).platformSettingsService;
    const billingSettings = await platformSettingsService.getBillingSettings();

    // Create Razorpay Plan
    const razorpayPlan = await (razorpay as any).plans.create({
      period: billingCycle === "yearly" ? "yearly" : "monthly",
      interval: 1,
      item: {
        name: planName,
        amount: Math.round(price * 100), // in paise
        currency: currency || billingSettings.currency || "INR",
        description: planDescription,
      },
      notes: {
        planCode,
        billingCycle,
        internalPlanId,
      },
    });

    if (planCode === 'custom' && shopId) {
      await db.collection("shops").doc(shopId).update({
        [`razorpayCustomPlanId.${cycleProp}`]: razorpayPlan.id,
        updatedAt: new Date(),
      });
    } else {
      await db.collection("plans").doc(planCode).update({
        [`razorpayPlanId.${cycleProp}`]: razorpayPlan.id,
        updatedAt: new Date(),
      });
    }

    return razorpayPlan.id as string;
  }

  /**
   * Creates a Razorpay Subscription for a shop and stores the subscription ID.
   * The shop owner is then redirected to Razorpay's hosted mandate registration page.
   * The subscription is NOT activated until the mandate is registered and first charge succeeds.
   */
  async createRazorpaySubscription(params: {
    shopId: string;
    planCode: string;
    billingCycle: "monthly" | "yearly";
    totalCount?: number; // Number of billing cycles; 0 = unlimited (Razorpay max: use 9999)
  }) {
    const db = (await import("../../config/firebase.config")).db;
    const now = new Date();

    // 1. Fetch shop for customer info
    const shopDoc = await db.collection("shops").doc(params.shopId).get();
    if (!shopDoc.exists) throw new Error("Shop not found");
    const shop = shopDoc.data() as any;

    // 2. Guard: prevent duplicate active subscriptions
    if (shop.razorpaySubscriptionId && shop.autoPayEnabled) {
      throw new Error(
        "This shop already has an active AutoPay subscription. Cancel the existing one before creating a new one."
      );
    }

    // 3. Ensure Razorpay Plan exists
    const razorpayPlanId = await this.ensureRazorpayPlan(params.planCode, params.billingCycle, params.shopId);

    // 4. Resolve customer email & phone
    const ownerId = shop.ownerId;
    let ownerEmail = shop.email || shop.ownerEmail || "";
    let ownerPhone = shop.phone || "";

    if (ownerId && (!ownerEmail || !ownerPhone)) {
      const ownerDoc = await db.collection("users").doc(ownerId).get();
      if (ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        if (!ownerEmail) ownerEmail = ownerData?.email || "";
        if (!ownerPhone) ownerPhone = ownerData?.phone || ownerData?.mobile || "";
      }
    }

    // Razorpay Subscriptions / eMandate requires a valid contact number.
    // If missing, provide a fallback so the hosted checkout page loads.
    if (!ownerPhone) {
      ownerPhone = "9999999999";
    }

    const razorpay = await this.getRazorpayInstance();
    const platformSettingsService = (await import("../platform-settings/platform-settings.service")).platformSettingsService;
    const billingSettings = await platformSettingsService.getBillingSettings();
    // 5. Create Razorpay Customer (or reuse existing)
    let razorpayCustomerId = shop.razorpayCustomerId;
    if (!razorpayCustomerId && ownerEmail) {
      try {
        const customer = await (razorpay as any).customers.create({
          name: shop.shopName || shop.ownerName || ownerEmail,
          email: ownerEmail,
          contact: ownerPhone || undefined,
          notes: { shopId: params.shopId },
        });
        razorpayCustomerId = customer.id;
        // Persist customer ID
        await db.collection("shops").doc(params.shopId).update({
          razorpayCustomerId,
          updatedAt: now,
        });
      } catch (_e) {
        // Customer creation is best-effort; Razorpay can still create subscription without it
      }
    }

    // 6. Create Razorpay Subscription
    const totalCount = params.totalCount ?? (billingSettings as any).autoPayTotalCount ?? 0;
    const maxAllowedCount = params.billingCycle === 'yearly' ? 100 : 1200;
    const subscriptionPayload: any = {
      plan_id: razorpayPlanId,
      total_count: totalCount > 0 ? totalCount : maxAllowedCount, // max allowed by Razorpay
      quantity: 1,
      customer_notify: 1,
      notes: {
        shopId: params.shopId,
        planCode: params.planCode,
        billingCycle: params.billingCycle,
        type: "subscription_autopay",
      },
    };

    if (razorpayCustomerId) {
      subscriptionPayload.customer_id = razorpayCustomerId;
    }

    let razorpaySubscription: any;
    try {
      razorpaySubscription = await (razorpay as any).subscriptions.create(subscriptionPayload);
    } catch (err: any) {
      throw new Error(
        err?.error?.description || err?.message || "Failed to create Razorpay subscription"
      );
    }

    // 7. Persist subscription ID on shop (status: pending_mandate)
    await db.collection("shops").doc(params.shopId).update({
      razorpaySubscriptionId: razorpaySubscription.id,
      autoPayEnabled: false, // will flip to true on subscription.activated webhook
      autoPayStatus: "pending_mandate",
      autoPayPlanCode: params.planCode,
      autoPayBillingCycle: params.billingCycle,
      autoPayUrl: razorpaySubscription.short_url,
      updatedAt: now,
    });

    // 8. Write audit log
    await db.collection(ADDON_AUDIT_COLLECTION).add({
      shopId: params.shopId,
      action: "autopay_subscription_created",
      razorpaySubscriptionId: razorpaySubscription.id,
      planCode: params.planCode,
      billingCycle: params.billingCycle,
      performedBy: "system",
      timestamp: now,
    });

    return {
      subscriptionId: razorpaySubscription.id,
      shortUrl: razorpaySubscription.short_url,
      paymentUrl: razorpaySubscription.short_url,
      status: razorpaySubscription.status,
      razorpayKeyId: billingSettings.razorpayKeyId,
    };
  }

  /**
   * Cancels the active Razorpay Subscription for a shop.
   * Can be called at end of current billing cycle (cancel_at_cycle_end=1) or immediately.
   */
  async cancelRazorpaySubscription(shopId: string, cancelAtCycleEnd = true) {
    const db = (await import("../../config/firebase.config")).db;
    const now = new Date();

    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) throw new Error("Shop not found");
    const shop = shopDoc.data() as any;

    const isDev = process.env.NODE_ENV !== "production";

    if (!shop.razorpaySubscriptionId && !isDev) {
      throw new Error("No active AutoPay subscription found for this shop");
    }

    if (shop.razorpaySubscriptionId) {
      try {
        const razorpay = await this.getRazorpayInstance();
        await (razorpay as any).subscriptions.cancel(
          shop.razorpaySubscriptionId,
          { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }
        );
      } catch (err: any) {
        console.warn("Razorpay subscription cancel failed:", err.message);
        if (!isDev) {
          throw new Error(err?.error?.description || err?.message || "Failed to cancel subscription");
        }
      }
    }

    await db.collection("shops").doc(shopId).update({
      autoPayEnabled: false,
      autoPayStatus: cancelAtCycleEnd ? "cancelling" : "cancelled",
      autoPayCancelledAt: now,
      updatedAt: now,
    });

    await db.collection(ADDON_AUDIT_COLLECTION).add({
      shopId,
      action: "autopay_subscription_cancelled",
      razorpaySubscriptionId: shop.razorpaySubscriptionId || "mock_id",
      cancelAtCycleEnd,
      performedBy: "admin",
      timestamp: now,
    });
  }

  /**
   * Pauses the active Razorpay Subscription (shop owner request or admin action).
   */
  async pauseRazorpaySubscription(shopId: string) {
    const db = (await import("../../config/firebase.config")).db;
    const now = new Date();

    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) throw new Error("Shop not found");
    const shop = shopDoc.data() as any;

    if (!shop.razorpaySubscriptionId) throw new Error("No AutoPay subscription to pause");

    const razorpay = await this.getRazorpayInstance();
    try {
      await (razorpay as any).subscriptions.pause(shop.razorpaySubscriptionId, {
        pause_at: "now",
      });
    } catch (err: any) {
      throw new Error(err?.error?.description || err?.message || "Failed to pause subscription");
    }

    await db.collection("shops").doc(shopId).update({
      autoPayStatus: "paused",
      autoPayPausedAt: now,
      updatedAt: now,
    });
  }

  /**
   * Resumes a paused Razorpay Subscription.
   */
  async resumeRazorpaySubscription(shopId: string) {
    const db = (await import("../../config/firebase.config")).db;
    const now = new Date();

    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) throw new Error("Shop not found");
    const shop = shopDoc.data() as any;

    if (!shop.razorpaySubscriptionId) throw new Error("No AutoPay subscription to resume");

    const razorpay = await this.getRazorpayInstance();
    try {
      await (razorpay as any).subscriptions.resume(shop.razorpaySubscriptionId, {
        resume_at: "now",
      });
    } catch (err: any) {
      throw new Error(err?.error?.description || err?.message || "Failed to resume subscription");
    }

    await db.collection("shops").doc(shopId).update({
      autoPayStatus: "active",
      updatedAt: now,
    });
  }

  async getShopBillingTransactions(shopId: string) {
    const db = (await import("../../config/firebase.config")).db;
    const querySnapshot = await db
      .collection("billing_transactions")
      .where("shopId", "==", shopId)
      .get();
      
    const transactions = querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    // Sort descending by createdAt in memory
    return transactions.sort((a: any, b: any) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    }).slice(0, 50);
  }
}

export const paymentService = new PaymentService();
