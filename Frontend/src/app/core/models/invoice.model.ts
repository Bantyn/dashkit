export interface Invoice {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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
  invoiceType?: 'retail' | 'wholesale';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  appliedCredit?: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount: number;
  paymentDetails?: any;
  paymentProof?: string;
  upiTransactionId?: string;
  notes?: string;
  pdfUrl?: string;
  sentVia: ('email' | 'whatsapp')[];
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  productName: string;
  name?: string;
  status: 'paid' | 'pending' | 'partial';
  // paymentStatus: 'paid' | 'pending' | 'partial';

  variantDetails?: {
    size?: string;
    color?: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}
