import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BranchService, Branch, BranchActivityItem, BranchSummary } from '../../core/services/branch.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ShopContextService } from '../../core/services/shop-context.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-branch-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, UiLoadingComponent],
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `],
  template: `
    <div class="flex flex-col h-full bg-white" *ngIf="branch; else loadingState">

      <!-- Detail Header -->
      <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Branch Details</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="onEdit.emit(branch.id)"
            class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Branch"
          >
            <i class="bi bi-pencil text-sm"></i>
          </button>
          <button
            (click)="onDeleteBranch()"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Branch"
          >
            <i class="bi bi-trash3 text-sm"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-6">

        <!-- Branch Info Card -->
        <div class="flex items-center gap-4 mb-8 p-4 bg-white border border-gray-100 shadow-sm rounded-xl text-center flex-col">
          <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl mx-auto shadow-inner">
            {{ branch.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="text-xl font-bold text-gray-900">{{ branch.name }}</div>
            <div class="flex items-center justify-center gap-2 mt-2">
              <span [class]="'px-2 py-1 rounded text-xs font-medium ' + (branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                {{ branch.status }}
              </span>
              <span class="text-xs text-gray-400">#{{ branch.id.slice(-6).toUpperCase() }}</span>
            </div>
          </div>
          <!-- Stats Row -->
          <div class="flex w-full mt-2 border-t border-gray-100 pt-4 divide-x divide-gray-100">
            <div class="flex-1">
              <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Sales</div>
              <div class="text-lg font-bold text-primary-600">₹{{ (summaryMetrics?.sales || 0) | number }}</div>
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Invoices</div>
              <div class="text-lg font-bold text-gray-900">{{ (summaryMetrics?.orders || 0) | number }}</div>
            </div>
          </div>
        </div>

        <!-- Branch Info Details -->
        <div class="mb-6 space-y-3">
          <div class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i class="bi bi-info-circle"></i> Contact & Location
          </div>

          <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <i class="bi bi-geo-alt-fill text-sm text-orange-500 mt-0.5 shrink-0"></i>
            <div class="text-sm text-gray-700 leading-relaxed">{{ branch.address || 'No address set' }}</div>
          </div>

          <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <i class="bi bi-telephone-fill text-sm text-green-500 shrink-0"></i>
            <div class="text-sm text-gray-700">{{ branch.contactInfo || 'No contact number' }}</div>
          </div>

          <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <i class="bi bi-person-badge-fill text-sm text-blue-500 shrink-0"></i>
            <div class="text-sm text-gray-700">{{ branch.manager || 'No manager assigned' }}</div>
          </div>
        </div>

        <!-- View Analytics Button -->
        <button
          [routerLink]="['/', shopId, 'branches', 'analytics']"
          class="w-full mb-6 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <i class="bi bi-graph-up-arrow"></i>
          View Analytics
        </button>

        <!-- Activity Log -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Activity Log</h4>
            <span class="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{{ logs.length }} Events</span>
          </div>

          @if (loading) {
            <div class="flex flex-col items-center justify-center py-10 gap-3">
              <app-ui-loading size="sm"></app-ui-loading>
              <p class="text-xs text-gray-500 font-medium">Loading activity...</p>
            </div>
          } @else if (logs.length === 0) {
            <div class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <i class="bi bi-journal-x text-3xl text-gray-300"></i>
              <p class="text-gray-500 mt-2 text-sm font-medium">No activity recorded yet.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (log of logs.slice(0, 6); track log.time) {
                <div class="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-bold text-gray-900">{{ log.action }}</span>
                    <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium tracking-wider">{{ log.time }}</span>
                  </div>
                  <p class="text-xs text-gray-500">{{ log.details }}</p>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>

    <ng-template #loadingState>
      <div class="flex flex-col items-center justify-center h-full p-12 text-center bg-white">
        <ng-container *ngIf="loading; else errorState">
          <app-ui-loading size="md"></app-ui-loading>
          <p class="text-sm text-gray-500 mt-4">Loading branch details...</p>
        </ng-container>
        <ng-template #errorState>
          <div class="p-6 bg-red-50 rounded-xl border border-red-100 max-w-[280px]">
            <i class="bi bi-exclamation-circle text-3xl text-red-300 mb-3 block"></i>
            <h4 class="text-sm font-bold text-red-700 mb-1">Failed to load</h4>
            <p class="text-xs text-red-500">{{ errorMessage || 'Unable to retrieve branch details.' }}</p>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
    </style>
  `,
})
export class BranchProfileComponent implements OnInit, OnChanges {
  @Input() branchId: string = '';
  @Output() onEdit = new EventEmitter<string>();
  @Output() onDeleted = new EventEmitter<void>();

  private branchService = inject(BranchService);
  private shopContext = inject(ShopContextService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);

  branch: Branch | null = null;
  summaryMetrics: BranchSummary['metrics'] | null = null;
  loading = true;
  shopId = '';
  logs: BranchActivityItem[] = [];
  errorMessage = '';

  ngOnInit() {
    this.shopContext.connectWorkspaceRoute(this.route).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.shopId = id || '';
      if (this.shopId && this.branchId) {
        this.loadBranch();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['branchId'] && !changes['branchId'].firstChange) {
      this.loadBranch();
    }
  }

  loadBranch() {
    if (!this.shopId || !this.branchId) return;

    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      branchRes: this.branchService.getBranchById(this.shopId, this.branchId),
      summaryRes: this.branchService.getAllBranchSummaries(this.shopId).pipe(
        catchError(() => of({ data: [] as BranchSummary[] })),
      ),
      activityRes: this.branchService.getBranchActivity(this.shopId, this.branchId, 6).pipe(
        catchError(() => of({ data: [] as BranchActivityItem[] })),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ branchRes, summaryRes, activityRes }) => {
          this.branch = branchRes.data;
          this.summaryMetrics =
            summaryRes.data.find((summary) => summary.id === this.branchId)?.metrics || null;
          this.logs = activityRes.data || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.branch = null;
          this.summaryMetrics = null;
          this.logs = [];
          this.loading = false;
          this.errorMessage = error?.error?.error?.message || error?.error?.message || 'Unable to load branch profile.';
          this.cdr.detectChanges();
        },
      });
  }

  async onDeleteBranch() {
    const confirmed = await this.confirmationService.confirm({
      title: 'Remove Branch?',
      description: 'Are you sure you want to remove this branch?<br><br>This action cannot be undone.',
      type: 'danger',
      primaryButtonText: 'Remove',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      this.branchService.deleteBranch(this.branchId, this.shopId).subscribe(() => {
        this.onDeleted.emit();
      });
    }
  }
}
