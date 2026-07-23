import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService, Review } from '../../core/services/review.service';
import { ProductService } from '../../core/services/product.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { forkJoin, map, switchMap, tap } from 'rxjs';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex overflow-hidden">
      <!-- ─── Left Panel: Reviews List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Reviews</h2>
        </div>

        <!-- Search & Filter -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100 flex gap-4">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by product or customer..."
              class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
          <select
            [(ngModel)]="statusFilter"
            class="px-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Reviews</option>
            <option value="approved">Published</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Product</th>
                  <th class="px-6 py-3">Rating</th>
                  <th class="px-6 py-3">Date</th>
                  <th class="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (isLoading) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      Loading reviews...
                    </td>
                  </tr>
                } @else if (filteredReviews.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      No reviews found.
                    </td>
                  </tr>
                } @else {
                  @for (review of filteredReviews; track review.id) {
                    <tr
                      (click)="selectReview(review)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedReview?.id === review.id"
                    >
                      <td class="px-6 py-4">
                        <div class="font-medium text-gray-900 text-sm">{{ review.customerName }}</div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <img [src]="getProductImage(review.productId)" class="w-8 h-8 rounded-md object-cover border border-gray-200" />
                          <span class="text-sm text-gray-700 truncate max-w-[150px]">{{ getProductName(review.productId) }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex text-yellow-400 text-sm">
                          @for (star of [1, 2, 3, 4, 5]; track star) {
                            <i class="bi" [class.bi-star-fill]="star <= review.rating" [class.bi-star]="star > review.rating" [class.text-gray-300]="star > review.rating"></i>
                          }
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {{ (review.createdAt?.seconds ? review.createdAt.seconds * 1000 : review.createdAt) | date: 'mediumDate' }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2.5 py-1 text-xs font-medium rounded-full"
                          [class.bg-green-100]="review.status === 'approved'"
                          [class.text-green-700]="review.status === 'approved'"
                          [class.bg-yellow-100]="review.status === 'pending'"
                          [class.text-yellow-700]="review.status === 'pending'"
                        >
                          {{ review.status === 'approved' ? 'Published' : 'Pending' }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── Right Panel: Review Details ─── -->
      <div
        class="w-[450px] shrink-0 bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-all duration-300 z-10 border-l border-gray-200"
        *ngIf="selectedReview"
      >
        <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 class="font-bold text-gray-900">Review Details</h3>
          <button
            (click)="closeDetail()"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <!-- Product Info -->
          <div class="flex gap-4 items-center mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <img [src]="getProductImage(selectedReview.productId)" class="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-white" />
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Product</p>
              <h4 class="font-bold text-gray-900 leading-tight">{{ getProductName(selectedReview.productId) }}</h4>
            </div>
          </div>

          <!-- Customer Info & Rating -->
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
              <div class="font-bold text-gray-900">{{ selectedReview.customerName }}</div>
              <div class="text-sm text-gray-500">{{ (selectedReview.createdAt?.seconds ? selectedReview.createdAt.seconds * 1000 : selectedReview.createdAt) | date: 'medium' }}</div>
            </div>
            <div class="flex text-yellow-400 text-lg">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <i class="bi" [class.bi-star-fill]="star <= selectedReview.rating" [class.bi-star]="star > selectedReview.rating" [class.text-gray-300]="star > selectedReview.rating"></i>
              }
            </div>
          </div>

          <!-- Review Comment -->
          <div class="mt-6" *ngIf="selectedReview.comment">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Review Content</p>
            <div class="bg-[#f8f9fa] rounded-xl p-5 text-gray-700 text-sm italic border border-gray-100 relative">
              <i class="bi bi-quote absolute top-2 left-2 text-3xl text-gray-200 opacity-50"></i>
              <p class="relative z-10 pt-2">{{ selectedReview.comment }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons Footer -->
        <div class="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            class="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors border"
            [class.bg-white]="selectedReview.status === 'approved'"
            [class.border-gray-300]="selectedReview.status === 'approved'"
            [class.text-gray-700]="selectedReview.status === 'approved'"
            [class.bg-black]="selectedReview.status === 'pending'"
            [class.text-white]="selectedReview.status === 'pending'"
            [class.border-black]="selectedReview.status === 'pending'"
            (click)="toggleStatus(selectedReview.status === 'approved' ? 'pending' : 'approved')"
          >
            <i class="bi mr-2" [class.bi-eye-fill]="selectedReview.status === 'pending'" [class.bi-eye-slash-fill]="selectedReview.status === 'approved'"></i>
            {{ selectedReview.status === 'approved' ? 'Hide Review' : 'Publish Review' }}
          </button>
          
          <button
            class="px-4 py-2.5 rounded-lg font-bold text-sm bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
            (click)="deleteReview()"
          >
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  productsMap: Map<string, Product> = new Map();
  searchQuery = '';
  statusFilter: 'all' | 'approved' | 'pending' = 'all';
  selectedReview: Review | null = null;
  isLoading = true;

  constructor(
    private reviewService: ReviewService,
    private productService: ProductService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.reviewService.getReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        // Collect unique product IDs to fetch their details
        const productIds = Array.from(new Set(reviews.map(r => r.productId)));
        if (productIds.length > 0) {
          this.productService.getProducts().subscribe(response => {
            const productsList = Array.isArray(response) ? response : (response.data || []);
            productsList.forEach((p: Product) => this.productsMap.set(p.id, p));
            this.isLoading = false;
          });
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getProductName(productId: string): string {
    return this.productsMap.get(productId)?.name || 'Unknown Product';
  }

  getProductImage(productId: string): string {
    const product = this.productsMap.get(productId);
    return (product && product.images && product.images.length > 0) ? product.images[0] : '/Cloth_placeholder.png';
  }

  get filteredReviews(): Review[] {
    return this.reviews.filter(r => {
      const pName = this.getProductName(r.productId).toLowerCase();
      const cName = r.customerName.toLowerCase();
      const sq = this.searchQuery.toLowerCase();
      
      const matchesSearch = !sq || pName.includes(sq) || cName.includes(sq);
      const matchesStatus = this.statusFilter === 'all' || r.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  selectReview(review: Review) {
    this.selectedReview = review;
  }

  closeDetail() {
    this.selectedReview = null;
  }

  toggleStatus(newStatus: 'approved' | 'pending') {
    if (this.selectedReview) {
      const oldStatus = this.selectedReview.status;
      // Optimistic update
      this.selectedReview.status = newStatus;
      
      this.reviewService.updateReviewStatus(this.selectedReview.id, newStatus).subscribe({
        error: () => {
          // Revert on error
          if (this.selectedReview) {
            this.selectedReview.status = oldStatus;
          }
        }
      });
      
    }
  }

  async deleteReview() {
    if (this.selectedReview) {
      const confirmed = await this.confirmationService.confirm({
        title: 'Delete Review?',
        description: 'Are you sure you want to delete this review?',
        type: 'danger',
        primaryButtonText: 'Delete',
        secondaryButtonText: 'Cancel'
      });
      if (!confirmed) return;

      const id = this.selectedReview.id;
      this.reviews = this.reviews.filter(r => r.id !== id);
      this.selectedReview = null;
      this.reviewService.deleteReview(id).subscribe();
    }
  }
}
