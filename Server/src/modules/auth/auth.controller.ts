import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { authService } from "./auth.service";
import { userService } from "../user/user.service";
import { subscriptionService } from "../subscription/subscription.service";
import { sendWelcomeEmail } from "../../shared/utils/email.util";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { uid, email, displayName, role, mobile, shopName, ownerName, gstIn, pickupAddress, branchCount, planCode, reqId, token } = req.body as any;

  if (!uid || !email) {
    return sendError(res, "Missing required fields", 400);
  }

  const isPlatformAdmin = role === "platform_admin";
  const db = (await import("../../config/firebase.config")).db;
  const shopId = isPlatformAdmin ? undefined : `shop_${uid}`;

  if (!isPlatformAdmin) {
    // Determine if this is a paid plan or free plan
    const chosenPlan = String(planCode || "free").toLowerCase();
    const isFree = chosenPlan === "free" || chosenPlan === "trial";
    const TRIAL_DAYS = 5;

    const now = new Date();
    const trialExpiresAt = new Date(now);
    trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);

    const slug = (shopName || displayName || uid).toLowerCase().replace(/\s+/g, "-");

    const shopData: any = {
      id: shopId,
      ownerId: uid,
      shopName: shopName || displayName || "My Shop",
      slug,
      subdomain: slug,
      displayName: shopName || displayName || "My Shop",
      ownerName: ownerName || displayName || "",
      gstIn: gstIn || "",
      status: "active",
      createdAt: now,
      updatedAt: now,
      // Trial state — subscriptionPlan is always "trial" at registration (no payment yet)
      subscriptionPlan: "trial",
      selectedPlan: isFree ? "free" : chosenPlan,   // what the user chose
      subscriptionStatus: isFree ? "active" : "trial",
      paymentStatus: isFree ? "active" : "pending",  // free = no payment needed
      trialStartedAt: isFree ? undefined : now,
      trialExpiresAt: isFree ? undefined : trialExpiresAt,
      nextBillingDate: isFree ? undefined : trialExpiresAt,
      trialDays: isFree ? undefined : TRIAL_DAYS,
      branchLimit: branchCount ? Number(branchCount) : undefined,
    };

    // If registering from a custom plan request token
    if (reqId && token) {
      const customReqRef = db.collection("custom_plan_requests").doc(reqId);
      const customReqDoc = await customReqRef.get();
      if (customReqDoc.exists) {
        const customReq = customReqDoc.data();
        if (customReq && customReq.registrationToken === token) {
          shopData.subscriptionPlan = "custom";
          shopData.selectedPlan = "custom";
          shopData.subscriptionStatus = "active";
          shopData.paymentStatus = "active";
          shopData.trialStartedAt = undefined;
          shopData.trialExpiresAt = undefined;
          shopData.trialDays = undefined;
          shopData.customFeatures = customReq.selectedFeatures || [];
          shopData.billingCycle = customReq.billingCycle || "monthly";
          shopData.customPrice = customReq.finalPrice || 0;
          
          // Update the custom plan request to registered
          await customReqRef.update({
            status: "SHOP_REGISTERED",
            shopId: shopId,
            updatedAt: now,
            activityLog: (await import("firebase-admin/firestore")).FieldValue.arrayUnion({
              status: "SHOP_REGISTERED",
              note: `Shop created: ${shopId}`,
              performedBy: "system",
              timestamp: now
            })
          });
        }
      }
    }

    // Copy plan storage limits to subscription fields on registration
    const activePlanCode = shopData.subscriptionPlan || "trial";
    const plan = await subscriptionService.getPlan(activePlanCode);
    const includedStorageMB = plan?.includedStorageMB ?? 500;
    const includedStorageBytes = plan?.includedStorageBytes ?? (includedStorageMB * 1024 * 1024);
    const storageUnit = plan?.storageUnit ?? "MB";
    const humanReadableStorage = plan?.storageDisplay ?? `${includedStorageMB} MB`;

    shopData.includedStorageBytes = includedStorageBytes;
    shopData.includedStorageMB = includedStorageMB;
    shopData.includedStorageGB = Number((includedStorageBytes / (1024 * 1024 * 1024)).toFixed(4));
    shopData.humanReadableStorage = humanReadableStorage;

    // Remove undefined fields to keep Firestore document clean
    Object.keys(shopData).forEach((key) => shopData[key] === undefined && delete shopData[key]);

    if (pickupAddress && (pickupAddress.address || pickupAddress.city || pickupAddress.state || pickupAddress.pincode)) {
      shopData.pickupAddress = pickupAddress;
    }

    await db.collection("shops").doc(shopId!).set(shopData);
  }

  const newUser = await authService.registerUser({
    uid: String(uid),
    email: String(email),
    displayName: displayName ? String(displayName) : "",
    mobile: mobile ? String(mobile) : "",
    shopId: shopId,
    role: role ? String(role) : "shop_owner",
  });

  // Send Welcome Email if this is a shop owner
  if (!isPlatformAdmin && email && shopName) {
    await sendWelcomeEmail(String(email), String(shopName), displayName ? String(displayName) : "");
  }

  return sendSuccess(res, newUser, "User registered successfully");
});


