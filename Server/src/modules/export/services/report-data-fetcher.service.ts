import { getFirestore } from 'firebase-admin/firestore';
import { ExportHistoryRecord } from '../export.model';

export interface KpiMetric {
  label: string;
  value: string | number;
  subtext?: string;
}

export interface ReportDataResult {
  title: string;
  description: string;
  kpis: KpiMetric[];
  tables: Array<{
    sheetName: string;
    title: string;
    columns: Array<{ header: string; key: string; width?: number; type?: 'currency' | 'date' | 'number' | 'string' }>;
    rows: Record<string, any>[];
    totals?: Record<string, number | string>;
  }>;
  totalRecords: number;
}

export class ReportDataFetcher {
  
  static async fetch(record: ExportHistoryRecord): Promise<ReportDataResult> {
    const db = getFirestore();
    const filters = record.filters || {};
    const moduleName = record.module.toLowerCase();

    // Parse date filters
    let startDate: Date | null = filters.startDate ? new Date(filters.startDate) : null;
    let endDate: Date | null = filters.endDate ? new Date(filters.endDate) : null;

    if (startDate && isNaN(startDate.getTime())) startDate = null;
    if (endDate && isNaN(endDate.getTime())) endDate = null;

    switch (moduleName) {
      case 'dashboard':
      case 'analytics':
        return this.fetchDashboardReport(db, filters, startDate, endDate);

      case 'sales':
      case 'orders':
        return this.fetchSalesReport(db, filters, startDate, endDate);

      case 'financial':
      case 'billing':
      case 'transactions':
        return this.fetchFinancialReport(db, filters, startDate, endDate);

      case 'compliance':
      case 'gst':
      case 'audit':
        return this.fetchComplianceReport(db, filters, startDate, endDate);

      case 'subscription':
      case 'plans':
        return this.fetchSubscriptionReport(db, filters, startDate, endDate);

      case 'shops':
        return this.fetchShopsReport(db, filters, startDate, endDate);

      case 'users':
        return this.fetchUsersReport(db, filters, startDate, endDate);

      case 'invoices':
        return this.fetchInvoicesReport(db, filters, startDate, endDate);

      default:
        return this.fetchGenericCollectionReport(db, record.module, filters, startDate, endDate);
    }
  }

  // ── 1. Dashboard / Analytics Report ───────────────────────────────────────────────
  private static async fetchDashboardReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const [shopsSnap, ordersSnap, usersSnap, invoicesSnap] = await Promise.all([
      db.collection('shops').get(),
      db.collection('orders').get(),
      db.collection('users').get(),
      db.collection('invoices').get(),
    ]);

