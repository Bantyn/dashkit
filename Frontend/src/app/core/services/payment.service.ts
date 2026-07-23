import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Order } from '../models/order.model';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  method: string;
  date: Date;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paymentDetails?: any;
}

export interface AutoPaySubscriptionResult {
  subscriptionId: string;
  shortUrl: string;
  paymentUrl: string;
  status: string;
  razorpayKeyId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private ordersUrl = `${environment.apiUrl}/orders/shop`;
  private paymentUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  getPaymentsByShop(shopId: string): Observable<ApiResponse<PaymentTransaction[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.ordersUrl}/${shopId}`).pipe(
      map((response) => {
        const orders = response.data;
        const transactions: PaymentTransaction[] = orders.map((order: any) => ({
          id: `TRX-${order.id.slice(-6).toUpperCase()}`,
          orderId: order.id,
          customerName: order.shippingAddress?.name || order.shippingAddress?.fullName || order.customerName || order.customerEmail || 'Guest',
          amount: order.totalAmount,
          method: order.paymentMethod?.toUpperCase() || 'COD',
          date: order.createdAt,
          status: this.mapStatus(order.paymentStatus),
          paymentDetails: order.paymentDetails,
        }));

        transactions.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        return {
          ...response,
          data: transactions,
        };
      }),
    );
  }

  // ─── AutoPay / eMandate (Razorpay Subscriptions API) ─────────────────────────

  /**
   * Creates a Razorpay Subscription for the given shop and plan.
   * Returns a paymentUrl (Razorpay hosted page) to redirect the user for mandate registration.
   */
  createAutoPaySubscription(
    shopId: string,
    planCode: string,
    billingCycle: 'monthly' | 'yearly'
  ): Observable<ApiResponse<AutoPaySubscriptionResult>> {
    return this.http.post<ApiResponse<AutoPaySubscriptionResult>>(
      `${this.paymentUrl}/create-subscription`,
      { shopId, planCode, billingCycle }
    );
  }

  /**
   * Cancels an active AutoPay subscription. Optionally cancels at cycle end.
   */
  cancelAutoPaySubscription(
    shopId: string,
    cancelAtCycleEnd = true
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.paymentUrl}/cancel-subscription`,
      { shopId, cancelAtCycleEnd }
    );
  }

  /**
   * Fetches the active add-ons for the shop.
   */
  getActiveAddons(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/shops/${shopId}/addons`
    );
  }

  /**
   * Fetches the upcoming invoice for the shop.
   */
  getUpcomingInvoice(shopId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/shops/${shopId}/addons/upcoming-invoice`
    );
  }

  /**
   * Fetches the billing transactions for the shop.
   */
  getShopBillingTransactions(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/shops/${shopId}/addons/billing-transactions`
    );
  }

  /**
   * Cancels an active add-on.
   */
  cancelAddon(shopId: string, itemId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/shops/${shopId}/addons/${itemId}/cancel`,
      {}
    );
  }

  /**
   * Pauses the active AutoPay subscription.
   */
  pauseAutoPaySubscription(shopId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.paymentUrl}/pause-subscription`,
      { shopId }
    );
  }

  /**
   * Resumes a paused AutoPay subscription.
   */
  resumeAutoPaySubscription(shopId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.paymentUrl}/resume-subscription`,
      { shopId }
    );
  }

  private mapStatus(status: string): any {
    if (status === 'paid') return 'success';
    return status;
  }
}
