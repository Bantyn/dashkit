export interface Brand {
  id?: string;
  shopId: string;
  name: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
