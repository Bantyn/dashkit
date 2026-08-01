import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/utils/errors";
import { userService } from "../user/user.service";
import { FeatureDefinition } from "./feature.model";
import { SubscriptionPlan } from "./plan.model";
import { UsageTracking } from "./usage-tracking.model";
import { DEFAULT_FEATURES, DEFAULT_PLANS } from "./subscription.constants";
import { platformSettingsService } from "../platform-settings/platform-settings.service";

const FEATURES_COLLECTION = "features";
const PLANS_COLLECTION = "plans";
const USAGE_COLLECTION = "usage_tracking";
const SHOPS_COLLECTION = "shops";
const META_COLLECTION = "system_meta";
const SUBSCRIPTION_DEFAULTS_META_DOC = "subscription_defaults_v1";

export interface SubscriptionAccessContext {
  userId?: string;
  shopId?: string;
  source: "user" | "shop" | "default";
  plan: SubscriptionPlan;
  features: string[];
  limits: Record<string, number | null | undefined>;
  isRestricted?: boolean;
}

export interface UsageScopeInput {
  userId?: string;
  shopId?: string;
  planId: string;
  limitKey: string;
  incrementBy?: number;
  period?: "monthly" | "daily" | "yearly" | "lifetime";
  subjectType?: "shop" | "user";
  subjectId?: string;
}

