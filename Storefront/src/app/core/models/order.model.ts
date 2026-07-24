export interface Order {
  id: string;
  shopId: string;
  customerId: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus:
    | 'pending'
    | 'pending_shop_confirmation'
    | 'rejected_by_shop'
    | 'ready_for_delivery_assignment'
    | 'waiting_for_delivery_acceptance'
    | 'delivery_accepted'
    | 'rejected_by_delivery'
    | 'reached_store'
    | 'picked_up'
    | 'out_for_delivery'
    | 'reached_customer'
    | 'confirmed'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  paymentMethod: 'cod' | 'online' | 'bankTransfer' | 'credit';
  shippingAddress: any;
  carrier?: string;
  trackingNumber?: string;
  shippingDetails?: {
    carrier?: string;
    trackingNumber?: string;
  };
  razorpayOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProduct {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  variant?: {
    size?: string;
    color?: string;
  };
}
