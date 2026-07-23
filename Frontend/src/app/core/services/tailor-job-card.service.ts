import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface TailorJobCard {
  id: string;
  shopId: string;
  tailorId: string;
  tailorName: string;
  assignedWork: Array<{ item: string; quantity: number }>;
  status: 'assigned' | 'in_progress' | 'completed';
  performanceRating?: number;
  notes?: string;
  assignedDate: string | Date;
  completedDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

@Injectable({
  providedIn: 'root',
})
export class TailorJobCardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tailor-job-cards`;

  listJobCards(shopId: string): Observable<ApiResponse<TailorJobCard[]>> {
    return this.http.get<ApiResponse<TailorJobCard[]>>(`${this.apiUrl}?shopId=${shopId}`);
  }

  getJobCard(shopId: string, id: string): Observable<ApiResponse<TailorJobCard>> {
    return this.http.get<ApiResponse<TailorJobCard>>(`${this.apiUrl}/${id}?shopId=${shopId}`);
  }

  createJobCard(card: Partial<TailorJobCard>): Observable<ApiResponse<TailorJobCard>> {
    return this.http.post<ApiResponse<TailorJobCard>>(`${this.apiUrl}`, card);
  }

  updateJobCard(id: string, card: Partial<TailorJobCard>): Observable<ApiResponse<TailorJobCard>> {
    return this.http.put<ApiResponse<TailorJobCard>>(`${this.apiUrl}/${id}`, card);
  }

  deleteJobCard(shopId: string, id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}?shopId=${shopId}`);
  }
}
