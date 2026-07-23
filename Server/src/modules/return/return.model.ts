export interface ReturnRequest {
  id: string;
  shopId: string;
  invoiceId?: string;
  orderId?: string;
  invoiceNumber: string;
  displayId?: string;
  customerId: string;
  customerName: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  paymentStatus?: "pending" | "refunded" | "failed";
  paymentMethod?: string;
  staffId: string;
  createdAt: Date;
  updatedAt: Date;
  date?: Date;
}

export interface ReturnItem {
  productId: string;
  variantSku?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}
