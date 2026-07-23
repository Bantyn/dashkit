export interface Offer {
  id?: string;
  shopId: string;
  title: string;
  type: 'percentage' | 'flat' | 'buy_x_get_y' | 'free_shipping';
  value?: number; // For percentage or flat discount
  buyX?: number;
  getY?: number;
  minCalculatedAmount?: number; // Minimum cart value
  code?: string; // For coupons
  startDate: string | Date;
  endDate: string | Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  showOnWebsite?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
