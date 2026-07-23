import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalRevenue: number;
  revenueTrend: number;
  totalInvoices: number;
  invoiceTrend: number;
  totalCustomers: number;
  totalOnlineCustomers: number;
  customerTrend: number;
  totalProducts: number;
  productTrend: number;
  totalOrders: number;
  orderTrend: number;
  totalExpenses: number;
  expensesTrend: number;
  pendingInvoices: number;
  lowStockProducts: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  initials: string;
  sold: number;
  revenue: string;
  imageUrl?: string;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerPhone: string;
  customerInitial: string;
  date: string;
  amount: string;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  topProducts: TopProduct[];
  recentInvoices: RecentInvoice[];
  salesChartData: { date: string; value: number }[];
  sparklines?: {
    revenue: number[];
    invoices: number[];
    orders: number[];
    customers: number[];
    products: number[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/analytics`;
  private dashboardCache = new Map<string, Observable<DashboardData>>();
  private announcementsCache$: Observable<any[]> | null = null;

  constructor(private http: HttpClient) {}

  getDashboardData(shopId?: string, period: string = 'this_month', forceRefresh: boolean = false): Observable<DashboardData> {
    const activeBranch = (typeof window !== 'undefined' && localStorage.getItem('active_branch_id')) || 'parent';
    const url = shopId ? `${this.apiUrl}/${shopId}/dashboard` : `${this.apiUrl}/dashboard`;
    const params = { period };
    const cacheKey = `${shopId || 'global'}:${activeBranch}:${period}`;
    
    if (forceRefresh) {
      this.dashboardCache.delete(cacheKey);
    } else {
      const cached = this.dashboardCache.get(cacheKey);
      if (cached) return cached;
    }

    const request$ = this.http.get<any>(url, { params }).pipe(
      map((response) => response.data || response),
      shareReplay({ bufferSize: 1, refCount: false, windowTime: 30_000 }),
    );

    this.dashboardCache.set(cacheKey, request$);
    return request$;
  }

  clearCache() {
    this.dashboardCache.clear();
  }

  getAnnouncements(): Observable<any[]> {
    if (this.announcementsCache$) return this.announcementsCache$;

    this.announcementsCache$ = this.http
      .get<any>(`${environment.apiUrl}/announcements`)
      .pipe(
        map((res) => res.data),
        shareReplay({ bufferSize: 1, refCount: false, windowTime: 300_000 }),
      );

    return this.announcementsCache$;
  }
}
