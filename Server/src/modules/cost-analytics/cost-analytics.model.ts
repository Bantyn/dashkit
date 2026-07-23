export interface PricingTier {
  fromUnit: number;
  toUnit: number; // -1 for infinity
  price: number;
}

export interface CreditConversion {
  creditCost: number; // e.g. 1 credit = 1000 transformations
  pricePerCredit: number;
}

export interface ServicePricing {
  id: string;
  provider: string;
  service: string;
  name: string;
  category: string;
  billingType: 'usage' | 'fixed' | 'credit' | 'tiered';
  unit: string;
  freeQuota: number;
  freeQuotaPeriod: 'daily' | 'monthly' | 'lifetime' | 'none';
  currency: string;
  region: string;
  price: number;
  pricePerUnit: number;
  minimumCharge: number;
  
  // Advanced features
  tiers?: PricingTier[];
  creditConfig?: CreditConversion;
  
  // Versioning and Auditing
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  lastVerified: Date;
  verifiedBy: string;
  pricingSource: string;
  pricingType: 'Official' | 'Estimated' | 'Business Configured' | 'Legacy';
  
  verifiedAt: Date;
  officialDocumentation: string;
  notes: string;
  status: 'active' | 'deprecated';
  gstPercent?: number; // Kept for backwards compatibility in breakdowns
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface PricingHistoryLog {
  id: string;
  service: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  oldFreeQuota: number;
  newFreeQuota: number;
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
  version: number;
}

export interface CostAlert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  shopId?: string;
  shopName?: string;
  metric?: string;
  threshold?: number;
  valueValue?: number;
  createdAt: Date;
  isResolved: boolean;
}

export interface ServiceCostBreakdown {
  serviceName: string;
  displayName: string;
  unit: string;
  unitsConsumed: number;
  freeTierOffset: number;
  billableUnits: number;
  rate: number;
  gstPercent: number;
  subtotal: number;
  taxAmount: number;
  totalCost: number;
  currency: string;
  metricClassification: "Actual Application Operations" | "Provider Measured Usage" | "Estimated Usage";
}

export interface ShopCostDetail {
  shopId: string;
  shopName: string;
  planName: string;
  status: string;
  subscriptionRevenue: number; // MRR
  firestoreReads: number;
  firestoreWrites: number;
  firestoreDeletes: number;
  storageBytes: number;
  bandwidthBytes: number;
  estimatedFirestoreCost: number;
  estimatedStorageCost: number;
  estimatedCloudinaryCost: number;
  estimatedHostingCost: number;
  estimatedGatewayCharges: number;
  estimatedEmailCost: number;
  estimatedSmsCost: number;
  estimatedFunctionsCost?: number;
  estimatedSchedulerCost?: number;
  estimatedPhoneAuthCost?: number;
  estimatedTotalCost: number;
  grossMargin: number; // Subscription Revenue - Cost
  profit: number; // Gross Margin (assuming simple model)
  marginPercent: number;
  createdAt: Date;
}
