import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceConfig, Shop } from '../../../core/models/shop.model';
import { PaymentQrService, PaymentQrResult } from '../../../core/services/payment-qr.service';
import { InvoicePrintComponent } from '../../../shared/components/invoice-print.component';

@Component({
  selector: 'app-invoice-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InvoicePrintComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-primary-50 min-h-screen">
      <main class="p-6 lg:p-10 max-w-full mx-auto">
        <!-- Page Header -->
        <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-2">
              <i class="bi bi-file-earmark-richtext"></i> Invoice Customizer
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Invoice Template Settings</h1>
            <p class="text-gray-500 text-sm mt-0.5">Customize your invoice design, numbering, terms, accent color, and live payment QR code.</p>
          </div>
          <div *ngIf="loading" class="flex items-center gap-2 text-primary-600 font-semibold text-sm animate-pulse">
            <span class="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
            Loading settings...
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <!-- Settings Form Sidebar -->
          <div class="space-y-6">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
              
              <!-- 1. Template Selection -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                  <i class="bi bi-layout-text-window-reverse text-primary-600 text-lg"></i>
                  <h2 class="font-bold text-gray-900 text-base">Select Template Layout</h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    (click)="setTemplate('default')"
                    class="relative flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-primary-300"
                    [class.border-primary-600]="form.get('templateType')?.value === 'default'"
                    [class.bg-primary-50/60]="form.get('templateType')?.value === 'default'"
                    [class.border-gray-200]="form.get('templateType')?.value !== 'default'"
                  >
                    <input type="radio" formControlName="templateType" value="default" class="hidden" />
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-sm text-gray-900">Default Traditional</span>
                      <i *ngIf="form.get('templateType')?.value === 'default'" class="bi bi-check-circle-fill text-primary-600"></i>
                    </div>
                    <span class="text-xs text-gray-500 mt-2 leading-relaxed">
                      Traditional Indian ERP format with spiritual header (|| Shree Ganeshay Namah ||) and black grid borders.
                    </span>
                  </label>

                  <label
                    (click)="setTemplate('custom')"
                    class="relative flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-primary-300"
                    [class.border-primary-600]="form.get('templateType')?.value === 'custom'"
                    [class.bg-primary-50/60]="form.get('templateType')?.value === 'custom'"
                    [class.border-gray-200]="form.get('templateType')?.value !== 'custom'"
                  >
                    <input type="radio" formControlName="templateType" value="custom" class="hidden" />
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-sm text-gray-900">Custom Modern</span>
                      <i *ngIf="form.get('templateType')?.value === 'custom'" class="bi bi-check-circle-fill text-primary-600"></i>
                    </div>
                    <span class="text-xs text-gray-500 mt-2 leading-relaxed">
                      Modern card layout with shop logo, accent color themes, and payment status badges.
                    </span>
                  </label>
                </div>
              </div>

              <!-- 2. Invoice Identification -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                  <i class="bi bi-[#] text-primary-600 text-lg"></i>
                  <h2 class="font-bold text-gray-900 text-base">Invoice Numbering</h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Invoice Prefix</label>
                    <input
                      formControlName="prefix"
                      type="text"
                      placeholder="e.g. INV-"
                      class="w-full border border-gray-200 bg-primary-50/50 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Starting Sequence No.</label>
                    <input
                      formControlName="startingNumber"
                      type="number"
                      class="w-full border border-gray-200 bg-primary-50/50 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <!-- 3. Visibility & Content Toggles -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                  <i class="bi bi-sliders text-primary-600 text-lg"></i>
                  <h2 class="font-bold text-gray-900 text-base">Visibility Toggles</h2>
                </div>

                <div class="space-y-4">
                  <label class="flex items-center justify-between cursor-pointer select-none">
                    <span class="text-sm font-medium text-gray-800">Show Shop Logo</span>
                    <input
                      type="checkbox"
                      formControlName="showLogo"
                      class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                    />
                  </label>

                  <div class="border-t border-gray-100 pt-3">
                    <label class="flex items-center justify-between cursor-pointer select-none">
                      <span class="text-sm font-medium text-gray-800">Show Payment QR Code</span>
                      <input
                        type="checkbox"
                        formControlName="showQrCode"
                        class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </label>

                    <!-- QR Status / Priority Warning Box -->
                    <div *ngIf="form.get('showQrCode')?.value" class="mt-2.5">
                      <div *ngIf="qrResult.available" class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <i class="bi bi-qr-code text-emerald-600 text-sm"></i>
                          <span>Active Source: <strong>{{ qrResult.sourceType === 'razorpay' ? 'Razorpay Account' : 'UPI Payment ID' }}</strong></span>
                        </div>
                        <span class="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{{ qrResult.paymentDestination }}</span>
                      </div>

                      <div *ngIf="!qrResult.available" class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
                        <i class="bi bi-exclamation-triangle-fill text-amber-600 text-base shrink-0 mt-0.5"></i>
                        <div>
                          <p class="font-bold text-amber-900">Payment QR cannot be generated.</p>
                          <p class="mt-1 text-amber-700 leading-relaxed">
                            Please configure either <strong>Razorpay Account</strong> or <strong>UPI ID</strong> in Payment Settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="border-t border-gray-100 pt-3">
                    <label class="flex items-center justify-between cursor-pointer select-none">
                      <span class="text-sm font-medium text-gray-800">Show GST Breakdown</span>
                      <input
                        type="checkbox"
                        formControlName="showGstBreakdown"
                        class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div class="border-t border-gray-100 pt-3">
                    <label class="flex items-center justify-between cursor-pointer select-none">
                      <span class="text-sm font-medium text-gray-800">Show Signature Line</span>
                      <input
                        type="checkbox"
                        formControlName="showSignatureLine"
                        class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div class="border-t border-gray-100 pt-3">
                    <label class="flex items-center justify-between cursor-pointer select-none">
                      <span class="text-sm font-medium text-gray-800">Show Terms & Conditions</span>
                      <input
                        type="checkbox"
                        formControlName="showTermsAndConditions"
                        class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <!-- 4. Custom Terms & Notes -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="bi bi-chat-left-text text-primary-600 text-lg"></i>
                  <h2 class="font-bold text-gray-900 text-base">Custom Note & Terms</h2>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Terms & Conditions</label>
                  <textarea
                    formControlName="termsText"
                    rows="3"
                    class="w-full border border-gray-200 bg-primary-50/50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all resize-none"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Footer Note</label>
                  <input
                    formControlName="footerText"
                    type="text"
                    class="w-full border border-gray-200 bg-primary-50/50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                  />
                </div>
              </div>

              <!-- 5. Color Palette & Styling -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                  <i class="bi bi-palette text-primary-600 text-lg"></i>
                  <h2 class="font-bold text-gray-900 text-base">Accent Header Color</h2>
                </div>
                
                <div class="space-y-4">
                  <!-- Color Presets -->
                  <div class="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      *ngFor="let color of colorPresets"
                      type="button"
                      (click)="setColor(color.hex)"
                      class="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center shrink-0"
                      [style.background-color]="color.hex"
                      [class.border-black]="form.get('accentColor')?.value === color.hex"
                      [class.border-transparent]="form.get('accentColor')?.value !== color.hex"
                      [title]="color.name"
                    >
                      <i *ngIf="form.get('accentColor')?.value === color.hex" class="bi bi-check text-white text-xs"></i>
                    </button>
                  </div>

                  <div class="flex items-center gap-3">
                    <input
                      formControlName="accentColor"
                      type="color"
                      class="h-10 w-16 border border-gray-200 rounded-xl p-1 cursor-pointer"
                    />
                    <span class="text-sm font-mono font-bold text-gray-700 uppercase">{{
                      form.get('accentColor')?.value
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Save Action Bar -->
              <div class="flex items-center justify-between pt-2">
                <span
                  *ngIf="saved"
                  class="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-fade-in"
                >
                  <i class="bi bi-check-circle-fill"></i> Template saved successfully
                </span>
                <button
                  type="submit"
                  [disabled]="saving || loading"
                  class="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-md ml-auto"
                >
                  <span
                    *ngIf="saving"
                    class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"
                  ></span>
                  Save Template Settings
                </button>
              </div>
            </form>
          </div>

          <!-- Sticky Live Preview Area (Right Panel) -->
          <div class="space-y-4 lg:sticky lg:top-8">
            <div class="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
              <div class="flex items-center gap-2">
                <i class="bi bi-eye text-primary-600 text-lg"></i>
                <h2 class="font-bold text-gray-900 text-sm">Live Invoice Preview</h2>
              </div>
              <span class="text-xs font-bold px-3 py-1 bg-primary-100 text-primary-800 rounded-full border border-primary-200">
                {{ form.get('templateType')?.value === 'custom' ? 'Custom Modern' : 'Default Traditional' }}
              </span>
            </div>

            <!-- Preview Card Window -->
            <div class="bg-slate-900/5 p-6 rounded-3xl border border-slate-200/80 shadow-inner max-w-2xl mx-auto overflow-auto max-h-[85vh] custom-scrollbar">
              <div class="bg-white border border-gray-300 shadow-xl rounded-2xl overflow-hidden p-2">
                <app-invoice-print
                  [shop]="previewShop"
                  [invoice]="previewInvoice"
                ></app-invoice-print>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class InvoiceTemplateComponent implements OnInit {
  form: FormGroup;
  saving = false;
  saved = false;
  loading = true;
  shopId: string = '';
  currentShop: Shop | null = null;
  qrResult: PaymentQrResult = { available: false, sourceType: 'none' };

  colorPresets = [
    { name: 'Slate Dark', hex: '#0f172a' },
    { name: 'Indigo Brand', hex: '#4f46e5' },
    { name: 'Emerald Green', hex: '#059669' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Crimson Red', hex: '#dc2626' },
    { name: 'Deep Violet', hex: '#7c3aed' },
  ];

  previewInvoice = {
    invoiceNumber: 'INV-1001',
    invoiceDate: new Date('2024-10-24'),
    customerName: 'Dashki Custome',
    customerEmail: 'cutomer@example.com',
    customerPhone: '+91 11223 34455',
    paymentMethod: 'Online UPI / Card',
    paymentStatus: 'paid',
    items: [
      { productName: 'Cotton Casual T-Shirt', quantity: 2, unitPrice: 999, total: 1998 },
      { productName: 'Slim Fit Denim Jeans', quantity: 1, unitPrice: 2499, total: 2499 },
    ],
    subtotal: 4497,
    taxAmount: 809.46,
    total: 5306.46,
  };

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private qrService: PaymentQrService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      prefix: ['INV-'],
      startingNumber: [1001],
      showLogo: [true],
      showQrCode: [true],
      showGstBreakdown: [true],
      showSignatureLine: [true],
      showTermsAndConditions: [true],
      termsText: [
        '1. Goods once sold will be replaced but not taken back.\n2. Warranty as per manufacturer norms.\n3. Subject to jurisdiction of New Delhi Courts.',
      ],
      footerText: ['Thank you for your business!'],
      accentColor: ['#0f172a'],
      templateType: ['default'],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = params.get('shopId');
      if (id) {
        this.shopId = id;
        this.loadShopInvoiceConfig();
      }
    });
  }

  setTemplate(type: 'default' | 'custom') {
    this.form.patchValue({ templateType: type });
  }

  setColor(hex: string) {
    this.form.patchValue({ accentColor: hex });
  }

  get previewShop(): Shop | null {
    if (!this.currentShop) return null;
    const prefix = this.form.get('prefix')?.value || 'INV-';
    const num = this.form.get('startingNumber')?.value || 1001;
    this.previewInvoice.invoiceNumber = `${prefix}${num}`;

    return {
      ...this.currentShop,
      invoiceConfig: {
        ...this.currentShop.invoiceConfig,
        ...this.form.value,
      },
    };
  }

  loadShopInvoiceConfig() {
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        if (res.data) {
          this.currentShop = res.data;
          this.qrResult = this.qrService.getPaymentQrDetails(this.currentShop);
          if (res.data.invoiceConfig) {
            this.form.patchValue(res.data.invoiceConfig);
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.showError('Failed to load invoice configuration.', 'Error');
      },
    });
  }

  save() {
    if (!this.shopId) return;
    this.saving = true;
    const invoiceConfig: InvoiceConfig = this.form.value;

    this.shopService.updateShop(this.shopId, { invoiceConfig }).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        this.toastService.showSuccess('Invoice template settings saved successfully!', 'Template Saved');
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.toastService.showError('Failed to save template settings.', 'Error');
      },
    });
  }
}
