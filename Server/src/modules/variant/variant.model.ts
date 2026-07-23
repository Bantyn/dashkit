export interface Variant {
  id?: string;
  shopId: string;
  name: string;
  values: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
