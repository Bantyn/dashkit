export interface Category {
  id?: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  shopId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
