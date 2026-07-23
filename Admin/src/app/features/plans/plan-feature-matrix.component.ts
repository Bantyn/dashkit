import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminApiService,
  FeatureRecord,
  SubscriptionPlanRecord,
} from '../../core/services/admin-api.service';

@Component({
  selector: 'app-plan-feature-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <!-- Header -->
      <button
        (click)="toggle()"
        class="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors rounded-3xl"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
            <i class="bi bi-grid-3x3-gap-fill text-primary-600 text-lg"></i>
          </div>
          <div class="text-left">
            <h3 class="text-lg font-black text-gray-900">Plan Feature Matrix</h3>
            <p class="text-xs text-gray-500">
              Aapke created plans aur features ka complete comparison — dynamic data se
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span
            *ngIf="plans.length"
            class="text-xs font-bold uppercase tracking-widest text-gray-400"
          >
            {{ plans.length }} Plans · {{ features.length }} Features
          </span>
          <i
            class="bi text-gray-400 text-lg transition-transform duration-200"
            [class.bi-chevron-down]="!isExpanded"
            [class.bi-chevron-up]="isExpanded"
          ></i>
        </div>
      </button>

      <!-- Matrix Content -->
      <div *ngIf="isExpanded" class="px-6 pb-6">
        <!-- Loading -->
        <div *ngIf="loading" class="py-12 text-center text-sm text-gray-400">
          <i class="bi bi-arrow-repeat animate-spin text-2xl block mb-2"></i>
          Loading plans & features...
        </div>

        <!-- No Data -->
        <div *ngIf="!loading && (!plans.length || !features.length)" class="py-12 text-center">
          <i class="bi bi-inbox text-4xl text-gray-300 block mb-3"></i>
          <p class="text-sm text-gray-500">
            <span *ngIf="!plans.length">No plans created yet. Create plans first.</span>
            <span *ngIf="plans.length && !features.length"
              >No features created yet. Go to Features page and create features.</span
            >
          </p>
        </div>

        <!-- Data Available -->
        <ng-container *ngIf="!loading && plans.length && features.length">
          <!-- Plan filter tabs -->
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              (click)="activePlanFilter = ''"
              class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border"
              [class.bg-primary-600]="activePlanFilter === ''"
              [class.text-white]="activePlanFilter === ''"
              [class.border-primary-600]="activePlanFilter === ''"
              [class.bg-white]="activePlanFilter !== ''"
              [class.text-gray-600]="activePlanFilter !== ''"
              [class.border-gray-200]="activePlanFilter !== ''"
            >
              All Plans
            </button>
            <button
              *ngFor="let plan of sortedPlans"
              (click)="togglePlanFilter(plan.id)"
              class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border"
              [class.bg-primary-700]="activePlanFilter === plan.id"
              [class.text-white]="activePlanFilter === plan.id"
              [class.border-gray-900]="activePlanFilter === plan.id"
              [class.bg-white]="activePlanFilter !== plan.id"
              [class.text-gray-600]="activePlanFilter !== plan.id"
              [class.border-gray-200]="activePlanFilter !== plan.id"
            >
              {{ plan.name }}
            </button>
          </div>

          <!-- Stats -->
          <div class="grid gap-3 mb-5" [style.grid-template-columns]="'repeat(' + sortedPlans.length + ', 1fr)'">
            <div
              *ngFor="let plan of sortedPlans"
              class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] px-4 py-3 text-center"
            >
              <div class="text-2xl font-black text-gray-900">
                {{ plan.features.length || 0 }}
              </div>
              <div class="text-xs font-bold uppercase tracking-widest text-gray-400">
                {{ plan.name }}
              </div>
              <div class="text-[10px] text-gray-300 mt-0.5">
                {{ formatPrice(plan.monthlyPrice ?? plan.price ?? null) }}
              </div>
            </div>
          </div>

          <!-- Category-wise table -->
          <div *ngFor="let group of filteredGroups" class="mb-6">
            <div
              class="flex items-center gap-2 mb-3 px-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400"
            >
              <span>{{ group.category | titlecase }}</span>
              <span class="flex-1 h-px bg-gray-100"></span>
              <span class="text-primary-600">{{ group.items.length }} features</span>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-gray-100">
              <table class="w-full text-sm min-w-[600px]">
                <thead>
                  <tr class="bg-[var(--bg-page)]">
                    <th class="text-left px-4 py-3 font-bold text-gray-600 w-[35%]">Feature</th>
                    <th
                      *ngFor="let plan of visiblePlans"
                      class="text-center px-3 py-3 font-bold uppercase text-xs tracking-widest text-gray-400"
                    >
                      {{ plan.name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let feature of group.items; let i = index"
                    class="border-t border-gray-50"
                    [class.bg-white]="i % 2 === 0"
                    [class.bg-gray-50]="i % 2 !== 0"
                  >
                    <td class="px-4 py-3">
                      <div class="font-semibold text-gray-900">{{ feature.label }}</div>
                      <div class="text-xs text-gray-400 font-mono">{{ feature.key }}</div>
                    </td>
                    <td *ngFor="let plan of visiblePlans" class="text-center px-3 py-3">
                      <span *ngIf="planHasFeature(plan, feature.key)">
                        <i class="bi bi-check-circle-fill text-green-500 text-base"></i>
                      </span>
                      <span *ngIf="!planHasFeature(plan, feature.key)">
                        <i class="bi bi-x-circle text-gray-300 text-base"></i>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Unassigned Features Warning -->
          <div
            *ngIf="unassignedFeatures.length"
            class="rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <i class="bi bi-exclamation-triangle-fill text-amber-500"></i>
              <span class="text-sm font-bold text-amber-800">
                {{ unassignedFeatures.length }} feature(s) not assigned to any plan
              </span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="let f of unassignedFeatures"
                class="px-3 py-1 rounded-full bg-white text-xs font-semibold text-amber-700 border border-amber-200"
              >
                {{ f.label }} ({{ f.key }})
              </span>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class PlanFeatureMatrixComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  isExpanded = false;
  loading = false;
  activePlanFilter = '';
  plans: SubscriptionPlanRecord[] = [];
  features: FeatureRecord[] = [];

  ngOnInit() {
    // Don't load until expanded (lazy)
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded && !this.plans.length) {
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    let plansLoaded = false;
    let featuresLoaded = false;

    const checkDone = () => {
      if (plansLoaded && featuresLoaded) this.loading = false;
    };

    this.adminApi.getPlans().subscribe({
      next: (res) => {
        this.plans = res.data || [];
        plansLoaded = true;
        checkDone();
      },
      error: () => {
        plansLoaded = true;
        checkDone();
      },
    });

    this.adminApi.getFeatures(false).subscribe({
      next: (res) => {
        this.features = res.data || [];
        featuresLoaded = true;
        checkDone();
      },
      error: () => {
        featuresLoaded = true;
        checkDone();
      },
    });
  }

  get sortedPlans(): SubscriptionPlanRecord[] {
    return [...this.plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  get visiblePlans(): SubscriptionPlanRecord[] {
    if (!this.activePlanFilter) return this.sortedPlans;
    return this.sortedPlans.filter((p) => p.id === this.activePlanFilter);
  }

  get categories(): string[] {
    return Array.from(new Set(this.features.map((f) => f.category)));
  }

  get filteredGroups() {
    return this.categories
      .map((category) => ({
        category,
        items: this.features.filter((f) => f.category === category),
      }))
      .filter((g) => g.items.length > 0);
  }

  get unassignedFeatures(): FeatureRecord[] {
    return this.features.filter((f) => {
      return !this.plans.some((p) => p.features?.includes(f.key));
    });
  }

  planHasFeature(plan: SubscriptionPlanRecord, featureKey: string): boolean {
    return plan.features?.includes(featureKey) || false;
  }

  togglePlanFilter(planId: string) {
    this.activePlanFilter = this.activePlanFilter === planId ? '' : planId;
  }

  formatPrice(value: number | null) {
    return value === null ? 'Custom' : `₹${value}/mo`;
  }
}
