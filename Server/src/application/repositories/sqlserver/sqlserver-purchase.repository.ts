import {
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierPayment,
  PurchaseReturn,
} from "../../../modules/purchase/purchase.model";
import { IPurchaseRepository } from "../interfaces/purchase-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class SqlServerPurchaseRepository implements IPurchaseRepository {
  generateSupplierId(): string {
    throw new NotImplementedError("SqlServerPurchaseRepository.generateSupplierId is not implemented.");
  }
  generatePurchaseOrderId(): string {
    throw new NotImplementedError("SqlServerPurchaseRepository.generatePurchaseOrderId is not implemented.");
  }
  generateGoodsReceivedId(): string {
    throw new NotImplementedError("SqlServerPurchaseRepository.generateGoodsReceivedId is not implemented.");
  }
  generateSupplierPaymentId(): string {
    throw new NotImplementedError("SqlServerPurchaseRepository.generateSupplierPaymentId is not implemented.");
  }
  generatePurchaseReturnId(): string {
    throw new NotImplementedError("SqlServerPurchaseRepository.generatePurchaseReturnId is not implemented.");
  }

  async getPurchaseOrdersCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getPurchaseOrdersCount is not implemented.");
  }
  async getGoodsReceivedCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getGoodsReceivedCount is not implemented.");
  }
  async getSupplierPaymentsCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getSupplierPaymentsCount is not implemented.");
  }
  async getPurchaseReturnsCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getPurchaseReturnsCount is not implemented.");
  }

  async getSuppliers(_shopId: string): Promise<Supplier[]> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getSuppliers is not implemented.");
  }
  async createSupplier(_data: Supplier): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.createSupplier is not implemented.");
  }
  async updateSupplier(_id: string, _data: any): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.updateSupplier is not implemented.");
  }
  async deleteSupplier(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.deleteSupplier is not implemented.");
  }

  async getPurchaseOrders(_shopId: string): Promise<PurchaseOrder[]> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getPurchaseOrders is not implemented.");
  }
  async getPurchaseOrder(_id: string): Promise<PurchaseOrder | null> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getPurchaseOrder is not implemented.");
  }
  async createPurchaseOrder(_data: PurchaseOrder): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.createPurchaseOrder is not implemented.");
  }
  async updatePurchaseOrder(_id: string, _data: any): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.updatePurchaseOrder is not implemented.");
  }
  async deletePurchaseOrder(_id: string): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.deletePurchaseOrder is not implemented.");
  }

  async getGoodsReceived(_shopId: string): Promise<GoodsReceivedNote[]> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getGoodsReceived is not implemented.");
  }
  async createGoodsReceived(_data: GoodsReceivedNote): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.createGoodsReceived is not implemented.");
  }

  async getSupplierPayments(_shopId: string): Promise<SupplierPayment[]> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getSupplierPayments is not implemented.");
  }
  async createSupplierPayment(_data: SupplierPayment): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.createSupplierPayment is not implemented.");
  }

  async getPurchaseReturns(_shopId: string): Promise<PurchaseReturn[]> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getPurchaseReturns is not implemented.");
  }
  async createPurchaseReturn(_data: PurchaseReturn): Promise<void> {
    throw new NotImplementedError("SqlServerPurchaseRepository.createPurchaseReturn is not implemented.");
  }

  async getInventoryStock(_shopId: string, _productId: string, _variantSku: string): Promise<number> {
    throw new NotImplementedError("SqlServerPurchaseRepository.getInventoryStock is not implemented.");
  }
}
