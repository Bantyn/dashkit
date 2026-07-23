import { Component, inject } from '@angular/core';
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
          <button (click)="fetchOverview()" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">
            Try Again
          </button>
        </div>

        <div *ngIf="!loading && !error && overview">

          <!-- ══ PAGE HEADER ══ -->
          <div class="mb-5">
            <h1 class="text-[22px] font-extrabold text-slate-800">Welcome back, Super Admin! 👋</h1>
            <p class="text-sm text-slate-400 mt-0.5">Here's what's happening on your platform today.</p>
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
                <div class="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i class="bi bi-shop text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Active Shops</p>
                <app-ui-counter
                  [value]="overview.cards['activeShops'] || 0"
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
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-primary-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 100% <span class="text-slate-400 font-normal ml-1">vs last month</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="shopsSparkline" color="var(--color-primary)" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Total Users -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i class="bi bi-people-fill text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Total Users</p>
                <app-ui-counter
                  [value]="overview.cards['totalUsers'] || 0"
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
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-primary-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 16.7% <span class="text-slate-400 font-normal ml-1">vs last month</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="usersSparkline" color="var(--color-primary)" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Network Orders -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i class="bi bi-cart-check-fill text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Network Orders</p>
                <app-ui-counter
                  [value]="overview.cards['totalOrders'] || 0"
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
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-rose-500 flex items-center gap-0.5 whitespace-nowrap">
                  ↓ 7.1% <span class="text-slate-400 font-normal ml-1">vs last month</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="ordersSparkline" color="var(--color-primary)" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

            <!-- Network Invoices -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <i class="bi bi-receipt text-xl"></i>
                </div>
                <button class="text-slate-300 hover:text-slate-500"><i class="bi bi-three-dots text-sm"></i></button>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-500 mb-1">Network Invoices</p>
                <app-ui-counter
                  [value]="overview.cards['totalInvoices'] || 0"
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
              <div class="flex items-end justify-between gap-2">
                <span class="text-[11px] font-bold text-primary-600 flex items-center gap-0.5 whitespace-nowrap">
                  ↑ 27.3% <span class="text-slate-400 font-normal ml-1">vs last month</span>
                </span>
                <div class="shrink-0" style="width:125px; height:50px;">
                  <app-sparkline [data]="invoicesSparkline" color="var(--color-primary)" [width]="125" [height]="50"></app-sparkline>
                </div>
              </div>
            </div>

          </div>

          <!-- ══ QUICK ACTIONS ══ -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-[15px] font-bold text-slate-800">Quick Actions</h2>
              <button class="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1">
                <i class="bi bi-sliders"></i> Customize
              </button>
            </div>
            <div class="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              @for (link of getQuickLinks(); track link.label) {
                <a [routerLink]="link.route"
                   class="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 {{ link.bgClass }}">
                    <i [class]="'bi ' + link.icon + ' text-xl'"></i>
                  </div>
                  <span class="text-xs font-semibold text-slate-600 group-hover:text-slate-900 text-center leading-tight">
                    {{ link.label }}
                  </span>
                </a>
              }
            </div>
          </div>

          <!-- ══ ROW 2 — PLATFORM OVERVIEW + REVENUE OVERVIEW + BACKEND HEALTH ══ -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">

            <!-- Platform Overview -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="mb-4">
                <h3 class="text-[15px] font-bold text-slate-800">Platform Overview</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">Real-time overview of your platform</p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                @for (item of getPlatformOverviewItems(); track item.label) {
                  <div class="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-2 mb-2">
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm {{ item.iconBg }}">
                        <i [class]="'bi ' + item.icon"></i>
                      </div>
                      <span class="text-[11px] font-semibold text-slate-400">{{ item.label }}</span>
                    </div>
                    <p class="text-xl font-black text-slate-800">{{ item.value | number }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Revenue Overview -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-[15px] font-bold text-slate-800">Revenue Overview</h3>
                  <p class="text-[11px] text-slate-400 mt-0.5">Subscription revenue & growth</p>
                </div>
                <span class="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">This Month</span>
              </div>
              <!-- MRR / ARR big numbers -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1">MRR</p>
                  <p class="text-[20px] font-black text-primary-700">Rs. {{ overview.subscriptionInsights?.monthlyRecurringRevenue || 0 | number }}</p>
                </div>
                <div class="p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1">ARR</p>
                  <p class="text-[20px] font-black text-primary-700">Rs. {{ overview.subscriptionInsights?.annualRecurringRevenue || 0 | number }}</p>
                </div>
              </div>
              <!-- Plan mix pills -->
              <div class="space-y-2">
                @for (plan of overview.subscriptionInsights?.planMix || []; track plan.planCode) {
                  <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black text-slate-700 uppercase px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700">{{ plan.planCode }}</span>
                      <span class="text-[11px] text-slate-400">{{ plan.shops }} shops</span>
                    </div>
                    <span class="text-[13px] font-bold text-slate-800">Rs. {{ plan.monthlyRevenue | number }}/mo</span>
                  </div>
                } @empty {
                  <div class="flex items-center justify-between p-2.5 rounded-xl border border-primary-100 bg-violet-50">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase px-2 py-0.5 rounded-lg bg-primary-600 text-white">Paid Shops</span>
                      <span class="text-[11px] text-slate-500">{{ overview.subscriptionInsights?.paidShops || 0 }} shops</span>
                    </div>
                    <span class="text-[13px] font-bold text-slate-800">{{ overview.subscriptionInsights?.paidShops || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600">Free Shops</span>
                      <span class="text-[11px] text-slate-500">{{ overview.subscriptionInsights?.freePlanShops || 0 }} shops</span>
                    </div>
                    <span class="text-[13px] font-bold text-slate-800">{{ overview.subscriptionInsights?.freePlanShops || 0 }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Backend Health -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="mb-4">
                <h3 class="text-[15px] font-bold text-slate-800">Backend Health</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">System health & usage summary</p>
              </div>
              <!-- Footprint grid -->
              <div class="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-slate-100">
                @for (item of getHealthFootprintCards(); track item.label) {
                  <div class="text-center">
                    <p class="text-[18px] font-black text-slate-800">{{ item.value | number }}</p>
                    <p class="text-[10px] text-slate-400 font-semibold">{{ item.label }}</p>
                  </div>
                }
              </div>
              <!-- Monthly activity -->
              <div class="mb-3">
                <h4 class="text-[12px] font-bold text-slate-600 mb-2">Current Month Activity</h4>
                <div class="grid grid-cols-2 gap-2">
                  @for (item of getMonthlyActivityCards(); track item.label) {
                    <div class="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div class="flex items-center gap-1.5 mb-1">
                        <div class="w-6 h-6 rounded-lg {{ item.iconBg }} flex items-center justify-center">
                          <i [class]="'bi ' + item.icon + ' text-xs'"></i>
                        </div>
                        <span class="text-[10px] font-semibold text-slate-400">{{ item.label }}</span>
                      </div>
                      <p class="text-lg font-black text-slate-800">{{ item.value | number }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- ══ ROW 3 — RECENT SHOPS + PLATFORM GROWTH + QUICK CONTROL ══ -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

            <!-- Recent Shops -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-[15px] font-bold text-slate-800">Recent Shops</h3>
                  <p class="text-[11px] text-slate-400 mt-0.5">Latest registered shops</p>
                </div>
                <a routerLink="/shops"
                  class="text-xs text-primary-600 hover:text-primary-700 font-bold bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-colors">
                  View All
                </a>
              </div>

              <!-- Table header -->
              <div class="grid grid-cols-[1fr_80px_60px] text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 mb-1 px-1">
                <span>SHOP</span>
                <span>REG. DATE</span>
                <span class="text-right">STATUS</span>
              </div>

              <div class="space-y-0.5">
                @for (shop of overview.recentShops || []; track shop.shopName) {
                  <div class="grid grid-cols-[1fr_80px_60px] items-center gap-2 py-2.5 px-1 rounded-xl hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span class="text-xs font-black text-primary-700">{{ shop.shopName.charAt(0) }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[13px] font-bold text-slate-800 truncate">{{ shop.shopName }}</p>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-700 uppercase">{{ shop.subscriptionPlan }}</span>
                      </div>
                    </div>
                    <p class="text-[11px] text-slate-400">{{ shop.createdAt | date:'MMM d, y' }}</p>
                    <div class="text-right">
                      <span [class]="getStatusClass(shop.status)">{{ shop.status | titlecase }}</span>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-10 text-slate-400">
                    <i class="bi bi-shop text-4xl block mb-2 text-slate-200"></i>
                    No shops registered yet
                  </div>
                }
              </div>
            </div>

            <!-- Platform Growth (area chart placeholder) -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-[15px] font-bold text-slate-800">Platform Growth</h3>
                  <p class="text-[11px] text-slate-400 mt-0.5">User & shop growth trend</p>
                </div>
                <span class="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">30D</span>
              </div>

              <!-- Dual sparkline visual mock -->
              <div class="mb-3 flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded-full bg-primary-500 block"></span>
                  <span class="text-[11px] font-semibold text-slate-500">Shops</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded-full bg-primary-300 block"></span>
                  <span class="text-[11px] font-semibold text-slate-500">Users</span>
                </div>
              </div>

              <!-- Stacked sparklines -->
              <div style="height:160px;" class="relative">
                <div class="absolute inset-0">
                  <app-sparkline [data]="shopsGrowthSparkline" color="var(--color-primary)" [width]="320" [height]="160"></app-sparkline>
                </div>
                <div class="absolute inset-0" style="opacity:0.75;">
                  <app-sparkline [data]="usersGrowthSparkline" color="var(--color-primary)" [width]="320" [height]="160"></app-sparkline>
                </div>
              </div>

              <!-- Growth summary pills -->
              <div class="grid grid-cols-2 gap-2 mt-3">
                <div class="p-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
                  <p class="text-[10px] font-bold text-primary-500 mb-0.5">SHOPS</p>
                  <p class="text-xl font-black text-primary-800">{{ overview.cards['totalShops'] || 0 }}</p>
                </div>
                <div class="p-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
                  <p class="text-[10px] font-bold text-primary-500 mb-0.5">USERS</p>
                  <p class="text-xl font-black text-primary-800">{{ overview.cards['totalUsers'] || 0 }}</p>
                </div>
              </div>
            </div>

            <!-- Quick Control -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="mb-4">
                <h3 class="text-[15px] font-bold text-slate-800">Quick Control</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">High-impact admin areas</p>
              </div>
              <div class="space-y-2">
                @for (item of controlLinks; track item.label) {
                  <a [routerLink]="item.route"
                    class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all {{ getQuickLinkBg(item.color) }}">
                      <i [class]="'bi ' + item.icon + ' text-lg'"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-[13px] font-bold text-slate-800">{{ item.label }}</h4>
                      <p class="text-[11px] text-slate-400 truncate">{{ item.description }}</p>
                    </div>
                    <i class="bi bi-chevron-right text-slate-300 group-hover:text-slate-500 transition-colors text-xs shrink-0"></i>
                  </a>
                }
              </div>
            </div>

          </div>
          <!-- ══ ROW — Platform GST Compliance Card ══ -->
          <div class="mt-5">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-[15px] font-bold text-slate-800">Platform GST Compliance</h3>
                  <p class="text-[11px] text-slate-400 mt-0.5">Tax collection status for platform subscriptions</p>
                </div>
                <a routerLink="/settings/gst"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  Manage <i class="bi bi-arrow-right text-xs"></i>
                </a>
              </div>

              <div *ngIf="gstLoading" class="py-4 text-center text-slate-400">
                <span class="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin inline-block"></span>
              </div>

              <div *ngIf="!gstLoading && gstSettings" class="space-y-3">
                <!-- Status + Warning Banner -->
                <div *ngIf="gstSettings.gstStatus !== 'verified'"
                  class="flex items-center gap-3 rounded-xl p-3 text-xs"
                  [ngClass]="{
                    'bg-amber-50 border border-amber-200': gstSettings.gstStatus !== 'failed',
                    'bg-red-50 border border-red-200': gstSettings.gstStatus === 'failed'
                  }">
                  <i class="bi bi-exclamation-triangle-fill"
                    [ngClass]="gstSettings.gstStatus === 'failed' ? 'text-red-500' : 'text-amber-500'"></i>
                  <span [ngClass]="gstSettings.gstStatus === 'failed' ? 'text-red-700' : 'text-amber-700'" class="font-semibold">
                    GST collection disabled — {{ gstStatusLabel(gstSettings.gstStatus) }}
                  </span>
                </div>

                <!-- Grid summary -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div class="bg-slate-50 rounded-xl p-3">
                    <p class="text-[10px] text-slate-500 font-medium mb-1">Status</p>
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      [ngClass]="gstBadgeClass(gstSettings.gstStatus)">
                      <span class="w-1.5 h-1.5 rounded-full inline-block" [ngClass]="gstDotClass(gstSettings.gstStatus)"></span>
                      {{ gstStatusLabel(gstSettings.gstStatus) }}
                    </span>
                  </div>
                  <div class="bg-slate-50 rounded-xl p-3">
                    <p class="text-[10px] text-slate-500 font-medium mb-1">GST Number</p>
                    <p class="text-[11px] font-bold text-slate-800 font-mono">{{ gstSettings.gstNumber || '—' }}</p>
                  </div>
                  <div class="bg-slate-50 rounded-xl p-3">
                    <p class="text-[10px] text-slate-500 font-medium mb-1">Collection</p>
                    <p class="text-[11px] font-bold"
                      [ngClass]="gstSettings.gstCollectionEnabled ? 'text-emerald-600' : 'text-slate-400'">
                      {{ gstSettings.gstCollectionEnabled ? 'Active (' + gstSettings.gstRate + '%)' : 'Disabled' }}
                    </p>
                  </div>
                  <div class="bg-slate-50 rounded-xl p-3">
                    <p class="text-[10px] text-slate-500 font-medium mb-1">Verified On</p>
                    <p class="text-[11px] font-bold text-slate-800">{{ formatGstDate(gstSettings.verifiedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`:host { display: flex; flex-direction: column; flex: 1; }`]
})
export class AdminDashboardComponent {
  private readonly adminApi = inject(AdminApiService);
  overview: AdminOverview | null = null;
  loading = true;
  error: string | null = null;

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

  constructor() {
    this.fetchOverview();
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

  fetchOverview() {
    this.loading = true;
    this.error = null;
    this.adminApi.getOverview().subscribe({
      next: (response) => {
        this.overview = response.data;
        this.loading = false;
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
        this.error = err.error?.message || err.message || 'An unknown error occurred.';
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

  getStatusClass(status: string): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold';
    switch (status?.toLowerCase()) {
      case 'active':    return `${base} bg-primary-50 text-primary-700 border border-primary-200/60`;
      case 'suspended': return `${base} bg-primary-50 text-rose-700 border border-rose-200/60`;
      case 'pending':   return `${base} bg-primary-50 text-amber-700 border border-amber-200/60`;
      default:          return `${base} bg-slate-100 text-slate-500`;
    }
  }

  getPlatformOverviewItems() {
    const c = this.overview?.cards as AdminOverview['cards'] | undefined;
    if (!c) return [];
    return [
      { label: 'Total Shops',     value: c.totalShops     || 0, icon: 'bi-shop',                       iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Network Orders',  value: c.totalOrders    || 0, icon: 'bi-cart-check-fill',             iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Total Users',     value: c.totalUsers     || 0, icon: 'bi-people-fill',                 iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Network Invoices',value: c.totalInvoices  || 0, icon: 'bi-receipt',                     iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Total Products',  value: c.totalProducts  || 0, icon: 'bi-bag-fill',                    iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Active Shops',    value: c.activeShops    || 0, icon: 'bi-check-circle-fill',           iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Suspended',       value: c.suspendedShops || 0, icon: 'bi-exclamation-triangle-fill',   iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Paid Shops',      value: c.paidShops      || 0, icon: 'bi-cash-coin',                   iconBg: 'bg-primary-50 text-primary-600' },
    ];
  }

  getHealthFootprintCards() {
    const f = this.overview?.backendHealth?.collectionFootprint || {};
    return [
      { label: 'Invoices',   value: f['invoices']  || 0 },
      { label: 'Orders',     value: f['orders']    || 0 },
      { label: 'Products',   value: f['products']  || 0 },
      { label: 'Users',      value: f['users']     || 0 },
      { label: 'Staff',      value: f['staff']     || 0 },
      { label: 'Branches',   value: f['branches']  || 0 },
      { label: 'Customers',  value: f['customers'] || 0 },
      { label: 'Inventory',  value: f['inventory'] || 0 },
    ];
  }

  getMonthlyActivityCards() {
    const m = this.overview?.backendHealth?.monthlyActivity || {};
    return [
      { label: 'New Shops', value: m['newShops']  || 0, icon: 'bi-shop',    iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'New Users', value: m['newUsers']  || 0, icon: 'bi-person+', iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Orders',    value: m['orders']    || 0, icon: 'bi-cart',    iconBg: 'bg-primary-50 text-primary-600' },
      { label: 'Invoices',  value: m['invoices']  || 0, icon: 'bi-receipt', iconBg: 'bg-primary-50 text-primary-600' },
    ];
  }
}
