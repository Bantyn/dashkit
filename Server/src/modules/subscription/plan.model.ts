export interface PlanLimits {
  [key: string]: number | null | undefined;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number | null;
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  currency: string;
  features: string[];
  limits: PlanLimits;
  badge?: string;
  targetAudience?: string;
  capabilityLabel?: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  limitations?: string[];
  metadata?: Record<string, any>;
  /**
   * Razorpay Plan IDs for recurring subscription billing.
   * Created lazily via Razorpay Plans API on first AutoPay setup.
   */
  includedStorageBytes?: number;
  includedStorageMB?: number;
  storageUnit?: 'MB' | 'GB';
  storageDisplay?: string;
  razorpayPlanId?: {
    monthly?: string;
    yearly?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
