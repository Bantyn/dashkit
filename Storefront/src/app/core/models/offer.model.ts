export interface Offer {
  id?: string;
  shopId: string;
  title: string;
  type: 'percentage' | 'flat' | 'buy_x_get_y' | 'free_shipping';
  value?: number;
  buyX?: number;
  getY?: number;
  minCalculatedAmount?: number;
  code?: string;
  startDate: string | Date;
  endDate: string | Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  showOnWebsite?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
