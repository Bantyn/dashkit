import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsFilters, AnalyticsPageKey, AnalyticsDefinition } from '../analytics.types';
import { AnalyticsLoadingSkeletonComponent } from './analytics-loading-skeleton.component';
import { AnalyticsEmptyStateComponent } from './analytics-empty-state.component';
import { ChartCardComponent } from './chart-card.component';
import { FiltersBarComponent } from './filters-bar.component';
import { SummaryCardComponent } from './summary-card.component';

@Component({
  selector: 'app-analytics-view',
  standalone: true,
  imports: [
    CommonModule,
    AnalyticsLoadingSkeletonComponent,
    AnalyticsEmptyStateComponent,
    ChartCardComponent,
    FiltersBarComponent,
    SummaryCardComponent,
  ],
  template: `
    <div class="p-6 xl:p-8">
      @if (loading) {
        <app-analytics-loading-skeleton />
      } @else if (errorMessage) {
        <section class="rounded-[2rem] border border-rose-100 bg-rose-50 p-6 text-rose-800 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">Unable to load analytics</h2>
              <p class="mt-2 text-sm">{{ errorMessage }}</p>
            </div>
            <button
              type="button"
              (click)="reload()"
              class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              <i class="bi bi-arrow-repeat"></i>
              Retry
            </button>
          </div>
        </section>
      } @else if (definition) {
        <section class="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-3xl">
              <div class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                <i class="bi bi-activity"></i>
                Shop Analytics Workspace
              </div>
              <h1 class="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{{ definition.title }}</h1>
              <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ definition.subtitle }}</p>
              <p class="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{{ definition.description }}</p>
            </div>

            <app-filters-bar
              [filters]="filters"
              [branchOptions]="definition.branchOptions"
              (filtersChange)="updateFilters($event)"
            />
          </div>
        </section>

        <section class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (card of definition.summaryCards; track card.label) {
            <app-summary-card [card]="card" />
          }
        </section>

        @if (!definition.rows.length) {
          <div class="mt-6">
            <app-analytics-empty-state
              [title]="definition.emptyTitle"
              [description]="definition.emptyDescription"
            />
          </div>
        } @else {
          <section class="mt-6 grid gap-6 2xl:grid-cols-[1.45fr_0.8fr]">
            <app-chart-card
              [definition]="definition"
              [activeRangeLabel]="selectedRangeLabel"
            />

            <article class="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-semibold text-[var(--text-primary)]">Insights</h2>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">Quick takeaways for the selected branch scope.</p>

              <div class="mt-5 space-y-3">
                @for (insight of definition.insights; track insight) {
                  <div class="flex items-start gap-3 rounded-2xl bg-[var(--bg-page)] px-4 py-3">
                    <div class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                      <i class="bi bi-check2"></i>
                    </div>
                    <p class="text-sm font-medium text-gray-700">{{ insight }}</p>
                  </div>
                }
              </div>
            </article>
          </section>

          <section class="mt-6 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-[var(--text-primary)]">Detailed Breakdown</h2>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">Live analytics rows scoped to the current shop and filters.</p>
              </div>
              <div class="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
                {{ definition.rows.length }} rows
              </div>
            </div>

            <div class="mt-6 overflow-x-auto">
              <table class="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    @for (column of definition.columns; track column.key) {
                      <th
                        class="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400"
                        [class.text-right]="column.align === 'right'"
                        [class.text-center]="column.align === 'center'"
                        [class.text-left]="!column.align || column.align === 'left'"
                      >
                        {{ column.label }}
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of definition.rows; track $index) {
                    <tr class="rounded-2xl bg-[var(--bg-page)]">
                      @for (column of definition.columns; track column.key) {
                        <td
                          class="px-4 py-4 text-sm font-medium text-gray-700 first:rounded-l-2xl last:rounded-r-2xl"
                          [class.text-right]="column.align === 'right'"
                          [class.text-center]="column.align === 'center'"
                          [class.text-left]="!column.align || column.align === 'left'"
                        >
                          {{ row[column.key] }}
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class AnalyticsViewComponent implements OnInit {
  readonly pageKey = input.required<AnalyticsPageKey>();

  private readonly analyticsService = inject(AnalyticsService);
  private readonly shopContextService = inject(ShopContextService);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage = '';
  definition: AnalyticsDefinition | null = null;
  private shopId: string | null = null;
  filters: AnalyticsFilters = {
    dateRange: '30d',
    branch: 'all',
  };

  ngOnInit() {
    this.shopContextService.currentShopId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shopId) => {
        this.shopId = shopId;
        if (shopId) {
          this.reload();
        }
      });
  }

  get selectedRangeLabel() {
    const map: Record<string, string> = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      ytd: 'Year to date',
    };

    return map[this.filters.dateRange] || 'Last 30 days';
  }

  updateFilters(filters: AnalyticsFilters) {
    this.filters = filters;
    this.reload();
  }

  reload() {
    const shopId = this.shopId;
    if (!shopId) {
      this.definition = null;
      this.loading = false;
      this.errorMessage = 'Shop context is missing for this analytics page.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.analyticsService
      .loadPage(shopId, this.pageKey(), this.filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (definition) => {
          this.definition = definition;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading analytics page:', error);
          this.definition = null;
          this.loading = false;
          this.errorMessage = error?.error?.message || 'Please try again in a moment.';
        },
      });
  }
}
