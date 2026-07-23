import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";
import { IAnalyticsRepository } from "../../application/repositories/interfaces/analytics-repository.interface";
import { CacheService } from "../../infrastructure/cache/cache.service";

type ReportKey = "sales" | "website-sales" | "inventory" | "profit-loss" | "tax";

type ReportFilters = {
  dateRange?: string;
  segment?: string;
  channel?: string;
};

type AnalyticsPageKey = "sales" | "customers" | "products" | "branches";

type AnalyticsFilters = {
  dateRange?: string;
  branch?: string;
};

type AnalyticsSummaryCard = {
  label: string;
  value: string;
  change: string;
  icon: string;
  tone: "primary" | "success" | "warning" | "neutral";
};

type ReportMetric = {
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "success" | "warning" | "neutral";
  icon: string;
};

type ReportSeries = {
  label: string;
  data: number[];
  color: string;
  fill?: boolean;
};

type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

type ReportRow = Record<string, string | number>;

type ReportPayload = {
  subtitle: string;
  description: string;
  chartTitle: string;
  chartSubtitle: string;
  labels: string[];
  series: ReportSeries[];
  metrics: ReportMetric[];
  highlights: string[];
  columns: ReportColumn[];
  rows: ReportRow[];
};

type AnalyticsPayload = {
  key: AnalyticsPageKey;
  title: string;
  subtitle: string;
  description: string;
  chartType: "line" | "bar" | "doughnut";
  chartTitle: string;
  chartSubtitle: string;
  labels: string[];
  series: ReportSeries[];
  summaryCards: AnalyticsSummaryCard[];
  branchOptions: Array<{ label: string; value: string }>;
  insights: string[];
  columns: ReportColumn[];
  rows: ReportRow[];
  emptyTitle: string;
  emptyDescription: string;
};

type TimeBucket = {
  label: string;
  start: Date;
  end: Date;
};

type AnalyticsCollectionsBundle = {
  invoices: any[];
  orders: any[];
  expenses: any[];
  products: any[];
  customers: any[];
  staff: any[];
  inventory: any[];
  branches: any[];
};

type CollectionKey = "invoices" | "orders" | "expenses" | "products" | "customers" | "staff" | "inventory" | "branches";

export class AnalyticsService {
  private readonly cache = new CacheService();
  private readonly dashboardCacheTtlMs = 30 * 1000; // 30 seconds
  private readonly collectionsCacheTtlMs = 30 * 1000; // 30 seconds

  invalidateShopAnalyticsCache(shopId: string) {
    this.cache.deleteByMatch((key) => key.startsWith("analytics:") && key.includes(`:${shopId}`));
  }

  private getDashboardCacheKey(shopId: string, staffId?: string, period: string = "this_month", branchId?: string) {
    return `analytics:dashboard:${shopId}:${staffId || "all"}:${period}:${branchId || "parent"}`;
  }

  private getLeaderboardCacheKey(shopId: string) {
    return `analytics:leaderboard:${shopId}`;
  }

  private getReportCacheKey(shopId: string, reportKey: ReportKey, filters: ReportFilters) {
    return `analytics:report:${shopId}:${reportKey}:${filters.dateRange || "30d"}:${filters.segment || "all"}:${filters.channel || "all"}`;
  }

  private getAnalyticsCacheKey(shopId: string, pageKey: AnalyticsPageKey, filters: AnalyticsFilters) {
    return `analytics:page:${shopId}:${pageKey}:${filters.dateRange || "30d"}:${filters.branch || "all"}`;
  }

  private get analyticsRepository(): IAnalyticsRepository {
    return RepositoryFactory.getAnalyticsRepository();
  }

