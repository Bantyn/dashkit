import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, AdminShop } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-admin-shops',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">All Shops</h2>
            <p class="text-xs text-gray-500 mt-1">Manage and monitor all stores on the platform.</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary-50 text-primary-600 border border-primary-100">
              Total: {{ shops.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Search & Filter -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4 flex-col md:flex-row">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filter()"
                placeholder="Search by shop name, email, phone or subdomain…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <select
              [(ngModel)]="status"
              (change)="filter()"
              class="w-full md:w-48 px-3 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <!-- Table Panel -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (loading) {
                  <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                    <span class="text-sm">Loading shops…</span>
                  </div>
              } @else {
                @if (paginatedShops.length === 0) {
                  <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <i class="bi bi-shop text-4xl"></i>
                    <p class="text-sm">No shops found.</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto flex-1">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          <th class="px-6 py-4">Logo</th>
                          <th class="px-6 py-4">Shop Name</th>
                          <th class="px-6 py-4">Plan</th>
                          <th class="px-6 py-4">Subscription</th>
                          <th class="px-6 py-4">Trial</th>
                          <th class="px-6 py-4">Payment</th>
                          <th class="px-6 py-4">Status</th>
                          <th class="px-6 py-4">Created Date</th>
                          <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 text-sm">
                        @for (shop of paginatedShops; track shop.id) {
                          <tr
                            (click)="selectedShop = shop"
                            class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                            [class.bg-[var(--color-gray-50)]]="selectedShop?.id === shop.id"
                          >
                            <td class="px-6 py-4">
                              <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {{ (shop.shopName || 'S').charAt(0).toUpperCase() }}
                              </div>
                            </td>
                            <td class="px-6 py-4">
                              <span class="font-bold text-primary-600 transition-colors text-sm">
                                {{ shop.shopName }}
                              </span>
                              <div class="text-[11px] text-gray-400">{{ shop.subdomain }}.clothify.com</div>
                              @if (shop.limitPurchases && shop.limitPurchases.length > 0) {
                                <div class="mt-1 flex flex-wrap gap-1">
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200" title="Purchased limits: {{ getLimitPurchasesSummary(shop) }}">
                                    <i class="bi bi-plus-circle-fill mr-1"></i> {{ getLimitPurchasesSummary(shop) }}
                                  </span>
                                </div>
                              }
                            </td>
                            <td class="px-6 py-4">
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase border border-gray-200 tracking-wider">
                                {{ shop.selectedPlan || shop.subscriptionPlan || 'free' }}
                              </span>
                            </td>
                            <td class="px-6 py-4">
                              <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold"
                                [class.bg-blue-50]="getSubscriptionStatus(shop) === 'trial'"
                                [class.text-blue-700]="getSubscriptionStatus(shop) === 'trial'"
                                [class.bg-green-50]="getSubscriptionStatus(shop) === 'active'"
                                [class.text-green-700]="getSubscriptionStatus(shop) === 'active'"
                                [class.bg-red-50]="getSubscriptionStatus(shop) === 'expired' || getSubscriptionStatus(shop) === 'cancelled'"
                                [class.text-red-700]="getSubscriptionStatus(shop) === 'expired' || getSubscriptionStatus(shop) === 'cancelled'"
                              >
                                {{ getSubscriptionStatus(shop) }}
                              </span>
                            </td>
                            <td class="px-6 py-4 text-gray-500 text-xs">
                              {{ getTrialDaysRemaining(shop) }}
                            </td>
                            <td class="px-6 py-4">
                              <span class="text-[10px] uppercase font-bold tracking-wider animate-pulse-subtle"
                                [class.text-amber-600]="getPaymentStatusLabel(shop) === 'Pending'"
                                [class.text-green-600]="getPaymentStatusLabel(shop) === 'Paid'"
                                [class.text-red-600]="getPaymentStatusLabel(shop) === 'Failed' || getPaymentStatusLabel(shop) === 'Refunded'"
                              >
                                {{ getPaymentStatusLabel(shop) }}
                              </span>
                            </td>
                            <td class="px-6 py-4">
                              <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold"
                                [class.bg-green-50]="shop.status === 'active'"
                                [class.text-green-700]="shop.status === 'active'"
                                [class.bg-red-50]="shop.status === 'suspended'"
                                [class.text-red-700]="shop.status === 'suspended'"
                                [class.bg-amber-50]="shop.status === 'inactive'"
                                [class.text-amber-700]="shop.status === 'inactive'"
                              >
                                {{ shop.status }}
                              </span>
                            </td>
                            <td class="px-6 py-4 text-gray-400 text-[11px]">{{ formatDate(shop.createdAt) }}</td>
                            <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <a
                                [routerLink]="['/shops', shop.id]"
                                class="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors inline-block"
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <!-- Pagination Footer -->
                  @if (filteredShops.length > pageSize) {
                    <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
                      <div class="text-xs text-gray-500 font-medium">
                        Showing {{ (page - 1) * pageSize + 1 }} to {{ Math.min(page * pageSize, filteredShops.length) }} of {{ filteredShops.length }} shops
                      </div>
                      <div class="flex gap-2">
                        <button
                          [disabled]="page === 1"
                          (click)="prevPage()"
                          class="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider"
                        >
                          Previous
                        </button>
                        <button
                          [disabled]="page * pageSize >= filteredShops.length"
                          (click)="nextPage()"
                          class="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  }
                }
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Short Info) -->
        <div *ngIf="selectedShop" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Shop Details</h3>
            <button (click)="selectedShop = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-16 h-16 rounded-3xl bg-primary-100 text-primary-700 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm">
                {{ (selectedShop.shopName || 'S').charAt(0).toUpperCase() }}
              </div>
              <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedShop.shopName }}</h4>
              <p class="text-xs text-gray-500 font-medium mt-1">{{ selectedShop.subdomain }}.clothify.com</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                  [class.bg-green-50]="selectedShop.status === 'active'"
                  [class.text-green-700]="selectedShop.status === 'active'"
                  [class.border-green-100]="selectedShop.status === 'active'"
                  [class.bg-red-50]="selectedShop.status === 'suspended'"
                  [class.text-red-700]="selectedShop.status === 'suspended'"
                  [class.border-red-100]="selectedShop.status === 'suspended'"
                  [class.bg-amber-50]="selectedShop.status === 'inactive'"
                  [class.text-amber-700]="selectedShop.status === 'inactive'"
                  [class.border-amber-100]="selectedShop.status === 'inactive'"
                >
                  {{ selectedShop.status }}
                </span>
              </div>
            </div>

            <!-- Basic Info Grid -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Email</span>
                <a href="mailto:{{ selectedShop.email }}" class="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">{{ selectedShop.email || '—' }}</a>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</span>
                <span class="text-sm font-bold text-gray-900">{{ selectedShop.phone || '—' }}</span>
              </div>
              <div class="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Plan</span>
                  <span class="inline-flex text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase border border-gray-200 tracking-wider">
                    {{ selectedShop.selectedPlan || selectedShop.subscriptionPlan || 'free' }}
                  </span>
                </div>
                <div>
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subscription Status</span>
                  <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                    [class.bg-blue-50]="getSubscriptionStatus(selectedShop) === 'trial'"
                    [class.text-blue-700]="getSubscriptionStatus(selectedShop) === 'trial'"
                    [class.border-blue-100]="getSubscriptionStatus(selectedShop) === 'trial'"
                    [class.bg-green-50]="getSubscriptionStatus(selectedShop) === 'active'"
                    [class.text-green-700]="getSubscriptionStatus(selectedShop) === 'active'"
                    [class.border-green-100]="getSubscriptionStatus(selectedShop) === 'active'"
                    [class.bg-red-50]="getSubscriptionStatus(selectedShop) === 'expired' || getSubscriptionStatus(selectedShop) === 'cancelled'"
                    [class.text-red-700]="getSubscriptionStatus(selectedShop) === 'expired' || getSubscriptionStatus(selectedShop) === 'cancelled'"
                    [class.border-red-100]="getSubscriptionStatus(selectedShop) === 'expired' || getSubscriptionStatus(selectedShop) === 'cancelled'"
                  >
                    {{ getSubscriptionStatus(selectedShop) }}
                  </span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trial Remaining</span>
                  <span class="text-sm font-bold text-gray-800">{{ getTrialDaysRemaining(selectedShop) }}</span>
                </div>
                <div>
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Status</span>
                  <span class="text-xs font-bold uppercase tracking-wider"
                    [class.text-amber-600]="getPaymentStatusLabel(selectedShop) === 'Pending'"
                    [class.text-green-600]="getPaymentStatusLabel(selectedShop) === 'Paid'"
                    [class.text-red-600]="getPaymentStatusLabel(selectedShop) === 'Failed' || getPaymentStatusLabel(selectedShop) === 'Refunded'"
                  >
                    {{ getPaymentStatusLabel(selectedShop) }}
                  </span>
                </div>
              </div>

              @if (selectedShop.limitPurchases && selectedShop.limitPurchases.length > 0) {
                <div>
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Purchased Limits</span>
                  <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <i class="bi bi-plus-circle-fill mr-1"></i> {{ getLimitPurchasesSummary(selectedShop) }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-2 shrink-0">
            <div class="flex gap-2">
              <button
                (click)="openEditModal(selectedShop)"
                class="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-xs uppercase tracking-wider text-center"
              >
                Edit Subscription
              </button>
              
              <button
                *ngIf="selectedShop.status === 'active'"
                (click)="updateStatus(selectedShop.id, 'suspended')"
                [disabled]="processingId === selectedShop.id"
                class="flex-1 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-100/50 transition-all text-xs uppercase tracking-wider text-center disabled:opacity-50"
              >
                Suspend Shop
              </button>
              <button
                *ngIf="selectedShop.status !== 'active'"
                (click)="updateStatus(selectedShop.id, 'active')"
                [disabled]="processingId === selectedShop.id"
                class="flex-1 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-100/50 transition-all text-xs uppercase tracking-wider text-center disabled:opacity-50"
              >
                Activate Shop
              </button>
            </div>
            
            <a
              [routerLink]="['/shops', selectedShop.id]"
              class="w-full px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all text-xs uppercase tracking-wider text-center"
            >
              View Full Profile
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Shop Modal -->
    @if (editingShop) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
          <div class="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900">Edit {{ editingShop.shopName }}</h3>
            <button (click)="closeEditModal()" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Subscription Plan</label>
              <select [(ngModel)]="editForm.subscriptionPlan" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none">
                <option value="free">Free</option>
                <option value="plus">Plus</option>
                <option value="pro">Pro</option>
                <option value="custom">Enterprise (Custom)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Custom Features</label>
              <p class="text-xs text-gray-500 mb-2">Comma-separated list of feature codes (e.g. <code>inv_barcode, analytics_sales</code>) to forcefully unlock them.</p>
              <textarea [(ngModel)]="editForm.customFeatures" rows="3" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none resize-none placeholder-gray-400" placeholder="inv_barcode, analytics_sales"></textarea>
            </div>
            @if (editForm.subscriptionPlan === 'custom') {
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Custom Price (₹)</label>
                <p class="text-xs text-gray-500 mb-2">The exact amount the shop owner needs to pay to activate this enterprise plan.</p>
                <input type="number" [(ngModel)]="editForm.customPrice" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none placeholder-gray-400" placeholder="e.g. 50000" />
              </div>
            }
          </div>
          <div class="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button (click)="closeEditModal()" class="px-5 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
            <button (click)="saveShop()" [disabled]="savingShop" class="px-5 py-2 rounded-xl font-semibold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-all flex items-center gap-2">
              @if (savingShop) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              }
              Save Changes
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminShopsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  shops: AdminShop[] = [];
  selectedShop: AdminShop | null = null;
  search = '';
  status = '';
  loading = false;
  processingId: string | null = null;
  
  editingShop: AdminShop | null = null;
  savingShop = false;
  editForm: { subscriptionPlan: string; customFeatures: string; customPrice?: number } = { subscriptionPlan: '', customFeatures: '' };

  private countdownInterval: any;

  // Pagination & Filtering
  page = 1;
  pageSize = 10;
  Math = Math;

  get filteredShops() {
    const q = this.search.trim().toLowerCase();
    const s = this.status.trim().toLowerCase();
    return this.shops.filter(shop => {
      const matchesSearch = !q ||
        shop.shopName.toLowerCase().includes(q) ||
        (shop.subdomain || '').toLowerCase().includes(q) ||
        (shop.email || '').toLowerCase().includes(q) ||
        (shop.phone || '').toLowerCase().includes(q);
      const matchesStatus = !s || String(shop.status || '').toLowerCase() === s;
      return matchesSearch && matchesStatus;
    });
  }

  get paginatedShops() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredShops.slice(start, start + this.pageSize);
  }

  filter() {
    this.page = 1;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page * this.pageSize < this.filteredShops.length) this.page++;
  }

  ngOnInit() {
    this.loadShops();
    this.countdownInterval = setInterval(() => {
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  async loadShops() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getShops({ status: this.status, search: this.search }));
      this.shops = res.data || [];
    } catch { } finally { this.loading = false; }
  }

  async updateStatus(id: string, newStatus: 'active' | 'suspended') {
    if (!confirm(`Are you sure you want to change shop status to ${newStatus}?`)) return;
    this.processingId = id;
    try {
      await firstValueFrom(this.adminApi.updateShop(id, { status: newStatus }));
      this.toastService.showSuccess(`Shop status changed to ${newStatus} successfully`);
      await this.loadShops();
    } catch (e) {
      this.toastService.showError('Failed to update shop status');
    } finally {
      this.processingId = null;
    }
  }

  formatDate(d?: any) {
    if (!d) return '—';
    let date: Date;
    if (d instanceof Date) {
      date = d;
    } else if (d && d.seconds) {
      date = new Date(d.seconds * 1000);
    } else if (d && d._seconds) {
      date = new Date(d._seconds * 1000);
    } else if (typeof d === 'string' || typeof d === 'number') {
      date = new Date(d);
    } else {
      return '—';
    }
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getSubscriptionStatus(shop: AdminShop): string {
    if (shop.subscriptionStatus) {
      return shop.subscriptionStatus;
    }
    // Fallback logic
    if (shop.subscriptionPlan === 'trial') {
      // Check if trial is expired
      if (shop.trialExpiresAt) {
        const expiry = shop.trialExpiresAt.seconds ? new Date(shop.trialExpiresAt.seconds * 1000) : (shop.trialExpiresAt._seconds ? new Date(shop.trialExpiresAt._seconds * 1000) : new Date(shop.trialExpiresAt));
        if (!isNaN(expiry.getTime()) && expiry.getTime() < new Date().getTime()) {
          return 'expired';
        }
      }
      return 'trial';
    }
    return shop.subscriptionPlan || 'free';
  }

  getTrialDaysRemaining(shop: AdminShop): string {
    if (!shop.trialExpiresAt) return 'N/A';
    const expiry = shop.trialExpiresAt.seconds ? new Date(shop.trialExpiresAt.seconds * 1000) : (shop.trialExpiresAt._seconds ? new Date(shop.trialExpiresAt._seconds * 1000) : new Date(shop.trialExpiresAt));
    if (isNaN(expiry.getTime())) return 'N/A';
    
    let diff = expiry.getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const mins = Math.floor(diff / (1000 * 60));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
    
    return parts.join(' ');
  }

  getLimitPurchasesSummary(shop: any): string {
    if (!shop.limitPurchases || shop.limitPurchases.length === 0) return '';
    const summaries: string[] = [];
    const counts: Record<string, number> = {};
    for (const p of shop.limitPurchases) {
      counts[p.limitKey] = (counts[p.limitKey] || 0) + (p.incrementAmount || 0);
    }
    for (const [key, val] of Object.entries(counts)) {
      if (key === 'staff_count') summaries.push(`+${val} Staff`);
      else if (key === 'branch_count') summaries.push(`+${val} Branch`);
      else if (key === 'invoices_per_month') summaries.push(`+${val} Invoices`);
      else if (key === 'products_count') summaries.push(`+${val} Products`);
    }
    return summaries.join(', ');
  }

  getPaymentStatusLabel(shop: AdminShop): string {
    const status = shop.paymentStatus || 'pending';
    if (status === 'active') return 'Paid';
    if (status === 'pending') return 'Pending';
    if (status === 'failed') return 'Failed';
    if (status === 'refunded') return 'Refunded';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  openEditModal(shop: AdminShop) {
    this.editingShop = shop;
    this.editForm = {
      subscriptionPlan: shop.subscriptionPlan || 'free',
      customFeatures: (shop.customFeatures || []).join(', '),
      customPrice: shop.customPrice
    };
  }

  closeEditModal() {
    this.editingShop = null;
  }

  async saveShop() {
    if (!this.editingShop) return;
    this.savingShop = true;
    
    try {
      const customFeatures = this.editForm.customFeatures
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
        
      const payload: Partial<AdminShop> = {
        subscriptionPlan: this.editForm.subscriptionPlan,
        customFeatures: customFeatures,
        customPrice: this.editForm.subscriptionPlan === 'custom' ? this.editForm.customPrice : undefined
      };
      
      await firstValueFrom(this.adminApi.updateShop(this.editingShop.id, payload));
      
      // Update local state
      const index = this.shops.findIndex(s => s.id === this.editingShop!.id);
      if (index > -1) {
        this.shops[index] = { ...this.shops[index], ...payload };
      }
      
      this.closeEditModal();
    } catch (error) {
      console.error('Failed to save shop:', error);
    } finally {
      this.savingShop = false;
    }
  }
}
