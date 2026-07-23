export interface SaleReturn {
  id: string;
  shopId: string;
  orderId?: string;
  invoiceId?: string;
  displayId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: SaleReturnItem[];
  totalRefundAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'refunded' | 'failed';
  paymentMethod: string;
  createdAt: any;
  updatedAt: any;
  date: any;
}

export interface SaleReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  variantDetails?: {
    size?: string;
    color?: string;
  };
}
