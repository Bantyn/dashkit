import { db } from "../../config/firebase.config";
import { notificationSenderService } from "../../shared/utils/notification-sender.service";

const BATCH_SIZE = 50;

class CampaignWorkerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  start() {
    // Run every 10 seconds
    this.intervalId = setInterval(() => this.processQueue(), 10 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const snapshot = await db.collection("campaign_messages")
        .where("status", "==", "pending")
        .orderBy("createdAt", "asc")
        .limit(BATCH_SIZE)
        .get();

      if (snapshot.empty) {
        this.isProcessing = false;
        return;
      }

      console.log(`[Campaign Worker] Processing ${snapshot.size} messages...`);

      const batch = db.batch();
      
      for (const doc of snapshot.docs) {
        const msg = doc.data();
        let success = false;
        
        try {
          if (msg.type === "sms") {
            success = await notificationSenderService.sendSMS(msg.shopId, msg.recipient, msg.content);
          } else if (msg.type === "whatsapp") {
            success = await notificationSenderService.sendWhatsApp(msg.shopId, msg.recipient, msg.content);
          }

          batch.update(doc.ref, {
            status: success ? "delivered" : "failed",
            updatedAt: new Date()
          });
        } catch (err: any) {
          batch.update(doc.ref, {
            status: "failed",
            error: err.message,
            updatedAt: new Date()
          });
        }
      }

      await batch.commit();
      console.log(`[Campaign Worker] Finished processing batch of ${snapshot.size} messages.`);

    } catch (err) {
      console.error("[Campaign Worker] Error processing queue:", err);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const campaignWorkerService = new CampaignWorkerService();
