import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { withRequiredPermission } from '../../core/interceptors/enforcement.interceptor';
import { AuthService } from '../../core/services/auth.service';
import { REPORT_DEFINITIONS, ReportDefinition, ReportKey } from './reports.constants';

export type ReportFilters = {
  dateRange: string;
  segment: string;
  channel: string;
};

type ReportApiResponse = {
  data?: Partial<ReportDefinition>;
};

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/analytics`;
  private readonly reportCache = new Map<string, Observable<ReportDefinition>>();

  loadReport(reportKey: ReportKey, filters: ReportFilters): Observable<ReportDefinition> {
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) {
      throw new Error('Shop context is required to load reports.');
    }

    const definition = REPORT_DEFINITIONS[reportKey];
    const cacheKey = `${shopId}:${reportKey}:${filters.dateRange}:${filters.segment}:${filters.channel}`;
    const cached = this.reportCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ReportApiResponse>(`${this.apiUrl}/${shopId}/reports/${reportKey}`, {
        params: {
          dateRange: filters.dateRange,
          segment: filters.segment,
          channel: filters.channel,
        },
        context: withRequiredPermission(definition.permission),
      })
      .pipe(
        map((response) => response.data || {}),
        map((liveData) => ({
          ...definition,
          ...liveData,
          segmentOptions: definition.segmentOptions,
          channelOptions: definition.channelOptions,
          permission: definition.permission,
          exportPermission: definition.exportPermission,
          actionPermission: definition.actionPermission,
          actionLabel: definition.actionLabel,
          feature: definition.feature,
          key: definition.key,
          title: definition.title,
        })),
        shareReplay({ bufferSize: 1, refCount: false, windowTime: 120_000 }),
      );

    this.reportCache.set(cacheKey, request$);
    return request$;
  }
}
