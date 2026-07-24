export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  category: 'men' | 'women' | 'kids' | 'accessories';
  subcategory?: string;
  brand?: string;
  variants: ProductVariant[];
  images?: string[];
  tags: string[];
  isActive: boolean;
  showOnStorefront: boolean;
  seo: ProductSEO;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  images?: string[];
  wholesalePrice?: number;
  wholesaleMinQty?: number;
}

export interface ProductSEO {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}
