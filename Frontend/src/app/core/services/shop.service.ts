import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Shop } from '../models/shop.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private apiUrl = `${environment.apiUrl}/shops`;
  private shopCache = new Map<string, Observable<ApiResponse<Shop>>>();

  constructor(private http: HttpClient) {}

  createShop(shopData: Partial<Shop>): Observable<ApiResponse<Shop>> {
    return this.http.post<ApiResponse<Shop>>(this.apiUrl, shopData);
  }

  getShop(id: string): Observable<ApiResponse<Shop>> {
    const cached = this.shopCache.get(id);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<Shop>>(`${this.apiUrl}/${id}`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false, windowTime: 1_800_000 }));

    this.shopCache.set(id, request$);
    return request$;
  }

  getPublicShop(id: string): Observable<ApiResponse<Shop>> {
    const publicUrl = `${environment.apiUrl.replace('/admin', '/website')}/shops`;
    return this.http.get<ApiResponse<Shop>>(`${publicUrl}/${id}`);
  }

  updateShop(id: string, shopData: Partial<Shop>): Observable<ApiResponse<null>> {
    this.shopCache.delete(id);
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}`, shopData);
  }

  /**
   * Force-fetch shop data, bypassing the shareReplay cache.
   * Use this in guards where stale/expired cache can cause EmptyError.
   */
  getShopFresh(id: string): Observable<ApiResponse<Shop>> {
    this.shopCache.delete(id);
    return this.getShop(id);
  }

  requestDeactivation(id: string, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/deactivate-request`, { reason });
  }

  createSupportTicket(ticketData: { shopId: string; shopName: string; reporterEmail: string; subject: string; description: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/support`, ticketData);
  }

  getShopDetails(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}/details`);
  }

  createLimitUpgradeOrder(shopId: string, limitKey: string, quantity: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/payment/create-upgrade-order`, { shopId, limitKey, quantity });
  }

  verifyLimitUpgradePayment(payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/payment/verify-upgrade-payment`, payload);
  }
}
