export interface User {
  id?: string;
  uid: string;
  email: string;
  phone?: string;
  name: string;
  shopId?: string;
  roleId?: string;
  planId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  lastLoginAt?: Date;
  displayName?: string;
  mobile?: string;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  isBlocked?: boolean;
  kycStatus?: "pending" | "verified" | "rejected";
  gstNumber?: string;
  panNumber?: string;
  metadata?: Record<string, any>;
}
