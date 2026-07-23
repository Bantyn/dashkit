import { Order } from "../../../modules/order/order.model";
import { IOrderRepository } from "../interfaces/order-repository.interface";
import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { randomUUID } from "crypto";
import { CacheService } from "../../../infrastructure/cache/cache.service";

const shopCache = new CacheService();
const SHOP_CACHE_TTL = 15 * 60 * 1000; // 15 mins

export class SupabaseOrderRepository implements IOrderRepository {
  private async getClient() {
    return await SupabaseManager.getClient();
  }

  generateId(): string {
    return randomUUID();
  }

  async getOrders(): Promise<Order[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('orders').select('data');
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Order);
  }

  async getOrder(id: string): Promise<Order | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('orders').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data as Order;
  }

  async createOrder(order: Order): Promise<void> {
    const supabase = await this.getClient();
    order.id = order.id || this.generateId();
    
    const { error } = await supabase.from('orders').insert({
      id: order.id,
      shopId: order.shopId,
      data: order
    });
    
    if (error) throw new Error(error.message);
  }

  async updateOrder(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'orders',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const order = await this.getOrder(id);
    if (!order) return;
    const updatedData = { ...order, ...payload, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('orders').update({ data: updatedData }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteOrder(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getOrdersByShop(shopId: string): Promise<Order[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('orders').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Order);
  }

  async getMyOrders(customerId: string, shopId: string): Promise<Order[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('orders')
      .select('data')
      .eq('shopId', shopId)
      .contains('data', { customerId });
      
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Order);
  }

  async getMyOrdersByEmail(email: string, shopId: string): Promise<Order[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('orders')
      .select('data')
      .eq('shopId', shopId)
      .contains('data', { customerEmail: email });
      
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Order);
  }

  async getShop(shopId: string): Promise<any | null> {
    const cacheKey = `repository:shop:${shopId}`;
    const cached = shopCache.get<any>(cacheKey);
    if (cached) return cached;

    const { db } = require("../../../config/firebase.config");
    const snapshot = await db.collection('shops').doc(shopId).get();
    if (snapshot.exists) {
      const data = snapshot.data();
      shopCache.set(cacheKey, data, SHOP_CACHE_TTL);
      return data;
    }
    return null;
  }

  async commitOrderStockUpdates(shopId: string, orderId: string, items: any[]): Promise<void> {
    if (!items || items.length === 0) return;
    const supabase = await this.getClient();
    
    // Process items sequentially to reduce stock
    for (const item of items) {
      if (!item.sku) continue;
      
      const { data, error } = await supabase.from('inventory')
        .select('id, data')
        .eq('shopId', shopId)
        .eq('variantSku', item.sku)
        .limit(1)
        .single();
        
      if (error || !data) continue;
      
      const invData = data.data;
      const currentStock = Number(invData.currentStock) || 0;
      invData.currentStock = Math.max(0, currentStock - (item.quantity || 1));
      invData.updatedAt = new Date().toISOString();
      
      await supabase.from('inventory').update({ data: invData }).eq('id', data.id);
    }
  }
}
