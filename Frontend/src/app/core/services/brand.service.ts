import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Brand {
  id?: string;
  shopId: string;
  name: string;
  logo?: string;
  description?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private apiUrl = `${environment.apiUrl}/brands`;

  constructor(private http: HttpClient) {}

  getBrandsByShop(shopId: string): Observable<{ success: boolean; data: Brand[] }> {
    return this.http.get<{ success: boolean; data: Brand[] }>(`${this.apiUrl}?shopId=${shopId}`);
  }

  createBrand(data: Partial<Brand>): Observable<{ success: boolean; data: Brand }> {
    return this.http.post<{ success: boolean; data: Brand }>(this.apiUrl, data);
  }

  updateBrand(id: string, data: Partial<Brand>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, data);
  }

  deleteBrand(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