export class SubscriptionService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 15 * 60 * 1000; // 15 minutes for dynamic access context
  private readonly staticTtlMs = 15 * 60 * 1000; // 15 minutes for static plans & features
  private defaultsEnsured = false;
  private defaultsPromise: Promise<void> | null = null;

  private getFeatureKey(key: string) {
    return `subscription:feature:${key}`;
  }

  private getPlanKey(key: string) {
    return `subscription:plan:${key}`;
  }

  private getFeatureListKey(activeOnly: boolean) {
    return `subscription:features:${activeOnly ? "active" : "all"}`;
  }

  private getPlanListKey(activeOnly: boolean) {
    return `subscription:plans:${activeOnly ? "active" : "all"}`;
  }

  private getAccessKey(userId?: string, shopId?: string) {
    return `subscription:access:${userId || "guest"}:${shopId || "no-shop"}`;
  }

  private getUsageKey(id: string) {
    return `subscription:usage:${id}`;
  }

  private getDefaultFeatureDefinition(key: string): FeatureDefinition | null {
    const normalizedKey = String(key).trim().toLowerCase();
    return (
      DEFAULT_FEATURES.find((feature) => feature.key === normalizedKey) || null
    );
  }

  private getDefaultPlanDefinition(idOrCode: string): SubscriptionPlan | null {
    const normalized = String(idOrCode).trim().toLowerCase();
    return (
      DEFAULT_PLANS.find(
        (plan) =>
          plan.id === normalized ||
          plan.code === normalized ||
          plan.name.toLowerCase() === normalized,
      ) || null
    );
  }

  private invalidateFeatureCache(key?: string) {
    if (key) {
      this.cache.delete(this.getFeatureKey(key));
    }
    this.cache.delete(this.getFeatureListKey(true));
    this.cache.delete(this.getFeatureListKey(false));
  }

  private invalidatePlanCache(id?: string) {
    if (id) {
      this.cache.delete(this.getPlanKey(id));
    }
    this.cache.delete(this.getPlanListKey(true));
    this.cache.delete(this.getPlanListKey(false));
  }

  private invalidateAccessCache(userId?: string, shopId?: string) {
    if (!userId && !shopId) {
      this.cache.deleteByPrefix("subscription:access:");
      return;
    }

    if (shopId) {
      this.cache.delete(`subscription:shop:${shopId}`);
      this.cache.deleteByMatch((key) => key.startsWith("subscription:access:") && key.includes(`:${shopId}`));
    }

    if (userId || shopId) {
      this.cache.delete(this.getAccessKey(userId, shopId));
    }
    if (userId) {
      this.cache.deleteByPrefix(`subscription:access:${userId}:`);
    }
    if (shopId) {
      this.cache.deleteByPrefix(`subscription:access:guest:${shopId}`);
    }
  }

  private normalizeFeature(
    payload: Partial<FeatureDefinition> & { key?: string },
    existing?: FeatureDefinition | null,
  ): FeatureDefinition {
    const key = String(payload.key || existing?.key || "").trim().toLowerCase();
    if (!key) {
      throw new ValidationError("Feature key is required");
    }

    const active = payload.active ?? existing?.active ?? true;
    const status = payload.status !== undefined 
      ? payload.status 
      : (existing?.status || (active ? 'active' : 'inactive'));

    return {
      key,
      label: String(payload.label || existing?.label || key),
      category: (payload.category || existing?.category || "core") as FeatureDefinition["category"],
      description:
        payload.description !== undefined ? payload.description : existing?.description,
      active,
      status,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  private normalizePlan(
    payload: Partial<SubscriptionPlan> & { name?: string; code?: string; id?: string },
    existing?: SubscriptionPlan | null,
  ): SubscriptionPlan {
    const fallbackId =
      payload.id ||
      payload.code ||
      payload.name?.toLowerCase().replace(/\s+/g, "-") ||
      existing?.id;

    const id = String(fallbackId || "").trim().toLowerCase();
    if (!id) {
      throw new ValidationError("Plan id or name is required");
    }

    const price =
      payload.price !== undefined
        ? payload.price
        : payload.monthlyPrice !== undefined
          ? payload.monthlyPrice
          : existing?.price ?? existing?.monthlyPrice ?? 0;

    let includedStorageMB = payload.includedStorageMB !== undefined
      ? payload.includedStorageMB
      : existing?.includedStorageMB;

    // Default to fallback limit if not present in legacy plans
    if (includedStorageMB === undefined || includedStorageMB === null) {
      const legacyStorageMB = payload.limits?.storage_limit_mb ?? existing?.limits?.storage_limit_mb ?? 500;
      includedStorageMB = Number(legacyStorageMB);
    }

    if (includedStorageMB === null || includedStorageMB === undefined) {
      throw new ValidationError("Storage cannot be null");
    }
    const storageMbNum = Number(includedStorageMB);
    if (isNaN(storageMbNum) || storageMbNum < 0) {
      throw new ValidationError("Storage cannot be negative");
    }

    const storageUnit = payload.storageUnit || existing?.storageUnit || "MB";
    const includedStorageBytes = Math.round(storageMbNum * 1024 * 1024);

    let storageDisplay = payload.storageDisplay || existing?.storageDisplay;
    if (!storageDisplay || payload.storageUnit !== undefined || payload.includedStorageMB !== undefined) {
      storageDisplay = storageUnit === "GB"
        ? `${Number((storageMbNum / 1024).toFixed(2).replace(/\.00$/, ''))} GB`
        : `${storageMbNum} MB`;
    }

    return {
      id,
      code: String(payload.code || existing?.code || id).trim().toLowerCase(),
      name: String(payload.name || existing?.name || id),
      description: String(payload.description || existing?.description || ""),
      price: price ?? null,
      monthlyPrice:
        payload.monthlyPrice !== undefined
          ? payload.monthlyPrice
          : (price ?? existing?.monthlyPrice ?? 0),
      yearlyPrice:
        payload.yearlyPrice !== undefined ? payload.yearlyPrice : existing?.yearlyPrice ?? null,
      currency: String(payload.currency || existing?.currency || "INR"),
      features: Array.from(
        new Set(
          (Array.isArray(payload.features) ? payload.features : existing?.features || []).map(
            (feature) => String(feature).trim().toLowerCase(),
          ),
        ),
      ),
      limits: {
        ...(existing?.limits || {}),
        ...(payload.limits || {}),
        storage_limit_mb: storageMbNum
      },
      includedStorageMB: storageMbNum,
      includedStorageBytes,
      storageUnit,
      storageDisplay,
      badge: payload.badge !== undefined ? payload.badge : existing?.badge,
      targetAudience:
        payload.targetAudience !== undefined ? payload.targetAudience : existing?.targetAudience,
      capabilityLabel:
        payload.capabilityLabel !== undefined
          ? payload.capabilityLabel
          : existing?.capabilityLabel,
      icon: payload.icon !== undefined ? payload.icon : existing?.icon,
      color: payload.color !== undefined ? payload.color : existing?.color,
      bgColor: payload.bgColor !== undefined ? payload.bgColor : existing?.bgColor,
      featured: payload.featured ?? existing?.featured ?? false,
      active: payload.active ?? existing?.active ?? true,
      sortOrder: payload.sortOrder ?? existing?.sortOrder ?? 99,
      limitations:
        payload.limitations !== undefined ? payload.limitations : existing?.limitations || [],
      metadata: {
        ...(existing?.metadata || {}),
        ...(payload.metadata || {}),
      },
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  private async getShopById(shopId: string) {
    const cacheKey = `subscription:shop:${shopId}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection(SHOPS_COLLECTION).doc(shopId).get();
    if (!snapshot.exists) {
      return null;
    }

    const shop = { id: snapshot.id, ...snapshot.data() } as any;
    this.cache.set(cacheKey, shop, this.ttlMs);
    return shop;
  }

  private buildPeriodKey(period: UsageScopeInput["period"] = "monthly") {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");

    switch (period) {
      case "daily":
        return `${year}-${month}-${day}`;
      case "yearly":
        return `${year}`;
      case "lifetime":
        return "lifetime";
      case "monthly":
      default:
        return `${year}-${month}`;
    }
  }

  private buildUsageDocumentId(input: {
    subjectType: "shop" | "user";
    subjectId: string;
    planId: string;
    limitKey: string;
    periodKey: string;
  }) {
    return [
      input.subjectType,
      input.subjectId,
      input.planId,
      input.limitKey,
      input.periodKey,
    ].join(":");
  }

  async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    if (!this.defaultsPromise) {
      this.defaultsPromise = this.ensureDefaultsInternal().finally(() => {
        this.defaultsPromise = null;
      });
    }

    await this.defaultsPromise;
  }

  private async ensureDefaultsInternal() {
    const metaRef = db.collection(META_COLLECTION).doc(SUBSCRIPTION_DEFAULTS_META_DOC);
    const metaSnapshot = await metaRef.get();

    if (metaSnapshot.exists) {
      this.defaultsEnsured = true;
      return;
    }

    const batch = db.batch();

    DEFAULT_FEATURES.forEach((feature) => {
      batch.set(db.collection(FEATURES_COLLECTION).doc(feature.key), feature, { merge: true });
    });

    DEFAULT_PLANS.forEach((plan) => {
      batch.set(db.collection(PLANS_COLLECTION).doc(plan.id), plan, { merge: true });
    });

    batch.set(
      metaRef,
      {
        initializedAt: new Date(),
        featureCount: DEFAULT_FEATURES.length,
        planCount: DEFAULT_PLANS.length,
      },
      { merge: true },
    );

    await batch.commit();
    this.defaultsEnsured = true;
  }

  async ensureDefaultFeatures() {
    await this.ensureDefaults();
  }

  async ensureDefaultPlans() {
    await this.ensureDefaults();
  }

  async listFeatures(activeOnly = false) {
    await this.ensureDefaultFeatures();

    const cached = this.cache.get<FeatureDefinition[]>(this.getFeatureListKey(activeOnly));
    if (cached) {
      return cached;
    }

    const snapshot = await db.collection(FEATURES_COLLECTION).get();
    const sourceFeatures = snapshot.empty
      ? DEFAULT_FEATURES
      : snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as FeatureDefinition);
    const features = sourceFeatures
      .map((f: any) => ({
        ...f,
        status: f.status || (f.active ? "active" : "inactive")
      }))
      .filter((feature: FeatureDefinition) => (activeOnly ? feature.active !== false : true))
      .sort((a: FeatureDefinition, b: FeatureDefinition) => a.label.localeCompare(b.label));

    this.cache.set(this.getFeatureListKey(activeOnly), features, this.staticTtlMs);
    features.forEach((feature: FeatureDefinition) => this.cache.set(this.getFeatureKey(feature.key), feature, this.staticTtlMs));
    return features;
  }

  async getFeature(key: string) {
    await this.ensureDefaultFeatures();

    const normalizedKey = String(key).trim().toLowerCase();
    const cached = this.cache.get<FeatureDefinition>(this.getFeatureKey(normalizedKey));
    if (cached) {
      return cached;
    }

    const snapshot = await db.collection(FEATURES_COLLECTION).doc(normalizedKey).get();
    if (!snapshot.exists) {
      const fallbackFeature = this.getDefaultFeatureDefinition(normalizedKey);
      if (fallbackFeature) {
        const mappedFallback = {
          ...fallbackFeature,
          status: fallbackFeature.status || (fallbackFeature.active ? "active" : "inactive")
        };
        this.cache.set(this.getFeatureKey(normalizedKey), mappedFallback, this.staticTtlMs);
        return mappedFallback;
      }
      return null;
    }

    const rawFeature = snapshot.data() as FeatureDefinition;
    const feature = {
      ...rawFeature,
      status: rawFeature.status || (rawFeature.active ? "active" : "inactive")
    };
    this.cache.set(this.getFeatureKey(normalizedKey), feature, this.staticTtlMs);
    return feature;
  }

  async createFeature(payload: Partial<FeatureDefinition>) {
    const feature = this.normalizeFeature(payload);
    await db.collection(FEATURES_COLLECTION).doc(feature.key).set(feature, { merge: true });
    this.invalidateFeatureCache(feature.key);
    return feature;
  }

  async updateFeature(key: string, payload: Partial<FeatureDefinition>) {
    const existing = await this.getFeature(key);
    if (!existing) {
      return null;
    }

    const feature = this.normalizeFeature({ ...payload, key }, existing);
    await db.collection(FEATURES_COLLECTION).doc(feature.key).set(feature, { merge: true });
    this.invalidateFeatureCache(feature.key);
    return feature;
  }

  async deleteFeature(key: string) {
    await db.collection(FEATURES_COLLECTION).doc(key).delete();
    this.invalidateFeatureCache(key);
  }

  async listPlans(activeOnly = false) {
    await this.ensureDefaultPlans();

    const cached = this.cache.get<SubscriptionPlan[]>(this.getPlanListKey(activeOnly));
    if (cached) {
      return cached;
    }

    const snapshot = await db.collection(PLANS_COLLECTION).get();
    const sourcePlans = snapshot.empty
      ? DEFAULT_PLANS
      : snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as SubscriptionPlan);
    const plans = sourcePlans
      .filter((plan: SubscriptionPlan) => (activeOnly ? plan.active !== false : true))
      .sort((a: SubscriptionPlan, b: SubscriptionPlan) => (a.sortOrder || 0) - (b.sortOrder || 0));

    this.cache.set(this.getPlanListKey(activeOnly), plans, this.staticTtlMs);
    plans.forEach((plan: SubscriptionPlan) => {
      this.cache.set(this.getPlanKey(plan.id), plan, this.staticTtlMs);
      this.cache.set(this.getPlanKey(plan.code), plan, this.staticTtlMs);
    });
    return plans;
  }

  async getPlan(idOrCode: string) {
    await this.ensureDefaultPlans();

    const normalized = String(idOrCode).trim().toLowerCase();
    const cached = this.cache.get<SubscriptionPlan>(this.getPlanKey(normalized));
    if (cached) {
      return cached;
    }

    const directSnapshot = await db.collection(PLANS_COLLECTION).doc(normalized).get();
    if (directSnapshot.exists) {
      const plan = directSnapshot.data() as SubscriptionPlan;
      this.cache.set(this.getPlanKey(plan.id), plan, this.staticTtlMs);
      this.cache.set(this.getPlanKey(plan.code), plan, this.staticTtlMs);
      return plan;
    }

    const allPlans = await this.listPlans(false);
    const matchedPlan = allPlans.find(
      (plan: SubscriptionPlan) =>
        plan.id === normalized ||
        plan.code === normalized ||
        plan.name.toLowerCase() === normalized,
    );

    if (!matchedPlan) {
      const fallbackPlan = this.getDefaultPlanDefinition(normalized);
      if (fallbackPlan) {
        this.cache.set(this.getPlanKey(fallbackPlan.id), fallbackPlan, this.staticTtlMs);
        this.cache.set(this.getPlanKey(fallbackPlan.code), fallbackPlan, this.staticTtlMs);
      }
      return fallbackPlan;
    }

    this.cache.set(this.getPlanKey(matchedPlan.id), matchedPlan, this.staticTtlMs);
    this.cache.set(this.getPlanKey(matchedPlan.code), matchedPlan, this.staticTtlMs);
    return matchedPlan;
  }

  async createPlan(payload: Partial<SubscriptionPlan>) {
    const plan = this.normalizePlan(payload);
    await db.collection(PLANS_COLLECTION).doc(plan.id).set(plan, { merge: true });
    this.invalidatePlanCache(plan.id);
    this.invalidatePlanCache(plan.code);
    return plan;
  }

  async updatePlan(id: string, payload: Partial<SubscriptionPlan>) {
    const existing = await this.getPlan(id);
    if (!existing) {
      return null;
    }

    const plan = this.normalizePlan({ ...payload, id }, existing);
    await db.collection(PLANS_COLLECTION).doc(plan.id).set(plan, { merge: true });
    this.invalidatePlanCache(plan.id);
    this.invalidatePlanCache(plan.code);
    return plan;
  }

  async deletePlan(id: string) {
    const existing = await this.getPlan(id);
    await db.collection(PLANS_COLLECTION).doc(id).delete();
    this.invalidatePlanCache(id);
    if (existing?.code) {
      this.invalidatePlanCache(existing.code);
    }
  }

  async resolveAccessContext(input: {
    userId?: string;
    shopId?: string;
    shop?: any;
  }): Promise<SubscriptionAccessContext> {
    const cacheKey = this.getAccessKey(input.userId, input.shopId);
    const cached = this.cache.get<SubscriptionAccessContext>(cacheKey);
    if (cached) {
      return cached;
    }

    await this.ensureDefaults();

    const profile = input.userId ? await userService.getByUid(input.userId) : null;
    const shopId = input.shopId || profile?.shopId;
    const shop = input.shop || (shopId ? await this.getShopById(shopId) : null);

    // 2. Determine base plan
    // PRIORITY: if shop is in trial, use selectedPlan (the plan they chose before payment)
    //           so they get trial access to the correct plan's features.
    // FALLBACK:  Shop subscriptionPlan → User planId → free
    let requestedPlanId: string;
    if (shop && (shop.paymentStatus === "trial" || shop.paymentStatus === "pending") && shop.selectedPlan) {
      requestedPlanId = String(shop.selectedPlan).toLowerCase();
    } else {
      requestedPlanId = String(
        shop?.subscriptionPlan || profile?.planId || "free",
      ).toLowerCase();
    }
    let plan = (await this.getPlan(requestedPlanId)) || (await this.getPlan("free"));
    if (!plan) {
      throw new NotFoundError("No subscription plan available");
    }

    if (requestedPlanId === "custom" && shop) {
      plan = {
        ...plan,
        id: "custom",
        code: "custom",
        name: "Custom Plan",
        monthlyPrice: shop.customPrice ?? 0,
        yearlyPrice: (shop.customPrice ?? 0) * 10,
        price: shop.customPrice ?? 0,
        currency: "INR",
        features: shop.customFeatures || [],
      };
    }

    let isRestricted = false;
    if (shop) {
      const payStatus = shop.paymentStatus;
      const subStatus = shop.subscriptionStatus;

      if (payStatus === "expired" || subStatus === "expired") {
        isRestricted = true;
      } else if ((payStatus === "trial" || payStatus === "pending") && shop.trialExpiresAt) {
        // Parse dates safely handling Firestore Timestamp if necessary
        const expiryDate = shop.trialExpiresAt instanceof Date 
          ? shop.trialExpiresAt 
          : (shop.trialExpiresAt as any).toDate ? (shop.trialExpiresAt as any).toDate() : new Date(shop.trialExpiresAt);
        if (expiryDate < new Date()) {
          isRestricted = true;
        }
      } else if (payStatus === "failed" || shop.status === "inactive" || shop.status === "suspended") {
        isRestricted = true;
      }
    }

    const resolvedLimits: Record<string, number | null | undefined> = isRestricted ? {} : {
      // Baseline: use hardcoded DEFAULT_PLANS limits so stale Firestore docs
      // that were seeded before limits were added still enforce restrictions.
      ...(this.getDefaultPlanDefinition(plan.code || plan.id)?.limits || {}),
      // Overlay with Firestore plan limits (may be more up-to-date)
      ...(plan.limits || {}),
      // Shop-level branchLimit always takes final priority (set at registration)
      ...(shop?.branchLimit !== undefined ? { branch_count: shop.branchLimit } : {})
    };

    if (!isRestricted && shop?.additionalLimits) {
      for (const [key, val] of Object.entries(shop.additionalLimits)) {
        if (typeof val === "number") {
          const baseLimit = resolvedLimits[key];
          if (baseLimit !== undefined && baseLimit !== null) {
            resolvedLimits[key] = baseLimit + val;
          } else if (baseLimit === undefined) {
            resolvedLimits[key] = val;
          }
        }
      }
    }

    const activeFeatures = await this.listFeatures(true);
    const activeFeatureKeys = new Set(
      activeFeatures.map((f: FeatureDefinition) => String(f.key).trim().toLowerCase())
    );

    const defaultPlanDef = this.getDefaultPlanDefinition(plan.code || plan.id);
    const resolvedFeatures = new Set([
      ...(defaultPlanDef?.features || []),
      ...(plan.features || []),
      ...(shop?.customFeatures || [])
    ]);

    if (resolvedLimits.branch_count && resolvedLimits.branch_count > 1) {
      resolvedFeatures.add('ent_multi_branch');
    }

    const activeResolvedFeatures = Array.from(resolvedFeatures).filter((key) =>
      activeFeatureKeys.has(String(key).trim().toLowerCase())
    );

    const access: SubscriptionAccessContext = {
      userId: input.userId,
      shopId,
      source: profile?.planId ? "user" : shop?.subscriptionPlan ? "shop" : "default",
      plan,
      features: activeResolvedFeatures,
      limits: resolvedLimits,
      isRestricted,
    };

    this.cache.set(cacheKey, access, this.ttlMs);
    return access;
  }

  async assertFeatureEnabled(
    featureKey: string,
    input: { userId?: string; shopId?: string },
  ) {
    const normalizedKey = String(featureKey).trim().toLowerCase();
    const feature = await this.getFeature(normalizedKey);

    if (!feature) {
      throw new ValidationError(`Unknown feature: ${normalizedKey}`);
    }

    const status = feature.status || (feature.active ? "active" : "inactive");

    if (status === "inactive" || status === "deprecated") {
      throw new ValidationError(`Feature is currently unavailable: ${normalizedKey}`);
    }

    if (status === "maintenance") {
      throw new ValidationError(`Feature "${normalizedKey}" is temporarily down for maintenance`);
    }

    const access = await this.resolveAccessContext(input);
    if (!access.features.includes(normalizedKey)) {
      throw new ForbiddenError(
        `Feature "${normalizedKey}" is not enabled for the ${access.plan.name} plan`,
      );
    }

    return access;
  }

  async getUsage(input: UsageScopeInput) {
    const subjectType = input.subjectType || (input.shopId ? "shop" : "user");
    const subjectId = input.subjectId || input.shopId || input.userId;
    if (!subjectId) {
      throw new ValidationError("Usage subject is required");
    }

    const periodKey = this.buildPeriodKey(input.period);
    const docId = this.buildUsageDocumentId({
      subjectType,
      subjectId,
      planId: input.planId,
      limitKey: input.limitKey,
      periodKey,
    });

    const cached = this.cache.get<UsageTracking>(this.getUsageKey(docId));
    if (cached) {
      return cached;
    }

    const { getSyncProvider } = require("../../application/repositories/providers/db-provider.config");
    let usage: UsageTracking | null = null;
    let fallbackToFirestore = true;

    if (getSyncProvider() === "supabase") {
      try {
        const { SupabaseManager } = require("../../infrastructure/supabase/supabase.client");
        const supabase = await SupabaseManager.getClient();
        
        const { data, error } = await supabase
          .from("usage_tracking")
          .select("data")
          .eq("id", docId)
          .single();

        if (error && error.code !== "PGRST116") {
          if (error.message.includes("relation \"public.usage_tracking\" does not exist")) {
            console.warn("[SubscriptionService] usage_tracking table does not exist in Supabase. Falling back to Firestore.");
            fallbackToFirestore = true;
          } else {
            throw new Error(error.message);
          }
        } else {
          fallbackToFirestore = false;
          if (data && data.data) {
            usage = data.data as UsageTracking;
          }
        }
      } catch (err) {
        console.warn("[SubscriptionService] Supabase usage fetch failed. Falling back to Firestore:", err);
        fallbackToFirestore = true;
      }
    }

    if (fallbackToFirestore) {
      const snapshot = await db.collection(USAGE_COLLECTION).doc(docId).get();
      if (snapshot.exists) {
        usage = snapshot.data() as UsageTracking;
      }
    }

    if (!usage) {
      const emptyUsage: UsageTracking = {
        id: docId,
        subjectType,
        subjectId,
        userId: input.userId,
        shopId: input.shopId,
        planId: input.planId,
        limitKey: input.limitKey,
        periodKey,
        used: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.cache.set(this.getUsageKey(docId), emptyUsage, this.ttlMs);
      return emptyUsage;
    }

    this.cache.set(this.getUsageKey(docId), usage, this.ttlMs);
    return usage;
  }

  async assertLimitAvailable(
    input: Omit<UsageScopeInput, "planId"> & { userId?: string; shopId?: string },
  ) {
    const access = await this.resolveAccessContext({
      userId: input.userId,
      shopId: input.shopId,
    });

    const configuredLimit = access.limits[input.limitKey];
    if (configuredLimit === undefined || configuredLimit === null || configuredLimit < 0) {
      return access;
    }

    let currentUsed = 0;
    if ((input.limitKey === "products_count" || input.limitKey === "branch_count") && input.shopId) {
      try {
        const { shopCountersService } = require("../../infrastructure/cache/shop-counters.service");
        let counters = await shopCountersService.getCounters(input.shopId);
        if (!counters) {
          counters = await shopCountersService.seedCountersForShop(input.shopId);
        }
        currentUsed = counters ? (counters[input.limitKey === "products_count" ? "products" : "branches"] || 0) : 0;
      } catch (err) {
        console.warn("[SubscriptionService] Failed to get counter, falling back to direct count query:", err);
        // Fallback: direct count query
        const col = input.limitKey === "products_count" ? "products" : "branches";
        const snap = await db.collection(col).where("shopId", "==", input.shopId).count().get();
        currentUsed = snap.data().count;
      }
    } else {
      const usage = await this.getUsage({
        ...input,
        planId: access.plan.id,
      });
      currentUsed = usage.used || 0;
    }

    const incrementBy = input.incrementBy ?? 1;
    if (currentUsed + incrementBy > configuredLimit) {
      throw new ForbiddenError(
        `Plan limit exceeded for "${input.limitKey}". Allowed: ${configuredLimit}, Used: ${currentUsed}`,
      );
    }

    return access;
  }

  async incrementUsage(
    input: Omit<UsageScopeInput, "planId"> & { userId?: string; shopId?: string },
  ) {
    const access = await this.resolveAccessContext({
      userId: input.userId,
      shopId: input.shopId,
    });

    const subjectType = input.subjectType || (input.shopId ? "shop" : "user");
    const subjectId = input.subjectId || input.shopId || input.userId;
    if (!subjectId) {
      throw new ValidationError("Usage subject is required");
    }

    const periodKey = this.buildPeriodKey(input.period);
    const docId = this.buildUsageDocumentId({
      subjectType,
      subjectId,
      planId: access.plan.id,
      limitKey: input.limitKey,
      periodKey,
    });

    const currentUsage = await this.getUsage({
      ...input,
      planId: access.plan.id,
      subjectId,
      subjectType,
    });

    const updatedUsage: UsageTracking = {
      ...currentUsage,
      id: docId,
      subjectType,
      subjectId,
      userId: input.userId,
      shopId: input.shopId,
      planId: access.plan.id,
      limitKey: input.limitKey,
      periodKey,
      used: (currentUsage.used || 0) + (input.incrementBy ?? 1),
      updatedAt: new Date(),
      createdAt: currentUsage.createdAt || new Date(),
    };

    const { getSyncProvider } = require("../../application/repositories/providers/db-provider.config");
    let writtenToSupabase = false;

    if (getSyncProvider() === "supabase") {
      try {
        const { SupabaseManager } = require("../../infrastructure/supabase/supabase.client");
        const supabase = await SupabaseManager.getClient();
        
        const { error } = await supabase
          .from("usage_tracking")
          .upsert({
            id: docId,
            shopId: input.shopId || null,
            userId: input.userId || null,
            planId: access.plan.id,
            limitKey: input.limitKey,
            periodKey,
            used: updatedUsage.used,
            data: updatedUsage,
            updatedAt: new Date()
          });

        if (error) {
          if (error.message.includes("relation \"public.usage_tracking\" does not exist")) {
            console.warn("[SubscriptionService] usage_tracking table does not exist in Supabase. Writing to Firestore.");
          } else {
            throw new Error(error.message);
          }
        } else {
          writtenToSupabase = true;
        }
      } catch (err) {
        console.warn("[SubscriptionService] Failed to write usage to Supabase, falling back to Firestore:", err);
      }
    }

    if (!writtenToSupabase) {
      await db.collection(USAGE_COLLECTION).doc(docId).set(updatedUsage, { merge: true });
    }
    this.cache.set(this.getUsageKey(docId), updatedUsage, this.ttlMs);
    return updatedUsage;
  }

  async assignPlanToUser(input: {
    userId: string;
    planId: string;
    syncShopPlan?: boolean;
  }) {
    const plan = await this.getPlan(input.planId);
    if (!plan) {
      throw new NotFoundError("Plan not found");
    }

    const user = await userService.getByUid(input.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await userService.updateUser(input.userId, {
      planId: plan.id,
      metadata: {
        ...(user.metadata || {}),
        planAssignedAt: new Date(),
      },
    });

    if ((input.syncShopPlan ?? true) && user.shopId) {
      await db.collection(SHOPS_COLLECTION).doc(user.shopId).set(
        {
          subscriptionPlan: plan.code || plan.id,
          updatedAt: new Date(),
        },
        { merge: true },
      );
      this.invalidateAccessCache(undefined, user.shopId);
    }

    this.invalidateAccessCache(input.userId, user.shopId);
    return {
      userId: input.userId,
      planId: plan.id,
      shopId: user.shopId,
    };
  }

  // ─── Add-on Queries ───────────────────────────────────────────────────────────

  /**
   * Fetch all active (non-cancelled, non-deleted) subscription items for a shop.
   */
  async getActiveAddons(shopId: string) {
    const snap = await db
      .collection("subscription_items")
      .where("shopId", "==", shopId)
      .where("isDeleted", "==", false)
      .get();

    const rawItems = snap.docs
      .map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as any))
      .filter((item: any) => item.status !== "cancelled");

    // Deduplicate by itemKey (keep active or first item)
    const itemMap = new Map<string, any>();
    for (const item of rawItems) {
      const existing = itemMap.get(item.itemKey);
      if (!existing) {
        itemMap.set(item.itemKey, item);
      } else if (item.status === "active" && existing.status !== "active") {
        itemMap.set(item.itemKey, item);
      }
    }

    return Array.from(itemMap.values());
  }

  /**
   * Compute the upcoming invoice for a shop:
   * base plan price + all active recurring add-on prices.
   */
  async getUpcomingInvoice(shopId: string) {
    const shop = await this.getShopById(shopId);
    if (!shop) throw new NotFoundError("Shop not found");

    const access = await this.resolveAccessContext({ shopId });

    // Base plan price
    const basePlanPrice = access.plan.monthlyPrice ?? 0;
    const basePlanName = access.plan.name;

    // Active recurring add-ons
    const activeAddons = (await this.getActiveAddons(shopId)).filter(
      (item: any) => item.status === "active" && item.recurringEnabled,
    );

    const addonLines = activeAddons.map((item: any) => ({
      name: item.name,
      itemKey: item.itemKey,
      type: item.type,
      quantity: item.quantity || 1,
      unitPrice: item.price,
      total: item.price * (item.quantity || 1),
    }));

    const addonsTotal = addonLines.reduce((sum: number, l: any) => sum + l.total, 0);
    const subtotal = basePlanPrice + addonsTotal;

    const gstInfo = await platformSettingsService.getGstCollectionInfo().catch(() => ({ enabled: false, gstRate: 0, gstNumber: "", legalBusinessName: "" }));
    const gstRate = gstInfo.enabled ? (gstInfo.gstRate || 18) : 0;
    const gst = gstInfo.enabled ? Math.round(subtotal * (gstRate / 100) * 100) / 100 : 0;
    const total = Math.round((subtotal + gst) * 100) / 100;

    // Next billing date from shop record (with fallback)
    let nextBillingDate: Date | null = null;
    const rawNextBilling = (shop as any).nextBillingDate || (shop as any).trialExpiresAt || (shop as any).renewDate;
    if (rawNextBilling) {
      const parsed = typeof rawNextBilling.toDate === "function" ? rawNextBilling.toDate() : new Date(rawNextBilling);
      if (!isNaN(parsed.getTime())) {
        nextBillingDate = parsed;
      }
    }

    if (!nextBillingDate) {
      const createdRaw = (shop as any).createdAt;
      const created = createdRaw ? (typeof createdRaw.toDate === "function" ? createdRaw.toDate() : new Date(createdRaw)) : new Date();
      const baseDate = !isNaN(created.getTime()) ? created : new Date();
      const fallback = new Date(baseDate);
      fallback.setMonth(fallback.getMonth() + 1);
      const now = new Date();
      while (fallback < now) {
        fallback.setMonth(fallback.getMonth() + 1);
      }
      nextBillingDate = fallback;
    }

    return {
      shopId,
      nextBillingDate,
      basePlan: { name: basePlanName, price: basePlanPrice },
      addons: addonLines,
      subtotal,
      gst,
      gstRate,
      total,
      currency: access.plan.currency || "INR",
    };
  }
}

export const subscriptionService = new SubscriptionService();
