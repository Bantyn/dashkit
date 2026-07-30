import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { Shop } from "./shop.model";
import { subscriptionService } from "../subscription/subscription.service";
import { LIMIT_KEYS } from "../subscription/subscription.constants";
import { tenantCacheService } from "../../infrastructure/cache/tenant-cache.service";
import { shopPublicCacheService } from "./shop-public-cache.service";

const COLLECTION = "shops";

export class ShopService {
  private readonly cache = new CacheService();
  private readonly shopCacheTtlMs = 15 * 60 * 1000; // 15 minutes

  private async getPlatformManagedShopIds() {
    const cacheKey = "shop:platform-managed-ids";
    const cached = this.cache.get<string[]>(cacheKey);
    if (cached) {
      return new Set(cached);
    }

    const mappings = await db
      .collection("user_roles")
      .where("roleId", "==", "admin")
      .get();
    const shopIds = Array.from(
      new Set(
        mappings.docs
          .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => String(doc.data()?.shopId || "").trim())
          .filter(Boolean),
      ),
    );

    this.cache.set(cacheKey, shopIds, this.shopCacheTtlMs);
    return new Set(shopIds);
  }

  private isPlatformManagedShop(shop: any) {
    return (
      shop?.isPlatformManaged === true ||
      shop?.excludeFromAdminMetrics === true ||
      shop?.systemType === "platform_admin" ||
      shop?.metadata?.systemType === "platform_admin"
    );
  }

  private normalizeSubdomain(subdomain?: string) {
    return subdomain?.trim().toLowerCase();
  }

  private getShopKey(id: string) {
    return `shop:${id}`;
  }

  private getSubdomainKey(subdomain: string) {
    return `shop-subdomain:${subdomain.toLowerCase()}`;
  }

  private invalidateShopCache(id?: string, subdomain?: string, customDomain?: string) {
    if (id) {
      this.cache.delete(this.getShopKey(id));
      shopPublicCacheService.clear(id);
    }

    if (subdomain) {
      this.cache.delete(this.getSubdomainKey(subdomain));
      tenantCacheService.invalidateShopSlug(subdomain);
    }
    
    if (customDomain) {
      tenantCacheService.invalidateShopDomain(customDomain);
    }
  }

  async checkSubdomainAvailability(subdomain: string) {
    const normalizedSubdomain = this.normalizeSubdomain(subdomain) || "";
    const restricted = ["www", "app", "api", "admin", "clothify", "localhost"];
    if (restricted.includes(normalizedSubdomain)) {
      return { available: false, reason: "restricted" as const };
    }

    const snapshot = await db
      .collection(COLLECTION)
      .where("subdomain", "==", normalizedSubdomain)
      .get();
    return {
      available: snapshot.empty,
      reason: snapshot.empty ? null : ("taken" as const),
    };
  }

  async createShop(payload: any) {
    const shopId = payload.id || `shop_${Date.now()}`;

    // Map frontend 'slug' field to backend 'subdomain' field
    const rawSubdomain = payload.subdomain || payload.slug;
    const subdomain = this.normalizeSubdomain(rawSubdomain);

    // Remove 'slug' from payload to avoid storing it as a separate field
    const { slug, ...cleanPayload } = payload;

    if (subdomain) {
      const snapshot = await db.collection(COLLECTION).where("subdomain", "==", subdomain).get();
      if (!snapshot.empty) {
        return { conflict: true as const };
      }
    }

    const newShop: Shop = {
      ...cleanPayload,
      id: shopId,
      subdomain: subdomain || "",
      slug: subdomain || "",
      // Auto-enable website when subdomain is set
      websiteEnabled: cleanPayload.websiteEnabled || !!subdomain,
      pages: cleanPayload.pages || {
        home: true,
        products: true,
        offers: true,
        contact: true,
      },
      theme: cleanPayload.theme || {
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        fontFamily: "Inter",
      },
      paymentModes: cleanPayload.paymentModes || {
        cod: true,
        online: false,
        bankTransfer: false,
      },
      orderAcceptance: cleanPayload.orderAcceptance || "auto",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc(shopId).set(newShop);
    this.cache.set(this.getShopKey(shopId), newShop, this.shopCacheTtlMs);
    if (subdomain) {
      this.cache.set(this.getSubdomainKey(subdomain), newShop, this.shopCacheTtlMs);
    }

    // Trigger Real-time Admin Notification
    try {
      const { createAdminNotification } = require("../admin-notification/admin-notification.controller");
      createAdminNotification({
        title: `New Shop Registered: ${newShop.shopName || shopId}`,
        message: `A new shop '${newShop.shopName || shopId}' has been registered with subdomain '${subdomain || "default"}'.`,
        category: "shops",
        actionLink: `/shops`,
        metadata: { shopId, subdomain: newShop.subdomain },
      }).catch(() => {});
    } catch (e) {}
    return { conflict: false as const, shop: newShop };
  }

  async listShops(filters?: { status?: string; search?: string }) {
    const cacheKey = "admin:all-shops:list";
    let allShops = this.cache.get<any[]>(cacheKey);
    
    if (!allShops) {
      const snapshot = await db.collection(COLLECTION).get();
      allShops = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
      this.cache.set(cacheKey, allShops, this.shopCacheTtlMs);
    }

    const platformManagedShopIds = await this.getPlatformManagedShopIds();
    const statusFilter = filters?.status?.trim().toLowerCase();
    const searchFilter = filters?.search?.trim().toLowerCase();

    return (allShops ?? [])
      .filter(
        (shop: any) =>
          !this.isPlatformManagedShop(shop) &&
          !platformManagedShopIds.has(String(shop.id || "")),
      )
      .filter((shop: any) => {
        const matchesStatus = statusFilter
          ? String(shop.status || "").toLowerCase() === statusFilter
          : true;

        const matchesSearch = searchFilter
          ? [shop.shopName, shop.displayName, shop.email, shop.phone, shop.subdomain]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(searchFilter))
          : true;

        return matchesStatus && matchesSearch;
      })
      .sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }

  async getShop(id: string) {
    const cachedShop = this.cache.get<Shop>(this.getShopKey(id));
    if (cachedShop) return cachedShop;

    const docSnap = await db.collection(COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;

    const shopData = docSnap.data();
    const fullShopData = { id: docSnap.id, ...shopData };
    
    // Resolve dynamic subscription context
    const subContext = await subscriptionService.resolveAccessContext({ shopId: id, shop: fullShopData });
    
    const rawNextBilling = (shopData as any)?.nextBillingDate || (shopData as any)?.trialExpiresAt || (shopData as any)?.renewDate;
    let nextBillingDate: Date | null = null;
    if (rawNextBilling) {
      const parsed = typeof rawNextBilling?.toDate === "function" ? rawNextBilling.toDate() : new Date(rawNextBilling);
      if (!isNaN(parsed.getTime())) nextBillingDate = parsed;
    }
    if (!nextBillingDate) {
      const createdRaw = (shopData as any)?.createdAt;
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

    const shop = {
      id: docSnap.id,
      ...shopData,
      slug: shopData?.slug || shopData?.subdomain || "",
      subdomain: shopData?.subdomain || shopData?.slug || "",
      subscriptionPlan: subContext.plan.code || subContext.plan.id || (shopData as any)?.subscriptionPlan || 'free',
      nextBillingDate,
      features: subContext.features || []
    };

    this.cache.set(this.getShopKey(id), shop, this.shopCacheTtlMs);
    if ((shop as any).subdomain) {
      this.cache.set(
        this.getSubdomainKey(String((shop as any).subdomain)),
        shop,
        this.shopCacheTtlMs,
      );
    }

    return shop;
  }

  async updateShop(id: string, payload: any) {
    const existingShop = await this.getShop(id);

    // Map frontend 'slug' field to backend 'subdomain' field
    const rawSubdomain = payload.subdomain || payload.slug;
    const subdomain = this.normalizeSubdomain(rawSubdomain);

    // Remove 'slug' from payload to avoid storing it as a separate field in Firestore
    const { slug, ...cleanPayload } = payload;

    if (subdomain) {
      const snapshot = await db.collection(COLLECTION).where("subdomain", "==", subdomain).get();
      if (!snapshot.empty) {
        const existing = snapshot.docs[0];
        if (existing.id !== id) {
          return { conflict: true as const };
        }
      }
    }

function unflattenObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (key.includes(".")) {
      const keys = key.split(".");
      let current = result;
      for (let i = 0; i < keys.length; i++) {
        const subKey = keys[i];
        if (i === keys.length - 1) {
          current[subKey] = obj[key];
        } else {
          current[subKey] = current[subKey] || {};
          current = current[subKey];
        }
      }
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

    const unflattenedPayload = unflattenObject(cleanPayload);

    await db.collection(COLLECTION).doc(id).set(
      {
        ...unflattenedPayload,
        ...(subdomain ? { subdomain, slug: subdomain, websiteEnabled: true } : {}),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Handle Subscription Plan Switch if specified
    if (payload.subscriptionPlan && payload.subscriptionPlan !== existingShop?.subscriptionPlan) {
      try {
        // Find the owner of this shop using the ownerId field
        const ownerId = (existingShop as any).ownerId;

        if (ownerId) {
          await subscriptionService.assignPlanToUser({
            userId: ownerId,
            planId: payload.subscriptionPlan,
            syncShopPlan: false // Don't loop back to shop update
          });
        }
      } catch (error) {
        console.error("Error syncing subscription plan to owner:", error);
        // We don't fail the shop update just because user sync failed, 
        // but we should log it.
      }
    }

    // Invalidate caches to reflect changes immediately
    const targetSubdomain = subdomain || (existingShop as any)?.subdomain || (existingShop as any)?.slug;
    const targetCustomDomain = payload.customDomain || (existingShop as any)?.customDomain;
    this.invalidateShopCache(id, targetSubdomain, targetCustomDomain);
    if (targetSubdomain) {
      this.cache.delete(this.getSubdomainKey(targetSubdomain));
      tenantCacheService.invalidateShopSlug(targetSubdomain);
    }
    
    // Crucial: Invalidate subscription access cache so resolveAccessContext fetches fresh data
    const ownerId = (existingShop as any).ownerId;
    (subscriptionService as any).invalidateAccessCache(ownerId, id);

    return { conflict: false as const };
  }

  async deleteShop(id: string) {
    const existingShop = await this.getShop(id);
    await db.collection(COLLECTION).doc(id).delete();
    this.invalidateShopCache(id, (existingShop as any)?.subdomain, (existingShop as any)?.customDomain);
  }

  async generatePublicApiKey(id: string) {
    const existingShop = await this.getShop(id);
    if (!existingShop) throw new Error("Shop not found");
    
    const { randomBytes } = await import('crypto');
    const newApiKey = `pk_test_${randomBytes(16).toString('hex')}`;
    
    await db.collection(COLLECTION).doc(id).update({
      publicApiKey: newApiKey,
      updatedAt: new Date(),
    });
    
    this.invalidateShopCache(id, (existingShop as any)?.subdomain, (existingShop as any)?.customDomain);
    return newApiKey;
  }

  // --- Shop Requests ---

  async createDeactivationRequest(shopId: string, shopName: string, reason: string, userId: string) {
    const request = {
      shopId,
      shopName,
      type: "deactivation",
      reason,
      status: "pending",
      requestedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection("shop_requests").add(request);
    return { id: docRef.id, ...request };
  }

  async createReactivationRequest(shopId: string, shopName: string, userId: string) {
    const request = {
      shopId,
      shopName,
      type: "reactivation",
      reason: "Requested reactivation via login",
      status: "pending",
      requestedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection("shop_requests").add(request);
    return { id: docRef.id, ...request };
  }

  async getPendingRequests() {
    const snapshot = await db.collection("shop_requests")
      .where("status", "==", "pending")
      .get();
      
    const requests = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory to avoid requiring a composite index in Firestore
    return requests.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  async processRequest(requestId: string, action: 'approve' | 'reject') {
    const requestRef = db.collection("shop_requests").doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new Error("Request not found");
    }
    
    const requestData = requestDoc.data();
    if (requestData?.status !== "pending") {
      throw new Error("Request is not in pending state");
    }
    
    await requestRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      updatedAt: new Date()
    });
    
    // If approved and it's a deactivation request, deactivate the shop
    if (action === 'approve') {
      const shopId = requestData?.shopId;
      if (requestData?.type === "deactivation") {
        await this.updateShop(shopId, { status: "inactive" });
      } else if (requestData?.type === "reactivation") {
        await this.updateShop(shopId, { status: "active" });
        // TODO: Send email
        const shop = await this.getShop(shopId);
        if (shop && (shop as any).email) {
          try {
            const { sendShopReactivationEmail } = await import('../../shared/utils/email.util');
            await sendShopReactivationEmail((shop as any).email, (shop as any).shopName);
          } catch (e) {
            console.error("Failed to send reactivation email:", e);
          }
        }
      }
    }
    
    return { success: true };
  }

  async getShopFullDetails(shopId: string) {
    const toDate = (value: any): Date | null => {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value?.toDate === "function") return value.toDate();
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const shop = await this.getShop(shopId);
    if (!shop) return null;

    const { shopCountersService } = require("../../infrastructure/cache/shop-counters.service");
    const counters = await shopCountersService.getCounters(shopId) || await shopCountersService.seedCountersForShop(shopId);

    // 1. Fetch all details and snapshots in parallel to reduce sequential query latency
    const [
      branchesSnap,
      invoicesSnap,
      staffSnap,
      usersSnap,
      activitySnap,
      subContext,
      apiUsageSnap,
    ] = await Promise.all([
      db.collection("branches").where("shopId", "==", shopId).get(),
      db.collection("invoices").where("shopId", "==", shopId).select("type", "total", "paymentStatus", "status", "createdAt").get(),
      db.collection("staff").where("shopId", "==", shopId).get(),
      db.collection("users").where("shopId", "==", shopId).get(),
      db.collection("audit_logs").where("shopId", "==", shopId).limit(20).get().catch(() => null),
      subscriptionService.resolveAccessContext({ shopId, shop }),
      db.collection("api_usage_aggregation").doc(shopId).get(),
    ]);

    const branches = branchesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Unnamed Branch",
        address: data.address || "",
        manager: data.manager || "N/A",
        status: data.status || "Active",
        createdAt: data.createdAt ? toDate(data.createdAt) : null
      };
    });

    const invoices = invoicesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || "Invoice",
        amount: data.total || 0,
        status: data.paymentStatus || data.status || "Pending",
        date: data.createdAt ? toDate(data.createdAt) : null
      };
    });

    const staff = staffSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.fullName || "Unknown",
        email: data.email || "",
        role: data.role || "Staff",
        status: data.status || "Active"
      };
    });

    const users = usersSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.displayName || "Unknown",
        email: data.email || "",
        role: data.roleId || (data.uid === (shop as any).ownerId ? "Owner" : "User"),
        status: data.isActive !== false ? "Active" : "Inactive"
      };
    });

    let activity: any[] = [];
    if (activitySnap) {
      activity = activitySnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          date: data.timestamp ? toDate(data.timestamp) : toDate(data.createdAt),
          event: data.action || "Activity",
          desc: data.description || `${data.action || 'Activity'} recorded.`
        };
      }).sort((a: any, b: any) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    }

    const ordersCount = counters ? (counters.orders || 0) : 0;
    const productsCount = counters ? (counters.products || 0) : 0;
    const customersCount = counters ? (counters.customers || 0) : 0;
    const totalRevenue = invoices.reduce((sum: number, inv: { status: string; amount: number }) => sum + (inv.status === "paid" || inv.status === "Completed" ? inv.amount : 0), 0);

    const usedBytes = (shop as any).currentStorageBytes || 0;
    const limitBytes = (shop as any).includedStorageBytes || ((subContext.limits?.storage || 100) * 1024 * 1024);
    const percentage = limitBytes > 0 ? Number(((usedBytes / limitBytes) * 100).toFixed(2)) : 0;

    const storageUsage: any = {
      shopId,
      usedBytes,
      limitBytes,
      percentage,
      lastCalculated: (shop as any).lastStorageCalculation ? toDate((shop as any).lastStorageCalculation) : new Date()
    };

    const apiUsage: any = (apiUsageSnap.exists ? apiUsageSnap.data() : null) || {
      shopId,
      today: { count: 0, success: 0, failed: 0, totalResponseTime: 0 },
      thisWeek: { count: 0, success: 0, failed: 0, totalResponseTime: 0 },
      thisMonth: { count: 0, success: 0, failed: 0, totalResponseTime: 0 },
      total: { count: 0, success: 0, failed: 0, totalResponseTime: 0 },
      lastUpdated: new Date()
    };

    // 2. Fetch all LIMIT_KEYS usage docs in parallel to avoid inside-loop latency
    const limitKeysList = Object.values(LIMIT_KEYS);
    const usageDocs = await Promise.all(
      limitKeysList.map(key => {
        const isMonthly = key.endsWith("_month");
        const period = isMonthly ? "monthly" : "lifetime";
        return subscriptionService.getUsage({
          shopId,
          planId: subContext.plan.id,
          limitKey: key,
          period,
        });
      })
    );

    const fallbackSyncPromises: Promise<any>[] = [];
    const usedMap = new Map<string, number>();

    for (let i = 0; i < limitKeysList.length; i++) {
      const key = limitKeysList[i];
      const usageDoc = usageDocs[i];
      let used = usageDoc.used || 0;

      if (used === 0) {
        const syncPromise = (async () => {
          let dbUsed = 0;
          try {
            if (key === LIMIT_KEYS.PRODUCTS_COUNT) {
              const snap = await db.collection("products").where("shopId", "==", shopId).count().get();
              dbUsed = snap.data().count;
            } else if (key === LIMIT_KEYS.STAFF_COUNT) {
              const snap = await db.collection("staff").where("shopId", "==", shopId).count().get();
              dbUsed = snap.data().count;
            } else if (key === LIMIT_KEYS.BRANCH_COUNT) {
              const snap = await db.collection("branches").where("shopId", "==", shopId).count().get();
              dbUsed = snap.data().count;
            } else if (key === LIMIT_KEYS.INVOICES_PER_MONTH) {
              const startOfMonth = new Date();
              startOfMonth.setUTCDate(1);
              startOfMonth.setUTCHours(0, 0, 0, 0);
              const snap = await db.collection("invoices")
                .where("shopId", "==", shopId)
                .where("createdAt", ">=", startOfMonth)
                .count().get();
              dbUsed = snap.data().count;
            } else if (key === LIMIT_KEYS.ORDERS_PER_MONTH) {
              const startOfMonth = new Date();
              startOfMonth.setUTCDate(1);
              startOfMonth.setUTCHours(0, 0, 0, 0);
              const snap = await db.collection("orders")
                .where("shopId", "==", shopId)
                .where("createdAt", ">=", startOfMonth)
                .count().get();
              dbUsed = snap.data().count;
            }

            if (dbUsed > 0) {
              const isMonthly = key.endsWith("_month");
              const period = isMonthly ? "monthly" : "lifetime";
              await subscriptionService.incrementUsage({
                shopId,
                limitKey: key,
                incrementBy: dbUsed,
                period,
              });
              usedMap.set(key, dbUsed);
            } else {
              usedMap.set(key, 0);
            }
          } catch (err) {
            console.error(`Failed to sync fallback count for ${key}:`, err);
            usedMap.set(key, 0);
          }
        })();
        fallbackSyncPromises.push(syncPromise);
      } else {
        usedMap.set(key, used);
      }
    }

    if (fallbackSyncPromises.length > 0) {
      await Promise.all(fallbackSyncPromises);
    }

    const planUsage: Record<string, any> = {};
    for (const key of limitKeysList) {
      const used = usedMap.get(key) || 0;
      const limit = subContext.limits[key];
      const allowed = limit === undefined || limit === null || limit < 0 ? null : limit;
      const remaining = allowed === null ? null : Math.max(0, allowed - used);
      const percentage = allowed === null ? 0 : Number(((used / allowed) * 100).toFixed(2));

      let status = "Normal";
      if (allowed !== null) {
        if (percentage >= 100) status = "Exceeded";
        else if (percentage >= 80) status = "Warning";
      }

      planUsage[key] = {
        key,
        used,
        allowed,
        remaining,
        percentage,
        status,
        lastUpdated: new Date()
      };
    }

    return {
      shop,
      limits: subContext.limits,
      branches,
      invoices,
      staff,
      users,
      activity,
      usage: {
        storage: storageUsage,
        api: apiUsage,
        plan: planUsage
      },
      metrics: {
        revenue: totalRevenue,
        orders: ordersCount,
        products: productsCount,
        customers: customersCount,
        branches: branches.length,
        storage: Math.round(storageUsage.usedBytes / (1024 * 1024) * 100) / 100, // MB
        apiUsage: apiUsage.thisMonth?.count || 0,
        lastLogin: new Date()
      }
    };
  }
}

export const shopService = new ShopService();
