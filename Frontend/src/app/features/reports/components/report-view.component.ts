import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { PermissionService } from '../../../core/services/permission.service';
import { ReportDefinition, ReportKey } from '../reports.constants';
import { ReportFilters, ReportsService } from '../reports.service';
import { ReportLoadingSkeletonComponent } from './report-loading-skeleton.component';

Chart.register(...registerables);

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, ReportLoadingSkeletonComponent],
  template: `
    <div class="p-6 xl:p-8">
      @if (loading) {
        <app-report-loading-skeleton />
      } @else if (errorMessage) {
        <section class="rounded-[2rem] border border-rose-100 bg-rose-50 p-6 text-rose-800 ">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-normal">Unable to load report</h2>
              <p class="mt-2 text-sm">{{ errorMessage }}</p>
            </div>
            <button
              type="button"
              (click)="reload()"
              class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-normal text-white transition hover:bg-rose-700"
            >
              <i class="bi bi-arrow-repeat"></i>
              Retry
            </button>
          </div>
        </section>
      } @else if (report) {
        <section class="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 ">
          <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-3xl">
              <div class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-normal text-primary-700">
                <i class="bi bi-shield-check"></i>
                Shop Report Workspace
              </div>
              <h1 class="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {{ report.title }}
              </h1>
              <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ report.subtitle }}</p>
              <p class="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                {{ report.description }}
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <label class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3 text-sm">
                <span class="mb-2 block text-xs font-normal tracking-wide text-gray-400">Date Range</span>
                <select
                  [(ngModel)]="filters.dateRange"
                  (ngModelChange)="reload()"
                  class="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
                >
                  @for (range of dateRanges; track range.value) {
                    <option [value]="range.value">{{ range.label }}</option>
                  }
                </select>
              </label>

              <label class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3 text-sm">
                <span class="mb-2 block text-xs font-normal tracking-wide text-gray-400">Segment</span>
                <select
                  [(ngModel)]="filters.segment"
                  (ngModelChange)="reload()"
                  class="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
                >
                  @for (option of report.segmentOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <label class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3 text-sm">
                <span class="mb-2 block text-xs font-normal tracking-wide text-gray-400">Scope</span>
                <select
                  [(ngModel)]="filters.channel"
                  (ngModelChange)="reload()"
                  class="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
                >
                  @for (option of report.channelOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              (click)="exportCsv()"
              [disabled]="!can(report.exportPermission)"
              class="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-normal transition-colors"
              [class.bg-primary-600]="can(report.exportPermission)"
              [class.text-white]="can(report.exportPermission)"
              [class.hover:bg-primary-700]="can(report.exportPermission)"
              [class.bg-gray-100]="!can(report.exportPermission)"
              [class.text-gray-400]="!can(report.exportPermission)"
              [class.cursor-not-allowed]="!can(report.exportPermission)"
            >
              <i class="bi bi-download"></i>
              Export CSV
            </button>

            <button
              type="button"
              [disabled]="!can(report.actionPermission)"
              class="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-normal transition-colors"
              [class.border-primary-200]="can(report.actionPermission)"
              [class.text-primary-700]="can(report.actionPermission)"
              [class.bg-primary-50]="can(report.actionPermission)"
              [class.hover:bg-primary-100]="can(report.actionPermission)"
              [class.border-gray-200]="!can(report.actionPermission)"
              [class.bg-gray-50]="!can(report.actionPermission)"
              [class.text-gray-400]="!can(report.actionPermission)"
              [class.cursor-not-allowed]="!can(report.actionPermission)"
            >
              <i class="bi bi-lock"></i>
              {{ report.actionLabel }}
            </button>

            @if (!can(report.actionPermission)) {
              <div class="inline-flex items-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                Missing permission: {{ report.actionPermission }}
              </div>
            }
          </div>
        </section>

        <section class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          @for (metric of report.metrics; track metric.label) {
            <article class="rounded-[1.75rem] border border-gray-100 bg-white p-5 ">
              <div class="flex items-center justify-between">
                <div [class]="getMetricTone(metric.tone)">
                  <i [class]="'bi ' + metric.icon + ' text-lg'"></i>
                </div>
                <span class="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-normal uppercase tracking-wide text-gray-400">
                  {{ metric.tone }}
                </span>
              </div>
              <p class="mt-4 text-sm font-medium text-gray-500">{{ metric.label }}</p>
              <p class="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {{ metric.value }}
              </p>
              <p class="mt-2 text-xs font-medium text-gray-400">{{ metric.hint }}</p>
            </article>
          }
        </section>

        <section class="mt-6 grid gap-6 2xl:grid-cols-[1.55fr_0.8fr]">
          <article class="rounded-[2rem] border border-gray-100 bg-white p-6 ">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-normal text-[var(--text-primary)]">{{ report.chartTitle }}</h2>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ report.chartSubtitle }}</p>
              </div>
              <div class="rounded-full bg-[var(--bg-page)] px-3 py-1 text-xs font-normal text-gray-500">
                {{ selectedRangeLabel }}
              </div>
            </div>

            <div class="mt-6 h-[320px]">
              <canvas baseChart [type]="report.chartType" [data]="chartData" [options]="chartOptions"></canvas>
            </div>
          </article>

          <article class="rounded-[2rem] border border-gray-100 bg-white p-6 ">
            <h2 class="text-lg font-normal text-[var(--text-primary)]">Highlights</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              Fast takeaways for the selected scope.
            </p>

            <div class="mt-5 space-y-3">
              @for (highlight of report.highlights; track highlight) {
                <div class="flex items-start gap-3 rounded-2xl bg-[var(--bg-page)] px-4 py-3">
                  <div class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                    <i class="bi bi-check2"></i>
                  </div>
                  <p class="text-sm font-medium text-gray-700">{{ highlight }}</p>
                </div>
              }
            </div>
          </article>
        </section>

        <section class="mt-6 rounded-[2rem] border border-gray-100 bg-white p-6 ">
          <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="text-lg font-normal text-[var(--text-primary)]">Detailed Table</h2>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">Live rows generated from current shop data.</p>
            </div>
            <div class="rounded-full bg-gray-50 px-3 py-1 text-xs font-normal text-gray-500">
              {{ report.rows.length }} rows
            </div>
          </div>

          <div class="mt-6 overflow-x-auto">
            <table class="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  @for (column of report.columns; track column.key) {
                    <th
                      class="px-4 pb-2 text-xs font-normal tracking-wide text-gray-400"
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
                @for (row of report.rows; track $index) {
                  <tr class="rounded-2xl bg-[var(--bg-page)]">
                    @for (column of report.columns; track column.key) {
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
    </div>
  `,
})
export class ReportViewComponent implements OnInit {
  readonly reportKey = input.required<ReportKey>();

