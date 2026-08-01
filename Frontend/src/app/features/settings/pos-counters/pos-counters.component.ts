import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfflinePosService, OfflinePosCounter, CounterCredentialsResult } from '../../../core/services/offline-pos.service';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { FeatureGuardService } from '../../../core/services/feature-guard.service';
import { BranchService, Branch } from '../../../core/services/branch.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

@Component({
  selector: 'app-pos-counters',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-primary-50 flex flex-col overflow-hidden">
      <!-- Top Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span class="p-2 bg-primary-100 text-primary-600 rounded-xl text-lg">
              <i class="bi bi-display"></i>
            </span>
            Offline POS Counters
          </h2>
          <p class="text-xs text-gray-500 mt-0.5">
            Authorize and manage offline desktop POS applications using secure device API credentials.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="loadCounters()"
            class="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh Counters"
          >
            <i class="bi bi-arrow-clockwise text-base"></i>
          </button>
          
          <button
            (click)="openAddModal()"
            [disabled]="isLimitReached || !hasFeature"
            class="px-4 py-2 bg-primary-600 text-white font-semibold text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <i class="bi bi-plus-lg"></i>
            <span>+ Add POS Counter</span>
          </button>
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-6">

        <!-- Locked / Upgrade Banner if Feature Gated -->
        @if (!hasFeature && !loading) {
          <div class="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
                <i class="bi bi-lock-fill"></i>
              </div>
              <div>
                <h3 class="font-semibold text-lg">Offline POS Counters Add-On Locked</h3>
                <p class="text-xs text-white/90 mt-1">
                  Your current subscription plan does not include Offline POS Counters. Upgrade your plan to authorize multiple desktop POS devices.
                </p>
              </div>
            </div>
            <a
              href="/subscription/plans"
              class="px-5 py-2.5 bg-white text-orange-700 font-semibold rounded-xl text-xs hover:bg-orange-50 transition-colors shrink-0 shadow-sm"
            >
              Upgrade Subscription
            </a>
          </div>
        }

        <!-- Limit Reached Alert -->
        @if (hasFeature && isLimitReached && !loading) {
          <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center justify-between text-xs font-medium">
            <div class="flex items-center gap-2">
              <i class="bi bi-exclamation-triangle-fill text-amber-600 text-base"></i>
              <span>You have reached your limit of <strong>{{ counterLimit }}</strong> Offline POS Counter(s). Purchase additional add-on counters to add more devices.</span>
            </div>
            <a href="/subscription/plans" class="underline font-semibold text-amber-900">Get Additional Counters</a>
          </div>
        }

        @if (loading) {
          <div class="flex justify-center p-16">
            <app-ui-loading size="lg"></app-ui-loading>
          </div>
        } @else if (hasFeature) {
          <!-- Stats Summary Bar -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl shrink-0">
                <i class="bi bi-display"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Total Registered</p>
                <h4 class="text-xl font-semibold text-gray-900 mt-0.5">{{ counters.length }}</h4>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <i class="bi bi-wifi"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Online Devices</p>
                <h4 class="text-xl font-semibold text-emerald-600 mt-0.5">{{ onlineCount }}</h4>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl shrink-0">
                <i class="bi bi-shield-check"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Active Counters</p>
                <h4 class="text-xl font-semibold text-gray-900 mt-0.5">{{ activeCount }}</h4>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div class="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl shrink-0">
                <i class="bi bi-speedometer2"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Plan Limit</p>
                <h4 class="text-xl font-semibold text-primary-700 mt-0.5">
                  {{ counterLimit === null || counterLimit === -1 ? 'Unlimited' : counters.length + ' / ' + counterLimit }}
                </h4>
              </div>
            </div>
          </div>

          <!-- Registered POS Counters Table -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h3 class="font-semibold text-gray-900 text-sm">Authorized Desktop Devices</h3>
              <span class="text-xs text-gray-500 font-medium">{{ counters.length }} device(s)</span>
            </div>

            @if (counters.length === 0) {
              <div class="p-12 text-center text-gray-400">
                <div class="w-16 h-16 rounded-full bg-primary-50 text-primary-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                  <i class="bi bi-desktop"></i>
                </div>
                <h4 class="font-semibold text-gray-700 text-base">No POS Counters Registered</h4>
                <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Click "+ Add POS Counter" above to generate secure API credentials for your offline Electron desktop app.
                </p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th class="py-3 px-5">Counter Name</th>
                      <th class="py-3 px-4">Counter ID</th>
                      <th class="py-3 px-4">API Key (Public)</th>
                      <th class="py-3 px-4">Device Status</th>
                      <th class="py-3 px-4">Last Connected</th>
                      <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 font-medium text-gray-800">
                    @for (counter of counters; track counter.id) {
                      <tr class="hover:bg-gray-50/80 transition-colors">
                        <td class="py-3.5 px-5">
                          <div class="font-semibold text-gray-900 text-sm">{{ counter.name }}</div>
                          @if (counter.description) {
                            <div class="text-[11px] text-gray-400">{{ counter.description }}</div>
                          }
                          @if (counter.branchName) {
                            <span class="inline-block mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
                              {{ counter.branchName }}
                            </span>
                          }
                        </td>

                        <td class="py-3.5 px-4 font-mono font-semibold text-primary-700">
                          {{ counter.counterId }}
                        </td>

                        <td class="py-3.5 px-4 font-mono text-xs text-gray-500">
                          {{ maskApiKey(counter.apiKey) }}
                        </td>

                        <td class="py-3.5 px-4">
                          @if (counter.status === 'disabled' || counter.status === 'revoked') {
                            <span class="px-2.5 py-1 bg-red-100 text-red-700 font-semibold rounded-full text-[10px] inline-flex items-center gap-1 border border-red-200">
                              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              {{ counter.status | titlecase }}
                            </span>
                          } @else if (counter.deviceStatus === 'online') {
                            <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-[10px] inline-flex items-center gap-1 border border-emerald-200">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Online
                            </span>
                          } @else {
                            <span class="px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold rounded-full text-[10px] inline-flex items-center gap-1 border border-gray-200">
                              <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Offline
                            </span>
                          }
                          @if (counter.appVersion) {
                            <div class="text-[10px] text-gray-400 mt-1">v{{ counter.appVersion }} ({{ counter.os || 'Desktop' }})</div>
                          }
                        </td>

                        <td class="py-3.5 px-4 text-gray-500 text-xs">
                          {{ counter.lastConnectedAt ? (counter.lastConnectedAt | date:'medium') : 'Never' }}
                        </td>

                        <td class="py-3.5 px-4 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button
                              (click)="toggleCounterStatus(counter)"
                              class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-colors"
                              [title]="counter.status === 'active' ? 'Disable Counter' : 'Enable Counter'"
                            >
                              {{ counter.status === 'active' ? 'Disable' : 'Enable' }}
                            </button>

                            <button
                              (click)="regenerateCredentials(counter)"
                              class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-xs border border-amber-200 transition-colors"
                              title="Regenerate Credentials"
                            >
                              Regen
                            </button>

                            <button
                              (click)="deleteCounter(counter)"
                              class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Counter"
                            >
                              <i class="bi bi-trash text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Create Counter Modal -->
    @if (showAddModal) {
      <div class="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-200">
          
          <div class="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h3 class="font-semibold text-gray-900 text-lg">Add New POS Counter</h3>
              <p class="text-xs text-gray-500 mt-0.5">Generate API authorization credentials for desktop app</p>
            </div>
            <button (click)="closeAddModal()" class="text-gray-400 hover:text-gray-600 p-1">
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>

          @if (!createdResult) {
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Counter Name *</label>
                <input
                  type="text"
                  [(ngModel)]="newCounter.name"
                  placeholder="e.g. Counter 1 - Main Entrance"
                  class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  [(ngModel)]="newCounter.description"
                  placeholder="e.g. Dell Desktop Terminal POS 1"
                  class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Assigned Branch</label>
                  <select
                    [(ngModel)]="newCounter.branchId"
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="">Main Branch</option>
                    @for (b of branches; track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Location / Store Section</label>
                  <input
                    type="text"
                    [(ngModel)]="newCounter.location"
                    placeholder="e.g. Ground Floor"
                    class="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button (click)="closeAddModal()" class="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 font-semibold text-xs">
                Cancel
              </button>
              <button
                (click)="submitCreateCounter()"
                [disabled]="!newCounter.name.trim() || creating"
                class="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-xs disabled:opacity-50 shadow-sm"
              >
                {{ creating ? 'Generating Credentials...' : 'Generate API Credentials' }}
              </button>
            </div>
          } @else {
            <!-- Credentials Result Screen -->
            <div class="p-6 space-y-4 text-xs font-medium">
              <div class="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 font-semibold flex items-center gap-2">
                <i class="bi bi-check-circle-fill text-green-600 text-base"></i>
                <span>POS Counter Authorized Successfully!</span>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="block text-[10px] font-semibold text-gray-500 uppercase">Counter ID</label>
                  <div class="flex items-center gap-2 mt-1">
                    <input type="text" readonly [value]="createdResult.counterId" class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-semibold text-primary-700" />
                    <button (click)="copyText(createdResult.counterId)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold">Copy</button>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-semibold text-gray-500 uppercase">API Key (Public)</label>
                  <div class="flex items-center gap-2 mt-1">
                    <input type="text" readonly [value]="createdResult.apiKey" class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs" />
                    <button (click)="copyText(createdResult.apiKey)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold">Copy</button>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-semibold text-gray-500 uppercase">Secret Key (Private)</label>
                  <div class="flex items-center gap-2 mt-1">
                    <input type="text" readonly [value]="createdResult.secretKey" class="flex-1 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg font-mono text-xs text-amber-900 font-semibold" />
                    <button (click)="copyText(createdResult.secretKey)" class="px-3 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg font-semibold">Copy Secret</button>
                  </div>
                  <p class="text-[10px] text-red-600 font-semibold mt-1">
                    ⚠ Warning: Copy your Secret Key now. For security, it will NOT be shown again!
                  </p>
                </div>

                <div>
                  <label class="block text-[10px] font-semibold text-gray-500 uppercase">Connection Endpoint URL</label>
                  <div class="flex items-center gap-2 mt-1">
                    <input type="text" readonly [value]="createdResult.connectionUrl" class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-[11px]" />
                    <button (click)="copyText(createdResult.connectionUrl)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold">Copy URL</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button (click)="closeAddModal()" class="px-6 py-2 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700 shadow-sm">
                Done
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Regenerated Credentials Modal -->
    @if (regenResult) {
      <div class="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-200">
          <div class="p-5 border-b border-gray-200 bg-amber-50">
            <h3 class="font-semibold text-amber-900 text-base">New API Credentials Generated</h3>
            <p class="text-xs text-amber-700 mt-0.5">Update your desktop Electron application with these new credentials.</p>
          </div>
          <div class="p-6 space-y-4 text-xs font-medium">
            <div>
              <label class="block text-[10px] font-semibold text-gray-500 uppercase">New API Key</label>
              <div class="flex items-center gap-2 mt-1">
                <input type="text" readonly [value]="regenResult.apiKey" class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs" />
                <button (click)="copyText(regenResult.apiKey)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold">Copy</button>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-gray-500 uppercase">New Secret Key</label>
              <div class="flex items-center gap-2 mt-1">
                <input type="text" readonly [value]="regenResult.secretKey" class="flex-1 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg font-mono text-xs text-amber-900 font-semibold" />
                <button (click)="copyText(regenResult.secretKey)" class="px-3 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg font-semibold">Copy Secret</button>
              </div>
            </div>
          </div>
          <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button (click)="regenResult = null" class="px-6 py-2 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700">
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PosCountersComponent implements OnInit {
  private offlinePosService = inject(OfflinePosService);
  private shopContext = inject(ShopContextService);
  private featureGuard = inject(FeatureGuardService);
  private branchService = inject(BranchService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  counters: OfflinePosCounter[] = [];
  branches: Branch[] = [];
  loading = true;
  hasFeature = true;
  counterLimit: number | null = null;
  
  showAddModal = false;
  creating = false;
  newCounter = { name: '', description: '', branchId: '', location: '' };
  createdResult: CounterCredentialsResult | null = null;
  regenResult: { apiKey: string; secretKey: string } | null = null;

  get onlineCount(): number {
    return this.counters.filter(c => c.deviceStatus === 'online').length;
  }

  get activeCount(): number {
    return this.counters.filter(c => c.status === 'active').length;
  }

  get isLimitReached(): boolean {
    if (this.counterLimit === null || this.counterLimit === -1) return false;
    return this.activeCount >= this.counterLimit;
  }

  getShopId(): string {
    return this.shopContext.getWorkspaceShopId() || this.authService.getCurrentUser()?.shopId || '';
  }

  ngOnInit(): void {
    this.checkEntitlements();
    this.loadBranches();
    this.loadCounters();
  }

  checkEntitlements(): void {
    this.hasFeature = this.featureGuard.isFeatureActive('sell_offline_pos_counters');
    const limit = this.featureGuard.getLimitValue('offline_pos_counters_count');
    this.counterLimit = limit !== undefined ? limit : null;
  }

  loadBranches(): void {
    const shopId = this.getShopId();
    if (shopId) {
      this.branchService.getBranches(shopId).subscribe({
        next: (res) => { if (res.data) this.branches = res.data; },
        error: () => {}
      });
    }
  }

  loadCounters(): void {
    const shopId = this.getShopId();
    if (!shopId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.offlinePosService.getCounters(shopId).subscribe({
      next: (res) => {
        this.counters = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.toast.showError(err.error?.message || 'Failed to load POS counters');
        this.loading = false;
      }
    });
  }

  openAddModal(): void {
    this.createdResult = null;
    this.newCounter = { name: '', description: '', branchId: '', location: '' };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.createdResult = null;
  }

  submitCreateCounter(): void {
    if (!this.newCounter.name.trim()) return;

    this.creating = true;
    this.offlinePosService.createCounter(this.newCounter).subscribe({
      next: (res) => {
        this.createdResult = res.data;
        this.creating = false;
        this.loadCounters();
        this.toast.showSuccess('POS Counter credentials generated!');
      },
      error: (err) => {
        this.toast.showError(err.error?.message || 'Failed to create POS counter');
        this.creating = false;
      }
    });
  }

  toggleCounterStatus(counter: OfflinePosCounter): void {
    const newStatus = counter.status === 'active' ? 'disabled' : 'active';
    this.offlinePosService.updateCounter(counter.id, { status: newStatus }).subscribe({
      next: () => {
        counter.status = newStatus;
        this.toast.showSuccess(`Counter ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
      },
      error: (err) => this.toast.showError(err.error?.message || 'Failed to update counter status')
    });
  }

  regenerateCredentials(counter: OfflinePosCounter): void {
    if (!confirm(`Are you sure you want to regenerate credentials for ${counter.name}? Existing desktop application session will be disconnected.`)) {
      return;
    }

    this.offlinePosService.regenerateCredentials(counter.id).subscribe({
      next: (res) => {
        this.regenResult = res.data;
        this.loadCounters();
        this.toast.showSuccess('Credentials regenerated successfully');
      },
      error: (err) => this.toast.showError(err.error?.message || 'Failed to regenerate credentials')
    });
  }

  deleteCounter(counter: OfflinePosCounter): void {
    if (!confirm(`Are you sure you want to delete POS counter ${counter.name}? This action cannot be undone.`)) {
      return;
    }

    const shopId = this.getShopId();
    this.offlinePosService.deleteCounter(counter.id, shopId).subscribe({
      next: () => {
        this.counters = this.counters.filter(c => c.id !== counter.id);
        this.toast.showSuccess('POS counter deleted');
      },
      error: (err) => this.toast.showError(err.error?.message || 'Failed to delete counter')
    });
  }

  maskApiKey(key: string): string {
    if (!key || key.length < 12) return '••••••••••••';
    return key.substring(0, 7) + '••••••••' + key.substring(key.length - 4);
  }

  copyText(text: string): void {
    navigator.clipboard.writeText(text);
    this.toast.showInfo('Copied to clipboard!');
  }
}
