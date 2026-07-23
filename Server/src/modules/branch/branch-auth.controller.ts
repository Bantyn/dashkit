import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db } from "../../config/firebase.config";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { sendShopCustomerEmail } from "../../shared/utils/email.util";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 mins

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendBranchSwitchOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shopId = req.params.shopId;
  const branchId = req.params.branchId;
  const uid = req.user?.uid;
  const email = req.user?.email;

  if (!shopId || !branchId || !uid || !email) {
    return sendError(res, "Missing required parameters", 400);
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  const key = `branch_otp_${uid}_${branchId}`;

  await db.collection("otps").doc(key).set({
    otp,
    expiresAt,
    used: false,
    uid,
    shopId,
    branchId
  });

  const subject = "Branch Switch Verification OTP";
  const htmlBody = `
      <h2>Branch Switch Request</h2>
      <p>You requested to switch your active branch.</p>
      <p>Your One-Time Password is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `;
  
  await sendShopCustomerEmail(String(shopId), String(email), subject, "Your OTP is " + otp, htmlBody);

  return sendSuccess(res, { sent: true }, "OTP sent to your registered email");
});

export const verifyBranchSwitchOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shopId = req.params.shopId;
  const branchId = req.params.branchId;
  const uid = req.user?.uid;
  const { otp } = req.body;

  if (!shopId || !branchId || !uid || !otp) {
    return sendError(res, "Missing required parameters", 400);
  }

  const key = `branch_otp_${uid}_${branchId}`;
  const otpDoc = await db.collection("otps").doc(key).get();

  if (!otpDoc.exists) {
    return sendError(res, "No OTP found. Please request a new one.", 404);
  }

  const otpData = otpDoc.data()!;

  if (Date.now() > otpData.expiresAt) {
    await db.collection("otps").doc(key).delete();
    return sendError(res, "OTP has expired. Please request a new one.", 410);
  }

  if (otpData.used) {
    return sendError(res, "OTP has already been used.", 409);
  }

  if (otpData.otp !== String(otp).trim()) {
    return sendError(res, "Incorrect OTP. Please try again.", 401);
  }

  await db.collection("otps").doc(key).update({ used: true });

  // Add audit log
  await db.collection("audit_logs").add({
    action: "BRANCH_SWITCH_VERIFIED",
    shopId,
    branchId,
    userId: uid,
    email: req.user?.email,
    device: req.headers["user-agent"] || "unknown",
    ipAddress: req.ip || req.socket.remoteAddress || "unknown",
    timestamp: new Date()
  });

  return sendSuccess(res, { verified: true }, "Branch OTP verified successfully");
});
