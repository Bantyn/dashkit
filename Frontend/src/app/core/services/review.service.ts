import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Review {
  id: string;
  shopId: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'hidden' | 'published';
  createdAt: Date | any;
  updatedAt: Date | any;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/admin/reviews`; // Wait, actually standard routes use /api/v1/reviews, let's use the generic endpoint via tenant interceptor if applicable. Wait, the frontend usually uses `apiUrl` + endpoint. I will use the standard setup.

  constructor(private http: HttpClient) {}

  getReviews(): Observable<Review[]> {
    return this.http.get<{ success: boolean; data: Review[] }>(`${environment.apiUrl}/reviews`)
      .pipe(map(response => response.data));
  }

  updateReviewStatus(reviewId: string, status: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/reviews/${reviewId}/status`, { status });
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/reviews/${reviewId}`);
  }
}
