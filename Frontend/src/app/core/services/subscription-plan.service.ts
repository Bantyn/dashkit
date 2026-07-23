import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export type SubscriptionPlanRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
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
  limitations?: string[];
};

@Injectable({
  providedIn: 'root',
})
export class SubscriptionPlanService {
  private readonly apiUrl = `${environment.apiUrl}/plans`;

  constructor(private http: HttpClient) {}

  getPlans(activeOnly = true): Observable<ApiResponse<SubscriptionPlanRecord[]>> {
    return this.http.get<ApiResponse<SubscriptionPlanRecord[]>>(
      `${this.apiUrl}?activeOnly=${String(activeOnly)}`,
    );
  }
}
