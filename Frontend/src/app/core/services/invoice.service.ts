import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice } from '../models/invoice.model';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 60 * 1000;

  constructor(private http: HttpClient) {}

  createInvoice(invoiceData: Partial<Invoice>): Observable<ApiResponse<Invoice>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<Invoice>>(this.apiUrl, invoiceData);
  }

  getInvoices(): Observable<ApiResponse<Invoice[]>> {
    return this.requestCache.getOrSet(
      'invoices:all',
      () => this.http.get<ApiResponse<Invoice[]>>(this.apiUrl),
      this.ttlMs,
    ) as Observable<ApiResponse<Invoice[]>>;
  }

  getInvoice(id: string): Observable<ApiResponse<Invoice>> {
    return this.requestCache.getOrSet(
      `invoices:item:${id}`,
      () => this.http.get<ApiResponse<Invoice>>(`${this.apiUrl}/${id}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Invoice>>;
  }

  updateInvoice(id: string, invoiceData: Partial<Invoice>): Observable<ApiResponse<null>> {
    this.requestCache.clear();
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}`, invoiceData);
  }

  deleteInvoice(id: string): Observable<ApiResponse<null>> {
    this.requestCache.clear();
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  getInvoicesByShop(shopId: string): Observable<any> {
    return this.requestCache.getOrSet(
      `invoices:shop:${shopId}`,
      () => this.http.get<any>(`${this.apiUrl}/shop/${shopId}`),
      this.ttlMs,
    ) as Observable<any>;
  }

  getShopInvoice(shopId: string, invoiceId: string): Observable<any> {
    return this.requestCache.getOrSet(
      `invoices:item:${shopId}:${invoiceId}`,
      () => this.http.get<any>(`${this.apiUrl}/${invoiceId}`),
      this.ttlMs,
    ) as Observable<any>;
  }

  getPublicInvoice(invoiceId: string): Observable<any> {
    const publicUrl = `${environment.apiUrl.replace('/admin', '/website')}/invoices`;
    return this.requestCache.getOrSet(
      `invoices:public:${invoiceId}`,
      () => this.http.get<any>(`${publicUrl}/${invoiceId}`),
      this.ttlMs,
    ) as Observable<any>;
  }

  getInvoicesByCustomer(customerId: string): Observable<ApiResponse<Invoice[]>> {
    return this.requestCache.getOrSet(
      `invoices:customer:${customerId}`,
      () => this.http.get<ApiResponse<Invoice[]>>(`${this.apiUrl}/customer/${customerId}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Invoice[]>>;
  }
}
