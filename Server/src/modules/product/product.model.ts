export interface Product {
  id: string;
  shopId: string;
  branchId?: string;
  name: string;
  description: string;
  category: "men" | "women" | "kids" | "accessories";
  subcategory?: string;
  brand?: string;
  variants: ProductVariant[];
  images: string[];
  tags: string[];
  isActive: boolean;
  showOnStorefront: boolean;
  seo: ProductSEO;
  salesCount?: number;
  viewCount?: number;
  seasonalCollectionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  price: number;
  discountedPrice?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  stock: number;
  images?: string[];
}

export interface ProductSEO {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

export interface Customer {
  id: string;
  shopId: string;
  branchId?: string;
  name: string;
  email?: string;
  mobile: string;
  address?: any;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  notes?: string;
  tags: string[];
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
}

export interface Employee {
  id: string;
  shopId: string;
  branchId?: string;
  userId?: string;
  name: string;
  email: string;
  mobile: string;
  role: "billing_staff" | "manager";
  permissions: string[];
  salary?: number;
  joinDate: Date;
  status: "active" | "inactive";
  createdAt: Date;
}
