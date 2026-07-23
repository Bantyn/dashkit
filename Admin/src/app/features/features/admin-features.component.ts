import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, FeatureRecord } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';

type FeatureCategory =
  | 'core'
  | 'website'
  | 'selling'
  | 'inventory'
  | 'analytics'
  | 'marketing'
  | 'integrations'
  | 'enterprise';

@Component({
  selector: 'app-admin-features',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Features Catalog</h2>
            <p class="text-xs text-gray-500 mt-1">Manage master feature list used by plans and the entitlement engine.</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="resetForm()"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-primary-700 hover:shadow-md transition-all flex items-center gap-2"
            >
              <i class="bi bi-plus-lg"></i> New Feature
            </button>
          </div>
        </div>

        <!-- Right Header (Form/Details) -->
        <div class="w-[40%] xl:w-[550px] min-w-[350px] px-6 py-5 border-l border-gray-200 flex justify-between items-center shrink-0 bg-white">
          <div>
            <h3 class="text-lg font-bold text-gray-900">{{ editingKey ? 'Edit Feature' : 'Create New Feature' }}</h3>
            <p class="text-xs text-gray-500 mt-1">Configure feature details and status.</p>
          </div>
          <button (click)="saveFeature()" class="px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-black transition-all disabled:opacity-50">
            {{ editingKey ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filterFeatures()"
                placeholder="Search features…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <select
              [(ngModel)]="filterCategory"
              (change)="filterFeatures()"
              class="w-48 px-3 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
            >
              <option value="">All Categories</option>
              <option *ngFor="let cat of categories" [value]="cat">{{ cat | titlecase }}</option>
            </select>
          </div>
          
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50/75">
                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Label</th>
                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Key</th>
                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Category</th>
                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (feat of filteredFeatures; track feat.key) {
                    <tr
                      (click)="editFeature(feat)"
                      class="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      [class.bg-[var(--color-gray-50)]]="editingKey === feat.key"
                    >
                      <td class="px-6 py-4 border-b border-gray-100/80">
                        <div class="font-bold text-gray-900 text-sm" [class.text-primary-700]="editingKey === feat.key">{{ feat.label }}</div>
                        <div class="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{{ feat.description }}</div>
                      </td>
                      <td class="px-6 py-4 border-b border-gray-100/80">
                        <span class="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">{{ feat.key }}</span>
                      </td>
                      <td class="px-6 py-4 border-b border-gray-100/80">
                        <span class="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-600">
                          {{ feat.category }}
                        </span>
                      </td>
                      <td class="px-6 py-4 border-b border-gray-100/80">
                        <span
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border text-center capitalize"
                          [ngClass]="{
                            'bg-green-50 text-green-700 border-green-100': (feat.status || (feat.active ? 'active' : 'inactive')) === 'active',
                            'bg-gray-50 text-gray-400 border-gray-200': (feat.status || (feat.active ? 'active' : 'inactive')) === 'inactive',
                            'bg-amber-50 text-amber-700 border-amber-100': (feat.status || (feat.active ? 'active' : 'inactive')) === 'maintenance',
                            'bg-red-50 text-red-700 border-red-100': (feat.status || (feat.active ? 'active' : 'inactive')) === 'deprecated'
                          }"
                        >
                          <span class="w-1.5 h-1.5 rounded-full"
                            [ngClass]="{
                              'bg-green-500': (feat.status || (feat.active ? 'active' : 'inactive')) === 'active',
                              'bg-gray-300': (feat.status || (feat.active ? 'active' : 'inactive')) === 'inactive',
                              'bg-amber-500': (feat.status || (feat.active ? 'active' : 'inactive')) === 'maintenance',
                              'bg-red-500': (feat.status || (feat.active ? 'active' : 'inactive')) === 'deprecated'
                            }"
                          ></span>
                          {{ feat.status || (feat.active ? 'Active' : 'Inactive') }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Panel (Edit Form) -->
        <div class="w-[40%] xl:w-[550px] min-w-[350px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white space-y-6">
            
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Feature Key</label>
                  <input
                    [(ngModel)]="form.key"
                    (ngModelChange)="keyError = false"
                    [disabled]="!!editingKey"
                    placeholder="e.g. advance_reports"
                    class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none disabled:opacity-50 bg-gray-50"
                  />
                  <p class="text-[10px] text-gray-400 mt-1 leading-tight">Unique identifier (snake_case), cannot be changed later.</p>
                  @if (keyError) {
                    <span class="text-[10px] text-red-500 mt-1 block">Key is required</span>
                  }
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Display Label</label>
                  <input
                    [(ngModel)]="form.label"
                    (ngModelChange)="labelError = false"
                    placeholder="e.g. Advanced Reports"
                    class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-gray-50"
                  />
                  @if (labelError) {
                    <span class="text-[10px] text-red-500 mt-1 block">Label is required</span>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Category</label>
                <select
                  [(ngModel)]="form.category"
                  class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-gray-50"
                >
                  <option *ngFor="let cat of categories" [value]="cat">{{ cat | titlecase }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Description</label>
                <textarea
                  [(ngModel)]="form.description"
                  placeholder="Describe what this feature does..."
                  rows="4"
                  class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-gray-50 resize-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Feature Status</label>
                <select
                  [(ngModel)]="form.status"
                  (change)="onStatusChange()"
                  class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-gray-50 font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="deprecated">Deprecated</option>
                </select>
                <p class="text-[10px] text-gray-400 mt-1 leading-tight">
                  Status dictates the lifecycle of the feature across all tenants globally.
                </p>
              </div>
            </div>

          </div>

          <div class="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            @if (editingKey) {
              <button
                (click)="deleteFeature(editingKey)"
                class="px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete Feature
              </button>
            } @else {
              <div></div>
            }
            
            <button
              *ngIf="editingKey"
              (click)="resetForm()"
              class="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminFeaturesComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toastService = inject(ToastService);

  categories: FeatureCategory[] = [
    'core', 'website', 'selling', 'inventory', 'analytics', 'marketing', 'integrations', 'enterprise'
  ];

  features: FeatureRecord[] = [];
  filteredFeatures: FeatureRecord[] = [];
  
  search = '';
  filterCategory = '';
  
  editingKey: string | null = null;
  form: FeatureRecord = this.getEmptyForm();
  keyError = false;
  labelError = false;

  ngOnInit() {
    this.loadFeatures();
  }

  getEmptyForm(): FeatureRecord {
    return {
      key: '',
      label: '',
      category: 'core',
      description: '',
      active: true,
      status: 'active'
    };
  }

  async loadFeatures() {
    try {
      const res = await firstValueFrom(this.adminApi.getFeatures());
      this.features = res.data || [];
      this.filterFeatures();
    } catch (e) {
      console.error(e);
    }
  }

  filterFeatures() {
    const q = this.search.toLowerCase();
    this.filteredFeatures = this.features.filter(f => {
      const matchSearch = f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q);
      const matchCat = this.filterCategory ? f.category === this.filterCategory : true;
      return matchSearch && matchCat;
    });
  }

  editFeature(feature: FeatureRecord) {
    this.editingKey = feature.key;
    this.form = {
      ...feature,
      status: feature.status || (feature.active ? 'active' : 'inactive')
    };
  }

  resetForm() {
    this.editingKey = null;
    this.form = this.getEmptyForm();
  }

  onStatusChange() {
    this.form.active = (this.form.status === 'active' || this.form.status === 'maintenance');
  }

  async saveFeature() {
    let hasError = false;
    if (!this.form.key) {
      this.keyError = true;
      hasError = true;
    }
    if (!this.form.label) {
      this.labelError = true;
      hasError = true;
    }
    if (hasError) return;

    this.onStatusChange();

    try {
      if (this.editingKey) {
        await firstValueFrom(this.adminApi.updateFeature(this.editingKey, this.form));
        this.toastService.showSuccess('Feature updated successfully');
      } else {
        await firstValueFrom(this.adminApi.createFeature(this.form));
        this.toastService.showSuccess('Feature created successfully');
      }
      this.resetForm();
      await this.loadFeatures();
    } catch (e) {
      console.error(e);
      this.toastService.showError('Failed to save feature');
    }
  }

  async deleteFeature(key: string) {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      await firstValueFrom(this.adminApi.deleteFeature(key));
      this.toastService.showSuccess('Feature deleted successfully');
      if (this.editingKey === key) this.resetForm();
      await this.loadFeatures();
    } catch (e) {
      console.error(e);
      this.toastService.showError('Failed to delete feature');
    }
  }
}
