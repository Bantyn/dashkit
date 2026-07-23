import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface TransactionEntry {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  amount: number;
  method: 'COD' | 'ONLINE' | string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: string;
  date: any;
  paymentDetails?: any;
  shippingAddress?: any;
  type: 'cash' | 'online';
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private ordersUrl = `${environment.apiUrl}/orders/shop`;

  constructor(private http: HttpClient) {}

  /** All transactions — every order in this shop */
  getAllTransactions(shopId: string): Observable<ApiResponse<TransactionEntry[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.ordersUrl}/${shopId}`).pipe(
      map((res) => ({
        ...res,
        data: res.data.map((o) => this.mapOrder(o)),
      }))
    );
  }

  /** Cash transactions — COD orders only */
  getCashTransactions(shopId: string): Observable<ApiResponse<TransactionEntry[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.ordersUrl}/${shopId}`).pipe(
      map((res) => ({
        ...res,
        data: res.data
          .filter((o) => o.paymentMethod === 'cod')
          .map((o) => this.mapOrder(o)),
      }))
    );
  }

  /** Online transactions — Razorpay / online orders only */
  getOnlineTransactions(shopId: string): Observable<ApiResponse<TransactionEntry[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.ordersUrl}/${shopId}`).pipe(
      map((res) => ({
        ...res,
        data: res.data
          .filter((o) => o.paymentMethod === 'online')
          .map((o) => this.mapOrder(o)),
      }))
    );
  }

  getRefundTransactions(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/returns/shop/${shopId}/refunds`);
  }

  private mapOrder(order: any): TransactionEntry {
    const addr = order.shippingAddress || {};
    return {
      id: order.id,
      orderId: order.id,
      customerName: addr.name || addr.fullName || order.customerName || 'Guest',
      customerPhone: addr.phone || addr.phoneNumber || order.customerPhone || '',
      customerEmail: addr.email || order.customerEmail || '',
      amount: order.totalAmount,
      method: (order.paymentMethod || 'cod').toUpperCase(),
      paymentStatus: order.paymentStatus || 'pending',
      orderStatus: order.orderStatus || 'pending',
      date: order.createdAt,
      paymentDetails: order.paymentDetails,
      shippingAddress: addr,
      type: order.paymentMethod === 'online' ? 'online' : 'cash',
    };
  }
}
