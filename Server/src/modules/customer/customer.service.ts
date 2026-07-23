import { CacheService } from "../../infrastructure/cache/cache.service";
import { shopCountersService } from "../../infrastructure/cache/shop-counters.service";
import { costAnalyticsService } from "../cost-analytics/cost-analytics.service";
import { ICustomerRepository } from "../../application/repositories/interfaces/customer-repository.interface";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

export class CustomerService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 30 * 1000;

  private get customerRepository(): ICustomerRepository {
    return RepositoryFactory.getCustomerRepository();
  }

  private getShopCustomersKey(shopId: string) {
    return `customers:shop:${shopId}`;
  }

  private getCustomerKey(id: string) {
    return `customer:${id}`;
  }

  private invalidateCustomerCache(shopId?: string, customerId?: string) {
    if (shopId) {
      this.cache.delete(this.getShopCustomersKey(shopId));
      this.cache.deleteByPrefix(`analytics:dashboard:${shopId}`);
      this.cache.deleteByPrefix(`analytics:collections:customers:${shopId}`);
      this.cache.deleteByPrefix(`analytics:page:${shopId}:customers`);
    }
    if (customerId) {
      this.cache.delete(this.getCustomerKey(customerId));
    }
  }

  async createCustomer(customerData: any) {
    if (customerData.shopId && customerData.phoneNumber) {
      const existing = await this.customerRepository.findCustomerByPhone(
        String(customerData.shopId),
        String(customerData.phoneNumber)
      );

      if (existing) {
        return {
          customer: existing,
          alreadyExists: true,
        };
      }
    }

    const generatedId = this.customerRepository.generateId();
    const newCustomer = {
      ...customerData,
      id: generatedId,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("NEW CUSTOMER:", newCustomer);
    // Remove any undefined values
    Object.keys(newCustomer).forEach(key => newCustomer[key] === undefined && delete newCustomer[key]);
    
    await this.customerRepository.createCustomer(newCustomer);
    
    if (newCustomer.shopId) {
      this.invalidateCustomerCache(newCustomer.shopId, newCustomer.id);
      void shopCountersService.incrementCounter(newCustomer.shopId, "customers", 1);
      void costAnalyticsService.invalidateSnapshot("new_customer");
    }

    return { customer: newCustomer, alreadyExists: false };
  }

  async findCustomer(shopId: string, phone?: string, email?: string, userId?: string) {
    return this.customerRepository.findCustomer(shopId, { phone, email, userId });
  }

  async getCustomersByShop(shopId: string) {
    const cacheKey = this.getShopCustomersKey(shopId);
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const data = await this.customerRepository.getCustomersByShop(shopId);
    return this.cache.set(cacheKey, data, this.cacheTtlMs);
  }

  async getCustomer(id: string) {
    const cacheKey = this.getCustomerKey(id);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const data = await this.customerRepository.getCustomer(id);
    if (data) {
      this.cache.set(cacheKey, data, this.cacheTtlMs);
    }
    return data;
  }

  async updateCustomer(id: string, payload: any) {
    await this.customerRepository.updateCustomer(id, payload);
    this.invalidateCustomerCache(payload.shopId, id);
  }

  async deleteCustomer(id: string) {
    const existing = await this.getCustomer(id);
    await this.customerRepository.deleteCustomer(id);
    if (existing) {
      const shopId = (existing as any).shopId;
      this.invalidateCustomerCache(shopId, id);
      if (shopId) {
        void shopCountersService.incrementCounter(shopId, "customers", -1);
        void costAnalyticsService.invalidateSnapshot("delete_customer");
      }
    }
  }
}

export const customerService = new CustomerService();

