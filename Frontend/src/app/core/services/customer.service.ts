import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Order } from '../models/order.model';
import { RequestCache } from '../utils/request-cache.util';

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchase: Date;
  source?: 'online' | 'pos';
  userId?: string; // Links to registered user if applicable
  // CRM fields
  dateOfBirth?: string;        // YYYY-MM-DD
  anniversaryDate?: string;    // YYYY-MM-DD
  segment?: 'vip' | 'loyal' | 'regular' | 'new' | 'at_risk';
  loyaltyPoints?: number;
  tags?: string[];
  wishlist?: string[];
  addresses?: any[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 60 * 1000;

  constructor(private http: HttpClient) {}

  getCustomersByShop(shopId: string): Observable<ApiResponse<Customer[]>> {
    return this.requestCache.getOrSet(
      `customers:shop:${shopId}`,
      () => this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}/shop/${shopId}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Customer[]>>;
  }

  getCustomer(id: string): Observable<ApiResponse<Customer>> {
    return this.requestCache.getOrSet(
      `customers:item:${id}`,
      () => this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Customer>>;
  }

  createCustomer(customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, customer);
  }

  findCustomer(
    shopId: string,
    phone?: string,
    email?: string,
    userId?: string
  ): Observable<ApiResponse<Customer | null>> {
    let params = new HttpParams().set('shopId', shopId);

    if (phone) params = params.set('phone', phone);
    if (email) params = params.set('email', email);
    if (userId) params = params.set('userId', userId);

    return this.requestCache.getOrSet(
      `customers:find:${params.toString()}`,
      () => this.http.get<ApiResponse<Customer | null>>(`${this.apiUrl}/find`, { params }),
      this.ttlMs,
    ) as Observable<ApiResponse<Customer | null>>;
  }

  updateCustomer(id: string, customer: Partial<Customer>): Observable<ApiResponse<void>> {
    this.requestCache.clear();
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: string): Observable<ApiResponse<void>> {
    this.requestCache.clear();
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
