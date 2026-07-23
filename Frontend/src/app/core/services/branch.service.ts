import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { withRequiredPermission } from '../interceptors/enforcement.interceptor';

export interface Branch {
  id: string;
  shopId?: string;
  name: string;
  address: string;
  contactInfo: string;
  manager: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
  source?: 'document' | 'derived';
  allowedModules?: string[];
}

export interface BranchAnalyticsData {
  branchId: string;
  branchName: string;
  sales: number;
  orders: number;
  revenue: number;
  salesChange: string;
  ordersChange: string;
  revenueChange: string;
  insights: string[];
  performanceData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
}

export interface BranchSummary {
  id: string;
  name: string;
  address: string;
  status: 'Active' | 'Inactive';
  metrics: {
    sales: number;
    orders: number;
    revenue: number;
  };
  sparklineData?: number[];
}

export interface UserBranchPermission {
  userId: string;
  userName: string;
  branchId: string;
  branchName: string;
  permissions: string[];
}

export interface BranchActivityItem {
  id: string;
  action: string;
  time: string;
  details: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/branches`;
  private readonly requestTtlMs = 120_000;
  private readonly branchesCache = new Map<string, Observable<{ data: Branch[] }>>();
  private readonly branchByIdCache = new Map<string, Observable<{ data: Branch | null }>>();
  private readonly summariesCache = new Map<string, Observable<{ data: BranchSummary[] }>>();
  private readonly analyticsSummariesCache = new Map<string, Observable<{ data: BranchSummary[] }>>();
  private readonly permissionsCache = new Map<string, Observable<{ data: UserBranchPermission[] }>>();
  private readonly analyticsCache = new Map<string, Observable<{ data: BranchAnalyticsData }>>();
  private readonly activityCache = new Map<string, Observable<{ data: BranchActivityItem[] }>>();

  private cacheRequest<T>(cache: Map<string, Observable<T>>, key: string, factory: () => Observable<T>) {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = factory().pipe(
      shareReplay({ bufferSize: 1, refCount: false, windowTime: this.requestTtlMs }),
    );
    cache.set(key, request$);
    return request$;
  }

  private invalidateShopCache(shopId?: string) {
    if (!shopId) {
      return;
    }

    this.branchesCache.delete(shopId);
    this.summariesCache.delete(shopId);
    this.analyticsSummariesCache.delete(shopId);
    this.permissionsCache.delete(shopId);

    for (const key of this.branchByIdCache.keys()) {
      if (key.startsWith(`${shopId}:`)) {
        this.branchByIdCache.delete(key);
      }
    }

    for (const key of this.analyticsCache.keys()) {
      if (key.startsWith(`${shopId}:`)) {
        this.analyticsCache.delete(key);
      }
    }

    for (const key of this.activityCache.keys()) {
      if (key.startsWith(`${shopId}:`)) {
        this.activityCache.delete(key);
      }
    }
  }

  getBranches(shopId: string): Observable<{ data: Branch[] }> {
    return this.cacheRequest(this.branchesCache, shopId, () =>
      this.http.get<{ data: Branch[] }>(`${this.apiUrl}/shop/${shopId}`, {
        context: withRequiredPermission('view_branches'),
      }),
    );
  }

  getBranchById(shopId: string, id: string): Observable<{ data: Branch | null }> {
    const cacheKey = `${shopId}:${id}`;
    return this.cacheRequest(this.branchByIdCache, cacheKey, () =>
      this.http.get<{ data: Branch | null }>(`${this.apiUrl}/${id}`, {
        params: { shopId },
        context: withRequiredPermission('view_branches'),
      }),
    );
  }

  addBranch(branch: Partial<Branch>): Observable<{ success: boolean; data: Branch }> {
    this.invalidateShopCache(String(branch.shopId || ''));
    return this.http.post<{ success: boolean; data: Branch }>(this.apiUrl, branch, {
      context: withRequiredPermission('edit_branch'),
    });
  }

  updateBranch(id: string, branch: Partial<Branch>): Observable<{ success: boolean; data: Branch }> {
    this.invalidateShopCache(String(branch.shopId || ''));
    return this.http.put<{ success: boolean; data: Branch }>(`${this.apiUrl}/${id}`, branch, {
      context: withRequiredPermission('edit_branch'),
    });
  }

  getBranchAnalytics(
    shopId: string,
    branchId: string,
    dateRange: string = '30d',
  ): Observable<{ data: BranchAnalyticsData }> {
    const cacheKey = `${shopId}:${branchId}:${dateRange}`;
    return this.cacheRequest(this.analyticsCache, cacheKey, () =>
      this.http.get<{ data: BranchAnalyticsData }>(`${this.apiUrl}/shop/${shopId}/${branchId}/analytics`, {
        params: { dateRange },
        context: withRequiredPermission('view_branch_analytics'),
      }),
    );
  }

  getAllBranchSummaries(shopId: string): Observable<{ data: BranchSummary[] }> {
    return this.cacheRequest(this.summariesCache, shopId, () =>
      this.http.get<{ data: BranchSummary[] }>(`${this.apiUrl}/shop/${shopId}/summaries`, {
        context: withRequiredPermission('view_branches'),
      }),
    );
  }

  getBranchAnalyticsSummaries(shopId: string): Observable<{ data: BranchSummary[] }> {
    return this.cacheRequest(this.analyticsSummariesCache, shopId, () =>
      this.http.get<{ data: BranchSummary[] }>(`${this.apiUrl}/shop/${shopId}/analytics-summaries`, {
        context: withRequiredPermission('view_branch_analytics'),
      }),
    );
  }

  getBranchPermissions(shopId: string): Observable<{ data: UserBranchPermission[] }> {
    return this.cacheRequest(this.permissionsCache, shopId, () =>
      this.http.get<{ data: UserBranchPermission[] }>(`${this.apiUrl}/shop/${shopId}/permissions`, {
        context: withRequiredPermission('manage_branch_permissions'),
      }),
    );
  }

  getBranchActivity(
    shopId: string,
    branchId: string,
    limit: number = 10,
  ): Observable<{ data: BranchActivityItem[] }> {
    const cacheKey = `${shopId}:${branchId}:${limit}`;
    return this.cacheRequest(this.activityCache, cacheKey, () =>
      this.http.get<{ data: BranchActivityItem[] }>(`${this.apiUrl}/shop/${shopId}/${branchId}/activity`, {
        params: { limit },
        context: withRequiredPermission('view_branches'),
      }),
    );
  }

  deleteBranch(id: string, shopId: string): Observable<{ success: boolean }> {
    this.invalidateShopCache(shopId);
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, {
      params: { shopId },
      context: withRequiredPermission('edit_branch'),
    });
  }

  clearCache() {
    this.branchesCache.clear();
    this.branchByIdCache.clear();
    this.summariesCache.clear();
    this.analyticsSummariesCache.clear();
    this.permissionsCache.clear();
    this.analyticsCache.clear();
    this.activityCache.clear();
  }
}
