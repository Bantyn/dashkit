import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

export interface CreditHistoryEntry {
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  date: any;
  referenceId?: string;
}

export interface CustomerCredit {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  balance: number;
  history: CreditHistoryEntry[];
  createdAt: any;
  updatedAt: any;
}

@Injectable({ providedIn: 'root' })
export class CustomerCreditService {
  private apiUrl = `${environment.apiUrl}/customer-credits`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 60 * 1000;

  constructor(private http: HttpClient) {}

  getCustomerCredit(shopId: string, customerId: string): Observable<ApiResponse<CustomerCredit>> {
    return this.requestCache.getOrSet(
      `customer-credit:item:${shopId}:${customerId}`,
      () => this.http.get<ApiResponse<CustomerCredit>>(`${this.apiUrl}?shopId=${shopId}&customerId=${customerId}`),
      this.ttlMs,
    ) as Observable<ApiResponse<CustomerCredit>>;
  }

  getCreditsByShop(shopId: string): Observable<ApiResponse<CustomerCredit[]>> {
    return this.requestCache.getOrSet(
      `customer-credit:shop:${shopId}`,
      () => this.http.get<ApiResponse<CustomerCredit[]>>(`${this.apiUrl}/shop/${shopId}`),
      this.ttlMs,
    ) as Observable<ApiResponse<CustomerCredit[]>>;
  }

  adjustCredit(payload: {
    shopId: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    amount: number;
    type: 'credit' | 'debit';
    reason: string;
    referenceId?: string;
  }): Observable<ApiResponse<CustomerCredit>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<CustomerCredit>>(`${this.apiUrl}/adjust`, payload);
  }
}
