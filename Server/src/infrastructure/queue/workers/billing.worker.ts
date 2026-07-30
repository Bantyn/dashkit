import { queueManager } from "../queue.manager";
import { QueueName, BillingJobData } from "../queue.types";
import { subscriptionLifecycleService } from "../../../modules/subscription/subscription-lifecycle.service";
import { storageService } from "../../../modules/subscription/storage.service";
import { db } from "../../../config/firebase.config";

export function initBillingWorker() {
  queueManager.registerWorker<BillingJobData>(
    QueueName.BILLING,
    async (data) => {
      const { action } = data;

      if (action === "check_trials") {
        console.log("[Billing Worker Job] Executing subscription trial expiry check...");
        const expiredTrials = await subscriptionLifecycleService.checkAndExpireTrials();
        return { success: true, count: expiredTrials };
      } else if (action === "check_payments") {
        console.log("[Billing Worker Job] Executing subscription grace period check...");
        const expiredPayments = await subscriptionLifecycleService.checkAndExpirePayments();
        return { success: true, count: expiredPayments };
      } else if (action === "storage_validation") {
        console.log("[Billing Worker Job] Executing storage validation scan...");
        const shopsSnapshot = await db.collection("shops").get();
        let mismatchCount = 0;

        for (const doc of shopsSnapshot.docs) {
          const shopId = doc.id;
          const shop = doc.data();
          const prevBytes = shop.currentStorageBytes || 0;
          const result = await storageService.recalculateStorage(shopId);

          if (result.recalculatedBytes !== prevBytes) {
            console.warn(`[Billing Worker Job] Storage mismatch fixed for shop "${shop.shopName || shopId}": Previous: ${prevBytes} bytes, Recalculated: ${result.recalculatedBytes} bytes.`);
            mismatchCount++;
          }
        }
        return { success: true, count: mismatchCount };
      }

      return { success: false, reason: "unknown_action" };
    },
    1 // Concurrency: 1 job at a time for billing tasks
  );
}
