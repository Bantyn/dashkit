import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AdminApiService,
  FeatureRecord,
  SubscriptionPlanRecord,
} from '../../core/services/admin-api.service';
import { PlanFeatureMatrixComponent } from './plan-feature-matrix.component';

type LimitField = {
  key: string;
  label: string;
  hint: string;
};

type ModuleGroup = {
  category: string;
  label: string;
  icon: string;
  color: string;
  items: FeatureRecord[];
  expanded: boolean;
};

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, PlanFeatureMatrixComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Subscription Plans</h2>
            <p class="text-xs text-gray-500 mt-1">Manage pricing plans and features</p>
          </div>
          <div class="flex items-center gap-2">
             <button
               type="button" 
               (click)="resetForm()"
               class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-primary-700 hover:shadow-md transition-all flex items-center gap-2"
             >
               <i class="bi bi-plus-lg"></i>
               New Plan
             </button>
          </div>
        </div>

        <!-- Right Header (Form) -->
        <div class="w-[40%] xl:w-[550px] min-w-[350px] px-6 py-5 border-l border-gray-200 flex justify-between items-center shrink-0 bg-white">
          <div>
            <h3 class="text-lg font-bold text-gray-900">
              {{ editingId ? 'Edit Plan' : 'Create Plan' }}
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              {{ editingId ? 'Update existing plan details' : 'Configure a new subscription plan' }}
            </p>
          </div>
          <button type="button" (click)="savePlan()" [disabled]="!form.id || !form.name" class="px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-black transition-all disabled:opacity-50">
            Save
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Left Panel Content (List & Matrix) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
            <!-- Plan Feature Matrix Reference -->
            <app-plan-feature-matrix></app-plan-feature-matrix>

            <!-- Plans List -->
            <section class="space-y-4">
              <div
                *ngFor="let plan of plans"
                class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                [class.ring-2]="editingId === plan.id"
                [class.ring-primary-500]="editingId === plan.id"
              >
                <!-- Plan Card Header -->
                <div class="flex items-start justify-between border-b border-gray-50 pb-4">
                  <div class="flex items-center gap-4">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-2xl font-black text-white shadow-sm"
                      [ngStyle]="{
                        background:
                          plan.id === 'free'
                            ? '#94a3b8'
                            : plan.id === 'plus'
                            ? '#3b82f6'
                            : plan.id === 'pro'
                            ? '#8b5cf6'
                            : '#10b981'
                      }"
                    >
                      {{ plan.name.charAt(0) | uppercase }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="font-black text-gray-900">{{ plan.name }}</h3>
                        <span
                          *ngIf="plan.featured"
                          class="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600"
                        >
                          Featured
                        </span>
                      </div>
                      <div class="text-xs text-gray-500">{{ plan.description }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-black text-gray-900">
                      {{ formatPrice(plan.monthlyPrice ?? plan.price ?? null) }}
                    </div>
                    <div class="text-xs text-gray-400">{{ plan.id | uppercase }}</div>
                  </div>
                </div>

                <!-- Module-wise feature breakdown -->
                <div class="mt-4 space-y-2">
                  <div *ngFor="let mod of getModuleBreakdownForPlan(plan)" class="flex items-start gap-2">
                    <div
                      class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px]"
                      [style.background]="mod.color + '18'"
                      [style.color]="mod.color"
                    >
                      <i class="bi" [ngClass]="mod.icon"></i>
                    </div>
                    <div>
                      <span class="text-xs font-bold text-gray-700">{{ mod.label }}</span>
                      <span class="text-xs text-gray-400"> — {{ mod.count }} features</span>
                      <div class="flex flex-wrap gap-1 mt-0.5">
                        <span
                          *ngFor="let f of mod.features"
                          class="rounded-full bg-[var(--bg-page)] px-2 py-0.5 text-[10px] font-semibold text-gray-500"
                        >
                          {{ f }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Limits -->
                <div class="mt-5 grid gap-3 grid-cols-2 xl:grid-cols-3" *ngIf="plan.limits">
                  <div
                    *ngFor="let field of limitFields"
                    class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3"
                  >
                    <div class="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                      {{ field.label }}
                    </div>
                    <div class="mt-1 font-semibold text-sm text-gray-700">
                      {{ formatLimit(plan.limits[field.key]) }}
                    </div>
                  </div>
                  <!-- Storage Limit -->
                  <div class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3">
                    <div class="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                      Included Storage
                    </div>
                    <div class="mt-1 font-semibold text-sm text-gray-700">
                      {{ plan.storageDisplay || '500 MB' }}
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="mt-5 flex gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    (click)="editPlan(plan)"
                    class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    (click)="removePlan(plan)"
                    class="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Right Panel (Edit Form) -->
        <div class="w-[40%] xl:w-[550px] min-w-[350px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white space-y-6">
            
            <div class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <input
                  [(ngModel)]="form.id"
                  placeholder="Plan ID (e.g. free, plus, pro)"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  [disabled]="!!editingId"
                />
                <input
                  [(ngModel)]="form.name"
                  placeholder="Plan name"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              <textarea
                [(ngModel)]="form.description"
                placeholder="Description"
                class="min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              ></textarea>

              <div class="grid gap-4 md:grid-cols-3">
                <input
                  [(ngModel)]="form.monthlyPrice"
                  type="number"
                  placeholder="Monthly price"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <input
                  [(ngModel)]="form.yearlyPrice"
                  type="number"
                  placeholder="Yearly price"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <input
                  [(ngModel)]="form.sortOrder"
                  type="number"
                  placeholder="Sort order"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <input
                  [(ngModel)]="form.badge"
                  placeholder="Badge"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <input
                  [(ngModel)]="form.targetAudience"
                  placeholder="Target audience"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <input
                  [(ngModel)]="form.capabilityLabel"
                  placeholder="Capability label"
                  class="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <!-- MODULE-WISE FEATURE SELECTION (Hierarchical) -->
            <div class="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <div class="flex items-center justify-between gap-4 mb-4">
                <div>
                  <div class="text-sm font-black text-gray-900">
                    <i class="bi bi-grid-3x3-gap-fill mr-1 text-primary-600"></i>
                    Features
                  </div>
                </div>
                <div class="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                  {{ selectedFeatures.length }} / {{ totalFeatureCount }}
                </div>
              </div>

              <div class="space-y-3" *ngIf="moduleGroups.length; else noFeatures">
                <!-- Module Card (Accordion) -->
                <div
                  *ngFor="let mod of moduleGroups"
                  class="overflow-hidden rounded-xl border bg-white transition-shadow"
                  [class.border-gray-100]="!expandedModules[mod.category]"
                  [class.border-primary-200]="expandedModules[mod.category]"
                  [class.shadow-md]="expandedModules[mod.category]"
                >
                  <!-- Module Header -->
                  <button
                    type="button"
                    (click)="toggleModuleExpand(mod.category)"
                    class="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                  >
                    <div
                      class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                      [style.background]="mod.color + '18'"
                      [style.color]="mod.color"
                    >
                      <i class="bi" [ngClass]="mod.icon" style="font-size: 14px"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-black text-gray-900">{{ mod.label }}</div>
                      <div class="text-[10px] text-gray-400 mt-0.5">
                        {{ getModuleSelectedCount(mod) }} of {{ mod.items.length }} selected
                      </div>
                    </div>
                    <!-- Select All toggle -->
                    <label
                      class="flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                      [class.bg-primary-50]="isModuleFullySelected(mod)"
                      [class.text-primary-700]="isModuleFullySelected(mod)"
                      [class.border-primary-200]="isModuleFullySelected(mod)"
                      [class.bg-white]="!isModuleFullySelected(mod)"
                      [class.text-gray-400]="!isModuleFullySelected(mod)"
                      [class.border-gray-200]="!isModuleFullySelected(mod)"
                      (click)="$event.stopPropagation()"
                    >
                      <input
                        type="checkbox"
                        [checked]="isModuleFullySelected(mod)"
                        [indeterminate]="isModulePartiallySelected(mod)"
                        (change)="toggleModuleAll(mod)"
                        class="accent-primary-600"
                      />
                      All
                    </label>
                    <i
                      class="bi text-gray-400 text-xs transition-transform duration-200 ml-1"
                      [class.bi-chevron-down]="!expandedModules[mod.category]"
                      [class.bi-chevron-up]="expandedModules[mod.category]"
                    ></i>
                  </button>

                  <!-- Module Feature Checkboxes -->
                  <div *ngIf="expandedModules[mod.category]" class="border-t border-gray-100 bg-gray-50/30 px-3 py-3">
                    <div class="grid gap-2 grid-cols-1 sm:grid-cols-2">
                      <label
                        *ngFor="let feature of mod.items"
                        class="group relative flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-primary-300 hover:shadow-sm"
                        [class.border-primary-200]="isFeatureSelected(feature.key)"
                        [class.bg-primary-50]="isFeatureSelected(feature.key)"
                      >
                        <div class="flex h-5 items-center">
                          <input
                            type="checkbox"
                            [checked]="isFeatureSelected(feature.key)"
                            (change)="toggleFeature(feature.key)"
                            class="h-4 w-4 rounded border-gray-300 accent-primary-600"
                          />
                        </div>
                        <div class="flex-1">
                          <div
                            class="text-xs font-bold text-gray-900 group-hover:text-primary-700"
                            [class.text-primary-900]="isFeatureSelected(feature.key)"
                          >
                            {{ feature.label }}
                          </div>
                          <div class="text-[10px] text-gray-400 mt-0.5 leading-tight">
                            {{ feature.description || feature.key }}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noFeatures>
                <div class="rounded-xl border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                  Loading features...
                </div>
              </ng-template>
            </div>

            <!-- STORAGE CONFIGURATION -->
            <div class="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <div class="text-sm font-black text-gray-900 mb-4">
                <i class="bi bi-cloud-arrow-up mr-1 text-primary-600"></i>
                Storage Configuration
              </div>
              <div class="space-y-4">
                <div class="flex gap-4">
                  <div class="flex-1">
                    <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Included Storage Value
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="storageValue"
                      (ngModelChange)="onStorageValueChange()"
                      placeholder="e.g. 500 or 2"
                      min="0"
                      class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div class="w-32">
                    <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Storage Unit
                    </label>
                    <select
                      [(ngModel)]="storageUnit"
                      (ngModelChange)="onStorageValueChange()"
                      class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    >
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                </div>
                <!-- Live Preview -->
                <div class="text-xs text-gray-500 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                  <span>Live Preview:</span>
                  <span class="font-bold text-primary-600">{{ getLivePreviewDisplay() }}</span>
                </div>
              </div>
            </div>

            <!-- LIMITS CONFIGURATION -->
            <div class="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <div class="text-sm font-black text-gray-900 mb-4">
                <i class="bi bi-speedometer2 mr-1 text-primary-600"></i>
                Usage Limits
              </div>
              <div class="grid gap-3 grid-cols-2">
                <div *ngFor="let field of limitFields">
                  <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {{ field.label }}
                  </label>
                  <input
                    [(ngModel)]="limitValues[field.key]"
                    [placeholder]="field.hint"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                  <div class="mt-1 text-[10px] text-gray-400">Leave blank for unlimited</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminPlansComponent {
  private readonly adminApi = inject(AdminApiService);

  /** Module display configuration — category label, icon, color */
  private readonly MODULE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    inventory:    { label: 'Inventory Management',  icon: 'bi-box-seam-fill',       color: '#3b82f6' },
    selling:      { label: 'Selling & Billing',     icon: 'bi-receipt-cutoff',      color: '#16a34a' },
    website:      { label: 'Website & Storefront',  icon: 'bi-globe2',              color: '#8b5cf6' },
    core:         { label: 'Core System',           icon: 'bi-cpu-fill',            color: '#6b7280' },
    customers:    { label: 'Customer Management',   icon: 'bi-people-fill',         color: '#3b82f6' },
    staff:        { label: 'Staff & HR',            icon: 'bi-person-badge-fill',   color: '#10b981' },
    finance:      { label: 'Finance & Expenses',    icon: 'bi-cash-coin',           color: '#f59e0b' },
    accounting:   { label: 'Double-Entry Accounting', icon: 'bi-journal-bookmark-fill', color: '#6366f1' },
    crm:          { label: 'CRM & Loyalty Program', icon: 'bi-heart-fill',          color: '#ec4899' },
    analytics:    { label: 'Analytics & Reports',   icon: 'bi-bar-chart-line-fill', color: '#ec4899' },
    marketing:    { label: 'Marketing & Promotions', icon: 'bi-megaphone-fill',     color: '#ef4444' },
    integrations: { label: 'Third-Party Integrations', icon: 'bi-plugin',           color: '#06b6d4' },
    shipping:     { label: 'Shipping & Delivery',   icon: 'bi-truck',               color: '#06b6d4' },
    enterprise:   { label: 'Enterprise Features',   icon: 'bi-building-fill',       color: '#ea580c' },
  };

  readonly limitFields: LimitField[] = [
    { key: 'orders_per_month', label: 'Orders / Month', hint: 'e.g. 50' },
    { key: 'sms_per_month', label: 'SMS / Month', hint: 'e.g. 100' },
    { key: 'staff_count', label: 'Staff Count', hint: 'e.g. 5' },
    { key: 'branch_count', label: 'Branch Count', hint: 'e.g. 1' },
    { key: 'products_count', label: 'Products Count', hint: 'e.g. 5000' },
    { key: 'invoices_per_month', label: 'Invoices / Month', hint: 'e.g. 500' },
  ];

  plans: SubscriptionPlanRecord[] = [];
  features: FeatureRecord[] = [];
  editingId: string | null = null;
  selectedFeatures: string[] = [];
  limitationsInput = '';
  limitValues: Record<string, string> = {};
  expandedModules: Record<string, boolean> = {};
  storageValue = 500;
  storageUnit: 'MB' | 'GB' = 'MB';

  toggleModuleExpand(category: string): void {
    this.expandedModules[category] = !this.expandedModules[category];
  }

  form: Partial<SubscriptionPlanRecord> = {
    id: '',
    code: '',
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: '',
    targetAudience: '',
    capabilityLabel: '',
    active: true,
    featured: false,
    sortOrder: 1,
  };

  constructor() {
    this.resetLimitValues();
    this.loadFeatures();
    this.loadPlans();
  }

  // ────── Module Groups (Hierarchical) ──────

  get moduleGroups(): ModuleGroup[] {
    const categories = Array.from(new Set(this.features.map((f) => f.category)));
    // Sort by MODULE_CONFIG order
    const order = Object.keys(this.MODULE_CONFIG);
    return categories
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map((category) => {
        const config = this.MODULE_CONFIG[category] || {
          label: category.charAt(0).toUpperCase() + category.slice(1),
          icon: 'bi-grid-fill',
          color: '#6b7280',
        };
        return {
          category,
          label: config.label,
          icon: config.icon,
          color: config.color,
          items: this.features.filter((f) => f.category === category),
          expanded: false,
        };
      });
  }

  get totalFeatureCount(): number {
    return this.features.length;
  }

  // ────── Module-level helpers ──────

  getModuleSelectedCount(mod: ModuleGroup): number {
    return mod.items.filter((f) => this.selectedFeatures.includes(f.key)).length;
  }

  getModuleSelectedPercent(mod: ModuleGroup): number {
    if (!mod.items.length) return 0;
    return Math.round((this.getModuleSelectedCount(mod) / mod.items.length) * 100);
  }

  isModuleFullySelected(mod: ModuleGroup): boolean {
    return mod.items.length > 0 && mod.items.every((f) => this.selectedFeatures.includes(f.key));
  }

  isModulePartiallySelected(mod: ModuleGroup): boolean {
    const count = this.getModuleSelectedCount(mod);
    return count > 0 && count < mod.items.length;
  }

  toggleModuleAll(mod: ModuleGroup): void {
    if (this.isModuleFullySelected(mod)) {
      // Deselect all features in this module
      const moduleKeys = new Set(mod.items.map((f) => f.key));
      this.selectedFeatures = this.selectedFeatures.filter((key) => !moduleKeys.has(key));
    } else {
      // Select all features in this module
      const existingKeys = new Set(this.selectedFeatures);
      mod.items.forEach((f) => existingKeys.add(f.key));
      this.selectedFeatures = Array.from(existingKeys);
    }
  }

  // ────── Feature-level helpers ──────

  isFeatureSelected(key: string): boolean {
    return this.selectedFeatures.includes(key);
  }

  toggleFeature(key: string): void {
    this.selectedFeatures = this.isFeatureSelected(key)
      ? this.selectedFeatures.filter((item) => item !== key)
      : [...this.selectedFeatures, key];
  }

  // ────── Plan card — module breakdown ──────

  getModuleBreakdownForPlan(
    plan: SubscriptionPlanRecord,
  ): { label: string; icon: string; color: string; count: number; features: string[] }[] {
    if (!plan.features?.length) return [];

    const featureMap = new Map<string, FeatureRecord>();
    this.features.forEach((f) => featureMap.set(f.key, f));

    const categorized: Record<string, string[]> = {};
    for (const key of plan.features) {
      const f = featureMap.get(key);
      const cat = f?.category || 'unknown';
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(f?.label || key);
    }

    const order = Object.keys(this.MODULE_CONFIG);
    return Object.entries(categorized)
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([cat, featureLabels]) => {
        const config = this.MODULE_CONFIG[cat] || { label: cat, icon: 'bi-grid-fill', color: '#6b7280' };
        return {
          label: config.label,
          icon: config.icon,
          color: config.color,
          count: featureLabels.length,
          features: featureLabels,
        };
      });
  }

  // ────── Data loading ──────

  loadPlans(): void {
    this.adminApi.getPlans().subscribe((response) => {
      this.plans = response.data || [];
    });
  }

  loadFeatures(): void {
    this.adminApi.getFeatures(true).subscribe((response) => {
      this.features = response.data || [];
    });
  }

  // ────── Form helpers ──────

  resetLimitValues(): void {
    this.limitValues = this.limitFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = '';
      return acc;
    }, {});
  }

  resetForm(): void {
    this.editingId = null;
    this.selectedFeatures = [];
    this.limitationsInput = '';
    this.resetLimitValues();
    this.storageValue = 500;
    this.storageUnit = 'MB';
    this.form = {
      id: '',
      code: '',
      name: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      badge: '',
      targetAudience: '',
      capabilityLabel: '',
      active: true,
      featured: false,
      sortOrder: 1,
      includedStorageMB: 500,
      storageUnit: 'MB'
    };
  }

  setLimitValue(key: string, value: string | number | null): void {
    this.limitValues[key] = value === null || value === undefined ? '' : String(value);
  }

  editPlan(plan: SubscriptionPlanRecord): void {
    this.editingId = plan.id;
    this.form = {
      ...plan,
      code: plan.code || plan.id,
      monthlyPrice: plan.monthlyPrice ?? plan.price ?? 0,
    };
    this.selectedFeatures = [...(plan.features || [])];
    this.limitationsInput = (plan.limitations || []).join('\n');
    this.resetLimitValues();
    Object.entries(plan.limits || {}).forEach(([key, value]) => {
      this.limitValues[key] = value === null || value === undefined ? '' : String(value);
    });

    // Populate storage configuration
    this.storageUnit = plan.storageUnit || 'MB';
    const mb = plan.includedStorageMB ?? 500;
    if (this.storageUnit === 'GB') {
      this.storageValue = Number((mb / 1024).toFixed(2).replace(/\.00$/, ''));
    } else {
      this.storageValue = mb;
    }
  }

  onStorageValueChange() {
    if (this.storageValue < 0) {
      this.storageValue = 0;
    }
    if (this.storageUnit === 'GB') {
      this.form.includedStorageMB = this.storageValue * 1024;
    } else {
      this.form.includedStorageMB = this.storageValue;
    }
    this.form.storageUnit = this.storageUnit;
  }

  getLivePreviewDisplay(): string {
    if (this.storageValue === null || this.storageValue === undefined || this.storageValue < 0) {
      return '0 MB';
    }
    if (this.storageUnit === 'GB') {
      const mbValue = this.storageValue * 1024;
      return `${this.storageValue} GB (${mbValue} MB)`;
    } else {
      const gbValue = (this.storageValue / 1024).toFixed(2).replace(/\.00$/, '');
      return `${this.storageValue} MB (${gbValue} GB)`;
    }
  }

  buildLimitsPayload(): Record<string, number | null> {
    return this.limitFields.reduce<Record<string, number | null>>((acc, field) => {
      const raw = this.limitValues[field.key]?.trim();
      acc[field.key] = raw === '' ? null : Number(raw);
      return acc;
    }, {});
  }

  formatPrice(value: number | null): string {
    return value === null ? 'Custom Pricing' : `Rs ${value}`;
  }

  formatLimit(value: number | null | undefined): string | number {
    return value === null || value === undefined ? 'Unlimited' : value;
  }

  async savePlan(): Promise<void> {
    const id = this.form.id?.trim();
    const name = this.form.name?.trim();

    if (!id || !name) {
      return;
    }

    const monthlyPrice =
      this.form.monthlyPrice === null || this.form.monthlyPrice === undefined
        ? null
        : Number(this.form.monthlyPrice);
    const yearlyPrice =
      this.form.yearlyPrice === null || this.form.yearlyPrice === undefined
        ? null
        : Number(this.form.yearlyPrice);

    // Make sure we have the latest storage config on save
    this.onStorageValueChange();

    const payload = {
      id,
      code: this.form.code?.trim() || id,
      name,
      description: this.form.description?.trim() || '',
      price: monthlyPrice,
      monthlyPrice,
      yearlyPrice,
      badge: this.form.badge?.trim() || '',
      targetAudience: this.form.targetAudience?.trim() || '',
      capabilityLabel: this.form.capabilityLabel?.trim() || '',
      active: this.form.active !== false,
      featured: this.form.featured === true,
      sortOrder: Number(this.form.sortOrder || 1),
      features: this.selectedFeatures,
      limits: this.buildLimitsPayload(),
      limitations: this.limitationsInput
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      includedStorageMB: Number(this.form.includedStorageMB ?? 500),
      storageUnit: this.storageUnit
    };

    if (this.editingId) {
      await firstValueFrom(this.adminApi.updatePlan(this.editingId, payload));
    } else {
      await firstValueFrom(this.adminApi.createPlan(payload));
    }

    this.resetForm();
    this.loadPlans();
  }

  async removePlan(plan: SubscriptionPlanRecord): Promise<void> {
    if (!confirm(`Delete plan ${plan.name}?`)) {
      return;
    }

    await firstValueFrom(this.adminApi.deletePlan(plan.id));
    this.loadPlans();
  }
}
