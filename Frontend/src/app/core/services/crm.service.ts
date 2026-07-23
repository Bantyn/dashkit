import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export type CustomerSegment = 'vip' | 'loyal' | 'regular' | 'new' | 'at_risk';

export interface SegmentSummary {
  segment: CustomerSegment;
  count: number;
  totalRevenue: number;
  avgOrderValue: number;
  label: string;
  color: string;
  description: string;
}

export interface CRMCustomer {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchase?: string;
  anniversaryDate?: string;
  segment: CustomerSegment;
  tags?: string[];
  createdAt: any;
}

export interface BirthdayEntry {
  customerId: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  age?: number;
  totalSpent: number;
  totalOrders: number;
  segment: CustomerSegment;
}

export interface AnniversaryEntry {
  customerId: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  anniversaryDate: string;
  yearsCompleted?: number;
  totalSpent: number;
  totalOrders: number;
  segment: CustomerSegment;
}


@Injectable({ providedIn: 'root' })
export class CRMService {
  private readonly base = `${environment.apiUrl}/crm`;

  constructor(private http: HttpClient) {}

  getSegmentedCustomers(shopId: string): Observable<ApiResponse<{ summaries: SegmentSummary[]; buckets: Record<CustomerSegment, CRMCustomer[]>; totalCustomers: number }>> {
    return this.http.get<any>(`${this.base}/${shopId}/segments`);
  }

  getVIPCustomers(shopId: string): Observable<ApiResponse<{ customers: CRMCustomer[]; count: number; totalRevenue: number }>> {
    return this.http.get<any>(`${this.base}/${shopId}/vip`);
  }

  getTodaysBirthdays(shopId: string): Observable<ApiResponse<BirthdayEntry[]>> {
    return this.http.get<any>(`${this.base}/${shopId}/birthdays/today`);
  }

  getUpcomingBirthdays(shopId: string, days = 30): Observable<ApiResponse<BirthdayEntry[]>> {
    return this.http.get<any>(`${this.base}/${shopId}/birthdays/upcoming?days=${days}`);
  }

  getTodaysAnniversaries(shopId: string): Observable<ApiResponse<AnniversaryEntry[]>> {
    return this.http.get<any>(`${this.base}/${shopId}/anniversaries/today`);
  }

  getUpcomingAnniversaries(shopId: string, days = 30): Observable<ApiResponse<AnniversaryEntry[]>> {
    return this.http.get<any>(`${this.base}/${shopId}/anniversaries/upcoming?days=${days}`);
  }


  recalculateSegments(shopId: string): Observable<ApiResponse<{ updated: number }>> {
    return this.http.post<any>(`${this.base}/${shopId}/recalculate-segments`, {});
  }
}
