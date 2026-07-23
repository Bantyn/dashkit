export interface ShopRequest {
  id?: string;
  shopId: string;
  shopName: string;
  type: "deactivation" | "reactivation";
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
