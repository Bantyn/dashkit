import { queueManager } from "../queue.manager";
import { QueueName, NotificationJobData } from "../queue.types";
import { notificationSenderService } from "../../../shared/utils/notification-sender.service";
import { sendShopCustomerEmail } from "../../../shared/utils/email.util";

export function initNotificationWorker() {
  queueManager.registerWorker<NotificationJobData>(
    QueueName.NOTIFICATION,
    async (data) => {
      const { shopId, channel, recipient, content, templateId, templateData } = data;

      try {
        if (templateId) {
          const type = (channel as "email" | "sms" | "whatsapp") || "email";
          const code = templateId;
          const variables = templateData?.variables || {};
          const defaultSubject = templateData?.defaultSubject || "Notification";
          const defaultBody = templateData?.defaultBody || content || "";

          await notificationSenderService.sendTemplatedNotification(
            shopId,
            type,
            code,
            recipient,
            variables,
            defaultSubject,
            defaultBody
          );
        } else if (channel === "sms" && content) {
          await notificationSenderService.sendSMS(shopId, recipient, content);
        } else if (channel === "whatsapp" && content) {
          await notificationSenderService.sendWhatsApp(shopId, recipient, content);
        } else if (channel === "email" && content && templateData?.subject) {
          await sendShopCustomerEmail(shopId, recipient, templateData.subject, content, content);
        }

        return { success: true };
      } catch (err: any) {
        console.error(`[Notification Worker] Failed to send ${channel} notification to ${recipient}:`, err.message);
        throw err;
      }
    },
    10
  );
}
