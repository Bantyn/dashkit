import { queueManager } from "../queue.manager";
import { QueueName, CampaignJobData } from "../queue.types";
import { db } from "../../../config/firebase.config";
import { notificationSenderService } from "../../../shared/utils/notification-sender.service";

export function initCampaignWorker() {
  queueManager.registerWorker<CampaignJobData>(
    QueueName.CAMPAIGN,
    async (data) => {
      const { msgId, shopId, type, recipient, content } = data;
      // console.log(`[Campaign Worker Job] Processing campaign message ${msgId} for recipient ${recipient}`);

      // Idempotency check: verify message exists and is still pending
      const msgRef = db.collection("campaign_messages").doc(msgId);
      const msgSnap = await msgRef.get();

      if (!msgSnap.exists) {
        console.warn(`[Campaign Worker Job] Message ${msgId} not found in Firestore. Skipping.`);
        return { success: false, reason: "message_not_found" };
      }

      const msgData = msgSnap.data();
      if (msgData?.status === "delivered") {
        return { success: true, reason: "already_delivered" };
      }

      let success = false;
      let errorMsg: string | undefined;

      try {
        if (type === "sms") {
          success = await notificationSenderService.sendSMS(shopId, recipient, content);
        } else if (type === "whatsapp") {
          success = await notificationSenderService.sendWhatsApp(shopId, recipient, content);
        }

        await msgRef.update({
          status: success ? "delivered" : "failed",
          updatedAt: new Date()
        });
      } catch (err: any) {
        errorMsg = err.message || "Sending failed";
        await msgRef.update({
          status: "failed",
          error: errorMsg,
          updatedAt: new Date()
        });
        throw err; // Re-throw to trigger BullMQ exponential backoff retry if configured
      }

      return { success, msgId };
    },
    5 // Concurrency: 5 campaign messages in parallel
  );
}
