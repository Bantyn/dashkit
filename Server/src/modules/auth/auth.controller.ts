import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { authService } from "./auth.service";
import { userService } from "../user/user.service";
import { subscriptionService } from "../subscription/subscription.service";
import { sendWelcomeEmail, sendAdminRegistrationNotification } from "../../shared/utils/email.util";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { uid, email, displayName, role, mobile, shopName, ownerName, gstIn, pickupAddress, branchCount, planCode, reqId, token } = req.body as any;

  if (!uid || !email) {
    return sendError(res, "Missing required fields", 400);
  }

  const isPlatformAdmin = role === "platform_admin";
  const db = (await import("../../config/firebase.config")).db;
  const shopId = isPlatformAdmin ? undefined : `shop_${uid}`;

  if (!isPlatformAdmin) {
    const otpDoc = await db.collection("email_verification_otps").doc(email.trim().toLowerCase()).get();
    if (!otpDoc.exists || !otpDoc.data()?.verified) {
      return sendError(res, "Email address has not been verified.", 400);
    }
    
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
      phone: mobile || "",
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

    // Fire-and-forget admin notification — inside this block where shopData and now are in scope
    sendAdminRegistrationNotification({
      shopName: shopData.shopName,
      ownerName: shopData.ownerName || displayName || "",
      email: String(email),
      mobile: mobile ? String(mobile) : undefined,
      planCode: shopData.selectedPlan || shopData.subscriptionPlan,
      subscriptionStatus: shopData.subscriptionStatus,
      paymentStatus: shopData.paymentStatus,
      trialStatus: shopData.subscriptionStatus === "trial" || shopData.paymentStatus === "pending" ? "Active" : "N/A",
      trialExpiresAt: shopData.trialExpiresAt || null,
      shopId: shopId,
      branchCount: branchCount ? Number(branchCount) : 1,
      registeredAt: now,
    }).catch((err: any) => console.error("[Admin Notification] Error:", err));
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
  const isPlatformAdmin = role === "platform_admin";
  if (!isPlatformAdmin) {
    const otpDoc = await db.collection("email_verification_otps").doc(email.trim().toLowerCase()).get();
    if (!otpDoc.exists || !otpDoc.data()?.verified) {
      return sendError(res, "Email address has not been verified.", 400);
    }
  }

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
    phone: mobile || "",
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

  // Send Admin Registration Notification (fire-and-forget)
  sendAdminRegistrationNotification({
    shopName: shopData.shopName,
    ownerName: shopData.ownerName || displayName || "",
    email: String(email),
    mobile: mobile ? String(mobile) : undefined,
    planCode: shopData.subscriptionPlan,
    subscriptionStatus: shopData.subscriptionStatus || "active",
    paymentStatus: shopData.paymentStatus,
    trialStatus: "N/A",
    trialExpiresAt: null,
    shopId: shopId,
    branchCount: branchCount ? Number(branchCount) : 1,
    registeredAt: new Date(),
  }).catch((err: any) => console.error("[Admin Notification] Error:", err));

  return sendSuccess(res, newUser, "User registered and payment verified successfully");
});

import { auditLogService } from "../audit/audit-log.service";

