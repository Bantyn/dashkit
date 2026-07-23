import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, UsageReport } from '../../core/services/admin-api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-admin-reports-usage',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#f5f7fa]">
      <!-- Header & Tabs -->
      <div class="px-6 pt-6 bg-white border-b border-gray-200 shrink-0">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">Platform Reports</h2>
        <p class="text-sm text-gray-500 mb-6">Analytics and reporting for the entire Clothify platform.</p>
      </div>

      <div class="flex-1 overflow-auto p-6 space-y-6">

        <!-- Loading -->
        @if (loading) {
          <div class="flex items-center justify-center min-h-[300px]">
            <app-loading-spinner size="lg"></app-loading-spinner>
          </div>
        }

        <!-- Error -->
        @if (error && !loading) {
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{{ error }}</div>
        }

        @if (!loading && report) {
          <!-- Platform Health Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Shops</p>
              <div class="text-3xl font-bold text-gray-900">{{ report.totalShops }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Active Shops</p>
              <div class="text-3xl font-bold text-green-600">{{ report.activeShops }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Suspended</p>
              <div class="text-3xl font-bold text-red-500">{{ report.suspendedShops }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Users</p>
              <div class="text-3xl font-bold text-indigo-600">{{ report.totalUsers }}</div>
            </div>
          </div>

          <!-- Collection Footprint -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-sm font-bold text-gray-700 mb-5">Platform Data Footprint</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (entry of footprintEntries; track entry.key) {
                <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" [class]="getIconBg(entry.key)">
                    <i [class]="'bi ' + getIcon(entry.key) + ' text-lg'"></i>
                  </div>
                  <div>
                    <p class="text-xs text-gray-400 capitalize">{{ entry.label }}</p>
                    <p class="text-lg font-bold text-gray-800">{{ entry.value | number }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- This Month Activity -->
          @if (monthlyEntries.length > 0) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 class="text-sm font-bold text-gray-700 mb-5">Activity This Month</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (entry of monthlyEntries; track entry.key) {
                  <div class="border border-gray-100 rounded-xl p-4 text-center">
                    <p class="text-3xl font-bold text-gray-900 mb-1">{{ entry.value | number }}</p>
                    <p class="text-xs text-gray-400">{{ entry.label }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Plan Distribution -->
          @if (report.planDistribution.length > 0) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 class="text-sm font-bold text-gray-700 mb-5">Plan Distribution</h3>
              <div class="space-y-3">
                @for (plan of report.planDistribution; track plan.planCode) {
                  <div class="flex items-center gap-4">
                    <span class="w-20 text-xs font-semibold capitalize shrink-0 px-2 py-0.5 rounded-full text-center"
                      [class]="getPlanBadgeClass(plan.planCode)">
                      {{ plan.planCode }}
                    </span>
                    <div class="flex-1 bg-gray-100 rounded-full h-3">
                      <div class="h-3 rounded-full transition-all duration-500"
                        [class]="getPlanBarClass(plan.planCode)"
                        [style.width.%]="getShopPercent(plan.shops)">
                      </div>
                    </div>
                    <span class="text-sm font-semibold text-gray-700 w-16 text-right">{{ plan.shops }} shops</span>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AdminReportsUsageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  report: UsageReport | null = null;
  loading = true;
  error = '';

  get footprintEntries(): { key: string; label: string; value: number }[] {
    if (!this.report) return [];
    const labels: Record<string, string> = {
      shops: 'Shops', users: 'Users', products: 'Products',
      orders: 'Orders', invoices: 'Invoices', staff: 'Staff',
      branches: 'Branches', customers: 'Customers', inventory: 'Inventory',
    };
    return Object.entries(this.report.collectionFootprint).map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value: value as number,
    }));
  }

  get monthlyEntries(): { key: string; label: string; value: number }[] {
    if (!this.report) return [];
    const labels: Record<string, string> = {
      newShops: 'New Shops', newUsers: 'New Users', orders: 'Orders', invoices: 'Invoices',
    };
    return Object.entries(this.report.monthlyActivity).map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value: value as number,
    }));
  }

  getShopPercent(shops: number): number {
    if (!this.report || this.report.totalShops === 0) return 0;
    return Math.round((shops / this.report.totalShops) * 100);
  }

  getIcon(key: string): string {
    const icons: Record<string, string> = {
      shops: 'bi-shop', users: 'bi-people', products: 'bi-box-seam',
      orders: 'bi-cart3', invoices: 'bi-receipt', staff: 'bi-person-badge',
      branches: 'bi-building', customers: 'bi-person-heart', inventory: 'bi-archive',
    };
    return icons[key] ?? 'bi-database';
  }

  getIconBg(key: string): string {
    const bgs: Record<string, string> = {
      shops: 'bg-blue-50 text-blue-500', users: 'bg-purple-50 text-purple-500',
      products: 'bg-green-50 text-green-500', orders: 'bg-amber-50 text-amber-500',
      invoices: 'bg-indigo-50 text-indigo-500', staff: 'bg-pink-50 text-pink-500',
      branches: 'bg-teal-50 text-teal-500', customers: 'bg-rose-50 text-rose-500',
      inventory: 'bg-orange-50 text-orange-500',
    };
    return bgs[key] ?? 'bg-gray-100 text-gray-500';
  }

  getPlanBadgeClass(plan: string): string {
    const map: Record<string, string> = {
      trial: 'bg-blue-50 text-blue-700', plus: 'bg-green-50 text-green-700',
      pro: 'bg-purple-50 text-purple-700', custom: 'bg-orange-50 text-orange-700',
      free: 'bg-gray-100 text-gray-500',
    };
    return map[plan?.toLowerCase()] ?? 'bg-gray-100 text-gray-500';
  }

  getPlanBarClass(plan: string): string {
    const map: Record<string, string> = {
      trial: 'bg-blue-400', plus: 'bg-green-500', pro: 'bg-purple-500',
      custom: 'bg-orange-500', free: 'bg-gray-300',
    };
    return map[plan?.toLowerCase()] ?? 'bg-gray-300';
  }

  async ngOnInit() {
    try {
      const res = await firstValueFrom(this.api.getUsageReport());
      this.report = res.data ?? null;
    } catch {
      this.error = 'Failed to load usage report. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
