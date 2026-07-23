import {
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierPayment,
  PurchaseReturn,
} from "../../../modules/purchase/purchase.model";

export interface IPurchaseRepository {
  // IDs
  generateSupplierId(): string;
  generatePurchaseOrderId(): string;
  generateGoodsReceivedId(): string;
  generateSupplierPaymentId(): string;
  generatePurchaseReturnId(): string;

  // Counts
  getPurchaseOrdersCount(shopId: string): Promise<number>;
  getGoodsReceivedCount(shopId: string): Promise<number>;
  getSupplierPaymentsCount(shopId: string): Promise<number>;
  getPurchaseReturnsCount(shopId: string): Promise<number>;

  // Suppliers
  getSuppliers(shopId: string): Promise<Supplier[]>;
  createSupplier(data: Supplier): Promise<void>;
  updateSupplier(id: string, data: any): Promise<void>;
  deleteSupplier(id: string): Promise<void>;

  // Purchase Orders
  getPurchaseOrders(shopId: string): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | null>;
  createPurchaseOrder(data: PurchaseOrder): Promise<void>;
  updatePurchaseOrder(id: string, data: any): Promise<void>;
  deletePurchaseOrder(id: string): Promise<void>;

  // Goods Received (GRN)
  getGoodsReceived(shopId: string): Promise<GoodsReceivedNote[]>;
  createGoodsReceived(data: GoodsReceivedNote): Promise<void>;

  // Supplier Payments
  getSupplierPayments(shopId: string): Promise<SupplierPayment[]>;
  createSupplierPayment(data: SupplierPayment): Promise<void>;

  // Purchase Returns
  getPurchaseReturns(shopId: string): Promise<PurchaseReturn[]>;
  createPurchaseReturn(data: PurchaseReturn): Promise<void>;

  // Inventory Helper
  getInventoryStock(shopId: string, productId: string, variantSku: string): Promise<number>;
}
