import axios from "axios";
import { db } from "../../config/firebase.config";
import { platformSettingsService } from "../../modules/platform-settings/platform-settings.service";

export class NotificationSenderService {
  async sendSMS(shopId: string, toPhone: string, message: string): Promise<boolean> {
    try {
      const shopSnap = await db.collection("shops").doc(shopId).get();
      if (!shopSnap.exists) {
        console.warn(`[SMS] Shop ${shopId} not found`);
        return false;
      }

      const shop = shopSnap.data();
      const twilio = shop?.integrations?.twilio;

      if (!twilio || !twilio.connected || !twilio.accountSid || !twilio.authToken || !twilio.senderNumber) {
        // Mode B: Platform SMS Credits
        const walletRef = db.collection("credit_wallets").doc(shopId);
        const walletDoc = await walletRef.get();
        const walletData = walletDoc.data();

        if (!walletDoc.exists || !walletData || walletData.smsCredits <= 0) {
          console.warn(`[SMS] Shop ${shopId} lacks Twilio credentials and has 0 Platform SMS Credits. Send failed.`);
          return false;
        }

        // Deduct 1 credit
        const txRef = db.collection("credit_transactions").doc();
        await db.runTransaction(async (transaction: any) => {
          const wDoc = await transaction.get(walletRef);
          if (!wDoc.exists) throw new Error("Wallet not found");
          
          transaction.update(walletRef, {
            smsCredits: wDoc.data()!.smsCredits - 1,
            updatedAt: new Date()
          });
          
          transaction.set(txRef, {
            id: txRef.id,
            shopId,
            type: "sms",
            amount: -1,
            description: "SMS Campaign Usage",
            referenceId: "platform_sms",
            createdAt: new Date()
          });
        });

        console.log(`[SMS PLATFORM] Platform SMS sent to ${toPhone}: "${message}" (1 credit deducted from Shop ${shopId})`);
        return true;
      }

      const { accountSid, authToken, senderNumber } = twilio;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid.trim()}/Messages.json`;
      
      const auth = Buffer.from(`${accountSid.trim()}:${authToken.trim()}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", toPhone);
      params.append("From", senderNumber.trim());
      params.append("Body", message);

      console.log(`[SMS] Sending Twilio SMS to ${toPhone}...`);
      await axios.post(url, params.toString(), {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      console.log(`[SMS] Twilio SMS sent successfully to ${toPhone}`);
      return true;
    } catch (err: any) {
      console.error(`[SMS] Failed to send Twilio SMS to ${toPhone}:`, err.response?.data || err.message);
      return false;
    }
  }

  async sendWhatsApp(shopId: string, toPhone: string, message: string): Promise<boolean> {
    try {
      const shopSnap = await db.collection("shops").doc(shopId).get();
      if (!shopSnap.exists) {
        console.warn(`[WhatsApp] Shop ${shopId} not found`);
        return false;
      }

      const shop = shopSnap.data();
      const whatsapp = shop?.integrations?.whatsapp;

      if (!whatsapp || !whatsapp.connected || !whatsapp.apiKey || !whatsapp.phoneNumberId) {
        // Mode B: Platform WhatsApp Credits
        const walletRef = db.collection("credit_wallets").doc(shopId);
        const walletDoc = await walletRef.get();
        const walletData = walletDoc.data();

        if (!walletDoc.exists || !walletData || walletData.whatsappCredits <= 0) {
          console.warn(`[WhatsApp] Shop ${shopId} lacks Meta credentials and has 0 Platform WhatsApp Credits. Send failed.`);
          return false;
        }

        // Fetch platform integration settings
        const platformIntegrations = await platformSettingsService.getIntegrationSettings();
        const platformWa = platformIntegrations?.whatsapp;

        if (!platformWa || !platformWa.apiKey || !platformWa.phoneNumberId) {
          console.warn(`[WhatsApp PLATFORM] Admin WhatsApp credentials not configured. Cannot fallback.`);
          return false;
        }

        // Format phone number (ensure country code)
        let formattedPhone = toPhone.replace(/\D/g, "");
        if (formattedPhone.length === 10) {
          formattedPhone = "91" + formattedPhone; // Default to India for 10-digit numbers
        }

        const platformUrl = `https://graph.facebook.com/v17.0/${platformWa.phoneNumberId.trim()}/messages`;

        console.log(`[WhatsApp PLATFORM] Sending WhatsApp notification to ${formattedPhone}...`);
        await axios.post(
          platformUrl,
          {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: {
              body: message,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${platformWa.apiKey.trim()}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Deduct 1 credit
        const txRef = db.collection("credit_transactions").doc();
        await db.runTransaction(async (transaction: any) => {
          const wDoc = await transaction.get(walletRef);
          if (!wDoc.exists) throw new Error("Wallet not found");
          
          transaction.update(walletRef, {
            whatsappCredits: wDoc.data()!.whatsappCredits - 1,
            updatedAt: new Date()
          });
          
          transaction.set(txRef, {
            id: txRef.id,
            shopId,
            type: "whatsapp",
            amount: -1,
            description: "WhatsApp Campaign Usage",
            referenceId: "platform_whatsapp",
            createdAt: new Date()
          });
        });

        console.log(`[WhatsApp PLATFORM] Platform WhatsApp sent successfully to ${formattedPhone} (1 credit deducted from Shop ${shopId})`);
        return true;
      }

      const { apiKey, phoneNumberId } = whatsapp;
      const url = `https://graph.facebook.com/v17.0/${phoneNumberId.trim()}/messages`;

      let formattedPhone = toPhone.replace(/\D/g, "");
      if (formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
      }

      console.log(`[WhatsApp] Sending WhatsApp notification to ${formattedPhone}...`);
      await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`[WhatsApp] WhatsApp notification sent successfully to ${formattedPhone}`);
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message 
        || err.response?.data?.error?.error_data?.details 
        || err.message 
        || "Failed to send WhatsApp";
      console.error(`[WhatsApp] Failed to send WhatsApp to ${toPhone}:`, errorMsg);
      throw new Error(errorMsg);
    }
  }

  async sendTemplatedNotification(
    shopId: string,
    type: "email" | "sms" | "whatsapp",
    code: string,
    recipient: string,
    variables: Record<string, string>,
    defaultSubject: string,
    defaultBody: string
  ): Promise<boolean> {
    try {
      const snap = await db
        .collection("notification_templates")
        .where("shopId", "==", shopId)
        .where("type", "==", type)
        .where("code", "==", code)
        .limit(1)
        .get();

      let subject = defaultSubject;
      let body = defaultBody;
      let isActive = true;

      if (!snap.empty) {
        const tmpl = snap.docs[0].data();
        isActive = tmpl.isActive !== false;
        if (isActive) {
          if (type === "email" && tmpl.subject) {
            subject = tmpl.subject;
          }
          if (tmpl.content) {
            body = tmpl.content;
          }
        }
      }

      if (!isActive) {
        console.log(`[Notification] Template ${code} for ${type} is disabled. Skipping.`);
        return false;
      }

      const compile = (text: string) => {
        let compiled = text;
        for (const [key, value] of Object.entries(variables)) {
          compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value || "");
        }
        return compiled;
      };

      const finalSubject = compile(subject);
      const finalBody = compile(body);

      let success = false;
      if (type === "email") {
        const { sendShopCustomerEmail } = require("./email.util");
        await sendShopCustomerEmail(shopId, recipient, finalSubject, finalBody, finalBody);
        success = true;
      } else if (type === "sms") {
        success = await this.sendSMS(shopId, recipient, finalBody);
      } else if (type === "whatsapp") {
        try {
          await this.sendWhatsApp(shopId, recipient, finalBody);
          success = true;
        } catch (waErr: any) {
          success = false;
          throw waErr;
        }
      }

      await db.collection("notification_logs").add({
        shopId,
        type,
        recipient,
        subject: type === "email" ? finalSubject : null,
        content: finalBody,
        status: success ? "success" : "failed",
        createdAt: new Date(),
      });

      return success;
    } catch (err: any) {
      console.error(`[Notification Engine] Failed to send ${type} template ${code} to ${recipient}:`, err.message);
      try {
        await db.collection("notification_logs").add({
          shopId,
          type,
          recipient,
          subject: type === "email" ? defaultSubject : null,
          content: defaultBody,
          status: "failed",
          error: err.message,
          createdAt: new Date(),
        });
      } catch (logErr) {
        console.error("Failed to write error log to notification_logs:", logErr);
      }
      return false;
    }
  }
}

export const notificationSenderService = new NotificationSenderService();
