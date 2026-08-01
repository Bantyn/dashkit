import crypto from "crypto";
import { db } from "../../config/firebase.config";
import {
  OfflinePosCounter,
  CreateCounterDTO,
  CounterCredentialsResult,
  OfflinePosLog
} from "./offline-pos.model";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../../shared/utils/errors";
import { subscriptionService } from "../subscription/subscription.service";
import { LIMIT_KEYS, FEATURE_KEYS } from "../subscription/subscription.constants";

const COUNTERS_COLLECTION = "offline_pos_counters";
const LOGS_COLLECTION = "offline_pos_logs";
const SESSIONS_COLLECTION = "offline_pos_sessions";

export class OfflinePosService {
  private hashSecret(secret: string): string {
    return crypto.createHash("sha256").update(secret).digest("hex");
  }

  private generateApiKey(): string {
    return `apk_pos_${crypto.randomBytes(16).toString("hex")}`;
  }

  private generateSecretKey(): string {
    return `sec_pos_${crypto.randomBytes(24).toString("hex")}`;
  }

  private async generateCounterId(shopId: string): Promise<string> {
    const snap = await db.collection(COUNTERS_COLLECTION).where("shopId", "==", shopId).get();
    const nextNum = snap.size + 1;
    return `CNT-${String(nextNum).padStart(3, "0")}`;
  }

  async getCounters(shopId: string): Promise<OfflinePosCounter[]> {
    const snap = await db.collection(COUNTERS_COLLECTION).where("shopId", "==", shopId).get();
    const now = new Date().getTime();
    
    return snap.docs.map((doc: any) => {
      const data = doc.data() as OfflinePosCounter;
      const lastSeen = data.lastConnectedAt ? new Date(data.lastConnectedAt).getTime() : 0;
      const isOnline = now - lastSeen < 2 * 60 * 1000 && data.status === "active"; // online if seen in last 2 mins

      return {
        ...data,
        id: doc.id,
        deviceStatus: isOnline ? "online" : "offline",
      } as any;
    });
  }

