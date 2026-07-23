export interface CreditNote {
  id: string;
  shopId: string;
  orderId?: string;
  invoiceId?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  convertedToCredit: boolean;
  creditTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
