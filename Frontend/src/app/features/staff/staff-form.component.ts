import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { getLocalISODate } from '../../core/utils/date.utils';
import { StaffService } from '../../core/services/staff.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { UiDatePickerComponent } from '../../shared/components/ui-date-picker.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox.component';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, UiInputComponent, UiDropdownComponent, UiDatePickerComponent, CheckboxComponent],
  template: `
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ isEdit ? 'Edit Staff Member' : 'Add New Staff Member' }}</h2>
            <p class="text-sm text-gray-500">Enter staff details and permissions below</p>
          </div>
          <button
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <i class="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <!-- Form Area -->
        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form [formGroup]="staffForm" (ngSubmit)="onSubmit()" class="space-y-10">
            <!-- Basic Information -->
            <div>
              <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                 Basic Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input formControlName="fullName" label="Full Name" placeholder="e.g. Rahul Sharma"></app-ui-input>
                <app-ui-input formControlName="phoneNumber" label="Phone Number" placeholder="e.g. +91 98765-43210"></app-ui-input>
                <app-ui-input formControlName="email" label="Email Address" placeholder="e.g. rahul@clothify.com"></app-ui-input>
                <app-ui-input *ngIf="!isEdit" formControlName="password" label="Password" type="password" placeholder="••••••••"></app-ui-input>
                <app-ui-input *ngIf="!isEdit" formControlName="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••"></app-ui-input>
              </div>
            </div>

            <!-- Role & Assignment -->
            <div>
               <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                 Role & Assignment
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <app-ui-dropdown formControlName="role" [options]="roleOptions" placeholder="Select Role"></app-ui-dropdown>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <app-ui-dropdown formControlName="branch" [options]="branchOptions" placeholder="Select Branch"></app-ui-dropdown>
                </div>
                <app-ui-date-picker formControlName="joiningDate" label="Joining Date"></app-ui-date-picker>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <app-ui-dropdown formControlName="status" [options]="statusOptions"></app-ui-dropdown>
                </div>
              </div>
            </div>

            <!-- Permissions Matrix -->
            <div formGroupName="permissions">
               <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                 Access Permissions
              </h3>
              <p class="text-xs text-gray-500 mb-6">Define what this staff member can see and do in the dashboard.</p>
              
              <div class="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                 <table class="w-full text-left text-sm">
                    <thead class="bg-white border-b border-gray-100">
                       <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th class="px-6 py-3">Module</th>
                          <th class="px-6 py-3 text-center">View</th>
                          <th class="px-6 py-3 text-center">Create</th>
                          <th class="px-6 py-3 text-center">Edit</th>
                          <th class="px-6 py-3 text-center">Delete</th>
                       </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                       <!-- Invoices -->
                       <tr formGroupName="invoices">
                          <td class="px-6 py-4 font-medium text-gray-900">Invoices</td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="view" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="create" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="edit" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="delete" [size]="18" class="text-primary-600"></app-checkbox></td>
                       </tr>
                       <!-- Products -->
                       <tr formGroupName="products">
                          <td class="px-6 py-4 font-medium text-gray-900">Products</td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="view" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="create" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="edit" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="delete" [size]="18" class="text-primary-600"></app-checkbox></td>
                       </tr>
                       <!-- Customers -->
                       <tr formGroupName="customers">
                          <td class="px-6 py-4 font-medium text-gray-900">Customers</td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="view" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="create" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="edit" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="delete" [size]="18" class="text-primary-600"></app-checkbox></td>
                       </tr>
                       <!-- Staff (Self/Others) -->
                       <tr formGroupName="staff">
                          <td class="px-6 py-4 font-medium text-gray-900">Staff Management</td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="view" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="create" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="edit" [size]="18" class="text-primary-600"></app-checkbox></td>
                          <td class="px-6 py-4 text-center"><app-checkbox formControlName="delete" [size]="18" class="text-primary-600"></app-checkbox></td>
                       </tr>
                        <!-- Inventory -->
                        <tr formGroupName="inventory">
                           <td class="px-6 py-4 font-medium text-gray-900">Inventory</td>
                           <td class="px-6 py-4 text-center"><app-checkbox formControlName="view" [size]="18" class="text-primary-600"></app-checkbox></td>
                           <td class="px-6 py-4 text-center"><app-checkbox formControlName="create" [size]="18" class="text-primary-600"></app-checkbox></td>
                           <td class="px-6 py-4 text-center"><app-checkbox formControlName="edit" [size]="18" class="text-primary-600"></app-checkbox></td>
                           <td class="px-6 py-4 text-center"><app-checkbox formControlName="delete" [size]="18" class="text-primary-600"></app-checkbox></td>
                        </tr>
                    </tbody>
                 </table>
              </div>
            </div>

            <!-- Commission Settings -->
            <div>
               <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                 Incentive Settings
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50 bg-opacity-30 rounded-2xl border border-blue-100">
                 <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                  <app-ui-dropdown formControlName="commissionType" [options]="commissionTypeOptions"></app-ui-dropdown>
                </div>
                <app-ui-input formControlName="commissionRate" label="Commission Rate" type="number" placeholder="0.00"></app-ui-input>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            (click)="close.emit()"
            class="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="staffForm.invalid || loading"
            class="px-8 py-2.5 bg-gray-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-gray-200"
          >
            <span
              *ngIf="loading"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
            {{ loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Confirm & Add Staff') }}
          </button>
        </div>
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
  `
})
export class StaffFormComponent implements OnInit {
  @Input() staffId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();

