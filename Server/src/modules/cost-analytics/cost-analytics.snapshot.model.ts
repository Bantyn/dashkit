import { CostAlert, ServiceCostBreakdown, ShopCostDetail } from "./cost-analytics.model";

/**
 * Precomputed analytics snapshot stored in `platform_cost_analytics` collection.
 * The report endpoint reads ONLY this document instead of scanning 13 collections.
 */
export interface AnalyticsSnapshot {
  id: string;                          // "latest" or "2026-07"
  shopId: null;                        // Platform-level, not tenant-scoped
  version: number;                     // Monotonically increasing
  isStale: boolean;                    // True = background refresh needed

  summary: {
    monthlyRevenue: number;
    totalInfrastructureCost: number;
    grossProfit: number;
    netMargin: number;
    averageCostPerShop: number;
    averageCostPerInvoice: number;
    averageCostPerOrder: number;
    averageCostPerCustomer: number;
    projectedMonthEndCost: number;
    burnRatePerDay: number;
    mostExpensiveShop: { name: string; cost: number };
    cheapestShop: { name: string; cost: number };
    totalShops: number;
    totalOrders: number;
    totalInvoices: number;
    totalCustomers: number;
  };

  serviceBreakdown: ServiceCostBreakdown[];
  topLists: {
    mostExpensive: ShopCostDetail[];
    highestReads: ShopCostDetail[];
    highestWrites: ShopCostDetail[];
    largestStorage: Array<ShopCostDetail & { storageMB: number }>;
    highestBandwidth: Array<ShopCostDetail & { bandwidthMB: number }>;
    highestApi: ShopCostDetail[];
  };
  monthlySparks: {
    revenue: number[];
    costs: number[];
    firestore: number[];
    storage: number[];
    bandwidth: number[];
    cloudinary: number[];
    hosting: number[];
  };
  alerts: CostAlert[];
  shopDetails: ShopCostDetail[];

  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  isDeleted: false;
  status: "active";
}

/**
 * Per-shop document count counters. Updated incrementally via FieldValue.increment.
 * Stored in `shop_counters` collection. Replaces full collection scans for count estimation.
 */
export interface ShopCounters {
  shopId: string;
  orders: number;
  invoices: number;
  products: number;
  customers: number;
  staff: number;
  branches: number;
  updatedAt: Date;
  createdAt: Date;
  createdBy: string;
  updatedBy: string;
}
