import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest, of } from 'rxjs';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { StaffService } from '../../../core/services/staff.service';

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
  selector: 'app-staff-activity',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiLoadingComponent, UiDropdownComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Dashboard / List Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <h2 class="text-xl font-bold text-gray-900">Audit Trail</h2>
          <div class="flex items-center gap-2">
             <button
               class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
               title="Filter"
             >
               <i class="bi bi-funnel text-sm"></i>
             </button>
             <button
                 (click)="loadLogs()"
                 class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
               title="Refresh"
             >
                 <i class="bi bi-arrow-repeat text-sm"></i>
             </button>
             <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
               {{ filteredLogs.length }} events
             </span>
          </div>
        </div>

        <!-- Detail Header (if selected) -->
        <div 
          *ngIf="selectedLog"
          class="w-[30%] min-w-[350px] px-6 py-5 border-l border-gray-200 flex justify-between items-start shrink-0 bg-white"
        >
          <div>
             <h3 class="text-lg font-bold text-gray-900 uppercase">Event Inspection</h3>
             <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Transaction #{{ selectedLog.id.slice(-8) }}</p>
          </div>
          <div class="flex items-center gap-1">
             <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
               <i class="bi bi-braces text-lg"></i>
             </button>
            <button
              (click)="closeDetail()"
              class="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          <!-- Search & Filter -->
          <div class="p-4 flex gap-4 bg-white border-b border-gray-100 shrink-0">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by action or details..."
                class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
              />
            </div>
            
            <div class="relative w-40 z-20">
               <app-ui-dropdown
                 [options]="typeFilterOptions"
                 [(ngModel)]="selectedType"
                 placeholder="All Modules"
               ></app-ui-dropdown>
            </div>
          </div>

          <!-- Table Content -->
          <div class="flex-1 overflow-auto custom-scrollbar p-4">
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 sticky top-0 z-10">
                  <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th class="px-6 py-3">Timestamp</th>
                    <th class="px-6 py-3">User</th>
                    <th class="px-6 py-3">Action</th>
                    <th class="px-6 py-3">Description</th>
                    <th class="px-6 py-3">Module</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @if (loading) {
                    <tr>
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center gap-4">
                          <app-ui-loading size="md"></app-ui-loading>
                          <span>Loading audit logs...</span>
                        </div>
                      </td>
                    </tr>
                  } @else if (error) {
                    <tr>
                      <td colspan="5" class="p-6">
                        <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                          {{ error }}
                        </div>
                      </td>
                    </tr>
                  } @else if (filteredLogs.length === 0) {
                    <tr>
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                         <div class="flex flex-col items-center justify-center gap-3">
                           <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                             <i class="bi bi-inbox text-xl"></i>
                           </div>
                           <span>No audit logs found.</span>
                         </div>
                      </td>
                    </tr>
                  } @else {
                    @for (log of filteredLogs; track log.id) {
                      <tr
                        (click)="selectLog(log)"
                        class="cursor-pointer transition-colors hover:bg-gray-50 group border-l-2 border-transparent"
                        [class.bg-blue-50]="selectedLog?.id === log.id"
                        [class.border-l-primary-500]="selectedLog?.id === log.id"
                      >
                        <td class="px-6 py-4">
                          <div class="text-sm text-gray-900 group-hover:text-primary-600 font-medium">
                            {{ log.timestamp | date:'shortTime' }}
                          </div>
                          <div class="text-[10px] text-gray-400 mt-0.5 font-medium">
                            {{ log.timestamp | date:'dd MMM, yyyy' }}
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200">
                               {{ (log.staffName || 'S').charAt(0) }}
                             </div>
                             <span class="text-xs font-bold text-gray-900 uppercase tracking-tight">{{ log.staffName || 'System' }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-4">
                           <div class="text-sm font-medium text-gray-900">{{ log.action }}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                           <div class="truncate max-w-[250px]">{{ log.details }}</div>
                        </td>
                        <td class="px-6 py-4">
                           <span [class]="'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ' + getBadgeClass(log.type)">
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

        <!-- Right Panel Content -->
        <div
          class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
          *ngIf="selectedLog"
        >
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
             <!-- Action Header -->
             <div class="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                <div [class]="'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ' + getIconBgClass(selectedLog.type)">
                  <i [class]="'bi ' + getLogIcon(selectedLog.type)"></i>
                </div>
                <div>
                  <div class="text-base font-black text-gray-900">{{ selectedLog.action }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ selectedLog.details }}</div>
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{{ selectedLog.timestamp | date:'longDate' }} • {{ selectedLog.timestamp | date:'mediumTime' }}</div>
                </div>
             </div>

             <!-- Operator Reference -->
             <div class="mb-8">
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

             <!-- JSON Payload -->
             <div>
                <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Deployment JSON</h4>
                <div class="p-5 bg-gray-900 rounded-2xl text-green-400 font-mono text-[11px] overflow-x-auto shadow-2xl">
                   <div class="opacity-50 font-sans text-[9px] mb-2 uppercase tracking-widest text-white">Raw Source Payload</div>
                   <pre class="whitespace-pre-wrap">{{ formatRawJson(selectedLog) }}</pre>
                </div>
             </div>
          </div>
        </div>

        <!-- Empty State Content -->
        <div
          *ngIf="!selectedLog && !loading && !error"
          class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8 h-full"
        >
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <i class="bi bi-clock-history text-3xl text-gray-300"></i>
          </div>
          <h3 class="text-gray-900 font-bold mb-2">Audit History</h3>
          <p class="text-gray-500 text-sm max-w-[220px]">Select an event from the list to view its technical payload and details.</p>
        </div>
      </div>
    </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d1d5db;
      }
    </style>
  `,
})
export class StaffActivity implements OnInit {
  logs: ActivityLog[] = [];
  loading = true;
  error: string | null = null;
  searchQuery = '';
  selectedType = '';
  selectedLog: ActivityLog | null = null;
  shopId = '';
  staffIdFilter = '';
  private readonly destroyRef = inject(DestroyRef);

  typeFilterOptions = [
    { label: 'All Modules', value: '' },
    { label: 'Sales', value: 'sale' },
    { label: 'Inventory', value: 'inventory' },
    { label: 'Staff', value: 'staff' },
    { label: 'Settings', value: 'setting' },
  ];

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
    this.error = null;
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
        this.error = 'Failed to load audit logs.';
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

  closeDetail() {
    this.selectedLog = null;
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'sale': return 'bg-green-100 text-green-700';
      case 'inventory': return 'bg-blue-100 text-blue-700';
      case 'staff': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
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
