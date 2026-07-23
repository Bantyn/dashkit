export interface Promotion {
  id: string;
  shopId: string;
  title: string;
  type: "festival" | "sms" | "whatsapp" | "loyalty" | "offer";
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}
