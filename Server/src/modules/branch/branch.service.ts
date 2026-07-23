import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { subscriptionService } from "../subscription/subscription.service";
import { LIMIT_KEYS } from "../subscription/subscription.constants";
import { ForbiddenError } from "../../shared/utils/errors";
import { shopCountersService } from "../../infrastructure/cache/shop-counters.service";
import { costAnalyticsService } from "../cost-analytics/cost-analytics.service";

type BranchStatus = "Active" | "Inactive";

export interface BranchRecord {
  id: string;
  shopId: string;
  name: string;
  address: string;
  contactInfo: string;
  manager: string;
  status: BranchStatus;
  totalSales?: number;
  totalOrders?: number;
  revenue?: number;
  createdAt: string;
  updatedAt?: string;
  source: "document" | "derived";
  allowedModules?: string[];
}

export interface BranchSummary {
  id: string;
  name: string;
  address: string;
  status: BranchStatus;
  metrics: {
    sales: number;
    orders: number;
    revenue: number;
  };
}

export interface BranchAnalyticsData {
  branchId: string;
  branchName: string;
  sales: number;
  orders: number;
  revenue: number;
  salesChange: string;
  ordersChange: string;
  revenueChange: string;
  performanceData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
  insights: string[];
}

export interface UserBranchPermission {
  userId: string;
  userName: string;
  branchId: string;
  branchName: string;
  permissions: string[];
}

export interface BranchActivityItem {
  id: string;
  action: string;
  time: string;
  details: string;
  timestamp: string;
}

interface BranchRegistryEntry extends BranchRecord {
  aliases: string[];
}

interface CollectionsBundle {
  branches: any[];
  invoices: any[];
  orders: any[];
  staff: any[];
}

const BRANCH_COLLECTION = "branches";
const INVOICE_COLLECTION = "invoices";
const ORDER_COLLECTION = "orders";
const STAFF_COLLECTION = "staff";

export class BranchService {
  private readonly cache = new CacheService();
  private readonly collectionsCacheTtlMs = 15 * 60 * 1000;

  private getCollectionsCacheKey(shopId: string) {
    return `branches:collections:${shopId}`;
  }

  private getPersistenceMarkerKey(shopId: string) {
    return `branches:persisted:${shopId}`;
  }

  private invalidateShopCache(shopId?: string) {
    if (!shopId) {
      return;
    }

    this.cache.delete(this.getCollectionsCacheKey(shopId));
    this.cache.delete(this.getPersistenceMarkerKey(shopId));
    
    // Invalidate individual collection caches
    this.cache.delete(`branches:coll:branches:${shopId}`);
    this.cache.delete(`branches:coll:invoices:${shopId}`);
    this.cache.delete(`branches:coll:orders:${shopId}`);
    this.cache.delete(`branches:coll:staff:${shopId}`);

    // Invalidate analytics caches
    this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
    this.cache.deleteByPrefix(`analytics:collections:branches:${shopId}`);
    this.cache.deleteByPrefix(`analytics:report:${shopId}`);
    this.cache.deleteByPrefix(`analytics:page:${shopId}`);
  }

