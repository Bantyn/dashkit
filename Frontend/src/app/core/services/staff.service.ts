import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Staff {
  id: string;
  shopId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  role: 'Manager' | 'Cashier' | 'Sales Staff' | 'Inventory Staff' | 'Other';
  branch: string;
  commissionType: 'None' | 'Percentage' | 'Fixed';
  commissionRate: number;
  status: 'Active' | 'Inactive';
  joiningDate: string;
  profilePhoto?: string;
  totalSales?: number;
  totalOrders?: number;
  commissionEarned?: number;
  efficiency?: number;
  rank?: number;
  permissions?: StaffPermissions;
}

export interface StaffPermissions {
  invoices: PermissionSet;
  products: PermissionSet;
  inventory: PermissionSet;
  customers: PermissionSet;
  staff: PermissionSet;
  analytics: { view: boolean };
  settings: { view: boolean; edit: boolean };
}

export interface PermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = `${environment.apiUrl}/staff`;
  private readonly requestTtlMs = 120_000;
  private readonly staffByShopCache = new Map<string, Observable<{ data: Staff[] }>>();
  private readonly staffByIdCache = new Map<string, Observable<{ data: Staff }>>();
  private readonly staffLogsCache = new Map<string, Observable<{ data: any[] }>>();

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

  private invalidateShopCache(shopId?: string) {
    if (!shopId) {
      return;
    }

    this.staffByShopCache.delete(shopId);
    for (const key of this.staffLogsCache.keys()) {
      if (key.startsWith(`${shopId}:`)) {
        this.staffLogsCache.delete(key);
      }
    }
  }

  getStaff(shopId: string): Observable<{ data: Staff[] }> {
    return this.cacheRequest(this.staffByShopCache, shopId, () =>
      this.http.get<{ data: Staff[] }>(`${this.apiUrl}/shop/${shopId}`),
    );
  }

  getStaffById(id: string): Observable<{ data: Staff }> {
    return this.cacheRequest(this.staffByIdCache, id, () =>
      this.http.get<{ data: Staff }>(`${this.apiUrl}/${id}`),
    );
  }

  addStaff(staff: Partial<Staff>): Observable<any> {
    this.invalidateShopCache(String(staff.shopId || ''));
    return this.http.post<any>(this.apiUrl, staff);
  }

  updateStaff(id: string, staff: Partial<Staff>): Observable<any> {
    this.staffByIdCache.delete(id);
    this.invalidateShopCache(String(staff.shopId || ''));
    return this.http.put<any>(`${this.apiUrl}/${id}`, staff);
  }

  deleteStaff(id: string, shopId: string): Observable<any> {
    this.staffByIdCache.delete(id);
    this.invalidateShopCache(shopId);
    return this.http.delete<any>(`${this.apiUrl}/${id}?shopId=${shopId}`);
  }

  getStaffLogs(shopId: string, staffId?: string): Observable<{ data: any[] }> {
    let url = `${this.apiUrl}/shop/${shopId}/logs`;
    if (staffId) url += `?staffId=${staffId}`;
    const cacheKey = `${shopId}:${staffId || 'all'}`;
    return this.cacheRequest(this.staffLogsCache, cacheKey, () =>
      this.http.get<{ data: any[] }>(url),
    );
  }
}
