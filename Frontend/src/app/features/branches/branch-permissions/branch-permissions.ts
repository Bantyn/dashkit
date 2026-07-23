import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BranchService, UserBranchPermission, Branch } from '../../../core/services/branch.service';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox.component';
import { UiButtonComponent } from '../../../shared/components/ui-button.component';

@Component({
  selector: 'app-branch-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    UiLoadingComponent,
    CheckboxComponent,
    UiButtonComponent
  ],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Branch Permissions & Access</h2>
          <p class="text-xs text-gray-500 mt-0.5">Manage user access rights and functional module availability per branch</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
            {{ permissions.length }} Users • {{ branches.length }} Branches
          </span>
          <app-ui-button
            variant="outline"
            size="sm"
            [routerLink]="['../../']"
          >
            <i class="bi bi-arrow-left mr-1.5"></i>
            Back to Branches
          </app-ui-button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-6 border-b border-gray-200 bg-white flex gap-6 shrink-0 text-sm font-medium">
        <button
          (click)="activeTab = 'staff'"
          class="py-3 border-b-2 transition-all focus:outline-none flex items-center gap-2"
          [class.border-blue-600]="activeTab === 'staff'"
          [class.text-blue-600]="activeTab === 'staff'"
          [class.border-transparent]="activeTab !== 'staff'"
          [class.text-gray-500]="activeTab !== 'staff'"
        >
          <i class="bi bi-people"></i>
          Staff Permissions
        </button>
        <button
          (click)="activeTab = 'modules'"
          class="py-3 border-b-2 transition-all focus:outline-none flex items-center gap-2"
          [class.border-blue-600]="activeTab === 'modules'"
          [class.text-blue-600]="activeTab === 'modules'"
          [class.border-transparent]="activeTab !== 'modules'"
          [class.text-gray-500]="activeTab !== 'modules'"
        >
          <i class="bi bi-grid"></i>
          Branch Module Access
        </button>
      </div>

      <!-- Search (Only for staff tab) -->
      <div class="p-4 flex gap-4 bg-white shrink-0 border-b border-gray-100" *ngIf="activeTab === 'staff'">
        <div class="relative flex-1 max-w-md">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search staff by user or branch..."
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6 custom-scrollbar">

        @if (loading) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div class="flex flex-col items-center justify-center py-10 gap-4">
              <app-ui-loading size="md"></app-ui-loading>
              <span class="text-sm text-gray-500">Loading branch permissions...</span>
            </div>
          </div>
        } @else {

          <!-- STAFF PERMISSIONS TAB -->
          <ng-container *ngIf="activeTab === 'staff'">
            @if (permissions.length === 0) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="flex flex-col items-center justify-center py-16 text-center px-8">
                  <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                    <i class="bi bi-shield-slash text-2xl"></i>
                  </div>
                  <h3 class="text-gray-800 font-bold mb-1">No permissions assigned</h3>
                  <p class="text-gray-500 text-sm">Branch-level staff permissions will appear here once assigned.</p>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                @for (item of filteredPermissions; track (item.userId + item.branchId)) {
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {{ item.userName.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {{ item.userName }}
                          </div>
                          <div class="text-xs text-gray-400 mt-0.5">ID: #{{ item.userId.slice(-6).toUpperCase() }}</div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span class="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                          <i class="bi bi-shop text-[11px]"></i>
                          {{ item.branchName }}
                        </span>
                      </div>
                    </div>

                    @if (item.permissions && item.permissions.length > 0) {
                      <div class="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                        @for (perm of item.permissions; track perm) {
                          <span class="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {{ perm.replace('_', ' ') }}
                          </span>
                        }
                      </div>
                    } @else {
                      <div class="mt-3 pt-3 border-t border-gray-100">
                        <span class="text-xs text-gray-400 italic">No specific permissions assigned</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </ng-container>

          <!-- BRANCH MODULE ACCESS TAB -->
          <ng-container *ngIf="activeTab === 'modules'">
            @if (branches.length === 0) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="flex flex-col items-center justify-center py-16 text-center px-8">
                  <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                    <i class="bi bi-building text-2xl"></i>
                  </div>
                  <h3 class="text-gray-800 font-bold mb-1">No branches found</h3>
                  <p class="text-gray-500 text-sm">Please register at least one branch to configure module permissions.</p>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                @for (branch of branches; track branch.id) {
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-3">
                        <h3 class="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {{ branch.name }}
                        </h3>
                        <span [class]="'px-2 py-0.5 rounded text-xs font-medium ' + (branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                          {{ branch.status }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Manager: <span class="font-medium text-gray-700">{{ branch.manager || 'Unassigned' }}</span>
                      </p>
                      
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        @for (module of branch.allowedModules || defaultModules; track module) {
                          <span class="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold uppercase">
                            {{ module }}
                          </span>
                        }
                      </div>
                    </div>

                    <app-ui-button
                      variant="primary"
                      size="sm"
                      (onClick)="openManageModulesModal(branch)"
                    >
                      <i class="bi bi-sliders mr-1.5"></i>
                      Manage Modules
                    </app-ui-button>
                  </div>
                }
              </div>
            }
          </ng-container>

          <!-- Info Footer -->
          <div class="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <i class="bi bi-info-circle text-blue-600 mt-0.5 shrink-0"></i>
            <p class="text-xs text-blue-800 leading-relaxed">
              Branch module controls govern which functional features (POS, Invoices, Tailoring, Website etc.) are enabled for child branch users.
              Disabled modules are instantly hidden across POS and dashboard menus.
            </p>
          </div>

        }
      </div>

    </div>

    <!-- Manage Modules Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-gray-900">Manage Module Access</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ selectedBranch?.name }}</p>
          </div>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="bi bi-x-lg text-lg"></i>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <p class="text-xs text-gray-500 font-medium">Configure allowed functional modules:</p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="selectAllModules()"
                class="text-xs text-blue-600 font-bold hover:underline"
              >
                Select All
              </button>
              <span class="text-gray-300">•</span>
              <button
                type="button"
                (click)="deselectAllModules()"
                class="text-xs text-gray-500 font-bold hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-2.5">
            @for (mod of availableModules; track mod.key) {
              <div
                (click)="toggleModuleInSelection(mod.key)"
                class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 cursor-pointer transition-all select-none"
                [class.bg-blue-50\/40]="isModuleChecked(mod.key)"
                [class.border-blue-300]="isModuleChecked(mod.key)"
              >
                <app-checkbox
                  [checked]="isModuleChecked(mod.key)"
                  [size]="22"
                  class="pointer-events-none"
                ></app-checkbox>
                <div class="flex-1">
                  <div class="text-sm font-semibold text-gray-800">{{ mod.label }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">Permits access to {{ mod.key }} module endpoints.</div>
                </div>
              </div>
            }
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <app-ui-button
            variant="outline"
            size="sm"
            (onClick)="closeModal()"
          >
            Cancel
          </app-ui-button>
          <app-ui-button
            variant="primary"
            size="sm"
            [loading]="saving"
            loadingText="Saving..."
            (onClick)="saveBranchModules()"
          >
            Save Module Access
          </app-ui-button>
        </div>
      </div>
    </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
    </style>
  `
})
export class BranchPermissions implements OnInit {
  private branchService = inject(BranchService);
  private shopContext = inject(ShopContextService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  permissions: UserBranchPermission[] = [];
  branches: Branch[] = [];
  loading = true;
  shopId = '';
  searchQuery = '';
  activeTab = 'staff';

  // Modal State
  showModal = false;
  selectedBranch: Branch | null = null;
  selectedModules: string[] = [];
  saving = false;

  defaultModules = ['pos', 'invoices', 'transactions', 'products', 'inventory', 'purchases', 'tailoring', 'customers', 'offers', 'promotions', 'staff', 'reports', 'website', 'integrations'];

  availableModules = [
    { key: 'pos', label: 'POS Billing & Sales' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'transactions', label: 'Transactions & Ledger' },
    { key: 'products', label: 'Products & Catalog' },
    { key: 'inventory', label: 'Inventory & Stock' },
    { key: 'purchases', label: 'Purchases & Suppliers' },
    { key: 'tailoring', label: 'Tailoring Job Cards' },
    { key: 'customers', label: 'Customers & CRM' },
    { key: 'offers', label: 'Offers & Discounts' },
    { key: 'promotions', label: 'Marketing Campaigns' },
    { key: 'staff', label: 'Staff Management' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'website', label: 'Website & Storefront' },
    { key: 'integrations', label: 'Shipping & Integrations' },
  ];

  ngOnInit() {
    this.shopContext.connectWorkspaceRoute(this.route).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.shopId = id || '';
      if (this.shopId) {
        this.loadPermissions();
        this.loadBranches();
        return;
      }

      this.loading = false;
    });
  }

  loadPermissions() {
    this.loading = true;
    this.branchService.getBranchPermissions(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.permissions = res.data || [];
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadBranches() {
    this.branchService.getBranches(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.branches = res.data || [];
      this.cdr.detectChanges();
    });
  }

  get filteredPermissions() {
    if (!this.searchQuery) return this.permissions;
    const q = this.searchQuery.toLowerCase();
    return this.permissions.filter(p =>
      p.userName.toLowerCase().includes(q) ||
      p.branchName.toLowerCase().includes(q)
    );
  }

  // Modal Actions
  openManageModulesModal(branch: Branch) {
    this.selectedBranch = branch;
    this.selectedModules = branch.allowedModules ? [...branch.allowedModules] : [...this.defaultModules];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedBranch = null;
    this.selectedModules = [];
  }

  selectAllModules() {
    this.selectedModules = this.availableModules.map((m) => m.key);
  }

  deselectAllModules() {
    this.selectedModules = [];
  }

  isModuleChecked(key: string): boolean {
    return this.selectedModules.includes(key);
  }

  toggleModuleInSelection(key: string) {
    if (this.selectedModules.includes(key)) {
      this.selectedModules = this.selectedModules.filter(m => m !== key);
    } else {
      this.selectedModules.push(key);
    }
  }

  saveBranchModules() {
    if (!this.selectedBranch) return;
    this.saving = true;

    this.branchService.updateBranch(this.selectedBranch.id, {
      shopId: this.shopId,
      allowedModules: this.selectedModules
    }).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.toastService.showSuccess('Branch module permissions updated successfully.');
          this.loadBranches(); // Refresh local list
          this.closeModal();
        } else {
          this.toastService.showError('Failed to update branch module permissions.');
        }
      },
      error: (err) => {
        this.saving = false;
        this.toastService.showError(err?.error?.message || 'Error updating branch module permissions.');
      }
    });
  }
}

