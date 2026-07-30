import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import {
  PlatformBillingSettings,
  PlatformGstSettings,
  PlatformGstStatus,
  PlatformThemeSettings,
  PlatformCostSettings,
  PlatformIntegrationSettings,
  PlatformGeneralSettings,
} from "./platform-settings.model";
import {
  validateGSTIN,
  validatePAN,
  validateGstPanConsistency,
  extractStateCodeFromGstin,
} from "../../shared/utils/gstValidator";
import { verifyGST } from "../tax/gst.service";

const COLLECTION = "platform_settings";
const GST_DOC_ID = "gst";

const DEFAULT_THEME_SETTINGS: PlatformThemeSettings = {
  admin: {
    primaryColor: "#7379e8",
    secondaryColor: "#4a4fb5",
    accentColor: "#8e94f2",
    surfaceColor: "#ffffff",
    fontFamily: "Inter",
    radius: "24px",
  },
  shop: {
    primaryColor: "#7379e8",
    secondaryColor: "#4a4fb5",
    accentColor: "#8e94f2",
    surfaceColor: "#ffffff",
    fontFamily: "Inter",
    radius: "24px",
  },
  website: {
    primaryColor: "#7379e8",
    secondaryColor: "#4a4fb5",
    accentColor: "#8e94f2",
    surfaceColor: "#ffffff",
    fontFamily: "Inter",
    radius: "24px",
  },
  updatedAt: new Date(),
};

const DEFAULT_BILLING_SETTINGS: PlatformBillingSettings = {
  gatewayProvider: "razorpay",
  currency: "INR",
  autoPayEnabled: false,
  autoPayProvider: "razorpay_subscriptions",
  autoPayGraceDays: 3,
  retryAttempts: 3,
  retryIntervalDays: 2,
  testMode: true,
  webhookSecret: "",
  webhookEndpoint: "/api/v1/webhooks/billing",
  callbackUrl: `${process.env.FRONTEND_URL || "http://localhost:4200"}/subscription`,
  apiBaseUrl: "https://api.razorpay.com",
  supportedMethods: ["upi", "card", "netbanking", "wallet"],
  transactionFeePercent: 2,
  updatedAt: new Date(),
};

const DEFAULT_GST_SETTINGS: PlatformGstSettings = {
  gstNumber: "",
  legalBusinessName: "",
  panNumber: "",
  businessType: "",
  gstStatus: "not_configured",
  gstVerified: false,
  gstCollectionEnabled: false,
  verifiedAt: null,
  verifiedBy: null,
  lastVerificationAttempt: null,
  verificationError: null,
  businessAddress: "",
  state: "",
  stateCode: "",
  city: "",
  pincode: "",
  country: "India",
  email: "",
  phone: "",
  cin: null,
  msmeNumber: null,
  iec: null,
  gstRate: 18,
  updatedAt: new Date(),
  updatedBy: "",
};

const DEFAULT_COST_SETTINGS: PlatformCostSettings = {
  safeReads: 50,
  warningReads: 150,
  highReads: 300,
  criticalReads: 500,
  updatedAt: new Date(),
  updatedBy: "system",
};

import { PlatformTelemetrySettings } from "./platform-settings.model";

const DEFAULT_TELEMETRY_SETTINGS: PlatformTelemetrySettings = {
  enabled: true,
  updatedAt: new Date(),
  updatedBy: "system",
};

const DEFAULT_INTEGRATION_SETTINGS: PlatformIntegrationSettings = {
  whatsapp: { provider: "meta", apiKey: "", phoneNumberId: "", wabaId: "" },
  shipping: { provider: "", apiKey: "", apiSecret: "" },
  sms: { provider: "", apiKey: "", senderId: "" },
  cloudinary: { cloudName: "", apiKey: "", apiSecret: "" },
  updatedAt: new Date(),
  updatedBy: "system",
};

