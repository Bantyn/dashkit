import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings-cost-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 xl:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Infrastructure Pricing</h1>
          <p class="text-gray-500 mt-1">Configure operational unit pricing, free-tier thresholds, and provider details.</p>
        </div>
        
        <div class="space-y-6">
          <div class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 max-w-full mx-auto">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Infrastructure Cost Pricing</h2>
            <p class="text-sm text-gray-500">Configure operational unit pricing, free-tier thresholds, and provider details.</p>
          </div>
          <div class="flex gap-2 shrink-0 bg-gray-50 p-1 rounded-xl">
            <button (click)="activeTab = 'pricing'" 
              [class]="'px-6 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ' + (activeTab === 'pricing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')">
              Pricing Matrix
            </button>
            <button (click)="activeTab = 'cost'" 
              [class]="'px-6 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ' + (activeTab === 'cost' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')">
              Cost Protection
            </button>
            <button (click)="activeTab = 'history'" 
              [class]="'px-6 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ' + (activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')">
              Change Log History
            </button>
          </div>
        </div>

        <!-- Tab: Pricing Matrix -->
        <div *ngIf="activeTab === 'pricing'" class="space-y-6 animate-fade-in">
          <div *ngIf="loading" class="py-20 text-center text-gray-400">
            <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
            <p class="text-sm font-semibold text-gray-500">Fetching pricing configurations...</p>
          </div>

          <div *ngIf="!loading && services.length === 0" class="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50 shadow-sm">
            <i class="bi bi-folder-x text-gray-300 text-4xl mb-2 inline-block"></i>
            <p class="text-sm font-semibold text-gray-500">No services found.</p>
          </div>

          <div *ngIf="!loading && services.length > 0" class="space-y-4">
            <div class="overflow-x-auto border border-gray-100 rounded-[16px] bg-white shadow-sm">
              <table class="w-full text-left text-sm border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100 tracking-wider">
                    <th class="py-5 px-6">Provider & Service</th>
                    <th class="py-5 px-6">Category</th>
                    <th class="py-5 px-6">Billing Unit</th>
                    <th class="py-5 px-6">Free Quota</th>
                    <th class="py-5 px-6">Price</th>
                    <th class="py-5 px-6">Source</th>
                    <th class="py-5 px-6 text-center">Version</th>
                    <th class="py-5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <ng-container *ngFor="let s of services">
                    <!-- Normal Row -->
                    <tr *ngIf="editingServiceId !== s.id" class="hover:bg-gray-50/50 transition-colors">
                      <td class="py-5 px-6">
                        <div class="font-bold text-gray-900 text-sm">{{ s.name }}</div>
                        <div class="text-xs text-gray-400 font-mono mt-0.5">{{ s.provider }} - {{ s.service }}</div>
                      </td>
                      <td class="py-5 px-6 text-gray-600 font-medium">{{ s.category }}</td>
                      <td class="py-5 px-6 text-gray-600 font-medium capitalize">{{ formatUnit(s.unit) }} ({{ s.billingType }})</td>
                      <td class="py-5 px-6 font-semibold text-gray-700">
                        {{ s.freeQuota | number }} <span class="text-xs font-normal text-gray-400">/ {{ s.freeQuotaPeriod }}</span>
                      </td>
                      <td class="py-5 px-6 font-extrabold text-gray-900">
                        {{ s.currency === 'USD' ? '$' : '₹' }}{{ s.price | number:'1.2-4' }}
                      </td>
                      <td class="py-5 px-6">
                        <a *ngIf="s.officialDocumentation && s.officialDocumentation !== 'N/A'" [href]="s.officialDocumentation" target="_blank" class="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1">
                          <i class="bi bi-link-45deg"></i> Verified
                        </a>
                        <span *ngIf="!s.officialDocumentation || s.officialDocumentation === 'N/A'" class="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-bold">Unverified</span>
                      </td>
                      <td class="py-5 px-6 text-center">
                        <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold" [title]="'Last Verified: ' + (s.verifiedAt | date)">v{{ s.version }}</span>
                      </td>
                      <td class="py-5 px-6 text-right">
                        <button (click)="startEdit(s)" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer hover:bg-gray-50 hover:text-gray-900">
                          Edit
                        </button>
                      </td>
                    </tr>

                    <!-- Editing Row -->
                    <tr *ngIf="editingServiceId === s.id" class="bg-gray-50/50">
                      <td class="py-5 px-6">
                        <div class="font-bold text-gray-900">{{ s.name }}</div>
                        <div class="text-[10px] text-gray-400 font-mono">{{ s.service }}</div>
                      </td>
                      <td class="py-5 px-6">
                        <input type="text" [(ngModel)]="editForm.category" class="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white">
                      </td>
                      <td class="py-5 px-6">
                        <input type="text" [(ngModel)]="editForm.unit" class="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white mb-1">
                        <select [(ngModel)]="editForm.billingType" class="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white">
                          <option value="usage">Usage</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </td>
                      <td class="py-5 px-6 space-y-1">
                        <input type="number" [(ngModel)]="editForm.freeQuota" class="w-24 text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white font-semibold">
                        <select [(ngModel)]="editForm.freeQuotaPeriod" class="w-24 block text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white">
                          <option value="monthly">Monthly</option>
                          <option value="daily">Daily</option>
                          <option value="lifetime">Lifetime</option>
                          <option value="none">None</option>
                        </select>
                      </td>
                      <td class="py-5 px-6 space-y-1">
                        <div class="flex items-center gap-1">
                          <select [(ngModel)]="editForm.currency" class="w-16 text-xs px-2 py-2 rounded-lg border border-gray-300 bg-white">
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                          </select>
                          <input type="number" step="0.0001" [(ngModel)]="editForm.price" class="w-20 text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-gray-900 bg-white font-bold">
                        </div>
                      </td>
                      <td class="py-5 px-6">
                        <input type="text" [(ngModel)]="editForm.officialDocumentation" placeholder="Official Source URL" class="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none bg-white">
                      </td>
                      <td class="py-5 px-6 text-center"><span class="text-gray-400 text-xs font-bold">v{{ s.version }}</span></td>
                      <td class="py-5 px-6 text-right space-x-2 whitespace-nowrap">
                        <button (click)="saveEdit()" [disabled]="saving" class="px-4 py-2 bg-primary-700 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer">
                          {{ saving ? 'Saving...' : 'Save' }}
                        </button>
                        <button (click)="cancelEdit()" [disabled]="saving" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer hover:bg-gray-50">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab: Change Log History -->
        <div *ngIf="activeTab === 'history'" class="space-y-6 animate-fade-in">
          <div *ngIf="historyLoading" class="py-20 text-center text-gray-400">
            <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
            <p class="text-sm font-semibold text-gray-500">Fetching revision log...</p>
          </div>

          <div *ngIf="!historyLoading && history.length === 0" class="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50 shadow-sm">
            <i class="bi bi-clock-history text-gray-300 text-4xl mb-2 inline-block"></i>
            <p class="text-sm font-semibold text-gray-500">No revisions logged yet.</p>
          </div>

          <div *ngIf="!historyLoading && history.length > 0" class="space-y-4">
            <div *ngFor="let log of history" class="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-5 hover:border-gray-200 transition-colors">
              <div class="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 shrink-0 font-extrabold text-sm border border-gray-100">
                v{{ log.version }}
              </div>
              <div class="flex-1">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <span class="text-base font-bold text-gray-900">{{ log.name }}</span>
                  <span class="text-xs text-gray-400 font-semibold flex items-center"><i class="bi bi-clock mr-1.5"></i>{{ log.updatedAt | date:'medium' }}</span>
                </div>
                <p class="text-sm text-gray-500 leading-relaxed mb-4">
                  Unit pricing adjusted from <strong class="text-gray-700 font-semibold">{{ log.oldPrice | number:'1.2-4' }}</strong> to <strong class="text-gray-900 font-bold">{{ log.newPrice | number:'1.2-4' }}</strong>, 
                  and free quota limit from <strong class="text-gray-700 font-semibold">{{ log.oldFreeQuota | number }}</strong> to <strong class="text-gray-900 font-bold">{{ log.newFreeQuota | number }}</strong>.
                </p>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Author:</span>
                  <span class="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold border border-gray-100">{{ log.updatedBy }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Cost Protection -->
        <div *ngIf="activeTab === 'cost'" class="space-y-6 animate-fade-in">
          <div *ngIf="costLoading" class="py-20 text-center text-gray-400">
            <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
            <p class="text-sm font-semibold text-gray-500">Fetching cost settings...</p>
          </div>

          <div *ngIf="!costLoading" class="max-w-xl space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-950 mb-1">Firestore Cost Protection Rules</h3>
              <p class="text-sm text-gray-500">Set limits on maximum allowed Firestore reads per transaction to prevent billing spikes.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div class="space-y-2">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Safe Reads Threshold</label>
                <input type="number" [(ngModel)]="costForm.safeReads" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white font-semibold" />
                <p class="text-[10px] text-gray-400">Reads &lt;= this value are considered safe.</p>
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Warning Reads Threshold</label>
                <input type="number" [(ngModel)]="costForm.warningReads" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white font-semibold" />
                <p class="text-[10px] text-gray-400">Reads between Safe and Warning will trigger indicators.</p>
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">High Reads Threshold</label>
                <input type="number" [(ngModel)]="costForm.highReads" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white font-semibold" />
                <p class="text-[10px] text-gray-400">Reads between Warning and High will require confirmation.</p>
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Critical Reads Threshold</label>
                <input type="number" [(ngModel)]="costForm.criticalReads" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white font-semibold" />
                <p class="text-[10px] text-gray-400">Reads exceeding this value will block automatically and require explicit typing confirmation.</p>
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <button (click)="saveCostSettings()" [disabled]="costSaving" class="px-6 py-3 bg-primary-700 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50">
                {{ costSaving ? 'Saving Thresholds...' : 'Save Configuration' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SettingsCostPricingComponent implements OnInit {
  activeTab = 'pricing';
  services: any[] = [];
  history: any[] = [];
  loading = true;
  historyLoading = true;
  saving = false;
  
  costLoading = true;
  costSaving = false;
  costForm: any = {
    safeReads: 50,
    warningReads: 150,
    highReads: 300,
    criticalReads: 500,
  };

  editingServiceId: string | null = null;
  editForm: any = {};

  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  ngOnInit() {
    this.fetchPricing();
    this.fetchHistory();
    this.fetchCostSettings();
  }

  fetchPricing() {
    this.loading = true;
    this.api.getPlatformCostsPricing().subscribe({
      next: (res) => {
        this.services = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to fetch pricing settings.');
      }
    });
  }

  fetchHistory() {
    this.historyLoading = true;
    this.api.getPlatformCostsPricingHistory().subscribe({
      next: (res) => {
        this.history = res.data || [];
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
      }
    });
  }

  formatUnit(unit: string): string {
    if (!unit) return '';
    return unit.replace(/_/g, ' ');
  }

  startEdit(service: any) {
    this.editingServiceId = service.id;
    this.editForm = { ...service };
  }

  cancelEdit() {
    this.editingServiceId = null;
    this.editForm = {};
  }

  saveEdit() {
    this.saving = true;
    this.api.updatePlatformCostsPricing(this.editForm).subscribe({
      next: () => {
        this.saving = false;
        this.editingServiceId = null;
        this.toast.showSuccess('Pricing settings versioned and updated successfully.');
        this.fetchPricing();
        this.fetchHistory();
      },
      error: () => {
        this.saving = false;
        this.toast.showError('Failed to update pricing settings.');
      }
    });
  }

  fetchCostSettings() {
    this.costLoading = true;
    this.api.getPlatformCostSettings().subscribe({
      next: (res) => {
        if (res.data) {
          this.costForm = { ...res.data };
        }
        this.costLoading = false;
      },
      error: () => {
        this.costLoading = false;
        this.toast.showError('Failed to load cost protection thresholds.');
      }
    });
  }

  saveCostSettings() {
    this.costSaving = true;
    this.api.updatePlatformCostSettings(this.costForm).subscribe({
      next: () => {
        this.costSaving = false;
        this.toast.showSuccess('Cost protection thresholds updated successfully.');
        this.fetchCostSettings();
      },
      error: () => {
        this.costSaving = false;
        this.toast.showError('Failed to save cost protection thresholds.');
      }
    });
  }
}