  private readonly reportsService = inject(ReportsService);
  private readonly permissionService = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dateRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Year to Date', value: 'ytd' },
  ];

  loading = true;
  report: ReportDefinition | null = null;
  errorMessage = '';
  filters: ReportFilters = {
    dateRange: '30d',
    segment: 'all',
    channel: 'all',
  };

  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 18,
          color: '#6b7094',
          font: {
            family: 'Inter',
            size: 12,
            weight: '600',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(28, 32, 51, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#eef0fa',
        padding: 12,
        cornerRadius: 14,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9094a6',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#eef0fa',
        },
        ticks: {
          color: '#9094a6',
        },
      },
    },
  };

  ngOnInit() {
    this.reload();
  }

  get selectedRangeLabel() {
    return this.dateRanges.find((item) => item.value === this.filters.dateRange)?.label || 'Last 30 days';
  }

  reload() {
    this.loading = true;
    this.errorMessage = '';

    this.reportsService
      .loadReport(this.reportKey(), this.filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (report) => {
          this.report = report;
          this.chartData = {
            labels: report.labels,
            datasets: report.series.map((series) => ({
              label: series.label,
              data: series.data,
              borderColor: series.color,
              backgroundColor: this.getBackgroundColor(report.chartType, series.color, series.fill),
              fill: !!series.fill,
              tension: report.chartType === 'line' ? 0.35 : 0,
              borderRadius: report.chartType === 'bar' ? 14 : 0,
              pointBackgroundColor: series.color,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: report.chartType === 'line' ? 4 : 0,
              hoverOffset: report.chartType === 'doughnut' ? 12 : 0,
            })),
          };

          this.chartOptions =
            report.chartType === 'doughnut'
              ? {
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '68%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 18,
                        color: '#6b7094',
                        font: {
                          family: 'Inter',
                          size: 12,
                          weight: '600',
                        },
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(28, 32, 51, 0.92)',
                      titleColor: '#ffffff',
                      bodyColor: '#eef0fa',
                      padding: 12,
                      cornerRadius: 14,
                    },
                  },
                }
              : { ...this.chartOptions };

          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading report data:', error);
          this.report = null;
          this.loading = false;
          this.errorMessage = error?.error?.message || 'Please try again in a moment.';
        },
      });
  }

  can(permission: string) {
    return this.permissionService.hasPermission(permission);
  }

  exportCsv() {
    if (!this.report || !this.can(this.report.exportPermission)) {
      return;
    }

    const headers = this.report.columns.map((column) => column.label);
    const rows = this.report.rows.map((row) =>
      this.report!.columns.map((column) => this.escapeCsv(row[column.key])),
    );
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.report.key}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  getMetricTone(tone: string) {
    const tones: Record<string, string> = {
      primary: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700',
      success: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700',
      warning: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700',
      neutral: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700',
    };

    return tones[tone] || tones['primary'];
  }

  private getBackgroundColor(chartType: string, color: string, fill = false) {
    if (chartType === 'doughnut') {
      return ['#7379e8', '#5f65d8', '#8e94f2', '#c3c7ff'];
    }

    if (!fill) {
      return color;
    }

    return `${color}22`;
  }

  private escapeCsv(value: string | number | undefined) {
    const stringValue = String(value ?? '');
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
}
