import { queueManager } from "../../infrastructure/queue/queue.manager";
import { QueueName, CampaignJobData } from "../../infrastructure/queue/queue.types";
import { db } from "../../config/firebase.config";
import { notificationSenderService } from "../../shared/utils/notification-sender.service";

class CampaignWorkerService {
  /**
   * Backward compatible start method.
   * Polling interval has been eliminated and replaced by BullMQ event-driven queues.
   */
  start() {
    console.log("⚡ [Campaign Worker] Initialized in Event-Driven Queue Mode (Polling disabled).");
  }

  stop() {
    console.log("[Campaign Worker] Stopped.");
  }

  /**
   * Dispatch campaign messages directly to the Event/BullMQ queue for asynchronous processing.
   */
  async enqueueCampaignMessage(msg: {
    msgId: string;
    campaignId: string;
    shopId: string;
    type: string;
    recipient: string;
    content: string;
  }) {
    const jobData: CampaignJobData = {
      campaignId: msg.campaignId,
      shopId: msg.shopId,
      type: msg.type,
      recipient: msg.recipient,
      content: msg.content,
      msgId: msg.msgId,
      deduplicationId: `campaign_msg_${msg.msgId}`
    };

    await queueManager.addJob<CampaignJobData>(
      QueueName.CAMPAIGN,
      "process-campaign-message",
      jobData,
      { jobId: jobData.deduplicationId }
    );
  }

  /**
   * Batch enqueue multiple campaign messages to the event queue.
   */
  async enqueueBatch(messages: Array<{
    msgId: string;
    campaignId: string;
    shopId: string;
    type: string;
    recipient: string;
    content: string;
  }>) {
    for (const msg of messages) {
      await this.enqueueCampaignMessage(msg);
    }
  }

  /**
   * Legacy method preserved for backward compatibility and manual trigger APIs.
   * Can sweep pending messages without continuous setInterval polling.
   */
  async processQueue() {
    const snapshot = await db.collection("campaign_messages")
      .where("status", "==", "pending")
      .orderBy("createdAt", "asc")
      .limit(50)
      .get();

    if (snapshot.empty) return;

    for (const doc of snapshot.docs) {
      const msg = doc.data();
      await this.enqueueCampaignMessage({
        msgId: doc.id,
        campaignId: msg.campaignId,
        shopId: msg.shopId,
        type: msg.type,
        recipient: msg.recipient,
        content: msg.content
      });
    }
  }
}

export const campaignWorkerService = new CampaignWorkerService();
