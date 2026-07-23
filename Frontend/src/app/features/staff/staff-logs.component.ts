import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest, of } from 'rxjs';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { StaffService } from '../../core/services/staff.service';

interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  details: string;
  timestamp: any;
  type: 'sale' | 'inventory' | 'staff' | 'setting';
}

@Component({
  selector: 'app-staff-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Activity Feed -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Activity Logs</h2>
          <div class="flex items-center gap-2">
             <button class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all" title="Filter">
              <i class="bi bi-funnel text-sm"></i>
            </button>
            <button (click)="loadLogs()" class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all" title="Refresh">
              <i class="bi bi-arrow-repeat text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="p-4 flex gap-4 bg-white shrink-0">
           <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by action or details..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all"
            />
          </div>
          <select
            [(ngModel)]="selectedType"
            class="px-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm outline-none transition-all font-medium text-gray-600"
          >
            <option value="">All Types</option>
            <option value="sale">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="staff">Staff</option>
            <option value="setting">Settings</option>
          </select>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th class="px-6 py-4">Time</th>
                  <th class="px-6 py-4">Staff Member</th>
                  <th class="px-6 py-4">Action</th>
                  <th class="px-6 py-4">Module</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @if (loading) {
                  <tr>
                    <td colspan="4" class="px-6 py-20 text-center">
                      <app-ui-loading size="md"></app-ui-loading>
                    </td>
                  </tr>
                } @else if (filteredLogs.length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-20 text-center text-gray-400">
                      No logs found for the selected criteria.
                    </td>
                  </tr>
                } @else {
                  @for (log of filteredLogs; track log.id) {
                    <tr 
                      (click)="selectLog(log)"
                      class="cursor-pointer transition-all hover:bg-blue-50/30 group border-l-4 border-transparent"
                      [class.bg-blue-50]="selectedLog?.id === log.id"
                      [class.border-l-primary-500]="selectedLog?.id === log.id"
                    >
                      <td class="px-6 py-4 text-[10px] font-bold text-gray-500">
                        {{ log.timestamp | date:'shortTime' }}<br>
                        <span class="font-normal text-[9px]">{{ log.timestamp | date:'dd MMM' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                           <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-100 group-hover:bg-white transition-all">
                             {{ (log.staffName || 'Sys').charAt(0) }}
                           </div>
                           <span class="text-xs font-bold text-gray-900 uppercase tracking-tighter">{{ log.staffName || 'System' }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-xs font-bold text-gray-700">{{ log.action }}</div>
                        <div class="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">{{ log.details }}</div>
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ' + getBadgeClass(log.type)">
                          {{ log.type }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Log Details -->
      <div
        class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col overflow-y-auto"
        *ngIf="selectedLog"
      >
        <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0">
          <div>
            <h3 class="text-lg font-bold text-gray-900 uppercase">Event Inspection</h3>
            <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Transaction #{{ selectedLog.id.slice(-8) }}</p>
          </div>
          <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <i class="bi bi-braces text-lg"></i>
          </button>
        </div>

        <div class="p-6">
           <div class="flex items-center gap-4 mb-10">
              <div [class]="'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ' + getIconBgClass(selectedLog.type)">
                <i [class]="'bi ' + getLogIcon(selectedLog.type)"></i>
              </div>
              <div>
                <div class="text-base font-black text-gray-900">{{ selectedLog.action }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ selectedLog.details }}</div>
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{{ selectedLog.timestamp | date:'longDate' }} • {{ selectedLog.timestamp | date:'mediumTime' }}</div>
              </div>
           </div>

           <div class="space-y-8">
              <div>
                 <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Operator Reference</h4>
                 <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-black text-sm border-2 border-white shadow-sm">
                       {{ (selectedLog.staffName || 'S').charAt(0) }}
                    </div>
                    <div>
                       <div class="text-sm font-bold text-gray-900">{{ selectedLog.staffName || 'System Automator' }}</div>
                       <div class="text-[10px] text-gray-500 font-medium">Privileged Access Session</div>
                    </div>
                 </div>
              </div>

              <div>
                 <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Deployment JSON</h4>
                 <div class="p-5 bg-gray-900 rounded-2xl text-green-400 font-mono text-[11px] overflow-x-auto shadow-2xl">
                    <div class="opacity-50 font-sans text-[9px] mb-2 uppercase tracking-widest text-white">Raw Source Payload</div>
                    <pre class="whitespace-pre-wrap">{{ formatRawJson(selectedLog) }}</pre>
                 </div>
              </div>
           </div>
        </div>
      </div>

       <!-- Empty State -->
       <div
        *ngIf="!selectedLog && !loading"
        class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8"
      >
        <div class="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100">
          <i class="bi bi-clock-history text-3xl text-gray-300"></i>
        </div>
        <h3 class="text-gray-900 font-bold mb-2">Audit History</h3>
        <p class="text-gray-400 text-sm max-w-[220px]">Pick an entry from the activity feed to inspect the technical payload and performer details.</p>
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
export class StaffLogsComponent implements OnInit {
  logs: ActivityLog[] = [];
  loading = true;
  searchQuery = '';
  selectedType = '';
  selectedLog: ActivityLog | null = null;
  shopId = '';
  staffIdFilter = '';
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private staffService: StaffService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    combineLatest([
      this.route.parent?.paramMap || of(null),
      this.route.queryParams
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([params, queryParams]) => {
      const newShopId = params?.get('shopId') || '';
      const newStaffId = queryParams['staffId'] || '';
      
      if (newShopId && (newShopId !== this.shopId || newStaffId !== this.staffIdFilter)) {
        this.shopId = newShopId;
        this.staffIdFilter = newStaffId;
        this.loadLogs();
      }
    });
  }

  loadLogs() {
    if (!this.shopId) return;

    this.loading = true;
    this.cdr.detectChanges();

    this.staffService.getStaffLogs(this.shopId, this.staffIdFilter).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.logs = (res.data || []).map(log => ({
            ...log,
            timestamp: this.convertToDate(log.timestamp)
          }));
          this.loading = false;

          if (this.selectedLog) {
            this.selectedLog = this.logs.find((log) => log.id === this.selectedLog?.id) || null;
          }

          if (this.logs.length > 0 && window.innerWidth >= 768 && !this.selectedLog) {
            this.selectedLog = this.logs[0];
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading logs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private convertToDate(ts: any): Date | null {
    if (!ts) return null;
    
    // Handle Firestore Timestamp { _seconds, _nanoseconds }
    if (ts._seconds !== undefined) {
      return new Date(ts._seconds * 1000);
    }
    
    // Handle Firestore Timestamp { seconds, nanoseconds }
    if (ts.seconds !== undefined) {
      return new Date(ts.seconds * 1000);
    }

    // Handle string or number
    const date = new Date(ts);
    return isNaN(date.getTime()) ? null : date;
  }

  formatRawJson(log: any): string {
    return JSON.stringify({
      ...log,
      timestamp: log.timestamp ? log.timestamp.toISOString() : null
    }, null, 2);
  }

  get filteredLogs() {
    let list = this.logs;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(l => (l.staffName?.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q)));
    }
    if (this.selectedType) {
      list = list.filter(l => l.type === this.selectedType);
    }
    return list;
  }

  selectLog(log: ActivityLog) {
    this.selectedLog = log;
    this.cdr.detectChanges();
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'sale': return 'bg-green-50 text-green-600';
      case 'inventory': return 'bg-blue-50 text-blue-600';
      case 'staff': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-500';
    }
  }

  getIconBgClass(type: string): string {
    switch (type) {
      case 'sale': return 'bg-green-50 text-green-600';
      case 'inventory': return 'bg-blue-50 text-blue-600';
      case 'staff': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  }

  getLogIcon(type: string): string {
    switch (type) {
      case 'sale': return 'bi-cart-check';
      case 'inventory': return 'bi-box-seam';
      case 'staff': return 'bi-person-badge';
      default: return 'bi-gear';
    }
  }
}
