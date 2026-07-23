import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, RevenueReport } from '../../core/services/admin-api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-admin-reports-revenue',
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
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Monthly MRR</p>
              <div class="text-3xl font-bold text-gray-900">₹{{ report.mrr | number }}</div>
              <p class="text-xs text-gray-400 mt-1">Active paid shops</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Annual ARR</p>
              <div class="text-3xl font-bold text-primary-600">₹{{ report.arr | number }}</div>
              <p class="text-xs text-gray-400 mt-1">Projected annual revenue</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Paid Shops</p>
              <div class="text-3xl font-bold text-green-600">{{ report.paidShops }}</div>
              <p class="text-xs text-gray-400 mt-1">Of {{ report.totalShops }} total</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Free / Trial</p>
              <div class="text-3xl font-bold text-amber-500">{{ report.freeShops }}</div>
              <p class="text-xs text-gray-400 mt-1">Not generating revenue</p>
            </div>
          </div>

          <!-- This Month Activity -->
          @if (report.monthlyActivity && hasMonthlyActivity) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (entry of monthlyEntries; track entry.key) {
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <i class="bi bi-activity text-lg"></i>
                  </div>
                  <div>
                    <p class="text-xs text-gray-400 capitalize">{{ entry.label }}</p>
                    <p class="text-lg font-bold text-gray-800">{{ entry.value }}</p>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Plan Mix -->
          @if (report.planMix.length > 0) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 class="text-sm font-bold text-gray-700 mb-4">Revenue by Plan</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs uppercase text-gray-400 border-b border-gray-100">
                      <th class="pb-3 pr-6">Plan</th>
                      <th class="pb-3 pr-6">Shops</th>
                      <th class="pb-3 pr-6">Monthly Revenue</th>
                      <th class="pb-3">% of MRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (plan of report.planMix; track plan.planCode) {
                      <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td class="py-3 pr-6">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                            [class]="getPlanBadgeClass(plan.planCode)">
                            {{ plan.planCode }}
                          </span>
                        </td>
                        <td class="py-3 pr-6 text-gray-700 font-medium">{{ plan.shops }}</td>
                        <td class="py-3 pr-6 text-gray-900 font-semibold">₹{{ plan.monthlyRevenue | number }}</td>
                        <td class="py-3">
                          <div class="flex items-center gap-2">
                            <div class="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                              <div class="h-1.5 rounded-full bg-primary-500" [style.width.%]="getMrrPercent(plan.monthlyRevenue)"></div>
                            </div>
                            <span class="text-xs text-gray-500">{{ getMrrPercent(plan.monthlyRevenue) | number:'1.0-1' }}%</span>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Top Revenue Shops -->
          @if (report.revenueByShop.length > 0) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 class="text-sm font-bold text-gray-700 mb-4">Top Shops by Revenue</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs uppercase text-gray-400 border-b border-gray-100">
                      <th class="pb-3 pr-6">#</th>
                      <th class="pb-3 pr-6">Shop</th>
                      <th class="pb-3 pr-6">Plan</th>
                      <th class="pb-3 pr-6">Status</th>
                      <th class="pb-3 pr-6">Monthly</th>
                      <th class="pb-3">Yearly</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (shop of report.revenueByShop; track shop.id; let i = $index) {
                      <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td class="py-3 pr-6 text-gray-400 text-xs">{{ i + 1 }}</td>
                        <td class="py-3 pr-6 font-medium text-gray-800">{{ shop.shopName }}</td>
                        <td class="py-3 pr-6">
                          <span class="text-xs font-semibold capitalize px-2 py-0.5 rounded-full"
                            [class]="getPlanBadgeClass(shop.subscriptionPlan)">
                            {{ shop.planName }}
                          </span>
                        </td>
                        <td class="py-3 pr-6">
                          <span class="text-xs capitalize px-2 py-0.5 rounded-full font-semibold"
                            [class]="shop.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                            {{ shop.status }}
                          </span>
                        </td>
                        <td class="py-3 pr-6 font-semibold text-gray-900">₹{{ shop.monthlyRevenue | number }}</td>
                        <td class="py-3 text-gray-600">₹{{ shop.yearlyRevenue | number }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (report.planMix.length === 0 && report.revenueByShop.length === 0) {
            <div class="bg-white rounded-xl border border-gray-100 p-10 flex flex-col items-center text-gray-400">
              <i class="bi bi-bar-chart-fill text-5xl mb-3 text-gray-200"></i>
              <p class="text-sm text-gray-500">No revenue data available yet.</p>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AdminReportsRevenueComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  report: RevenueReport | null = null;
  loading = true;
  error = '';

  get hasMonthlyActivity(): boolean {
    return this.report ? Object.keys(this.report.monthlyActivity).length > 0 : false;
  }

  get monthlyEntries(): { key: string; label: string; value: number }[] {
    if (!this.report) return [];
    const labels: Record<string, string> = {
      newShops: 'New Shops',
      newUsers: 'New Users',
      orders: 'Orders',
      invoices: 'Invoices',
    };
    return Object.entries(this.report.monthlyActivity).map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value: value as number,
    }));
  }

  getMrrPercent(value: number): number {
    if (!this.report || this.report.mrr === 0) return 0;
    return Math.round((value / this.report.mrr) * 100);
  }

  getPlanBadgeClass(plan: string): string {
    const map: Record<string, string> = {
      trial: 'bg-blue-50 text-blue-700',
      plus: 'bg-green-50 text-green-700',
      pro: 'bg-purple-50 text-purple-700',
      custom: 'bg-orange-50 text-orange-700',
      free: 'bg-gray-100 text-gray-500',
    };
    return map[plan?.toLowerCase()] ?? 'bg-gray-100 text-gray-500';
  }

  async ngOnInit() {
    try {
      const res = await firstValueFrom(this.api.getRevenueReport());
      this.report = res.data ?? null;
    } catch {
      this.error = 'Failed to load revenue report. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
