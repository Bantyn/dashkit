export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'other';
export type EntryType = 'debit' | 'credit';
export type EntrySource =
  | 'invoice'
  | 'expense'
  | 'return'
  | 'credit_note'
  | 'purchase_order'
  | 'manual'
  | 'supplier_payment';

export interface LedgerEntry {
  id: string;
  shopId: string;
  date: string; // ISO date string YYYY-MM-DD
  narration: string;
  type: EntryType; // credit = money in, debit = money out
  source: EntrySource;
  sourceId: string; // invoiceId / expenseId etc.
  amount: number;
  balance?: number; // running balance (computed)
  paymentMethod: PaymentMethod;
  bankName?: string;
  referenceNo?: string;
  partyName?: string; // customer or supplier name
  partyId?: string;
  createdAt: Date;
}

export interface AccountingSummary {
  totalCashIn: number;
  totalCashOut: number;
  totalBankIn: number;
  totalBankOut: number;
  netBalance: number;
  cashBalance: number;
  bankBalance: number;
}

export interface ReceivableEntry {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  paymentStatus: string;
  agingDays: number; // how many days overdue
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface PayableEntry {
  purchaseOrderId: string;
  supplierId?: string;
  supplierName: string;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  agingDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface GSTReportRow {
  taxBucket: 'CGST' | 'SGST' | 'IGST' | 'Total';
  taxableSales: number;
  taxAmount: number;
  effectiveRate: string;
}

export interface GSTReport {
  summary: {
    totalTaxableRevenue: number;
    totalOutputTax: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    effectiveTaxRate: string;
    taxableInvoiceCount: number;
  };
  rows: GSTReportRow[];
  period: string;
}
