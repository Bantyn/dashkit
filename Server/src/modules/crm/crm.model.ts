export type CustomerSegment = 'vip' | 'loyal' | 'regular' | 'new' | 'at_risk';

export interface CRMCustomer {
  id: string;
  shopId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;      // YYYY-MM-DD
  anniversaryDate?: string;  // YYYY-MM-DD
  totalOrders: number;
  totalSpent: number;
  lastPurchase?: string;
  segment: CustomerSegment;
  loyaltyPoints?: number;
  tags?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface SegmentSummary {
  segment: CustomerSegment;
  count: number;
  totalRevenue: number;
  avgOrderValue: number;
  label: string;
  color: string;
  description: string;
}

export interface BirthdayEntry {
  customerId: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  age?: number;
  totalSpent: number;
  totalOrders: number;
  segment: CustomerSegment;
}

export interface AnniversaryEntry {
  customerId: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  anniversaryDate: string;
  yearsCompleted?: number;
  totalSpent: number;
  totalOrders: number;
  segment: CustomerSegment;
}
