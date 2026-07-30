import { subscriptionLifecycleService } from "./subscription-lifecycle.service";
import { storageService } from "./storage.service";
import { db } from "../../config/firebase.config";
import { queueManager } from "../../infrastructure/queue/queue.manager";
import { QueueName, BillingJobData } from "../../infrastructure/queue/queue.types";

export class BillingCronService {
  private timer: NodeJS.Timeout | null = null;
  private storageTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  async start() {
    console.log("⚡ [Billing Cron] Initializing scheduled subscription lifecycle checks...");

    // Enqueue to BullMQ queue as repeatable/scheduled jobs
    const isRedis = await queueManager.init();

    if (isRedis) {
      const queue = queueManager.getQueue(QueueName.BILLING);
      if (queue) {
        // Schedule daily trial check job (runs every 24h)
        await queue.add(
          "check_trials",
          { action: "check_trials", timestamp: Date.now() },
          { repeat: { pattern: "0 0 * * *" }, jobId: "billing_daily_check_trials" }
        );

        // Schedule daily payment check job
        await queue.add(
          "check_payments",
          { action: "check_payments", timestamp: Date.now() },
          { repeat: { pattern: "0 1 * * *" }, jobId: "billing_daily_check_payments" }
        );

        // Schedule daily storage validation job
        await queue.add(
          "storage_validation",
          { action: "storage_validation", timestamp: Date.now() },
          { repeat: { pattern: "0 2 * * *" }, jobId: "billing_daily_storage_validation" }
        );

        // Schedule daily database log cleanup job (runs at 03:00 AM)
        const cleanupQueue = queueManager.getQueue(QueueName.CLEANUP);
        if (cleanupQueue) {
          await cleanupQueue.add(
            "daily_db_cleanup",
            { action: "daily_cleanup", dryRun: false, timestamp: Date.now() },
            { repeat: { pattern: "0 3 * * *" }, jobId: "daily_db_cleanup_job" }
          );
        }

        console.log("✅ [Billing Cron] Registered repeatable BullMQ cron jobs (Billing & DB Cleanup).");
      }
    } else {
      // In-process unreferenced timer fallback for non-Redis environments
      const intervalMs = 24 * 60 * 60 * 1000;
      this.timer = setInterval(() => {
        void this.runBillingJob();
      }, intervalMs);
      this.timer.unref();

      this.storageTimer = setInterval(() => {
        void this.runStorageValidationJob();
      }, intervalMs);
      this.storageTimer.unref();

      this.cleanupTimer = setInterval(() => {
        void this.runCleanupJob();
      }, intervalMs);
      this.cleanupTimer.unref();
    }

    if (process.env.NODE_ENV === "production") {
      void this.runBillingJob();
      void this.runStorageValidationJob();
      void this.runCleanupJob();
    }
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
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    console.log("[Billing Cron] Stopped.");
  }

  async runCleanupJob() {
    try {
      const { databaseCleanupWorkerService } = await import("../db-management/cleanup-worker.service");
      await databaseCleanupWorkerService.executeCleanup({ action: "daily_cleanup", dryRun: false });
    } catch (e) {
      console.error("[Billing Cron] Error during fallback cleanup job execution:", e);
    }
  }

  async runBillingJob() {
    console.log("[Billing Cron] Starting subscription lifecycle checks...");
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
    console.log("[Billing Cron] Starting storage calculation scan...");
    try {
      const shopsSnapshot = await db.collection("shops").get();
      let mismatchCount = 0;

      for (const doc of shopsSnapshot.docs) {
        const shopId = doc.id;
        const shop = doc.data();
        const prevBytes = shop.currentStorageBytes || 0;

        const result = await storageService.recalculateStorage(shopId);
        
        if (result.recalculatedBytes !== prevBytes) {
          console.warn(`[Billing Cron] Storage mismatch fixed for shop "${shop.shopName || shopId}": Previous: ${prevBytes} bytes, Recalculated: ${result.recalculatedBytes} bytes.`);
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
