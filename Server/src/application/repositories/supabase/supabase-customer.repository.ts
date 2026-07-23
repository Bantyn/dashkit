import { Customer } from "../../../modules/customer/customer.model";
import { ICustomerRepository } from "../interfaces/customer-repository.interface";
import { SupabaseManager } from "../../../infrastructure/supabase/supabase.client";
import { randomUUID } from "crypto";

export class SupabaseCustomerRepository implements ICustomerRepository {
  private async getClient() {
    return await SupabaseManager.getClient();
  }

  generateId(): string {
    return randomUUID();
  }

  async findCustomer(shopId: string, query: { phone?: string; email?: string; userId?: string }): Promise<Customer | null> {
    const supabase = await this.getClient();
    let dbQuery = supabase.from('customers').select('data').eq('shopId', shopId);
    
    if (query.phone) {
      // In Supabase with jsonb, we query nested json using the arrow operator or contains
      dbQuery = dbQuery.contains('data', { phone: query.phone });
    }
    if (query.email) {
      dbQuery = dbQuery.contains('data', { email: query.email });
    }
    if (query.userId) {
      dbQuery = dbQuery.contains('data', { userId: query.userId });
    }
    
    const { data, error } = await dbQuery.limit(1).single();
    if (error || !data) return null;
    return data.data as Customer;
  }

  async findCustomerByPhone(shopId: string, phone: string): Promise<Customer | null> {
    return this.findCustomer(shopId, { phone });
  }

  async createCustomer(customer: Customer): Promise<Customer> {
    const supabase = await this.getClient();
    customer.id = customer.id || this.generateId();
    
    const { error } = await supabase.from('customers').insert({
      id: customer.id,
      shopId: customer.shopId,
      data: customer
    });
    
    if (error) throw new Error(error.message);
    return customer;
  }

  async getCustomersByShop(shopId: string): Promise<Customer[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('customers').select('data').eq('shopId', shopId);
    if (error) throw new Error(error.message);
    return data.map((d: any) => d.data as Customer);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('customers').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data as Customer;
  }

  async updateCustomer(id: string, payload: any): Promise<void> {
    const supabase = await this.getClient();
    try {
      const { error: rpcError } = await supabase.rpc('patch_table_row', {
        table_name: 'customers',
        row_id: id,
        payload: payload
      });
      if (!rpcError) return;
      if (rpcError.code !== 'PGRST202' && !rpcError.message.includes('function does not exist')) {
        throw new Error(rpcError.message);
      }
    } catch { /* ignore and fallback */ }

    // Fallback logic
    const customer = await this.getCustomer(id);
    if (!customer) return;
    const updatedData = { ...customer, ...payload, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('customers').update({ data: updatedData }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteCustomer(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
