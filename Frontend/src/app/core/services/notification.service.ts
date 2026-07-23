import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationCache = new Map<string, Observable<ApiResponse<Notification[]>>>();

  getNotifications(shopId: string): Observable<ApiResponse<Notification[]>> {
    const cached = this.notificationCache.get(shopId);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<Notification[]>>(`${this.apiUrl}/shop/${shopId}`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false, windowTime: 15_000 }));

    this.notificationCache.set(shopId, request$);
    return request$;
  }

  markAsRead(id: string): Observable<ApiResponse<any>> {
    this.notificationCache.clear();
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(shopId: string): Observable<ApiResponse<any>> {
    this.notificationCache.clear();
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/shop/${shopId}/read-all`, {});
  }

  deleteNotification(id: string): Observable<ApiResponse<any>> {
    this.notificationCache.clear();
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  deleteAllNotifications(shopId: string): Observable<ApiResponse<any>> {
    this.notificationCache.clear();
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/shop/${shopId}/delete-all`);
  }

  getTemplates(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/templates?shopId=${shopId}`);
  }

  saveTemplate(template: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: string, template: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/templates/${id}`, template);
  }

  getLogs(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/logs?shopId=${shopId}`);
  }

  sendTestNotification(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/send-test`, payload);
  }
}
