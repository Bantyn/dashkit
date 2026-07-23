export interface Supplier {
  id?: string;
  shopId: string;
  name: string;
  email: string;
  phone: string;
  gstin?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  variantSku: string;
  variantName: string;
  quantity: number;
  costPrice: number;
  amount: number;
}

export interface PurchaseOrder {
  id?: string;
  shopId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "ordered" | "received" | "partially_received" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoodsReceivedItem {
  productId: string;
  productName: string;
  variantSku: string;
  variantName: string;
  orderedQty: number;
  receivedQty: number;
}

export interface GoodsReceivedNote {
  id?: string;
  shopId: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedDate: Date;
  items: GoodsReceivedItem[];
  notes?: string;
  createdAt: Date;
}

export interface SupplierPayment {
  id?: string;
  shopId: string;
  paymentNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: "cash" | "bank_transfer" | "upi" | "card" | "online";
  referenceNo?: string;
  createdAt: Date;
}

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  variantSku: string;
  variantName: string;
  returnQty: number;
  costPrice: number;
  amount: number;
}

export interface PurchaseReturn {
  id?: string;
  shopId: string;
  returnNumber: string;
  purchaseOrderId?: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseReturnItem[];
  totalAmount: number;
  returnDate: Date;
  notes?: string;
  createdAt: Date;
}
