import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, DestroyRef, inject, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { StaffService, Staff, StaffPermissions } from '../../core/services/staff.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, UiLoadingComponent],
  template: `
    <div class="flex-1 flex flex-col h-full bg-white" *ngIf="staff; else loadingState">
      <!-- Detail Header -->
      <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0">
        <div>
          <h3 class="text-lg font-bold text-gray-900">
            Staff Profile
          </h3>
          <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">
            Joined on {{ staff.joiningDate | date: 'mediumDate' }}
          </p>
        </div>
        <div class="flex items-center gap-1 no-print">
          <button
            (click)="onEdit.emit(staff.id)"
            class="p-2 text-gray-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Profile"
          >
            <i class="bi bi-pencil text-lg"></i>
          </button>
          <button
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Staff"
            (click)="onDeleteStaff()"
          >
            <i class="bi bi-trash text-lg"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <!-- Profile Section -->
        <div class="flex items-center gap-4 mb-8">
          <div
            class="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl shadow-sm border-2 border-white"
          >
            {{ staff.fullName.charAt(0) }}
          </div>
          <div>
            <div class="text-xl font-bold text-gray-900">
              {{ staff.fullName }}
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">{{ staff.role }}</span>
              <span class="text-gray-300">•</span>
              <span class="text-xs text-gray-500 font-medium">{{ staff.branch }}</span>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div class="flex items-center gap-3">
            <i class="bi bi-telephone text-gray-400"></i>
            <span class="text-sm text-gray-700 font-medium">{{ staff.phoneNumber }}</span>
          </div>
          <div class="flex items-center gap-3">
            <i class="bi bi-envelope text-gray-400"></i>
            <span class="text-sm text-gray-700 font-medium">{{ staff.email }}</span>
          </div>
        </div>

        <!-- Permissions Section -->
        <div class="mb-8" *ngIf="staff.permissions">
            <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              Access & Permissions
            </h4>
            <div class="space-y-2">
                <div *ngFor="let module of modules" class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                   <span class="text-xs font-bold text-gray-700 uppercase">{{ module }}</span>
                   <div class="flex items-center gap-2">
                      <span *ngIf="getModulePermission(module)?.view" class="w-2 h-2 rounded-full bg-green-500" title="View Permission"></span>
                      <span *ngIf="getModulePermission(module)?.create" class="w-2 h-2 rounded-full bg-blue-500" title="Create Permission"></span>
                      <span *ngIf="getModulePermission(module)?.edit" class="w-2 h-2 rounded-full bg-orange-500" title="Edit Permission"></span>
                      <span *ngIf="getModulePermission(module)?.delete" class="w-2 h-2 rounded-full bg-red-500" title="Delete Permission"></span>
                      <span *ngIf="!getModulePermission(module)" class="text-[10px] text-gray-400 italic">No access</span>
                   </div>
                </div>
            </div>
        </div>

        <!-- Stats Section -->
        <div class="mb-8">
          <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
            Performance Stats
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div class="text-xs font-bold text-blue-400 uppercase tracking-tighter">Total Sales</div>
              <div class="text-lg font-black text-blue-600 mt-1">₹{{ (staff.totalSales || 0) | number }}</div>
            </div>
            <div class="p-4 bg-green-50 rounded-2xl border border-green-100">
              <div class="text-xs font-bold text-green-400 uppercase tracking-tighter">Commission</div>
              <div class="text-lg font-black text-green-600 mt-1">₹{{ (staff.commissionEarned || 0) | number }}</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity Section -->
        <div>
          <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
            Recent Activity
          </h4>
          <div class="space-y-4">
             <div *ngIf="logs.length === 0" class="text-center py-4 text-xs text-gray-400">No activity logged yet.</div>
             <div *ngFor="let log of logs.slice(0, 3)" class="flex gap-3 items-start group">
                <div class="w-1 h-8 rounded-full bg-primary-500 mt-1"></div>
                <div class="flex-1">
                   <div class="flex justify-between items-start">
                      <div class="text-sm font-bold text-gray-900">{{ log.action }}</div>
                       <span class="text-[9px] font-bold text-gray-400 uppercase">{{ getLogTime(log.timestamp) }}</span>
                   </div>
                   <div class="text-xs text-gray-500 mt-0.5 italic truncate">{{ log.details }}</div>
                </div>
             </div>
          </div>
          
          <button 
            [routerLink]="['/', shopId, 'staff', 'logs']" 
            [queryParams]="{ staffId: staff.id }"
            class="w-full mt-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all text-xs font-bold uppercase tracking-wider"
          >
            Full Activity Log
          </button>
        </div>
      </div>
    </div>

    <ng-template #loadingState>
      <div class="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <app-ui-loading size="md"></app-ui-loading>
        <p class="text-gray-400 text-sm mt-4 font-medium">Fetching profile details...</p>
      </div>
    </ng-template>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #f1f1f1;
        border-radius: 10px;
      }
    </style>
  `
})
export class StaffProfileComponent implements OnInit, OnChanges {
  @Input() staffId: string = '';
  @Output() onEdit = new EventEmitter<string>();
  @Output() onDeleted = new EventEmitter<void>();
  
  staff: Staff | null = null;
  loading = true;
  shopId = '';
  logs: any[] = [];
  modules: ('invoices' | 'products' | 'inventory' | 'customers' | 'staff')[] = [
    'invoices',
    'products',
    'inventory',
    'customers',
    'staff',
  ];
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmationService = inject(ConfirmationService);
  private lastLogsKey = '';

  constructor(
    private staffService: StaffService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.shopId = params.get('shopId') || '';
      if (this.staffId) {
        this.loadLogs();
      }
    });
    if (this.staffId) {
      this.refreshProfile();
    }
  }

  getModulePermission(module: string): any {
    return (this.staff?.permissions as any)?.[module];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['staffId'] && !changes['staffId'].firstChange) {
      this.refreshProfile();
    }
  }

  private refreshProfile() {
    this.lastLogsKey = '';
    this.loadStaff();
    this.loadLogs();
  }

  loadStaff() {
    if (!this.staffId) {
      return;
    }

    this.loading = true;
    this.staffService.getStaffById(this.staffId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.ngZone.run(() => {
        this.staff = res.data;
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  loadLogs() {
     if (!this.shopId || !this.staffId) return;
     const logsKey = `${this.shopId}:${this.staffId}`;
     if (logsKey === this.lastLogsKey) {
       return;
     }

     this.lastLogsKey = logsKey;
     this.staffService.getStaffLogs(this.shopId, this.staffId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
        this.ngZone.run(() => {
          this.logs = (res.data || []).map(log => ({
            ...log,
            timestamp: this.convertToDate(log.timestamp)
          }));
          this.cdr.detectChanges();
        });
     });
  }

  getLogTime(ts: any): string {
    if (!ts) return '';
    const date = ts instanceof Date ? ts : this.convertToDate(ts);
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  }

  private convertToDate(ts: any): Date | null {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (ts._seconds !== undefined) return new Date(ts._seconds * 1000);
    if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
    const date = new Date(ts);
    return isNaN(date.getTime()) ? null : date;
  }

  async onDeleteStaff() {
     const confirmed = await this.confirmationService.confirm({
       title: 'Remove Staff Member?',
       description: 'Are you sure you want to remove this staff member?',
       type: 'danger',
       primaryButtonText: 'Remove',
       secondaryButtonText: 'Cancel'
     });

     if (confirmed) {
        this.staffService.deleteStaff(this.staffId, this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
           this.onDeleted.emit();
        });
     }
  }
}
