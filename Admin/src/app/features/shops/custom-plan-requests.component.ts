import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, CustomPlanRequest, CustomPlanRequestStatus } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';

const STATUS_CONFIG: Record<CustomPlanRequestStatus, { label: string; classes: string }> = {
  SUBMITTED:            { label: 'Submitted',            classes: 'bg-blue-50 text-blue-700 border-blue-100' },
  UNDER_REVIEW:         { label: 'Under Review',         classes: 'bg-amber-50 text-amber-700 border-amber-100' },
  QUOTED:               { label: 'Quoted',               classes: 'bg-purple-50 text-purple-700 border-purple-100' },
  PAYMENT_PENDING:      { label: 'Payment Pending',      classes: 'bg-orange-50 text-orange-700 border-orange-100' },
  PAYMENT_COMPLETED:    { label: 'Payment Completed',    classes: 'bg-green-50 text-green-700 border-green-100' },
  REGISTRATION_PENDING: { label: 'Registration Pending', classes: 'bg-teal-50 text-teal-700 border-teal-100' },
  SHOP_REGISTERED:      { label: 'Shop Registered',      classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  CANCELLED:            { label: 'Cancelled',            classes: 'bg-red-50 text-red-700 border-red-100' },
};

@Component({
  selector: 'app-custom-plan-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Custom Plan Requests</h2>
            <p class="text-xs text-gray-500 mt-1">Manage and review custom plan requests submitted from the pricing page.</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100">
              Total: {{ filtered.length }}
            </span>
            <button
              (click)="loadRequests()"
              class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Filters -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4 flex-col md:flex-row">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="applyFilters()"
                placeholder="Search by name, business, email or phone…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <select
              [(ngModel)]="statusFilter"
              (change)="applyFilters()"
              class="px-3 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none w-full md:w-52">
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="QUOTED">Quoted</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="PAYMENT_COMPLETED">Payment Completed</option>
              <option value="REGISTRATION_PENDING">Registration Pending</option>
              <option value="SHOP_REGISTERED">Shop Registered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              [(ngModel)]="sortBy"
              (change)="applyFilters()"
              class="px-3 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none w-full md:w-44">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">

              @if (loading) {
                <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span class="text-sm">Loading requests…</span>
                </div>
              } @else if (error) {
                <div class="p-12 text-center text-red-600 flex flex-col items-center justify-center">
                  <i class="bi bi-exclamation-triangle text-3xl mb-3 block"></i>
                  <p class="text-sm font-medium">{{ error }}</p>
                  <button (click)="loadRequests()" class="mt-4 text-xs font-bold tracking-wider uppercase text-primary-600 hover:text-primary-800 transition-colors underline">Try Again</button>
                </div>
              } @else if (paginated.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <i class="bi bi-clipboard-x text-4xl mb-2 text-gray-300"></i>
                  <p class="text-sm font-bold">No custom plan requests found.</p>
                  <p class="text-xs text-gray-400">Requests submitted from the pricing page will appear here.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-5 py-4">Business</th>
                        <th class="px-5 py-4">Contact</th>
                        <th class="px-5 py-4">Features</th>
                        <th class="px-5 py-4">Est. Price</th>
                        <th class="px-5 py-4">Final Price</th>
                        <th class="px-5 py-4">Status</th>
                        <th class="px-5 py-4">Requested</th>
                        <th class="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (req of paginated; track req.id) {
                        <tr
                          (click)="openDetail(req)"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedRequest?.id === req.id"
                        >
                          <!-- Business -->
                          <td class="px-5 py-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                                {{ (req.shopName || 'S').charAt(0).toUpperCase() }}
                              </div>
                              <div>
                                <div class="font-bold text-gray-900 text-sm">{{ req.shopName }}</div>
                                <div class="text-[10px] text-gray-400 font-mono mt-0.5">{{ req.id.slice(0, 8) }}…</div>
                              </div>
                            </div>
                          </td>
                          <!-- Contact -->
                          <td class="px-5 py-4">
                            <div class="font-bold text-gray-800 text-sm">{{ req.contactName }}</div>
                            <div class="text-[11px] text-gray-500">{{ req.email }}</div>
                            <div class="text-[11px] text-gray-500">{{ req.phone }}</div>
                          </td>
                          <!-- Features -->
                          <td class="px-5 py-4">
                            <div class="flex flex-wrap gap-1 max-w-[200px]">
                              @for (f of (req.selectedFeatures || []).slice(0, 3); track f) {
                                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold tracking-wider uppercase border border-gray-200">{{ f }}</span>
                              }
                              @if ((req.selectedFeatures || []).length > 3) {
                                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold tracking-wider border border-gray-200">+{{ (req.selectedFeatures || []).length - 3 }} more</span>
                              }
                            </div>
                          </td>
                          <!-- Estimated Price -->
                          <td class="px-5 py-4">
                            <span class="text-gray-700 font-bold">
                              {{ req.estimatedMonthlyPrice ? '₹' + req.estimatedMonthlyPrice + '/mo' : '—' }}
                            </span>
                          </td>
                          <!-- Final Price -->
                          <td class="px-5 py-4">
                            <span [class]="req.finalPrice ? 'text-green-700 font-bold' : 'text-gray-400 font-medium'">
                              {{ req.finalPrice ? '₹' + req.finalPrice + '/' + (req.billingCycle || 'mo') : '—' }}
                            </span>
                          </td>
                          <!-- Status -->
                          <td class="px-5 py-4">
                            <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border" [ngClass]="getStatusClasses(req.status)">
                              {{ getStatusLabel(req.status) }}
                            </span>
                          </td>
                          <!-- Date -->
                          <td class="px-5 py-4 text-gray-400 text-[11px]">{{ formatDate(req.createdAt) }}</td>
                          <!-- Actions -->
                          <td class="px-5 py-4 text-right">
                            <div class="flex items-center justify-end gap-2">
                              <button
                                (click)="$event.stopPropagation(); openDetail(req)"
                                class="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors inline-flex items-center">
                                <i class="bi bi-eye mr-1.5"></i>View
                              </button>
                              @if (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') {
                                <button
                                  (click)="$event.stopPropagation(); openQuoteModal(req)"
                                  class="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-purple-700 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center">
                                  <i class="bi bi-file-earmark-text mr-1.5"></i>Quote
                                </button>
                              }
                              @if (req.status !== 'CANCELLED' && req.status !== 'SHOP_REGISTERED') {
                                <button
                                  (click)="$event.stopPropagation(); cancelRequest(req)"
                                  [disabled]="processingId === req.id"
                                  class="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center">
                                  <i class="bi bi-x-circle mr-1.5"></i>Cancel
                                </button>
                              }
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Pagination -->
                @if (totalPages > 1) {
                  <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500 shrink-0 bg-gray-50">
                    <span>Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, filtered.length) }} of {{ filtered.length }}</span>
                    <div class="flex items-center gap-1">
                      <button (click)="page = page - 1; paginate()" [disabled]="page === 1"
                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-40 transition-colors border border-transparent hover:border-gray-200">
                        <i class="bi bi-chevron-left text-xs"></i>
                      </button>
                      @for (p of pageNumbers; track p) {
                        <button (click)="page = p; paginate()"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors"
                          [class.bg-primary-600]="page === p" [class.text-white]="page === p" [class.shadow-sm]="page === p"
                          [class.hover:bg-white]="page !== p" [class.hover:border-gray-200]="page !== p" [class.border]="page !== p" [class.border-transparent]="page !== p">
                          {{ p }}
                        </button>
                      }
                      <button (click)="page = page + 1; paginate()" [disabled]="page === totalPages"
                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-40 transition-colors border border-transparent hover:border-gray-200">
                        <i class="bi bi-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Short Info) -->
        @if (selectedRequest) {
          <div class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
            <!-- Header -->
            <div class="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10 shrink-0">
              <div>
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">{{ selectedRequest.shopName }}</h3>
                <p class="text-xs text-gray-400 font-mono mt-0.5">ID: {{ selectedRequest.id.slice(0, 8) }}…</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border" [ngClass]="getStatusClasses(selectedRequest.status)">
                  {{ getStatusLabel(selectedRequest.status) }}
                </span>
                <button (click)="closeDetail()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <i class="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
              <!-- Contact Info -->
              <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h4 class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
                <div class="space-y-3 text-sm font-medium">
                  <div><span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Name</span><p class="font-bold text-gray-900 mt-0.5">{{ selectedRequest.contactName }}</p></div>
                  <div><span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Email</span><p class="font-bold text-gray-900 mt-0.5"><a href="mailto:{{ selectedRequest.email }}" class="text-primary-600 hover:underline">{{ selectedRequest.email }}</a></p></div>
                  <div><span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Phone</span><p class="font-bold text-gray-900 mt-0.5">{{ selectedRequest.phone }}</p></div>
                </div>
              </div>

              <!-- Pricing Summary -->
              <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h4 class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pricing</h4>
                <div class="grid grid-cols-2 gap-3 text-sm font-medium">
                  <div>
                    <span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Est. Price</span>
                    <p class="font-bold text-gray-950 mt-0.5 text-base">
                      {{ selectedRequest.estimatedMonthlyPrice ? '₹' + selectedRequest.estimatedMonthlyPrice + '/mo' : '—' }}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Final Quoted</span>
                    <p class="font-bold mt-0.5 text-base" [class]="selectedRequest.finalPrice ? 'text-green-700' : 'text-gray-400'">
                      {{ selectedRequest.finalPrice ? '₹' + selectedRequest.finalPrice + '/' + (selectedRequest.billingCycle || 'mo') : 'Not quoted' }}
                    </p>
                  </div>
                </div>
                @if (selectedRequest.paymentLinkUrl) {
                  <div class="mt-4 pt-4 border-t border-gray-150">
                    <span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Payment Link</span>
                    <div class="flex items-center gap-2">
                      <input type="text" readonly [value]="selectedRequest.paymentLinkUrl" 
                        class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none font-mono truncate">
                      <button class="p-2 text-gray-500 hover:text-primary-600 bg-white border border-gray-200 rounded-lg transition-colors"
                        (click)="copyToClipboard(selectedRequest.paymentLinkUrl)" title="Copy Link">
                        <i class="bi bi-clipboard"></i>
                      </button>
                      <a [href]="selectedRequest.paymentLinkUrl" target="_blank"
                        class="p-2 text-gray-500 hover:text-primary-600 bg-white border border-gray-200 rounded-lg transition-colors" title="Open Link">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                    </div>
                  </div>
                }
                @if (selectedRequest.registrationLink) {
                  <div class="mt-4 pt-4 border-t border-gray-150">
                    <span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Registration Link</span>
                    <div class="flex items-center gap-2">
                      <input type="text" readonly [value]="selectedRequest.registrationLink"
                        class="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-850 focus:outline-none font-mono truncate">
                      <button class="p-2 text-gray-500 hover:text-green-700 bg-white border border-gray-200 rounded-lg transition-colors"
                        (click)="copyToClipboard(selectedRequest.registrationLink)" title="Copy Link">
                        <i class="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Selected Features -->
              <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h4 class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Selected Features ({{ (selectedRequest.selectedFeatures || []).length }})
                </h4>
                <div class="flex flex-wrap gap-1.5">
                  @for (f of (selectedRequest.selectedFeatures || []); track f) {
                    <span class="px-2 py-0.5 bg-gray-50 border border-gray-150 rounded-md text-[10px] font-semibold text-gray-700">
                      {{ f }}
                    </span>
                  }
                </div>
              </div>

              <!-- Activity Timeline -->
              @if ((selectedRequest.activityLog || []).length > 0) {
                <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <h4 class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3">Activity Timeline</h4>
                  <div class="space-y-4">
                    @for (log of (selectedRequest.activityLog || []).slice().reverse(); track $index) {
                      <div class="flex items-start gap-2.5">
                        <div class="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md border" [ngClass]="getStatusClasses(log.status)">
                              {{ getStatusLabel(log.status) }}
                            </span>
                            <span class="text-[10px] text-gray-400 font-medium">{{ formatDate(log.timestamp) }}</span>
                          </div>
                          @if (log.note) {
                            <p class="text-xs text-gray-600 mt-1 font-medium">{{ log.note }}</p>
                          }
                          @if (log.performedBy) {
                            <p class="text-[9px] text-gray-450 mt-0.5">by {{ log.performedBy }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Footer Actions -->
            <div class="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 shrink-0">
              @if (selectedRequest.status === 'SUBMITTED') {
                <button (click)="markUnderReview()" [disabled]="processingId === selectedRequest.id"
                  class="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-all disabled:opacity-50 text-center">
                  Review
                </button>
              }
              @if (selectedRequest.status === 'SUBMITTED' || selectedRequest.status === 'UNDER_REVIEW') {
                <button (click)="openQuoteModal(selectedRequest)" [disabled]="processingId === selectedRequest.id"
                  class="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider text-purple-700 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition-all disabled:opacity-50 text-center">
                  Quote
                </button>
              }
              @if (selectedRequest.status === 'QUOTED') {
                <button (click)="generatePaymentLink()" [disabled]="processingId === selectedRequest.id"
                  class="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50 text-center">
                  Payment Link
                </button>
              }
              @if (selectedRequest.status === 'PAYMENT_PENDING') {
                <button (click)="syncPaymentStatus()" [disabled]="processingId === selectedRequest.id"
                  class="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider text-teal-700 bg-white border border-teal-200 rounded-xl hover:bg-teal-50 transition-all disabled:opacity-50 text-center">
                  Sync
                </button>
              }
              @if (selectedRequest.status !== 'CANCELLED' && selectedRequest.status !== 'SHOP_REGISTERED') {
                <button (click)="cancelRequest(selectedRequest)" [disabled]="processingId === selectedRequest.id"
                  class="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 text-center">
                  Cancel
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Quote Modal -->
    @if (showQuoteModal) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="closeQuoteModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-1">Generate Quote</h3>
          <p class="text-sm text-gray-500 mb-5">Set the final price for <strong>{{ quoteTarget?.shopName }}</strong></p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Final Price (₹)</label>
              <input type="number" [(ngModel)]="quoteForm.finalPrice" placeholder="e.g. 2499"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Billing Cycle</label>
              <select [(ngModel)]="quoteForm.billingCycle"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Note to Customer (optional)</label>
              <textarea [(ngModel)]="quoteForm.adminNote" rows="3" placeholder="e.g. Includes onboarding support…"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm resize-none"></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button (click)="closeQuoteModal()" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button (click)="submitQuote()" [disabled]="!quoteForm.finalPrice || submittingQuote"
              class="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              @if (submittingQuote) { <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> }
              Send Quote
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CustomPlanRequestsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  protected readonly Math = Math;

  all: CustomPlanRequest[] = [];
  filtered: CustomPlanRequest[] = [];
  paginated: CustomPlanRequest[] = [];

  loading = true;
  error = '';
  processingId: string | null = null;

  search = '';
  statusFilter = '';
  sortBy = 'newest';

  page = 1;
  pageSize = 15;
  totalPages = 1;
  pageNumbers: number[] = [];

  selectedRequest: CustomPlanRequest | null = null;
  showQuoteModal = false;
  quoteTarget: CustomPlanRequest | null = null;
  quoteForm = { finalPrice: 0, billingCycle: 'monthly' as 'monthly' | 'yearly', adminNote: '' };
  submittingQuote = false;

  ngOnInit() { this.loadRequests(); }

  async loadRequests() {
    this.loading = true;
    this.error = '';
    try {
      const res = await firstValueFrom(this.adminApi.getCustomPlanRequests());
      this.all = res.data || [];
      this.applyFilters();
    } catch (e: any) {
      this.error = e.error?.message || 'Failed to load custom plan requests.';
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let result = [...this.all];

    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(r =>
        r.contactName?.toLowerCase().includes(q) ||
        r.shopName?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.includes(q)
      );
    }

    if (this.statusFilter) {
      result = result.filter(r => r.status === this.statusFilter);
    }

    switch (this.sortBy) {
      case 'oldest':   result.sort((a, b) => this.toMs(a.createdAt) - this.toMs(b.createdAt)); break;
      case 'price_asc':  result.sort((a, b) => (a.estimatedMonthlyPrice || 0) - (b.estimatedMonthlyPrice || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.estimatedMonthlyPrice || 0) - (a.estimatedMonthlyPrice || 0)); break;
      default:         result.sort((a, b) => this.toMs(b.createdAt) - this.toMs(a.createdAt));
    }

    this.filtered = result;
    this.page = 1;
    this.paginate();
  }

  paginate() {
    this.totalPages = Math.ceil(this.filtered.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.page - 1) * this.pageSize;
    this.paginated = this.filtered.slice(start, start + this.pageSize);
  }

  openDetail(req: CustomPlanRequest) { this.selectedRequest = { ...req }; }
  closeDetail() { this.selectedRequest = null; }

  openQuoteModal(req: CustomPlanRequest) {
    this.quoteTarget = req;
    this.quoteForm = { finalPrice: req.estimatedMonthlyPrice || 0, billingCycle: 'monthly', adminNote: '' };
    this.showQuoteModal = true;
  }
  closeQuoteModal() { this.showQuoteModal = false; this.quoteTarget = null; }

  async submitQuote() {
    if (!this.quoteTarget || !this.quoteForm.finalPrice) return;
    this.submittingQuote = true;
    try {
      await firstValueFrom(this.adminApi.generateCustomPlanQuote(
        this.quoteTarget.id,
        this.quoteForm.finalPrice,
        this.quoteForm.billingCycle,
        this.quoteForm.adminNote || undefined
      ));
      this.toast.showSuccess('Quote generated successfully');
      this.closeQuoteModal();
      this.closeDetail();
      await this.loadRequests();
    } catch (e: any) {
      this.toast.showError(e.error?.message || 'Failed to generate quote');
    } finally {
      this.submittingQuote = false;
    }
  }

  async markUnderReview() {
    if (!this.selectedRequest) return;
    this.processingId = this.selectedRequest.id;
    try {
      await firstValueFrom(this.adminApi.updateCustomPlanRequestStatus(this.selectedRequest.id, 'UNDER_REVIEW', 'Request is under admin review'));
      this.toast.showSuccess('Status updated to Under Review');
      this.closeDetail();
      await this.loadRequests();
    } catch (e: any) {
      this.toast.showError(e.error?.message || 'Failed to update status');
    } finally {
      this.processingId = null;
    }
  }

  async generatePaymentLink() {
    if (!this.selectedRequest) return;
    if (!confirm(`Generate payment link for ${this.selectedRequest.shopName}?`)) return;
    this.processingId = this.selectedRequest.id;
    try {
      const res = await firstValueFrom(this.adminApi.generateCustomPlanPaymentLink(this.selectedRequest.id));
      this.selectedRequest = res.data;
      this.toast.showSuccess('Payment link generated successfully');
      await this.loadRequests();
    } catch (e: any) {
      this.toast.showError(e.error?.message || 'Failed to generate payment link');
    } finally {
      this.processingId = null;
    }
  }

  async syncPaymentStatus() {
    if (!this.selectedRequest) return;
    this.processingId = this.selectedRequest.id;
    try {
      const res = await firstValueFrom(this.adminApi.syncCustomPlanPaymentStatus(this.selectedRequest.id));
      this.selectedRequest = res.data;
      if (res.data.status === 'PAYMENT_COMPLETED') {
        this.toast.showSuccess('Payment verified! Registration link has been generated.');
      } else {
        this.toast.showSuccess(`Payment status synced: ${res.data.status}`);
      }
      await this.loadRequests();
    } catch (e: any) {
      this.toast.showError(e.error?.message || 'Failed to sync payment status');
    } finally {
      this.processingId = null;
    }
  }

  async cancelRequest(req: CustomPlanRequest) {
    if (!confirm(`Cancel request from "${req.shopName}"?`)) return;
    this.processingId = req.id;
    try {
      await firstValueFrom(this.adminApi.cancelCustomPlanRequest(req.id, 'Cancelled by admin'));
      this.toast.showSuccess('Request cancelled');
      if (this.selectedRequest?.id === req.id) this.closeDetail();
      await this.loadRequests();
    } catch (e: any) {
      this.toast.showError(e.error?.message || 'Failed to cancel request');
    } finally {
      this.processingId = null;
    }
  }

  getStatusLabel(status: CustomPlanRequestStatus): string {
    return STATUS_CONFIG[status]?.label || status;
  }

  getStatusClasses(status: CustomPlanRequestStatus): string {
    return STATUS_CONFIG[status]?.classes || 'bg-gray-50 text-gray-600 border-gray-100';
  }

  formatDate(d?: any): string {
    if (!d) return '—';
    const date = d?.toDate ? d.toDate() : new Date(d?._seconds ? d._seconds * 1000 : d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast.showSuccess('Link copied to clipboard');
    } catch (err) {
      this.toast.showError('Failed to copy text');
    }
  }

  private toMs(d?: any): number {
    if (!d) return 0;
    if (d?.toDate) return d.toDate().getTime();
    if (d?._seconds) return d._seconds * 1000;
    return new Date(d).getTime();
  }
}
