import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Offer } from '../models/offer.model';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

@Injectable({
  providedIn: 'root',
})
export class OfferService {
  private apiUrl = `${environment.apiUrl}/offers`;
  private readonly requestCache = new RequestCache<ApiResponse<Offer[]>>();
  private readonly ttlMs = 60 * 1000;

  constructor(private http: HttpClient) {}

  createOffer(offer: Partial<Offer>): Observable<ApiResponse<Offer>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<Offer>>(this.apiUrl, offer);
  }

  getOffers(shopId: string, type?: string, status?: string): Observable<ApiResponse<Offer[]>> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);

    const key = `offers:shop:${shopId}:${params.toString() || 'all'}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http.get<ApiResponse<Offer[]>>(`${this.apiUrl}/shop/${shopId}`, {
          params,
        }),
      this.ttlMs,
    ) as Observable<ApiResponse<Offer[]>>;
  }

  updateOffer(id: string, updates: Partial<Offer>): Observable<ApiResponse<Offer>> {
    this.requestCache.clear();
    return this.http.put<ApiResponse<Offer>>(`${this.apiUrl}/${id}`, updates);
  }

  deleteOffer(id: string): Observable<ApiResponse<void>> {
    this.requestCache.clear();
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  validateCoupon(code: string, shopId: string, cartAmount: number, customerId?: string): Observable<ApiResponse<Offer>> {
    const payload: any = { code, shopId, cartAmount };
    if (customerId) payload.customerId = customerId;
    return this.http.post<ApiResponse<Offer>>(`${this.apiUrl}/validate`, payload);
  }
}
