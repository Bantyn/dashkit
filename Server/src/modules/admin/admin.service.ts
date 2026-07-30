import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { subscriptionService } from "../subscription/subscription.service";
import { SubscriptionPlan } from "../subscription/plan.model";
import { adminStatsService } from "./admin-stats.service";

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

interface ShopRevenueRow {
  id: string;
  shopName: string;
  status: string;
  subscriptionPlan: string;
  planName: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  createdAt: Date | null;
}

interface PlanMixSummary {
  shops: number;
  monthlyRevenue: number;
}

function groupDailyCounts(docs: any[], dateField: string, dates: Date[]): number[] {
  const counts = new Array(dates.length).fill(0);
  docs.forEach(doc => {
    const data = doc.data ? doc.data() : doc;
    const createdAt = toDate(data[dateField]);
    if (!createdAt) return;
    
    // Find which day interval it falls into
    for (let i = 0; i < dates.length; i++) {
      const dayStart = dates[i];
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      if (createdAt >= dayStart && createdAt < dayEnd) {
        counts[i]++;
        break;
      }
    }
  });
  return counts;
}

function groupCumulativeCounts(docs: any[], dateField: string, dates: Date[], baseCount: number): number[] {
  const daily = groupDailyCounts(docs, dateField, dates);
  const cumulative: number[] = [];
  let current = baseCount;
  for (let i = 0; i < dates.length; i++) {
    current += daily[i];
    cumulative.push(current);
  }
  return cumulative;
}

async function getCollectionGroupRecent(collectionName: string, startDate: Date): Promise<any[]> {
  try {
    const snapshot = await db.collectionGroup(collectionName).where("createdAt", ">=", startDate).get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
  } catch (error: any) {
    if (error?.message?.includes("FAILED_PRECONDITION") || error?.code === 9) {
      console.warn(`[AdminService] Collection group query for ${collectionName} failed due to missing index. Falling back to in-memory filter.`);
      const snapshot = await db.collectionGroup(collectionName).get();
      return snapshot.docs
        .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data())
        .filter((data: any) => {
          const createdAt = toDate(data.createdAt);
          return createdAt && createdAt >= startDate;
        });
    }
    throw error;
  }
}