  staffForm: FormGroup;
  isEdit = false;
  loading = false;
  shopId = '';

  roleOptions = [
    { label: 'Manager', value: 'Manager' },
    { label: 'Cashier', value: 'Cashier' },
    { label: 'Sales Staff', value: 'Sales Staff' },
    { label: 'Inventory Staff', value: 'Inventory Staff' },
    { label: 'Other', value: 'Other' },
  ];

  branchOptions = [
    { label: 'Main Branch', value: 'Main Branch' },
    { label: 'Downtown Store', value: 'Downtown Store' },
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  commissionTypeOptions = [
    { label: 'No Commission', value: 'None' },
    { label: 'Percentage of Sales', value: 'Percentage' },
    { label: 'Fixed Amount per Order', value: 'Fixed' },
  ];

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.staffForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: [''],
      role: ['', Validators.required],
      branch: ['Main Branch', Validators.required],
      commissionType: ['None'],
      commissionRate: [0],
      status: ['Active'],
      joiningDate: [getLocalISODate(), Validators.required],
      permissions: this.fb.group({
        invoices: this.fb.group({ view: [true], create: [false], edit: [false], delete: [false] }),
        products: this.fb.group({ view: [true], create: [false], edit: [false], delete: [false] }),
        customers: this.fb.group({ view: [true], create: [false], edit: [false], delete: [false] }),
        staff: this.fb.group({ view: [false], create: [false], edit: [false], delete: [false] }),
        inventory: this.fb.group({ view: [true], create: [false], edit: [false], delete: [false] })
      })
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId') || '';
    });

    if (this.staffId) {
      this.isEdit = true;
      this.loadStaff();
    } else {
      this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.staffForm.get('confirmPassword')?.setValidators([Validators.required]);
      this.staffForm.addValidators(this.passwordMatchValidator);
    }
  }

  passwordMatchValidator(control: AbstractControl) {
    const g = control as FormGroup;
    return g.get('password')?.value === g.get('confirmPassword')?.value
       ? null : {'mismatch': true};
  }

  loadStaff() {
    this.loading = true;
    this.staffService.getStaffById(this.staffId).subscribe(res => {
      if (res.data) {
        this.staffForm.patchValue(res.data);
      }
      this.loading = false;
    });
  }

  onSubmit() {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const staffData = { ...this.staffForm.value, shopId: this.shopId };

    if (this.isEdit) {
      this.staffService.updateStaff(this.staffId, staffData).subscribe(() => {
        this.loading = false;
        this.onSaved.emit();
        this.close.emit();
      });
    } else {
      this.staffService.addStaff(staffData).subscribe(() => {
        this.loading = false;
        this.onSaved.emit();
        this.close.emit();
      });
    }
  }
}
