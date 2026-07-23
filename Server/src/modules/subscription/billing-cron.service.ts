import { subscriptionLifecycleService } from "./subscription-lifecycle.service";
import { storageService } from "./storage.service";
import { db } from "../../config/firebase.config";

export class BillingCronService {
  private timer: NodeJS.Timeout | null = null;
  private storageTimer: NodeJS.Timeout | null = null;

  start() {
    // Only run immediately on startup in production to save Firestore read quota during development
    if (process.env.NODE_ENV === "production") {
      void this.runBillingJob();
      void this.runStorageValidationJob();
    }

    // Schedule to run every 24 hours
    const intervalMs = 24 * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      void this.runBillingJob();
    }, intervalMs);

    this.storageTimer = setInterval(() => {
      void this.runStorageValidationJob();
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.storageTimer) {
      clearInterval(this.storageTimer);
      this.storageTimer = null;
    }
    console.log("[Billing Cron] Stopped.");
  }

  async runBillingJob() {
    console.log("[Billing Cron] Starting daily subscription lifecycle checks...");
    try {
      const expiredTrials = await subscriptionLifecycleService.checkAndExpireTrials();
      console.log(`[Billing Cron] Check complete. Expired ${expiredTrials} trials.`);

      const expiredPayments = await subscriptionLifecycleService.checkAndExpirePayments();
      console.log(`[Billing Cron] Check complete. Expired/updated grace periods for ${expiredPayments} shops.`);
    } catch (error) {
      console.error("[Billing Cron] Error during billing job run:", error);
    }
  }

  async runStorageValidationJob() {
    console.log("[Billing Cron] Starting daily storage calculation scan...");
    try {
      const shopsSnapshot = await db.collection("shops").get();
      let mismatchCount = 0;

      for (const doc of shopsSnapshot.docs) {
        const shopId = doc.id;
        const shop = doc.data();
        const prevBytes = shop.currentStorageBytes || 0;

        const result = await storageService.recalculateStorage(shopId);
        
        if (result.recalculatedBytes !== prevBytes) {
          console.warn(`[Billing Cron] Storage mismatch fixed for shop "${shop.shopName || shopId}": Previous: ${prevBytes} bytes, Recalculated: ${result.recalculatedBytes} bytes. Difference: ${result.recalculatedBytes - prevBytes} bytes.`);
          mismatchCount++;
        }
      }
      console.log(`[Billing Cron] Storage calculation scan complete. Checked ${shopsSnapshot.size} shops. Fixed ${mismatchCount} mismatches.`);
    } catch (error) {
      console.error("[Billing Cron] Error during storage validation job:", error);
    }
  }
}

export const billingCronService = new BillingCronService();
