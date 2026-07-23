import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { ANALYTICS_DEFINITIONS } from './analytics.constants';
import { AnalyticsDefinition, AnalyticsFilters, AnalyticsPageKey } from './analytics.types';
import { environment } from '../../../environments/environment';
import { withRequiredPermission } from '../../core/interceptors/enforcement.interceptor';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/analytics`;
  private readonly cache = new Map<string, Observable<AnalyticsDefinition>>();

  loadPage(
    shopId: string,
    pageKey: AnalyticsPageKey,
    filters: AnalyticsFilters,
  ): Observable<AnalyticsDefinition> {
    const base = ANALYTICS_DEFINITIONS[pageKey];
    const cacheKey = `${shopId}:${pageKey}:${filters.dateRange}:${filters.branch}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<{ data?: Partial<AnalyticsDefinition> }>(`${this.apiUrl}/${shopId}/pages/${pageKey}`, {
        params: {
          dateRange: filters.dateRange,
          branch: filters.branch,
        },
        context: withRequiredPermission(base.permission),
      })
      .pipe(
        map((response) => response.data || {}),
        map((liveData) => ({
          ...base,
          ...liveData,
          key: base.key,
          permission: base.permission,
          feature: base.feature,
          title: liveData.title || base.title,
          subtitle: liveData.subtitle || base.subtitle,
          description: liveData.description || base.description,
          chartTitle: liveData.chartTitle || base.chartTitle,
          chartSubtitle: liveData.chartSubtitle || base.chartSubtitle,
          chartType: liveData.chartType || base.chartType,
          summaryCards: liveData.summaryCards || [],
          labels: liveData.labels || [],
          series: liveData.series || [],
          branchOptions:
            liveData.branchOptions && liveData.branchOptions.length
              ? liveData.branchOptions
              : base.branchOptions,
          insights: liveData.insights || [],
          columns: liveData.columns || [],
          rows: liveData.rows || [],
          emptyTitle: liveData.emptyTitle || base.emptyTitle,
          emptyDescription: liveData.emptyDescription || base.emptyDescription,
        })),
        shareReplay({ bufferSize: 1, refCount: false, windowTime: 120_000 }),
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }
}
