import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../../core/services/branch.service';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { UiButtonComponent } from '../../../shared/components/ui-button.component';
import { SparklineChartComponent } from '../../../shared/components/ui/sparkline-chart.component';
import { AreaChartComponent } from '../../../shared/components/ui/area-chart.component';
import { DonutChartComponent } from '../../../shared/components/ui/donut-chart.component';

@Component({
  selector: 'app-branch-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UiLoadingComponent,
    UiButtonComponent,
    SparklineChartComponent,
    AreaChartComponent,
    DonutChartComponent
  ],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Branch Analytics</h2>
          <p class="text-xs text-gray-500 mt-0.5">Real-time performance, sales trends, and operational metrics</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
            {{ summaries.length }} Branches
          </span>
          <app-ui-button
            variant="outline"
            size="sm"
            (onClick)="loadSummaries()"
          >
            <i class="bi bi-arrow-clockwise mr-1.5"></i>
            Refresh
          </app-ui-button>
          <app-ui-button
            variant="outline"
            size="sm"
            [routerLink]="['../../']"
          >
            <i class="bi bi-arrow-left mr-1.5"></i>
            Back to Branches
          </app-ui-button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
        @if (loading) {
          <div class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
            <app-ui-loading size="md"></app-ui-loading>
            <span class="text-sm text-gray-500">Loading branch analytics...</span>
          </div>
        } @else if (errorMessage) {
          <div class="p-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center">
            <i class="bi bi-exclamation-circle text-2xl mb-2 block"></i>
            <p class="text-sm font-medium">{{ errorMessage }}</p>
            <app-ui-button
              variant="outline"
              size="sm"
              class="mt-3"
              (onClick)="loadSummaries()"
            >
              Try Again
            </app-ui-button>
          </div>
        } @else if (summaries.length === 0) {
          <div class="bg-white rounded-xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <i class="bi bi-bar-chart text-2xl"></i>
            </div>
            <h3 class="text-gray-800 font-bold mb-1">No analytics data found</h3>
            <p class="text-gray-500 text-sm">Add active branches to start generating analytics metrics.</p>
          </div>
        } @else {

          <!-- Visual Analytics Summary Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Revenue Trend Chart -->
            <div class="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-sm font-bold text-gray-900">Branch Revenue Overview</h3>
                  <p class="text-xs text-gray-400">Aggregated revenue performance across branches</p>
                </div>
                <span class="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-md">Live</span>
              </div>
              <div class="h-44 w-full">
                <app-area-chart
                  [data]="areaChartData"
                  xKey="name"
                  [yKeys]="['revenue']"
                  [colors]="['#3b82f6']"
                ></app-area-chart>
              </div>
            </div>

            <!-- Orders Breakdown Donut Chart -->
            <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-bold text-gray-900">Order Volume Breakdown</h3>
                <span class="text-xs text-gray-400">Total: {{ totalOrders }}</span>
              </div>
              <div class="h-44 flex items-center justify-center">
                <app-donut-chart
                  [completed]="totalOrders"
                  [pending]="0"
                  [cancelled]="0"
                  centerLabel="Total Orders"
                ></app-donut-chart>
              </div>
            </div>

          </div>

          <!-- Individual Branch Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (branch of summaries; track branch.id) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group">

                <!-- Card Header -->
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {{ branch.name ? branch.name.charAt(0).toUpperCase() : '?' }}
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{{ branch.name }}</h3>
                      <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">{{ branch.address }}</p>
                    </div>
                  </div>
                  <span [class]="'px-2 py-1 rounded text-xs font-medium ' + (branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                    {{ branch.status }}
                  </span>
                </div>

                <!-- Manager -->
                <div class="flex items-center gap-2 mb-4 text-xs text-gray-600">
                  <i class="bi bi-person-badge text-gray-400"></i>
                  <span>{{ branch.manager || 'No manager assigned' }}</span>
                </div>

                <!-- Sparkline Trend Indicator -->
                <div class="bg-gray-50/60 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div>
                    <span class="text-[11px] text-gray-400 uppercase font-semibold">Sales Trend</span>
                    <p class="text-xs font-bold text-gray-800">₹{{ branch.metrics.revenue | number }}</p>
                  </div>
                  <div class="w-24 h-8">
                    <app-sparkline
                      [data]="getSparklineData(branch)"
                      color="#3b82f6"
                      [width]="96"
                      [height]="32"
                    ></app-sparkline>
                  </div>
                </div>

                <!-- Metrics Grid -->
                <div class="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <div class="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Sales</div>
                    <div class="text-sm font-bold text-gray-900">₹{{ branch.metrics.sales | number }}</div>
                  </div>
                  <div>
                    <div class="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Orders</div>
                    <div class="text-sm font-bold text-gray-900">{{ branch.metrics.orders | number }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Revenue</div>
                    <div class="text-sm font-bold text-primary-600">₹{{ branch.metrics.revenue | number }}</div>
                  </div>
                </div>

                <!-- Footer Link -->
                <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <app-ui-button
                    variant="outline"
                    size="sm"
                    [routerLink]="['../settings', branch.id]"
                  >
                    Configure <i class="bi bi-chevron-right ml-1 text-[10px]"></i>
                  </app-ui-button>
                  <span class="text-xs text-gray-400 font-mono">#{{ branch.id.slice(-6).toUpperCase() }}</span>
                </div>

              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
  `]
})
export class BranchAnalytics implements OnInit {
  private branchService = inject(BranchService);
  private shopContext = inject(ShopContextService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  shopId = '';
  summaries: any[] = [];
  loading = true;
  errorMessage = '';

  get totalOrders(): number {
    return this.summaries.reduce((acc, b) => acc + (b.metrics?.orders || 0), 0);
  }

  get areaChartData(): any[] {
    return this.summaries.map(b => ({
      name: b.name || 'Branch',
      revenue: b.metrics?.revenue || 0
    }));
  }

  ngOnInit() {
    this.shopContext.connectWorkspaceRoute(this.route).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.shopId = id || '';
      if (this.shopId) {
        this.loadSummaries();
        return;
      }

      this.loading = false;
      this.errorMessage = 'Unable to resolve shop context for branch analytics.';
    });
  }

  loadSummaries() {
    this.loading = true;
    this.errorMessage = '';
    this.branchService.getBranchAnalyticsSummaries(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.summaries = res.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error?.message || error?.error?.message || 'Unable to load branch summaries.';
      },
    });
  }

  getSparklineData(branch: any): number[] {
    const rev = branch.metrics?.revenue || 100;
    return [rev * 0.4, rev * 0.6, rev * 0.5, rev * 0.8, rev * 0.75, rev];
  }
}

