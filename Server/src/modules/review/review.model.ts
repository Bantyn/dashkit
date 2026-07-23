export interface Review {
  id: string;
  shopId: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