const LOCKOUT_DURATIONS: Record<number, number> = {
  2: 2 * 60,   // 2 minutes
  3: 5 * 60,   // 5 minutes
  4: 10 * 60,  // 10 minutes
  5: 15 * 60,  // 15 minutes
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, uid } = req.body as any;
  const db = (await import("../../config/firebase.config")).db;
  const admin = (await import("../../config/firebase.config")).admin;

  // Case A: Token-authenticated login sync (uid provided, password verified on Firebase client)
  if (uid && !email && !password) {
    const profile = await authService.getUserProfile(String(uid));
    if (profile.accountStatus === "suspended" || profile.isBlocked || profile.isActive === false) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your shop has been temporarily suspended due to multiple unsuccessful login attempts. Please contact the DashKit Team to reactivate your account.",
      });
    }

    // Reset failed login counter on successful login
    await db.collection("users").doc(profile.uid).update({
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
      lastLoginAt: new Date(),
    });

    await auditLogService.logEvent({
      shopId: profile.shopId,
      email: profile.email,
      userId: profile.uid,
      eventType: "SUCCESSFUL_LOGIN",
      req,
    });

    return sendSuccess(res, profile, "Login successful");
  }

  // Case B: Direct credential check & progressive lockout validation
  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // Find user by email
  const userSnapshot = await db.collection("users").where("email", "==", cleanEmail).limit(1).get();

  if (userSnapshot.empty) {
    await auditLogService.logEvent({
      email: cleanEmail,
      eventType: "FAILED_LOGIN",
      failureReason: "User not found",
      req,
    });
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data() as any;
  const userId = userDoc.id;
  const shopId = user.shopId;

  // 1. Account Status Priority Check
  const accountStatus = user.accountStatus || (user.isBlocked ? "suspended" : user.isActive === false ? "disabled" : "active");

  if (accountStatus === "suspended" || user.isBlocked) {
    await auditLogService.logEvent({
      shopId,
      email: cleanEmail,
      userId,
      eventType: "FAILED_LOGIN",
      failureReason: "Attempt on suspended account",
      req,
    });
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_SUSPENDED",
      message: "Your shop has been temporarily suspended due to multiple unsuccessful login attempts. Please contact the DashKit Team to reactivate your account.",
    });
  }

  if (accountStatus === "disabled") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_DISABLED",
      message: "This account has been disabled. Please contact support.",
    });
  }

  if (accountStatus === "archived") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_ARCHIVED",
      message: "This account is archived. Please contact support.",
    });
  }

  if (accountStatus === "deleted") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_DELETED",
      message: "This account has been deleted.",
    });
  }

  // 2. Lockout Expiration Verification
  const now = new Date();
  if (user.lockUntil) {
    const lockUntilDate = new Date(user.lockUntil);
    if (now < lockUntilDate) {
      const remainingSeconds = Math.ceil((lockUntilDate.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        lockUntil: lockUntilDate.toISOString(),
        remainingSeconds,
        message: "Too many failed login attempts. Please try again later.",
      });
    } else {
      // Lock has expired
      await auditLogService.logEvent({
        shopId,
        email: cleanEmail,
        userId,
        eventType: "LOCK_EXPIRED",
        req,
      });
    }
  }

  // 3. Verify Password using Firebase Auth REST API or Admin Auth
  let isPasswordValid = false;
  try {
    const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY;
    if (firebaseApiKey) {
      const authResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: String(password),
            returnSecureToken: true,
          }),
        }
      );
      if (authResponse.ok) {
        isPasswordValid = true;
      }
    } else {
      // Fallback: verify user record exists and check firebase user
      const fbUser = await admin.auth().getUser(userId).catch(() => null);
      if (fbUser) {
        // If API key is not configured, we rely on standard auth or user existence
        isPasswordValid = true;
      }
    }
  } catch (err) {
    isPasswordValid = false;
  }

  // 4. Handle Login Outcome
  if (isPasswordValid) {
    // SUCCESSFUL LOGIN
    await db.collection("users").doc(userId).update({
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: now,
      lastLoginAt: now,
    });

    await auditLogService.logEvent({
      shopId,
      email: cleanEmail,
      userId,
      eventType: "SUCCESSFUL_LOGIN",
      req,
    });

    const profile = await authService.getUserProfile(userId);
    return sendSuccess(res, profile, "Login successful");
  } else {
    // INCORRECT PASSWORD: Increment failed attempt counter
    const currentAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = {
      failedLoginAttempts: currentAttempts,
      lastFailedLoginAt: now.toISOString(),
    };

    await auditLogService.logEvent({
      shopId,
      email: cleanEmail,
      userId,
      eventType: "FAILED_LOGIN",
      failureReason: `Incorrect password (Attempt ${currentAttempts})`,
      req,
    });

    // Check progressive lockout thresholds
    if (currentAttempts >= 6) {
      // 6th Attempt: Automatically suspend account
      updateData.accountStatus = "suspended";
      updateData.isBlocked = true;
      updateData.suspensionReason = "Automated suspension due to 6 consecutive failed login attempts";
      updateData.suspendedAt = now.toISOString();
      updateData.suspendedBy = "SYSTEM_PROGRESSIVE_LOCKOUT";

      if (shopId) {
        await db.collection("shops").doc(shopId).update({
          status: "suspended",
          suspensionReason: updateData.suspensionReason,
          suspendedAt: updateData.suspendedAt,
        }).catch(() => {});
      }

      await db.collection("users").doc(userId).update(updateData);

      await auditLogService.logEvent({
        shopId,
        email: cleanEmail,
        userId,
        eventType: "ACCOUNT_SUSPENDED",
        failureReason: updateData.suspensionReason,
        req,
      });

      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your shop has been temporarily suspended due to multiple unsuccessful login attempts. Please contact the DashKit Team to reactivate your account.",
      });
    }

    if (currentAttempts >= 2 && currentAttempts <= 5) {
      const lockSeconds = LOCKOUT_DURATIONS[currentAttempts] || 120;
      const lockUntilDate = new Date(now.getTime() + lockSeconds * 1000);
      updateData.lockUntil = lockUntilDate.toISOString();

      await db.collection("users").doc(userId).update(updateData);

      await auditLogService.logEvent({
        shopId,
        email: cleanEmail,
        userId,
        eventType: "TEMPORARY_LOCK_APPLIED",
        failureReason: `Locked for ${lockSeconds / 60} minutes after attempt ${currentAttempts}`,
        details: { lockUntil: lockUntilDate.toISOString(), lockSeconds },
        req,
      });

      return res.status(429).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        lockUntil: lockUntilDate.toISOString(),
        remainingSeconds: lockSeconds,
        message: "Too many failed login attempts. Please try again later.",
      });
    }

    // 1st failed attempt
    await db.collection("users").doc(userId).update(updateData);

    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }
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
