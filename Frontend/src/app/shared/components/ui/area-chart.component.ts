import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="relative w-full h-full min-h-[var(--chart-height,200px)]">
      <canvas
        baseChart
        [data]="chartData"
        [options]="chartOptions"
        [type]="chartType"
      ></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class AreaChartComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() xKey: string = 'date';
  @Input() yKeys: string[] = ['value'];
  @Input() labels: any[] = [];
  @Input() colors: string[] = ['#8b5cf6', '#a1a1b5']; // Primary and Secondary
  @Input() AreaGradients = true;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'line';
  public chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
          color: '#717184'
        }
      },
      y: {
        border: { display: false },
        grid: {
          color: '#f4f4f8',
        },
        ticks: {
          font: { size: 10 },
          color: '#717184',
          maxTicksLimit: 5
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curve
        borderWidth: 2,
        fill: true
      },
      point: {
        radius: 0,
        hoverRadius: 4,
        hitRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 2
      }
    }
  };

  ngOnInit() {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['labels']) {
      this.updateChart();
    }
  }

  private updateChart() {
    this.chartData = {
      labels: this.labels.length ? this.labels : this.data.map(d => d[this.xKey]),
      datasets: this.yKeys.map((key, i) => ({
        data: this.data.map(d => d[key]),
        label: key.charAt(0).toUpperCase() + key.slice(1),
        borderColor: this.colors[i] || this.colors[0],
        pointHoverBorderColor: this.colors[i] || this.colors[0],
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          const color = this.colors[i] || this.colors[0];
          
          gradient.addColorStop(0, this.hexToRgba(color, 0.2));
          gradient.addColorStop(1, this.hexToRgba(color, 0));
          return gradient;
        },
        fill: 'origin'
      }))
    };
    if (this.chart) {
      this.chart.update();
    }
  }

  private hexToRgba(hex: string, opacity: number): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
