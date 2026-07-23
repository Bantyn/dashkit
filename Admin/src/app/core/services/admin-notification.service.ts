import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export type AdminNotificationCategory =
  | 'critical'
  | 'high_priority'
  | 'business'
  | 'shops'
  | 'platform'
  | 'security'
  | 'cost'
  | 'database'
  | 'system_update';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: AdminNotificationCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'unread' | 'read';
  icon: string;
  actionLink?: string;
  metadata?: Record<string, any>;
  createdAt: any;
  readAt?: any;
}

export const CATEGORY_META: Record<AdminNotificationCategory, { icon: string; label: string; color: string; bg: string; border: string }> = {
  critical:      { icon: '🔴', label: 'Critical',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  high_priority: { icon: '🟠', label: 'High Priority',  color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  business:      { icon: '💰', label: 'Business',       color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  shops:         { icon: '🏪', label: 'Shops',          color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  platform:      { icon: '🖥️', label: 'Platform',       color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff' },
  security:      { icon: '🔒', label: 'Security',       color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  cost:          { icon: '💸', label: 'Cost',           color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  database:      { icon: '🗄️', label: 'Database',       color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  system_update: { icon: '🔵', label: 'System Update',  color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
};

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.publicApiUrl}/superadmin/notifications`;

  unreadCount$ = new BehaviorSubject<number>(0);

  /** Fetch notifications (with optional filters) */
  getNotifications(params?: { limit?: number; category?: AdminNotificationCategory; status?: 'unread' | 'read' }): Observable<ApiResponse<{ notifications: AdminNotification[]; unreadCount: number }>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    const url = query.toString() ? `${this.baseUrl}?${query}` : this.baseUrl;
    return this.http.get<ApiResponse<any>>(url).pipe(
      tap((res: any) => {
        if (res?.data?.unreadCount !== undefined) {
          this.unreadCount$.next(res.data.unreadCount);
        }
      })
    );
  }

  /** Mark single notification as read */
  markAsRead(id: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCount$.getValue();
        if (current > 0) this.unreadCount$.next(current - 1);
      })
    );
  }

  /** Mark all as read */
  markAllAsRead(): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.baseUrl}/mark-all-read`, {}).pipe(
      tap(() => this.unreadCount$.next(0))
    );
  }

  /** Delete single notification */
  deleteOne(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  /** Delete ALL notifications */
  deleteAll(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/all`).pipe(
      tap(() => this.unreadCount$.next(0))
    );
  }

  /** Create admin notification manually (for testing) */
  createNotification(data: Partial<AdminNotification>): Observable<ApiResponse<AdminNotification>> {
    return this.http.post<ApiResponse<AdminNotification>>(this.baseUrl, data);
  }

  /** Utility: get metadata for a category */
  getCategoryMeta(category: AdminNotificationCategory) {
    return CATEGORY_META[category] || CATEGORY_META['system_update'];
  }

  /** Utility: format relative time */
  formatTime(date: any): string {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : new Date(date?._seconds ? date._seconds * 1000 : date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
