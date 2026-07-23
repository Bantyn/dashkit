import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Promotion } from '../models/promotion.model';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = `${environment.apiUrl}/promotions`;

  constructor(private http: HttpClient) {}

  getPromotions(shopId: string): Observable<{ success: boolean; data: Promotion[] }> {
    return this.http.get<{ success: boolean; data: Promotion[] }>(`${this.apiUrl}/shop/${shopId}`);
  }

  getPromotion(id: string): Observable<{ success: boolean; data: Promotion }> {
    return this.http.get<{ success: boolean; data: Promotion }>(`${this.apiUrl}/${id}`);
  }

  createPromotion(data: Promotion): Observable<{ success: boolean; data: Promotion }> {
    return this.http.post<{ success: boolean; data: Promotion }>(this.apiUrl, data);
  }

  updatePromotion(id: string, data: Partial<Promotion>): Observable<{ success: boolean; data: Promotion }> {
    return this.http.put<{ success: boolean; data: Promotion }>(`${this.apiUrl}/${id}`, data);
  }

  deletePromotion(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.delete<{ success: boolean; data: any }>(`${this.apiUrl}/${id}`);
  }
}