export class AdminService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 30 * 1000;

  private async getPlatformManagedShopIds() {
    const cacheKey = "admin:platform-managed-shop-ids";
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

    this.cache.set(cacheKey, shopIds, this.ttlMs);
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

  private async safeCount(
    label: string,
    resolver: () => Promise<number>,
  ): Promise<number> {
    try {
      return await resolver();
    } catch (error: any) {
      console.warn(`[AdminService] Count failed for ${label}:`, error?.message || error);
      return 0;
    }
  }

  private async getScopedCollectionCount(collectionName: string, useCollectionGroup = false) {
    return this.safeCount(collectionName, async () => {
      const snapshot = useCollectionGroup
        ? await db.collectionGroup(collectionName).count().get()
        : await db.collection(collectionName).count().get();
      return snapshot.data().count;
    });
  }

  private async getCurrentMonthCount(
    collectionName: string,
    field: string,
    useCollectionGroup = false,
  ) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.safeCount(`${collectionName}-month`, async () => {
      const snapshot = useCollectionGroup
        ? await db.collectionGroup(collectionName).where(field, ">=", startOfMonth).count().get()
        : await db.collection(collectionName).where(field, ">=", startOfMonth).count().get();
      return snapshot.data().count;
    });
  }

  private async getCollectionCount(collectionName: string) {
    try {
      console.log(`[AdminService DEBUG] Trying full get for: ${collectionName}`);
      let snapshot;
      
      // Use collectionGroup for known subcollections to gather data across all shops
      const subCollections = ['products', 'orders', 'invoices'];
      
      if (subCollections.includes(collectionName)) {
        snapshot = await db.collectionGroup(collectionName).count().get();
      } else {
        snapshot = await db.collection(collectionName).count().get();
      }
      
      const count = snapshot.data().count;
      console.log(`[AdminService DEBUG] Done: ${collectionName} has ${count} docs`);
      return count;
    } catch (error: any) {
      console.error(`[AdminService DEBUG] ERROR for ${collectionName}:`, error.message);
      return 0;
    }
  }

  async getOverview() {
    const cacheKey = "admin-overview";
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const stats = await adminStatsService.getAggregatedStats() as any;
      if (!stats || !stats.counts) throw new Error("Stats data unavailable");
      const { counts, raw, dates } = stats;

      const normalizedPlans = new Map<string, SubscriptionPlan>(
        ((raw.plans as SubscriptionPlan[] | undefined) || []).flatMap((plan) => {
          const entries: Array<[string, SubscriptionPlan]> = [];
          if (plan.id) entries.push([String(plan.id).toLowerCase(), plan]);
          if (plan.code) entries.push([String(plan.code).toLowerCase(), plan]);
          return entries;
        }),
      );

      const revenueRows: ShopRevenueRow[] = raw.eligibleShops
        .map((shop: any): ShopRevenueRow => {
          const planCode = String(shop.subscriptionPlan || "free").toLowerCase();
          const payStatus = String(shop.paymentStatus || "").toLowerCase();
          const subStatus = String(shop.subscriptionStatus || "").toLowerCase();
          const plan = normalizedPlans.get(planCode);

          // Financial Accounting Rule: Free Trial, pending payment, expired trial, free plan, or unpaid status = ₹0 revenue
          const isPaidSubscriber =
            planCode !== "free" &&
            planCode !== "trial" &&
            payStatus !== "trial" &&
            payStatus !== "pending" &&
            payStatus !== "expired" &&
            payStatus !== "past_due" &&
            payStatus !== "failed" &&
            (payStatus === "active" || payStatus === "paid" || subStatus === "active" || subStatus === "paid");

          const monthlyRevenue = isPaidSubscriber ? Number(plan?.monthlyPrice ?? plan?.price ?? 0) : 0;
          const yearlyRevenue = isPaidSubscriber ? Number(plan?.yearlyPrice ?? monthlyRevenue * 12) : 0;

          return {
            id: shop.id,
            shopName: shop.shopName || shop.displayName || "Untitled Shop",
            status: String(shop.status || "active").toLowerCase(),
            subscriptionPlan: plan?.code || plan?.id || planCode,
            planName: plan?.name || planCode,
            monthlyRevenue,
            yearlyRevenue,
            createdAt: toDate(shop.createdAt),
          };
        })
        .sort(
          (a: ShopRevenueRow, b: ShopRevenueRow) =>
            b.monthlyRevenue - a.monthlyRevenue || a.shopName.localeCompare(b.shopName),
        );

      const freePlanShops = revenueRows.filter((shop: ShopRevenueRow) => shop.monthlyRevenue === 0).length;
      const paidShops = revenueRows.filter((shop: ShopRevenueRow) => shop.monthlyRevenue > 0).length;
      const activeRevenueRows = revenueRows.filter((shop: ShopRevenueRow) => shop.status === "active");
      const monthlyRecurringRevenue = activeRevenueRows.reduce(
        (sum: number, shop: ShopRevenueRow) => sum + Number(shop.monthlyRevenue || 0),
        0,
      );
      const annualRecurringRevenue = activeRevenueRows.reduce(
        (sum: number, shop: ShopRevenueRow) => sum + Number(shop.yearlyRevenue || 0),
        0,
      );

      const planMix = revenueRows.reduce(
        (summary: Record<string, PlanMixSummary>, shop: ShopRevenueRow) => {
          const key = shop.subscriptionPlan || "free";
          if (!summary[key]) {
            summary[key] = { shops: 0, monthlyRevenue: 0 };
          }
          summary[key].shops += 1;
          summary[key].monthlyRevenue += Number(shop.monthlyRevenue || 0);
          return summary;
        },
        {} as Record<string, PlanMixSummary>,
      );

      const overview = {
        cards: {
          totalUsers: counts.users,
          totalProducts: counts.products,
          totalOrders: counts.orders,
          totalInvoices: counts.invoices,
          totalShops: counts.shops,
          activeShops: counts.activeShops,
          suspendedShops: counts.suspendedShops,
          paidShops,
          freePlanShops,
          monthlyRecurringRevenue,
        },
        recentShops: raw.recentShops
          .filter((shop: any) => !this.isPlatformManagedShop(shop))
          .map((data: any) => ({
            id: data.id,
            shopName: data.shopName || data.displayName || "Untitled Shop",
            ownerId: data.ownerId,
            subscriptionPlan: data.subscriptionPlan || "free",
            status: data.status || "active",
            createdAt: toDate(data.createdAt),
          })),
        backendHealth: {
          collectionFootprint: {
            shops: counts.shops,
            users: counts.users,
            products: counts.products,
            orders: counts.orders,
            invoices: counts.invoices,
            staff: counts.staff,
            branches: counts.branches,
            customers: counts.customers,
            inventory: counts.inventory,
          },
          monthlyActivity: {
            newShops: counts.newShopsThisMonth,
            newUsers: counts.newUsersThisMonth,
            orders: counts.ordersThisMonth,
            invoices: counts.invoicesThisMonth,
          },
          cachePolicy: {
            adminOverviewTtlSeconds: this.ttlMs / 1000,
            analyticsDashboardTtlSeconds: 120,
            analyticsCollectionsTtlSeconds: 30,
            shopCacheTtlSeconds: 60,
            notificationCacheTtlSeconds: 15,
          },
        },
        subscriptionInsights: {
          monthlyRecurringRevenue,
          annualRecurringRevenue,
          paidShops,
          freePlanShops,
          planMix: Object.entries(planMix)
            .map(([planCode, metrics]: [string, PlanMixSummary]) => ({
              planCode,
              shops: metrics.shops,
              monthlyRevenue: metrics.monthlyRevenue,
            }))
            .sort(
              (
                a: { planCode: string; shops: number; monthlyRevenue: number },
                b: { planCode: string; shops: number; monthlyRevenue: number },
              ) => b.monthlyRevenue - a.monthlyRevenue || b.shops - a.shops,
            ),
          revenueByShop: revenueRows.slice(0, 25),
        },
        sparklines: (() => {
          const datesList = dates.datesList.map((d: number) => new Date(d));
          const shopsGrowth = groupCumulativeCounts(raw.eligibleShops.filter((s:any) => s.createdAt && toDate(s.createdAt)!.getTime() >= dates.startDate), "createdAt", datesList, counts.baseShopsCount);
          const usersGrowth = groupCumulativeCounts(raw.recentUsers, "createdAt", datesList, counts.baseUsersCount);
          
          const orders = groupDailyCounts(raw.recentOrders, "createdAt", datesList.slice(2));
          const invoices = groupDailyCounts(raw.recentInvoices, "createdAt", datesList.slice(2));

          const revenue = new Array(10).fill(0);
          const last10Days = datesList.slice(2);
          raw.recentTransactions.forEach((tx: any) => {
            const createdAt = toDate(tx.createdAt);
            if (!createdAt) return;
            const status = String(tx.status || tx.paymentStatus || "").toLowerCase();
            // Accounting Rule: Only include successful/paid subscription transactions
            if (status !== "success" && status !== "completed" && status !== "paid") return;
            const amount = Number(tx.amount || 0);
            for (let i = 0; i < 10; i++) {
              const dayStart = last10Days[i];
              const dayEnd = new Date(dayStart);
              dayEnd.setDate(dayStart.getDate() + 1);
              if (createdAt >= dayStart && createdAt < dayEnd) {
                revenue[i] += amount;
                break;
              }
            }
          });

          return {
            revenue,
            shops: shopsGrowth.slice(2),
            users: usersGrowth.slice(2),
            orders,
            invoices,
            shopsGrowth,
            usersGrowth,
          };
        })(),
      };

      this.cache.set(cacheKey, overview, this.ttlMs);
      console.log("[AdminService] Overview successfully updated:", overview.cards);
      return overview;

    } catch (error: any) {
      console.error("[AdminService] Overview failed:", error.message);
      return {
        cards: { totalShops: 0, totalUsers: 0, totalProducts: 0, totalOrders: 0, totalInvoices: 0, activeShops: 0, suspendedShops: 0 },
        recentShops: [],
        backendHealth: null,
        subscriptionInsights: null,
      };
    }
  }

  async getRevenueReport() {
    const cacheKey = "admin-revenue-report";
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const overview = await this.getOverview();
    const si = overview.subscriptionInsights;
    const bh = overview.backendHealth;

    const report = {
      mrr: si?.monthlyRecurringRevenue ?? 0,
      arr: si?.annualRecurringRevenue ?? 0,
      paidShops: si?.paidShops ?? 0,
      freeShops: si?.freePlanShops ?? 0,
      totalShops: overview.cards.totalShops,
      activeShops: overview.cards.activeShops,
      planMix: si?.planMix ?? [],
      revenueByShop: si?.revenueByShop ?? [],
      monthlyActivity: bh?.monthlyActivity ?? {},
    };

    this.cache.set(cacheKey, report, this.ttlMs);
    return report;
  }

  async getUsageReport() {
    const cacheKey = "admin-usage-report";
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const overview = await this.getOverview();
    const bh = overview.backendHealth;
    const si = overview.subscriptionInsights;

    const report = {
      collectionFootprint: bh?.collectionFootprint ?? {},
      monthlyActivity: bh?.monthlyActivity ?? {},
      planDistribution: si?.planMix ?? [],
      totalShops: overview.cards.totalShops,
      activeShops: overview.cards.activeShops,
      suspendedShops: overview.cards.suspendedShops,
      totalUsers: overview.cards.totalUsers,
      totalProducts: overview.cards.totalProducts,
      totalOrders: overview.cards.totalOrders,
      totalInvoices: overview.cards.totalInvoices,
    };

    this.cache.set(cacheKey, report, this.ttlMs);
    return report;
  }

  async listAdmins(search?: string) {
    // Fetch all user_role mappings where roleId === 'admin' (platform admins)
    const roleMappingsSnapshot = await db
      .collection("user_roles")
      .where("roleId", "==", "admin")
      .get();

    // Also check for super_admin role
    const superAdminMappingsSnapshot = await db
      .collection("user_roles")
      .where("roleId", "==", "super_admin")
      .get();

    const allAdminMappings = [
      ...roleMappingsSnapshot.docs,
      ...superAdminMappingsSnapshot.docs,
    ];

    // Deduplicate userIds from role mappings
    const adminUserIds = Array.from(
      new Set(allAdminMappings.map((doc) => String(doc.data()?.userId || "").trim()).filter(Boolean))
    );

    // Also check users collection for isPlatformAdmin flag directly
    const platformAdminUsersSnapshot = await db
      .collection("users")
      .where("isPlatformAdmin", "==", true)
      .get();

    const platformAdminIds = platformAdminUsersSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.id);

    // Merge all admin user IDs
    const allAdminIds = Array.from(new Set([...adminUserIds, ...platformAdminIds]));

    if (!allAdminIds.length) {
      return [];
    }

    // Fetch user profiles (Firestore max 10 per `in` query; batch if needed)
    const chunkSize = 10;
    const userDocs: any[] = [];
    for (let i = 0; i < allAdminIds.length; i += chunkSize) {
      const chunk = allAdminIds.slice(i, i + chunkSize);
      const snapshot = await db.collection("users").where("__name__", "in", chunk).get();
      userDocs.push(...snapshot.docs);
    }

    const normalizedSearch = search?.trim().toLowerCase();

    return userDocs
      .map((doc) => {
        const data = doc.data() as any;
        return {
          uid: doc.id,
          name: data.name || data.displayName || "Unknown",
          displayName: data.displayName || data.name || "Unknown",
          email: data.email || "",
          mobile: data.mobile || data.phone || "",
          shopId: data.shopId,
          roleId: data.roleId || "admin",
          isActive: data.isActive !== false,
          isBlocked: data.isBlocked === true,
          createdAt: toDate(data.createdAt),
          lastLogin: toDate(data.lastLogin || data.lastLoginAt || data.metadata?.lastLogin),
          permissions: data.permissions || [],
        };
      })
      .filter((user) => {
        if (!normalizedSearch) return true;
        return [user.name, user.email, user.mobile]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      });
  }

  async listUsers(search?: string) {
    const cacheKey = "admin:all-users:list";
    let allUsers = this.cache.get<any[]>(cacheKey);

    if (!allUsers) {
      const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();
      allUsers = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
      this.cache.set(cacheKey, allUsers, this.ttlMs);
    }

    // Get platform admin user IDs to exclude from this list
    const adminRoleMappings = await db
      .collection("user_roles")
      .where("roleId", "==", "admin")
      .get();
    const superAdminRoleMappings = await db
      .collection("user_roles")
      .where("roleId", "==", "super_admin")
      .get();
    const platformAdminUsers = await db
      .collection("users")
      .where("isPlatformAdmin", "==", true)
      .get();

    const adminIds = new Set<string>([
      ...adminRoleMappings.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => String(d.data()?.userId || "")).filter(Boolean),
      ...superAdminRoleMappings.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => String(d.data()?.userId || "")).filter(Boolean),
      ...platformAdminUsers.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.id),
    ]);

    const normalizedSearch = search?.trim().toLowerCase();

    return (allUsers || [])
      .map((data) => {
        return {
          uid: data.id,
          name: data.name || data.displayName || "Unknown",
          displayName: data.displayName || data.name || "Unknown",
          email: data.email || "",
          mobile: data.mobile || data.phone || "",
          shopId: data.shopId,
          roleId: data.roleId || null,
          planId: data.planId || data.subscriptionPlan || "free",
          isActive: data.isActive !== false,
          isBlocked: data.isBlocked === true,
          kycStatus: data.kycStatus || "pending",
          createdAt: toDate(data.createdAt),
          lastLogin: toDate(data.lastLogin || data.lastLoginAt || data.metadata?.lastLogin),
          permissions: data.permissions || [],
        };
      })
      .filter((user) => {
        // Exclude platform admins from All Users list
        if (adminIds.has(user.uid)) return false;

        if (!normalizedSearch) return true;
        return [user.name, user.email, user.mobile, user.shopId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      });
  }


  async listStaff(search?: string) {
    const cacheKey = "admin:all-staff:list";
    let allStaff = this.cache.get<any[]>(cacheKey);

    if (!allStaff) {
      const snapshot = await db.collection("staff").limit(100).get();
      allStaff = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
      this.cache.set(cacheKey, allStaff, this.ttlMs);
    }

    const normalizedSearch = search?.trim().toLowerCase();

    return (allStaff || [])
      .map((data) => {
        return {
          id: data.id,
          fullName: data.fullName || "Unknown",
          email: data.email || "",
          department: data.department || "General",
          role: data.role || "Staff",
          status: data.status || "Active",
          lastLogin: toDate(data.lastLogin || data.lastLoginAt || data.metadata?.lastLogin),
          assignedModules: data.permissions ? Object.keys(data.permissions).filter((k: string) => data.permissions[k]?.view) : [],
          shopId: data.shopId,
          createdAt: toDate(data.createdAt),
        };
      })
      .filter((staff) => {
        if (!normalizedSearch) return true;
        return [staff.fullName, staff.email, staff.role, staff.department]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(normalizedSearch));
      });
  }

  async listPlatformCustomers(search?: string) {
    const cacheKey = "admin:all-customers:list";
    let allCustomers = this.cache.get<any[]>(cacheKey);

    if (!allCustomers) {
      const snapshot = await db.collection("customers").limit(100).get();
      allCustomers = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
      this.cache.set(cacheKey, allCustomers, this.ttlMs);
    }

    const normalizedSearch = search?.trim().toLowerCase();

    return (allCustomers || [])
      .map((data) => {
        return {
          id: data.id,
          name: data.name || "Unknown",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          createdAt: toDate(data.createdAt),
          status: data.status || "Active",
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0,
          shopId: data.shopId,
        };
      })
      .filter((c) => {
        if (!normalizedSearch) return true;
        return [c.name, c.email, c.phoneNumber, c.shopId]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(normalizedSearch));
      });
  }

  async listActivityLogs(search?: string) {
    const snapshot = await db.collection("audit_logs").limit(100).get();
    const normalizedSearch = search?.trim().toLowerCase();

    return snapshot.docs
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          userId: data.userId || "",
          email: data.email || "system",
          action: data.action || "UNKNOWN",
          module: data.module || "System",
          description: data.description || `${data.action} performed`,
          ipAddress: data.ipAddress || data.ip || "unknown",
          device: data.device || "unknown",
          timestamp: toDate(data.timestamp || data.createdAt),
        };
      })
      .filter((log: any) => {
        if (!normalizedSearch) return true;
        return [log.email, log.action, log.module, log.description]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(normalizedSearch));
      })
      .sort((a: any, b: any) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async listTransactions(limit = 50) {
    const cacheKey = `admin:all-transactions:list:${limit}`;
    let allTransactions = this.cache.get<any[]>(cacheKey);

    if (!allTransactions) {
      try {
        const snapshot = await db.collection("billing_transactions")
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();
        allTransactions = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
        this.cache.set(cacheKey, allTransactions, this.ttlMs);
      } catch (e) {
        console.warn("Failed to fetch billing transactions:", e);
        return [];
      }
    }
        
    return (allTransactions || []).map(data => {
      return {
        id: data.id,
        source: data.type || "subscription",
        shopId: data.shopId,
        reference: data.referenceId || data.id,
        amount: data.amount || 0,
        paymentMethod: data.paymentMethod || "unknown",
        paymentStatus: data.status || "completed",
        gateway: data.paymentGateway || "Razorpay",
        plan: data.planCode || data.featureCode || "unknown",
        createdAt: toDate(data.createdAt),
      };
    });
  }
}

export const adminService = new AdminService();