  async getCounter(id: string): Promise<OfflinePosCounter | null> {
    const doc = await db.collection(COUNTERS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as OfflinePosCounter;
  }

  async createCounter(shopId: string, data: CreateCounterDTO, performedBy: string = "shop_owner"): Promise<CounterCredentialsResult> {
    // 1. Check feature entitlement using subscription access context
    const accessContext = await subscriptionService.resolveAccessContext({ shopId });
    const hasFeature = accessContext.features.includes(FEATURE_KEYS.SELL_OFFLINE_POS_COUNTERS) || accessContext.features.includes("*");
    if (!hasFeature) {
      throw new ForbiddenError("Your subscription plan does not include the Offline POS Counters feature. Please upgrade your plan.");
    }

    // 2. Check numeric counter limit
    const allowedLimit = accessContext.limits?.[LIMIT_KEYS.OFFLINE_POS_COUNTERS_COUNT];
    if (allowedLimit !== null && allowedLimit !== undefined && allowedLimit !== -1) {
      const currentCounters = await this.getCounters(shopId);
      const activeCount = currentCounters.filter(c => c.status !== "revoked").length;
      if (activeCount >= Number(allowedLimit)) {
        throw new ForbiddenError(`You have reached your Offline POS Counter limit (${allowedLimit}). Purchase additional counters to add more devices.`);
      }
    }

    const counterId = await this.generateCounterId(shopId);
    const apiKey = this.generateApiKey();
    const secretKey = this.generateSecretKey();
    const secretHash = this.hashSecret(secretKey);

    const now = new Date();
    const docRef = db.collection(COUNTERS_COLLECTION).doc();

    const counterData: OfflinePosCounter = {
      id: docRef.id,
      shopId,
      branchId: data.branchId || null,
      name: data.name.trim(),
      description: data.description?.trim() || "",
      counterId,
      apiKey,
      secretHash,
      status: "active",
      location: data.location || "",
      lastConnectedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(counterData);
    await this.logAction(shopId, counterId, "COUNTER_CREATED", performedBy, { name: data.name, counterId });

    const connectionUrl = `${process.env.APP_URL || "http://localhost:3003"}/api/v1/public/offline-pos/auth`;

    return {
      counter: counterData,
      counterId,
      apiKey,
      secretKey,
      connectionUrl,
    };
  }

  async updateCounter(id: string, shopId: string, updates: Partial<OfflinePosCounter>, performedBy: string = "shop_owner"): Promise<OfflinePosCounter> {
    const docRef = db.collection(COUNTERS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.shopId !== shopId) {
      throw new NotFoundError("POS Counter not found");
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    delete updateData.secretHash;
    delete updateData.apiKey;
    delete updateData.counterId;

    await docRef.update(updateData);
    await this.logAction(shopId, doc.data()?.counterId, "COUNTER_UPDATED", performedBy, updates);

    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as OfflinePosCounter;
  }

  async deleteCounter(id: string, shopId: string, performedBy: string = "shop_owner"): Promise<void> {
    const docRef = db.collection(COUNTERS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.shopId !== shopId) {
      throw new NotFoundError("POS Counter not found");
    }

    const counterId = doc.data()?.counterId;
    await docRef.delete();
    await this.logAction(shopId, counterId, "COUNTER_DELETED", performedBy, { counterId });
  }

  async regenerateCredentials(id: string, shopId: string, performedBy: string = "shop_owner"): Promise<{ apiKey: string; secretKey: string }> {
    const docRef = db.collection(COUNTERS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.shopId !== shopId) {
      throw new NotFoundError("POS Counter not found");
    }

    const apiKey = this.generateApiKey();
    const secretKey = this.generateSecretKey();
    const secretHash = this.hashSecret(secretKey);

    await docRef.update({
      apiKey,
      secretHash,
      updatedAt: new Date(),
    });

    await this.logAction(shopId, doc.data()?.counterId, "CREDENTIALS_REGENERATED", performedBy, { counterId: doc.data()?.counterId });

    return { apiKey, secretKey };
  }

  async authenticateDesktop(params: {
    shopId?: string;
    counterId: string;
    apiKey: string;
    secretKey: string;
    appVersion?: string;
    os?: string;
    desktopName?: string;
    ipAddress?: string;
  }) {
    const { counterId, apiKey, secretKey, appVersion, os, desktopName, ipAddress } = params;

    const snap = await db
      .collection(COUNTERS_COLLECTION)
      .where("counterId", "==", counterId)
      .where("apiKey", "==", apiKey)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new UnauthorizedError("Invalid Counter ID or API Key");
    }

    const counterDoc = snap.docs[0];
    const counter = counterDoc.data() as OfflinePosCounter;

    const secretHash = this.hashSecret(secretKey);
    if (counter.secretHash !== secretHash) {
      throw new UnauthorizedError("Invalid Secret Key");
    }

    if (counter.status !== "active") {
      throw new ForbiddenError(`Counter is ${counter.status}. Please contact store owner.`);
    }

    const now = new Date();
    await counterDoc.ref.update({
      lastConnectedAt: now,
      appVersion: appVersion || counter.appVersion || "1.0.0",
      os: os || counter.os || "Desktop",
      desktopName: desktopName || counter.desktopName || "POS Desktop",
      ipAddress: ipAddress || counter.ipAddress || "127.0.0.1",
      updatedAt: now,
    });

    const accessToken = `pos_jwt_${crypto.randomBytes(32).toString("hex")}`;
    const refreshToken = `pos_rf_${crypto.randomBytes(32).toString("hex")}`;

    await db.collection(SESSIONS_COLLECTION).doc(counterId).set({
      counterId,
      shopId: counter.shopId,
      sessionToken: accessToken,
      lastSeenAt: now,
      ipAddress: ipAddress || "127.0.0.1",
      status: "online",
    });

    await this.logAction(counter.shopId, counterId, "COUNTER_CONNECTED", "desktop_app", {
      appVersion,
      os,
      desktopName,
    });

    return {
      success: true,
      shopId: counter.shopId,
      counterId: counter.counterId,
      counterName: counter.name,
      accessToken,
      refreshToken,
      expiresIn: 86400 * 30, // 30 days session
    };
  }

  async heartbeat(counterId: string, apiKey: string, deviceData: { appVersion?: string; os?: string; ipAddress?: string }) {
    const snap = await db.collection(COUNTERS_COLLECTION).where("counterId", "==", counterId).where("apiKey", "==", apiKey).limit(1).get();
    if (snap.empty) return false;

    const doc = snap.docs[0];
    const now = new Date();

    await doc.ref.update({
      lastConnectedAt: now,
      ...(deviceData.appVersion ? { appVersion: deviceData.appVersion } : {}),
      ...(deviceData.os ? { os: deviceData.os } : {}),
      ...(deviceData.ipAddress ? { ipAddress: deviceData.ipAddress } : {}),
    });

    return true;
  }

  async logAction(shopId: string, counterId: string, action: string, performedBy: string, details?: any) {
    const logData: OfflinePosLog = {
      id: db.collection(LOGS_COLLECTION).doc().id,
      shopId,
      counterId,
      action,
      performedBy,
      details: details || {},
      timestamp: new Date(),
    };
    await db.collection(LOGS_COLLECTION).add(logData);
  }

  async getLogs(shopId: string, limitCount: number = 50): Promise<OfflinePosLog[]> {
    const snap = await db.collection(LOGS_COLLECTION).where("shopId", "==", shopId).limit(limitCount).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as OfflinePosLog));
  }
}

export const offlinePosService = new OfflinePosService();
