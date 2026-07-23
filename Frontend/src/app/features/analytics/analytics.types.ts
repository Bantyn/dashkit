export type AnalyticsPageKey = 'sales' | 'customers' | 'products' | 'branches';

export type AnalyticsSummaryCard = {
  label: string;
  value: string;
  change: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
};

export type AnalyticsChartSeries = {
  label: string;
  data: number[];
  color: string;
  fill?: boolean;
};

export type AnalyticsTableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
};

export type AnalyticsTableRow = Record<string, string | number>;

export type AnalyticsDefinition = {
  key: AnalyticsPageKey;
  title: string;
  subtitle: string;
  description: string;
  permission: string;
  feature: string;
  chartType: 'line' | 'bar' | 'doughnut';
  chartTitle: string;
  chartSubtitle: string;
  labels: string[];
  series: AnalyticsChartSeries[];
  summaryCards: AnalyticsSummaryCard[];
  branchOptions: Array<{ label: string; value: string }>;
  insights: string[];
  columns: AnalyticsTableColumn[];
  rows: AnalyticsTableRow[];
  emptyTitle: string;
  emptyDescription: string;
};

export type AnalyticsFilters = {
  dateRange: string;
  branch: string;
};
