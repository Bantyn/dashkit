import { Invoice } from "../../../modules/invoice/invoice.model";

export interface IInvoiceRepository {
  generateId(): string;
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | null>;
  updateInvoice(id: string, payload: any): Promise<void>;
  deleteInvoice(id: string): Promise<void>;
  getInvoicesByShop(shopId: string, employeeId?: string, branchId?: string): Promise<Invoice[]>;
  getInvoicesByCustomer(customerId: string): Promise<Invoice[]>;

  // Database-independent Transaction Operations
  getTransactionShop(transaction: any, shopId: string): Promise<any>;
  getTransactionCustomer(transaction: any, shopId: string, phone: string): Promise<any>;
  getTransactionProducts(transaction: any, productIds: string[]): Promise<any[]>;
  getTransactionInventoryItems(transaction: any, shopId: string, items: { productId: string; variantSku: string }[]): Promise<any[]>;
  createTransactionInvoice(transaction: any, invoice: Invoice): Promise<void>;
  updateTransactionCustomer(transaction: any, customerId: string, customerData: any, existingData?: any): Promise<void>;
  createTransactionCustomer(transaction: any, customer: any): Promise<void>;
  updateTransactionInventory(transaction: any, invId: string, stock: number, existingData?: any): Promise<void>;
  createTransactionHistory(transaction: any, historyRecord: any): Promise<void>;
  updateTransactionProduct(transaction: any, productId: string, productUpdate: any, existingData?: any): Promise<void>;
  // Batch parallel inventory+product update (implemented by each provider as appropriate)
  batchUpdateTransactionInventoryAndProducts(
    transaction: any,
    updates: Array<{
      invId: string;
      newStock: number;
      existingInvData: any;
      productId: string;
      productUpdate: any;
      existingProductData: any;
      historyRecord: any;
    }>
  ): Promise<void>;
}

