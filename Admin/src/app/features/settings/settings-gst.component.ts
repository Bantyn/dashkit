import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, PlatformGstSettings, PlatformGstStatus } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-settings-gst',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent, UiDropdownComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 xl:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">GST & Tax</h1>
          <p class="text-gray-500 mt-1">Manage GSTIN verification, tax rates, and legal business details.</p>
        </div>
        
        <div class="space-y-6 max-w-full">

      <!-- Warning Banner if not verified -->
      <div *ngIf="!loading && gst && gst.gstStatus !== 'verified'"
        class="flex items-start gap-4 rounded-2xl border p-5 transition-all"
        [ngClass]="{
          'bg-amber-50 border-amber-200': gst.gstStatus === 'not_configured' || gst.gstStatus === 'pending',
          'bg-red-50 border-red-200': gst.gstStatus === 'failed'
        }">
        <div class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          [ngClass]="{
            'bg-amber-100 text-amber-600': gst.gstStatus !== 'failed',
            'bg-red-100 text-red-600': gst.gstStatus === 'failed'
          }">
          <i class="bi bi-exclamation-triangle-fill text-lg"></i>
        </div>
        <div>
          <p class="font-bold text-sm"
            [ngClass]="{ 'text-amber-800': gst.gstStatus !== 'failed', 'text-red-800': gst.gstStatus === 'failed' }">
            <ng-container *ngIf="gst.gstStatus === 'not_configured'">GST Collection Disabled — Platform GST Not Configured</ng-container>
            <ng-container *ngIf="gst.gstStatus === 'pending'">GST Collection Disabled — Verification Pending</ng-container>
            <ng-container *ngIf="gst.gstStatus === 'failed'">GST Verification Failed</ng-container>
          </p>
          <p class="text-xs mt-1"
            [ngClass]="{ 'text-amber-700': gst.gstStatus !== 'failed', 'text-red-700': gst.gstStatus === 'failed' }">
            <ng-container *ngIf="gst.gstStatus === 'not_configured'">GST will NOT be charged to shops on any subscription invoices until platform GST is verified and collection is enabled.</ng-container>
            <ng-container *ngIf="gst.gstStatus === 'pending'">Complete GST details and click "Verify GST" to enable tax collection on subscriptions.</ng-container>
            <ng-container *ngIf="gst.gstStatus === 'failed'">
              Verification failed: {{ gst.verificationError || 'Unknown error.' }} Please check your GST details and try again.
            </ng-container>
          </p>
        </div>
      </div>

      <!-- Verified Success Banner -->
      <div *ngIf="!loading && gst && gst.gstStatus === 'verified'"
        class="flex items-center gap-4 rounded-2xl border bg-emerald-50 border-emerald-200 p-5">
        <div class="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <i class="bi bi-shield-fill-check text-lg"></i>
        </div>
        <div class="flex-1">
          <p class="font-bold text-sm text-emerald-800">Platform GST Verified</p>
          <p class="text-xs text-emerald-700 mt-0.5">
            GST collection is {{ gst.gstCollectionEnabled ? 'active' : 'configured but disabled' }}.
            Verified on {{ formatDate(gst.verifiedAt) }}.
          </p>
        </div>
        <span class="text-xs font-bold px-3 py-1.5 rounded-full"
          [ngClass]="gst.gstCollectionEnabled ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-600'">
          {{ gst.gstCollectionEnabled ? 'Collection Active' : 'Collection Disabled' }}
        </span>
      </div>

      <!-- Main GST Card -->
      <div class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
        <div class="mb-8 border-b border-gray-100 pb-6 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <i class="bi bi-building-fill-check text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">Platform GST Configuration</h2>
              <p class="text-sm text-gray-500 mt-0.5">Required for platform to legally collect GST from shops on subscriptions.</p>
            </div>
          </div>
          <!-- Status Badge -->
          <div *ngIf="gst" class="flex items-center gap-2 shrink-0 ml-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
              [ngClass]="statusBadgeClass(gst.gstStatus)">
              <span class="w-2 h-2 rounded-full inline-block" [ngClass]="statusDotClass(gst.gstStatus)"></span>
              {{ statusLabel(gst.gstStatus) }}
            </span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="py-16 text-center text-gray-400">
          <span class="w-8 h-8 border-[3px] border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
          <p class="text-sm font-semibold text-gray-500">Loading GST configuration...</p>
        </div>

        <form *ngIf="!loading && gst" (submit)="saveSettings($event)" class="space-y-10">

          <!-- Business Identity -->
          <div>
            <h3 class="font-bold text-gray-900 text-base mb-1">Business Identity</h3>
            <p class="text-sm text-gray-500 mb-6">Legal business details as registered with the GST authority.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <app-ui-input
                [(ngModel)]="gst.legalBusinessName"
                name="legalBusinessName"
                label="Legal Business Name *"
                placeholder="e.g. Clothify Technologies Pvt Ltd"
              ></app-ui-input>

              <div class="space-y-2 relative">
                <label class="text-sm font-semibold text-gray-700">Business Type *</label>
                <app-ui-dropdown
                  [(ngModel)]="gst.businessType"
                  name="businessType"
                  [options]="businessTypeOptions"
                  placeholder="Select Business Type"
                ></app-ui-dropdown>
              </div>

              <div class="space-y-2">
                <app-ui-input
                  [(ngModel)]="gst.gstNumber"
                  name="gstNumber"
                  label="GST Number (GSTIN) *"
                  placeholder="e.g. 27AABCU9603R1ZX"
                  (ngModelChange)="onGstinChange($event)"
                ></app-ui-input>
                <p *ngIf="gstinError" class="text-xs text-red-500 font-medium">{{ gstinError }}</p>
                <p *ngIf="gst.stateCode && !gstinError" class="text-xs text-gray-400">
                  State Code auto-extracted: <strong class="text-gray-600">{{ gst.stateCode }}</strong>
                </p>
              </div>

              <div class="space-y-2">
                <app-ui-input
                  [(ngModel)]="gst.panNumber"
                  name="panNumber"
                  label="PAN Number *"
                  placeholder="e.g. AABCU9603R"
                  (ngModelChange)="onPanChange($event)"
                ></app-ui-input>
                <p *ngIf="panError" class="text-xs text-red-500 font-medium">{{ panError }}</p>
              </div>
            </div>
          </div>

          <!-- Registered Address -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-base mb-1">Registered Address</h3>
            <p class="text-sm text-gray-500 mb-6">Business address as registered with GST authority.</p>
            <div class="space-y-6">
              <app-ui-input
                [(ngModel)]="gst.businessAddress"
                name="businessAddress"
                label="Street Address *"
                placeholder="e.g. 101, Business Park, MG Road"
              ></app-ui-input>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <app-ui-input [(ngModel)]="gst.city" name="city" label="City *" placeholder="e.g. Mumbai"></app-ui-input>
                <app-ui-input [(ngModel)]="gst.state" name="state" label="State *" placeholder="e.g. Maharashtra"></app-ui-input>
                <app-ui-input [(ngModel)]="gst.pincode" name="pincode" label="Pincode *" placeholder="e.g. 400001"></app-ui-input>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input [(ngModel)]="gst.country" name="country" label="Country *" placeholder="India"></app-ui-input>
                <app-ui-input [(ngModel)]="gst.stateCode" name="stateCode" label="State Code *" placeholder="e.g. 27"></app-ui-input>
              </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-base mb-1">Contact Information</h3>
            <p class="text-sm text-gray-500 mb-6">For GST-related communications and invoices.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <app-ui-input [(ngModel)]="gst.email" name="email" label="Email *" type="email" placeholder="billing@company.com"></app-ui-input>
              <app-ui-input [(ngModel)]="gst.phone" name="phone" label="Phone *" placeholder="+91 98765 43210"></app-ui-input>
            </div>
          </div>

          <!-- Optional Identifiers -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-base mb-1">Optional Identifiers</h3>
            <p class="text-sm text-gray-500 mb-6">Additional registration details (if applicable).</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <app-ui-input [(ngModel)]="gst.cin" name="cin" label="CIN" placeholder="L12345MH2024PTC..."></app-ui-input>
              <app-ui-input [(ngModel)]="gst.msmeNumber" name="msmeNumber" label="MSME Registration No." placeholder="UDYAM-XX-00-0000000"></app-ui-input>
              <app-ui-input [(ngModel)]="gst.iec" name="iec" label="IEC Code" placeholder="Import Export Code"></app-ui-input>
            </div>
          </div>

          <!-- GST Rate -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-base mb-1">Tax Rate</h3>
            <p class="text-sm text-gray-500 mb-6">GST rate applied to platform subscription fees (standard 18% for SaaS services in India).</p>
            <div class="max-w-xs">
              <app-ui-input
                [(ngModel)]="gst.gstRate"
                name="gstRate"
                label="GST Rate (%)"
                type="number"
                placeholder="18"
              ></app-ui-input>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between pt-8 border-t border-gray-100">
            <button type="button" (click)="triggerVerification()"
              [disabled]="verifying || saving || !!gstinError || !!panError || !gst.gstNumber"
              class="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              [ngClass]="{
                'bg-violet-600 hover:bg-violet-700 text-white shadow-sm': gst.gstStatus !== 'verified',
                'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm': gst.gstStatus === 'verified'
              }">
              @if (verifying) {
                <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Verifying...</span>
              } @else if (gst.gstStatus === 'verified') {
                <i class="bi bi-arrow-repeat"></i>
                <span>Re-verify GST</span>
              } @else {
                <i class="bi bi-shield-check"></i>
                <span>Verify GST</span>
              }
            </button>

            <button type="submit" [disabled]="saving"
              class="bg-primary-700 hover:bg-black text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
              @if (saving) {
                <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
              }
              Save GST Details
            </button>
          </div>
        </form>
      </div>

      <!-- Tax Collection Toggle Card -->
      <div *ngIf="!loading && gst" class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              [ngClass]="gst.gstVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'">
              <i class="bi bi-toggles text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-base">GST Collection Toggle</h3>
              <p class="text-sm text-gray-500 mt-1">
                <ng-container *ngIf="gst.gstVerified; else notVerifiedMsg">
                  Enable or disable GST collection on platform subscription invoices.
                  When enabled, {{ gst.gstRate }}% GST will be applied to all plan charges.
                </ng-container>
                <ng-template #notVerifiedMsg>
                  GST collection can only be enabled after platform GST verification is complete.
                </ng-template>
              </p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <label class="relative inline-flex items-center select-none"
              [ngClass]="gst.gstVerified ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'">
              <input type="checkbox" class="sr-only peer"
                [(ngModel)]="gst.gstCollectionEnabled"
                name="gstCollectionEnabled"
                [disabled]="!gst.gstVerified || toggling"
                (change)="toggleCollection()">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span class="text-xs font-semibold" [ngClass]="gst.gstCollectionEnabled ? 'text-emerald-600' : 'text-gray-400'">
              {{ gst.gstCollectionEnabled ? 'GST Active' : 'GST Disabled' }}
            </span>
          </div>
        </div>

        <!-- GST Summary Table if verified -->
        <div *ngIf="gst.gstVerified" class="mt-6 pt-6 border-t border-gray-100">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 font-medium mb-1">GST Number</p>
              <p class="text-sm font-bold text-gray-900 font-mono">{{ gst.gstNumber || '—' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 font-medium mb-1">Business Name</p>
              <p class="text-sm font-bold text-gray-900 truncate">{{ gst.legalBusinessName || '—' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 font-medium mb-1">Verified On</p>
              <p class="text-sm font-bold text-gray-900">{{ formatDate(gst.verifiedAt) }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 font-medium mb-1">GST Rate</p>
              <p class="text-sm font-bold text-gray-900">{{ gst.gstRate }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  `
})
export class SettingsGstComponent implements OnInit {
  loading = true;
  saving = false;
  verifying = false;
  toggling = false;
  gst: PlatformGstSettings | null = null;

  gstinError = '';
  panError = '';

  businessTypeOptions = [
    { value: 'Private Limited', label: 'Private Limited' },
    { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
    { value: 'OPC', label: 'One Person Company (OPC)' },
    { value: 'Proprietorship', label: 'Proprietorship' },
    { value: 'Partnership', label: 'Partnership Firm' },
    { value: 'Public Limited', label: 'Public Limited' },
    { value: 'Other', label: 'Other' },
  ];

  private readonly GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  private readonly PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  ngOnInit() {
    this.api.getPlatformGstSettings().subscribe({
      next: (res) => {
        this.gst = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load GST settings.');
      }
    });
  }

  onGstinChange(value: string) {
    const v = (value || '').toUpperCase();
    if (!v) { this.gstinError = ''; return; }
    if (!this.GSTIN_REGEX.test(v)) {
      this.gstinError = 'Invalid GSTIN format (e.g. 27AABCU9603R1ZX)';
    } else {
      this.gstinError = '';
      if (this.gst) {
        this.gst.stateCode = v.substring(0, 2);
        if (this.gst.panNumber && this.PAN_REGEX.test(this.gst.panNumber.toUpperCase())) {
          const panInGstin = v.substring(2, 12);
          this.panError = panInGstin !== this.gst.panNumber.toUpperCase()
            ? 'PAN does not match the GSTIN. Check characters 3–12.'
            : '';
        }
      }
    }
  }

  onPanChange(value: string) {
    const v = (value || '').toUpperCase();
    if (!v) { this.panError = ''; return; }
    if (!this.PAN_REGEX.test(v)) {
      this.panError = 'Invalid PAN format (e.g. AABCU9603R)';
    } else if (this.gst?.gstNumber && this.GSTIN_REGEX.test(this.gst.gstNumber.toUpperCase())) {
      const panInGstin = this.gst.gstNumber.toUpperCase().substring(2, 12);
      this.panError = panInGstin !== v ? 'PAN does not match the GSTIN. Check characters 3–12.' : '';
    } else {
      this.panError = '';
    }
  }

  saveSettings(e: Event) {
    e.preventDefault();
    if (!this.gst || this.gstinError || this.panError) return;
    this.saving = true;
    this.api.savePlatformGstSettings(this.gst).subscribe({
      next: (res) => {
        this.gst = res.data;
        this.saving = false;
        this.toast.showSuccess('GST details saved successfully.');
      },
      error: () => {
        this.saving = false;
        this.toast.showError('Failed to save GST details.');
      }
    });
  }

  triggerVerification() {
    if (!this.gst?.gstNumber || this.gstinError || this.panError) return;
    this.verifying = true;
    this.api.verifyPlatformGst().subscribe({
      next: (res) => {
        this.gst = res.data;
        this.verifying = false;
        if (res.data.gstStatus === 'verified') {
          this.toast.showSuccess('Platform GST verified! You can now enable GST collection.');
        } else {
          this.toast.showError(`Verification failed: ${res.data.verificationError || 'Unknown error'}`);
        }
      },
      error: (err) => {
        this.verifying = false;
        this.toast.showError(err?.error?.message || 'Verification failed. Please try again.');
      }
    });
  }

  toggleCollection() {
    if (!this.gst || !this.gst.gstVerified) {
      if (this.gst) this.gst.gstCollectionEnabled = false;
      this.toast.showError('GST must be verified before enabling collection.');
      return;
    }
    this.toggling = true;
    this.api.togglePlatformGstCollection(this.gst.gstCollectionEnabled).subscribe({
      next: (res) => {
        this.gst = res.data;
        this.toggling = false;
        this.toast.showSuccess(
          res.data.gstCollectionEnabled
            ? 'GST collection enabled. Subscriptions will now include GST.'
            : 'GST collection disabled.'
        );
      },
      error: (err) => {
        if (this.gst) this.gst.gstCollectionEnabled = !this.gst.gstCollectionEnabled;
        this.toggling = false;
        this.toast.showError(err?.error?.message || 'Failed to toggle GST collection.');
      }
    });
  }

  statusLabel(status: PlatformGstStatus): string {
    const labels: Record<PlatformGstStatus, string> = {
      not_configured: 'Not Configured',
      pending: 'Pending Verification',
      verified: 'Verified',
      failed: 'Verification Failed',
      suspended: 'Suspended',
    };
    return labels[status] || status;
  }

  statusBadgeClass(status: PlatformGstStatus): string {
    const map: Record<PlatformGstStatus, string> = {
      not_configured: 'bg-gray-100 text-gray-600 border-gray-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      suspended: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  }

  statusDotClass(status: PlatformGstStatus): string {
    const map: Record<PlatformGstStatus, string> = {
      not_configured: 'bg-gray-400',
      pending: 'bg-amber-400 animate-pulse',
      verified: 'bg-emerald-500',
      failed: 'bg-red-500',
      suspended: 'bg-orange-500',
    };
    return map[status] || 'bg-gray-400';
  }

  formatDate(ts: any): string {
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  }
}
