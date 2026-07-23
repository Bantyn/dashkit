export type ReportKey = 'sales' | 'website-sales' | 'inventory' | 'profit-loss' | 'tax';

export type ReportMetric = {
  label: string;
  value: string;
  hint: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
  icon: string;
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
};

export type ReportRow = Record<string, string | number>;

export type ReportSeries = {
  label: string;
  data: number[];
  color: string;
  fill?: boolean;
};

export type ReportDefinition = {
  key: ReportKey;
  title: string;
  subtitle: string;
  description: string;
  permission: string;
  exportPermission: string;
  actionPermission: string;
  actionLabel: string;
  feature: string;
  chartType: 'line' | 'bar' | 'doughnut';
  chartTitle: string;
  chartSubtitle: string;
  labels: string[];
  series: ReportSeries[];
  metrics: ReportMetric[];
  highlights: string[];
  segmentOptions: Array<{ label: string; value: string }>;
  channelOptions: Array<{ label: string; value: string }>;
  columns: ReportColumn[];
  rows: ReportRow[];
};

export const REPORT_NAV_ITEMS: Array<{
  key: ReportKey;
  label: string;
  route: string;
  permission: string;
  feature: string;
}> = [
  {
    key: 'sales',
    label: 'Sales Report',
    route: '/reports/sales',
    permission: 'reports.sales.view',
    feature: 'analytics_sales',
  },
  {
    key: 'website-sales',
    label: 'Website Sales',
    route: '/reports/website-sales',
    permission: 'reports.website_sales.view',
    feature: 'web_storefront',
  },
  {
    key: 'inventory',
    label: 'Inventory Report',
    route: '/reports/inventory',
    permission: 'reports.inventory.view',
    feature: 'inv_reports',
  },
  {
    key: 'profit-loss',
    label: 'Profit & Loss',
    route: '/reports/profit-loss',
    permission: 'reports.profit_loss.view',
    feature: 'fin_pnl_report',
  },
  {
    key: 'tax',
    label: 'Tax Report',
    route: '/reports/tax',
    permission: 'reports.tax.view',
    feature: 'fin_tax_report',
  },
];