  private async getShopCollection(shopId: string, collection: "branches" | "invoices" | "orders" | "staff"): Promise<any[]> {
    const cacheKey = `branches:coll:${collection}:${shopId}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let query;
    if (collection === "branches") {
      query = db.collection(BRANCH_COLLECTION).where("shopId", "==", shopId);
    } else if (collection === "invoices") {
      query = db.collection(INVOICE_COLLECTION).where("shopId", "==", shopId);
    } else if (collection === "orders") {
      query = db.collection(ORDER_COLLECTION).where("shopId", "==", shopId);
    } else {
      query = db.collection(STAFF_COLLECTION).where("shopId", "==", shopId);
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    this.cache.set(cacheKey, data, this.collectionsCacheTtlMs);
    return data;
  }

  private async loadShopCollections(
    shopId: string, 
    needed: Array<"branches" | "invoices" | "orders" | "staff"> = ["branches", "invoices", "orders", "staff"]
  ): Promise<CollectionsBundle> {
    const promises = needed.map(col => this.getShopCollection(shopId, col));
    const results = await Promise.all(promises);
    
    const bundle: CollectionsBundle = {
      branches: [],
      invoices: [],
      orders: [],
      staff: []
    };
    
    needed.forEach((col, index) => {
      bundle[col] = results[index];
    });
    
    return bundle;
  }

  async getBranches(shopId: string): Promise<BranchRecord[]> {
    const branches = await this.getShopCollection(shopId, "branches");
    const staff = await this.getShopCollection(shopId, "staff");
    
    const hasPersistedMarker = this.cache.get(this.getPersistenceMarkerKey(shopId));
    
    let bundle: CollectionsBundle;
    if (branches.length > 0 || hasPersistedMarker) {
      bundle = {
        branches,
        staff,
        invoices: [],
        orders: []
      };
    } else {
      const [invoices, orders] = await Promise.all([
        this.getShopCollection(shopId, "invoices"),
        this.getShopCollection(shopId, "orders")
      ]);
      bundle = {
        branches,
        staff,
        invoices,
        orders
      };
    }

    const registry = this.buildBranchRegistry(shopId, bundle);
    await this.persistDerivedBranches(shopId, bundle, registry);
    return registry.map(this.stripAliases);
  }

  async getBranchById(shopId: string, branchId: string): Promise<BranchRecord | null> {
    const branches = await this.getShopCollection(shopId, "branches");
    const staff = await this.getShopCollection(shopId, "staff");
    
    const hasPersistedMarker = this.cache.get(this.getPersistenceMarkerKey(shopId));
    
    let bundle: CollectionsBundle;
    if (branches.length > 0 || hasPersistedMarker) {
      bundle = {
        branches,
        staff,
        invoices: [],
        orders: []
      };
    } else {
      const [invoices, orders] = await Promise.all([
        this.getShopCollection(shopId, "invoices"),
        this.getShopCollection(shopId, "orders")
      ]);
      bundle = {
        branches,
        staff,
        invoices,
        orders
      };
    }

    const registry = this.buildBranchRegistry(shopId, bundle);
    await this.persistDerivedBranches(shopId, bundle, registry);
    const branch = registry.find((entry) =>
      this.matchesBranchId(entry, branchId),
    );

    return branch ? this.stripAliases(branch) : null;
  }

  async createBranch(payload: any): Promise<BranchRecord> {
    const data = {
      shopId: String(payload.shopId || ""),
      name: String(payload.name || "").trim(),
      address: String(payload.address || "").trim(),
      contactInfo: String(payload.contactInfo || "").trim(),
      manager: String(payload.manager || "").trim(),
      status: this.normalizeStatus(payload.status),
      totalSales: Number(payload.totalSales || 0),
      totalOrders: Number(payload.totalOrders || 0),
      revenue: Number(payload.revenue || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Enforce branch limit based on subscription/shop credits
    const currentBranches = await this.getBranches(data.shopId);
    const access = await subscriptionService.resolveAccessContext({ shopId: data.shopId });
    const branchLimit = access.limits[LIMIT_KEYS.BRANCH_COUNT];

    const shopRef = await db.collection("shops").doc(data.shopId).get();
    const shopData = shopRef.exists ? shopRef.data() : null;
    const isTrial = shopData?.subscriptionPlan === 'trial' || shopData?.subscriptionStatus === 'trial' || shopData?.paymentStatus === 'trial';
    
    if (isTrial && currentBranches.length >= 1) {
      throw new ForbiddenError("Branch creation is locked during Free Trial. Please upgrade or start billing to add branches.");
    }

    if (branchLimit !== undefined && branchLimit !== null && branchLimit >= 0) {
      if (currentBranches.length >= branchLimit) {
        throw new ForbiddenError(`Branch limit reached. You can only create up to ${branchLimit} branches.`);
      }
    }

    const docRef = await db.collection(BRANCH_COLLECTION).add(data);
    this.invalidateShopCache(data.shopId);

    void shopCountersService.incrementCounter(data.shopId, "branches", 1);
    void costAnalyticsService.invalidateSnapshot("new_branch");

    return {
      id: docRef.id,
      shopId: data.shopId,
      name: data.name,
      address: data.address,
      contactInfo: data.contactInfo,
      manager: data.manager,
      status: data.status,
      totalSales: data.totalSales,
      totalOrders: data.totalOrders,
      revenue: data.revenue,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
      source: "document",
    };
  }

  async updateBranch(id: string, payload: any): Promise<void> {
    const branchRef = db.collection(BRANCH_COLLECTION).doc(id);
    const existingDoc = await branchRef.get();
    const existingShopId = existingDoc.exists ? String(existingDoc.data()?.shopId || "") : "";

    await branchRef.set(
      {
        ...payload,
        status: this.normalizeStatus(payload.status),
        updatedAt: new Date(),
      },
      { merge: true },
    );

    this.invalidateShopCache(existingShopId || String(payload.shopId || ""));
    if (payload.shopId && payload.shopId !== existingShopId) {
      this.invalidateShopCache(String(payload.shopId));
    }
  }

  async deleteBranch(id: string, shopId: string): Promise<{ success: boolean }> {
    let docRef = db.collection(BRANCH_COLLECTION).doc(id);
    let doc = await docRef.get();

    // Fallback search: if direct doc(id) lookup fails or shopId mismatch, query shop's branches
    if (!doc.exists || doc.data()?.shopId !== shopId) {
      const querySnap = await db.collection(BRANCH_COLLECTION)
        .where("shopId", "==", shopId)
        .get();

      const normalizedSearchId = this.normalizeBranchValue(id);

      const matchingDoc = querySnap.docs.find((d: any) => {
        const dData = d.data();
        const dNormKey = dData.normalizedKey || this.normalizeBranchValue(dData.name || "");
        return d.id === id ||
               d.id === `${shopId}_${id}` ||
               d.id === `${shopId}_${normalizedSearchId}` ||
               dNormKey === normalizedSearchId ||
               dData.name === id ||
               this.normalizeBranchValue(dData.name || "") === normalizedSearchId;
      });

      if (matchingDoc) {
        docRef = matchingDoc.ref;
        doc = matchingDoc;
      }
    }

    if (!doc.exists || (doc.data()?.shopId && doc.data()?.shopId !== shopId)) {
      return { success: false };
    }

    await docRef.delete();
    this.invalidateShopCache(shopId);

    void shopCountersService.incrementCounter(shopId, "branches", -1);
    void costAnalyticsService.invalidateSnapshot("delete_branch");

    // Decrement aggregated usage
    try {
      await subscriptionService.incrementUsage({
        shopId,
        limitKey: LIMIT_KEYS.BRANCH_COUNT,
        incrementBy: -1,
        period: "lifetime",
        subjectType: "shop"
      });
    } catch (e) {
      console.error("Failed to decrement branch count usage:", e);
    }

    return { success: true };
  }

  async getBranchSummaries(shopId: string): Promise<BranchSummary[]> {
    const bundle = await this.loadShopCollections(shopId, ["branches", "staff", "invoices", "orders"]);
    const registry = this.buildBranchRegistry(shopId, bundle);
    await this.persistDerivedBranches(shopId, bundle, registry);

    return registry
      .map((branch) => {
        const metrics = this.calculateBranchMetrics(branch, bundle);
        return {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          status: branch.status,
          metrics,
        };
      })
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue || a.name.localeCompare(b.name));
  }

  async getBranchAnalytics(
    shopId: string,
    branchId: string,
    dateRange: string = "30d",
  ): Promise<BranchAnalyticsData | null> {
    const bundle = await this.loadShopCollections(shopId);
    const registry = this.buildBranchRegistry(shopId, bundle);
    const branch = registry.find((entry) => this.matchesBranchId(entry, branchId));

    if (!branch) {
      return null;
    }

    const { start, end } = this.getDateRange(dateRange);
    const previousRange = this.getPreviousDateRange(start, end);

    const currentInvoices = bundle.invoices
      .filter((invoice) => this.recordMatchesBranch(invoice, branch))
      .filter((invoice) => this.isWithinRange(this.resolveDate(invoice.createdAt), start, end))
      .filter((invoice) => !this.isCancelledInvoice(invoice));
    const currentRevenueInvoices = currentInvoices.filter((invoice) => this.isInvoiceRevenueEligible(invoice));
    const previousInvoices = bundle.invoices
      .filter((invoice) => this.recordMatchesBranch(invoice, branch))
      .filter((invoice) =>
        this.isWithinRange(this.resolveDate(invoice.createdAt), previousRange.start, previousRange.end),
      )
      .filter((invoice) => !this.isCancelledInvoice(invoice));
    const previousRevenueInvoices = previousInvoices.filter((invoice) => this.isInvoiceRevenueEligible(invoice));

    const currentOrders = bundle.orders
      .filter((order) => this.recordMatchesBranch(order, branch))
      .filter((order) => this.isWithinRange(this.resolveDate(order.createdAt), start, end))
      .filter((order) => this.isOrderEligible(order));
    const previousOrders = bundle.orders
      .filter((order) => this.recordMatchesBranch(order, branch))
      .filter((order) =>
        this.isWithinRange(this.resolveDate(order.createdAt), previousRange.start, previousRange.end),
      )
      .filter((order) => this.isOrderEligible(order));

    const sales = currentInvoices.reduce((sum, invoice) => sum + Number(invoice.subtotal || invoice.total || 0), 0);
    const revenue = currentRevenueInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || invoice.paidAmount || 0),
      0,
    );
    const orders = currentInvoices.length + currentOrders.length;

    const previousSales = previousInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.subtotal || invoice.total || 0),
      0,
    );
    const previousRevenue = previousRevenueInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || invoice.paidAmount || 0),
      0,
    );
    const previousOrderCount = previousInvoices.length + previousOrders.length;

    const buckets = this.buildTrendBuckets(start, end, dateRange);
    const salesSeries = buckets.map((bucket) =>
      Number(
        currentInvoices
          .filter((invoice) => this.isWithinRange(this.resolveDate(invoice.createdAt), bucket.start, bucket.end))
          .reduce((sum, invoice) => sum + Number(invoice.subtotal || invoice.total || 0), 0)
          .toFixed(2),
      ),
    );
    const revenueSeries = buckets.map((bucket) =>
      Number(
        currentRevenueInvoices
          .filter((invoice) => this.isWithinRange(this.resolveDate(invoice.createdAt), bucket.start, bucket.end))
          .reduce((sum, invoice) => sum + Number(invoice.total || invoice.paidAmount || 0), 0)
          .toFixed(2),
      ),
    );

    const avgOrderValue = orders ? revenue / orders : 0;

    return {
      branchId: branch.id,
      branchName: branch.name,
      sales: Number(sales.toFixed(2)),
      orders,
      revenue: Number(revenue.toFixed(2)),
      salesChange: this.formatTrendLabel(sales, previousSales),
      ordersChange: this.formatTrendLabel(orders, previousOrderCount),
      revenueChange: this.formatTrendLabel(revenue, previousRevenue),
      performanceData: {
        labels: buckets.map((bucket) => bucket.label),
        datasets: [
          {
            label: "Sales",
            data: salesSeries,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.12)",
          },
          {
            label: "Revenue",
            data: revenueSeries,
            borderColor: "#059669",
            backgroundColor: "rgba(5, 150, 105, 0.12)",
          },
        ],
      },
      insights: [
        `${branch.name} generated ${this.formatCurrency(revenue)} in ${this.getRangeLabel(dateRange)}.`,
        `${orders} recorded transactions with an average value of ${this.formatCurrency(avgOrderValue)}.`,
        `Collected revenue is ${this.formatTrendLabel(revenue, previousRevenue).toLowerCase()} compared to the previous period.`,
      ],
    };
  }

  async getBranchPermissions(shopId: string): Promise<UserBranchPermission[]> {
    const bundle = await this.loadShopCollections(shopId);
    const registry = this.buildBranchRegistry(shopId, bundle);

    return bundle.staff
      .filter((member) => String(member.branch || "").trim())
      .map((member) => {
        const branch = registry.find((entry) => this.recordMatchesBranch({ branchName: member.branch }, entry));
        return {
          userId: String(member.id || member.userId || ""),
          userName: String(member.fullName || member.name || "Unknown"),
          branchId: branch?.id || this.normalizeBranchValue(String(member.branch || "unassigned")),
          branchName: branch?.name || this.toTitleCase(String(member.branch || "Unassigned")),
          permissions: this.deriveBranchPermissions(member),
        };
      })
      .filter((item) => item.userId && item.branchId)
      .sort((a, b) => a.branchName.localeCompare(b.branchName) || a.userName.localeCompare(b.userName));
  }

  async getBranchActivity(
    shopId: string,
    branchId: string,
    limit: number = 10,
  ): Promise<BranchActivityItem[]> {
    const bundle = await this.loadShopCollections(shopId);
    const registry = this.buildBranchRegistry(shopId, bundle);
    const branch = registry.find((entry) => this.matchesBranchId(entry, branchId));

    if (!branch) {
      return [];
    }

    const branchEvents: Array<{ id: string; action: string; details: string; timestamp: Date }> = [];

    branchEvents.push({
      id: `branch-created-${branch.id}`,
      action: "Branch Registered",
      details: `${branch.name} is available in the current shop workspace.`,
      timestamp: this.resolveDate(branch.createdAt),
    });

    bundle.invoices
      .filter((invoice) => this.recordMatchesBranch(invoice, branch))
      .slice(0, 20)
      .forEach((invoice) => {
        branchEvents.push({
          id: `invoice-${invoice.id}`,
          action: this.isInvoiceRevenueEligible(invoice) ? "Invoice Paid" : "Invoice Logged",
          details: `${invoice.invoiceNumber || invoice.id} • ${this.formatCurrency(Number(invoice.total || 0))}`,
          timestamp: this.resolveDate(invoice.updatedAt || invoice.createdAt),
        });
      });

    bundle.orders
      .filter((order) => this.recordMatchesBranch(order, branch))
      .slice(0, 20)
      .forEach((order) => {
        branchEvents.push({
          id: `order-${order.id}`,
          action: "Order Activity",
          details: `${this.toTitleCase(String(order.orderStatus || "processed"))} • ${this.formatCurrency(Number(order.totalAmount || 0))}`,
          timestamp: this.resolveDate(order.updatedAt || order.createdAt),
        });
      });

    return branchEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, Math.max(1, limit))
      .map((event) => ({
        id: event.id,
        action: event.action,
        details: event.details,
        time: this.formatRelativeTime(event.timestamp),
        timestamp: event.timestamp.toISOString(),
      }));
  }


  private async persistDerivedBranches(
    shopId: string,
    bundle: CollectionsBundle,
    registry: BranchRegistryEntry[],
  ) {
    if (bundle.branches.length || this.cache.get(this.getPersistenceMarkerKey(shopId))) {
      return;
    }

    const derivedBranches = registry.filter((branch) => branch.source === "derived");
    if (!derivedBranches.length) {
      this.cache.set(this.getPersistenceMarkerKey(shopId), true, this.collectionsCacheTtlMs);
      return;
    }

    const batch = db.batch();
    derivedBranches.forEach((branch) => {
      const metrics = this.calculateBranchMetrics(branch, bundle);
      const docId = `${shopId}_${this.normalizeBranchValue(branch.name)}`;
      batch.set(
        db.collection(BRANCH_COLLECTION).doc(docId),
        {
          shopId,
          name: branch.name,
          address: branch.address,
          contactInfo: branch.contactInfo,
          manager: branch.manager,
          status: branch.status,
          normalizedKey: this.normalizeBranchValue(branch.name),
          totalSales: metrics.sales,
          totalOrders: metrics.orders,
          revenue: metrics.revenue,
          createdAt: this.resolveDate(branch.createdAt),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    });

    await batch.commit();
    this.cache.set(this.getPersistenceMarkerKey(shopId), true, 5 * 60 * 1000);
    this.invalidateShopCache(shopId);
  }

  private buildBranchRegistry(shopId: string, bundle: CollectionsBundle): BranchRegistryEntry[] {
    const branchMap = new Map<string, BranchRegistryEntry>();

    const upsertBranch = (input: {
      id?: string;
      name?: string;
      address?: string;
      contactInfo?: string;
      manager?: string;
      status?: string;
      totalSales?: number;
      totalOrders?: number;
      revenue?: number;
      createdAt?: any;
      updatedAt?: any;
      aliases?: string[];
      source?: "document" | "derived";
      allowedModules?: string[];
    }) => {
      const name = this.toTitleCase(String(input.name || "").trim());
      const primaryAlias = this.normalizeBranchValue(String(input.id || name || "unassigned"));
      const nameAlias = this.normalizeBranchValue(String(name || "unassigned"));
      const aliases = Array.from(
        new Set([primaryAlias, nameAlias, ...(input.aliases || []).map((alias) => this.normalizeBranchValue(alias))]),
      ).filter((alias) => alias && alias !== "unassigned");

      if (!aliases.length || !name) {
        return;
      }

      // Find if any entry already exists in branchMap that matches by id, nameAlias, or alias overlap
      let existingKey: string | undefined = undefined;
      for (const [key, entry] of branchMap.entries()) {
        const entryNormName = this.normalizeBranchValue(entry.name);
        if (
          key === nameAlias ||
          entryNormName === nameAlias ||
          (input.id && entry.id === input.id) ||
          aliases.some((a) => entry.aliases.includes(a) || entry.id === a)
        ) {
          existingKey = key;
          break;
        }
      }

      const mapKey = existingKey || nameAlias;
      const existing = branchMap.get(mapKey);

      // Prefer persistent document ID and attributes over derived
      const isDocument = input.source === "document";
      const finalId = isDocument && input.id ? input.id : existing?.id || input.id || mapKey;

      branchMap.set(mapKey, {
        id: finalId,
        shopId,
        name: isDocument ? name : existing?.name || name,
        address: isDocument && input.address ? input.address : existing?.address || input.address || "Address not configured",
        contactInfo: isDocument && input.contactInfo ? input.contactInfo : existing?.contactInfo || input.contactInfo || "",
        manager: input.manager || existing?.manager || "",
        status: this.normalizeStatus(isDocument ? input.status : existing?.status || input.status),
        totalSales: Number(input.totalSales || existing?.totalSales || 0),
        totalOrders: Number(input.totalOrders || existing?.totalOrders || 0),
        revenue: Number(input.revenue || existing?.revenue || 0),
        createdAt: this.serializeDate(input.createdAt || existing?.createdAt || new Date()),
        updatedAt: this.serializeDate(input.updatedAt || existing?.updatedAt || input.createdAt || new Date()),
        source: isDocument ? "document" : existing?.source || "derived",
        aliases: Array.from(new Set([...(existing?.aliases || []), ...aliases])),
        allowedModules: input.allowedModules && input.allowedModules.length ? input.allowedModules : existing?.allowedModules || [],
      });
    };

    bundle.branches.forEach((branch) =>
      upsertBranch({
        id: String(branch.id || ""),
        name: String(branch.name || branch.branchName || branch.title || ""),
        address: String(branch.address || ""),
        contactInfo: String(branch.contactInfo || branch.phone || branch.mobile || ""),
        manager: String(branch.manager || branch.managerName || ""),
        status: String(branch.status || "Active"),
        totalSales: Number(branch.totalSales || branch.sales || 0),
        totalOrders: Number(branch.totalOrders || branch.orders || 0),
        revenue: Number(branch.revenue || 0),
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
        aliases: [String(branch.branchId || ""), String(branch.name || "")],
        source: "document",
        allowedModules: branch.allowedModules || [],
      }),
    );

    bundle.staff.forEach((member) =>
      upsertBranch({
        name: String(member.branch || ""),
        manager: String(member.role || "").toLowerCase() === "manager" ? String(member.fullName || "") : "",
        createdAt: member.joiningDate || member.createdAt,
        source: "derived",
      }),
    );

    [...bundle.invoices, ...bundle.orders].forEach((record) => {
      const descriptor = this.getRecordBranchDescriptor(record);
      upsertBranch({
        id: descriptor.id || undefined,
        name: descriptor.label,
        createdAt: record.createdAt,
        aliases: [descriptor.id, descriptor.value].filter(Boolean) as string[],
        source: "derived",
      });
    });

    // Final pass to ensure no duplicate names or IDs remain
    const uniqueRegistry = new Map<string, BranchRegistryEntry>();
    for (const entry of branchMap.values()) {
      const key = this.normalizeBranchValue(entry.name);
      const existing = uniqueRegistry.get(key);

      if (!existing) {
        uniqueRegistry.set(key, entry);
      } else {
        // Merge into single entry, preferring document source
        const preferCurrent = entry.source === "document" && existing.source !== "document";
        const winner = preferCurrent ? entry : existing;
        const loser = preferCurrent ? existing : entry;

        uniqueRegistry.set(key, {
          ...winner,
          address: winner.address && winner.address !== "Address not configured" ? winner.address : loser.address,
          manager: winner.manager || loser.manager,
          contactInfo: winner.contactInfo || loser.contactInfo,
          aliases: Array.from(new Set([...winner.aliases, ...loser.aliases])),
          allowedModules: winner.allowedModules?.length ? winner.allowedModules : loser.allowedModules,
        });
      }
    }

    return [...uniqueRegistry.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  private stripAliases = (entry: BranchRegistryEntry): BranchRecord => ({
    id: entry.id,
    shopId: entry.shopId,
    name: entry.name,
    address: entry.address,
    contactInfo: entry.contactInfo,
    manager: entry.manager,
    status: entry.status,
    totalSales: entry.totalSales,
    totalOrders: entry.totalOrders,
    revenue: entry.revenue,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    source: entry.source,
    allowedModules: entry.allowedModules,
  });

  private calculateBranchMetrics(branch: BranchRegistryEntry, bundle: CollectionsBundle) {
    const revenue = bundle.invoices
      .filter((invoice) => this.recordMatchesBranch(invoice, branch))
      .filter((invoice) => this.isInvoiceRevenueEligible(invoice))
      .reduce((sum, invoice) => sum + Number(invoice.total || invoice.paidAmount || 0), 0);

    const sales = bundle.invoices
      .filter((invoice) => this.recordMatchesBranch(invoice, branch))
      .filter((invoice) => !this.isCancelledInvoice(invoice))
      .reduce((sum, invoice) => sum + Number(invoice.subtotal || invoice.total || 0), 0);

    const invoiceOrders = bundle.invoices
      .filter((invoice) => this.recordMatchesBranch(invoice, branch))
      .filter((invoice) => !this.isCancelledInvoice(invoice)).length;

    const onlineOrders = bundle.orders
      .filter((order) => this.recordMatchesBranch(order, branch))
      .filter((order) => this.isOrderEligible(order)).length;

    return {
      sales: Number(sales.toFixed(2)),
      orders: invoiceOrders + onlineOrders,
      revenue: Number(revenue.toFixed(2)),
    };
  }

  private matchesBranchId(branch: BranchRegistryEntry, branchId: string) {
    const normalized = this.normalizeBranchValue(branchId);
    return branch.id === branchId || branch.aliases.includes(normalized);
  }

  private recordMatchesBranch(record: any, branch: BranchRegistryEntry) {
    const descriptor = this.getRecordBranchDescriptor(record);
    return branch.aliases.includes(descriptor.value) || !!descriptor.id && branch.aliases.includes(descriptor.id);
  }

  private getRecordBranchDescriptor(record: any) {
    const rawId = String(record?.branchId || record?.branch?.id || record?.storeId || record?.locationId || "").trim();
    const rawName = String(
      record?.branchName ||
        record?.branch?.name ||
        record?.branch ||
        record?.storeName ||
        record?.locationName ||
        record?.name ||
        "",
    ).trim();
    const label = rawName
      ? this.toTitleCase(rawName)
      : rawId
        ? this.toTitleCase(rawId)
        : "Unassigned";

    return {
      id: rawId ? this.normalizeBranchValue(rawId) : "",
      label,
      value: this.normalizeBranchValue(rawName || rawId || "unassigned"),
    };
  }

  private deriveBranchPermissions(member: any) {
    const permissions = ["view_branch"];
    const role = String(member.role || "").toLowerCase();

    if (role === "manager" || role === "admin") {
      permissions.push("manage_branch", "edit_branch");
    }

    if (member?.permissions?.analytics?.view) {
      permissions.push("view_branch_analytics");
    }

    if (member?.permissions?.settings?.edit || member?.permissions?.staff?.edit) {
      permissions.push("manage_branch_permissions");
    }

    return Array.from(new Set(permissions));
  }

  private normalizeStatus(status: any): BranchStatus {
    return String(status || "").toLowerCase() === "inactive" ? "Inactive" : "Active";
  }

  private isInvoiceRevenueEligible(invoice: any) {
    const status = String(invoice.paymentStatus || invoice.status || "").toLowerCase();
    return status === "paid";
  }

  private isCancelledInvoice(invoice: any) {
    return String(invoice.status || "").toLowerCase() === "cancelled";
  }

  private isOrderEligible(order: any) {
    const status = String(order.orderStatus || order.paymentStatus || "").toLowerCase();
    return !["cancelled", "failed"].includes(status);
  }

  private getDateRange(dateRange: string) {
    const end = new Date();
    const start = new Date(end);

    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 6);
        break;
      case "90d":
        start.setDate(end.getDate() - 89);
        break;
      case "365d":
        start.setDate(end.getDate() - 364);
        break;
      case "all":
        start.setFullYear(end.getFullYear() - 5);
        break;
      case "30d":
      default:
        start.setDate(end.getDate() - 29);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getPreviousDateRange(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return { start: previousStart, end: previousEnd };
  }

  private buildTrendBuckets(start: Date, end: Date, dateRange: string) {
    const bucketCount = dateRange === "7d" ? 7 : dateRange === "90d" || dateRange === "365d" ? 6 : 5;
    const totalMs = end.getTime() - start.getTime();
    const bucketMs = Math.max(24 * 60 * 60 * 1000, Math.floor(totalMs / bucketCount));

    return Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(start.getTime() + bucketMs * index);
      const rawEnd = index === bucketCount - 1 ? end : new Date(start.getTime() + bucketMs * (index + 1) - 1);
      const bucketEnd = rawEnd > end ? end : rawEnd;

      return {
        start: bucketStart,
        end: bucketEnd,
        label:
          dateRange === "7d"
            ? bucketStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
            : bucketStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      };
    });
  }

  private isWithinRange(date: Date, start: Date, end: Date) {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }

  private calculateTrend(current: number, previous: number) {
    if (!previous && !current) {
      return 0;
    }

    if (!previous) {
      return 100;
    }

    return ((current - previous) / previous) * 100;
  }

  private formatTrendLabel(current: number, previous: number) {
    if (!current && !previous) {
      return "No change";
    }

    if (!previous && current > 0) {
      return "New activity";
    }

    const trend = this.calculateTrend(current, previous);
    return `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}% vs previous period`;
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  private getRangeLabel(dateRange: string) {
    switch (dateRange) {
      case "7d":
        return "the last 7 days";
      case "90d":
        return "the last 90 days";
      case "365d":
        return "the last 12 months";
      case "all":
        return "the full recorded period";
      case "30d":
      default:
        return "the last 30 days";
    }
  }

  private formatRelativeTime(date: Date) {
    const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
    const intervals = [
      { label: "y", value: 365 * 24 * 60 * 60 },
      { label: "mo", value: 30 * 24 * 60 * 60 },
      { label: "d", value: 24 * 60 * 60 },
      { label: "h", value: 60 * 60 },
      { label: "m", value: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.value);
      if (count >= 1) {
        return `${count}${interval.label} ago`;
      }
    }

    return "just now";
  }

  private resolveDate(value: any) {
    if (!value) {
      return new Date(0);
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value?.toDate === "function") {
      return value.toDate();
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  private serializeDate(value: any) {
    return this.resolveDate(value).toISOString();
  }

  private normalizeBranchValue(value: string) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unassigned";
  }

  private toTitleCase(value: string) {
    return String(value || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}

export const branchService = new BranchService();
