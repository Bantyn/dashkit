import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminOverview, PlatformGstSettings, PlatformGstStatus } from '../../core/services/admin-api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart.component';
import { UiCounterComponent } from '../../shared/components/ui-counter.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, SparklineChartComponent, UiCounterComponent],
  template: `
    <div class="flex-1 overflow-y-auto">
      <main class="p-5 xl:p-7">

        <!-- Loading -->
        <div *ngIf="loading" class="flex items-center justify-center h-[calc(100vh-100px)] w-full">
          <app-loading-spinner size="lg"></app-loading-spinner>
        </div>

        <!-- Error State -->
        <div *ngIf="!loading && error" class="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full text-slate-500">
          <i class="bi bi-exclamation-triangle text-4xl text-rose-400 mb-3"></i>
          <p class="font-semibold text-slate-700">Failed to load dashboard overview.</p>
          <p class="text-sm text-slate-400 mb-4">{{ error }}</p>
          <button (click)="fetchOverview(true)" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">
            Try Again
          </button>
        </div>

        <div *ngIf="!loading && !error && overview">

          <!-- ══ PAGE HEADER WITH REFRESH CONTROLS ══ -->
          <div class="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 class="text-[22px] font-extrabold text-slate-800">Welcome back, Super Admin! 👋</h1>
              <p class="text-sm text-slate-400 mt-0.5">Here's what's happening on your platform today.</p>
            </div>

            <div class="flex items-center gap-3 self-start sm:self-auto">
              <!-- Last Updated Timestamp -->
              <span *ngIf="lastUpdated" class="text-xs font-semibold text-slate-400">
                Last updated: <strong class="text-slate-600 font-mono">{{ lastUpdated | date: 'mediumTime' }}</strong>
              </span>

              <!-- Live Auto-Refresh Badge -->
              <button
                (click)="toggleAutoRefresh()"
                class="px-2.5 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5"
                [class.bg-emerald-50]="autoRefreshEnabled"
                [class.text-emerald-700]="autoRefreshEnabled"
                [class.border-emerald-200]="autoRefreshEnabled"
                [class.bg-slate-50]="!autoRefreshEnabled"
                [class.text-slate-500]="!autoRefreshEnabled"
                [class.border-slate-200]="!autoRefreshEnabled"
                [title]="autoRefreshEnabled ? 'Auto-refresh every 60s is ON. Click to pause.' : 'Auto-refresh is OFF. Click to turn ON.'"
              >
                <span class="w-2 h-2 rounded-full" [class.bg-emerald-500]="autoRefreshEnabled" [class.animate-ping]="autoRefreshEnabled" [class.bg-slate-400]="!autoRefreshEnabled"></span>
                <span>{{ autoRefreshEnabled ? 'Live (60s)' : 'Paused' }}</span>
              </button>

              <!-- Manual Refresh Button -->
              <button
                (click)="manualRefresh()"
                [disabled]="refreshing"
                class="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <i class="bi bi-arrow-repeat text-sm" [class.animate-spin]="refreshing"></i>
                <span>{{ refreshing ? 'Refreshing...' : 'Refresh Data' }}</span>
              </button>
            </div>
          </div>

          <!-- ══ ROW 1 — 5 STAT CARDS with animated sparklines ══ -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">

            <!-- Total Revenue -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i class="bi bi-graph-up-arrow text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Total Revenue</p>
                <div class="flex items-baseline text-slate-800">
                  <span class="text-[26px] font-black leading-none mr-0.5">Rs.</span>
                  <app-ui-counter
                    [value]="overview.subscriptionInsights?.monthlyRecurringRevenue || 0"
                    [fontSize]="26"
                    [fontWeight]="900"
                    textColor="#1e293b"
                    [gap]="1"
                    gradientFrom="transparent"
                    gradientTo="transparent"
                    [gradientHeight]="0"
                    class="leading-none"
                  ></app-ui-counter>
                </div>
              </div>
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-primary-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 12.5% <span class="text-slate-400 font-normal ml-1">vs last month</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="revenueSparkline" color="var(--color-primary)" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Active Shops -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <i class="bi bi-shop text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Active Shops</p>
                <div class="flex items-baseline text-slate-800">
                  <app-ui-counter
                    [value]="overview.cards?.totalShops || 0"
                    [fontSize]="26"
                    [fontWeight]="900"
                    textColor="#1e293b"
                    [gap]="1"
                    gradientFrom="transparent"
                    gradientTo="transparent"
                    [gradientHeight]="0"
                    class="leading-none"
                  ></app-ui-counter>
                </div>
              </div>
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-green-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 8.3% <span class="text-slate-400 font-normal ml-1">this week</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="shopsSparkline" color="#22c55e" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Total Users -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <i class="bi bi-people text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Total Users</p>
                <div class="flex items-baseline text-slate-800">
                  <app-ui-counter
                    [value]="overview.cards?.totalUsers || 0"
                    [fontSize]="26"
                    [fontWeight]="900"
                    textColor="#1e293b"
                    [gap]="1"
                    gradientFrom="transparent"
                    gradientTo="transparent"
                    [gradientHeight]="0"
                    class="leading-none"
                  ></app-ui-counter>
                </div>
              </div>
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-purple-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 15.2% <span class="text-slate-400 font-normal ml-1">vs last month</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="usersSparkline" color="#a855f7" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Total Orders -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <i class="bi bi-bag-check text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Total Orders</p>
                <div class="flex items-baseline text-slate-800">
                  <app-ui-counter
                    [value]="overview.cards?.totalOrders || 0"
                    [fontSize]="26"
                    [fontWeight]="900"
                    textColor="#1e293b"
                    [gap]="1"
                    gradientFrom="transparent"
                    gradientTo="transparent"
                    [gradientHeight]="0"
                    class="leading-none"
                  ></app-ui-counter>
                </div>
              </div>
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-amber-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 9.4% <span class="text-slate-400 font-normal ml-1">today</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="ordersSparkline" color="#f59e0b" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Active Subscriptions -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <i class="bi bi-receipt text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Active Subscriptions</p>
                <div class="flex items-baseline text-slate-800">
                  <app-ui-counter
                    [value]="overview.subscriptionInsights?.paidShops || 0"
                    [fontSize]="26"
                    [fontWeight]="900"
                    textColor="#1e293b"
                    [gap]="1"
                    gradientFrom="transparent"
                    gradientTo="transparent"
                    [gradientHeight]="0"
                    class="leading-none"
                  ></app-ui-counter>
                </div>
              </div>
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-teal-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 5.1% <span class="text-slate-400 font-normal ml-1">active plans</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="invoicesSparkline" color="#14b8a6" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

          </div>

          <!-- ══ ROW 2 — Platform GST Status Alert Banner ══ -->
          <div *ngIf="gstSettings" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                  <i class="bi bi-shield-check"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-extrabold text-slate-800 text-sm">Platform GST Settings & Compliance</h3>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border" [class]="gstBadgeClass(gstSettings.gstStatus)">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="gstDotClass(gstSettings.gstStatus)"></span>
                      {{ gstStatusLabel(gstSettings.gstStatus) }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">
                    GSTIN: <span class="font-mono font-semibold text-slate-600">{{ gstSettings.gstNumber || 'Not Configured' }}</span>
                    <span class="mx-2">•</span>
                    Legal Name: <span class="font-semibold text-slate-600">{{ gstSettings.legalBusinessName || 'N/A' }}</span>
                    <span class="mx-2">•</span>
                    Verified Date: <span class="font-semibold text-slate-600">{{ formatGstDate(gstSettings.verifiedAt) }}</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <a routerLink="/admin/gst-verification" class="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5">
                  <i class="bi bi-[#] text-sm"></i>
                  Manage GST Setup
                </a>
              </div>
            </div>
          </div>

          <!-- ══ ROW 3 — Quick Links ══ -->
          <div class="mb-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Management Controls</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <a
                *ngFor="let link of getQuickLinks()"
                [routerLink]="link.route"
                class="group bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div class="w-10 h-10 rounded-xl transition-colors flex items-center justify-center text-lg" [class]="link.bgClass">
                  <i [class]="'bi ' + link.icon"></i>
                </div>
                <span class="text-xs font-bold text-slate-700 group-hover:text-primary-600 transition-colors">{{ link.label }}</span>
              </a>
            </div>
          </div>

          <!-- ══ ROW 4 — Platform Control Panels Grid ══ -->
          <div>
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Core Administration Modules</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                *ngFor="let ctrl of controlLinks"
                [routerLink]="ctrl.route"
                class="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <i [class]="'bi ' + ctrl.icon"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">{{ ctrl.label }}</h3>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ ctrl.description }}</p>
                </div>
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`:host { display: flex; flex-direction: column; flex: 1; }`]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminApiService);
  overview: AdminOverview | null = null;
  loading = true;
  refreshing = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

  autoRefreshEnabled = true;
  private autoRefreshTimer: any = null;

  gstSettings: PlatformGstSettings | null = null;
  gstLoading = true;

  // ─── Sparkline placeholder data ───
  revenueSparkline   = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  shopsSparkline     = [0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
  usersSparkline     = [0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
  ordersSparkline    = [0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
  invoicesSparkline  = [0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
  shopsGrowthSparkline = [0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];
  usersGrowthSparkline = [0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];

  readonly quickLinks = [
    { route: '/shops',        label: 'All Shops',    icon: 'bi-shop',           color: 'blue'   },
    { route: '/users',        label: 'Users',         icon: 'bi-people',         color: 'green'  },
    { route: '/plans',        label: 'Plans',         icon: 'bi-credit-card',    color: 'purple' },
    { route: '/features',     label: 'Features',      icon: 'bi-puzzle',         color: 'orange' },
    { route: '/roles',        label: 'Roles',         icon: 'bi-shield-lock',    color: 'red'    },
    { route: '/billing',      label: 'Billing',       icon: 'bi-receipt',        color: 'teal'   },
    { route: '/transactions', label: 'Transactions',  icon: 'bi-arrow-left-right', color: 'indigo'},
    { route: '/themes',       label: 'Themes',        icon: 'bi-palette',        color: 'pink'   },
  ];

  readonly controlLinks = [
    { route: '/plans',        label: 'Subscription Plans',      description: 'Create, update, delete pricing plans',       icon: 'bi-credit-card',      color: 'purple' },
    { route: '/features',     label: 'Feature Master',           description: 'Control plan features and feature catalog',  icon: 'bi-puzzle',           color: 'orange' },
    { route: '/roles',        label: 'Roles and Permissions',    description: 'Manage RBAC roles and permission sets',       icon: 'bi-shield-lock',      color: 'red'    },
    { route: '/billing',      label: 'Billing and Autopay',      description: 'Control gateway, retries and autopay rules', icon: 'bi-receipt',          color: 'teal'   },
    { route: '/transactions', label: 'Transactions Monitor',     description: 'Watch invoice and order payment flow',       icon: 'bi-arrow-left-right', color: 'blue'   },
  ];

  ngOnInit() {
    this.fetchOverview(false);
    this.fetchGstStatus();
    this.startAutoRefreshTimer();
  }

  ngOnDestroy() {
    this.stopAutoRefreshTimer();
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefreshTimer();
      this.fetchOverview(true);
    } else {
      this.stopAutoRefreshTimer();
    }
  }

  private startAutoRefreshTimer() {
    this.stopAutoRefreshTimer();
    if (this.autoRefreshEnabled) {
      this.autoRefreshTimer = setInterval(() => {
        if (this.autoRefreshEnabled && !this.refreshing) {
          this.fetchOverview(true);
        }
      }, 60000); // 60 seconds background silent refresh
    }
  }

  private stopAutoRefreshTimer() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  manualRefresh() {
    this.fetchOverview(true);
    this.fetchGstStatus();
  }

  fetchGstStatus() {
    this.adminApi.getPlatformGstSettings().subscribe({
      next: (res) => {
        this.gstSettings = res.data;
        this.gstLoading = false;
      },
      error: () => { this.gstLoading = false; }
    });
  }

  fetchOverview(isSilentRefresh: boolean = false) {
    if (isSilentRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.error = null;

    this.adminApi.getOverview().subscribe({
      next: (response) => {
        this.overview = response.data;
        this.loading = false;
        this.refreshing = false;
        this.lastUpdated = new Date();

        if (this.overview?.sparklines) {
          this.revenueSparkline = this.overview.sparklines.revenue;
          this.shopsSparkline = this.overview.sparklines.shops;
          this.usersSparkline = this.overview.sparklines.users;
          this.ordersSparkline = this.overview.sparklines.orders;
          this.invoicesSparkline = this.overview.sparklines.invoices;
          this.shopsGrowthSparkline = this.overview.sparklines.shopsGrowth;
          this.usersGrowthSparkline = this.overview.sparklines.usersGrowth;
        }
      },
      error: (err) => { 
        this.loading = false;
        this.refreshing = false;
        if (!isSilentRefresh) {
          this.error = err.error?.message || err.message || 'An unknown error occurred.';
        }
      }
    });
  }

  gstStatusLabel(status: PlatformGstStatus): string {
    const map: Record<PlatformGstStatus, string> = {
      not_configured: 'Not Configured',
      pending: 'Pending Verification',
      verified: 'Verified',
      failed: 'Verification Failed',
      suspended: 'Suspended',
    };
    return map[status] || status;
  }

  gstBadgeClass(status: PlatformGstStatus): string {
    const map: Record<PlatformGstStatus, string> = {
      not_configured: 'bg-gray-100 text-gray-600 border-gray-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      suspended: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  }

  gstDotClass(status: PlatformGstStatus): string {
    const map: Record<PlatformGstStatus, string> = {
      not_configured: 'bg-gray-400',
      pending: 'bg-amber-400 animate-pulse',
      verified: 'bg-emerald-500',
      failed: 'bg-red-500',
      suspended: 'bg-orange-500',
    };
    return map[status] || 'bg-gray-400';
  }

  formatGstDate(ts: any): string {
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  }

  getQuickLinkBg(color: string): string {
    return 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white';
  }

  getQuickLinks() {
    return this.quickLinks.map(link => ({ ...link, bgClass: this.getQuickLinkBg(link.color) }));
  }
}
