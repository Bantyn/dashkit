import {
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierPayment,
  PurchaseReturn,
} from "../../../modules/purchase/purchase.model";
import { IPurchaseRepository } from "../interfaces/purchase-repository.interface";
import { NotImplementedError } from "../../../shared/utils/errors";

export class MongoPurchaseRepository implements IPurchaseRepository {
  generateSupplierId(): string {
    throw new NotImplementedError("MongoPurchaseRepository.generateSupplierId is not implemented.");
  }
  generatePurchaseOrderId(): string {
    throw new NotImplementedError("MongoPurchaseRepository.generatePurchaseOrderId is not implemented.");
  }
  generateGoodsReceivedId(): string {
    throw new NotImplementedError("MongoPurchaseRepository.generateGoodsReceivedId is not implemented.");
  }
  generateSupplierPaymentId(): string {
    throw new NotImplementedError("MongoPurchaseRepository.generateSupplierPaymentId is not implemented.");
  }
  generatePurchaseReturnId(): string {
    throw new NotImplementedError("MongoPurchaseRepository.generatePurchaseReturnId is not implemented.");
  }

  async getPurchaseOrdersCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("MongoPurchaseRepository.getPurchaseOrdersCount is not implemented.");
  }
  async getGoodsReceivedCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("MongoPurchaseRepository.getGoodsReceivedCount is not implemented.");
  }
  async getSupplierPaymentsCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("MongoPurchaseRepository.getSupplierPaymentsCount is not implemented.");
  }
  async getPurchaseReturnsCount(_shopId: string): Promise<number> {
    throw new NotImplementedError("MongoPurchaseRepository.getPurchaseReturnsCount is not implemented.");
  }

  async getSuppliers(_shopId: string): Promise<Supplier[]> {
    throw new NotImplementedError("MongoPurchaseRepository.getSuppliers is not implemented.");
  }
  async createSupplier(_data: Supplier): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.createSupplier is not implemented.");
  }
  async updateSupplier(_id: string, _data: any): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.updateSupplier is not implemented.");
  }
  async deleteSupplier(_id: string): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.deleteSupplier is not implemented.");
  }

  async getPurchaseOrders(_shopId: string): Promise<PurchaseOrder[]> {
    throw new NotImplementedError("MongoPurchaseRepository.getPurchaseOrders is not implemented.");
  }
  async getPurchaseOrder(_id: string): Promise<PurchaseOrder | null> {
    throw new NotImplementedError("MongoPurchaseRepository.getPurchaseOrder is not implemented.");
  }
  async createPurchaseOrder(_data: PurchaseOrder): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.createPurchaseOrder is not implemented.");
  }
  async updatePurchaseOrder(_id: string, _data: any): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.updatePurchaseOrder is not implemented.");
  }
  async deletePurchaseOrder(_id: string): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.deletePurchaseOrder is not implemented.");
  }

  async getGoodsReceived(_shopId: string): Promise<GoodsReceivedNote[]> {
    throw new NotImplementedError("MongoPurchaseRepository.getGoodsReceived is not implemented.");
  }
  async createGoodsReceived(_data: GoodsReceivedNote): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.createGoodsReceived is not implemented.");
  }

  async getSupplierPayments(_shopId: string): Promise<SupplierPayment[]> {
    throw new NotImplementedError("MongoPurchaseRepository.getSupplierPayments is not implemented.");
  }
  async createSupplierPayment(_data: SupplierPayment): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.createSupplierPayment is not implemented.");
  }

  async getPurchaseReturns(_shopId: string): Promise<PurchaseReturn[]> {
    throw new NotImplementedError("MongoPurchaseRepository.getPurchaseReturns is not implemented.");
  }
  async createPurchaseReturn(_data: PurchaseReturn): Promise<void> {
    throw new NotImplementedError("MongoPurchaseRepository.createPurchaseReturn is not implemented.");
  }

  async getInventoryStock(_shopId: string, _productId: string, _variantSku: string): Promise<number> {
    throw new NotImplementedError("MongoPurchaseRepository.getInventoryStock is not implemented.");
  }
}
