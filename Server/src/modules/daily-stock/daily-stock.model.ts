export interface DailyStockEntry {
  productId: string;
  productName: string;
  systemStock: number;
  openingCount?: number;
  openingStock?: number;
  physicalCount?: number;
  variance?: number;           // computed and stored: physicalCount - systemStock (closing) or openingCount - systemStock (opening)
  sku?: string;
}

export interface DailyStockRecord {
  id: string;
  shopId: string;
  date: string;                // YYYY-MM-DD
  type: "opening" | "closing";
  entries: DailyStockEntry[];
  autoAdjust?: boolean;
  notes?: string;
  submittedBy?: string;
  totalVariance?: number;      // sum of all per-entry variances
  createdAt: Date;
  updatedAt: Date;
}
