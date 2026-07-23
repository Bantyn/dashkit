import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsDefinition } from '../analytics.types';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <article class="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ definition().chartTitle }}</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ definition().chartSubtitle }}</p>
        </div>
        <div class="rounded-full bg-[var(--bg-page)] px-3 py-1 text-xs font-semibold text-gray-500">
          {{ activeRangeLabel() }}
        </div>
      </div>

      <div class="mt-6 h-[320px]">
        <canvas baseChart [type]="definition().chartType" [data]="chartData()" [options]="chartOptions()"></canvas>
      </div>
    </article>
  `,
})
export class ChartCardComponent {
  readonly definition = input.required<AnalyticsDefinition>();
  readonly activeRangeLabel = input.required<string>();

  readonly chartData = computed(() => ({
    labels: this.definition().labels,
    datasets: this.definition().series.map((series) => ({
      label: series.label,
      data: series.data,
      borderColor: series.color,
      backgroundColor:
        this.definition().chartType === 'doughnut'
          ? ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe']
          : series.fill
            ? `${series.color}22`
            : series.color,
      fill: !!series.fill,
      tension: this.definition().chartType === 'line' ? 0.35 : 0,
      borderRadius: this.definition().chartType === 'bar' ? 14 : 0,
      pointBackgroundColor: series.color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: this.definition().chartType === 'line' ? 4 : 0,
      hoverOffset: this.definition().chartType === 'doughnut' ? 12 : 0,
    })),
  }));

  readonly chartOptions = computed<any>(() =>
    this.definition().chartType === 'doughnut'
      ? {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                usePointStyle: true,
                padding: 18,
                color: '#6b7094',
              },
            },
          },
        }
      : {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                usePointStyle: true,
                padding: 18,
                color: '#6b7094',
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9094a6' } },
            y: { beginAtZero: true, grid: { color: '#eef0fa' }, ticks: { color: '#9094a6' } },
          },
        },
  );
}
