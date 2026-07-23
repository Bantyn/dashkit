import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="relative w-full h-full flex items-center justify-center" style="min-height: 160px;">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="doughnut">
      </canvas>
      <!-- Centre label -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p class="text-3xl font-black text-slate-800">{{ centerValue }}</p>
        <p class="text-xs font-semibold text-slate-400 mt-0.5">{{ centerLabel }}</p>
      </div>
    </div>
  `,
})
export class DonutChartComponent implements OnChanges {
  @Input() completed  = 0;
  @Input() pending    = 0;
  @Input() cancelled  = 0;
  @Input() centerLabel = 'Total Orders';

  get centerValue(): number {
    return this.completed + this.pending + this.cancelled;
  }

  chartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,15,20,0.9)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    animation: { animateRotate: true, duration: 900 },
  };

  ngOnChanges() {
    const total = this.completed + this.pending + this.cancelled;
    // When empty show a light grey ring
    this.chartData = {
      labels: ['Completed', 'Pending', 'Cancelled'],
      datasets: [{
        data: total === 0 ? [1, 0, 0] : [this.completed, this.pending, this.cancelled],
        backgroundColor: total === 0
          ? ['#e2e8f0', '#e2e8f0', '#e2e8f0']
          : ['#22c55e', '#f59e0b', '#ef4444'],
        hoverBackgroundColor: total === 0
          ? ['#e2e8f0', '#e2e8f0', '#e2e8f0']
          : ['#16a34a', '#d97706', '#dc2626'],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
        borderRadius: 4,
      }],
    };
  }
}
