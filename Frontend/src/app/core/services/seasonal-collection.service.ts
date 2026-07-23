import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface SeasonalCollection {
  id: string;
  shopId: string;
  name: string;
  season: 'summer' | 'winter' | 'festive' | 'other';
  description?: string;
  active: boolean;
  productIds: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

@Injectable({
  providedIn: 'root',
})
export class SeasonalCollectionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/seasonal-collections`;

  listCollections(shopId: string, activeOnly = false): Observable<ApiResponse<SeasonalCollection[]>> {
    return this.http.get<ApiResponse<SeasonalCollection[]>>(`${this.apiUrl}?shopId=${shopId}&activeOnly=${activeOnly}`);
  }

  getCollection(shopId: string, id: string): Observable<ApiResponse<SeasonalCollection>> {
    return this.http.get<ApiResponse<SeasonalCollection>>(`${this.apiUrl}/${id}?shopId=${shopId}`);
  }

  createCollection(collection: Partial<SeasonalCollection>): Observable<ApiResponse<SeasonalCollection>> {
    return this.http.post<ApiResponse<SeasonalCollection>>(`${this.apiUrl}`, collection);
  }

  updateCollection(id: string, collection: Partial<SeasonalCollection>): Observable<ApiResponse<SeasonalCollection>> {
    return this.http.put<ApiResponse<SeasonalCollection>>(`${this.apiUrl}/${id}`, collection);
  }

  deleteCollection(shopId: string, id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}?shopId=${shopId}`);
  }
}
