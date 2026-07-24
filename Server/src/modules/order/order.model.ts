export interface Order {
  id: string;
  shopId: string;
  customerId: string;
  products?: OrderProduct[];
  items?: OrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: 
    | "pending"
    | "pending_shop_confirmation"
    | "rejected_by_shop"
    | "ready_for_delivery_assignment"
    | "waiting_for_delivery_acceptance"
    | "delivery_accepted"
    | "rejected_by_delivery"
    | "reached_store"
    | "picked_up"
    | "out_for_delivery"
    | "reached_customer"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentMethod: "cod" | "online" | "credit";
  shippingAddress: any;
  customerEmail?: string;
  assignedDeliveryStaffId?: string;
  assignedDeliveryStaffName?: string;
  assignedDeliveryStaffPhone?: string;
  shopRejectionReason?: string;
  deliveryRejectionReason?: string;
  deliveryOtp?: string;
  deliveryTimeline?: Array<{
    status: string;
    timestamp: Date;
    note?: string;
    actor?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProduct {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantSku?: string;
  quantity: number;
  price: number;
  total: number;
}
