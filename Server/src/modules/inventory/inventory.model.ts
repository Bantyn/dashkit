export interface Inventory {
  id: string;
  shopId: string;
  productId: string;
  variantSku?: string;
  currentStock: number;
  lowStockThreshold: number;
  updatedAt: Date;
}
