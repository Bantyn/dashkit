import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db, auth } from "../../config/firebase.config";
import crypto from "crypto";
import { sendEmailOtp as sendOtpMail } from "../../shared/utils/email.util";

const OTP_EXPIRY_MS = 5 * 60 * 1000;

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  if (!email || !email.includes("@")) {
    return sendError(res, "Valid email address is required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const usersSnapshot = await db
    .collection("users")
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  let uid = "";
  if (usersSnapshot.empty) {
    const customersSnapshot = await db
      .collection("online_customers")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (customersSnapshot.empty) {
      return sendError(res, "No account found with this email address", 404);
    }
    uid = customersSnapshot.docs[0].id;
  } else {
    uid = usersSnapshot.docs[0].id;
  }
  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  await db.collection("otps").doc(normalizedEmail).set({
    otp,
    uid,
    email: normalizedEmail,
    createdAt: new Date(),
    expiresAt,
    used: false,
  });

  const isDev = process.env.NODE_ENV !== "production";
  console.log(`[OTP] Generated OTP ${otp} for ${normalizedEmail}`);

  return sendSuccess(
    res,
    {
      ...(isDev && { otp }),
      email: normalizedEmail,
      expiresIn: OTP_EXPIRY_MS / 1000,
    },
    isDev ? `OTP generated (dev mode): ${otp}` : "OTP sent to your email address",
  );
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };

  if (!email || !otp) {
    return sendError(res, "Email and OTP are required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const otpDoc = await db.collection("otps").doc(normalizedEmail).get();

  if (!otpDoc.exists) {
    return sendError(res, "No OTP found. Please request a new one.", 404);
  }

  const otpData = otpDoc.data()!;

  if (Date.now() > otpData.expiresAt) {
    await db.collection("otps").doc(normalizedEmail).delete();
    return sendError(res, "OTP has expired. Please request a new one.", 410);
  }

  if (otpData.used) {
    return sendError(res, "OTP has already been used.", 409);
  }

  if (otpData.otp !== otp.toString().trim()) {
    return sendError(res, "Incorrect OTP. Please try again.", 401);
  }

  await db.collection("otps").doc(normalizedEmail).update({ used: true });

  const customToken = await auth.createCustomToken(otpData.uid, {
    email: normalizedEmail,
    otpVerified: true,
  });

  let profile = null;
  const userDoc = await db.collection("users").doc(otpData.uid).get();
  if (userDoc.exists) {
    profile = userDoc.data();
  } else {
    const customerDoc = await db.collection("online_customers").doc(otpData.uid).get();
    if (customerDoc.exists) {
      profile = customerDoc.data();
    }
  }

  return sendSuccess(
    res,
    {
      customToken,
      uid: otpData.uid,
      profile,
    },
    "OTP verified successfully",
  );
});

const EMAIL_OTP_EXPIRY_MS = 5 * 60 * 1000;

function generateSecure6DigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export const sendEmailVerificationOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  if (!email || !email.includes("@")) {
    return sendError(res, "Valid email address is required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Validate format using a regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return sendError(res, "Invalid email address format", 400);
  }

  // Check if the email is already registered in 'users' collection
  const usersSnapshot = await db
    .collection("users")
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    return sendError(res, "This email address is already registered.", 400);
  }

  const otpDocRef = db.collection("email_verification_otps").doc(normalizedEmail);
  const otpDoc = await otpDocRef.get();
  
  let resends = 0;
  const isDev = process.env.NODE_ENV !== "production";
  if (otpDoc.exists) {
    const data = otpDoc.data()!;
    const lastSent = data.updatedAt?.toDate?.() || new Date(data.updatedAt || 0);
    
    // Prevent immediate resend spam (require 30s pause)
    if (Date.now() - lastSent.getTime() < 30000) {
      return sendError(res, "Please wait 30 seconds before requesting another code.", 429);
    }

    resends = data.resends || 0;
    if (resends >= 3) {
      // If last attempt was more than 15 minutes ago, reset the limit
      if (Date.now() - lastSent.getTime() > 15 * 60 * 1000) {
        resends = 0;
      } else {
        return sendError(res, "Too many resend attempts. Please try again after 15 minutes.", 429);
      }
    }
  }

  const otp = generateSecure6DigitOtp();
  const expiresAt = Date.now() + EMAIL_OTP_EXPIRY_MS;

  await otpDocRef.set({
    otp,
    email: normalizedEmail,
    expiresAt,
    verified: false,
    attempts: 0,
    resends: resends + 1,
    updatedAt: new Date(),
  });

  await sendOtpMail(normalizedEmail, otp);

  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || "";
  const exposeOtp = isDev && !smtpUser;

  return sendSuccess(
    res,
    {
      email: normalizedEmail,
      expiresIn: EMAIL_OTP_EXPIRY_MS / 1000,
      ...(exposeOtp && { otp }),
    },
    exposeOtp ? `OTP generated (dev mode): ${otp}` : "Verification code has been sent to your email."
  );
});

export const verifyEmailVerificationOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };

  if (!email || !otp) {
    return sendError(res, "Email and verification code are required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const otpDocRef = db.collection("email_verification_otps").doc(normalizedEmail);
  const otpDoc = await otpDocRef.get();

  if (!otpDoc.exists) {
    return sendError(res, "No verification request found. Please send code first.", 404);
  }

  const otpData = otpDoc.data()!;

  // Max 5 attempts
  const attempts = otpData.attempts || 0;
  if (attempts >= 5) {
    return sendError(res, "Too many failed attempts. Please request a new verification code.", 400);
  }

  if (Date.now() > otpData.expiresAt) {
    return sendError(res, "Verification code has expired. Please request a new one.", 400);
  }

  // Increment attempts
  await otpDocRef.update({
    attempts: attempts + 1,
  });

  if (otpData.otp !== otp.toString().trim()) {
    return sendError(res, "Incorrect verification code. Please try again.", 400);
  }

  await otpDocRef.update({
    verified: true,
    attempts: 0,
    updatedAt: new Date(),
  });

  return sendSuccess(
    res,
    { verified: true },
    "Email verified successfully."
  );
});

