import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsFilters } from '../analytics.types';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
      <label class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3 text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Date Range</span>
        <select
          [ngModel]="filters().dateRange"
          (ngModelChange)="emitFilters({ ...filters(), dateRange: $event })"
          class="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
        >
          @for (range of dateRanges; track range.value) {
            <option [value]="range.value">{{ range.label }}</option>
          }
        </select>
      </label>

      <label class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3 text-sm">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Branch</span>
        <select
          [ngModel]="filters().branch"
          (ngModelChange)="emitFilters({ ...filters(), branch: $event })"
          class="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
        >
          @for (option of branchOptions(); track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
    </div>
  `,
})
export class FiltersBarComponent {
  readonly filters = input.required<AnalyticsFilters>();
  readonly branchOptions = input.required<Array<{ label: string; value: string }>>();
  readonly filtersChange = output<AnalyticsFilters>();

  readonly dateRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Year to Date', value: 'ytd' },
  ];

  emitFilters(filters: AnalyticsFilters) {
    this.filtersChange.emit(filters);
  }
}
