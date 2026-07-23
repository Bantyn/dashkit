import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, RoleRecord } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Roles & Permissions</h2>
            <p class="text-xs text-gray-500 mt-1">Configure access roles and permissions for the platform.</p>
          </div>
          <button
            (click)="resetForm()"
            class="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] transition-colors rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <i class="bi bi-plus-lg"></i> Create Role
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="w-full md:w-[60%] flex flex-col min-w-0 bg-gray-50 transition-all duration-300 border-r border-gray-200 overflow-hidden">
          
          <!-- Search -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filterRoles()"
                placeholder="Search roles…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3">
            @for (role of filteredRoles; track role.id) {
              <div
                (click)="editRole(role)"
                class="p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm"
                [class.bg-primary-50]="editingId === role.id"
                [class.border-primary-200]="editingId === role.id"
                [class.bg-white]="editingId !== role.id"
                [class.border-gray-100]="editingId !== role.id"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-bold text-gray-900 text-sm" [class.text-primary-700]="editingId === role.id">{{ role.name }}</h3>
                    <p class="text-[11px] font-normal text-gray-500 tracking-wider mt-1">{{ role.permissions.length }} permissions granted</p>
                  </div>
                  <button
                    (click)="deleteRole(role.id); $event.stopPropagation()"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right Panel (Editor) -->
        <div class="w-full md:w-[40%] flex flex-col bg-white overflow-hidden transition-all duration-300 transform translate-x-0">
          <div class="p-6 border-b border-gray-100 shrink-0 bg-white z-10">
            <h3 class="text-lg font-bold text-gray-900">{{ editingId ? 'Edit Role: ' + form.name : 'Create New Role' }}</h3>
            <p class="text-xs font-normal text-gray-500 tracking-wider mt-1">Select permissions to assign to this role.</p>
          </div>
          
          <div class="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
            <div class="space-y-6 max-w-3xl">
              <div>
                <label class="block text-[11px] font-normal tracking-wider text-gray-700 mb-1.5">Role Name</label>
                <input
                  [(ngModel)]="form.name"
                  (ngModelChange)="nameError = false"
                  placeholder="e.g. Content Manager"
                  class="w-full px-4 py-3 bg-white border border-gray-200 focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none shadow-sm"
                />
                @if (nameError) {
                  <span class="text-xs font-normal text-red-500 mt-1 block">Role name is required</span>
                }
              </div>

              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-[11px] font-normal tracking-wider text-gray-700">Permissions</label>
                  <button (click)="selectAll()" class="text-[11px] font-normal tracking-wider text-primary-600 hover:text-primary-700">Select All</button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  @for (perm of availablePermissions; track perm) {
                    <label
                      class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-50 bg-white"
                      [class.border-primary-500]="form.permissions.includes(perm)"
                      [class.bg-primary-50]="form.permissions.includes(perm)"
                      [class.border-gray-200]="!form.permissions.includes(perm)"
                    >
                      <input
                        type="checkbox"
                        [checked]="form.permissions.includes(perm)"
                        (change)="togglePermission(perm)"
                        class="mt-0.5 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span class="text-sm font-normal" [class.text-primary-700]="form.permissions.includes(perm)" [class.text-gray-700]="!form.permissions.includes(perm)">
                        {{ perm }}
                      </span>
                    </label>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="p-6 bg-white border-t border-gray-200 shrink-0 flex items-center justify-end gap-3 z-20">
            <button
              *ngIf="editingId"
              (click)="resetForm()"
              class="px-5 py-2.5 rounded-xl text-sm font-normal text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel Edit
            </button>
            <button
              (click)="saveRole()"
              class="px-6 py-2.5 rounded-xl text-sm font-normal text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors shadow-sm"
            >
              {{ editingId ? 'Update Role' : 'Create Role' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminRolesComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toastService = inject(ToastService);

  roles: RoleRecord[] = [];
  filteredRoles: RoleRecord[] = [];
  search = '';
  nameError = false;
  
  availablePermissions = [
    'admin.access',
    'admin.super',
    'shops.read',
    'shops.write',
    'users.read',
    'users.write',
    'plans.manage',
    'features.manage',
    'roles.manage',
    'billing.read',
    'billing.write',
    'reports.read',
    'settings.manage',
    'leads.manage'
  ];

  editingId: string | null = null;
  form: { name: string; permissions: string[] } = {
    name: '',
    permissions: [],
  };

  ngOnInit() {
    this.loadRoles();
  }

  async loadRoles() {
    try {
      const res = await firstValueFrom(this.adminApi.getRoles());
      this.roles = res.data || [];
      this.filterRoles();
    } catch (e) {
      console.error(e);
    }
  }

  filterRoles() {
    const q = this.search.toLowerCase();
    this.filteredRoles = this.roles.filter(r => r.name.toLowerCase().includes(q));
  }

  editRole(role: RoleRecord) {
    this.editingId = role.id;
    this.form = {
      name: role.name,
      permissions: [...role.permissions],
    };
  }

  resetForm() {
    this.editingId = null;
    this.form = { name: '', permissions: [] };
  }

  togglePermission(perm: string) {
    const idx = this.form.permissions.indexOf(perm);
    if (idx > -1) {
      this.form.permissions.splice(idx, 1);
    } else {
      this.form.permissions.push(perm);
    }
  }

  selectAll() {
    this.form.permissions = [...this.availablePermissions];
  }

  async saveRole() {
    if (!this.form.name) {
      this.nameError = true;
      return;
    }
    try {
      if (this.editingId) {
        await firstValueFrom(this.adminApi.updateRole(this.editingId, this.form));
        this.toastService.showSuccess('Role updated successfully');
      } else {
        await firstValueFrom(this.adminApi.createRole(this.form));
        this.toastService.showSuccess('Role created successfully');
      }
      this.resetForm();
      await this.loadRoles();
    } catch (e) {
      console.error(e);
      this.toastService.showError('Failed to save role');
    }
  }

  async deleteRole(id: string) {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await firstValueFrom(this.adminApi.deleteRole(id));
      this.toastService.showSuccess('Role deleted successfully');
      if (this.editingId === id) this.resetForm();
      await this.loadRoles();
    } catch (e) {
      console.error(e);
      this.toastService.showError('Failed to delete role');
    }
  }
}
