export type CustomPlanRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUOTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'REGISTRATION_PENDING'
  | 'SHOP_REGISTERED'
  | 'CANCELLED';

export interface CustomPlanActivity {
  status: CustomPlanRequestStatus;
  note?: string;
  performedBy?: string; // admin uid or 'system'
  timestamp: Date;
}

export interface CustomPlanRequest {
  id: string;
  // Contact info from pricing form
  contactName: string;
  shopName: string;
  email: string;
  phone: string;
  // Features selected on pricing page
  selectedFeatures: string[];
  estimatedMonthlyPrice?: number;
  // Admin-filled fields
  finalPrice?: number;
  billingCycle?: 'monthly' | 'yearly';
  adminNote?: string;
  quoteGeneratedAt?: Date;
  // Payment
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentId?: string;
  paymentCompletedAt?: Date;
  // Registration
  registrationToken?: string;
  registrationTokenExpiresAt?: Date;
  registrationTokenUsed?: boolean;
  shopId?: string; // set after shop created
  // Lifecycle
  status: CustomPlanRequestStatus;
  activityLog?: CustomPlanActivity[];
  createdAt: Date;
  updatedAt: Date;
}
