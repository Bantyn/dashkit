export interface Order {
  id: string;
  shopId: string;
  customerId: string;
  products?: OrderProduct[];
  items?: OrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cod" | "online" | "credit";
  shippingAddress: any;
  customerEmail?: string;
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
