import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StaffService, Staff } from '../../core/services/staff.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { AreaChartComponent } from '../../shared/components/ui/area-chart.component';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-staff-performance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiLoadingComponent, AreaChartComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Performance Ranking -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Performance Leaderboard</h2>
          <div class="flex items-center gap-2">
             <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sort By:</span>
             <select class="text-xs font-bold text-gray-600 bg-gray-100 border-none rounded-lg px-2 py-1 outline-none">
                <option>Total Sales</option>
                <option>Efficiency</option>
                <option>Attendance</option>
             </select>
          </div>
        </div>

        <!-- Search -->
        <div class="p-4 bg-white shrink-0">
           <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Filter by name..."
              class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="space-y-3">
             @if (loading) {
               <div class="py-20 text-center">
                 <app-ui-loading size="md"></app-ui-loading>
               </div>
             } @else {
               @for (staff of filteredStaff; track staff.id; let i = $index) {
                 <div 
                   (click)="selectStaff(staff)"
                   class="p-4 bg-white rounded-xl border border-gray-100 shadow-sm transition-all cursor-pointer hover:shadow-md group"
                   [class.ring-2]="selectedStaff?.id === staff.id"
                   [class.ring-primary-500]="selectedStaff?.id === staff.id"
                 >
                   <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 text-lg">
                        #{{ i + 1 }}
                      </div>
                      <div class="flex-1">
                         <div class="flex justify-between items-start">
                            <div class="text-sm font-bold text-gray-900">{{ staff.fullName }}</div>
                            <div class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full" *ngIf="i < 3">Top Performer</div>
                         </div>
                         <div class="flex items-center gap-3 mt-1">
                            <div class="text-[10px] text-gray-500">Sales: <span class="font-bold text-gray-900">₹{{ (staff.totalSales || 0) | number }}</span></div>
                            <div class="w-1 h-1 rounded-full bg-gray-300"></div>
                            <div class="text-[10px] text-gray-500">Efficiency: <span class="font-bold text-gray-900">{{ staff.efficiency || 0 }}%</span></div>
                         </div>
                      </div>
                      <div class="p-2 text-gray-300 group-hover:text-primary-500 transition-colors">
                         <i class="bi bi-chevron-right"></i>
                      </div>
                   </div>
                 </div>
               }
             }
          </div>
        </div>
      </div>

      <!-- Right Panel: Deep Analytics -->
      <div
        class="w-[40%] min-w-[450px] bg-white border-l border-gray-200 flex flex-col overflow-y-auto"
        *ngIf="selectedStaff"
      >
        <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Staff Insight</h3>
            <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">{{ selectedStaff.fullName }}</p>
          </div>
          <div class="flex items-center gap-2">
             <button class="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-100 transition-colors">
               Last 30 Days
             </button>
          </div>
        </div>

        <div class="p-6">
           <!-- Key Metrics -->
           <div class="grid grid-cols-2 gap-4 mb-8" *ngIf="staffStats">
              <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                 <div class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Orders Count</div>
                 <div class="text-2xl font-black text-blue-600 mt-1">{{ staffStats.totalInvoices }}</div>
                 <div class="text-[9px] text-blue-400 mt-1">Total invoices generated</div>
              </div>
              <div class="p-4 bg-green-50 rounded-2xl border border-green-100">
                 <div class="text-[10px] font-bold text-green-400 uppercase tracking-widest">Avg Transaction</div>
                 <div class="text-2xl font-black text-green-600 mt-1">₹{{ (staffStats.totalInvoices > 0 ? staffStats.totalRevenue / staffStats.totalInvoices : 0) | number }}</div>
                 <div class="text-[9px] text-green-400 mt-1">Based on recent activity</div>
              </div>
           </div>
           
           <div *ngIf="statsLoading" class="py-10 text-center">
               <app-ui-loading size="sm"></app-ui-loading>
           </div>

           <!-- Performance Chart -->
           <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Sales Trend (Week over Week)</h4>
           <div class="h-56 mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2">
              <app-area-chart 
                [data]="performanceData" 
                xKey="week"
                [yKeys]="['sales']" 
                [colors]="['#8b5cf6']"
              ></app-area-chart>
           </div>

           <!-- Individual Targets -->
           <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Target Progress</h4>
           <div class="space-y-6">
              <div *ngIf="staffStats">
                 <div class="flex justify-between text-[11px] font-bold text-gray-700 mb-2">
                    <span>Monthly Sales Target</span>
                    <span>₹{{ staffStats.totalRevenue | number }} / ₹1,00,000</span>
                 </div>
                 <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-600 rounded-full" [style.width.%]="(staffStats.totalRevenue / 100000) * 100"></div>
                 </div>
              </div>

              <div class="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                 <i class="bi bi-lightning-charge-fill text-orange-500"></i>
                 <div>
                    <div class="text-xs font-bold text-orange-700">Performance Alert</div>
                    <div class="text-[10px] text-orange-600 mt-0.5 italic">Order processing time has increased by 12% this week. Suggested focus on checkout speed.</div>
                 </div>
              </div>
           </div>

           <button class="w-full mt-10 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all text-xs font-bold uppercase tracking-wider">
             Review Monthly Appraisal
           </button>
        </div>
      </div>

       <!-- Empty State -->
       <div
        *ngIf="!selectedStaff"
        class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[450px] bg-white border-l border-gray-200 text-center p-8"
      >
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <i class="bi bi-activity text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-gray-900 font-medium mb-1">Select a member</h3>
        <p class="text-gray-500 text-sm">Pick a staff member from the ranking to see deep performance insights.</p>
      </div>
    </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 3px;
      }
    </style>
  `,
})
export class StaffPerformanceComponent implements OnInit {
  staffList: Staff[] = [];
  loading = true;
  shopId = '';
  searchQuery = '';
  selectedStaff: Staff | null = null;
  staffStats: any = null;
  performanceData: any[] = [];
  statsLoading = false;
  private readonly destroyRef = inject(DestroyRef);
  private lastStatsStaffId = '';

  constructor(
    private staffService: StaffService,
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const shopId = params.get('shopId') || '';
      if (!shopId || shopId === this.shopId) {
        return;
      }

      this.shopId = shopId;
      this.loadData();
    });
  }

  loadData() {
    if (!this.shopId) {
      return;
    }

    this.lastStatsStaffId = '';
    this.staffStats = null;
    this.selectedStaff = null;
    this.loading = true;
    this.analyticsService.getStaffLeaderboard(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.staffList = res.data;
      this.loading = false;
      if (this.staffList.length > 0 && window.innerWidth >= 768) {
        const selected = this.selectedStaff
          ? this.staffList.find((staff) => staff.id === this.selectedStaff?.id) || this.staffList[0]
          : this.staffList[0];
        this.selectStaff(selected);
      }
    });
  }

  selectStaff(staff: Staff) {
    if (this.selectedStaff?.id === staff.id && this.staffStats) {
      return;
    }

    this.selectedStaff = staff;
    this.fetchStaffStats(staff.id);
  }

  fetchStaffStats(staffId: string) {
    if (!this.shopId || this.lastStatsStaffId === staffId) {
      return;
    }

    this.lastStatsStaffId = staffId;
    this.statsLoading = true;
    this.analyticsService.getDashboardStats(this.shopId, staffId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.staffStats = res.data.stats;
      // Map chart data
      if (res.data.salesChartData) {
        this.performanceData = res.data.salesChartData.map((d: any) => ({
          week: d.date.split('-').slice(1).join('/'), // Simpler date format
          sales: d.value
        }));
      }
      this.statsLoading = false;
    });
  }

  get filteredStaff() {
    if (!this.searchQuery) return this.staffList;
    const q = this.searchQuery.toLowerCase();
    return this.staffList.filter(s => s.fullName.toLowerCase().includes(q));
  }
}
