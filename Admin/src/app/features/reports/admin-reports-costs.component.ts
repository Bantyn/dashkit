import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-admin-reports-costs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#f5f7fa]">
      <!-- Header & Tabs -->
      <div class="px-6 pt-6 bg-white border-b border-gray-200 shrink-0">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-1">Platform Reports</h2>
            <p class="text-sm text-gray-500">Analytics and reporting for the entire Clothify platform.</p>
          </div>
          <!-- Export & Actions -->
          <div class="flex items-center gap-3">
            <div *ngIf="report?.generatedAt" class="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700">
              <span class="text-gray-400 mr-2 uppercase">As of:</span>
              <span class="font-bold">{{ report.generatedAt | date:'shortTime' }}</span>
            </div>
            <button (click)="triggerRebuild()" [disabled]="refreshing || loading"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <i class="bi bi-arrow-repeat" [class.animate-spin]="refreshing"></i>
              Refresh
            </button>
            <button (click)="exportCSV()" [disabled]="exporting || detailsLoading" 
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <i class="bi bi-download" *ngIf="!exporting"></i>
              <i class="bi bi-arrow-repeat animate-spin" *ngIf="exporting"></i>
              Export CSV
            </button>
          </div>
        </div>

      </div>

      <div class="flex-1 overflow-auto p-6 space-y-6">
        <!-- Loading -->
        <div *ngIf="loading" class="flex items-center justify-center min-h-[300px]">
          <app-loading-spinner size="lg"></app-loading-spinner>
        </div>

        <!-- Error -->
        <div *ngIf="error && !loading" class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          {{ error }}
        </div>

        <div *ngIf="!loading && report" class="space-y-6 animate-fade-in">
          
          <!-- FinOps Alerts Section -->
          <div *ngIf="report.alerts && report.alerts.length > 0" class="space-y-2">
            <div *ngFor="let alert of report.alerts" 
              [class]="'p-4 rounded-xl border flex items-start gap-3 ' + 
                (alert.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800')">
              <div class="shrink-0">
                <i [class]="'bi ' + (alert.type === 'danger' ? 'bi-exclamation-triangle-fill text-rose-500' : 'bi-info-circle-fill text-amber-500') + ' text-lg'"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-xs font-bold uppercase tracking-wider mb-0.5">FinOps Alert</h4>
                <p class="text-xs">{{ alert.message }}</p>
              </div>
            </div>
          </div>

          <!-- KPI Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Subscription Revenue</p>
              <div class="text-3xl font-extrabold text-slate-800">₹{{ report.summary.monthlyRevenue | number:'1.2-2' }}</div>
              <div class="text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1">
                <i class="bi bi-arrow-up-short text-base leading-none"></i> +8.2% vs last month
              </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Infrastructure Cost</p>
              <div class="text-3xl font-extrabold text-primary-600">₹{{ report.summary.totalInfrastructureCost | number:'1.2-2' }}</div>
              <div class="text-[10px] text-slate-400 font-semibold mt-1">
                Projected month-end: ₹{{ report.summary.projectedMonthEndCost | number:'1.0-0' }}
              </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Operating Margin</p>
              <div class="text-3xl font-extrabold text-slate-800">₹{{ report.summary.grossProfit | number:'1.2-2' }}</div>
              <div class="text-[10px] text-green-600 font-semibold mt-1">
                Net profit margin: {{ report.summary.netMargin }}%
              </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 font-medium">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Burn Details</p>
              <div class="space-y-1.5 mt-2">
                <div class="flex justify-between text-xs text-slate-500">
                  <span>Avg Cost/Shop:</span>
                  <span class="font-bold text-slate-700">₹{{ report.summary.averageCostPerShop | number:'1.0-2' }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                  <span>Avg Cost/Order:</span>
                  <span class="font-bold text-slate-700">₹{{ report.summary.averageCostPerOrder | number:'1.0-2' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lazy Loading Heavy Details -->
          <div *ngIf="detailsLoading" class="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            <app-loading-spinner size="lg" className="mb-3"></app-loading-spinner>
            <p class="text-xs text-slate-500 font-semibold">Compiling detailed infrastructure cost breakdowns...</p>
          </div>

          <ng-container *ngIf="!detailsLoading">
            <!-- Dynamic SVG Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Chart 1: Revenue vs Cost -->
              <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm lg:col-span-2">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="text-sm font-bold text-slate-800">Revenue vs Infrastructure Burn</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5">Historical comparison of subscription earnings vs hosting cost</p>
                  </div>
                  <div class="flex gap-4 text-[10px] font-bold">
                    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-slate-800 rounded-sm"></span> Revenue</span>
                    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-primary-600 rounded-sm"></span> Cost</span>
                  </div>
                </div>
                
                <!-- Custom Pure SVG Chart -->
                <div class="h-60 w-full relative">
                  <svg viewBox="0 0 500 200" width="100%" height="100%" preserveAspectRatio="none">
                    <!-- Grid Lines -->
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" stroke-width="1" />
                    <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" stroke-width="1" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" stroke-width="1" />
                    <line x1="0" y1="170" x2="500" y2="170" stroke="#f1f5f9" stroke-width="1" />
                    
                    <!-- Area/Line Paths -->
                    <!-- Revenue (greenish slate) -->
                    <path [attr.d]="revenuePath" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
                    <!-- Cost (primary) -->
                    <path [attr.d]="costPath" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" />
                    
                    <!-- Data Dots -->
                    <circle *ngFor="let p of revenuePoints" [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#1e293b" class="hover:scale-150 transition-all cursor-pointer" />
                    <circle *ngFor="let p of costPoints" [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#8b5cf6" class="hover:scale-150 transition-all cursor-pointer" />
                  </svg>
                </div>
                <div class="flex justify-between px-2 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Current</span>
                </div>
              </div>

              <!-- Chart 2: Cost Breakdowns -->
              <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                <h3 class="text-sm font-bold text-slate-800 mb-2">Cost Share by Service</h3>
                <p class="text-[10px] text-slate-400 mb-6">Percentage share of total platform infrastructure monthly cost</p>
                
                <div class="flex-1 flex flex-col justify-center space-y-4">
                  <div *ngFor="let item of topShareServices" class="space-y-1">
                    <div class="flex justify-between text-xs">
                      <span class="font-semibold text-slate-700">{{ item.displayName }}</span>
                      <span class="font-bold text-slate-900">{{ item.percentage }}%</span>
                    </div>
                    <div class="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div class="h-full bg-primary-600 rounded-full" [style.width.%]="item.percentage"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Lists & Tenant Analysis Tabs -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h3 class="text-sm font-bold text-slate-800">Top Tenants Resource Consumption</h3>
                <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
                  <button (click)="topListTab = 'cost'" [class]="'px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ' + (topListTab === 'cost' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')">
                    Top Costs
                  </button>
                  <button (click)="topListTab = 'reads'" [class]="'px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ' + (topListTab === 'reads' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')">
                    Top Reads
                  </button>
                  <button (click)="topListTab = 'storage'" [class]="'px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ' + (topListTab === 'storage' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')">
                    Top Storage
                  </button>
                  <button (click)="topListTab = 'api'" [class]="'px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ' + (topListTab === 'api' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')">
                    Top API Calls
                  </button>
                </div>
              </div>

              <div class="p-6">
                <!-- Top Costs List -->
                <div *ngIf="topListTab === 'cost'" class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="text-xs font-bold uppercase text-slate-400 border-b border-slate-100 pb-3">
                        <th class="pb-3">Shop Details</th>
                        <th class="pb-3">Active Plan</th>
                        <th class="pb-3">Monthly Cost</th>
                        <th class="pb-3">Sub Revenue (MRR)</th>
                        <th class="pb-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of report.topLists.mostExpensive" class="border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer" (click)="selectedShop = s">
                        <td class="py-3 font-bold text-slate-800">{{ s.shopName }}</td>
                        <td class="py-3 text-slate-500 font-semibold capitalize">{{ s.planName }}</td>
                        <td class="py-3 font-extrabold text-primary-600">₹{{ s.estimatedTotalCost | number }}</td>
                        <td class="py-3 font-semibold text-slate-700">₹{{ s.subscriptionRevenue | number }}</td>
                        <td class="py-3 text-right font-bold" [class]="s.marginPercent > 0 ? 'text-green-600' : 'text-rose-500'">
                          {{ s.marginPercent }}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Top Reads List -->
                <div *ngIf="topListTab === 'reads'" class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="text-xs font-bold uppercase text-slate-400 border-b border-slate-100 pb-3">
                        <th class="pb-3">Shop Details</th>
                        <th class="pb-3">Firestore Document Reads</th>
                        <th class="pb-3">Estimated Reads Cost</th>
                        <th class="pb-3 text-right">Writes / Deletes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of report.topLists.highestReads" class="border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer" (click)="selectedShop = s">
                        <td class="py-3 font-bold text-slate-800">{{ s.shopName }}</td>
                        <td class="py-3 font-extrabold text-slate-700">{{ s.firestoreReads | number }}</td>
                        <td class="py-3 font-bold text-primary-600">₹{{ s.estimatedFirestoreCost | number }}</td>
                        <td class="py-3 text-right text-slate-400 font-medium">{{ s.firestoreWrites | number }} / {{ s.firestoreDeletes | number }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Top Storage List -->
                <div *ngIf="topListTab === 'storage'" class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="text-xs font-bold uppercase text-slate-400 border-b border-slate-100 pb-3">
                        <th class="pb-3">Shop Details</th>
                        <th class="pb-3">Data Footprint (Storage)</th>
                        <th class="pb-3">Estimated Storage Cost</th>
                        <th class="pb-3 text-right">Network Bandwidth</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of report.topLists.largestStorage" class="border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer" (click)="selectedShop = s">
                        <td class="py-3 font-bold text-slate-800">{{ s.shopName }}</td>
                        <td class="py-3 font-extrabold text-slate-700">{{ s.storageMB | number:'1.2-2' }} MB</td>
                        <td class="py-3 font-bold text-primary-600">₹{{ s.estimatedStorageCost | number }}</td>
                        <td class="py-3 text-right text-slate-400 font-semibold">{{ s.bandwidthBytes / 1024 / 1024 | number:'1.0-0' }} MB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Top API List -->
                <div *ngIf="topListTab === 'api'" class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="text-xs font-bold uppercase text-slate-400 border-b border-slate-100 pb-3">
                        <th class="pb-3">Shop Details</th>
                        <th class="pb-3">API Operations</th>
                        <th class="pb-3">Estimated Infra Cost</th>
                        <th class="pb-3 text-right">Shop Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let s of report.topLists.highestApi" class="border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer" (click)="selectedShop = s">
                        <td class="py-3 font-bold text-slate-800">{{ s.shopName }}</td>
                        <td class="py-3 font-extrabold text-slate-700">{{ s.firestoreReads / 4 | number:'1.0-0' }} reqs</td>
                        <td class="py-3 font-bold text-primary-600">₹{{ s.estimatedTotalCost | number }}</td>
                        <td class="py-3 text-right">
                          <span [class]="'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ' + (s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')">
                            {{ s.status }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Cost Breakdown detailed sheet -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 class="text-sm font-bold text-slate-800 mb-5">Operational Infrastructure Breakdown</h3>
              
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="text-xs font-bold uppercase text-slate-400 border-b border-slate-100 pb-3">
                      <th class="pb-3">Infrastructure Service</th>
                      <th class="pb-3">Pricing Unit</th>
                      <th class="pb-3">Monthly Consumed</th>
                      <th class="pb-3">Free Tier Cap</th>
                      <th class="pb-3">Billable Units</th>
                      <th class="pb-3">Base Unit Rate</th>
                      <th class="pb-3">GST Tax</th>
                      <th class="pb-3 text-right">Total Platform Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let entry of report.serviceBreakdown" class="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                      <td class="py-3 font-bold text-slate-800">{{ entry.displayName }}</td>
                      <td class="py-3 text-slate-400 font-mono text-xs uppercase">{{ entry.unit }}</td>
                      <td class="py-3 font-semibold text-slate-700">{{ entry.unitsConsumed | number:'1.0-4' }}</td>
                      <td class="py-3 text-slate-500 font-medium">{{ entry.freeTierOffset | number }}</td>
                      <td class="py-3 font-bold text-slate-800">{{ entry.billableUnits | number:'1.0-4' }}</td>
                      <td class="py-3 font-semibold text-slate-600">
                        <ng-container *ngIf="entry.unit === 'percentage'; else currencyRate">
                          {{ entry.rate | number:'1.2-4' }}%
                        </ng-container>
                        <ng-template #currencyRate>
                          {{ entry.currency === 'USD' ? '$' : '₹' }}{{ entry.rate | number:'1.2-4' }}
                        </ng-template>
                      </td>
                      <td class="py-3 text-slate-400 font-medium">{{ entry.gstPercent }}%</td>
                      <td class="py-3 text-right font-extrabold text-primary-600">₹{{ entry.totalCost | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </ng-container>

          <!-- Shop Detail Modal -->
          <div *ngIf="selectedShop" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div class="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 class="text-lg font-bold text-slate-800">{{ selectedShop.shopName }}</h3>
                  <p class="text-xs text-slate-500 mt-0.5">Shop Infrastructure Cost Breakdown</p>
                </div>
                <button (click)="selectedShop = null" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="p-6 overflow-y-auto flex-1">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div class="p-3 bg-primary-50 rounded-xl border border-primary-100">
                    <p class="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1">Total Cost</p>
                    <p class="text-xl font-black text-primary-700">₹{{ selectedShop.estimatedTotalCost | number:'1.2-2' }}</p>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sub MRR</p>
                    <p class="text-xl font-black text-slate-700">₹{{ selectedShop.subscriptionRevenue | number:'1.2-2' }}</p>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Margin</p>
                    <p class="text-xl font-black" [class]="selectedShop.marginPercent > 0 ? 'text-green-600' : 'text-rose-500'">{{ selectedShop.marginPercent }}%</p>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plan</p>
                    <p class="text-lg font-black text-slate-700 capitalize truncate">{{ selectedShop.planName || 'Free' }}</p>
                  </div>
                </div>

                <h4 class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Component Breakdown</h4>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><i class="bi bi-database"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Firestore Database</p>
                        <p class="text-[11px] text-slate-500">{{selectedShop.firestoreReads | number}} R / {{selectedShop.firestoreWrites | number}} W / {{selectedShop.firestoreDeletes | number}} D</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ selectedShop.estimatedFirestoreCost | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i class="bi bi-folder2-open"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Cloud Storage</p>
                        <p class="text-[11px] text-slate-500">{{ (selectedShop.storageBytes / 1024 / 1024) | number:'1.0-2' }} MB total stored footprint</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ selectedShop.estimatedStorageCost | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><i class="bi bi-globe"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Network & Bandwidth</p>
                        <p class="text-[11px] text-slate-500">{{ (selectedShop.bandwidthBytes / 1024 / 1024) | number:'1.0-2' }} MB egress transferred</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ selectedShop.estimatedHostingCost | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><i class="bi bi-images"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Cloudinary Media</p>
                        <p class="text-[11px] text-slate-500">Image transformations and delivery</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ selectedShop.estimatedCloudinaryCost | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><i class="bi bi-credit-card"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Payment Gateway</p>
                        <p class="text-[11px] text-slate-500">Razorpay fees for subscription payments</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ selectedShop.estimatedGatewayCharges | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center"><i class="bi bi-envelope"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Messaging & SMS</p>
                        <p class="text-[11px] text-slate-500">Email notifications and SMS triggers</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ ((selectedShop.estimatedEmailCost || 0) + (selectedShop.estimatedSmsCost || 0)) | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><i class="bi bi-cpu"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Cloud Functions & Scheduler</p>
                        <p class="text-[11px] text-slate-500">Backend API operations & cron schedulers</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ ((selectedShop.estimatedFunctionsCost || 0) + (selectedShop.estimatedSchedulerCost || 0)) | number:'1.2-2' }}</span>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><i class="bi bi-shield-check"></i></div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">Phone Authentication</p>
                        <p class="text-[11px] text-slate-500">Secure staff OTP logins</p>
                      </div>
                    </div>
                    <span class="font-extrabold text-slate-700">₹{{ (selectedShop.estimatedPhoneAuthCost || 0) | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminReportsCostsComponent implements OnInit {
  loading = true;
  exporting = false;
  error: string | null = null;
  report: any = null;
  topListTab = 'cost';
  selectedShop: any = null;
  detailsLoading = true;
  refreshing = false;

  // SVG drawing properties
  revenuePath = '';
  costPath = '';
  revenuePoints: Array<{ x: number; y: number }> = [];
  costPoints: Array<{ x: number; y: number }> = [];
  topShareServices: Array<{ displayName: string; percentage: number }> = [];

  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  ngOnInit() {
    this.fetchCostReport();
  }

  fetchCostReport() {
    this.loading = true;
    this.detailsLoading = true;

    // Load light summary data first (Phase 9 lazy loading)
    this.api.getPlatformCostsReport(undefined, undefined, 'summary').subscribe({
      next: (res) => {
        this.report = res.data;
        this.loading = false;
        
        // Lazy-load detailed sections in the background
        this.fetchCostReportDetails();
      },
      error: (err) => {
        this.error = 'Failed to compile infrastructure cost report data.';
        this.loading = false;
      }
    });
  }

  fetchCostReportDetails() {
    this.api.getPlatformCostsReport().subscribe({
      next: (res) => {
        // Merge detail elements into report
        this.report = {
          ...this.report,
          ...res.data
        };
        this.detailsLoading = false;
        this.buildChartPaths();
        this.calculateCostShares();
      },
      error: (err) => {
        this.toast.showError('Failed to load cost breakdown details.');
        this.detailsLoading = false;
      }
    });
  }

  triggerRebuild() {
    this.refreshing = true;
    this.api.refreshPlatformCostsReport().subscribe({
      next: () => {
        this.toast.showSuccess('Snapshot recalculation triggered in background. Reloading report in a moment...');
        setTimeout(() => {
          this.refreshing = false;
          this.fetchCostReport();
        }, 3000);
      },
      error: () => {
        this.toast.showError('Failed to trigger background recalculation.');
        this.refreshing = false;
      }
    });
  }

  buildChartPaths() {
    if (!this.report || !this.report.monthlySparks) return;

    const revenues: number[] = this.report.monthlySparks.revenue || [1000, 1000, 1000, 1000, 1000, 1000, 1000];
    const costs: number[] = this.report.monthlySparks.costs || [100, 100, 100, 100, 100, 100, 100];

    const maxVal = Math.max(...revenues, ...costs, 1000);
    const width = 500;
    const height = 200;
    const padding = 15;
    const usableHeight = height - padding * 2;
    const xStep = width / (revenues.length - 1);

    const getPoints = (data: number[]) => {
      return data.map((val, i) => {
        const x = i * xStep;
        // SVG y grows downwards, so we subtract from height
        const y = height - padding - (val / maxVal) * usableHeight;
        return { x, y };
      });
    };

    const getPathString = (pts: Array<{ x: number; y: number }>) => {
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        path += ` C ${midX},${pts[i].y} ${midX},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
      }
      return path;
    };

    this.revenuePoints = getPoints(revenues);
    this.costPoints = getPoints(costs);

    this.revenuePath = getPathString(this.revenuePoints);
    this.costPath = getPathString(this.costPoints);
  }

  calculateCostShares() {
    if (!this.report || !this.report.serviceBreakdown) return;

    const total = this.report.summary.totalInfrastructureCost || 1;
    const mapped = this.report.serviceBreakdown.map((item: any) => ({
      displayName: item.displayName,
      percentage: Number(((item.totalCost / total) * 100).toFixed(1))
    }));

    // Filter out zero-share items and sort
    this.topShareServices = mapped
      .filter((s: any) => s.percentage > 0.5)
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 5);
  }

  exportCSV() {
    this.exporting = true;
    this.api.exportPlatformCostsReport().subscribe({
      next: (csvText) => {
        this.exporting = false;
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `platform_infra_cost_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.toast.showSuccess('Report exported successfully.');
      },
      error: (err) => {
        this.exporting = false;
        this.toast.showError('CSV export failed.');
      }
    });
  }
}