    let shops: any[] = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let orders: any[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let users: any[] = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let invoices: any[] = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Apply Date Range Filter
    if (startDate || endDate) {
      shops = shops.filter(s => this.isWithinDateRange(s.createdAt, startDate, endDate));
      orders = orders.filter(o => this.isWithinDateRange(o.createdAt, startDate, endDate));
      users = users.filter(u => this.isWithinDateRange(u.createdAt, startDate, endDate));
      invoices = invoices.filter(i => this.isWithinDateRange(i.createdAt, startDate, endDate));
    }

    const totalShops = shops.length;
    const activeShops = shops.filter(s => s.status === 'active' || !s.status).length;
    const trialShops = shops.filter(s => s.status === 'trial' || s.subscriptionPlan === 'trial').length;
    const paidShops = shops.filter(s => s.subscriptionPlan && s.subscriptionPlan !== 'free' && s.subscriptionPlan !== 'trial').length;
    const suspendedShops = shops.filter(s => s.status === 'suspended' || s.status === 'inactive').length;

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal || o.total) || 0), 0);
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = orders
      .filter(o => this.parseDate(o.createdAt) >= firstDayOfMonth)
      .reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal || o.total) || 0), 0);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todaysRevenue = orders
      .filter(o => this.parseDate(o.createdAt) >= startOfToday)
      .reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal || o.total) || 0), 0);

    const arpu = totalShops > 0 ? (totalRevenue / totalShops).toFixed(2) : '0.00';
    const churnRate = totalShops > 0 ? ((suspendedShops / totalShops) * 100).toFixed(1) + '%' : '0.0%';

    const topShopsRows = shops.map(s => {
      const shopOrders = orders.filter(o => o.shopId === s.id);
      const rev = shopOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal || o.total) || 0), 0);
      return {
        id: s.id,
        shopName: s.shopName || s.name || s.id,
        owner: s.ownerName || s.email || 'Admin',
        plan: s.subscriptionPlan || 'Free Tier',
        revenue: rev,
        status: s.status || 'Active',
        createdDate: this.formatDateStr(s.createdAt),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const kpis: KpiMetric[] = [
      { label: 'Total Shops', value: totalShops, subtext: `${activeShops} Active, ${suspendedShops} Suspended` },
      { label: 'Paid Subscribers', value: paidShops, subtext: `${trialShops} on Trial` },
      { label: 'Total Platform Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, subtext: `Monthly: ₹${monthlyRevenue.toLocaleString('en-IN')}` },
      { label: "Today's Sales", value: `₹${todaysRevenue.toLocaleString('en-IN')}`, subtext: `ARPU: ₹${arpu}` },
      { label: 'Platform Churn Rate', value: churnRate, subtext: `${suspendedShops} Suspended shops` },
    ];

    const topShopsColumns = [
      { header: 'Shop ID', key: 'id', width: 18, type: 'string' as const },
      { header: 'Shop Name', key: 'shopName', width: 25, type: 'string' as const },
      { header: 'Owner', key: 'owner', width: 25, type: 'string' as const },
      { header: 'Subscription Plan', key: 'plan', width: 20, type: 'string' as const },
      { header: 'Total Revenue', key: 'revenue', width: 20, type: 'currency' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Created Date', key: 'createdDate', width: 20, type: 'date' as const },
    ];

    return {
      title: 'DASHKIT PLATFORM EXECUTIVE DASHBOARD REPORT',
      description: 'Comprehensive platform analytics, revenue summary, subscription metrics, and shop performance.',
      kpis,
      tables: [
        {
          sheetName: 'Top Performing Shops',
          title: 'Top Performing Platform Shops',
          columns: topShopsColumns,
          rows: topShopsRows,
          totals: { revenue: totalRevenue },
        },
      ],
      totalRecords: totalShops,
    };
  }

  // ── 2. Sales Report ───────────────────────────────────────────────────────────────
  private static async fetchSalesReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const ordersSnap = await db.collection('orders').get();
    let orders: any[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Apply Filters
    if (startDate || endDate) {
      orders = orders.filter(o => this.isWithinDateRange(o.createdAt, startDate, endDate));
    }
    if (filters.status) {
      orders = orders.filter(o => String(o.status || '').toLowerCase() === String(filters.status).toLowerCase());
    }
    if (filters.shopId) {
      orders = orders.filter(o => o.shopId === filters.shopId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      orders = orders.filter(o =>
        String(o.orderNumber || '').toLowerCase().includes(s) ||
        String(o.customerName || '').toLowerCase().includes(s) ||
        String(o.shopName || '').toLowerCase().includes(s)
      );
    }

    const totalOrders = orders.length;
    const grossSales = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.subtotal || o.grandTotal) || 0), 0);
    const discounts = orders.reduce((sum, o) => sum + (Number(o.discount || o.discountAmount) || 0), 0);
    const refunds = orders.filter(o => o.status === 'refunded' || o.status === 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal) || 0), 0);
    const netSales = grossSales - discounts - refunds;
    const gstCollected = orders.reduce((sum, o) => sum + (Number(o.taxAmount || o.gstAmount || o.tax) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? (grossSales / totalOrders).toFixed(2) : '0.00';

    const orderRows = orders.map(o => ({
      invoiceNumber: o.orderNumber || o.invoiceNumber || o.id,
      shop: o.shopName || o.shopId || 'Main Store',
      customer: o.customerName || o.customerEmail || 'Guest Customer',
      date: this.formatDateStr(o.createdAt),
      paymentMethod: o.paymentMethod || o.paymentMode || 'COD',
      subtotal: Number(o.subtotal || o.totalAmount || 0),
      discount: Number(o.discount || 0),
      gst: Number(o.taxAmount || o.gstAmount || 0),
      grandTotal: Number(o.grandTotal || o.totalAmount || 0),
      status: o.status || 'Completed',
    }));

    const kpis: KpiMetric[] = [
      { label: 'Gross Sales', value: `₹${grossSales.toLocaleString('en-IN')}`, subtext: `Net Sales: ₹${netSales.toLocaleString('en-IN')}` },
      { label: 'Total Orders', value: totalOrders, subtext: `Avg Order Value: ₹${avgOrderValue}` },
      { label: 'Total Discounts Given', value: `₹${discounts.toLocaleString('en-IN')}` },
      { label: 'Refunds & Returns', value: `₹${refunds.toLocaleString('en-IN')}` },
      { label: 'GST Collected', value: `₹${gstCollected.toLocaleString('en-IN')}` },
    ];

    const columns = [
      { header: 'Invoice / Order #', key: 'invoiceNumber', width: 22, type: 'string' as const },
      { header: 'Shop', key: 'shop', width: 22, type: 'string' as const },
      { header: 'Customer', key: 'customer', width: 22, type: 'string' as const },
      { header: 'Order Date', key: 'date', width: 20, type: 'date' as const },
      { header: 'Payment Method', key: 'paymentMethod', width: 18, type: 'string' as const },
      { header: 'Subtotal', key: 'subtotal', width: 16, type: 'currency' as const },
      { header: 'Discount', key: 'discount', width: 14, type: 'currency' as const },
      { header: 'GST', key: 'gst', width: 14, type: 'currency' as const },
      { header: 'Grand Total', key: 'grandTotal', width: 18, type: 'currency' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
    ];

    return {
      title: 'SALES & ORDER TRANSACTION PERFORMANCE REPORT',
      description: 'Detailed revenue, order volumes, customer sales breakdown, discounts, and GST collections.',
      kpis,
      tables: [
        {
          sheetName: 'Orders & Sales',
          title: 'Sales & Orders Register',
          columns,
          rows: orderRows,
          totals: {
            subtotal: orderRows.reduce((s, r) => s + r.subtotal, 0),
            discount: discounts,
            gst: gstCollected,
            grandTotal: grossSales,
          },
        },
      ],
      totalRecords: totalOrders,
    };
  }

  // ── 3. Financial Report ────────────────────────────────────────────────────────────
  private static async fetchFinancialReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const [ordersSnap, expensesSnap, shopsSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('expenses').get(),
      db.collection('shops').get(),
    ]);

    let orders: any[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let expenses: any[] = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let shops: any[] = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (startDate || endDate) {
      orders = orders.filter(o => this.isWithinDateRange(o.createdAt, startDate, endDate));
      expenses = expenses.filter(e => this.isWithinDateRange(e.createdAt || e.date, startDate, endDate));
    }

    const subscriptionRevenue = shops.reduce((sum, s) => {
      const planPrice = s.subscriptionPlan === 'pro' ? 2999 : s.subscriptionPlan === 'enterprise' ? 9999 : 0;
      return sum + planPrice;
    }, 0);

    const salesRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal) || 0), 0);
    const totalRevenue = salesRevenue + subscriptionRevenue;
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const mrr = subscriptionRevenue;
    const arr = mrr * 12;

    const transactionRows: any[] = [];
    orders.forEach(o => {
      transactionRows.push({
        transactionId: o.id,
        amount: Number(o.totalAmount || o.grandTotal || 0),
        type: 'Sales Order',
        status: o.status || 'Completed',
        gateway: o.paymentMethod || 'Razorpay / UPI',
        date: this.formatDateStr(o.createdAt),
        referenceNumber: o.orderNumber || o.transactionId || 'REF-' + String(o.id).slice(0, 8),
      });
    });

    expenses.forEach(e => {
      transactionRows.push({
        transactionId: e.id,
        amount: -Number(e.amount || 0),
        type: 'Expense',
        status: 'Paid',
        gateway: e.paymentMethod || 'Bank Transfer',
        date: this.formatDateStr(e.createdAt || e.date),
        referenceNumber: e.category || 'OPEX',
      });
    });

    const kpis: KpiMetric[] = [
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, subtext: `Sales: ₹${salesRevenue.toLocaleString('en-IN')}` },
      { label: 'Operational Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}` },
      { label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}`, subtext: `Margin: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%` },
      { label: 'MRR (Monthly Recurring)', value: `₹${mrr.toLocaleString('en-IN')}`, subtext: `ARR: ₹${arr.toLocaleString('en-IN')}` },
      { label: 'Subscription Revenue', value: `₹${subscriptionRevenue.toLocaleString('en-IN')}` },
    ];

    const columns = [
      { header: 'Transaction ID', key: 'transactionId', width: 22, type: 'string' as const },
      { header: 'Amount', key: 'amount', width: 18, type: 'currency' as const },
      { header: 'Transaction Type', key: 'type', width: 18, type: 'string' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Payment Gateway', key: 'gateway', width: 20, type: 'string' as const },
      { header: 'Date', key: 'date', width: 20, type: 'date' as const },
      { header: 'Reference / Invoice #', key: 'referenceNumber', width: 25, type: 'string' as const },
    ];

    return {
      title: 'PLATFORM FINANCIAL & CASH FLOW SUMMARY REPORT',
      description: 'Full accounting ledger, revenue, operational expenses, MRR/ARR, and gateway settlement logs.',
      kpis,
      tables: [
        {
          sheetName: 'Financial Ledger',
          title: 'Financial Transactions Ledger',
          columns,
          rows: transactionRows,
          totals: { amount: netProfit },
        },
      ],
      totalRecords: transactionRows.length,
    };
  }

  // ── 4. Compliance & GST Report ───────────────────────────────────────────────────
  private static async fetchComplianceReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const [ordersSnap, gstSnap, notifsSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('platform_settings').doc('gst').get(),
      db.collection('admin_notifications').get(),
    ]);

    let orders: any[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const gstSettings: any = gstSnap.exists ? gstSnap.data() : {};
    let auditLogs: any[] = notifsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (startDate || endDate) {
      orders = orders.filter(o => this.isWithinDateRange(o.createdAt, startDate, endDate));
      auditLogs = auditLogs.filter(a => this.isWithinDateRange(a.createdAt, startDate, endDate));
    }

    const totalTax = orders.reduce((sum, o) => sum + (Number(o.taxAmount || o.gstAmount) || 0), 0);
    const cgst = totalTax * 0.5;
    const sgst = totalTax * 0.5;
    const igst = 0;
    const failedTransactions = orders.filter(o => o.status === 'failed').length;
    const cancelledInvoices = orders.filter(o => o.status === 'cancelled').length;

    const complianceRows = orders.map(o => ({
      invoiceNumber: o.orderNumber || o.id,
      shop: o.shopName || o.shopId || 'Main Store',
      gstin: o.gstin || gstSettings?.gstNumber || 'URP (Unregistered)',
      taxableAmount: Number(o.subtotal || o.totalAmount || 0),
      cgst: Number(o.taxAmount || o.gstAmount || 0) * 0.5,
      sgst: Number(o.taxAmount || o.gstAmount || 0) * 0.5,
      igst: 0,
      totalGst: Number(o.taxAmount || o.gstAmount || 0),
      status: o.status || 'Completed',
      date: this.formatDateStr(o.createdAt),
    }));

    const kpis: KpiMetric[] = [
      { label: 'Total GST Collected', value: `₹${totalTax.toLocaleString('en-IN')}`, subtext: `Platform GSTIN: ${gstSettings?.gstNumber || 'Not Set'}` },
      { label: 'CGST (Central Tax)', value: `₹${cgst.toLocaleString('en-IN')}` },
      { label: 'SGST (State Tax)', value: `₹${sgst.toLocaleString('en-IN')}` },
      { label: 'Failed / Returned Orders', value: failedTransactions, subtext: `${cancelledInvoices} Cancelled Invoices` },
      { label: 'Security & Audit Events', value: auditLogs.length, subtext: 'System Activity Events' },
    ];

    const columns = [
      { header: 'Invoice #', key: 'invoiceNumber', width: 22, type: 'string' as const },
      { header: 'Shop', key: 'shop', width: 22, type: 'string' as const },
      { header: 'GSTIN / URP', key: 'gstin', width: 20, type: 'string' as const },
      { header: 'Taxable Amount', key: 'taxableAmount', width: 18, type: 'currency' as const },
      { header: 'CGST (9%)', key: 'cgst', width: 14, type: 'currency' as const },
      { header: 'SGST (9%)', key: 'sgst', width: 14, type: 'currency' as const },
      { header: 'IGST (18%)', key: 'igst', width: 14, type: 'currency' as const },
      { header: 'Total GST', key: 'totalGst', width: 16, type: 'currency' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Invoice Date', key: 'date', width: 20, type: 'date' as const },
    ];

    return {
      title: 'PLATFORM TAX COMPLIANCE & GST AUDIT REPORT',
      description: 'Official tax register, CGST/SGST/IGST breakdown, cancelled invoices, and security compliance events.',
      kpis,
      tables: [
        {
          sheetName: 'GST Compliance Register',
          title: 'GST & Tax Breakdown Register',
          columns,
          rows: complianceRows,
          totals: { taxableAmount: complianceRows.reduce((s, r) => s + r.taxableAmount, 0), totalGst: totalTax },
        },
      ],
      totalRecords: complianceRows.length,
    };
  }

  // ── 5. Subscription Report ─────────────────────────────────────────────────────────
  private static async fetchSubscriptionReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const shopsSnap = await db.collection('shops').get();
    let shops: any[] = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (startDate || endDate) {
      shops = shops.filter(s => this.isWithinDateRange(s.createdAt, startDate, endDate));
    }
    if (filters.plan) {
      shops = shops.filter(s => String(s.subscriptionPlan || '').toLowerCase() === String(filters.plan).toLowerCase());
    }

    const totalSubscribers = shops.length;
    const trial = shops.filter(s => s.subscriptionPlan === 'trial' || s.status === 'trial').length;
    const paid = shops.filter(s => s.subscriptionPlan && s.subscriptionPlan !== 'free' && s.subscriptionPlan !== 'trial').length;
    const expired = shops.filter(s => s.status === 'expired' || s.status === 'inactive').length;
    const cancelled = shops.filter(s => s.status === 'cancelled').length;

    const subRows = shops.map(s => {
      const planPrice = s.subscriptionPlan === 'pro' ? 2999 : s.subscriptionPlan === 'enterprise' ? 9999 : 0;
      return {
        shop: s.shopName || s.name || s.id,
        owner: s.ownerName || s.email || 'Admin',
        plan: (s.subscriptionPlan || 'Free Tier').toUpperCase(),
        billingCycle: s.billingCycle || 'Monthly',
        status: s.status || 'Active',
        renewalDate: s.subscriptionRenewalDate ? this.formatDateStr(s.subscriptionRenewalDate) : 'N/A',
        amount: planPrice,
        paymentStatus: planPrice > 0 ? 'Paid' : 'N/A',
        createdDate: this.formatDateStr(s.createdAt),
      };
    });

    const kpis: KpiMetric[] = [
      { label: 'Total Subscribers', value: totalSubscribers, subtext: `${paid} Paid, ${trial} Trial` },
      { label: 'Active Paid Plans', value: paid, subtext: 'Revenue Generating' },
      { label: 'Trial Subscribers', value: trial, subtext: 'Conversion Pipeline' },
      { label: 'Expired / Inactive', value: expired, subtext: `${cancelled} Cancelled` },
    ];

    const columns = [
      { header: 'Shop Name', key: 'shop', width: 25, type: 'string' as const },
      { header: 'Owner', key: 'owner', width: 22, type: 'string' as const },
      { header: 'Plan Code', key: 'plan', width: 18, type: 'string' as const },
      { header: 'Billing Cycle', key: 'billingCycle', width: 16, type: 'string' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Renewal Date', key: 'renewalDate', width: 18, type: 'date' as const },
      { header: 'Amount', key: 'amount', width: 16, type: 'currency' as const },
      { header: 'Payment Status', key: 'paymentStatus', width: 16, type: 'string' as const },
      { header: 'Created Date', key: 'createdDate', width: 20, type: 'date' as const },
    ];

    return {
      title: 'PLATFORM SUBSCRIPTION & REVENUE REGISTRY',
      description: 'Merchant plan tier distribution, recurring billing dates, plan upgrades, and active subscriber registry.',
      kpis,
      tables: [
        {
          sheetName: 'Subscriptions',
          title: 'Merchant Subscription Registry',
          columns,
          rows: subRows,
          totals: { amount: subRows.reduce((s, r) => s + r.amount, 0) },
        },
      ],
      totalRecords: subRows.length,
    };
  }

  // ── 6. Shops Standard Report ──────────────────────────────────────────────────────
  private static async fetchShopsReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const snap = await db.collection('shops').get();
    let shops: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (startDate || endDate) shops = shops.filter(s => this.isWithinDateRange(s.createdAt, startDate, endDate));
    if (filters.status) shops = shops.filter(s => String(s.status || '').toLowerCase() === String(filters.status).toLowerCase());
    if (filters.search) {
      const q = filters.search.toLowerCase();
      shops = shops.filter(s => String(s.shopName || s.id).toLowerCase().includes(q) || String(s.email || '').toLowerCase().includes(q));
    }

    const rows = shops.map(s => ({
      id: s.id,
      shopName: s.shopName || s.name || s.id,
      subdomain: s.subdomain || s.slug || 'N/A',
      ownerEmail: s.email || s.ownerEmail || 'N/A',
      plan: s.subscriptionPlan || 'Free Tier',
      status: s.status || 'Active',
      createdDate: this.formatDateStr(s.createdAt),
    }));

    const kpis: KpiMetric[] = [
      { label: 'Total Registered Shops', value: shops.length },
      { label: 'Active Shops', value: shops.filter(s => s.status === 'active' || !s.status).length },
    ];

    const columns = [
      { header: 'Shop ID', key: 'id', width: 22, type: 'string' as const },
      { header: 'Shop Name', key: 'shopName', width: 25, type: 'string' as const },
      { header: 'Subdomain', key: 'subdomain', width: 20, type: 'string' as const },
      { header: 'Owner Email', key: 'ownerEmail', width: 25, type: 'string' as const },
      { header: 'Subscription Plan', key: 'plan', width: 18, type: 'string' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Created Date', key: 'createdDate', width: 20, type: 'date' as const },
    ];

    return {
      title: 'MERCHANT SHOPS REGISTRY REPORT',
      description: 'Master list of registered store tenants, subdomains, status, and subscription plans.',
      kpis,
      tables: [{ sheetName: 'Shops Master', title: 'Shops Directory', columns, rows }],
      totalRecords: rows.length,
    };
  }

  // ── 7. Users Standard Report ──────────────────────────────────────────────────────
  private static async fetchUsersReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const snap = await db.collection('users').get();
    let users: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (startDate || endDate) users = users.filter(u => this.isWithinDateRange(u.createdAt, startDate, endDate));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(u => String(u.displayName || u.name || '').toLowerCase().includes(q) || String(u.email || '').toLowerCase().includes(q));
    }

    const rows = users.map(u => ({
      uid: u.uid || u.id,
      name: u.displayName || u.name || 'User',
      email: u.email || 'N/A',
      role: u.role || u.roleId || 'Merchant Admin',
      status: u.status || 'Active',
      joinedDate: this.formatDateStr(u.createdAt),
    }));

    const kpis: KpiMetric[] = [
      { label: 'Total Platform Users', value: users.length },
      { label: 'Active User Accounts', value: users.filter(u => u.status === 'active' || !u.status).length },
    ];

    const columns = [
      { header: 'User ID', key: 'uid', width: 22, type: 'string' as const },
      { header: 'Full Name', key: 'name', width: 25, type: 'string' as const },
      { header: 'Email Address', key: 'email', width: 25, type: 'string' as const },
      { header: 'Role', key: 'role', width: 18, type: 'string' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Joined Date', key: 'joinedDate', width: 20, type: 'date' as const },
    ];

    return {
      title: 'PLATFORM USER ACCOUNTS REPORT',
      description: 'Registered user credentials, permissions, assigned roles, and status.',
      kpis,
      tables: [{ sheetName: 'Users Master', title: 'User Directory', columns, rows }],
      totalRecords: rows.length,
    };
  }

  // ── 8. Invoices Standard Report ───────────────────────────────────────────────────
  private static async fetchInvoicesReport(db: FirebaseFirestore.Firestore, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    const snap = await db.collection('invoices').get();
    let invoices: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (startDate || endDate) invoices = invoices.filter(i => this.isWithinDateRange(i.createdAt, startDate, endDate));

    const rows = invoices.map(i => ({
      invoiceNumber: i.invoiceNumber || i.id,
      shop: i.shopName || i.shopId || 'Main Store',
      customer: i.customerName || 'Customer',
      amount: Number(i.amount || i.grandTotal || 0),
      gst: Number(i.gstAmount || i.tax || 0),
      status: i.status || 'Paid',
      date: this.formatDateStr(i.createdAt),
    }));

    const kpis: KpiMetric[] = [
      { label: 'Total Invoices', value: invoices.length },
      { label: 'Total Invoiced Value', value: `₹${rows.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}` },
    ];

    const columns = [
      { header: 'Invoice #', key: 'invoiceNumber', width: 22, type: 'string' as const },
      { header: 'Shop', key: 'shop', width: 22, type: 'string' as const },
      { header: 'Customer', key: 'customer', width: 22, type: 'string' as const },
      { header: 'Amount', key: 'amount', width: 18, type: 'currency' as const },
      { header: 'GST', key: 'gst', width: 14, type: 'currency' as const },
      { header: 'Status', key: 'status', width: 15, type: 'string' as const },
      { header: 'Invoice Date', key: 'date', width: 20, type: 'date' as const },
    ];

    return {
      title: 'INVOICES & BILLING REGISTER REPORT',
      description: 'Master list of generated customer invoices, tax breakdowns, and payment statuses.',
      kpis,
      tables: [{ sheetName: 'Invoices', title: 'Invoices Register', columns, rows, totals: { amount: rows.reduce((s, r) => s + r.amount, 0) } }],
      totalRecords: rows.length,
    };
  }

  // ── 9. Generic Collection Fallback Report ─────────────────────────────────────────
  private static async fetchGenericCollectionReport(db: FirebaseFirestore.Firestore, collectionName: string, filters: any, startDate: Date | null, endDate: Date | null): Promise<ReportDataResult> {
    let docs: any[] = [];
    try {
      const snap = await db.collection(collectionName).limit(200).get();
      docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {}

    if (startDate || endDate) {
      docs = docs.filter(d => this.isWithinDateRange(d.createdAt || d.date, startDate, endDate));
    }

    const columns = docs.length > 0
      ? Object.keys(docs[0]).slice(0, 8).map(k => ({ header: k.toUpperCase(), key: k, width: 20, type: 'string' as const }))
      : [{ header: 'ID', key: 'id', width: 20, type: 'string' as const }];

    const rows = docs.map(d => {
      const row: Record<string, any> = {};
      columns.forEach(c => {
        const val = d[c.key];
        row[c.key] = typeof val === 'object' ? JSON.stringify(val) : (val !== undefined ? val : '-');
      });
      return row;
    });

    return {
      title: `${collectionName.toUpperCase()} DATA REPORT`,
      description: `Exported record snapshot for collection ${collectionName}.`,
      kpis: [{ label: 'Total Records', value: rows.length }],
      tables: [{ sheetName: collectionName.toUpperCase(), title: `${collectionName} Records`, columns, rows }],
      totalRecords: rows.length,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────────
  private static parseDate(val: any): Date {
    if (!val) return new Date(0);
    try {
      if (val.toDate && typeof val.toDate === 'function') return val.toDate();
      if (typeof val === 'number') return new Date(val);
      return new Date(val);
    } catch {
      return new Date(0);
    }
  }

  private static isWithinDateRange(dateVal: any, startDate: Date | null, endDate: Date | null): boolean {
    if (!startDate && !endDate) return true;
    const d = this.parseDate(dateVal);
    if (d.getTime() === 0) return true;

    if (startDate && d < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  }

  private static formatDateStr(val: any): string {
    const d = this.parseDate(val);
    if (d.getTime() === 0) return '—';
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0].substring(0, 5);
  }
}
