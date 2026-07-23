import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-shop-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Shop Reviews</h2>
            <p class="text-xs text-gray-500 mt-1">Manage and audit feedback/reviews left by customers for merchant stores.</p>
          </div>
          <div class="flex gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 shadow-sm">
              Total: {{ filteredReviews.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Search & Filters -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4 flex-col md:flex-row">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                placeholder="Search by reviewer, shop or comment…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <select
              [(ngModel)]="statusFilter"
              class="w-full md:w-48 px-3 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="reported">Reported</option>
            </select>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (filteredReviews.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1">
                  <i class="bi bi-star text-4xl text-gray-300 mb-2"></i>
                  <p class="text-sm font-bold">No reviews found.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Shop</th>
                        <th class="px-6 py-4">Reviewer</th>
                        <th class="px-6 py-4">Rating</th>
                        <th class="px-6 py-4">Comment</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (rev of filteredReviews; track rev.id) {
                        <tr
                          (click)="selectedReview = rev"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedReview?.id === rev.id"
                        >
                          <td class="px-6 py-4">
                            <span class="font-bold text-gray-900">{{ rev.shopName }}</span>
                          </td>
                          <td class="px-6 py-4">
                            <span class="font-semibold text-gray-700">{{ rev.reviewerName }}</span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="flex gap-0.5 text-amber-400">
                              <i *ngFor="let star of [1,2,3,4,5]" class="bi" [class.bi-star-fill]="rev.rating >= star" [class.bi-star]="rev.rating < star"></i>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                            {{ rev.comment }}
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                              [class.bg-green-50]="rev.status === 'approved'"
                              [class.text-green-700]="rev.status === 'approved'"
                              [class.border-green-100]="rev.status === 'approved'"
                              [class.bg-amber-50]="rev.status === 'pending'"
                              [class.text-amber-700]="rev.status === 'pending'"
                              [class.border-amber-100]="rev.status === 'pending'"
                              [class.bg-red-50]="rev.status === 'reported'"
                              [class.text-red-700]="rev.status === 'reported'"
                              [class.border-red-100]="rev.status === 'reported'"
                            >
                              {{ rev.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-[11px] text-gray-400">
                            {{ rev.createdAt | date:'dd MMM yyyy' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Short Info) -->
        <div *ngIf="selectedReview" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Review Details</h3>
            <button (click)="selectedReview = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-xl mb-3 shadow-sm border border-indigo-100">
                {{ revInitials }}
              </div>
              <h4 class="font-bold text-gray-900 text-base leading-tight">{{ selectedReview.reviewerName }}</h4>
              <p class="text-xs text-gray-400 font-mono mt-1">For: {{ selectedReview.shopName }}</p>
              <div class="mt-3 flex gap-0.5 text-amber-400 text-lg">
                <i *ngFor="let star of [1,2,3,4,5]" class="bi" [class.bi-star-fill]="selectedReview.rating >= star" [class.bi-star]="selectedReview.rating < star"></i>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</span>
                <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                  [class.bg-green-50]="selectedReview.status === 'approved'"
                  [class.text-green-700]="selectedReview.status === 'approved'"
                  [class.border-green-100]="selectedReview.status === 'approved'"
                  [class.bg-amber-50]="selectedReview.status === 'pending'"
                  [class.text-amber-700]="selectedReview.status === 'pending'"
                  [class.border-amber-100]="selectedReview.status === 'pending'"
                  [class.bg-red-50]="selectedReview.status === 'reported'"
                  [class.text-red-700]="selectedReview.status === 'reported'"
                  [class.border-red-100]="selectedReview.status === 'reported'"
                >
                  {{ selectedReview.status }}
                </span>
              </div>

              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Comment</span>
                <div class="bg-white p-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {{ selectedReview.comment }}
                </div>
              </div>

              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted On</span>
                <span class="text-sm font-bold text-gray-900">{{ selectedReview.createdAt | date:'dd MMM yyyy, hh:mm a' }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            @if (selectedReview.status !== 'approved') {
              <button
                (click)="approveReview(selectedReview.id)"
                class="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all text-xs uppercase tracking-wider text-center"
              >
                Approve
              </button>
            }
            <button
              (click)="deleteReview(selectedReview.id)"
              class="flex-1 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-100/50 transition-all text-xs uppercase tracking-wider text-center"
            >
              Delete / Hide
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ShopReviewsComponent {
  search = '';
  statusFilter = '';

  reviews = [
    { id: '1', shopName: 'Fashion Hub', shopId: 'shop_001', reviewerName: 'John Doe', rating: 5, comment: 'Amazing products and extremely fast delivery. Highly recommended!', status: 'approved', createdAt: new Date('2026-07-01') },
    { id: '2', shopName: 'Trendy Wear', shopId: 'shop_002', reviewerName: 'Alice Smith', rating: 4, comment: 'Good quality clothes, but the size selector could be improved.', status: 'approved', createdAt: new Date('2026-07-03') },
    { id: '3', shopName: 'Clothify Store', shopId: 'shop_003', reviewerName: 'Bob Johnson', rating: 1, comment: 'Terrible customer support. Did not receive my order!', status: 'reported', createdAt: new Date('2026-07-05') },
    { id: '4', shopName: 'Smart Outlet', shopId: 'shop_004', reviewerName: 'Clara Oswald', rating: 3, comment: 'Average collection. Prices are slightly high for the quality.', status: 'pending', createdAt: new Date('2026-07-08') },
  ];

  selectedReview: typeof this.reviews[0] | null = null;

  get filteredReviews() {
    const q = this.search.trim().toLowerCase();
    const s = this.statusFilter;
    return this.reviews.filter(rev => {
      const matchQ = !q || rev.reviewerName.toLowerCase().includes(q) || rev.shopName.toLowerCase().includes(q) || rev.comment.toLowerCase().includes(q);
      const matchS = !s || rev.status === s;
      return matchQ && matchS;
    });
  }

  get revInitials() {
    if (!this.selectedReview) return 'R';
    return (this.selectedReview.reviewerName || 'R').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  approveReview(id: string) {
    const rev = this.reviews.find(r => r.id === id);
    if (rev) {
      rev.status = 'approved';
    }
  }

  deleteReview(id: string) {
    if (confirm('Are you sure you want to hide/delete this review?')) {
      this.reviews = this.reviews.filter(r => r.id !== id);
      this.selectedReview = null;
    }
  }
}
