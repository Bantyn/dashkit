import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db, auth } from "../../config/firebase.config";

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
