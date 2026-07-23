import { db } from "../../config/firebase.config";

const SHOPS_COLLECTION = "shops";
const SENSITIVE_FIELDS = [
  "apiSecret",
  "authToken",
  "password",
  "smtpPass",
  "apiKey",
  "secretKey",
  "credentials",
  "key_secret",
  "accessKeySecret",
];

function maskValue(val: string): string {
  if (!val || val.length < 6) return "â€¢â€¢â€¢â€¢â€¢â€¢";
  return val.slice(0, 4) + "â€¢".repeat(Math.min(val.length - 4, 20));
}

function maskIntegrations(integrations: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};
  for (const [providerKey, providerConfig] of Object.entries(integrations)) {
    if (typeof providerConfig !== "object" || providerConfig === null) {
      masked[providerKey] = providerConfig;
      continue;
    }

    masked[providerKey] = { ...providerConfig };
    for (const field of SENSITIVE_FIELDS) {
      if (masked[providerKey][field]) {
        masked[providerKey][field] = maskValue(masked[providerKey][field]);
      }
    }
  }
  return masked;
}

export class IntegrationsService {
  async getIntegrations(shopId: string) {
    const shopDoc = await db.collection(SHOPS_COLLECTION).doc(shopId).get();
    if (!shopDoc.exists) {
      return { status: "not_found" as const };
    }

    const integrations = shopDoc.data()?.integrations || {};
    return { status: "ok" as const, data: maskIntegrations(integrations) };
  }

  async updateIntegrations(shopId: string, provider?: string, config?: Record<string, any>) {
    if (!provider || !config) {
      return { status: "bad_request" as const };
    }

    const shopRef = db.collection(SHOPS_COLLECTION).doc(shopId);
    const shopDoc = await shopRef.get();
    if (!shopDoc.exists) {
      return { status: "not_found" as const };
    }

    const current = shopDoc.data()?.integrations || {};
    const existing = current[provider] || {};
    const merged: Record<string, any> = { ...existing };

    for (const [k, v] of Object.entries(config)) {
      const isSensitive = SENSITIVE_FIELDS.includes(k);
      const isMasked = typeof v === "string" && v.includes("â€¢");
      merged[k] = isSensitive && isMasked ? (existing[k] ?? v) : v;
    }

    await shopRef.update({
      [`integrations.${provider}`]: merged,
      updatedAt: new Date(),
    });

    return {
      status: "ok" as const,
      message: `${provider} integration updated`,
      data: maskIntegrations({ [provider]: merged })[provider],
    };
  }

  async deleteIntegration(shopId: string, provider: string) {
    const shopRef = db.collection(SHOPS_COLLECTION).doc(shopId);
    const shopDoc = await shopRef.get();
    if (!shopDoc.exists) {
      return { status: "not_found" as const };
    }

    const { FieldValue } = require("firebase-admin/firestore");
    await shopRef.update({
      [`integrations.${provider}`]: FieldValue.delete(),
      updatedAt: new Date(),
    });

    return { status: "ok" as const, message: `${provider} integration disconnected` };
  }
}

export const integrationsService = new IntegrationsService();
