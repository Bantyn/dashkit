import { Product } from "../../../modules/product/product.model";
import { IProductRepository } from "../interfaces/product-repository.interface";
import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { randomUUID } from "crypto";

export class SupabaseProductRepository implements IProductRepository {
  
  private async getClient() {
    return await SupabaseManager.getClient();
  }

  generateId(): string {
    return randomUUID();
  }

  async createProduct(product: Product, variants?: any[]): Promise<Product> {
    const supabase = await this.getClient();
    product.id = product.id || this.generateId();
    
    // Insert into products table
    const { error } = await supabase.from('products').insert({
      id: product.id,
      shopId: product.shopId,
      branchId: product.branchId || null,
      data: product
    });
    
    if (error) throw new Error(`Failed to create product: ${error.message}`);

    // Insert variants into inventory table
    if (variants && variants.length > 0) {
      const inventoryItems = variants.map(variant => ({
        id: this.generateId(),
        shopId: product.shopId,
        branchId: product.branchId || null,
        productId: product.id,
        variantSku: variant.sku || "",
        data: {
          id: this.generateId(),
          shopId: product.shopId,
          productId: product.id,
          variantSku: variant.sku || "",
          currentStock: variant.stock || 0,
          lowStockThreshold: 10,
          updatedAt: new Date().toISOString()
        }
      }));
      
      const { error: invError } = await supabase.from('inventory').insert(inventoryItems);
      if (invError) throw new Error(`Failed to create inventory variants: ${invError.message}`);
    }

    return product;
  }

  async getProducts(): Promise<Product[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('products').select('data');
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Product);
  }

  async getProduct(id: string): Promise<Product | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('products').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data as Product;
  }

  async updateProduct(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'products',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const product = await this.getProduct(id);
    if (!product) return;
    const updatedData = { ...product, ...payload, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('products').update({ data: updatedData }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteProduct(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteAllProducts(shopId: string, branchId?: string): Promise<{ deletedCount: number }> {
    const supabase = await this.getClient();
    let query = supabase.from('products').delete().eq('shopId', shopId);
    if (branchId) query = query.eq('branchId', branchId);
    
    const { count, error } = await query.select('id');
    if (error) throw new Error(error.message);
    
    let invQuery = supabase.from('inventory').delete().eq('shopId', shopId);
    if (branchId) invQuery = invQuery.eq('branchId', branchId);
    await invQuery;
    
    return { deletedCount: count || 0 };
  }

  async getProductsByShop(shopId: string, branchId?: string): Promise<Product[]> {
    const supabase = await this.getClient();
    let query = supabase.from('products').select('data').eq('shopId', shopId);
    if (branchId) query = query.eq('branchId', branchId);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Product);
  }

  async incrementViewCount(id: string): Promise<void> {
    const supabase = await this.getClient();
    const product = await this.getProduct(id);
    if (!product) return;
    
    const viewCount = (product.viewCount || 0) + 1;
    product.viewCount = viewCount;
    await supabase.from('products').update({ data: product }).eq('id', id);
  }

  async findInventoryBySku(shopId: string, sku: string): Promise<any | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory')
      .select('data')
      .eq('shopId', shopId)
      .eq('variantSku', sku)
      .limit(1)
      .single();
    if (error || !data) return null;
    return data.data;
  }

  async getExistingCategories(shopId: string): Promise<any[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('categories').select('data').eq('shopId', shopId);
    if (error) return [];
    return data.map((d: any) => d.data);
  }

  async getExistingBrands(shopId: string): Promise<any[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('brands').select('data').eq('shopId', shopId);
    if (error) return [];
    return data.map((d: any) => d.data);
  }

  async saveCategories(categories: any[]): Promise<void> {
    if (!categories.length) return;
    const supabase = await this.getClient();
    const items = categories.map(c => ({
      id: c.id || this.generateId(),
      shopId: c.shopId,
      data: c
    }));
    await supabase.from('categories').upsert(items);
  }

  async saveBrands(brands: any[]): Promise<void> {
    if (!brands.length) return;
    const supabase = await this.getClient();
    const items = brands.map(b => ({
      id: b.id || this.generateId(),
      shopId: b.shopId,
      data: b
    }));
    await supabase.from('brands').upsert(items);
  }

  async createProductsAndInventoryInBulk(products: any[], inventoryItems: any[]): Promise<void> {
    if (!products.length && !inventoryItems.length) return;
    const supabase = await this.getClient();
    
    if (products.length > 0) {
      const pItems = products.map(p => ({
        id: p.id,
        shopId: p.shopId,
        branchId: p.branchId || null,
        data: p
      }));
      await supabase.from('products').upsert(pItems);
    }
    
    if (inventoryItems.length > 0) {
      const iItems = inventoryItems.map(i => ({
        id: i.id,
        shopId: i.shopId,
        productId: i.productId,
        variantSku: i.variantSku || "",
        data: i
      }));
      await supabase.from('inventory').upsert(iItems);
    }
  }

  generateCategoryId(): string {
    return randomUUID();
  }

  async createCategory(category: any): Promise<void> {
    category.id = category.id || this.generateCategoryId();
    const supabase = await this.getClient();
    await supabase.from('categories').insert({
      id: category.id,
      shopId: category.shopId,
      data: category
    });
  }

  async getCategoriesByShop(shopId: string): Promise<any[]> {
    return this.getExistingCategories(shopId);
  }

  async getCategory(id: string): Promise<any | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('categories').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data;
  }

  async updateCategory(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'categories',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const cat = await this.getCategory(id);
    if (!cat) return;
    const updated = { ...cat, ...payload };
    const { error } = await supabase.from('categories').update({ data: updated }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteCategory(id: string): Promise<void> {
    const supabase = await this.getClient();
    await supabase.from('categories').delete().eq('id', id);
  }

  generateBrandId(): string {
    return randomUUID();
  }

  async createBrand(brand: any): Promise<void> {
    brand.id = brand.id || this.generateBrandId();
    const supabase = await this.getClient();
    await supabase.from('brands').insert({
      id: brand.id,
      shopId: brand.shopId,
      data: brand
    });
  }

  async getBrandsByShop(shopId: string): Promise<any[]> {
    return this.getExistingBrands(shopId);
  }

  async getBrand(id: string): Promise<any | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('brands').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data;
  }

  async updateBrand(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'brands',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const brand = await this.getBrand(id);
    if (!brand) return;
    const updated = { ...brand, ...payload };
    const { error } = await supabase.from('brands').update({ data: updated }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteBrand(id: string): Promise<void> {
    const supabase = await this.getClient();
    await supabase.from('brands').delete().eq('id', id);
  }
}
