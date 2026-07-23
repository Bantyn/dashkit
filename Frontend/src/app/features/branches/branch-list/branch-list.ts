import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { BranchService, Branch } from '../../../core/services/branch.service';
import { ShopService } from '../../../core/services/shop.service';
import { Shop } from '../../../core/models/shop.model';
import { ToastService } from '../../../core/services/toast.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { BranchFormComponent } from '../branch-add/branch-form.component';
import { BranchProfileComponent } from '../branch-profile.component';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiLoadingComponent, BranchFormComponent, BranchProfileComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">

      <!-- Left Panel: Branch List -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300 no-print">

        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Branches</h2>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <i class="bi bi-buildings"></i>
              <span>{{ branches.length }} / {{ maxBranchLimit }} Branches Included</span>
            </span>

            <button
              (click)="handleAddBranchClick()"
              [disabled]="isTrial(shop)"
              [class.opacity-60]="isTrial(shop)"
              class="flex items-center gap-2 px-3.5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:hover:bg-primary-600 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              @if (isTrial(shop)) {
                <i class="bi bi-lock-fill text-amber-300"></i>
              } @else {
                <i class="bi bi-plus-lg"></i>
              }
              <span>Add Branch</span>
            </button>
          </div>
        </div>

        @if (isTrial(shop)) {
          <div class="mx-4 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center justify-between shadow-sm shrink-0">
            <div class="flex items-center gap-2.5">
              <i class="bi bi-lock-fill text-amber-600 text-lg"></i>
              <div>
                <span class="font-semibold block text-xs md:text-sm">Branch creation is locked during Free Trial</span>
                <span class="text-xs text-amber-700">Please upgrade your plan or start billing to unlock and create additional branches.</span>
              </div>
            </div>
            <a [routerLink]="['/', shopId, 'subscription']" class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 whitespace-nowrap">
              Start Billing
            </a>
          </div>
        }

        <!-- Search & Filter -->
        <div class="p-4 flex gap-4 bg-white shrink-0">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search branches by name or address..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
          <select
            [(ngModel)]="selectedStatus"
            class="px-3 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm outline-none transition-all text-gray-600 min-w-[130px]"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Branch</th>
                  <th class="px-6 py-3">Manager</th>
                  <th class="px-6 py-3 text-center">Status</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Contact</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading branches...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (errorMessage) {
                  <tr>
                    <td colspan="4" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">
                        {{ errorMessage }}
                      </div>
                    </td>
                  </tr>
                } @else if (filteredBranches.length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                      @if (branches.length === 0) {
                        No branches found yet.
                      } @else {
                        No branches match your search.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (branch of filteredBranches; track branch.id) {
                    <tr
                      (click)="selectBranch(branch)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedBranch?.id === branch.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ branch.name ? branch.name.charAt(0).toUpperCase() : '?' }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                              {{ branch.name }}
                            </div>
                            <div class="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{{ branch.address }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600">
                        {{ branch.manager || 'No Manager' }}
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span [class]="'px-2 py-1 rounded text-xs font-medium ' + (branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                          {{ branch.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {{ branch.contactInfo || 'N/A' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Branch Detail -->
      <div
        class="w-[40%] min-w-[350px] max-w-[500px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0"
        *ngIf="selectedBranch"
      >
        <app-branch-profile
          [branchId]="selectedBranch.id"
          (onEdit)="onEditBranch($event)"
          (onDeleted)="onBranchDeleted()"
        ></app-branch-profile>
      </div>

      <!-- Empty State for Detail View -->
      <div
        *ngIf="!selectedBranch && !loading"
        class="hidden lg:flex flex-col items-center justify-center w-[40%] min-w-[350px] max-w-[500px] bg-white border-l border-gray-200 text-center p-12 h-full sticky top-0"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <i class="bi bi-shop text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-gray-700 font-semibold text-base mb-1">Branch Details</h3>
        <p class="text-gray-400 text-sm">Select a branch to view its details, manager, and activity.</p>
      </div>
    </div>

    <!-- Modals -->
    <app-branch-form
      *ngIf="showAddModal"
      (close)="showAddModal = false"
      (onSaved)="loadBranches()"
    ></app-branch-form>

    <app-branch-form
      *ngIf="showEditModal"
      [branchId]="editBranchId"
      (close)="showEditModal = false; editBranchId = ''"
      (onSaved)="loadBranches()"
    ></app-branch-form>

    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
    </style>
  `
})
export class BranchList implements OnInit {
  private branchService = inject(BranchService);
  private shopService = inject(ShopService);
  private toastService = inject(ToastService);
  private shopContext = inject(ShopContextService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  branches: Branch[] = [];
  shop: Shop | null = null;
  maxBranchLimit = 1;
  loading = true;
  searchQuery = '';
  selectedStatus = '';
  shopId = '';
  selectedBranch: Branch | null = null;
  showAddModal = false;
  showEditModal = false;
  editBranchId = '';
  errorMessage = '';

  isTrial(shop: Shop | null): boolean {
    if (!shop) return false;
    const plan = String(shop.subscriptionPlan || '').toLowerCase();
    const status = String(shop.subscriptionStatus || '').toLowerCase();
    const payment = String(shop.paymentStatus || '').toLowerCase();
    return plan === 'trial' || status === 'trial' || payment === 'trial';
  }

  ngOnInit() {
    this.shopContext.connectWorkspaceRoute(this.route).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.shopId = id || '';
      if (this.shopId) {
        this.loadBranches();
        this.loadShopDetails();
        return;
      }

      this.loading = false;
      this.errorMessage = 'Unable to resolve shop context for branches.';
    });
  }

  loadShopDetails() {
    if (!this.shopId) return;
    this.shopService.getShop(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.shop = res.data || null;
          if (this.shop) {
            const limit = (this.shop as any).branchLimit || (this.shop as any).branchCount;
            if (limit) {
              this.maxBranchLimit = limit;
            } else {
              const plan = String(this.shop.subscriptionPlan || '').toLowerCase();
              if (plan === 'plus') this.maxBranchLimit = 3;
              else if (plan === 'pro') this.maxBranchLimit = 5;
              else if (plan === 'enterprise' || plan === 'custom') this.maxBranchLimit = 10;
              else this.maxBranchLimit = 1;
            }
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  handleAddBranchClick() {
    if (this.isTrial(this.shop)) {
      this.toastService.showWarning('Branch creation is locked during Free Trial. Redirecting to subscription page...');
      this.router.navigate(['/', this.shopId, 'subscription']);
      return;
    }
    if (this.branches.length >= this.maxBranchLimit) {
      this.toastService.showWarning(`You have reached the maximum branch limit (${this.maxBranchLimit}) for your plan.`);
      return;
    }
    this.showAddModal = true;
  }

  loadBranches() {
    this.loading = true;
    this.errorMessage = '';
    this.branchService.getBranches(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.branches = res.data || [];
          this.loading = false;
          if (this.branches.length > 0 && !this.selectedBranch && window.innerWidth >= 1024) {
            this.selectedBranch = this.branches[0];
          } else if (this.selectedBranch) {
            const updated = this.branches.find(b => b.id === this.selectedBranch?.id);
            if (updated) {
              this.selectedBranch = updated;
            } else {
              this.selectedBranch = null;
            }
          }
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.loading = false;
          this.branches = [];
          this.selectedBranch = null;
          this.errorMessage = error?.error?.error?.message || error?.error?.message || 'Unable to load branches right now.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  get filteredBranches() {
    let list = this.branches;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q)
      );
    }
    if (this.selectedStatus) {
      list = list.filter(b => b.status === this.selectedStatus);
    }
    return list;
  }

  selectBranch(branch: Branch) {
    this.selectedBranch = branch;
  }

  onEditBranch(id: string) {
    this.editBranchId = id;
    this.showEditModal = true;
  }

  onBranchDeleted() {
    this.selectedBranch = null;
    this.loadBranches();
  }
}
