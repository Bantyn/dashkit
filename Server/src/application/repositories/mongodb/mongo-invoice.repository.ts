import { Invoice } from "../../../modules/invoice/invoice.model";
import { IInvoiceRepository } from "../interfaces/invoice-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class MongoInvoiceRepository implements IInvoiceRepository {
  generateId(): string {
    throw new NotImplementedError("MongoInvoiceRepository.generateId is not implemented.");
  }
  async getInvoices(): Promise<Invoice[]> {
    throw new NotImplementedError("MongoInvoiceRepository.getInvoices is not implemented.");
  }
  async getInvoice(_id: string): Promise<Invoice | null> {
    throw new NotImplementedError("MongoInvoiceRepository.getInvoice is not implemented.");
  }
  async updateInvoice(_id: string, _payload: any): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.updateInvoice is not implemented.");
  }
  async deleteInvoice(_id: string): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.deleteInvoice is not implemented.");
  }
  async getInvoicesByShop(_shopId: string, _employeeId?: string, _branchId?: string): Promise<Invoice[]> {
    throw new NotImplementedError("MongoInvoiceRepository.getInvoicesByShop is not implemented.");
  }
  async getInvoicesByCustomer(_customerId: string): Promise<Invoice[]> {
    throw new NotImplementedError("MongoInvoiceRepository.getInvoicesByCustomer is not implemented.");
  }

  // Transaction placeholders
  async getTransactionShop(_transaction: any, _shopId: string): Promise<any> {
    throw new NotImplementedError("MongoInvoiceRepository.getTransactionShop is not implemented.");
  }
  async getTransactionCustomer(_transaction: any, _shopId: string, _phone: string): Promise<any> {
    throw new NotImplementedError("MongoInvoiceRepository.getTransactionCustomer is not implemented.");
  }
  async getTransactionProducts(_transaction: any, _productIds: string[]): Promise<any[]> {
    throw new NotImplementedError("MongoInvoiceRepository.getTransactionProducts is not implemented.");
  }
  async getTransactionInventoryItems(_transaction: any, _shopId: string, _items: { productId: string; variantSku: string }[]): Promise<any[]> {
    throw new NotImplementedError("MongoInvoiceRepository.getTransactionInventoryItems is not implemented.");
  }
  async createTransactionInvoice(_transaction: any, _invoice: Invoice): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.createTransactionInvoice is not implemented.");
  }
  async updateTransactionCustomer(_transaction: any, _customerId: string, _customerData: any, _existingData?: any): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.updateTransactionCustomer is not implemented.");
  }
  async createTransactionCustomer(_transaction: any, _customer: any): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.createTransactionCustomer is not implemented.");
  }
  async updateTransactionInventory(_transaction: any, _invId: string, _stock: number, _existingData?: any): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.updateTransactionInventory is not implemented.");
  }
  async createTransactionHistory(_transaction: any, _historyRecord: any): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.createTransactionHistory is not implemented.");
  }
  async updateTransactionProduct(_transaction: any, _productId: string, _productUpdate: any, _existingData?: any): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.updateTransactionProduct is not implemented.");
  }
  async batchUpdateTransactionInventoryAndProducts(_transaction: any, _updates: any[]): Promise<void> {
    throw new NotImplementedError("MongoInvoiceRepository.batchUpdateTransactionInventoryAndProducts is not implemented.");
  }
}
