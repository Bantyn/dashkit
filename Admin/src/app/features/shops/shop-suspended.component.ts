import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, AdminShop } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-shop-suspended',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Suspended Shops</h2>
            <p class="text-xs text-gray-500 mt-1">Shops that have been suspended or deactivated.</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
            {{ shops.length }} Suspended
          </span>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Search -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4">
            <div class="relative flex-1 max-w-lg">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filter()"
                placeholder="Search suspended shops…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (loading) {
                <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span class="text-sm">Loading…</span>
                </div>
              } @else if (filtered.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <i class="bi bi-shop text-4xl text-gray-300 mb-2"></i>
                  <p class="text-sm font-bold">No suspended shops found.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Shop</th>
                        <th class="px-6 py-4">Plan</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Contact</th>
                        <th class="px-6 py-4">Since</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (shop of filtered; track shop.id) {
                        <tr
                          (click)="selectedShop = shop"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedShop?.id === shop.id"
                        >
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 font-bold text-xs shrink-0">
                                {{ (shop.shopName || 'S').charAt(0).toUpperCase() }}
                              </div>
                              <div>
                                <div class="font-bold text-gray-900 text-sm">{{ shop.shopName }}</div>
                                <div class="text-[10px] text-gray-400 font-mono mt-0.5">{{ shop.subdomain }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4">
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">{{ shop.subscriptionPlan || 'free' }}</span>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                              [class.bg-red-50]="shop.status === 'suspended'"
                              [class.text-red-700]="shop.status === 'suspended'"
                              [class.bg-amber-50]="shop.status === 'inactive'"
                              [class.text-amber-700]="shop.status === 'inactive'"
                            >
                              {{ shop.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-gray-500 text-[11px]">{{ shop.email || shop.phone || '—' }}</td>
                          <td class="px-6 py-4 text-gray-400 text-[11px]">{{ formatDate(shop.createdAt) }}</td>
                          <td class="px-6 py-4 text-right">
                            <button
                              (click)="$event.stopPropagation(); reactivate(shop)"
                              class="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 inline-block bg-white"
                            >
                              Reactivate
                            </button>
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
        <div *ngIf="selectedShop" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Suspended Details</h3>
            <button (click)="selectedShop = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-16 h-16 rounded-3xl bg-red-100 text-red-700 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm border border-red-200">
                {{ (selectedShop.shopName || 'S').charAt(0).toUpperCase() }}
              </div>
              <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedShop.shopName }}</h4>
              <p class="text-xs text-gray-450 font-mono mt-1">{{ selectedShop.subdomain }}.clothify.com</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border bg-red-50 text-red-700 border-red-100"
                >
                  {{ selectedShop.status }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Email</span>
                <span class="text-sm font-bold text-gray-900">{{ selectedShop.email || '—' }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</span>
                <span class="text-sm font-bold text-gray-900">{{ selectedShop.phone || '—' }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Plan</span>
                <span class="inline-flex text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase border border-gray-200 tracking-wider">
                  {{ selectedShop.subscriptionPlan || 'free' }}
                </span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Suspended Since</span>
                <span class="text-sm font-bold text-gray-900">{{ formatDate(selectedShop.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            <button
              (click)="reactivate(selectedShop)"
              class="w-full px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all text-xs uppercase tracking-wider text-center"
            >
              Reactivate Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ShopSuspendedComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  shops: AdminShop[] = [];
  filtered: AdminShop[] = [];
  selectedShop: AdminShop | null = null;
  search = '';
  loading = false;

  ngOnInit() { this.load(); }

  async load() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getShops({ status: 'suspended' }));
      const inactive = await firstValueFrom(this.adminApi.getShops({ status: 'inactive' }));
      this.shops = [...(res.data || []), ...(inactive.data || [])];
      this.filtered = [...this.shops];
    } catch { } finally { this.loading = false; }
  }

  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.shops.filter(s =>
      s.shopName.toLowerCase().includes(q) ||
      (s.subdomain || '').toLowerCase().includes(q)
    );
  }

  async reactivate(shop: AdminShop) {
    await firstValueFrom(this.adminApi.updateShop(shop.id, { status: 'active' }));
    await this.load();
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