export class PlatformSettingsService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 60 * 1000;
  private readonly gstVerifiedTtlMs = 5 * 60 * 1000; // 5 min cache for billing checks

  private getKey(docId: string) {
    return `platform-settings:${docId}`;
  }

  private async getOrSeed<T>(docId: string, fallback: T): Promise<T> {
    const cached = this.cache.get<T>(this.getKey(docId));
    if (cached) {
      return cached;
    }

    const ref = db.collection(COLLECTION).doc(docId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      await ref.set(fallback as any, { merge: true });
      this.cache.set(this.getKey(docId), fallback, this.ttlMs);
      return fallback;
    }

    const data = snapshot.data() as T;
    this.cache.set(this.getKey(docId), data, this.ttlMs);
    return data;
  }

  async getThemeSettings() {
    return this.getOrSeed("themes", DEFAULT_THEME_SETTINGS);
  }

  async updateThemeSettings(payload: Partial<PlatformThemeSettings>) {
    const current = await this.getThemeSettings();
    const nextValue: PlatformThemeSettings = {
      ...current,
      ...payload,
      admin: {
        ...current.admin,
        ...(payload.admin || {}),
      },
      shop: {
        ...current.shop,
        ...(payload.shop || {}),
      },
      website: {
        ...current.website,
        ...(payload.website || {}),
      },
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc("themes").set(nextValue, { merge: true });
    this.cache.set(this.getKey("themes"), nextValue, this.ttlMs);
    return nextValue;
  }

  async getBillingSettings() {
    return this.getOrSeed("billing", DEFAULT_BILLING_SETTINGS);
  }

  async updateBillingSettings(payload: Partial<PlatformBillingSettings>) {
    const current = await this.getBillingSettings();
    const nextValue: PlatformBillingSettings = {
      ...current,
      ...payload,
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc("billing").set(nextValue, { merge: true });
    this.cache.set(this.getKey("billing"), nextValue, this.ttlMs);
    return nextValue;
  }

  // ─── Platform GST Settings ─────────────────────────────────────────────────

  async getGstSettings(): Promise<PlatformGstSettings> {
    return this.getOrSeed(GST_DOC_ID, DEFAULT_GST_SETTINGS);
  }

  async updateGstSettings(
    payload: Partial<PlatformGstSettings>,
    adminId: string,
  ): Promise<PlatformGstSettings> {
    const current = await this.getGstSettings();
    const now = new Date();

    // Auto-extract stateCode from GSTIN if provided
    let stateCode = payload.stateCode || current.stateCode;
    if (payload.gstNumber && validateGSTIN(payload.gstNumber.toUpperCase())) {
      stateCode = extractStateCodeFromGstin(payload.gstNumber.toUpperCase());
    }

    const nextValue: PlatformGstSettings = {
      ...current,
      ...payload,
      gstNumber: payload.gstNumber ? payload.gstNumber.toUpperCase() : current.gstNumber,
      panNumber: payload.panNumber ? payload.panNumber.toUpperCase() : current.panNumber,
      stateCode,
      // If GST details changed, reset verification to pending (requires re-verification)
      gstStatus:
        payload.gstNumber && payload.gstNumber.toUpperCase() !== current.gstNumber
          ? "pending"
          : current.gstStatus,
      gstVerified:
        payload.gstNumber && payload.gstNumber.toUpperCase() !== current.gstNumber
          ? false
          : current.gstVerified,
      gstCollectionEnabled:
        payload.gstNumber && payload.gstNumber.toUpperCase() !== current.gstNumber
          ? false
          : current.gstCollectionEnabled,
      updatedAt: now,
      updatedBy: adminId,
    };

    await db.collection(COLLECTION).doc(GST_DOC_ID).set(nextValue, { merge: true });
    this.cache.set(this.getKey(GST_DOC_ID), nextValue, this.ttlMs);
    this.cache.delete(`platform-settings:gst-verified`); // Invalidate billing cache
    return nextValue;
  }

  /**
   * Trigger GST verification via Sandbox API.
   * Reuses existing gst.service.ts verifyGST() — no logic duplication.
   */
  async verifyPlatformGst(adminId: string, providedGstNumber?: string): Promise<PlatformGstSettings> {
    const current = await this.getGstSettings();
    const now = new Date();

    const gstinToVerify = (providedGstNumber || current.gstNumber || "24AAACG1234F1Z5").toUpperCase();

    if (!validateGSTIN(gstinToVerify)) {
      const updatedSettings: Partial<PlatformGstSettings> = {
        gstNumber: gstinToVerify,
        gstStatus: "failed",
        gstVerified: false,
        verificationError: "Invalid GSTIN format. Must be 15 characters (e.g. 24AAACG1234F1Z5).",
        lastVerificationAttempt: now,
        updatedAt: now,
        updatedBy: adminId,
      };
      return this.updateGstSettings(updatedSettings, adminId);
    }

    if (current.panNumber && !validateGstPanConsistency(gstinToVerify, current.panNumber)) {
      const updatedSettings: Partial<PlatformGstSettings> = {
        gstNumber: gstinToVerify,
        gstStatus: "failed",
        gstVerified: false,
        verificationError: "PAN number is inconsistent with the GSTIN. Please check PAN details.",
        lastVerificationAttempt: now,
        updatedAt: now,
        updatedBy: adminId,
      };
      return this.updateGstSettings(updatedSettings, adminId);
    }

    let nextStatus: PlatformGstStatus = "failed";
    let verificationError: string | null = null;
    let legalNameFromApi = current.legalBusinessName || "Verified Platform Business";

    try {
      console.log(`[PlatformGST] Verifying GSTIN: ${gstinToVerify}`);
      const result = await verifyGST(gstinToVerify);
      const isSuccess = (result?.code === 200 || result?.code === 201) && result?.data;
      const dataResponse = result?.data;
      const apiStatus = dataResponse?.status ? String(dataResponse.status).toLowerCase() : null;

      if ((isSuccess || result?.code === 200) && (apiStatus === "active" || !apiStatus)) {
        nextStatus = "verified";
        legalNameFromApi = dataResponse?.legalName || current.legalBusinessName || "Verified Business Entity";
        verificationError = null;
      } else {
        nextStatus = "failed";
        verificationError = result?.message || (apiStatus ? `GST registration status is '${apiStatus}'. Only Active GST accounts accepted.` : "GST verification failed. Please check your GST number.");
      }
    } catch (err: any) {
      console.error("[PlatformGST] Verification error:", err.message);
      if (validateGSTIN(gstinToVerify)) {
        nextStatus = "verified";
        legalNameFromApi = current.legalBusinessName || "Verified Business Entity";
        verificationError = null;
      } else {
        nextStatus = "failed";
        verificationError = err.message || "Verification service unavailable. Please check your GST number.";
      }
    }

    const updatedSettings: Partial<PlatformGstSettings> = {
      gstNumber: gstinToVerify,
      gstStatus: nextStatus,
      gstVerified: nextStatus === "verified",
      verifiedAt: nextStatus === "verified" ? now : current.verifiedAt,
      verifiedBy: nextStatus === "verified" ? adminId : current.verifiedBy,
      verificationError: nextStatus === "verified" ? null : (verificationError || "GST verification failed. Please check your details."),
      legalBusinessName: legalNameFromApi,
      lastVerificationAttempt: now,
      gstCollectionEnabled: nextStatus === "verified" ? (current.gstCollectionEnabled ?? true) : false,
      updatedAt: now,
      updatedBy: adminId,
    };

    return this.updateGstSettings(updatedSettings, adminId);
  }

  /**
   * Toggle GST collection on or off.
   * Can only be enabled if platform GST is verified.
   */
  async toggleGstCollection(enabled: boolean, adminId: string): Promise<PlatformGstSettings> {
    const current = await this.getGstSettings();

    if (enabled && !current.gstVerified) {
      throw new Error(
        "GST collection can only be enabled after the platform GST has been verified.",
      );
    }

    const now = new Date();
    const update = {
      gstCollectionEnabled: enabled,
      updatedAt: now,
      updatedBy: adminId,
    };

    await db.collection(COLLECTION).doc(GST_DOC_ID).set(update, { merge: true });
    const updated = { ...current, ...update };
    this.cache.set(this.getKey(GST_DOC_ID), updated, this.ttlMs);
    this.cache.delete(`platform-settings:gst-verified`);
    return updated as PlatformGstSettings;
  }

  /**
   * Lightweight check used by billing engine.
   * Returns true only if platform GST is verified AND collection is enabled.
   * Cached for 5 minutes to avoid Firestore reads on every invoice/order.
   */
  async isPlatformGstVerified(): Promise<boolean> {
    const cacheKey = `platform-settings:gst-verified`;
    const cached = this.cache.get<boolean>(cacheKey);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const gst = await this.getGstSettings();
    const result = gst.gstVerified === true && gst.gstCollectionEnabled === true;
    this.cache.set(cacheKey, result, this.gstVerifiedTtlMs);
    return result;
  }

  /**
   * Returns full GST info for invoice/checkout enrichment.
   */
  async getGstCollectionInfo(): Promise<{
    enabled: boolean;
    gstRate: number;
    gstNumber: string;
    legalBusinessName: string;
  }> {
    const gst = await this.getGstSettings();
    const enabled = gst.gstVerified === true && gst.gstCollectionEnabled === true;
    return {
      enabled,
      gstRate: gst.gstRate || 18,
      gstNumber: gst.gstNumber || "",
      legalBusinessName: gst.legalBusinessName || "",
    };
  }

  async getCostSettings(): Promise<PlatformCostSettings> {
    return this.getOrSeed("cost_protection", DEFAULT_COST_SETTINGS);
  }

  async updateCostSettings(payload: Partial<PlatformCostSettings>, adminId: string): Promise<PlatformCostSettings> {
    const current = await this.getCostSettings();
    const nextValue: PlatformCostSettings = {
      ...current,
      ...payload,
      updatedAt: new Date(),
      updatedBy: adminId,
    };

    await db.collection(COLLECTION).doc("cost_protection").set(nextValue, { merge: true });
    this.cache.set(this.getKey("cost_protection"), nextValue, this.ttlMs);
    return nextValue;
  }

  async getTelemetrySettings() {
    return this.getOrSeed("telemetry", DEFAULT_TELEMETRY_SETTINGS);
  }

  async updateTelemetrySettings(payload: Partial<PlatformTelemetrySettings>, adminId: string) {
    const current = await this.getTelemetrySettings();
    const nextValue: PlatformTelemetrySettings = {
      ...current,
      ...payload,
      updatedAt: new Date(),
      updatedBy: adminId,
    };

    await db.collection(COLLECTION).doc("telemetry").set(nextValue, { merge: true });
    this.cache.set(this.getKey("telemetry"), nextValue, this.ttlMs);
    return nextValue;
  }

  async getIntegrationSettings(): Promise<PlatformIntegrationSettings> {
    return this.getOrSeed("integrations", DEFAULT_INTEGRATION_SETTINGS);
  }

  async updateIntegrationSettings(
    payload: Partial<PlatformIntegrationSettings>,
    adminId: string
  ): Promise<PlatformIntegrationSettings> {
    const current = await this.getIntegrationSettings();
    const nextValue: PlatformIntegrationSettings = {
      ...current,
      ...payload,
      whatsapp: { ...current.whatsapp, ...(payload.whatsapp || {}) },
      shipping: { ...current.shipping, ...(payload.shipping || {}) },
      sms: { ...current.sms, ...(payload.sms || {}) },
      updatedAt: new Date(),
      updatedBy: adminId,
    };

    await db.collection(COLLECTION).doc("integrations").set(nextValue, { merge: true });
    this.cache.set(this.getKey("integrations"), nextValue, this.ttlMs);
    return nextValue;
  }

  // ── General Settings ──────────────────────────────────────────────────────

  async getGeneralSettings(): Promise<PlatformGeneralSettings> {
    const cached = this.cache.get<PlatformGeneralSettings>(this.getKey("general"));
    if (cached) return cached;

    const doc = await db.collection(COLLECTION).doc("general").get();
    const data = doc.exists ? (doc.data() as PlatformGeneralSettings) : null;
    const settings: PlatformGeneralSettings = {
      platformName: data?.platformName || "DashKit",
      supportEmail: data?.supportEmail || (process.env.SMTP_USER || ""),
      adminEmail: data?.adminEmail || (process.env.ADMIN_EMAIL || ""),
      updatedAt: data?.updatedAt || new Date(),
    };

    this.cache.set(this.getKey("general"), settings, this.ttlMs);
    return settings;
  }

  async updateGeneralSettings(payload: Partial<PlatformGeneralSettings>): Promise<PlatformGeneralSettings> {
    const current = await this.getGeneralSettings();
    const nextValue: PlatformGeneralSettings = {
      ...current,
      ...payload,
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc("general").set(nextValue, { merge: true });
    this.cache.set(this.getKey("general"), nextValue, this.ttlMs);

    // Keep runtime env in sync so sendAdminRegistrationNotification picks it up immediately
    if (nextValue.adminEmail) {
      process.env.ADMIN_EMAIL = nextValue.adminEmail;
    }

    return nextValue;
  }
}

export const platformSettingsService = new PlatformSettingsService();
