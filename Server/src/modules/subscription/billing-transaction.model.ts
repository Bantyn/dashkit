export interface BillingTransaction {
  id: string; // The Firestore document ID
  transactionId: string; // The generated transaction ID e.g., TXN-123456
  shopId: string;
  type: 'subscription' | 'extra_feature' | 'refund' | 'adjustment';
  planCode?: string;
  featureCode?: string;
  billingPeriod?: 'monthly' | 'yearly' | 'one-time';
  amount: number;
  tax?: number;
  discount?: number;
  coupon?: string;
  paymentGateway?: 'razorpay' | 'stripe' | 'manual' | 'free';
  paymentMethod?: string;
  paymentId?: string; // The ID from the payment gateway
  invoiceId?: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}
