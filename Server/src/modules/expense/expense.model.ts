export interface Expense {
  id: string;
  shopId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNo?: string;
  createdBy?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
