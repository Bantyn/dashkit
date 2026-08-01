import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { getLocalISODate } from '../../core/utils/date.utils';
import { StaffService } from '../../core/services/staff.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

export interface PermissionCategory {
  key: string;
  name: string;
  actions: string[];
}

const ROLE_RECOMMENDED_PERMISSIONS: Record<string, string[]> = {
  owner: ['sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.print', 'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.manage', 'products.view', 'products.create', 'products.edit', 'products.delete', 'products.export', 'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete', 'purchases.approve', 'accounting.view', 'accounting.create', 'accounting.edit', 'accounting.delete', 'accounting.export', 'reports.view', 'reports.export', 'website.view', 'website.edit', 'website.manage', 'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'branches.view', 'branches.edit', 'branches.manage', 'settings.view', 'settings.edit', 'returns.view', 'returns.create', 'analytics.view'],
  store_manager: ['sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.print', 'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.manage', 'products.view', 'products.create', 'products.edit', 'products.delete', 'customers.view', 'customers.create', 'customers.edit', 'purchases.view', 'purchases.create', 'reports.view', 'reports.export', 'staff.view', 'branches.view', 'returns.view', 'returns.create', 'analytics.view'],
  manager: ['sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.print', 'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.manage', 'products.view', 'products.create', 'products.edit', 'products.delete', 'customers.view', 'customers.create', 'customers.edit', 'purchases.view', 'purchases.create', 'reports.view', 'reports.export', 'staff.view', 'branches.view', 'returns.view', 'returns.create', 'analytics.view'],
  cashier: ['sales.view', 'sales.create', 'sales.print', 'customers.view', 'customers.create', 'returns.view', 'returns.create', 'analytics.view'],
  sales_executive: ['sales.view', 'sales.create', 'products.view', 'customers.view', 'customers.create', 'returns.view', 'analytics.view'],
  inventory_manager: ['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.manage', 'products.view', 'products.create', 'products.edit', 'products.delete', 'products.export'],
  purchase_manager: ['purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete', 'purchases.approve', 'inventory.view', 'products.view'],
  accountant: ['accounting.view', 'accounting.create', 'accounting.edit', 'accounting.delete', 'accounting.export', 'reports.view', 'reports.export'],
  crm_executive: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'],
  marketing_executive: ['website.view', 'website.edit', 'reports.view'],
  website_manager: ['website.view', 'website.edit', 'website.manage', 'products.view'],
  tailor: ['sales.view'],
  delivery_staff: ['sales.view'],
  branch_manager: ['branches.view', 'branches.edit', 'sales.view', 'inventory.view', 'staff.view'],
  auditor: ['sales.view', 'inventory.view', 'products.view', 'customers.view', 'purchases.view', 'accounting.view', 'reports.view', 'reports.export', 'analytics.view'],
};

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, UiInputComponent, UiDropdownComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ isEdit ? 'Edit Staff Member' : 'Add New Staff Member' }}</h2>
            <p class="text-xs text-gray-500">Configure role assignment, recommended permission highlights, and restrictions</p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form [formGroup]="staffForm" (ngSubmit)="onSubmit()" class="space-y-8">
            <!-- 1. Basic Information -->
            <div>
              <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-primary-500"></span> Basic Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <app-ui-input formControlName="fullName" label="Full Name" placeholder="e.g. Rahul Sharma"></app-ui-input>
                <app-ui-input formControlName="phoneNumber" label="Phone Number" placeholder="e.g. +91 98765-43210"></app-ui-input>
                <app-ui-input formControlName="email" label="Email Address" placeholder="e.g. rahul@clothify.com"></app-ui-input>
                <app-ui-input *ngIf="!isEdit" formControlName="password" label="Password" type="password" placeholder="••••••••"></app-ui-input>
              </div>
            </div>

            <!-- 2. Role & Branch Assignment -->
            <div>
              <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-primary-500"></span> Role & Branch Assignment
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Assigned Role Template</label>
                  <app-ui-dropdown formControlName="role" [options]="roleOptions" (ngModelChange)="onRoleChange($event)" placeholder="Select Role"></app-ui-dropdown>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
                  <app-ui-dropdown formControlName="branch" [options]="branchOptions" placeholder="Select Branch"></app-ui-dropdown>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
                  <app-ui-dropdown formControlName="status" [options]="statusOptions"></app-ui-dropdown>
                </div>
              </div>
            </div>

            <!-- 3. Permission Architecture: Category Grid & Recommended Highlighting -->
            <div>
              <div class="flex justify-between items-center mb-4">
                <div>
                  <h3 class="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary-500"></span> Effective Permission Matrix
                  </h3>
                  <p class="text-xs text-gray-500 mt-0.5">Permissions highlighted with ⭐ are recommended for {{ currentRoleLabel }}</p>
                </div>

                <div class="flex gap-2">
                  <button type="button" (click)="activeTab = 'grant'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition" [class.bg-green-600]="activeTab === 'grant'" [class.text-white]="activeTab === 'grant'" [class.bg-gray-100]="activeTab !== 'grant'" [class.text-gray-600]="activeTab !== 'grant'">
                    + Additional Grants ({{ additionalPermissions.length }})
                  </button>
                  <button type="button" (click)="activeTab = 'revoke'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition" [class.bg-red-600]="activeTab === 'revoke'" [class.text-white]="activeTab === 'revoke'" [class.bg-gray-100]="activeTab !== 'revoke'" [class.text-gray-600]="activeTab !== 'revoke'">
                    − Restricted Revokes ({{ restrictedPermissions.length }})
                  </button>
                </div>
              </div>

              <!-- Categories -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div *ngFor="let category of permissionCategories" class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                    <span class="text-xs font-bold text-gray-900 uppercase tracking-wider">{{ category.name }}</span>
                    <span class="text-[10px] font-bold text-gray-400">category: {{ category.key }}</span>
                  </div>

                  <div class="space-y-2">
                    <div *ngFor="let act of category.actions" class="flex justify-between items-center text-xs p-1 rounded hover:bg-white transition" [class.bg-amber-50]="isRecommended(category.key + '.' + act)" [class.border-l-2]="isRecommended(category.key + '.' + act)" [class.border-amber-400]="isRecommended(category.key + '.' + act)">
                      <div class="flex items-center gap-1.5">
                        <span *ngIf="isRecommended(category.key + '.' + act)" class="text-amber-500 font-bold" title="Recommended permission for {{ currentRoleLabel }}"><i class="bi bi-star-fill"></i></span>
                        <span class="font-medium text-gray-700 capitalize" [class.text-amber-900]="isRecommended(category.key + '.' + act)">{{ act }}</span>
                      </div>
                      
                      <div class="flex items-center gap-2">
                        <!-- Grant Toggle -->
                        <button
                          type="button"
                          (click)="toggleGrant(category.key + '.' + act)"
                          class="px-2 py-0.5 rounded text-[10px] font-bold transition"
                          [class.bg-green-600]="isGranted(category.key + '.' + act)"
                          [class.text-white]="isGranted(category.key + '.' + act)"
                          [class.bg-gray-200]="!isGranted(category.key + '.' + act)"
                          [class.text-gray-500]="!isGranted(category.key + '.' + act)"
                        >
                          Grant
                        </button>

                        <!-- Revoke Toggle -->
                        <button
                          type="button"
                          (click)="toggleRevoke(category.key + '.' + act)"
                          class="px-2 py-0.5 rounded text-[10px] font-bold transition"
                          [class.bg-red-600]="isRevoked(category.key + '.' + act)"
                          [class.text-white]="isRevoked(category.key + '.' + act)"
                          [class.bg-gray-200]="!isRevoked(category.key + '.' + act)"
                          [class.text-gray-500]="!isRevoked(category.key + '.' + act)"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button (click)="close.emit()" class="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button (click)="onSubmit()" [disabled]="loading" class="px-6 py-2 text-xs font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {{ isEdit ? 'Save Staff Changes' : 'Create Staff Member' }}
          </button>
        </div>
      </div>
    </div>
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
  activeTab: 'grant' | 'revoke' = 'grant';

  additionalPermissions: string[] = [];
  restrictedPermissions: string[] = [];
  recommendedPermissions: string[] = [];
  currentRoleLabel = 'Store Manager';

  roleOptions = [
    { label: 'Shop Owner', value: 'owner' },
    { label: 'Store Manager', value: 'store_manager' },
    { label: 'Cashier', value: 'cashier' },
    { label: 'Sales Executive', value: 'sales_executive' },
    { label: 'Inventory Manager', value: 'inventory_manager' },
    { label: 'Purchase Manager', value: 'purchase_manager' },
    { label: 'Accountant', value: 'accountant' },
    { label: 'CRM Executive', value: 'crm_executive' },
    { label: 'Marketing Executive', value: 'marketing_executive' },
    { label: 'Website Manager', value: 'website_manager' },
    { label: 'Tailor', value: 'tailor' },
    { label: 'Delivery Staff', value: 'delivery_staff' },
    { label: 'Branch Manager', value: 'branch_manager' },
    { label: 'Auditor', value: 'auditor' },
  ];

  branchOptions = [
    { label: 'Main Branch', value: 'Main Branch' },
    { label: 'Downtown Store', value: 'Downtown Store' },
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  permissionCategories: PermissionCategory[] = [
    { key: 'sales', name: 'Sales & POS', actions: ['view', 'create', 'edit', 'delete', 'print'] },
    { key: 'inventory', name: 'Inventory & Stock', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { key: 'products', name: 'Products Catalog', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'customers', name: 'Customers & CRM', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'purchases', name: 'Purchase Orders', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
    { key: 'accounting', name: 'Accounting & Ledger', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'reports', name: 'Reports & Analytics', actions: ['view', 'export'] },
    { key: 'website', name: 'Storefront Website', actions: ['view', 'edit', 'manage'] },
    { key: 'staff', name: 'Staff Management', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'branches', name: 'Branch Locations', actions: ['view', 'edit', 'manage'] },
    { key: 'settings', name: 'Shop Settings', actions: ['view', 'edit'] },
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
      role: ['store_manager', Validators.required],
      branch: ['Main Branch', Validators.required],
      status: ['Active'],
      joiningDate: [getLocalISODate(), Validators.required],
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
      this.onRoleChange('store_manager');
    }
  }

  onRoleChange(roleVal: string) {
    const roleKey = roleVal?.toLowerCase().replace(/\s+/g, '_') || 'store_manager';
    const selectedOption = this.roleOptions.find(o => o.value === roleVal || o.value === roleKey);
    this.currentRoleLabel = selectedOption?.label || roleVal;

    this.recommendedPermissions = ROLE_RECOMMENDED_PERMISSIONS[roleKey] || ROLE_RECOMMENDED_PERMISSIONS['store_manager'] || [];

    // Automatically auto-populate recommended grants when role is chosen
    if (!this.isEdit) {
      this.additionalPermissions = Array.from(new Set([...this.recommendedPermissions]));
      this.restrictedPermissions = [];
    }
  }

  isRecommended(permission: string): boolean {
    return this.recommendedPermissions.includes(permission);
  }

  toggleGrant(permission: string) {
    if (this.additionalPermissions.includes(permission)) {
      this.additionalPermissions = this.additionalPermissions.filter(p => p !== permission);
    } else {
      this.additionalPermissions.push(permission);
      this.restrictedPermissions = this.restrictedPermissions.filter(p => p !== permission);
    }
  }

  toggleRevoke(permission: string) {
    if (this.restrictedPermissions.includes(permission)) {
      this.restrictedPermissions = this.restrictedPermissions.filter(p => p !== permission);
    } else {
      this.restrictedPermissions.push(permission);
      this.additionalPermissions = this.additionalPermissions.filter(p => p !== permission);
    }
  }

  isGranted(permission: string): boolean {
    return this.additionalPermissions.includes(permission);
  }

  isRevoked(permission: string): boolean {
    return this.restrictedPermissions.includes(permission);
  }

  loadStaff() {
    this.loading = true;
    this.staffService.getStaffById(this.staffId).subscribe(res => {
      if (res.data) {
        this.staffForm.patchValue(res.data);
        this.additionalPermissions = res.data.additionalPermissions || [];
        this.restrictedPermissions = res.data.restrictedPermissions || [];
        this.onRoleChange(res.data.roleId || res.data.role || 'store_manager');
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
    const staffData = {
      ...this.staffForm.value,
      roleId: this.staffForm.value.role,
      shopId: this.shopId,
      additionalPermissions: this.additionalPermissions,
      restrictedPermissions: this.restrictedPermissions,
    };

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
