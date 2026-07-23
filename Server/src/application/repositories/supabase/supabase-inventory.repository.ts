import { MovementType } from "../../../modules/inventory/inventory.service";
import { IInventoryRepository } from "../interfaces/inventory-repository.interface";
import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { randomUUID } from "crypto";

export class SupabaseInventoryRepository implements IInventoryRepository {
  private async getClient() {
    return await SupabaseManager.getClient();
  }

  generateId(): string {
    return randomUUID();
  }

  async getInventoryByShop(shopId: string): Promise<any[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data);
  }

  async isMovementDuplicate(referenceId: string, productId: string, variantSku: string, movementType: MovementType): Promise<boolean> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory_history')
      .select('id')
      .eq('productId', productId)
      .eq('variantSku', variantSku || "")
      .eq('movementType', movementType)
      .contains('data', { referenceId })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.warn("isMovementDuplicate check failed", error);
    }
    return !!data;
  }

  async getInventoryItem(shopId: string, productId: string, variantSku: string): Promise<any | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory')
      .select('data')
      .eq('shopId', shopId)
      .eq('productId', productId)
      .eq('variantSku', variantSku || "")
      .limit(1)
      .single();
      
    if (error || !data) return null;
    return {
      ref: null,
      data: data.data
    };
  }

  async getProduct(productId: string): Promise<any | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('products').select('data').eq('id', productId).single();
    if (error || !data) return null;
    return {
      ref: null,
      data: data.data
    };
  }

  async saveStockUpdate(params: {
    invId?: string;
    isNew: boolean;
    inventoryData: any;
    historyData: any;
    productId: string;
    productUpdate?: any;
  }): Promise<void> {
    const supabase = await this.getClient();
    
    // 1. Update/Insert Inventory
    const invId = params.invId || this.generateId();
    if (params.isNew) {
      params.inventoryData.id = invId;
      await supabase.from('inventory').insert({
        id: invId,
        shopId: params.inventoryData.shopId,
        productId: params.productId,
        variantSku: params.inventoryData.variantSku || "",
        data: params.inventoryData
      });
    } else {
      await supabase.from('inventory').update({ data: params.inventoryData }).eq('id', invId);
    }

    // 2. Insert History
    params.historyData.id = params.historyData.id || this.generateId();
    await supabase.from('inventory_history').insert({
      id: params.historyData.id,
      shopId: params.historyData.shopId,
      productId: params.productId,
      variantSku: params.historyData.variantSku || "",
      movementType: params.historyData.movementType || "",
      data: params.historyData
    });

    // 3. Update Product (if required)
    if (params.productUpdate) {
      try {
        const { error: rpcError } = await supabase.rpc('patch_table_row', {
          table_name: 'products',
          row_id: params.productId,
          payload: params.productUpdate
        });
        if (!rpcError) return;
        if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
          throw new Error(rpcError.message);
        }
      } catch { /* ignore and fallback */ }

      // Fallback logic
      const product = await this.getProduct(params.productId);
      if (product) {
        const updated = { ...product, ...params.productUpdate, updatedAt: new Date().toISOString() };
        await supabase.from('products').update({ data: updated }).eq('id', params.productId);
      }
    }
  }

  async getInventoryHistory(shopId: string, filters?: { date?: string; movementType?: MovementType }): Promise<any[]> {
    const supabase = await this.getClient();
    let query = supabase.from('inventory_history').select('data').eq('shopId', shopId);
    
    if (filters?.movementType) {
      query = query.eq('movementType', filters.movementType);
    }
    
    // Supabase date filtering on jsonb isn't perfectly straightforward via REST, 
    // ideally it's better to fetch and filter if it's dynamic.
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    let history = data.map((d: any) => d.data);
    
    if (filters?.date) {
      history = history.filter((h: any) => h.createdAt && h.createdAt.startsWith(filters.date));
    }
    
    return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLowStockItems(shopId: string): Promise<any[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    
    return data.map((d: any) => d.data).filter((item: any) => {
      return item.currentStock <= (item.lowStockThreshold || 10);
    });
  }

  async getProductsByChunk(productIds: string[]): Promise<Map<string, any>> {
    if (!productIds.length) return new Map();
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('products').select('data').in('id', productIds);
    if (error) throw new Error(error.message);
    
    const productMap = new Map<string, any>();
    data.forEach((d: any) => {
      const product = d.data;
      if (product.id) productMap.set(product.id, product);
    });
    return productMap;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const supabase = await this.getClient();
    await supabase.from('inventory').delete().eq('id', id);
  }
}
