import { Component, OnInit, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BranchService } from '../../../core/services/branch.service';
import { StaffService } from '../../../core/services/staff.service';
import { UiInputComponent } from '../../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ShopContextService } from '../../../core/services/shop-context.service';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, UiInputComponent, UiDropdownComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ isEdit ? 'Edit Branch' : 'Add New Branch' }}</h2>
            <p class="text-sm text-gray-500 mt-0.5">Define branch location and management</p>
          </div>
          <button
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Form Area -->
        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form [formGroup]="branchForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">

            <!-- Branch Name -->
            <app-ui-input
              formControlName="name"
              label="Branch Name"
              placeholder="e.g. Westside Mall Store"
              [error]="getError('name')"
            ></app-ui-input>

            <!-- Contact & Manager Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <app-ui-input
                formControlName="contactInfo"
                label="Contact Number"
                placeholder="e.g. +91 98765-00000"
                [error]="getError('contactInfo')"
              ></app-ui-input>

              <!-- Manager field -->
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-gray-700">
                  Manager <span class="text-gray-400 font-normal">(optional)</span>
                </label>
                @if (managerOptions.length > 0) {
                  <app-ui-dropdown
                    formControlName="manager"
                    [options]="managerOptions"
                    placeholder="Select Manager"
                  ></app-ui-dropdown>
                } @else {
                  <app-ui-input
                    formControlName="manager"
                    placeholder="e.g. Rajesh Kumar"
                  ></app-ui-input>
                }
              </div>
            </div>

            <!-- Address -->
            <app-ui-input
              formControlName="address"
              label="Full Address"
              placeholder="e.g. Unit 4, Level 1, Nexus Mall, Hyderabad"
              [error]="getError('address')"
            ></app-ui-input>

            <!-- Status (edit only) -->
            @if (isEdit) {
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-gray-700">Branch Status</label>
                <app-ui-dropdown
                  formControlName="status"
                  [options]="statusOptions"
                  placeholder="Select status"
                ></app-ui-dropdown>
              </div>
            }

          </form>

          <!-- Error Message -->
          @if (errorMessage) {
            <div class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
              <i class="bi bi-exclamation-circle shrink-0 mt-0.5"></i>
              <span>{{ errorMessage }}</span>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            (click)="close.emit()"
            class="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="loading"
            class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <span *ngIf="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Branch') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
  `]
})
export class BranchFormComponent implements OnInit {
  @Input() branchId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private branchService = inject(BranchService);
  private staffService = inject(StaffService);
  private shopContext = inject(ShopContextService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  branchForm: FormGroup;
  isEdit = false;
  loading = false;
  shopId = '';
  errorMessage = '';

  managerOptions: { label: string; value: string }[] = [];
  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  constructor() {
    this.branchForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', Validators.required],
      contactInfo: ['', Validators.required],
      manager: [''],
      status: ['Active']
    });
  }

  ngOnInit() {
    this.shopContext.connectWorkspaceRoute(this.route).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      this.shopId = id || '';
      if (this.shopId) {
        this.loadManagers();
        if (this.branchId) {
          this.isEdit = true;
          this.loadBranch();
        }
      }
    });
  }

  getError(controlName: string): string {
    const control = this.branchForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) {
      const labels: Record<string, string> = {
        name: 'Branch name',
        address: 'Full address',
        contactInfo: 'Contact number',
        manager: 'Manager',
      };
      return `${labels[controlName] || controlName} is required`;
    }
    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    }
    return '';
  }

  loadManagers() {
    this.staffService.getStaff(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.managerOptions = (res.data || [])
          .filter(s => s.role === 'Manager')
          .map(s => ({ label: s.fullName, value: s.fullName }));
      },
      error: () => {
        this.managerOptions = [];
      }
    });
  }

  loadBranch() {
    if (!this.shopId || !this.branchId) return;
    this.loading = true;
    this.branchService.getBranchById(this.shopId, this.branchId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.data) {
        this.branchForm.patchValue(res.data);
      }
      this.loading = false;
    });
  }

  onSubmit() {
    this.branchForm.markAllAsTouched();
    if (this.branchForm.invalid) return;

    this.loading = true;
    const branchData = { ...this.branchForm.value, shopId: this.shopId };
    this.errorMessage = '';

    if (this.isEdit) {
      this.branchService.updateBranch(this.branchId, branchData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.loading = false;
          this.onSaved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error?.message || err?.error?.message || err?.message || 'Failed to update branch';
        }
      });
    } else {
      this.branchService.addBranch(branchData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.loading = false;
          this.onSaved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error?.message || err?.error?.message || err?.message || 'Failed to create branch';
        }
      });
    }
  }
}