export const registerWithPayment = asyncHandler(async (req: Request, res: Response) => {
  const { 
    uid, email, displayName, role, mobile, shopName, ownerName, gstIn, pickupAddress, planCode, billingCycle, branchCount,
    razorpay_payment_id, razorpay_order_id, razorpay_signature
  } = req.body as any;

  if (!uid || !email || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return sendError(res, "Missing required fields for paid registration", 400);
  }

  // 1. Verify Payment First
  const crypto = require("crypto");
  const billingSettings = await (await import("../platform-settings/platform-settings.service")).platformSettingsService.getBillingSettings();
  const key_secret = billingSettings.razorpayKeySecret;

  if (!key_secret) {
    return sendError(res, "Razorpay credentials not configured", 500);
  }

  const generated_signature = crypto
    .createHmac("sha256", key_secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return sendError(res, "Payment verification failed. Invalid signature.", 400);
  }

  // 2. Register User & Shop
  const db = (await import("../../config/firebase.config")).db;
  const shopId = `shop_${uid}`;
  const slug = shopName.toLowerCase().replace(/\s+/g, "-");
  const shopData: any = {
    id: shopId,
    ownerId: uid,
    shopName: shopName,
    slug: slug,
    subdomain: slug,
    displayName: shopName,
    ownerName: ownerName || displayName || "",
    gstIn: gstIn || "",
    status: "active",
    createdAt: new Date(),
    subscriptionPlan: planCode,
    paymentStatus: "active",
    billingCycle: billingCycle,
    subscriptionUpdatedAt: new Date(),
    branchLimit: branchCount ? Number(branchCount) : undefined
  };

  if (pickupAddress && (pickupAddress.address || pickupAddress.city || pickupAddress.state || pickupAddress.pincode)) {
    shopData.pickupAddress = pickupAddress;
  }

  await db.collection("shops").doc(shopId).set(shopData);

  const newUser = await authService.registerUser({
    uid: String(uid),
    email: String(email),
    displayName: displayName ? String(displayName) : "",
    mobile: mobile ? String(mobile) : "",
    shopId: shopId,
    role: role ? String(role) : "shop_owner",
  });

  // Send Welcome Email
  if (email && shopName) {
    await sendWelcomeEmail(String(email), String(shopName), displayName ? String(displayName) : "");
  }

  return sendSuccess(res, newUser, "User registered and payment verified successfully");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { uid } = req.body as any;
  if (!uid) return sendError(res, "UID required", 400);

  const profile = await authService.getUserProfile(String(uid));

  return sendSuccess(res, profile, "Login successful");
});

export const resolveIdentifier = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.body as any;
  if (!identifier) return sendError(res, "Identifier is required", 400);

  if (String(identifier).includes("@")) {
    return sendSuccess(res, { email: identifier }, "Resolved");
  }

  const db = (await import("../../config/firebase.config")).db;
  
  let snapshot = await db.collection("users").where("mobile", "==", identifier).limit(1).get();
  if (snapshot.empty) {
    snapshot = await db.collection("users").where("phone", "==", identifier).limit(1).get();
  }
  
  if (!snapshot.empty) {
    return sendSuccess(res, { email: snapshot.docs[0].data().email }, "Resolved");
  }

  let staffSnapshot = await db.collection("staff").where("phoneNumber", "==", identifier).limit(1).get();
  if (!staffSnapshot.empty) {
    return sendSuccess(res, { email: staffSnapshot.docs[0].data().email }, "Resolved");
  }

  return sendError(res, "No account found with this mobile number", 404);
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) return sendError(res, "Unauthorized", 401);

  // Update last login timestamp asynchronously
  userService.updateLastLogin(String(uid)).catch(() => {});

  const profile = await authService.getUserProfile(String(uid));
  const shopId = req.user?.shopId || profile.shopId;
  
  // Resolve subscription context to get dynamic features
  const subContext = await subscriptionService.resolveAccessContext({ 
    userId: String(uid), 
    shopId 
  });

  // Fetch global feature catalog statuses
  const allFeatures = await subscriptionService.listFeatures(false);
  const featureStates: Record<string, string> = {};
  allFeatures.forEach((f: any) => {
    featureStates[f.key] = f.status || (f.active ? "active" : "inactive");
  });

  return sendSuccess(
    res,
    {
      profile,
      shopId,
      subscriptionPlan: subContext.plan.code || subContext.plan.id,
      features: subContext.features || [],
      featureStates,
      roles: req.user?.roleNames || [],
      permissions: req.user?.permissions || [],
    },
    "Profile fetched",
  );
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) return sendError(res, "Unauthorized", 401);

  await authService.updateUserProfile(String(uid), req.body);
  return sendSuccess(res, null, "Profile updated");
});
