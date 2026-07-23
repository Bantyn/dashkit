export interface CustomerAddress {
  id?: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchase: Date;
  source?: "online" | "pos";
  userId?: string;
  dateOfBirth?: string | Date;
  wishlist?: string[]; // Array of product IDs
  addresses?: CustomerAddress[];
  createdAt: Date;
  updatedAt: Date;
}
