import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { ApiResponse } from '../models/api-response.model';
import { RequestCache } from '../utils/request-cache.util';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private readonly requestCache = new RequestCache<ApiResponse<any>>();
  private readonly ttlMs = 2 * 60 * 1000;

  constructor(private http: HttpClient) {}

  createProduct(productData: Partial<Product>): Observable<ApiResponse<Product>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<Product>>(this.apiUrl, productData);
  }

  getProducts(): Observable<ApiResponse<Product[]>> {
    return this.requestCache.getOrSet(
      'products:all',
      () => this.http.get<ApiResponse<Product[]>>(this.apiUrl),
      this.ttlMs,
    ) as Observable<ApiResponse<Product[]>>;
  }

  getProduct(id: string): Observable<ApiResponse<Product>> {
    return this.requestCache.getOrSet(
      `products:item:${id}`,
      () => this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Product>>;
  }

  updateProduct(id: string, productData: Partial<Product>): Observable<ApiResponse<null>> {
    this.requestCache.clear();
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}`, productData);
  }

  deleteProduct(id: string): Observable<ApiResponse<null>> {
    this.requestCache.clear();
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  deleteAllProducts(shopId: string): Observable<ApiResponse<{deletedCount: number}>> {
    this.requestCache.clear();
    return this.http.delete<ApiResponse<{deletedCount: number}>>(`${this.apiUrl}/shop/${shopId}/all`);
  }

  getProductsByShop(shopId: string): Observable<ApiResponse<Product[]>> {
    return this.requestCache.getOrSet(
      `products:shop:${shopId}`,
      () => this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/shop/${shopId}`).pipe(
        tap(res => {
          if (res.success) {
            localStorage.setItem(`offline_products_${shopId}`, JSON.stringify(res));
          }
        }),
        catchError(err => {
          if (err.status === 0 || err.status === 503 || err.status === 504 || !navigator.onLine) {
            const cached = localStorage.getItem(`offline_products_${shopId}`);
            if (cached) {
              return of(JSON.parse(cached));
            }
          }
          return throwError(() => err);
        })
      ),
      this.ttlMs,
    ) as Observable<ApiResponse<Product[]>>;
  }

  getProductByBarcode(shopId: string, barcode: string): Observable<ApiResponse<Product>> {
    return this.requestCache.getOrSet(
      `products:barcode:${shopId}:${barcode}`,
      () => this.http.get<ApiResponse<Product>>(`${this.apiUrl}/barcode/${shopId}/${barcode}`),
      this.ttlMs,
    ) as Observable<ApiResponse<Product>>;
  }

  bulkImport(shopId: string, products: any[]): Observable<ApiResponse<{ count: number }>> {
    this.requestCache.clear();
    return this.http.post<ApiResponse<{ count: number }>>(`${this.apiUrl}/bulk-import`, { shopId, products });
  }
}
