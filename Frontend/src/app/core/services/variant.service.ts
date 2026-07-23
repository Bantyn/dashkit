import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Variant {
  id?: string;
  shopId: string;
  name: string;
  values: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VariantService {
  private apiUrl = `${environment.apiUrl}/variants`;

  constructor(private http: HttpClient) {}

  getVariantsByShop(shopId: string): Observable<{ success: boolean; data: Variant[] }> {
    return this.http.get<{ success: boolean; data: Variant[] }>(`${this.apiUrl}?shopId=${shopId}`);
  }

  createVariant(data: Partial<Variant>): Observable<{ success: boolean; data: Variant }> {
    return this.http.post<{ success: boolean; data: Variant }>(this.apiUrl, data);
  }

  updateVariant(id: string, data: Partial<Variant>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, data);
  }

  deleteVariant(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