  async getDashboardStats(shopId: string, staffId?: string, period: string = "this_month", branchId?: string) {
    const cacheKey = this.getDashboardCacheKey(shopId, staffId, period, branchId);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const toLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const statsStartDate = new Date(previousMonthYear, previousMonth, 1);

    const bundle = await this.analyticsRepository.loadShopData(shopId, ["invoices", "orders", "expenses", "products", "customers"], branchId, statsStartDate);

    const allInvoices = bundle.invoices.filter((invoice) => !staffId || invoice.employeeId === staffId);
    const invoices = allInvoices.filter((invoice) => {
      const createdAt = this.resolveDate(invoice.createdAt);
      return !!createdAt && createdAt >= statsStartDate;
    });
    const recentInvoiceDocs = [...allInvoices]
      .sort(
        (a, b) =>
          (this.resolveDate(b.createdAt)?.getTime() || 0) - (this.resolveDate(a.createdAt)?.getTime() || 0),
      )
      .slice(0, 7);

    const productsCount = bundle.products.length;
    const allOrders = bundle.orders.filter((order) => !staffId || order.employeeId === staffId);
    const allExpenses = bundle.expenses;
    const pendingInvoicesCount = bundle.invoices.filter(
      (invoice) => String(invoice.status || "").toLowerCase() === "pending" || String(invoice.paymentStatus || "").toLowerCase() === "pending",
    ).length;

    let lowStockCount = 0;
    bundle.products.forEach((product) => {
      const stock = product.stockQuantity ?? product.stock ?? 0;
      const reorder = product.reorderLevel ?? 5;
      if (stock <= reorder) lowStockCount++;
    });

    const onlineCustomerIds = new Set();
    bundle.customers.forEach((customer) => {
      if (customer.source === "online" || customer.userId) {
        onlineCustomerIds.add(customer.id);
      }
    });

    let totalRevenue = 0;
    let totalRevenuePrevMonth = 0;
    let totalInvoices = 0;
    let totalInvoicesPrevMonth = 0;
    let totalOnlineCustomers = 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const dailySalesMap: { [key: string]: number } = {};

    for (let day = new Date(last30Days); day <= now; day.setDate(day.getDate() + 1)) {
      dailySalesMap[toLocalDateString(day)] = 0;
    }

    const uniqueCustomers = new Set();
    const uniqueCustomersPrev = new Set();
    const productSalesMap: {
      [key: string]: {
        name: string;
        category: string;
        sold: number;
        revenue: number;
      };
    } = {};

    invoices.forEach((invoice: any) => {
      const createdAt = this.resolveDate(invoice.createdAt);
      if (!createdAt) return;
      
      const invoiceMonth = createdAt.getMonth();
      const invoiceYear = createdAt.getFullYear();
      const isCurrentMonth = invoiceMonth === currentMonth && invoiceYear === currentYear;
      const isPrevMonth = invoiceMonth === previousMonth && invoiceYear === previousMonthYear;

      if (invoice.status === "paid" || invoice.paymentStatus === "paid") {
        if (createdAt >= last30Days) {
          const dateStr = toLocalDateString(createdAt);
          if (dailySalesMap[dateStr] !== undefined) {
            dailySalesMap[dateStr] += invoice.total || 0;
          }
        }

        if (isCurrentMonth) {
          totalRevenue += invoice.total || 0;
          totalInvoices++;
          if (invoice.customerId) {
            uniqueCustomers.add(invoice.customerId);
            if (onlineCustomerIds.has(invoice.customerId)) {
              totalOnlineCustomers++;
            }
          }
        }

        if (isPrevMonth) {
          totalRevenuePrevMonth += invoice.total || 0;
          totalInvoicesPrevMonth++;
          if (invoice.customerId) {
            uniqueCustomersPrev.add(invoice.customerId);
          }
        }
      }

      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          const productId = item.productId || item.productName || "unknown";
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = {
              name: item.productName || "Unknown Product",
              category: item.category || "General",
              sold: 0,
              revenue: 0,
            };
          }
          productSalesMap[productId].sold += item.quantity || 0;
          productSalesMap[productId].revenue += item.total || 0;
        });
      }
    });

    allOrders.forEach((order: any) => {
      if (order.orderStatus === "cancelled") return;
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach((item: any) => {
          const productId = item.productId || item.productName || "unknown";
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = {
              name: item.productName || "Unknown Product",
              category: item.category || "General",
              sold: 0,
              revenue: 0,
            };
          }
          productSalesMap[productId].sold += item.quantity || 0;
          productSalesMap[productId].revenue += ((item.price || 0) * (item.quantity || 0));
        });
      }
    });

    let totalOrders = 0;
    let totalOrdersPrev = 0;
    allOrders.forEach((order: any) => {
      const createdAt = this.resolveDate(order.createdAt);
      if (!createdAt) return;
      
      const isCurrentMonth =
        createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
      const isPrevMonth =
        createdAt.getMonth() === previousMonth &&
        createdAt.getFullYear() === previousMonthYear;
      if (isCurrentMonth) totalOrders++;
      if (isPrevMonth) totalOrdersPrev++;
    });

    let totalExpenses = 0;
    let totalExpensesPrev = 0;
    allExpenses.forEach((expense: any) => {
      const createdAt = this.resolveExpenseDate(expense);
      if (!createdAt) return;
      
      const isCurrentMonth =
        createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
      const isPrevMonth =
        createdAt.getMonth() === previousMonth &&
        createdAt.getFullYear() === previousMonthYear;
      if (isCurrentMonth) totalExpenses += expense.amount || 0;
      if (isPrevMonth) totalExpensesPrev += expense.amount || 0;
    });

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const topProducts = Object.keys(productSalesMap)
      .filter(
        (id) => id !== "unknown" && productSalesMap[id].name !== "Unknown Product",
      )
      .map((id) => ({
        id,
        ...productSalesMap[id],
        initials: productSalesMap[id].name
          .split(" ")
          .map((name: string) => name[0])
          .join("")
          .toUpperCase()
          .substring(0, 2),
        revenue: productSalesMap[id].revenue.toLocaleString(),
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const recentInvoices = recentInvoiceDocs.map((invoice: any) => {
      const dateObj = invoice.createdAt?.toDate
        ? invoice.createdAt.toDate()
        : new Date(invoice.createdAt);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || invoice.id.substring(0, 8),
        customer: invoice.customerName || "Walk-in Customer",
        customerPhone: invoice.customerPhone || "",
        customerInitial: (invoice.customerName || "W")[0].toUpperCase(),
        date: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        amount: (invoice.total || 0).toLocaleString(),
        status:
          (invoice.paymentStatus || invoice.status || "pending").charAt(0).toUpperCase() +
          (invoice.paymentStatus || invoice.status || "pending").slice(1),
      };
    });

    // Sparkline calculations over the last 30 days
    const dailyInvoicesMap: { [key: string]: number } = {};
    const dailyOrdersMap: { [key: string]: number } = {};
    const dailyCustomersMap: { [key: string]: number } = {};
    const dailyProductsMap: { [key: string]: number } = {};

    for (let day = new Date(last30Days); day <= now; day.setDate(day.getDate() + 1)) {
      const dateStr = toLocalDateString(day);
      dailyInvoicesMap[dateStr] = 0;
      dailyOrdersMap[dateStr] = 0;
      dailyCustomersMap[dateStr] = 0;
      dailyProductsMap[dateStr] = 0;
    }

    allInvoices.forEach((invoice: any) => {
      const createdAt = this.resolveDate(invoice.createdAt);
      if (!createdAt || createdAt < last30Days) return;
      const dateStr = toLocalDateString(createdAt);
      if (dailyInvoicesMap[dateStr] !== undefined) {
        dailyInvoicesMap[dateStr]++;
      }
    });

    allOrders.forEach((order: any) => {
      const createdAt = this.resolveDate(order.createdAt);
      if (!createdAt || createdAt < last30Days) return;
      const dateStr = toLocalDateString(createdAt);
      if (dailyOrdersMap[dateStr] !== undefined) {
        dailyOrdersMap[dateStr]++;
      }
    });

    bundle.customers.forEach((customer: any) => {
      const createdAt = this.resolveDate(customer.createdAt);
      if (!createdAt || createdAt < last30Days) return;
      const dateStr = toLocalDateString(createdAt);
      if (dailyCustomersMap[dateStr] !== undefined) {
        dailyCustomersMap[dateStr]++;
      }
    });

    bundle.products.forEach((product: any) => {
      const createdAt = this.resolveDate(product.createdAt);
      if (!createdAt || createdAt < last30Days) return;
      const dateStr = toLocalDateString(createdAt);
      if (dailyProductsMap[dateStr] !== undefined) {
        dailyProductsMap[dateStr]++;
      }
    });

    const sparklines = {
      revenue: Object.keys(dailySalesMap).map((date) => dailySalesMap[date]),
      invoices: Object.keys(dailyInvoicesMap).map((date) => dailyInvoicesMap[date]),
      orders: Object.keys(dailyOrdersMap).map((date) => dailyOrdersMap[date]),
      customers: Object.keys(dailyCustomersMap).map((date) => dailyCustomersMap[date]),
      products: Object.keys(dailyProductsMap).map((date) => dailyProductsMap[date]),
    };

    const result = {
      stats: {
        totalRevenue,
        revenueTrend: calculateTrend(totalRevenue, totalRevenuePrevMonth),
        totalInvoices,
        invoiceTrend: calculateTrend(totalInvoices, totalInvoicesPrevMonth),
        totalCustomers: uniqueCustomers.size,
        totalOnlineCustomers,
        customerTrend: calculateTrend(uniqueCustomers.size, uniqueCustomersPrev.size),
        totalProducts: productsCount,
        productTrend: 0,
        totalOrders,
        orderTrend: calculateTrend(totalOrders, totalOrdersPrev),
        totalExpenses,
        expensesTrend: calculateTrend(totalExpenses, totalExpensesPrev),
        pendingInvoices: pendingInvoicesCount,
        lowStockProducts: lowStockCount,
      },
      topProducts,
      recentInvoices,
      salesChartData: Object.keys(dailySalesMap).map((date) => ({
        date,
        value: dailySalesMap[date],
      })),
      sparklines,
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics Instrumentation] getDashboardStats for shop ${shopId} completed in ${Date.now() - now.getTime()}ms`);
    }

    return this.cache.set(cacheKey, result, this.dashboardCacheTtlMs);
  }

  async getStaffLeaderboard(shopId: string, branchId?: string) {
    const cacheKey = `${this.getLeaderboardCacheKey(shopId)}:${branchId || "all"}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const bundle = await this.analyticsRepository.loadShopData(shopId, ["staff", "invoices"], branchId);
    const staffList = bundle.staff;

    const leaderboard = staffList.map((staff) => {
      const staffInvoices = bundle.invoices.filter((invoice) => invoice.employeeId === staff.id);
      const totalSales = staffInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      const totalOrders = staffInvoices.length;
      const efficiency = totalOrders > 0 ? Math.min(98, 70 + totalSales / 5000) : 0;

      return {
        ...staff,
        totalSales,
        totalOrders,
        efficiency: Math.round(efficiency),
        rank: 0,
      };
    });

    leaderboard.sort((a, b) => b.totalSales - a.totalSales);
    leaderboard.forEach((staff, index) => {
      staff.rank = index + 1;
    });

    return this.cache.set(cacheKey, leaderboard, this.dashboardCacheTtlMs);
  }

  async getReportData(shopId: string, reportKey: ReportKey, filters: ReportFilters = {}, branchId?: string) {
    const cacheKey = `${this.getReportCacheKey(shopId, reportKey, filters)}:${branchId || "all"}`;
    const cached = this.cache.get<ReportPayload>(cacheKey);
    if (cached) {
      return cached;
    }

    const needed = (() => {
      switch (reportKey) {
        case "sales": return ["invoices", "orders"] as CollectionKey[];
        case "website-sales": return ["orders"] as CollectionKey[];
        case "inventory": return ["products", "inventory"] as CollectionKey[];
        case "profit-loss": return ["invoices", "expenses"] as CollectionKey[];
        case "tax": return ["invoices"] as CollectionKey[];
        default: return [] as CollectionKey[];
      }
    })();
    
    const range = this.getDateRange(filters.dateRange || "30d");
    const bundle = await this.analyticsRepository.loadShopData(shopId, needed, branchId, range.start);
    const invoices = bundle.invoices;
    const orders = bundle.orders;
    const products = bundle.products;
    const inventoryItems = bundle.inventory;
    const expenses = bundle.expenses;
    const report = (() => {
      switch (reportKey) {
        case "sales":
          return this.buildSalesReport(invoices, orders, range.start, range.end, filters);
        case "website-sales":
          return this.buildWebsiteSalesReport(orders, range.start, range.end, filters);
        case "inventory":
          return this.buildInventoryReport(products, inventoryItems, filters);
        case "profit-loss":
          return this.buildProfitLossReport(invoices, expenses, range.start, range.end, filters);
        case "tax":
          return this.buildTaxReport(invoices, range.start, range.end, filters);
        default:
          return this.getEmptyReport("No live data available for the selected report.");
      }
    })();

    return this.cache.set(cacheKey, report, this.dashboardCacheTtlMs);
  }

  async getAnalyticsPageData(shopId: string, pageKey: AnalyticsPageKey, filters: AnalyticsFilters = {}, branchId?: string) {
    if (branchId) {
      filters.branch = branchId;
    }
    const cacheKey = `${this.getAnalyticsCacheKey(shopId, pageKey, filters)}:${branchId || "all"}`;
    const cached = this.cache.get<AnalyticsPayload>(cacheKey);
    if (cached) {
      return cached;
    }

    const needed = (() => {
      switch (pageKey) {
        case "sales": return ["invoices", "orders", "branches"] as CollectionKey[];
        case "customers": return ["invoices", "customers", "branches"] as CollectionKey[];
        case "products": return ["invoices", "products", "branches"] as CollectionKey[];
        case "branches": return ["invoices", "orders", "branches"] as CollectionKey[];
        default: return [] as CollectionKey[];
      }
    })();
    
    const range = this.getDateRange(filters.dateRange || "30d");
    const bundle = await this.analyticsRepository.loadShopData(shopId, needed, branchId, range.start);
    const invoices = bundle.invoices;
    const orders = bundle.orders;
    const products = bundle.products;
    const customers = bundle.customers;
    const branches = bundle.branches;
    const branchOptions = this.buildBranchOptions(branches, invoices, orders, customers);

    const analytics = (() => {
      switch (pageKey) {
        case "sales":
          return this.buildSalesAnalytics(invoices, orders, branchOptions, range.start, range.end, filters);
        case "customers":
          return this.buildCustomerAnalytics(invoices, customers, branchOptions, range.start, range.end, filters);
        case "products":
          return this.buildProductAnalytics(invoices, products, branchOptions, range.start, range.end, filters);
        case "branches":
          return this.buildBranchAnalytics(invoices, orders, branchOptions, range.start, range.end, filters);
        default:
          return this.getEmptyAnalyticsPage(pageKey, branchOptions);
      }
    })();

    return this.cache.set(cacheKey, analytics, this.dashboardCacheTtlMs);
  }

  private buildSalesAnalytics(
    invoices: any[],
    orders: any[],
    branchOptions: Array<{ label: string; value: string }>,
    start: Date,
    end: Date,
    filters: AnalyticsFilters,
  ): AnalyticsPayload {
    const currentInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      start,
      end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const currentOrders = this.filterByDate(
      orders,
      (order) => this.resolveDate(order.createdAt),
      start,
      end,
    )
      .filter((order) => this.matchesBranchFilter(order, filters.branch))
      .filter((order) => !["cancelled", "failed"].includes(String(order.orderStatus || order.paymentStatus || "").toLowerCase()));
    const previousRange = this.getPreviousDateRange(start, end);
    const previousInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      previousRange.start,
      previousRange.end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const previousOrders = this.filterByDate(
      orders,
      (order) => this.resolveDate(order.createdAt),
      previousRange.start,
      previousRange.end,
    )
      .filter((order) => this.matchesBranchFilter(order, filters.branch))
      .filter((order) => !["cancelled", "failed"].includes(String(order.orderStatus || order.paymentStatus || "").toLowerCase()));

    const buckets = this.buildTimeBuckets(start, end, filters.dateRange || "30d");
    const revenueSeries = this.sumAmountsByBucket(
      buckets,
      currentInvoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      (invoice) => Number(invoice.total || 0),
    );
    const orderSeries = buckets.map((bucket) => {
      const invoiceCount = currentInvoices.filter((invoice) =>
        this.isDateInBucket(this.resolveDate(invoice.createdAt), bucket),
      ).length;
      const orderCount = currentOrders.filter((order) =>
        this.isDateInBucket(this.resolveDate(order.createdAt), bucket),
      ).length;
      return invoiceCount + orderCount;
    });

    const totalRevenue = currentInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const totalOrders = currentInvoices.length + currentOrders.length;
    const previousRevenue = previousInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const previousOrderCount = previousInvoices.length + previousOrders.length;
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const paymentMix = this.countBy(currentInvoices, (invoice) =>
      this.toTitleCase(String(invoice.paymentMethod || "unknown")),
    );
    const strongestPaymentMethod =
      Object.entries(paymentMix).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const bestBucketIndex = revenueSeries.reduce(
      (bestIndex, value, index, arr) => (value > (arr[bestIndex] || 0) ? index : bestIndex),
      0,
    );
    const selectedBranchLabel = this.getSelectedBranchLabel(branchOptions, filters.branch);

    return {
      key: "sales",
      title: "Sales Analytics",
      subtitle: `${selectedBranchLabel} revenue, billing pace, and order movement for ${this.getRangeLabel(filters.dateRange)}.`,
      description: "Live analytics sourced from paid invoices and fulfilled order records for the active shop scope.",
      chartType: "line",
      chartTitle: "Revenue vs Orders",
      chartSubtitle: "Revenue totals and order volume over the selected time window.",
      labels: buckets.map((bucket) => bucket.label),
      series: [
        { label: "Revenue", data: revenueSeries, color: "#4f46e5", fill: true },
        { label: "Orders", data: orderSeries, color: "#0ea5e9" },
      ],
      summaryCards: [
        {
          label: "Revenue",
          value: this.formatCompactCurrency(totalRevenue),
          change: this.formatTrendSummary(totalRevenue, previousRevenue),
          icon: "bi-currency-rupee",
          tone: "primary",
        },
        {
          label: "Orders",
          value: totalOrders.toLocaleString("en-IN"),
          change: this.formatTrendSummary(totalOrders, previousOrderCount),
          icon: "bi-bag-check",
          tone: "success",
        },
        {
          label: "Growth",
          value: this.formatPercent(this.calculateTrend(totalRevenue, previousRevenue)),
          change: `AOV ${this.formatCurrency(averageOrderValue)}`,
          icon: "bi-graph-up-arrow",
          tone: "warning",
        },
      ],
      branchOptions,
      insights: [
        `Strongest period: ${buckets[bestBucketIndex]?.label || "N/A"}.`,
        `Top payment method: ${strongestPaymentMethod}.`,
        `Average order value is ${this.formatCurrency(averageOrderValue)} in the selected scope.`,
      ],
      columns: [
        { key: "period", label: "Period" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "aov", label: "Avg Order", align: "right" },
      ],
      rows: buckets.map((bucket, index) => {
        const bucketRevenue = revenueSeries[index] || 0;
        const bucketOrders = orderSeries[index] || 0;
        return {
          period: bucket.label,
          orders: bucketOrders,
          revenue: this.formatCurrency(bucketRevenue),
          aov: this.formatCurrency(bucketOrders ? bucketRevenue / bucketOrders : 0),
        };
      }),
      emptyTitle: "No sales analytics found",
      emptyDescription: "Try another date range or branch filter to load sales analytics.",
    };
  }

  private buildCustomerAnalytics(
    invoices: any[],
    customers: any[],
    branchOptions: Array<{ label: string; value: string }>,
    start: Date,
    end: Date,
    filters: AnalyticsFilters,
  ): AnalyticsPayload {
    const customerMap = customers.reduce<Record<string, any>>((map, customer) => {
      map[String(customer.id)] = customer;
      return map;
    }, {});
    const currentInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      start,
      end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const previousRange = this.getPreviousDateRange(start, end);
    const previousInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      previousRange.start,
      previousRange.end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));

    const customerStats = currentInvoices.reduce<Record<string, { spend: number; orders: number; source: string }>>(
      (summary, invoice) => {
        const customerId = String(invoice.customerId || invoice.customerName || invoice.id);
        const source = this.getCustomerSource(customerMap[customerId], invoice);
        if (!summary[customerId]) {
          summary[customerId] = { spend: 0, orders: 0, source };
        }
        summary[customerId].spend += Number(invoice.total || 0);
        summary[customerId].orders += 1;
        return summary;
      },
      {},
    );
    const sourceSummary = Object.values(customerStats).reduce<
      Record<string, { customers: number; repeaters: number; spend: number }>
    >((summary, customer) => {
      if (!summary[customer.source]) {
        summary[customer.source] = { customers: 0, repeaters: 0, spend: 0 };
      }
      summary[customer.source].customers += 1;
      summary[customer.source].spend += customer.spend;
      if (customer.orders > 1) {
        summary[customer.source].repeaters += 1;
      }
      return summary;
    }, {});
    const uniqueCustomers = Object.keys(customerStats).length;
    const repeatCustomers = Object.values(customerStats).filter((customer) => customer.orders > 1).length;
    const previousUniqueCustomers = new Set(
      previousInvoices.map((invoice) => String(invoice.customerId || invoice.customerName || invoice.id)),
    ).size;
    const repeatRate = uniqueCustomers ? (repeatCustomers / uniqueCustomers) * 100 : 0;
    const averageSpend = uniqueCustomers
      ? currentInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0) / uniqueCustomers
      : 0;
    const sourceEntries = Object.entries(sourceSummary).sort((a, b) => b[1].customers - a[1].customers);
    const topSource = sourceEntries[0]?.[0] || "Walk In";
    const bestRepeatSource =
      [...sourceEntries].sort(
        (a, b) =>
          (b[1].customers ? b[1].repeaters / b[1].customers : 0) -
          (a[1].customers ? a[1].repeaters / a[1].customers : 0),
      )[0]?.[0] || "N/A";
    const selectedBranchLabel = this.getSelectedBranchLabel(branchOptions, filters.branch);

    return {
      key: "customers",
      title: "Customer Analytics",
      subtitle: `${selectedBranchLabel} customer growth, repeat behavior, and acquisition mix for ${this.getRangeLabel(filters.dateRange)}.`,
      description: "Live customer analytics derived from invoice history and customer profiles in the selected shop scope.",
      chartType: "bar",
      chartTitle: "Customer Acquisition Mix",
      chartSubtitle: "Unique customers grouped by detected source in the selected time window.",
      labels: sourceEntries.map(([source]) => source),
      series: [
        {
          label: "Customers",
          data: sourceEntries.map(([, summary]) => summary.customers),
          color: "#059669",
          fill: true,
        },
      ],
      summaryCards: [
        {
          label: "Customers",
          value: uniqueCustomers.toLocaleString("en-IN"),
          change: this.formatTrendSummary(uniqueCustomers, previousUniqueCustomers),
          icon: "bi-people",
          tone: "primary",
        },
        {
          label: "Repeat Rate",
          value: this.formatPercent(repeatRate),
          change: `${repeatCustomers} repeat customers`,
          icon: "bi-arrow-repeat",
          tone: "success",
        },
        {
          label: "Growth",
          value: this.formatPercent(this.calculateTrend(uniqueCustomers, previousUniqueCustomers)),
          change: `Avg spend ${this.formatCurrency(averageSpend)}`,
          icon: "bi-person-heart",
          tone: "neutral",
        },
      ],
      branchOptions,
      insights: [
        `Top acquisition source: ${topSource}.`,
        `Best repeat behavior currently comes from ${bestRepeatSource}.`,
        `Average customer spend in the selected scope is ${this.formatCurrency(averageSpend)}.`,
      ],
      columns: [
        { key: "segment", label: "Segment" },
        { key: "customers", label: "Customers", align: "right" },
        { key: "repeatRate", label: "Repeat Rate", align: "right" },
        { key: "spend", label: "Avg Spend", align: "right" },
      ],
      rows: sourceEntries.map(([segment, summary]) => ({
        segment,
        customers: summary.customers,
        repeatRate: this.formatPercent(summary.customers ? (summary.repeaters / summary.customers) * 100 : 0),
        spend: this.formatCurrency(summary.customers ? summary.spend / summary.customers : 0),
      })),
      emptyTitle: "No customer insights available",
      emptyDescription: "Customer analytics will appear once this branch scope has invoice activity.",
    };
  }

  private buildProductAnalytics(
    invoices: any[],
    products: any[],
    branchOptions: Array<{ label: string; value: string }>,
    start: Date,
    end: Date,
    filters: AnalyticsFilters,
  ): AnalyticsPayload {
    const currentInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      start,
      end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const previousRange = this.getPreviousDateRange(start, end);
    const previousInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      previousRange.start,
      previousRange.end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const productMap = products.reduce<Record<string, any>>((map, product) => {
      map[String(product.id)] = product;
      return map;
    }, {});

    const currentSummary = this.aggregateProductPerformance(currentInvoices, productMap);
    const previousSummary = this.aggregateProductPerformance(previousInvoices, productMap);
    const rows = Object.values(currentSummary).sort((a, b) => b.units - a.units);
    const totalUnits = rows.reduce((sum, row) => sum + row.units, 0);
    const previousUnits = Object.values(previousSummary).reduce((sum, row) => sum + row.units, 0);
    const topProduct = rows[0];
    const availableStock = rows.reduce((sum, row) => sum + row.stock, 0);
    const sellThrough = totalUnits + availableStock ? (totalUnits / (totalUnits + availableStock)) * 100 : 0;
    const categorySummary = rows.reduce<Record<string, number>>((summary, row) => {
      summary[row.category] = (summary[row.category] || 0) + row.units;
      return summary;
    }, {});
    const categoryEntries = Object.entries(categorySummary).sort((a, b) => b[1] - a[1]);
    const topCategory = categoryEntries[0]?.[0] || "General";
    const selectedBranchLabel = this.getSelectedBranchLabel(branchOptions, filters.branch);

    return {
      key: "products",
      title: "Product Performance",
      subtitle: `${selectedBranchLabel} product demand, sell-through, and category winners for ${this.getRangeLabel(filters.dateRange)}.`,
      description: "Live product analytics calculated from invoice line items and current product stock records.",
      chartType: "bar",
      chartTitle: "Category Performance",
      chartSubtitle: "Units sold by category for the selected shop scope.",
      labels: categoryEntries.map(([category]) => category),
      series: [
        {
          label: "Units Sold",
          data: categoryEntries.map(([, units]) => units),
          color: "#f97316",
          fill: true,
        },
      ],
      summaryCards: [
        {
          label: "Top SKU",
          value: topProduct?.sku || "N/A",
          change: topProduct ? `${topProduct.units} units sold` : "No sales yet",
          icon: "bi-star",
          tone: "primary",
        },
        {
          label: "Sell Through",
          value: this.formatPercent(sellThrough),
          change: `${availableStock.toLocaleString("en-IN")} units still in stock`,
          icon: "bi-box-seam",
          tone: "success",
        },
        {
          label: "Growth",
          value: this.formatPercent(this.calculateTrend(totalUnits, previousUnits)),
          change: `${topCategory} leads category demand`,
          icon: "bi-bar-chart",
          tone: "warning",
        },
      ],
      branchOptions,
      insights: [
        `Top performing category: ${topCategory}.`,
        `Best selling product: ${topProduct?.product || "N/A"}.`,
        `Current sell-through in the selected scope is ${this.formatPercent(sellThrough)}.`,
      ],
      columns: [
        { key: "sku", label: "SKU" },
        { key: "product", label: "Product" },
        { key: "units", label: "Units", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
      ],
      rows: rows.slice(0, 12).map((row) => ({
        sku: row.sku,
        product: row.product,
        units: row.units,
        revenue: this.formatCurrency(row.revenue),
      })),
      emptyTitle: "No product performance yet",
      emptyDescription: "Try another branch or date range to load product performance.",
    };
  }

  private buildBranchAnalytics(
    invoices: any[],
    orders: any[],
    branchOptions: Array<{ label: string; value: string }>,
    start: Date,
    end: Date,
    filters: AnalyticsFilters,
  ): AnalyticsPayload {
    const currentInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      start,
      end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const currentOrders = this.filterByDate(
      orders,
      (order) => this.resolveDate(order.createdAt),
      start,
      end,
    )
      .filter((order) => this.matchesBranchFilter(order, filters.branch))
      .filter((order) => !["cancelled", "failed"].includes(String(order.orderStatus || order.paymentStatus || "").toLowerCase()));
    const previousRange = this.getPreviousDateRange(start, end);
    const previousInvoices = this.filterByDate(
      invoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      previousRange.start,
      previousRange.end,
    )
      .filter((invoice) => this.matchesBranchFilter(invoice, filters.branch))
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));

    const branchSummary = new Map<string, { label: string; orders: number; revenue: number }>();
    currentInvoices.forEach((invoice) => {
      const branch = this.getBranchDescriptor(invoice);
      const existing = branchSummary.get(branch.value) || { label: branch.label, orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += Number(invoice.total || 0);
      branchSummary.set(branch.value, existing);
    });
    currentOrders.forEach((order) => {
      const branch = this.getBranchDescriptor(order);
      const existing = branchSummary.get(branch.value) || { label: branch.label, orders: 0, revenue: 0 };
      existing.orders += 1;
      branchSummary.set(branch.value, existing);
    });

    const previousRevenueByBranch = previousInvoices.reduce<Record<string, number>>((summary, invoice) => {
      const branch = this.getBranchDescriptor(invoice);
      summary[branch.value] = (summary[branch.value] || 0) + Number(invoice.total || 0);
      return summary;
    }, {});
    const rows = [...branchSummary.entries()]
      .map(([value, summary]) => ({
        value,
        branch: summary.label,
        orders: summary.orders,
        revenue: summary.revenue,
        growth: this.calculateTrend(summary.revenue, previousRevenueByBranch[value] || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const previousTotalRevenue = Object.values(previousRevenueByBranch).reduce((sum, value) => sum + value, 0);
    const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
    const leadingBranch = rows[0];
    const averageRevenue = rows.length ? totalRevenue / rows.length : 0;
    const selectedBranchLabel = this.getSelectedBranchLabel(branchOptions, filters.branch);

    return {
      key: "branches",
      title: "Branch Performance",
      subtitle: `${selectedBranchLabel} branch comparison and contribution view for ${this.getRangeLabel(filters.dateRange)}.`,
      description: "Live branch performance based on invoice revenue and operational order volume across the active shop scope.",
      chartType: "doughnut",
      chartTitle: "Revenue Contribution",
      chartSubtitle: "Share of total revenue generated by each branch.",
      labels: rows.map((row) => row.branch),
      series: [
        {
          label: "Revenue Share",
          data: rows.map((row) => Number(row.revenue.toFixed(2))),
          color: "#2563eb",
          fill: true,
        },
      ],
      summaryCards: [
        {
          label: "Leading Branch",
          value: leadingBranch?.branch || "N/A",
          change: leadingBranch ? this.formatCurrency(leadingBranch.revenue) : "No branch data",
          icon: "bi-shop",
          tone: "primary",
        },
        {
          label: "Branch Orders",
          value: totalOrders.toLocaleString("en-IN"),
          change: `${rows.length} active branch scopes`,
          icon: "bi-diagram-3",
          tone: "success",
        },
        {
          label: "Growth",
          value: this.formatPercent(this.calculateTrend(totalRevenue, previousTotalRevenue)),
          change: `Avg revenue ${this.formatCurrency(averageRevenue)}`,
          icon: "bi-speedometer2",
          tone: "neutral",
        },
      ],
      branchOptions,
      insights: [
        `Leading branch: ${leadingBranch?.branch || "N/A"}.`,
        `Average branch revenue is ${this.formatCurrency(averageRevenue)}.`,
        `${rows.length} branch scopes contributed to the current period view.`,
      ],
      columns: [
        { key: "branch", label: "Branch" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "growth", label: "Growth", align: "right" },
      ],
      rows: rows.map((row) => ({
        branch: row.branch,
        orders: row.orders,
        revenue: this.formatCurrency(row.revenue),
        growth: `${row.growth >= 0 ? "+" : ""}${row.growth.toFixed(1)}%`,
      })),
      emptyTitle: "No branch comparison available",
      emptyDescription: "Branch analytics will appear once branch-tagged transactions are available.",
    };
  }

  private getEmptyAnalyticsPage(
    key: AnalyticsPageKey,
    branchOptions: Array<{ label: string; value: string }>,
  ): AnalyticsPayload {
    return {
      key,
      title: "Analytics",
      subtitle: "No live analytics available.",
      description: "Analytics data could not be prepared for the selected scope.",
      chartType: "bar",
      chartTitle: "No Data",
      chartSubtitle: "No data",
      labels: [],
      series: [],
      summaryCards: [],
      branchOptions,
      insights: [],
      columns: [],
      rows: [],
      emptyTitle: "No analytics available",
      emptyDescription: "Try another filter combination to load analytics.",
    };
  }

  private buildSalesReport(invoices: any[], orders: any[], start: Date, end: Date, filters: ReportFilters): ReportPayload {
    const filteredInvoices = this.filterByDate(invoices, (invoice) => this.resolveDate(invoice.createdAt), start, end)
      .filter((invoice) => this.matchesSalesSegment(invoice, filters.segment));
    const paidInvoices = filteredInvoices.filter((invoice) =>
      ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()),
    );
    const buckets = this.buildTimeBuckets(start, end, filters.dateRange || "30d");

    const grossSeries = this.sumAmountsByBucket(
      buckets,
      paidInvoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      (invoice) => Number(invoice.subtotal || invoice.total || 0),
    );
    const collectedSeries = this.sumAmountsByBucket(
      buckets,
      paidInvoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      (invoice) => Number(invoice.paidAmount || invoice.total || 0),
    );

    const totalGross = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.subtotal || invoice.total || 0), 0);
    const totalDiscounts = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.discount || 0), 0);
    const totalNet = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const totalCollected = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || invoice.total || 0), 0);
    const averageOrder = paidInvoices.length ? totalNet / paidInvoices.length : 0;
    const filteredOrders = this.filterByDate(orders, (order) => this.resolveDate(order.createdAt), start, end);
    const refundedOrders = filteredOrders.filter(
      (order) => String(order.paymentStatus || "").toLowerCase() === "refunded",
    );

    const paymentMethodSummary = paidInvoices.reduce<Record<string, number>>((summary, invoice) => {
      const key = String(invoice.paymentMethod || "unknown").toLowerCase();
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {});
    const topPaymentMethod = Object.entries(paymentMethodSummary).sort((a, b) => b[1] - a[1])[0]?.[0] || "cash";

    const bestBucketIndex = grossSeries.reduce(
      (bestIndex, value, index, arr) => (value > (arr[bestIndex] || 0) ? index : bestIndex),
      0,
    );

    return {
      subtitle: "Live billing performance with collection quality and trend movement.",
      description: `Reporting window: ${this.getRangeLabel(filters.dateRange)}. Data is aggregated from paid shop invoices and linked refunds in real time.`,
      chartTitle: "Sales Trend",
      chartSubtitle: "Gross sales and collected amount across the selected time window.",
      labels: buckets.map((bucket) => bucket.label),
      series: [
        { label: "Gross Sales", data: grossSeries, color: "#7379e8", fill: true },
        { label: "Collected", data: collectedSeries, color: "#0ea5e9" },
      ],
      metrics: [
        {
          label: "Gross Revenue",
          value: this.formatCompactCurrency(totalGross),
          hint: `${paidInvoices.length} paid invoices in range`,
          tone: "primary",
          icon: "bi-currency-rupee",
        },
        {
          label: "Collected",
          value: this.formatCompactCurrency(totalCollected),
          hint: `Collection efficiency ${this.formatPercent(totalGross ? (totalCollected / totalGross) * 100 : 0)}`,
          tone: "success",
          icon: "bi-wallet2",
        },
        {
          label: "Refunded Orders",
          value: String(refundedOrders.length),
          hint: `${this.formatPercent(filteredOrders.length ? (refundedOrders.length / filteredOrders.length) * 100 : 0)} of online orders`,
          tone: "warning",
          icon: "bi-arrow-counterclockwise",
        },
        {
          label: "Average Order",
          value: this.formatCurrency(averageOrder),
          hint: `${this.formatCurrency(totalDiscounts)} discounts applied`,
          tone: "neutral",
          icon: "bi-bag-check",
        },
      ],
      highlights: [
        `Best period: ${buckets[bestBucketIndex]?.label || "N/A"}`,
        `Top payment method: ${this.toTitleCase(topPaymentMethod)}`,
        `Outstanding amount: ${this.formatCurrency(Math.max(totalNet - totalCollected, 0))}`,
      ],
      columns: [
        { key: "period", label: "Period" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "grossSales", label: "Gross Sales", align: "right" },
        { key: "discounts", label: "Discounts", align: "right" },
        { key: "netSales", label: "Net Sales", align: "right" },
      ],
      rows: buckets.map((bucket) => {
        const bucketInvoices = paidInvoices.filter((invoice) => this.isDateInBucket(this.resolveDate(invoice.createdAt), bucket));
        const bucketGross = bucketInvoices.reduce((sum, invoice) => sum + Number(invoice.subtotal || invoice.total || 0), 0);
        const bucketDiscounts = bucketInvoices.reduce((sum, invoice) => sum + Number(invoice.discount || 0), 0);
        const bucketNet = bucketInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

        return {
          period: bucket.label,
          orders: bucketInvoices.length,
          grossSales: this.formatCurrency(bucketGross),
          discounts: this.formatCurrency(bucketDiscounts),
          netSales: this.formatCurrency(bucketNet),
        };
      }),
    };
  }

  private buildWebsiteSalesReport(orders: any[], start: Date, end: Date, filters: ReportFilters): ReportPayload {
    const filteredOrders = this.filterByDate(orders, (order) => this.resolveDate(order.createdAt), start, end)
      .filter((order) => this.matchesWebsiteSegment(order, filters.segment));
    const completedOrders = filteredOrders.filter(
      (order) => !["cancelled", "failed"].includes(String(order.orderStatus || order.paymentStatus || "").toLowerCase()),
    );
    const paidOrders = filteredOrders.filter((order) => String(order.paymentStatus || "").toLowerCase() === "paid");
    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const averageOrderValue = completedOrders.length ? totalRevenue / completedOrders.length : 0;
    const onlinePaymentCount = filteredOrders.filter(
      (order) => String(order.paymentMethod || "").toLowerCase() === "online",
    ).length;
    const paymentMix = this.countBy(filteredOrders, (order) => this.toTitleCase(String(order.paymentMethod || "unknown")));
    const statusMix = this.countBy(filteredOrders, (order) => this.toTitleCase(String(order.orderStatus || "pending")));
    const topStatus = Object.entries(statusMix).sort((a, b) => b[1] - a[1])[0]?.[0] || "Pending";
    const topPaymentMode = Object.entries(paymentMix).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const highestOrderValue = filteredOrders.reduce(
      (highest, order) => Math.max(highest, Number(order.totalAmount || 0)),
      0,
    );

    return {
      subtitle: "Live storefront orders, payment behavior, and website checkout mix.",
      description: `Reporting window: ${this.getRangeLabel(filters.dateRange)}. Data is fetched from live website orders for the selected shop.`,
      chartTitle: "Website Orders By Status",
      chartSubtitle: "Distribution of storefront orders across the current fulfillment stages.",
      labels: Object.keys(statusMix),
      series: [{ label: "Orders", data: Object.values(statusMix), color: "#5f65d8", fill: true }],
      metrics: [
        {
          label: "Website Revenue",
          value: this.formatCompactCurrency(totalRevenue),
          hint: `${completedOrders.length} completed website orders`,
          tone: "primary",
          icon: "bi-globe2",
        },
        {
          label: "Paid Orders",
          value: String(paidOrders.length),
          hint: `${this.formatPercent(filteredOrders.length ? (paidOrders.length / filteredOrders.length) * 100 : 0)} payment success rate`,
          tone: "success",
          icon: "bi-graph-up-arrow",
        },
        {
          label: "Average Order",
          value: this.formatCurrency(averageOrderValue),
          hint: `${Object.keys(paymentMix).length} payment modes used`,
          tone: "neutral",
          icon: "bi-cart-plus",
        },
        {
          label: "Online Payment Mix",
          value: this.formatPercent(filteredOrders.length ? (onlinePaymentCount / filteredOrders.length) * 100 : 0),
          hint: `${filteredOrders.length - onlinePaymentCount} COD orders in range`,
          tone: "warning",
          icon: "bi-bullseye",
        },
      ],
      highlights: [
        `Top order status: ${topStatus}`,
        `Most used payment mode: ${topPaymentMode}`,
        `Highest order value: ${this.formatCurrency(highestOrderValue)}`,
      ],
      columns: [
        { key: "status", label: "Status" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "paidOrders", label: "Paid", align: "right" },
        { key: "share", label: "Share", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
      ],
      rows: Object.entries(statusMix).map(([status, count]) => {
        const statusOrders = filteredOrders.filter(
          (order) => this.toTitleCase(String(order.orderStatus || "pending")) === status,
        );
        const paidCount = statusOrders.filter(
          (order) => String(order.paymentStatus || "").toLowerCase() === "paid",
        ).length;
        const revenue = statusOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

        return {
          status,
          orders: count,
          paidOrders: paidCount,
          share: this.formatPercent(filteredOrders.length ? (count / filteredOrders.length) * 100 : 0),
          revenue: this.formatCurrency(revenue),
        };
      }),
    };
  }

  private buildInventoryReport(products: any[], inventoryItems: any[], filters: ReportFilters): ReportPayload {
    const inventoryByProduct = inventoryItems.reduce<Record<string, any[]>>((map, item) => {
      const productId = String(item.productId || "");
      if (!map[productId]) {
        map[productId] = [];
      }
      map[productId].push(item);
      return map;
    }, {});

    const rows = products
      .filter((product) => this.matchesInventorySegment(product, filters.segment))
      .map((product) => {
        const inventoryRows = inventoryByProduct[String(product.id)] || [];
        const variantStock = Array.isArray(product.variants)
          ? product.variants.reduce((sum: number, variant: any) => sum + Number(variant.stock || 0), 0)
          : 0;
        const available = inventoryRows.length
          ? inventoryRows.reduce((sum: number, item: any) => sum + Number(item.currentStock || 0), 0)
          : variantStock;
        const reorder = inventoryRows.length
          ? inventoryRows.reduce((sum: number, item: any) => sum + Number(item.lowStockThreshold || 0), 0)
          : Math.max(5, Array.isArray(product.variants) ? product.variants.length * 3 : 5);
        const avgSellingPrice = Array.isArray(product.variants) && product.variants.length
          ? product.variants.reduce(
              (sum: number, variant: any) => sum + Number(variant.discountedPrice || variant.price || 0),
              0,
            ) / product.variants.length
          : 0;
        const inventoryValue = available * avgSellingPrice;
        const sku = product.variants?.[0]?.sku || inventoryRows[0]?.variantSku || String(product.id).slice(0, 8).toUpperCase();
        const status = available <= 0 ? "Out of stock" : available <= reorder ? "Low stock" : "Healthy";

        return {
          sku,
          product: product.name || "Unnamed Product",
          category: this.toTitleCase(String(product.category || "general")),
          available,
          reorder,
          status,
          inventoryValue,
        };
      });

    const totalUnits = rows.reduce((sum, row) => sum + Number(row.available || 0), 0);
    const lowStockCount = rows.filter((row) => Number(row.available || 0) <= Number(row.reorder || 0)).length;
    const outOfStockCount = rows.filter((row) => Number(row.available || 0) <= 0).length;
    const inventoryValue = rows.reduce((sum, row) => sum + Number(row.inventoryValue || 0), 0);

    const categorySummary = rows.reduce<Record<string, { available: number; reorder: number }>>((summary, row) => {
      const key = String(row.category || "General");
      if (!summary[key]) {
        summary[key] = { available: 0, reorder: 0 };
      }
      summary[key].available += Number(row.available || 0);
      summary[key].reorder += Number(row.reorder || 0);
      return summary;
    }, {});
    const criticalCategory = Object.entries(categorySummary)
      .sort((a, b) => (a[1].available - a[1].reorder) - (b[1].available - b[1].reorder))[0]?.[0] || "N/A";
    const highestValueItem = [...rows].sort((a, b) => Number(b.inventoryValue || 0) - Number(a.inventoryValue || 0))[0];

    return {
      subtitle: "Live stock levels, threshold pressure, and inventory value readiness.",
      description: "Inventory is calculated from current product and inventory collections with category-aware aggregation.",
      chartTitle: "Available Units Vs Reorder Level",
      chartSubtitle: "Category stock compared against current reorder thresholds.",
      labels: Object.keys(categorySummary),
      series: [
        {
          label: "Available",
          data: Object.values(categorySummary).map((item) => item.available),
          color: "#0f766e",
          fill: true,
        },
        {
          label: "Reorder Level",
          data: Object.values(categorySummary).map((item) => item.reorder),
          color: "#f59e0b",
        },
      ],
      metrics: [
        {
          label: "Total Units",
          value: totalUnits.toLocaleString("en-IN"),
          hint: `${rows.length} active SKUs tracked`,
          tone: "primary",
          icon: "bi-box-seam",
        },
        {
          label: "Low Stock SKUs",
          value: String(lowStockCount),
          hint: `${outOfStockCount} fully out of stock`,
          tone: "warning",
          icon: "bi-exclamation-diamond",
        },
        {
          label: "Inventory Value",
          value: this.formatCompactCurrency(inventoryValue),
          hint: "Estimated from current selling prices",
          tone: "success",
          icon: "bi-archive",
        },
        {
          label: "Healthy Stock",
          value: String(Math.max(rows.length - lowStockCount, 0)),
          hint: `${this.formatPercent(rows.length ? ((rows.length - lowStockCount) / rows.length) * 100 : 0)} of visible catalogue`,
          tone: "neutral",
          icon: "bi-truck",
        },
      ],
      highlights: [
        `Most critical category: ${criticalCategory}`,
        `Highest stock value item: ${highestValueItem?.product || "N/A"}`,
        `Storefront ready products: ${rows.filter((row) => Number(row.available || 0) > 0).length}`,
      ],
      columns: [
        { key: "sku", label: "SKU" },
        { key: "product", label: "Product" },
        { key: "category", label: "Category" },
        { key: "available", label: "Available", align: "right" },
        { key: "reorder", label: "Reorder Level", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ],
      rows: [...rows]
        .sort((a, b) => Number(a.available) - Number(b.available))
        .slice(0, 12)
        .map((row) => ({
          sku: row.sku,
          product: row.product,
          category: row.category,
          available: row.available,
          reorder: row.reorder,
          status: row.status,
        })),
    };
  }

  private buildProfitLossReport(invoices: any[], expenses: any[], start: Date, end: Date, filters: ReportFilters): ReportPayload {
    const paidInvoices = this.filterByDate(invoices, (invoice) => this.resolveDate(invoice.createdAt), start, end)
      .filter((invoice) => ["paid"].includes(String(invoice.paymentStatus || invoice.status || "").toLowerCase()));
    const filteredExpenses = this.filterByDate(expenses, (expense) => this.resolveExpenseDate(expense), start, end);
    const buckets = this.buildTimeBuckets(start, end, filters.dateRange || "30d");

    const revenueSeries = this.sumAmountsByBucket(
      buckets,
      paidInvoices,
      (invoice) => this.resolveDate(invoice.createdAt),
      (invoice) => Number(invoice.total || 0),
    );
    const expenseSeries = this.sumAmountsByBucket(
      buckets,
      filteredExpenses,
      (expense) => this.resolveExpenseDate(expense),
      (expense) => Number(expense.amount || 0),
    );
    const netSeries = revenueSeries.map((value, index) => value - (expenseSeries[index] || 0));

    const totalRevenue = revenueSeries.reduce((sum, value) => sum + value, 0);
    const totalExpenses = expenseSeries.reduce((sum, value) => sum + value, 0);
    const netProfit = totalRevenue - totalExpenses;
    const bestPeriodIndex = netSeries.reduce(
      (bestIndex, value, index, arr) => (value > (arr[bestIndex] || 0) ? index : bestIndex),
      0,
    );

    return {
      subtitle: "Live revenue versus expense movement with net operating profit.",
      description: `Reporting window: ${this.getRangeLabel(filters.dateRange)}. Revenue is sourced from paid invoices and expenses from the finance ledger.`,
      chartTitle: "Profitability Trend",
      chartSubtitle: "Revenue, expenses, and net profit across the selected periods.",
      labels: buckets.map((bucket) => bucket.label),
      series: [
        { label: "Revenue", data: revenueSeries, color: "#2563eb", fill: true },
        { label: "Expenses", data: expenseSeries, color: "#ef4444" },
        { label: "Net Profit", data: netSeries, color: "#16a34a" },
      ],
      metrics: [
        {
          label: "Net Profit",
          value: this.formatCompactCurrency(netProfit),
          hint: `Margin ${this.formatPercent(totalRevenue ? (netProfit / totalRevenue) * 100 : 0)}`,
          tone: netProfit >= 0 ? "success" : "warning",
          icon: "bi-graph-up",
        },
        {
          label: "Revenue",
          value: this.formatCompactCurrency(totalRevenue),
          hint: `${paidInvoices.length} paid invoices included`,
          tone: "primary",
          icon: "bi-pie-chart",
        },
        {
          label: "Expenses",
          value: this.formatCompactCurrency(totalExpenses),
          hint: `${filteredExpenses.length} expense entries in range`,
          tone: "warning",
          icon: "bi-cash-stack",
        },
        {
          label: "Expense Ratio",
          value: this.formatPercent(totalRevenue ? (totalExpenses / totalRevenue) * 100 : 0),
          hint: "Compared against realized invoice revenue",
          tone: "neutral",
          icon: "bi-scissors",
        },
      ],
      highlights: [
        `Best period: ${buckets[bestPeriodIndex]?.label || "N/A"}`,
        `Expense coverage gap: ${this.formatCurrency(Math.max(totalExpenses - totalRevenue, 0))}`,
        `Average profit per period: ${this.formatCurrency(buckets.length ? netProfit / buckets.length : 0)}`,
      ],
      columns: [
        { key: "period", label: "Period" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "expenses", label: "Expenses", align: "right" },
        { key: "profit", label: "Net Profit", align: "right" },
        { key: "margin", label: "Margin", align: "right" },
      ],
      rows: buckets.map((bucket, index) => ({
        period: bucket.label,
        revenue: this.formatCurrency(revenueSeries[index] || 0),
        expenses: this.formatCurrency(expenseSeries[index] || 0),
        profit: this.formatCurrency(netSeries[index] || 0),
        margin: this.formatPercent(revenueSeries[index] ? ((netSeries[index] || 0) / revenueSeries[index]) * 100 : 0),
      })),
    };
  }

  private buildTaxReport(invoices: any[], start: Date, end: Date, filters: ReportFilters): ReportPayload {
    const filteredInvoices = this.filterByDate(invoices, (invoice) => this.resolveDate(invoice.createdAt), start, end)
      .filter((invoice) => this.matchesTaxSegment(invoice, filters.segment))
      .filter((invoice) => !["draft", "cancelled"].includes(String(invoice.status || "").toLowerCase()));

    const taxableRevenue = filteredInvoices.reduce(
      (sum, invoice) => sum + Number(this.getInvoiceTaxableValue(invoice)),
      0,
    );
    const outputTax = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.taxAmount || 0), 0);
    const cgst = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.cgst || 0), 0);
    const sgst = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.sgst || 0), 0);
    const igst = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.igst || 0), 0);
    const pendingInvoices = filteredInvoices.filter(
      (invoice) => String(invoice.paymentStatus || invoice.status || "").toLowerCase() !== "paid",
    ).length;
    const interstateCount = filteredInvoices.filter((invoice) => !!invoice.isInterstate).length;
    const bucketLabels = ["CGST", "SGST", "IGST", "CESS"];
    const bucketValues = [cgst, sgst, igst, 0];
    const taxTypeRows = [
      {
        taxBucket: "CGST",
        taxableSales: taxableRevenue / 2,
        taxAmount: cgst,
        invoices: filteredInvoices.filter((invoice) => Number(invoice.cgst || 0) > 0).length,
      },
      {
        taxBucket: "SGST",
        taxableSales: taxableRevenue / 2,
        taxAmount: sgst,
        invoices: filteredInvoices.filter((invoice) => Number(invoice.sgst || 0) > 0).length,
      },
      {
        taxBucket: "IGST",
        taxableSales: taxableRevenue,
        taxAmount: igst,
        invoices: filteredInvoices.filter((invoice) => Number(invoice.igst || 0) > 0).length,
      },
      {
        taxBucket: "Total",
        taxableSales: taxableRevenue,
        taxAmount: outputTax,
        invoices: filteredInvoices.length,
      },
    ];
    const dominantBucket = bucketLabels[bucketValues.indexOf(Math.max(...bucketValues))] || "CGST";

    return {
      subtitle: "Live GST liability summary from invoice-level tax breakdowns.",
      description: `Reporting window: ${this.getRangeLabel(filters.dateRange)}. Tax amounts are computed from current invoice tax fields for the shop.`,
      chartTitle: "Tax Mix",
      chartSubtitle: "Distribution of output tax across available GST buckets.",
      labels: bucketLabels,
      series: [{ label: "Liability", data: bucketValues, color: "#7c3aed", fill: true }],
      metrics: [
        {
          label: "Taxable Revenue",
          value: this.formatCompactCurrency(taxableRevenue),
          hint: `${filteredInvoices.length} taxable invoices in range`,
          tone: "primary",
          icon: "bi-receipt-cutoff",
        },
        {
          label: "Output Tax",
          value: this.formatCompactCurrency(outputTax),
          hint: `${interstateCount} interstate invoices`,
          tone: "warning",
          icon: "bi-bank",
        },
        {
          label: "Effective Tax Rate",
          value: this.formatPercent(taxableRevenue ? (outputTax / taxableRevenue) * 100 : 0),
          hint: `${this.formatCurrency(cgst + sgst)} intrastate liability`,
          tone: "success",
          icon: "bi-check2-circle",
        },
        {
          label: "Pending Tax Invoices",
          value: String(pendingInvoices),
          hint: "Unpaid invoices may still need reconciliation",
          tone: "neutral",
          icon: "bi-journal-check",
        },
      ],
      highlights: [
        `Largest tax bucket: ${dominantBucket}`,
        `Interstate share: ${this.formatPercent(filteredInvoices.length ? (interstateCount / filteredInvoices.length) * 100 : 0)}`,
        `Net GST liability: ${this.formatCurrency(outputTax)}`,
      ],
      columns: [
        { key: "taxBucket", label: "Tax Bucket" },
        { key: "taxableSales", label: "Taxable Sales", align: "right" },
        { key: "taxAmount", label: "Tax Amount", align: "right" },
        { key: "invoices", label: "Invoices", align: "right" },
        { key: "effectiveRate", label: "Effective Rate", align: "right" },
      ],
      rows: taxTypeRows.map((row) => ({
        taxBucket: row.taxBucket,
        taxableSales: this.formatCurrency(row.taxableSales),
        taxAmount: this.formatCurrency(row.taxAmount),
        invoices: row.invoices,
        effectiveRate: this.formatPercent(row.taxableSales ? (row.taxAmount / row.taxableSales) * 100 : 0),
      })),
    };
  }

  private getEmptyReport(message: string): ReportPayload {
    return {
      subtitle: message,
      description: message,
      chartTitle: "No Data",
      chartSubtitle: message,
      labels: [],
      series: [],
      metrics: [],
      highlights: [message],
      columns: [],
      rows: [],
    };
  }

  private aggregateProductPerformance(invoices: any[], productMap: Record<string, any>) {
    return invoices.reduce<
      Record<string, { sku: string; product: string; category: string; units: number; revenue: number; stock: number }>
    >((summary, invoice) => {
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      items.forEach((item: any) => {
        const productId = String(item.productId || item.productName || "unknown");
        const product = productMap[productId];
        if (!summary[productId]) {
          summary[productId] = {
            sku:
              item.variantSku ||
              product?.variants?.[0]?.sku ||
              String(productId).slice(0, 8).toUpperCase(),
            product: item.productName || product?.name || "Unknown Product",
            category: this.toTitleCase(String(item.category || product?.category || "general")),
            units: 0,
            revenue: 0,
            stock: this.getProductStock(product),
          };
        }
        summary[productId].units += Number(item.quantity || 0);
        summary[productId].revenue += Number(item.total || 0);
      });
      return summary;
    }, {});
  }

  private getProductStock(product: any) {
    if (!product) {
      return 0;
    }

    const directStock = Number(product.stockQuantity ?? product.stock ?? 0);
    if (directStock > 0) {
      return directStock;
    }

    if (Array.isArray(product.variants)) {
      return product.variants.reduce((sum: number, variant: any) => sum + Number(variant.stock || 0), 0);
    }

    return 0;
  }

  private resolveDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (typeof value?.toDate === "function") {
      const date = value.toDate();
      return Number.isNaN(date?.getTime?.()) ? null : date;
    }

    // Handle plain objects that represent Firestore Timestamps
    if (typeof value === 'object' && ('_seconds' in value || 'seconds' in value)) {
      const secs = value._seconds ?? value.seconds;
      const date = new Date(secs * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private resolveExpenseDate(expense: any) {
    return this.resolveDate(expense?.date || expense?.createdAt);
  }

  private filterByDate<T>(items: T[], getDate: (item: T) => Date | null, start: Date, end: Date) {
    return items.filter((item) => {
      const date = getDate(item);
      return !!date && date >= start && date <= end;
    });
  }

  private getDateRange(dateRange: string) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setHours(0, 0, 0, 0);

    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 6);
        break;
      case "90d":
        start.setDate(end.getDate() - 89);
        break;
      case "ytd":
        start.setMonth(0, 1);
        break;
      case "30d":
      default:
        start.setDate(end.getDate() - 29);
        break;
    }

    return { start, end };
  }

  private buildTimeBuckets(start: Date, end: Date, dateRange: string): TimeBucket[] {
    const buckets: TimeBucket[] = [];

    if (dateRange === "7d") {
      for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
        const bucketStart = new Date(current);
        bucketStart.setHours(0, 0, 0, 0);
        const bucketEnd = new Date(current);
        bucketEnd.setHours(23, 59, 59, 999);
        buckets.push({
          label: bucketStart.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          start: bucketStart,
          end: bucketEnd,
        });
      }
      return buckets;
    }

    if (dateRange === "30d") {
      for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 7)) {
        const bucketStart = new Date(current);
        bucketStart.setHours(0, 0, 0, 0);
        const bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 6);
        if (bucketEnd > end) {
          bucketEnd.setTime(end.getTime());
        }
        bucketEnd.setHours(23, 59, 59, 999);
        buckets.push({
          label: `${bucketStart.toLocaleDateString("en-US", { day: "numeric", month: "short" })} - ${bucketEnd.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`,
          start: bucketStart,
          end: bucketEnd,
        });
      }
      return buckets;
    }

    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const bucketStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const bucketEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
      if (bucketEnd > end) {
        bucketEnd.setTime(end.getTime());
      }
      buckets.push({
        label: bucketStart.toLocaleDateString("en-US", { month: "short" }),
        start: bucketStart,
        end: bucketEnd,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return buckets;
  }

  private sumAmountsByBucket<T>(
    buckets: TimeBucket[],
    items: T[],
    getDate: (item: T) => Date | null,
    getAmount: (item: T) => number,
  ) {
    return buckets.map((bucket) =>
      items.reduce((sum, item) => {
        const date = getDate(item);
        if (!this.isDateInBucket(date, bucket)) {
          return sum;
        }
        return sum + Number(getAmount(item) || 0);
      }, 0),
    );
  }

  private isDateInBucket(date: Date | null, bucket: TimeBucket) {
    return !!date && date >= bucket.start && date <= bucket.end;
  }

  private countBy<T>(items: T[], keySelector: (item: T) => string) {
    return items.reduce<Record<string, number>>((summary, item) => {
      const key = keySelector(item);
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {});
  }

  private calculateTrend(current: number, previous: number) {
    if (!previous) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private formatTrendSummary(current: number, previous: number) {
    const trend = this.calculateTrend(current, previous);
    return `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}% vs previous period`;
  }

  private formatCurrency(amount: number) {
    return `Rs. ${Math.round(amount || 0).toLocaleString("en-IN")}`;
  }

  private formatCompactCurrency(amount: number) {
    const absolute = Math.abs(amount || 0);
    const sign = amount < 0 ? "-" : "";

    if (absolute >= 10000000) {
      return `${sign}Rs. ${(absolute / 10000000).toFixed(1)}Cr`;
    }

    if (absolute >= 100000) {
      return `${sign}Rs. ${(absolute / 100000).toFixed(1)}L`;
    }

    if (absolute >= 1000) {
      return `${sign}Rs. ${(absolute / 1000).toFixed(1)}K`;
    }

    return `${sign}Rs. ${Math.round(absolute).toLocaleString("en-IN")}`;
  }

  private formatPercent(value: number) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  private toTitleCase(value: string) {
    return value
      .replace(/[_-]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private getRangeLabel(range?: string) {
    const map: Record<string, string> = {
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "90d": "Last 90 days",
      ytd: "Year to date",
    };

    return map[range || "30d"] || "Last 30 days";
  }

  private getPreviousDateRange(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    return { start: previousStart, end: previousEnd };
  }

  private normalizeBranchValue(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unassigned";
  }

  private getBranchDescriptor(record: any) {
    const id = record?.branchId || record?.branch?.id || record?.storeId || record?.locationId;
    const name =
      record?.branchName ||
      record?.branch?.name ||
      record?.name ||
      record?.storeName ||
      record?.locationName;
    const label = name
      ? this.toTitleCase(String(name))
      : id
        ? this.toTitleCase(String(id))
        : "Unassigned";
    const value = this.normalizeBranchValue(String(id || name || "unassigned"));

    return { label, value };
  }

  private buildBranchOptions(branches: any[], ...collections: any[][]) {
    const branchMap = new Map<string, { label: string; value: string }>();

    branches.forEach((branch) => {
      const descriptor = this.getBranchDescriptor({
        branchId: branch.id || branch.branchId,
        branchName: branch.name || branch.branchName || branch.title,
      });
      if (descriptor.value !== "unassigned") {
        branchMap.set(descriptor.value, descriptor);
      }
    });

    collections.flat().forEach((item) => {
      const descriptor = this.getBranchDescriptor(item);
      if (descriptor.value !== "unassigned") {
        branchMap.set(descriptor.value, descriptor);
      }
    });

    return [
      { label: "All Branches", value: "all" },
      ...[...branchMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }

  private getSelectedBranchLabel(
    branchOptions: Array<{ label: string; value: string }>,
    selectedBranch?: string,
  ) {
    return branchOptions.find((branch) => branch.value === (selectedBranch || "all"))?.label || "All Branches";
  }

  private matchesBranchFilter(record: any, branch?: string) {
    if (!branch || branch === "all") {
      return true;
    }

    return this.getBranchDescriptor(record).value === branch;
  }

  private getCustomerSource(customer: any, invoice: any) {
    const source =
      customer?.source ||
      invoice?.source ||
      (customer?.userId ? "online" : "") ||
      (invoice?.customerName ? "walk-in" : "unknown");

    return this.toTitleCase(String(source || "unknown"));
  }

  private getInvoiceTaxableValue(invoice: any) {
    if (Array.isArray(invoice.items) && invoice.items.length) {
      return invoice.items.reduce(
        (sum: number, item: any) => sum + Number(item.taxableValue || item.total || 0),
        0,
      );
    }

    return Number(invoice.subtotal || invoice.total || 0);
  }

  private matchesSalesSegment(invoice: any, segment?: string) {
    if (!segment || segment === "all") {
      return true;
    }

    const paymentMethod = String(invoice.paymentMethod || "").toLowerCase();
    if (segment === "pos") {
      return ["cash", "card", "upi"].includes(paymentMethod);
    }
    if (segment === "phone") {
      return paymentMethod === "credit";
    }
    return true;
  }

  private matchesWebsiteSegment(order: any, segment?: string) {
    if (!segment || segment === "all") {
      return true;
    }

    const paymentStatus = String(order.paymentStatus || "").toLowerCase();
    if (segment === "paid") {
      return paymentStatus === "paid";
    }
    return true;
  }

  private matchesInventorySegment(product: any, segment?: string) {
    if (!segment || segment === "all") {
      return true;
    }

    return String(product.category || "").toLowerCase() === String(segment).toLowerCase();
  }

  private matchesTaxSegment(invoice: any, segment?: string) {
    if (!segment || segment === "all") {
      return true;
    }

    if (segment === "intrastate") {
      return !invoice.isInterstate;
    }

    if (segment === "interstate") {
      return !!invoice.isInterstate;
    }

    if (segment === "exports") {
      return false;
    }

    return true;
  }
}

export const analyticsService = new AnalyticsService();
