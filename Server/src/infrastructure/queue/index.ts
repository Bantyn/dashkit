import { queueManager } from "./queue.manager";
import { QueueName } from "./queue.types";
import { initCampaignWorker } from "./workers/campaign.worker";
import { initNotificationWorker } from "./workers/notification.worker";
import { initAnalyticsWorker } from "./workers/analytics.worker";
import { initBillingWorker } from "./workers/billing.worker";
import { initCleanupWorker } from "./workers/cleanup.worker";

export * from "./queue.types";
export * from "./queue.manager";

export async function initQueueSubsystem(): Promise<void> {
  console.log("⚡ [Queue System] Initializing BullMQ & Event Queue Subsystem...");
  
  // Test Redis connection and prepare manager
  await queueManager.init();

  // Register Worker handlers
  initCampaignWorker();
  initNotificationWorker();
  initAnalyticsWorker();
  initBillingWorker();
  initCleanupWorker();

  console.log("✅ [Queue System] All queue workers registered and ready.");
}

export async function shutdownQueueSubsystem(): Promise<void> {
  await queueManager.shutdownAll();
}
