import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  metric: string;
  value: string;
}

@Component({
  selector: 'app-admin-observability',
  standalone: true,
  imports: [CommonModule, FormsModule, SparklineChartComponent, CheckboxComponent, LoadingSpinnerComponent],
  templateUrl: './admin-observability.component.html',
  styleUrls: ['./admin-observability.component.css'],
  host: { class: 'block h-full overflow-hidden flex flex-col' }
})
export class AdminObservabilityComponent implements OnInit, OnDestroy {
  Math = Math;
  activeTab = 'overview';
  metrics: any = null;
  history: any[] = [];
  loading = true;
  error = '';
  autoRefresh = true;
  refreshIntervalSeconds = 30;
  alerts: Alert[] = [];

  // Chart data arrays
  rpsData: number[] = [];
  latencyData: number[] = [];
  cpuData: number[] = [];
  memoryData: number[] = [];

  private refreshSub?: Subscription;

  tabs = [
    { id: 'overview', label: 'Platform Overview', icon: 'bi-grid-fill' },
    { id: 'live', label: 'Live Monitoring', icon: 'bi-activity' },
    { id: 'api', label: 'API Performance', icon: 'bi-speedometer2' },
    { id: 'firestore', label: 'Firestore Usage', icon: 'bi-database-fill' },
    { id: 'cache', label: 'Cache Analytics', icon: 'bi-lightning-charge-fill' },
    { id: 'infra', label: 'Infrastructure', icon: 'bi-cpu-fill' },
    { id: 'database', label: 'Database', icon: 'bi-server' },
    { id: 'shops', label: 'Shop Resource Usage', icon: 'bi-shop' },
    { id: 'errors', label: 'Errors Center', icon: 'bi-exclamation-triangle-fill' },
    { id: 'cost', label: 'Cost Analytics', icon: 'bi-currency-dollar' },
    { id: 'health', label: 'System Health', icon: 'bi-heart-pulse-fill' }
  ];

  constructor(private apiService: AdminApiService) {}

  ngOnInit() {
    this.fetchData();
    this.setupRefresh();
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    this.setupRefresh();
  }

  changeTab(tabId: string) {
    this.activeTab = tabId;
  }

  fetchData() {
    this.apiService.getObservabilityMetrics().subscribe({
      next: (res) => {
        this.metrics = res.data;
        this.runAlertEngine();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load observability metrics';
        console.error(err);
      }
    });

    this.apiService.getObservabilityHistory().subscribe({
      next: (res) => {
        this.history = res.data || [];
        this.buildCharts();
      },
      error: (err) => {
        console.error('Failed to load historical snapshots:', err);
      }
    });
  }

  private setupRefresh() {
    this.refreshSub?.unsubscribe();
    if (this.autoRefresh) {
      this.refreshSub = interval(this.refreshIntervalSeconds * 1000).subscribe(() => {
        this.fetchData();
      });
    }
  }

  // ── Alert Engine ───────────────────────────────────────────────────────────

  private runAlertEngine() {
    if (!this.metrics) return;
    const newAlerts: Alert[] = [];

    // 1. API Latency Alert
    if (this.metrics.overview.avgResponseTimeMs > 500) {
      newAlerts.push({
        type: 'critical',
        message: 'Platform API average latency is abnormally high!',
        timestamp: new Date(),
        metric: 'Avg Latency',
        value: `${this.metrics.overview.avgResponseTimeMs}ms`
      });
    } else if (this.metrics.overview.avgResponseTimeMs > 250) {
      newAlerts.push({
        type: 'warning',
        message: 'Platform API average latency is elevated.',
        timestamp: new Date(),
        metric: 'Avg Latency',
        value: `${this.metrics.overview.avgResponseTimeMs}ms`
      });
    }

    // 2. Invoice Checkout Latency Alert
    if (this.metrics.averages.invoice > 250) {
      newAlerts.push({
        type: 'critical',
        message: 'POS Invoice Checkout transaction duration exceeds threshold.',
        timestamp: new Date(),
        metric: 'Invoice Latency',
        value: `${this.metrics.averages.invoice}ms`
      });
    }

    // 3. Dashboard Latency Alert
    if (this.metrics.averages.dashboard > 500) {
      newAlerts.push({
        type: 'warning',
        message: 'Dashboard compilation requests are responding slowly.',
        timestamp: new Date(),
        metric: 'Dashboard Latency',
        value: `${this.metrics.averages.dashboard}ms`
      });
    }

    // 4. Cache Efficiency Alert
    if (this.metrics.cache.efficiency < 80) {
      newAlerts.push({
        type: 'warning',
        message: 'In-Memory cache hit rate dropped below 80%.',
        timestamp: new Date(),
        metric: 'Cache Efficiency',
        value: `${this.metrics.cache.efficiency}%`
      });
    }

    // 5. RAM Usage Alert
    if (this.metrics.infrastructure.cpuUsage > 85) {
      newAlerts.push({
        type: 'critical',
        message: 'SaaS server CPU usage is critical!',
        timestamp: new Date(),
        metric: 'CPU Load',
        value: `${this.metrics.infrastructure.cpuUsage}%`
      });
    }

    if (this.metrics.infrastructure.ramUsageMB > 500) {
      newAlerts.push({
        type: 'warning',
        message: 'High Node process memory footprints detected.',
        timestamp: new Date(),
        metric: 'RAM usage',
        value: `${this.metrics.infrastructure.ramUsageMB} MB`
      });
    }

    // 6. Firestore Spike Alert
    if (this.metrics.firestore.readsToday > 10000) {
      newAlerts.push({
        type: 'info',
        message: 'Firestore Reads are spiking today.',
        timestamp: new Date(),
        metric: 'Reads Today',
        value: String(this.metrics.firestore.readsToday)
      });
    }

    this.alerts = newAlerts;
  }

  // ── Custom Sparkline Charts ──────────────────────────────────────────────

  private buildCharts() {
    if (this.history.length < 2) {
      // Create mockup history points for SVG curves if cold start
      this.history = [];
      const now = Date.now();
      for (let i = 24; i >= 0; i--) {
        const time = now - i * 1000 * 60 * 60;
        this.history.push({
          timestamp: new Date(time).toISOString(),
          overview: { requestsToday: 10 + i * 2, activeRequests: i % 3 },
          percentiles: { p95: 50 + (i % 5) * 15 },
          infrastructure: { cpuUsage: 5 + (i % 4) * 8, ramUsageMB: 120 + (i % 2) * 5 }
        });
      }
    }

    this.rpsData = this.history.map(h => h.overview?.activeRequests || 0);
    this.latencyData = this.history.map(h => h.percentiles?.p95 || 0);
    this.cpuData = this.history.map(h => h.infrastructure?.cpuUsage || 0);
    this.memoryData = this.history.map(h => h.infrastructure?.ramUsageMB || 0);
  }

  // ── Frontend Utility Formatters ────────────────────────────────────────────

  formatBytes(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getCollectionKeys(byColObj: any): string[] {
    if (!byColObj) return [];
    return Object.keys(byColObj);
  }
}
