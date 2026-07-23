import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export type TailoringJobType = 'alteration' | 'custom_stitching';
export type TailoringJobStatus = 'measurement_taken' | 'cutting' | 'stitching' | 'trial' | 'ready' | 'delivered';

export interface TailoringJob {
  id?: string;
  shopId: string;
  customerId: string;
  customerName: string;
  phoneNumber?: string;
  type: TailoringJobType;
  status: TailoringJobStatus;
  tailorId?: string;
  tailorName?: string;
  deadline: string;
  measurements?: Record<string, any>;
  notes?: string;
  amount: number;
  paidAmount: number;
  fabricIssued?: string;
  fabricLength?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TailoringService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tailoring`;

  getJobs(shopId: string): Observable<ApiResponse<TailoringJob[]>> {
    return this.http.get<ApiResponse<TailoringJob[]>>(`${this.apiUrl}?shopId=${shopId}`);
  }

  getJob(id: string): Observable<ApiResponse<TailoringJob>> {
    return this.http.get<ApiResponse<TailoringJob>>(`${this.apiUrl}/${id}`);
  }

  createJob(job: Partial<TailoringJob>): Observable<ApiResponse<TailoringJob>> {
    return this.http.post<ApiResponse<TailoringJob>>(`${this.apiUrl}?shopId=${job.shopId}`, job);
  }

  updateJob(id: string, job: Partial<TailoringJob>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, job);
  }

  deleteJob(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
