export interface Order {
  id: string;
  shopId: string;
  customerId: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'online' | 'bankTransfer';
  shippingAddress: any;
  carrier?: string;
  trackingNumber?: string;
  shippingDetails?: {
    carrier?: string;
    trackingNumber?: string;
  };
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
