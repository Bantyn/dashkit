export interface Promotion {
  id?: string;
  shopId: string;
  title: string;
  type: 'festival' | 'sms' | 'whatsapp' | 'loyalty' | 'offer' | 'template';
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive: boolean;
  status?: string;
  metadata?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
