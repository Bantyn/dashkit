import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BranchFormComponent } from '../branch-add/branch-form.component';
import { BranchService } from '../../../core/services/branch.service';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { UiButtonComponent } from '../../../shared/components/ui-button.component';

@Component({
  selector: 'app-branch-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BranchFormComponent,
    UiLoadingComponent,
    UiButtonComponent
  ],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Branch Settings</h2>
          <p class="text-xs text-gray-500 mt-0.5">Manage and configure operational settings for your branch locations</p>
        </div>
        <div class="flex items-center gap-3">
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

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6 custom-scrollbar">
        <div class="max-w-full mx-auto">

          <!-- Loading -->
          @if (loading) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center gap-4">
              <app-ui-loading size="md"></app-ui-loading>
              <span class="text-sm text-gray-500">Loading branch settings...</span>
            </div>
          }

          <!-- Branch selector (no branchId in route) -->
          @else if (!branchId) {
            <div class="space-y-4">

              <!-- Info Card -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-lg">
                  <i class="bi bi-gear-fill"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-gray-900">Select a Branch to Configure</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Choose a branch below to edit its location address, contact info, manager assignment, and operation hours.</p>
                </div>
              </div>

              <!-- Empty state -->
              @if (branches.length === 0) {
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <i class="bi bi-shop text-2xl"></i>
                  </div>
                  <h3 class="text-gray-800 font-bold mb-1">No branches found</h3>
                  <p class="text-gray-500 text-sm">Create a branch first to configure location settings.</p>
                </div>
              }

              <!-- Branch List -->
              @else {
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-3.5">Branch</th>
                        <th class="px-6 py-3.5 text-center">Status</th>
                        <th class="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      @for (b of branches; track b.id) {
                        <tr class="hover:bg-gray-50 transition-colors group">
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {{ b.name ? b.name.charAt(0).toUpperCase() : '?' }}
                              </div>
                              <div>
                                <div class="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{{ b.name }}</div>
                                <div class="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{{ b.address }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-center">
                            <span [class]="'px-2.5 py-1 rounded-full text-xs font-medium ' + (b.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                              {{ b.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-right">
                            <app-ui-button
                              variant="outline"
                              size="sm"
                              (onClick)="selectBranch(b.id)"
                            >
                              <i class="bi bi-pencil mr-1 text-[11px]"></i>
                              Configure
                            </app-ui-button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

            </div>
          }

          <!-- Edit form (branchId present in route) -->
          @else {
            <!-- Settings hint card above form -->
            <div class="mb-5 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <i class="bi bi-info-circle text-lg"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">Editing Branch Configuration</p>
                  <p class="text-xs text-gray-500 mt-0.5">Updates apply immediately after saving.</p>
                </div>
              </div>
              <app-ui-button
                variant="outline"
                size="sm"
                (onClick)="goBack()"
              >
                <i class="bi bi-arrow-left mr-1.5 text-[11px]"></i>
                Back to list
              </app-ui-button>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <app-branch-form
                [branchId]="branchId"
                (close)="goBack()"
                (onSaved)="onSaved()"
              ></app-branch-form>
            </div>
          }

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
export class BranchSettings implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private branchService = inject(BranchService);
  private shopContext = inject(ShopContextService);
  private destroyRef = inject(DestroyRef);

  branchId: string | null = null;
  branches: any[] = [];
  loading = false;
  shopId = '';

  ngOnInit() {
    this.shopContext.connectWorkspaceRoute(this.route).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.shopId = id || '';
      if (!this.branchId && this.shopId) this.loadBranches();
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.branchId = params.get('branchId');
    });
  }

  loadBranches() {
    this.loading = true;
    this.branchService.getBranches(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.branches = res.data || [];
      this.loading = false;
    });
  }

  selectBranch(id: string) {
    this.router.navigate(['./', id], { relativeTo: this.route });
  }

  goBack() {
    if (this.branchId) {
      this.branchId = null;
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }

  onSaved() {
    this.goBack();
  }
}

