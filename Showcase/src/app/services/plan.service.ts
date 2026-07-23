import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price?: number | null;
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  currency: string;
  badge?: string;
  targetAudience?: string;
  capabilityLabel?: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  features: string[];
  limits?: Record<string, number | null | undefined>;
  limitations?: string[];
  metadata?: {
    maxInvoices?: number | null;
    maxStaff?: number | null;
    maxBranches?: number | null;
    websiteEnabled?: boolean;
    onlineSellingEnabled?: boolean;
    apiAccess?: boolean;
    customBranding?: boolean;
    autoPayEligible?: boolean;
    isUltraSmallBusiness?: boolean;
  };
  isCustom?: boolean;
  includedStorageBytes?: number;
  includedStorageMB?: number;
  storageUnit?: 'MB' | 'GB';
  storageDisplay?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private http = inject(HttpClient);
  
  private getApiUrl(): string {
    const windowEnv = (window as any)?.__env?.API_URL;
    if (windowEnv) return `${windowEnv}/plans`;
    return `${environment.apiUrl}/plans`;
  }
  private apiUrl = this.getApiUrl();

  getPlans(activeOnly: boolean = true): Observable<ApiResponse<SubscriptionPlan[]>> {
    return this.http.get<ApiResponse<SubscriptionPlan[]>>(`${this.apiUrl}?activeOnly=${activeOnly}`);
  }

  getPlan(id: string): Observable<ApiResponse<SubscriptionPlan>> {
    return this.http.get<ApiResponse<SubscriptionPlan>>(`${this.apiUrl}/${id}`);
  }
}
