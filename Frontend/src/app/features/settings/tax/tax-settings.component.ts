import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { TaxConfig } from '../../../core/models/shop.model';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { UiInputComponent } from '../../../shared/components/ui-input.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiDropdownComponent, UiInputComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-primary-50 min-h-screen">
      <main class="p-6 lg:p-10 max-w-full mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Tax Settings</h1>
          <p class="text-gray-500 mt-1">Configure GST and compliance settings for your shop.</p>
        </div>

        <!-- Warning / Status Banners -->
        <div class="space-y-6 mb-6">
          <div *ngIf="!loading && form.get('gstStatus')?.value !== 'verified'"
            class="flex items-start gap-4 rounded-2xl border p-5 bg-amber-50 border-amber-200">
            <div class="shrink-0 w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <i class="bi bi-exclamation-triangle-fill text-lg"></i>
            </div>
            <div>
              <p class="font-bold text-sm text-amber-800">GST Billing Disabled — GSTIN Not Verified</p>
              <p class="text-xs text-amber-700 mt-1">
                You cannot charge GST to your customers on product sales until your GST number has been verified. 
                Please enter your GST details and verify below.
              </p>
            </div>
          </div>

          <div *ngIf="!loading && form.get('gstStatus')?.value === 'verified'"
            class="flex items-center gap-4 rounded-2xl border bg-emerald-50 border-emerald-200 p-5">
            <div class="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <i class="bi bi-shield-fill-check text-lg"></i>
            </div>
            <div class="flex-1">
              <p class="font-bold text-sm text-emerald-800">GST Registration Verified</p>
              <p class="text-xs text-emerald-700 mt-0.5">
                GST is {{ form.get('gstEnabled')?.value ? 'enabled and active' : 'configured but disabled' }} for your shop sales.
                <span *ngIf="form.get('legalBusinessName')?.value">
                  Registered under: <strong>{{ form.get('legalBusinessName')?.value }}</strong>
                </span>
              </p>
            </div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
          <!-- GST Verification & Identity -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div class="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 class="font-bold text-gray-900 text-base">GST Registration & Verification</h2>
                <p class="text-xs text-gray-500 mt-0.5">Verify your GSTIN with government records to enable sales tax.</p>
              </div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                [ngClass]="statusBadgeClass(form.get('gstStatus')?.value)">
                <span class="w-1.5 h-1.5 rounded-full inline-block" [ngClass]="statusDotClass(form.get('gstStatus')?.value)"></span>
                {{ statusLabel(form.get('gstStatus')?.value) }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="space-y-1">
                <label class="block text-sm font-semibold text-gray-700">GSTIN Number *</label>
                <div class="flex gap-2">
                  <app-ui-input
                    formControlName="gstNumber"
                    placeholder="e.g. 27AABCU9603R1ZX"
                    class="flex-1"
                    (ngModelChange)="onGstinChange($event)"
                  ></app-ui-input>
                  <button
                    type="button"
                    (click)="verifyGst()"
                    [disabled]="form.get('gstNumber')?.invalid || !form.get('gstNumber')?.value || verifyingGst || !!gstinError"
                    class="bg-primary-600 text-white px-5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <span *ngIf="verifyingGst" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    {{ verifyingGst ? 'Verifying...' : 'Verify' }}
                  </button>
                </div>
                <p *ngIf="gstinError" class="text-xs text-red-500 font-medium">{{ gstinError }}</p>
                <p *ngIf="!gstinError" class="text-[11px] text-gray-400">15-digit GST Identification Number</p>
              </div>

              <div class="space-y-1">
                <label class="block text-sm font-semibold text-gray-700">PAN Number *</label>
                <app-ui-input
                  formControlName="panNumber"
                  placeholder="e.g. AABCU9603R"
                  (ngModelChange)="onPanChange($event)"
                ></app-ui-input>
                <p *ngIf="panError" class="text-xs text-red-500 font-medium">{{ panError }}</p>
                <p *ngIf="!panError" class="text-[11px] text-gray-400">10-digit Permanent Account Number</p>
              </div>
            </div>

            <div *ngIf="form.get('legalBusinessName')?.value" class="bg-primary-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-[11px] text-gray-500 font-medium">Legal Name (from GSTIN)</p>
                <p class="text-sm font-bold text-gray-900">{{ form.get('legalBusinessName')?.value }}</p>
              </div>
              <div *ngIf="form.get('verifiedAt')?.value">
                <p class="text-[11px] text-gray-500 font-medium">Verification Timestamp</p>
                <p class="text-sm font-semibold text-gray-700">{{ formatDateString(form.get('verifiedAt')?.value) }}</p>
              </div>
            </div>

            <!-- Mandatory Legal Self-Declaration -->
            <div class="bg-primary-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input type="checkbox" formControlName="selfDeclarationAccepted" class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                <div class="text-xs text-gray-700">
                  <span class="font-bold text-gray-900 block mb-0.5">Legal Self-Declaration</span>
                  I declare that the GST Number provided belongs to my business and is accurate. I understand that I am solely responsible for any incorrect GST information submitted.
                </div>
              </label>
            </div>

            <!-- Optional GST Certificate Upload -->
            <div class="border border-dashed border-gray-300 bg-primary-50/50 rounded-xl p-5 text-center space-y-3">
              <div class="flex items-center justify-between text-left">
                <div>
                  <p class="font-bold text-sm text-gray-900">Upload GST Certificate (Optional)</p>
                  <p class="text-xs text-gray-500">Upload your Registration Certificate (PDF, JPG, PNG - Max 5MB) for manual Admin Verification.</p>
                </div>
                <span *ngIf="form.get('certificateUrl')?.value" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Certificate Uploaded
                </span>
              </div>

              <div *ngIf="form.get('certificateUrl')?.value" class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <div class="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <i class="bi bi-file-earmark-pdf text-lg text-red-500"></i>
                  <span>Uploaded GST Certificate</span>
                </div>
                <a [href]="form.get('certificateUrl')?.value" target="_blank" class="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                  View Document <i class="bi bi-box-arrow-up-right"></i>
                </a>
              </div>

              <div class="flex items-center justify-center gap-3">
                <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png" class="hidden" />
                <button type="button" (click)="fileInput.click()" [disabled]="uploadingCert"
                  class="px-4 py-2 bg-white border border-gray-300 hover:border-primary-400 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2">
                  <i class="bi bi-cloud-upload"></i>
                  {{ uploadingCert ? 'Uploading...' : (form.get('certificateUrl')?.value ? 'Replace Certificate' : 'Choose Certificate File') }}
                </button>
              </div>
            </div>

            <div *ngIf="form.get('verificationError')?.value" class="bg-red-50 text-red-700 text-xs rounded-xl p-4 border border-red-100">
              <strong>Verification Failed:</strong> {{ form.get('verificationError')?.value }}
            </div>
          </div>

          <!-- GST Master Toggle -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            [ngClass]="form.get('gstStatus')?.value === 'verified' ? 'opacity-100' : 'opacity-50 pointer-events-none'">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-bold text-gray-900 text-base">Enable GST Collection</h2>
                <p class="text-xs text-gray-500 mt-0.5">Apply GST calculation to billing and customer checkout.</p>
              </div>
              <label class="relative inline-flex items-center select-none"
                [ngClass]="form.get('gstStatus')?.value === 'verified' ? 'cursor-pointer' : 'cursor-not-allowed'">
                <input type="checkbox" formControlName="gstEnabled" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <!-- GST Rate & Config Details -->
          <div class="space-y-6 transition-all"
            [ngClass]="form.get('gstEnabled')?.value && form.get('gstStatus')?.value === 'verified' ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'">
            <!-- GST Rate & Type -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 class="font-bold text-gray-900 text-base mb-4">Tax Rate & Pricing Type</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1">
                  <label class="text-sm font-semibold text-gray-700">Default GST Rate (%)</label>
                  <app-ui-dropdown
                    formControlName="gstRate"
                    [options]="gstRateOptions"
                    placeholder="Select GST Rate"
                  ></app-ui-dropdown>
                </div>
                <div class="space-y-1">
                  <label class="text-sm font-semibold text-gray-700">Pricing Mode</label>
                  <app-ui-dropdown
                    formControlName="gstType"
                    [options]="gstTypeOptions"
                    placeholder="Select Pricing Mode"
                  ></app-ui-dropdown>
                </div>
              </div>
            </div>

            <!-- Advanced GST Options -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 class="font-bold text-gray-900 text-base mb-4">Advanced Invoicing Options</h2>
              <div class="space-y-4">
                <label class="flex items-center justify-between cursor-pointer">
                  <div>
                    <p class="font-semibold text-sm text-gray-800">Show Tax Breakdown on Invoice</p>
                    <p class="text-xs text-gray-400">Display separate SGST, CGST, and IGST lines on PDF receipts</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" formControlName="splitGst" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </label>
                <hr class="border-gray-100" />
                <label class="flex items-center justify-between cursor-pointer">
                  <div>
                    <p class="font-semibold text-sm text-gray-800">Apply IGST on Interstate Deliveries</p>
                    <p class="text-xs text-gray-400">Auto-apply Integrated GST for customers situated in different states</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" formControlName="igstOnInterstate" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </label>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end gap-3 pt-2">
            <span *ngIf="saved" class="flex items-center gap-2 text-green-600 font-semibold text-sm animate-fade-in">
              <i class="bi bi-check-circle-fill"></i> Tax settings saved successfully
            </span>
            <button
              type="submit"
              [disabled]="saving || loading || !!gstinError || !!panError"
              class="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <span *ngIf="saving || loading" class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
              Save Settings
            </button>
          </div>
        </form>
      </main>
    </div>
  `,
})
export class TaxSettingsComponent implements OnInit {
  form: FormGroup;
  saving = false;
  saved = false;
  loading = true;
  shopId: string = '';
  verifyingGst = false;
  uploadingCert = false;

  gstinError = '';
  panError = '';

  gstRateOptions = [
    { value: 0, label: '0% (Exempt)' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
  ];

  gstTypeOptions = [
    { value: 'exclusive', label: 'Exclusive (added on top of price)' },
    { value: 'inclusive', label: 'Inclusive (included in base price)' },
  ];

  private readonly GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  private readonly PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      gstEnabled: [false],
      gstNumber: ['', [Validators.required]],
      panNumber: ['', [Validators.required]],
      legalBusinessName: [''],
      gstVerified: [false],
      gstStatus: ['not_configured'],
      selfDeclarationAccepted: [true],
      certificateUrl: [''],
      verifiedAt: [null],
      verificationError: [null],
      gstRate: [18],
      gstType: ['exclusive'],
      splitGst: [true],
      igstOnInterstate: [true],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = params.get('shopId');
      if (id) {
        this.shopId = id;
        this.loadShopTaxConfig();
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
      const pan = this.form.get('panNumber')?.value;
      if (pan && this.PAN_REGEX.test(pan.toUpperCase())) {
        const panInGstin = v.substring(2, 12);
        this.panError = panInGstin !== pan.toUpperCase()
          ? 'PAN does not match the GSTIN (characters 3–12)'
          : '';
      }
      // Reset verified status if GSTIN changes
      if (this.form.get('gstVerified')?.value) {
        this.form.patchValue({
          gstVerified: false,
          gstStatus: 'pending',
          legalBusinessName: '',
          verifiedAt: null,
          verificationError: null
        });
      }
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller document.');
      return;
    }

    this.uploadingCert = true;
    setTimeout(() => {
      const mockUrl = URL.createObjectURL(file);
      this.form.patchValue({
        certificateUrl: mockUrl,
        gstStatus: 'PENDING_REVIEW'
      });
      this.uploadingCert = false;
    }, 1000);
  }

  onPanChange(value: string) {
    const v = (value || '').toUpperCase();
    if (!v) { this.panError = ''; return; }
    if (!this.PAN_REGEX.test(v)) {
      this.panError = 'Invalid PAN format (e.g. AABCU9603R)';
    } else {
      const gstin = this.form.get('gstNumber')?.value;
      if (gstin && this.GSTIN_REGEX.test(gstin.toUpperCase())) {
        const panInGstin = gstin.toUpperCase().substring(2, 12);
        this.panError = panInGstin !== v
          ? 'PAN does not match the GSTIN (characters 3–12)'
          : '';
      } else {
        this.panError = '';
      }
    }
  }

  verifyGst() {
    const gstin = (this.form.get('gstNumber')?.value || '').toUpperCase();
    const pan = (this.form.get('panNumber')?.value || '').toUpperCase();

    if (!gstin || !pan || this.gstinError || this.panError) return;

    this.verifyingGst = true;
    this.form.patchValue({
      gstStatus: 'pending',
      verificationError: null
    });

    const backendUrl = environment.apiUrl.replace('/api/v1', '');
    const verifyUrl = `${backendUrl}/api/verify-gstin`;

    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(verifyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ gstin })
    })
      .then(res => res.json())
      .then(data => {
        this.verifyingGst = false;
        if (data.success && data.data) {
          const resData = data.data;
          const isGstActive = (resData.status || 'Active').toLowerCase() === 'active';

          if (isGstActive) {
            this.form.patchValue({
              gstVerified: true,
              gstStatus: 'verified',
              legalBusinessName: resData.legalName || 'N/A',
              verifiedAt: new Date().toISOString(),
              verificationError: null
            });
          } else {
            const errMsg = `GSTIN status is ${resData.status}. Only active registrations can be verified.`;
            this.form.patchValue({
              gstVerified: false,
              gstStatus: 'failed',
              gstEnabled: false,
              verificationError: errMsg
            });
          }
        } else {
          this.form.patchValue({
            gstVerified: false,
            gstStatus: 'failed',
            gstEnabled: false,
            verificationError: data.message || 'GST verification failed.'
          });
        }
      })
      .catch(err => {
        this.verifyingGst = false;
        this.form.patchValue({
          gstVerified: false,
          gstStatus: 'failed',
          gstEnabled: false,
          verificationError: 'Unable to connect to verification server.'
        });
      });
  }

  loadShopTaxConfig() {
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        if (res.data?.taxConfig) {
          const tc = res.data.taxConfig;
          this.form.patchValue({
            gstEnabled: tc.gstEnabled || false,
            gstNumber: tc.gstNumber || '',
            panNumber: tc.panNumber || (tc.gstNumber ? tc.gstNumber.substring(2, 12) : ''),
            legalBusinessName: tc.legalBusinessName || '',
            gstVerified: tc.gstVerified || false,
            gstStatus: tc.gstStatus || (tc.gstVerified ? 'verified' : (tc.gstNumber ? 'pending' : 'not_configured')),
            verifiedAt: tc.verifiedAt || null,
            verificationError: tc.verificationError || null,
            gstRate: tc.gstRate || 18,
            gstType: tc.gstType || 'exclusive',
            splitGst: tc.splitGst !== undefined ? tc.splitGst : true,
            igstOnInterstate: tc.igstOnInterstate !== undefined ? tc.igstOnInterstate : true
          });
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  save() {
    if (!this.shopId) return;
    this.saving = true;
    const taxConfig: TaxConfig = this.form.value;

    this.shopService.updateShop(this.shopId, { taxConfig }).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  statusLabel(status?: string): string {
    const labels: Record<string, string> = {
      not_configured: 'Not Configured',
      pending: 'Pending Verification',
      verified: 'Verified',
      failed: 'Verification Failed'
    };
    return labels[status || ''] || 'Not Configured';
  }

  statusBadgeClass(status?: string): string {
    const map: Record<string, string> = {
      not_configured: 'bg-gray-100 text-gray-600 border-gray-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200'
    };
    return map[status || ''] || 'bg-gray-100 text-gray-600 border-gray-200';
  }

  statusDotClass(status?: string): string {
    const map: Record<string, string> = {
      not_configured: 'bg-gray-400',
      pending: 'bg-amber-400 animate-pulse',
      verified: 'bg-emerald-500',
      failed: 'bg-red-500'
    };
    return map[status || ''] || 'bg-gray-400';
  }

  formatDateString(ts: any): string {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  }
}

