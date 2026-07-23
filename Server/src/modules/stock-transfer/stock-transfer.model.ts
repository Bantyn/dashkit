export interface StockTransferItem {
  productId: string;
  variantSku: string;
  quantity: number;
  productName: string;
}

export interface StockTransfer {
  id: string;
  shopId: string;
  sourceBranchId: string;
  sourceBranchName?: string;
  destinationBranchId: string;
  destinationBranchName?: string;
  items: StockTransferItem[];
  status: 'pending' | 'completed' | 'cancelled';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
