import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { Offer } from '../models/offer.model';
import { TenantService } from './tenant.service';
import { RequestCache } from '../utils/request-cache.util';

@Injectable({
  providedIn: 'root',
})
export class WebsiteService {
  private apiUrl = `${environment.publicApiUrl}/website`;
  private readonly requestCache = new RequestCache<unknown>();
  private readonly productsTtlMs = 2 * 60 * 1000;
  private readonly productTtlMs = 2 * 60 * 1000;
  private readonly offersTtlMs = 2 * 60 * 1000;
  private readonly categoriesTtlMs = 5 * 60 * 1000;
  private readonly reviewsTtlMs = 60 * 1000;

  constructor(
    private http: HttpClient,
    private tenantService: TenantService,
  ) {}

  private getParams(params: HttpParams = new HttpParams()): HttpParams {
    const subdomain = this.tenantService.getSubdomainSlug();
    if (subdomain) {
      return params.set('subdomain', subdomain);
    }

    const pathSlug = this.tenantService.getPathSlug();
    if (pathSlug) {
      return params.set('subdomain', pathSlug);
    }

    return params;
  }

  private getTenantKey(): string {
    return this.tenantService.getSubdomainSlug() || this.tenantService.getPathSlug() || 'default';
  }

  getProducts(
    filters: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      search?: string;
      collection?: string;
      limit?: number;
    } = {},
  ): Observable<Product[]> {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.collection) params = params.set('collection', filters.collection);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    params = this.getParams(params);
    const key = `products:${this.getTenantKey()}:${params.toString() || 'all'}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: Product[] }>(`${this.apiUrl}/products`, { params })
          .pipe(map((res) => res.data)),
      this.productsTtlMs,
    ) as Observable<Product[]>;
  }

  getCategories(): Observable<string[]> {
    const params = this.getParams();
    const key = `categories:${this.getTenantKey()}:${params.toString() || 'all'}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: string[] }>(`${this.apiUrl}/categories`, { params })
          .pipe(map((res) => ['all', ...(res.data || [])])),
      this.categoriesTtlMs,
    ) as Observable<string[]>;
  }

  getSubcategories(category?: string): Observable<string[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }

    params = this.getParams(params);
    const key = `subcategories:${this.getTenantKey()}:${params.toString() || 'all'}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: string[] }>(`${this.apiUrl}/subcategories`, { params })
          .pipe(map((res) => res.data || [])),
      this.categoriesTtlMs,
    ) as Observable<string[]>;
  }

  getProduct(id: string): Observable<Product> {
    const params = this.getParams();
    const key = `product:${this.getTenantKey()}:${id}:${params.toString()}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: Product }>(`${this.apiUrl}/products/${id}`, { params })
          .pipe(map((res) => res.data)),
      this.productTtlMs,
    ) as Observable<Product>;
  }

  getOffers(): Observable<Offer[]> {
    const params = this.getParams();
    const key = `offers:${this.getTenantKey()}:${params.toString()}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: Offer[] }>(`${this.apiUrl}/offers`, { params })
          .pipe(map((res) => res.data)),
      this.offersTtlMs,
    ) as Observable<Offer[]>;
  }

  getReviews(productId: string): Observable<any[]> {
    const params = this.getParams();
    const key = `reviews:${this.getTenantKey()}:${productId}:${params.toString()}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: any[] }>(`${environment.publicApiUrl}/reviews/${productId}`, { params })
          .pipe(map((res) => res.data)),
      this.reviewsTtlMs,
    ) as Observable<any[]>;
  }

  addReview(reviewData: any): Observable<any> {
    const params = this.getParams();
    this.requestCache.invalidateByPrefix(`reviews:${this.getTenantKey()}:${reviewData.productId}:`);
    return this.http
      .post<{ data: any }>(`${environment.publicApiUrl}/reviews`, reviewData, { params })
      .pipe(map((res) => res.data));
  }

  getSeasonalCollections(): Observable<any[]> {
    const params = this.getParams();
    const key = `seasonal-collections:${this.getTenantKey()}:${params.toString()}`;
    return this.requestCache.getOrSet(
      key,
      () =>
        this.http
          .get<{ data: any[] }>(`${this.apiUrl}/seasonal-collections`, { params })
          .pipe(map((res) => res.data || [])),
      this.offersTtlMs,
    ) as Observable<any[]>;
  }

  getConfig(): Observable<any> {
    const params = this.getParams();
    return this.http.get<{ data: any }>(`${this.apiUrl}/config`, { params }).pipe(map((res) => res.data));
  }
}
