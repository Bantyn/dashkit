export interface Inventory {
  id: string;
  shopId: string;
  productId: string;
  variantSku?: string;
  productName?: string;
  currentStock: number;
  lowStockThreshold: number;
  updatedAt: Date;
}
