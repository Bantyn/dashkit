import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from '../models/order.model';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.publicApiUrl}/orders`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 60 * 1000;

  constructor(private http: HttpClient) {}

  createOrder(orderData: Partial<Order>): Observable<ApiResponse<Order>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<Order>>(this.apiUrl, orderData);
  }

  getMyOrders(shopId: string, customerId?: string, email?: string): Observable<ApiResponse<Order[]>> {
    let url = `${this.apiUrl}/my-orders?shopId=${shopId}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;
    else if (customerId) url += `&customerId=${customerId}`;
    return this.requestCache.getOrSet(
      `orders:my:${shopId}:${email || customerId || 'all'}`,
      () => this.http.get<ApiResponse<Order[]>>(url),
      this.ttlMs,
    ) as Observable<ApiResponse<Order[]>>;
  }

  getOrder(id: string): Observable<ApiResponse<Order>> {
    return this.requestCache.getOrSet(
      `orders:item:${id}`,
      () => this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Order>>;
  }

  trackOrder(id: string): Observable<ApiResponse<Order>> {
    return this.requestCache.getOrSet(
      `orders:track:${id}`,
      () => this.http.get<ApiResponse<Order>>(`${this.apiUrl}/track/${id}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Order>>;
  }

  verifyPayment(
    id: string,
    paymentDetails: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    },
  ): Observable<ApiResponse<any>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/verify-payment`, paymentDetails);
  }
}
