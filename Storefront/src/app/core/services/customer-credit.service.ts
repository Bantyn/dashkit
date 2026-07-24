import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

export interface CustomerCredit {
  id: string;
  shopId: string;
  customerId: string;
  balance: number;
  history: any[];
}

@Injectable({ providedIn: 'root' })
export class CustomerCreditService {
  private apiUrl = `${environment.publicApiUrl}/customer-credits`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 60 * 1000;

  constructor(private http: HttpClient) {}

  getCustomerCredit(shopId: string, customerId: string): Observable<ApiResponse<CustomerCredit>> {
    return this.requestCache.getOrSet(
      `customer-credit:${shopId}:${customerId}`,
      () =>
        this.http.get<ApiResponse<CustomerCredit>>(
          `${this.apiUrl}?shopId=${shopId}&customerId=${customerId}`,
        ),
      this.ttlMs,
    ) as Observable<ApiResponse<CustomerCredit>>;
  }
}
