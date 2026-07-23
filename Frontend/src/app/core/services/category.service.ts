import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(private http: HttpClient) {}

  createCategory(categoryData: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, categoryData);
  }

  getCategories(shopId?: string): Observable<ApiResponse<Category[]>> {
    let url = this.apiUrl;
    let cacheKey = 'categories:all';

    if (shopId) {
      url = `${this.apiUrl}/shop/${shopId}`;
      cacheKey = `categories:shop:${shopId}`;
    }

    return this.requestCache.getOrSet(
      cacheKey,
      () => this.http.get<ApiResponse<Category[]>>(url).pipe(
        tap(res => {
          if (res.success && shopId) {
            localStorage.setItem(`offline_categories_${shopId}`, JSON.stringify(res));
          }
        }),
        catchError(err => {
          if (shopId && (err.status === 0 || err.status === 503 || err.status === 504 || !navigator.onLine)) {
            const cached = localStorage.getItem(`offline_categories_${shopId}`);
            if (cached) {
              return of(JSON.parse(cached));
            }
          }
          return throwError(() => err);
        })
      ),
      this.ttlMs,
    ) as Observable<ApiResponse<Category[]>>;
  }

  getCategory(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`);
  }

  updateCategory(id: string, categoryData: Partial<Category>): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
