import nodemailer from 'nodemailer';
import axios from 'axios';
import { db } from '../../config/firebase.config';

function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

const transporter = nodemailer.createTransport({
  host: getEnv("SMTP_HOST", "smtp.gmail.com") as string,
  port: parseInt(getEnv("SMTP_PORT", "587") as string, 10),
  secure: getEnv("SMTP_SECURE", "false") === "true", // true for 465, false for other ports
  auth: {
    user: getEnv("SMTP_USER", "") as string,
    pass: getEnv("SMTP_PASS", "") as string,
  },
});

export const sendShopReactivationEmail = async (toEmail: string, shopName: string) => {
  const mailOptions = {
    from: `"Clothify Admin" <${getEnv("SMTP_USER", "bantypatel62@gmail.com")}>`,
    to: toEmail,
    subject: "Your Shop Has Been Reactivated!",
    text: `Hello,\n\nYour shop "${shopName}" has been successfully reactivated by the administrator.\nYou can now log in and continue managing your business.\n\nThank you,\nClothify Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e6c80;">Shop Reactivated</h2>
        <p>Hello,</p>
        <p>Your shop <strong>"${shopName}"</strong> has been successfully reactivated by the administrator.</p>
        <p>You can now log in and continue managing your business.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>Clothify Team</strong></p>
      </div>
    `,
  };

  if (!getEnv("SMTP_USER", "")) {
    console.log("----------------------------------------------------------");
    console.log(`[MOCK EMAIL] To: ${toEmail} | Subject: ${mailOptions.subject}`);
    console.log(mailOptions.text);
    console.log("----------------------------------------------------------");
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending reactivation email:", error);
    throw error;
  }
};
export const sendSupportReplyEmail = async (
  toEmail: string,
  shopName: string,
  subject: string,
  adminReply: string,
  adminEmail: string
) => {
  const mailOptions = {
    from: `"Clothify Admin" <${getEnv("SMTP_USER", "admin@clothify.com")}>`,
    to: toEmail,
    subject: `Re: [Support] ${subject}`,
    text: `Hello ${shopName},\n\nAdmin has replied to your support ticket.\n\nSubject: ${subject}\n\nReply:\n${adminReply}\n\nIf you have further questions, please submit another ticket.\n\nThank you,\nClothify Admin Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e6c80;">Support Ticket Reply</h2>
        <p>Hello <strong>${shopName}</strong>,</p>
        <p>Admin has replied to your support ticket: <strong>${subject}</strong></p>
        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #2e6c80; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0;">${adminReply}</p>
        </div>
        <p>If you have further questions, please submit a new ticket from your Clothify dashboard.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>Clothify Admin Team</strong></p>
      </div>
    `,
  };

  if (!getEnv("SMTP_USER", "")) {
    console.log("----------------------------------------------------------");
    console.log(`[MOCK EMAIL] Support Reply To: ${toEmail} | Subject: ${mailOptions.subject}`);
    console.log(mailOptions.text);
    console.log("----------------------------------------------------------");
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Support reply email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending support reply email:", error);
    throw error;
  }
};

