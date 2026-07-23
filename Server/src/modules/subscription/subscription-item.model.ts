export type SubscriptionItemType = 'feature_addon' | 'limit_addon' | 'base_plan';
export type SubscriptionItemStatus = 'pending_payment' | 'active' | 'cancelled' | 'expired' | 'failed';

export interface SubscriptionItem {
  id: string;
  shopId: string;
  type: SubscriptionItemType;
  // The feature key (acc_receivables), limit key (staff_count), or plan code (growth)
  itemKey: string;
  name: string;
  description?: string;
  price: number;             // Monthly recurring price in INR (or relevant currency)
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  quantity: number;          // For limit add-ons (e.g., 2 extra staff slots)
  status: SubscriptionItemStatus;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'free';
  // Proration fields
  proratedAmount: number;    // Immediate charge for remaining billing period
  proratedDays: number;      // Number of days remaining in current billing period
  // Dates
  activatedAt?: Date;
  purchasedAt?: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  // Payment tracking
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentLinkExpiresAt?: Date;
  paymentId?: string;
  razorpayOrderId?: string;
  invoiceRef?: string;
  // Behaviour flags
  recurringEnabled: boolean;
  isDeleted: boolean;
  // Admin metadata
  createdBy?: string;
  cancelledBy?: string;
  notes?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
