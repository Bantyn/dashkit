import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;
  private readonly requestTtlMs = 120_000;
  private readonly dashboardStatsCache = new Map<string, Observable<{ data: any }>>();
  private readonly staffLeaderboardCache = new Map<string, Observable<{ data: any[] }>>();

  constructor(private http: HttpClient) {}

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

  getDashboardStats(shopId: string, staffId?: string): Observable<{ data: any }> {
    let url = `${this.apiUrl}/${shopId}/dashboard`;
    if (staffId) url += `?staffId=${staffId}`;
    const cacheKey = `${shopId}:${staffId || 'all'}`;
    return this.cacheRequest(this.dashboardStatsCache, cacheKey, () =>
      this.http.get<{ data: any }>(url),
    );
  }

  getStaffLeaderboard(shopId: string): Observable<{ data: any[] }> {
    return this.cacheRequest(this.staffLeaderboardCache, shopId, () =>
      this.http.get<{ data: any[] }>(`${this.apiUrl}/${shopId}/staff-performance`),
    );
  }
}