export const sendShopCustomerEmail = async (
  shopId: string,
  toEmail: string,
  subject: string,
  text: string,
  html: string
) => {
  try {
    const shopSnap = await db.collection("shops").doc(shopId).get();
    if (!shopSnap.exists) {
      throw new Error(`Shop ${shopId} not found`);
    }

    const shop = shopSnap.data();
    if (!shop) {
      throw new Error(`Shop data is empty for ${shopId}`);
    }
    const integrations = shop.integrations || {};

    // 1. Check if SendGrid is connected
    const sendgrid = integrations.sendgrid;
    if (sendgrid && sendgrid.connected && sendgrid.apiKey && sendgrid.fromEmail) {
      console.log(`[Email] Sending via SendGrid for shop ${shopId} to ${toEmail}...`);
      await axios.post(
        "https://api.sendgrid.com/v3/mail/send",
        {
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: sendgrid.fromEmail, name: shop.displayName || shop.shopName || "Clothify Shop" },
          subject: subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${sendgrid.apiKey.trim()}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[Email] Sent successfully via SendGrid to ${toEmail}`);
      return;
    }

    // 2. Check if Custom SMTP is connected
    const smtp = integrations.smtp;
    if (smtp && smtp.connected && smtp.host && smtp.user && smtp.smtpPass) {
      console.log(`[Email] Sending via Custom SMTP for shop ${shopId} to ${toEmail}...`);
      const customTransporter = nodemailer.createTransport({
        host: smtp.host.trim(),
        port: parseInt(String(smtp.port || "587"), 10),
        secure: String(smtp.port) === "465",
        auth: {
          user: smtp.user.trim(),
          pass: smtp.smtpPass.trim(),
        },
      });

      const mailOptions = {
        from: `"${smtp.fromName || shop.displayName || shop.shopName || "Clothify Shop"}" <${smtp.user.trim()}>`,
        to: toEmail,
        subject: subject,
        text: text,
        html: html,
      };

      const info = await customTransporter.sendMail(mailOptions);
      console.log(`[Email] Sent successfully via Custom SMTP to ${toEmail}: ${info.messageId}`);
      return;
    }

    // 3. Fallback to platform SMTP
    console.log(`[Email] No shop email integration connected for ${shopId}. Falling back to default platform SMTP.`);
    
    const defaultFrom = getEnv("SMTP_USER", "");
    if (!defaultFrom) {
      console.log("----------------------------------------------------------");
      console.log(`[MOCK EMAIL FALLBACK] To: ${toEmail} | Subject: ${subject}`);
      console.log(text);
      console.log("----------------------------------------------------------");
      return;
    }

    const mailOptions = {
      from: `"${shop.displayName || shop.shopName || "Clothify Store"}" <${defaultFrom}>`,
      to: toEmail,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent successfully via platform SMTP to ${toEmail}: ${info.messageId}`);
  } catch (error: any) {
    console.error(`[Email] Failed to send email for shop ${shopId} to ${toEmail}:`, error.message);
    throw error;
  }
};

export const sendWelcomeEmail = async (toEmail: string, shopName: string, ownerName: string) => {
  const mailOptions = {
    from: `"Clothify Team" <${getEnv("SMTP_USER", "[EMAIL_USER]")}>`,
    to: toEmail,
    subject: "Welcome to Clothify! Let's get your shop growing 🚀",
    text: `Hello ${ownerName || 'there'},\n\nWelcome to Clothify! We are incredibly excited to have "${shopName}" onboard.\n\nYour account has been successfully created. You can now log into your dashboard, set up your products, and start selling.\n\nIf you have any questions or need help setting up, just reply to this email or reach out to our support team.\n\nWelcome aboard!\n\nBest regards,\nThe Clothify Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e6c80;">Welcome to Clothify! 🎉</h2>
        <p>Hello <strong>${ownerName || 'there'}</strong>,</p>
        <p>We are incredibly excited to have <strong>"${shopName}"</strong> onboard.</p>
        <p>Your account has been successfully created. You can now log into your dashboard, set up your products, and start taking your business to the next level.</p>
        <p>If you have any questions or need help setting things up, just reply to this email or reach out to our support team.</p>
        <br/>
        <p>Welcome aboard!</p>
        <p><strong>The Clothify Team</strong></p>
      </div>
    `,
  };

  if (!getEnv("SMTP_USER", "")) {
    console.log("----------------------------------------------------------");
    console.log(`[MOCK EMAIL] Welcome Email To: ${toEmail} | Subject: ${mailOptions.subject}`);
    console.log(mailOptions.text);
    console.log("----------------------------------------------------------");
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw so it doesn't break the registration flow
  }
};

export const sendAdminRegistrationNotification = async (details: {
  shopName: string;
  ownerName: string;
  email: string;
  mobile?: string;
  planCode?: string;
  subscriptionStatus?: string;
  paymentStatus?: string;
  trialStatus?: string;
  trialExpiresAt?: Date | null;
  shopId?: string;
  branchCount?: number;
  registeredAt?: Date;
}) => {
  const adminEmail = getEnv("ADMIN_EMAIL", "");
  if (!adminEmail) {
    console.log("[Admin Notification] ADMIN_EMAIL not set — skipping admin registration email.");
    return;
  }

  const registeredAt = details.registeredAt || new Date();
  const formattedDate = registeredAt.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const trialExpiry = details.trialExpiresAt
    ? details.trialExpiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })
    : "N/A";

  const subject = `🎉 New Shop Registered - ${details.shopName}`;

  const textBody = [
    `A new shop has successfully registered on DashKit.`,
    ``,
    `------------------------------------`,
    `Shop Name          : ${details.shopName}`,
    `Owner Name         : ${details.ownerName || "N/A"}`,
    `Email              : ${details.email}`,
    `Mobile             : ${details.mobile || "N/A"}`,
    `Plan               : ${details.planCode || "trial"}`,
    `Trial              : ${details.trialStatus || "Active"}`,
    `Trial Ends         : ${trialExpiry}`,
    `Subscription       : ${details.subscriptionStatus || "N/A"}`,
    `Payment Status     : ${details.paymentStatus || "N/A"}`,
    `Shop ID            : ${details.shopId || "N/A"}`,
    `Branches           : ${details.branchCount || 1}`,
    `Registered At      : ${formattedDate}`,
    `------------------------------------`,
    ``,
    `You can review and manage this shop from the Admin Dashboard.`,
  ].join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px 24px; border-radius: 12px;">
      <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">🎉 New Shop Registered</h1>
          <p style="color: #c4b5fd; margin: 6px 0 0; font-size: 14px;">A new shop has joined DashKit</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background: #f3f4f6;"><td style="padding: 10px 14px; color: #6b7280; font-weight: 600; width: 40%; border-radius: 4px;">Shop Name</td><td style="padding: 10px 14px; color: #111827; font-weight: 700;">${details.shopName}</td></tr>
            <tr><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Owner Name</td><td style="padding: 10px 14px; color: #111827;">${details.ownerName || "N/A"}</td></tr>
            <tr style="background: #f3f4f6;"><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Email</td><td style="padding: 10px 14px; color: #111827;">${details.email}</td></tr>
            <tr><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Mobile</td><td style="padding: 10px 14px; color: #111827;">${details.mobile || "N/A"}</td></tr>
            <tr style="background: #f3f4f6;"><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Plan</td><td style="padding: 10px 14px;"><span style="background: #ede9fe; color: #5b21b6; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">${(details.planCode || "trial").toUpperCase()}</span></td></tr>
            <tr><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Trial Status</td><td style="padding: 10px 14px;"><span style="background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">${details.trialStatus || "Active"}</span></td></tr>
            <tr style="background: #f3f4f6;"><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Trial Ends</td><td style="padding: 10px 14px; color: #111827;">${trialExpiry}</td></tr>
            <tr><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Subscription</td><td style="padding: 10px 14px; color: #111827;">${details.subscriptionStatus || "N/A"}</td></tr>
            <tr style="background: #f3f4f6;"><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Payment Status</td><td style="padding: 10px 14px; color: #111827;">${details.paymentStatus || "N/A"}</td></tr>
            <tr><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Shop ID</td><td style="padding: 10px 14px; color: #6b7280; font-size: 12px; font-family: monospace;">${details.shopId || "N/A"}</td></tr>
            <tr style="background: #f3f4f6;"><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Branches</td><td style="padding: 10px 14px; color: #111827;">${details.branchCount || 1}</td></tr>
            <tr><td style="padding: 10px 14px; color: #6b7280; font-weight: 600;">Registered At</td><td style="padding: 10px 14px; color: #111827;">${formattedDate}</td></tr>
          </table>

          <div style="margin-top: 28px; padding: 16px 20px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px;">
            <p style="margin: 0; color: #1e40af; font-size: 13px;">You can review and manage this shop from the <strong>Admin Dashboard</strong>.</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated notification from DashKit. Do not reply to this email.</p>
        </div>
      </div>
    </div>
  `;

  const smtpUser = getEnv("SMTP_USER", "") || getEnv("EMAIL_USER", "");
  const mailOptions = {
    from: `"DashKit Platform" <${smtpUser}>`,
    to: adminEmail,
    subject,
    text: textBody,
    html: htmlBody,
  };

  if (!smtpUser) {
    console.log("----------------------------------------------------------");
    console.log(`[MOCK ADMIN EMAIL] To: ${adminEmail} | Subject: ${subject}`);
    console.log(textBody);
    console.log("----------------------------------------------------------");
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Admin Notification] Registration email sent to ${adminEmail}: ${info.messageId}`);
  } catch (error) {
    // Fire-and-forget — log but never throw to avoid rolling back registration
    console.error("[Admin Notification] Failed to send registration notification:", error);
  }
};

export const sendEmailOtp = async (toEmail: string, otp: string) => {
  const smtpUser = getEnv("SMTP_USER", "") || getEnv("EMAIL_USER", "");
  const subject = "Verify Your Email Address";
  const textBody = `Hello,\n\nYour verification code is:\n\n${otp}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this verification, please ignore this email.\n\nThanks,\nDashKit Team`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e6c80; margin-bottom: 20px;">Verify Your Email Address</h2>
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd;">
        ${otp}
      </div>
      <p>This code is valid for 5 minutes.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <br/>
      <p>Thanks,</p>
      <p><strong>DashKit Team</strong></p>
    </div>
  `;

  const mailOptions = {
    from: `"DashKit Team" <${smtpUser || "noreply@dashkit.com"}>`,
    to: toEmail,
    subject,
    text: textBody,
    html: htmlBody,
  };

  if (!smtpUser) {
    console.log("----------------------------------------------------------");
    console.log(`[MOCK EMAIL OTP] To: ${toEmail} | Subject: ${subject} | OTP: ${otp}`);
    console.log(textBody);
    console.log("----------------------------------------------------------");
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email OTP] Verification email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error("[Email OTP] Failed to send email verification OTP:", error);
    throw error;
  }
};

