import { Invoice } from "../../../modules/invoice/invoice.model";
import { IInvoiceRepository } from "../interfaces/invoice-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class SqlServerInvoiceRepository implements IInvoiceRepository {
  generateId(): string {
    throw new NotImplementedError("SqlServerInvoiceRepository.generateId is not implemented.");
  }
  async getInvoices(): Promise<Invoice[]> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getInvoices is not implemented.");
  }
  async getInvoice(_id: string): Promise<Invoice | null> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getInvoice is not implemented.");
  }
  async updateInvoice(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.updateInvoice is not implemented.");
  }
  async deleteInvoice(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.deleteInvoice is not implemented.");
  }
  async getInvoicesByShop(_shopId: string, _employeeId?: string, _branchId?: string): Promise<Invoice[]> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getInvoicesByShop is not implemented.");
  }
  async getInvoicesByCustomer(_customerId: string): Promise<Invoice[]> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getInvoicesByCustomer is not implemented.");
  }

  // Transaction placeholders
  async getTransactionShop(_transaction: any, _shopId: string): Promise<any> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getTransactionShop is not implemented.");
  }
  async getTransactionCustomer(_transaction: any, _shopId: string, _phone: string): Promise<any> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getTransactionCustomer is not implemented.");
  }
  async getTransactionProducts(_transaction: any, _productIds: string[]): Promise<any[]> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getTransactionProducts is not implemented.");
  }
  async getTransactionInventoryItems(_transaction: any, _shopId: string, _items: { productId: string; variantSku: string }[]): Promise<any[]> {
    throw new NotImplementedError("SqlServerInvoiceRepository.getTransactionInventoryItems is not implemented.");
  }
  async createTransactionInvoice(_transaction: any, _invoice: Invoice): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.createTransactionInvoice is not implemented.");
  }
  async updateTransactionCustomer(_transaction: any, _customerId: string, _customerData: any, _existingData?: any): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.updateTransactionCustomer is not implemented.");
  }
  async createTransactionCustomer(_transaction: any, _customer: any): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.createTransactionCustomer is not implemented.");
  }
  async updateTransactionInventory(_transaction: any, _invId: string, _stock: number, _existingData?: any): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.updateTransactionInventory is not implemented.");
  }
  async createTransactionHistory(_transaction: any, _historyRecord: any): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.createTransactionHistory is not implemented.");
  }
  async updateTransactionProduct(_transaction: any, _productId: string, _productUpdate: any, _existingData?: any): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.updateTransactionProduct is not implemented.");
  }
  async batchUpdateTransactionInventoryAndProducts(_transaction: any, _updates: any[]): Promise<void> {
    throw new NotImplementedError("SqlServerInvoiceRepository.batchUpdateTransactionInventoryAndProducts is not implemented.");
  }
}
