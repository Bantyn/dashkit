export interface Invoice {
  id: string;
  shopId: string;
  branchId?: string;
  customerId: string;
  employeeId?: string;
  employeeName?: string;
  employeeRole?: string;
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
  invoiceNumber: string;
  invoiceDate: Date;
  date?: Date;
  dueDate?: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  isInterstate: boolean;
  discount: number;
  appliedCredit?: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi" | "credit";
  paymentStatus: "paid" | "pending" | "partial";
  paidAmount: number;
  notes?: string;
  pdfUrl?: string;
  sentVia: ("email" | "whatsapp")[];
  status: "draft" | "sent" | "paid" | "cancelled";
  invoiceType?: "retail" | "wholesale";
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  productName: string;
  variantDetails?: {
    size?: string;
    color?: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxableValue: number;
  total: number;
}

export interface Subscription {
  id: string;
  shopId: string;
  plan: "free" | "plus" | "pro" | "custom";
  status: "active" | "cancelled" | "expired" | "trial";
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  amount: number;
  paymentMethod?: string;
  features: SubscriptionFeatures;
  autoRenew: boolean;
  createdAt: Date;
}

export interface SubscriptionFeatures {
  maxInvoices: number;
  storefront: boolean;
  analytics: boolean;
  seo: boolean;
  employees: number;
}