export const REPORT_DEFINITIONS: Record<ReportKey, ReportDefinition> = {
  sales: {
    key: 'sales',
    title: 'Sales Report',
    subtitle: 'Store revenue, order movement, and collection quality.',
    description:
      'Review sales performance with reusable filters, export-ready rows, and permission-aware actions tailored for the shop workspace.',
    permission: 'reports.sales.view',
    exportPermission: 'reports.sales.export',
    actionPermission: 'reports.sales.schedule',
    actionLabel: 'Schedule Summary',
    feature: 'analytics_sales',
    chartType: 'line',
    chartTitle: 'Sales Trend',
    chartSubtitle: 'Gross sales and received amount over the selected range.',
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    series: [
      { label: 'Gross Sales', data: [120, 144, 136, 168, 182, 194], color: '#7379e8', fill: true },
      { label: 'Amount Received', data: [96, 112, 108, 138, 151, 160], color: '#0ea5e9' },
    ],
    metrics: [
      { label: 'Gross Revenue', value: 'Rs. 19.4L', hint: '+10.8% vs previous period', tone: 'primary', icon: 'bi-currency-rupee' },
      { label: 'Collected', value: 'Rs. 16.0L', hint: 'Collection efficiency 97.2%', tone: 'success', icon: 'bi-wallet2' },
      { label: 'Refund Rate', value: '1.4%', hint: 'Stable across channels', tone: 'warning', icon: 'bi-arrow-counterclockwise' },
      { label: 'Average Order', value: 'Rs. 1,860', hint: 'Across 1,042 orders', tone: 'neutral', icon: 'bi-bag-check' },
    ],
    highlights: ['Top segment: Repeat customers', 'Best day: Saturday', 'Most sold line: Summer shirts'],
    segmentOptions: [
      { label: 'All Channels', value: 'all' },
      { label: 'POS Counter', value: 'pos' },
      { label: 'Phone Orders', value: 'phone' },
      { label: 'Mixed', value: 'mixed' },
    ],
    channelOptions: [
      { label: 'All Branches', value: 'all' },
      { label: 'Main Store', value: 'main' },
      { label: 'Annex', value: 'annex' },
      { label: 'Warehouse Desk', value: 'warehouse' },
    ],
    columns: [
      { key: 'period', label: 'Period' },
      { key: 'orders', label: 'Orders', align: 'right' },
      { key: 'grossSales', label: 'Gross Sales', align: 'right' },
      { key: 'discounts', label: 'Discounts', align: 'right' },
      { key: 'netSales', label: 'Net Sales', align: 'right' },
    ],
    rows: [
      { period: 'Week 1', orders: 156, grossSales: 'Rs. 3.1L', discounts: 'Rs. 0.18L', netSales: 'Rs. 2.92L' },
      { period: 'Week 2', orders: 170, grossSales: 'Rs. 3.5L', discounts: 'Rs. 0.21L', netSales: 'Rs. 3.29L' },
      { period: 'Week 3', orders: 164, grossSales: 'Rs. 3.3L', discounts: 'Rs. 0.20L', netSales: 'Rs. 3.10L' },
      { period: 'Week 4', orders: 182, grossSales: 'Rs. 3.9L', discounts: 'Rs. 0.24L', netSales: 'Rs. 3.66L' },
      { period: 'Week 5', orders: 193, grossSales: 'Rs. 4.1L', discounts: 'Rs. 0.27L', netSales: 'Rs. 3.83L' },
    ],
  },
  'website-sales': {
    key: 'website-sales',
    title: 'Website Sales',
    subtitle: 'Direct website performance, conversion flow, and acquisition mix.',
    description:
      'Measure storefront sales with campaign-aware filters, visual conversion tracking, and export support for web operations.',
    permission: 'reports.website_sales.view',
    exportPermission: 'reports.website_sales.export',
    actionPermission: 'reports.website_sales.pin',
    actionLabel: 'Pin To Dashboard',
    feature: 'web_storefront',
    chartType: 'bar',
    chartTitle: 'Website Orders By Source',
    chartSubtitle: 'Orders grouped by acquisition source for the selected date range.',
    labels: ['Organic', 'Instagram', 'Google', 'WhatsApp', 'Referral', 'Direct'],
    series: [{ label: 'Orders', data: [42, 58, 51, 33, 14, 68], color: '#5f65d8', fill: true }],
    metrics: [
      { label: 'Website Revenue', value: 'Rs. 8.6L', hint: '+6.4% vs previous period', tone: 'primary', icon: 'bi-globe2' },
      { label: 'Conversion Rate', value: '3.7%', hint: '17,240 sessions measured', tone: 'success', icon: 'bi-graph-up-arrow' },
      { label: 'Recovered Carts', value: '21', hint: 'Email and WhatsApp flows active', tone: 'neutral', icon: 'bi-cart-plus' },
      { label: 'ROAS', value: '4.1x', hint: 'Paid traffic efficiency', tone: 'warning', icon: 'bi-bullseye' },
    ],
    highlights: ['Top campaign: Festive drop', 'Highest conversion device: Mobile', 'Best source: Direct returning visitors'],
    segmentOptions: [
      { label: 'All Traffic', value: 'all' },
      { label: 'Paid', value: 'paid' },
      { label: 'Organic', value: 'organic' },
      { label: 'Retention', value: 'retention' },
    ],
    channelOptions: [
      { label: 'All Devices', value: 'all' },
      { label: 'Mobile', value: 'mobile' },
      { label: 'Desktop', value: 'desktop' },
      { label: 'Tablet', value: 'tablet' },
    ],
    columns: [
      { key: 'source', label: 'Source' },
      { key: 'sessions', label: 'Sessions', align: 'right' },
      { key: 'orders', label: 'Orders', align: 'right' },
      { key: 'conversion', label: 'Conversion', align: 'right' },
      { key: 'revenue', label: 'Revenue', align: 'right' },
    ],
    rows: [
      { source: 'Organic Search', sessions: 4280, orders: 42, conversion: '3.4%', revenue: 'Rs. 1.6L' },
      { source: 'Instagram Ads', sessions: 3890, orders: 58, conversion: '4.1%', revenue: 'Rs. 2.0L' },
      { source: 'Google Ads', sessions: 3310, orders: 51, conversion: '3.8%', revenue: 'Rs. 1.8L' },
      { source: 'WhatsApp Broadcast', sessions: 1420, orders: 33, conversion: '5.2%', revenue: 'Rs. 1.1L' },
      { source: 'Direct', sessions: 2960, orders: 68, conversion: '4.9%', revenue: 'Rs. 2.1L' },
    ],
  },
  inventory: {
    key: 'inventory',
    title: 'Inventory Report',
    subtitle: 'Stock pressure, sell-through, and replenishment readiness.',
    description:
      'Spot low stock and slow movers with operational filters, warehouse-aware summaries, and exportable inventory rows.',
    permission: 'reports.inventory.view',
    exportPermission: 'reports.inventory.export',
    actionPermission: 'reports.inventory.restock',
    actionLabel: 'Create Restock Note',
    feature: 'inv_reports',
    chartType: 'bar',
    chartTitle: 'Available Units Vs Reorder Level',
    chartSubtitle: 'Current category stock compared to reorder thresholds.',
    labels: ['Shirts', 'Denim', 'Ethnic', 'Kids', 'Accessories', 'Footwear'],
    series: [
      { label: 'Available', data: [280, 164, 138, 121, 92, 110], color: '#0f766e', fill: true },
      { label: 'Reorder Level', data: [140, 100, 90, 74, 48, 62], color: '#f59e0b' },
    ],
    metrics: [
      { label: 'Sell Through', value: '69%', hint: 'Across active catalogue', tone: 'success', icon: 'bi-box-seam' },
      { label: 'Low Stock SKUs', value: '12', hint: 'Requires review this week', tone: 'warning', icon: 'bi-exclamation-diamond' },
      { label: 'Dead Stock Value', value: 'Rs. 1.1L', hint: 'No movement in 60+ days', tone: 'neutral', icon: 'bi-archive' },
      { label: 'Inbound Units', value: '640', hint: 'Expected within 5 days', tone: 'primary', icon: 'bi-truck' },
    ],
    highlights: ['Fastest moving: Premium chinos', 'Critical branch: Main floor rack B', 'Restock SLA: 3.8 days'],
    segmentOptions: [
      { label: 'All Categories', value: 'all' },
      { label: 'Men', value: 'men' },
      { label: 'Women', value: 'women' },
      { label: 'Kids', value: 'kids' },
      { label: 'Accessories', value: 'accessories' },
    ],
    channelOptions: [
      { label: 'All Stock Points', value: 'all' },
      { label: 'Main Store', value: 'main' },
      { label: 'Backroom', value: 'backroom' },
      { label: 'Warehouse', value: 'warehouse' },
    ],
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'available', label: 'Available', align: 'right' },
      { key: 'reserved', label: 'Reserved', align: 'right' },
      { key: 'reorder', label: 'Reorder Level', align: 'right' },
    ],
    rows: [
      { sku: 'CF-SH-101', category: 'Shirts', available: 48, reserved: 8, reorder: 20 },
      { sku: 'CF-DN-220', category: 'Denim', available: 27, reserved: 5, reorder: 18 },
      { sku: 'CF-ET-041', category: 'Ethnic', available: 19, reserved: 3, reorder: 14 },
      { sku: 'CF-KD-304', category: 'Kids', available: 22, reserved: 4, reorder: 12 },
      { sku: 'CF-AC-017', category: 'Accessories', available: 31, reserved: 6, reorder: 10 },
    ],
  },
  'profit-loss': {
    key: 'profit-loss',
    title: 'Profit & Loss',
    subtitle: 'Revenue, operating cost, and margin behaviour over time.',
    description:
      'Track profitability with store-focused metrics, finance-friendly summaries, and quick export actions for monthly reviews.',
    permission: 'reports.profit_loss.view',
    exportPermission: 'reports.profit_loss.export',
    actionPermission: 'reports.profit_loss.approve',
    actionLabel: 'Approve Variance Note',
    feature: 'fin_pnl_report',
    chartType: 'line',
    chartTitle: 'Profitability Trend',
    chartSubtitle: 'Revenue, cost, and net profit across the selected months.',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      { label: 'Revenue', data: [5.1, 5.4, 5.8, 6.2, 6.6, 6.9], color: '#2563eb', fill: true },
      { label: 'Operating Cost', data: [3.2, 3.4, 3.5, 3.7, 3.9, 4.0], color: '#ef4444' },
      { label: 'Net Profit', data: [1.2, 1.3, 1.5, 1.7, 1.8, 1.9], color: '#16a34a' },
    ],
    metrics: [
      { label: 'Net Profit', value: 'Rs. 1.9L', hint: 'Margin improved to 27.5%', tone: 'success', icon: 'bi-graph-up' },
      { label: 'COGS', value: 'Rs. 2.8L', hint: 'Fabric cost controlled', tone: 'neutral', icon: 'bi-scissors' },
      { label: 'Operating Cost', value: 'Rs. 1.2L', hint: 'Marketing within plan', tone: 'warning', icon: 'bi-cash-stack' },
      { label: 'Contribution', value: 'Rs. 3.1L', hint: 'Before fixed overhead', tone: 'primary', icon: 'bi-pie-chart' },
    ],
    highlights: ['Best month: June', 'Main driver: higher full-price sales', 'Largest cost swing: ad spend'],
    segmentOptions: [
      { label: 'All Units', value: 'all' },
      { label: 'Retail Floor', value: 'retail' },
      { label: 'Warehouse', value: 'warehouse' },
      { label: 'Website', value: 'website' },
    ],
    channelOptions: [
      { label: 'All Cost Buckets', value: 'all' },
      { label: 'COGS', value: 'cogs' },
      { label: 'Marketing', value: 'marketing' },
      { label: 'Operations', value: 'operations' },
    ],
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'revenue', label: 'Revenue', align: 'right' },
      { key: 'cogs', label: 'COGS', align: 'right' },
      { key: 'opex', label: 'OpEx', align: 'right' },
      { key: 'profit', label: 'Net Profit', align: 'right' },
    ],
    rows: [
      { month: 'Jan', revenue: 'Rs. 5.1L', cogs: 'Rs. 2.1L', opex: 'Rs. 0.8L', profit: 'Rs. 1.2L' },
      { month: 'Feb', revenue: 'Rs. 5.4L', cogs: 'Rs. 2.2L', opex: 'Rs. 0.9L', profit: 'Rs. 1.3L' },
      { month: 'Mar', revenue: 'Rs. 5.8L', cogs: 'Rs. 2.3L', opex: 'Rs. 0.9L', profit: 'Rs. 1.5L' },
      { month: 'Apr', revenue: 'Rs. 6.2L', cogs: 'Rs. 2.5L', opex: 'Rs. 1.0L', profit: 'Rs. 1.7L' },
      { month: 'May', revenue: 'Rs. 6.6L', cogs: 'Rs. 2.7L', opex: 'Rs. 1.0L', profit: 'Rs. 1.8L' },
    ],
  },
  tax: {
    key: 'tax',
    title: 'Tax Report',
    subtitle: 'GST summary, liabilities, and reconciliation checkpoints.',
    description:
      'Keep filing prep under control with state-aware tax rows, liability highlights, and permission-aware export actions.',
    permission: 'reports.tax.view',
    exportPermission: 'reports.tax.export',
    actionPermission: 'reports.tax.file',
    actionLabel: 'Mark Filing Ready',
    feature: 'fin_tax_report',
    chartType: 'doughnut',
    chartTitle: 'Tax Mix',
    chartSubtitle: 'Distribution of tax liability across tax buckets.',
    labels: ['CGST', 'SGST', 'IGST', 'CESS'],
    series: [{ label: 'Liability', data: [32, 32, 28, 8], color: '#7c3aed', fill: true }],
    metrics: [
      { label: 'Taxable Revenue', value: 'Rs. 12.7L', hint: 'Current filing window', tone: 'primary', icon: 'bi-receipt-cutoff' },
      { label: 'GST Liability', value: 'Rs. 2.2L', hint: 'Includes interstate invoices', tone: 'warning', icon: 'bi-bank' },
      { label: 'Input Credit', value: 'Rs. 0.64L', hint: 'Verified purchases only', tone: 'success', icon: 'bi-check2-circle' },
      { label: 'Pending Reco', value: '04', hint: 'Needs finance review', tone: 'neutral', icon: 'bi-journal-check' },
    ],
    highlights: ['Highest liability state: Delhi', 'Mismatch alerts: 2 vendor bills', 'Return status: Draft ready'],
    segmentOptions: [
      { label: 'All Regimes', value: 'all' },
      { label: 'Intrastate', value: 'intrastate' },
      { label: 'Interstate', value: 'interstate' },
      { label: 'Exports', value: 'exports' },
    ],
    channelOptions: [
      { label: 'All States', value: 'all' },
      { label: 'Delhi', value: 'dl' },
      { label: 'Haryana', value: 'hr' },
      { label: 'UP', value: 'up' },
      { label: 'Rajasthan', value: 'rj' },
    ],
    columns: [
      { key: 'state', label: 'State' },
      { key: 'taxableSales', label: 'Taxable Sales', align: 'right' },
      { key: 'outputTax', label: 'Output Tax', align: 'right' },
      { key: 'inputCredit', label: 'Input Credit', align: 'right' },
      { key: 'netPayable', label: 'Net Payable', align: 'right' },
    ],
    rows: [
      { state: 'Delhi', taxableSales: 'Rs. 3.4L', outputTax: 'Rs. 0.61L', inputCredit: 'Rs. 0.19L', netPayable: 'Rs. 0.42L' },
      { state: 'Haryana', taxableSales: 'Rs. 2.8L', outputTax: 'Rs. 0.50L', inputCredit: 'Rs. 0.12L', netPayable: 'Rs. 0.38L' },
      { state: 'UP', taxableSales: 'Rs. 2.3L', outputTax: 'Rs. 0.41L', inputCredit: 'Rs. 0.11L', netPayable: 'Rs. 0.30L' },
      { state: 'Rajasthan', taxableSales: 'Rs. 1.9L', outputTax: 'Rs. 0.34L', inputCredit: 'Rs. 0.10L', netPayable: 'Rs. 0.24L' },
      { state: 'Others', taxableSales: 'Rs. 2.3L', outputTax: 'Rs. 0.34L', inputCredit: 'Rs. 0.12L', netPayable: 'Rs. 0.22L' },
    ],
  },
};
