import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { InvoiceConfig } from '../../../core/models/shop.model';

@Component({
  selector: 'app-invoice-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 lg:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Invoice Template</h1>
          <p class="text-gray-500 mt-1">Customize the look and feel of your customer invoices.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Settings Sidebar -->
          <div class="space-y-6">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
              <!-- Template Selection -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 class="font-semibold text-gray-900 mb-4">Choose Invoice Template</h2>
                <div class="grid grid-cols-2 gap-4">
                  <label
                    class="relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all"
                    [class.border-blue-500]="form.get('templateType')?.value === 'default'"
                    [class.bg-blue-50]="form.get('templateType')?.value === 'default'"
                    [class.border-gray-100]="form.get('templateType')?.value !== 'default'"
                  >
                    <input type="radio" formControlName="templateType" value="default" class="hidden" />
                    <span class="font-bold text-sm">Default Template</span>
                    <span class="text-xs text-gray-500 mt-1">Standard layout with spiritual header.</span>
                  </label>
                  <label
                    class="relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all"
                    [class.border-blue-500]="form.get('templateType')?.value === 'custom'"
                    [class.bg-blue-50]="form.get('templateType')?.value === 'custom'"
                    [class.border-gray-100]="form.get('templateType')?.value !== 'custom'"
                  >
                    <input type="radio" formControlName="templateType" value="custom" class="hidden" />
                    <span class="font-bold text-sm">Custom Template</span>
                    <span class="text-xs text-gray-500 mt-1">Modern layout with logo and colors.</span>
                  </label>
                </div>
              </div>

              <!-- Basic Configuration -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 class="font-semibold text-gray-900 mb-4">Identification</h2>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Invoice Prefix</label
                    >
                    <input
                      formControlName="prefix"
                      type="text"
                      placeholder="INV-"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Starting Number</label
                    >
                    <input
                      formControlName="startingNumber"
                      type="number"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                </div>
              </div>

              <!-- Content Toggles -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 class="font-semibold text-gray-900 mb-4">Visibility & Toggles</h2>
                <div class="space-y-3">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700">Show Shop Logo</span>
                    <input
                      type="checkbox"
                      formControlName="showLogo"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700">Show Payment QR Code</span>
                    <input
                      type="checkbox"
                      formControlName="showQrCode"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700">Show GST Breakdown</span>
                    <input
                      type="checkbox"
                      formControlName="showGstBreakdown"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700">Show Signature Line</span>
                    <input
                      type="checkbox"
                      formControlName="showSignatureLine"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                  </label>
                </div>
              </div>

              <!-- Footer & Terms -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 class="font-semibold text-gray-900 mb-4">Footer & Legal</h2>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                    <input
                      formControlName="footerText"
                      type="text"
                      placeholder="Thank you for your business!"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                  <div class="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      formControlName="showTermsAndConditions"
                      id="showTerms"
                      class="w-4 h-4 text-primary-600 rounded"
                    />
                    <label for="showTerms" class="text-sm font-medium text-gray-700"
                      >Show Terms & Conditions</label
                    >
                  </div>
                  <div *ngIf="form.get('showTermsAndConditions')?.value">
                    <textarea
                      formControlName="termsText"
                      rows="4"
                      placeholder="1. Goods once sold will not be taken back..."
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Branding -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 class="font-semibold text-gray-900 mb-4">Branding Accent</h2>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      formControlName="accentColor"
                      type="color"
                      class="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span class="text-sm font-mono text-gray-500 uppercase">{{
                      form.get('accentColor')?.value
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4">
                @if (saved) {
                  <div class="flex items-center gap-2 text-green-600 font-medium text-sm">
                    <i class="bi bi-check-circle-fill"></i> Invoice template saved!
                  </div>
                }
                <button
                  type="submit"
                  [disabled]="saving || loading"
                  class="bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  @if (saving || loading) {
                    <span
                      class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"
                    ></span>
                  }
                  Save Template
                </button>
              </div>
            </form>
          </div>

          <!-- Live Preview -->
          <div class="lg:sticky lg:top-8 self-start">
            <div class="bg-gray-200 p-4 rounded-2xl">
              <div
                class="bg-white shadow-2xl p-8 aspect-[1/1.414] w-full max-w-[500px] mx-auto overflow-hidden text-[10px] leading-tight flex flex-col"
              >
                <ng-container *ngIf="form.get('templateType')?.value === 'default'">
                  <!-- Default Template Preview (Traditional) -->
                  <div class="text-center text-[8px] font-bold mb-2">|| Shree Ganeshay Namah ||</div>
                  <div class="border border-black p-2 mb-2">
                    <div class="flex justify-between items-start">
                      <div class="w-1/3 text-[8px]">
                        <div class="font-bold">CLOTHIFY SHOP</div>
                        <div>+91 98765 43210</div>
                        <div>123 Fashion Street, New Delhi</div>
                      </div>
                      <div class="w-1/3 text-center">
                        <h1 class="text-xl font-bold uppercase">CLOTHIFY SHOP</h1>
                        <p class="text-[6px]">Exclusive Collection</p>
                      </div>
                      <div class="w-1/3 text-right text-[8px]">
                        <div>contact@clothify.com</div>
                      </div>
                    </div>
                  </div>
                  <div class="border border-black p-2 mb-2 flex justify-between">
                    <div class="w-1/2 border-r border-black pr-2">
                      <div class="flex"><span class="w-12 font-bold">M/s. Name:</span> <span class="border-b border-black border-dotted flex-1">John Doe</span></div>
                    </div>
                    <div class="w-1/2 pl-2">
                      <div class="flex"><span class="w-12 font-bold">Bill No:</span> <span class="font-bold">{{ form.get('prefix')?.value || 'INV-' }}1001</span></div>
                    </div>
                  </div>
                  <div class="flex-1">
                    <table class="w-full border-collapse border border-black">
                      <thead>
                        <tr class="border-b border-black text-[8px]">
                          <th class="border-r border-black p-1">Particulars</th>
                          <th class="border-r border-black p-1 text-right">Qty</th>
                          <th class="text-right p-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-gray-200">
                          <td class="border-r border-black p-1">Premium Cotton T-Shirt</td>
                          <td class="border-r border-black p-1 text-right">2</td>
                          <td class="text-right p-1 font-bold">₹1,998</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="border border-black p-2 mt-4 text-[8px]">
                    <div class="flex justify-between font-bold text-sm">
                      <span>Net Amount</span>
                      <span>₹5,306.46</span>
                    </div>
                  </div>
                  <div class="border border-black p-2 flex justify-between items-end mt-2 h-16">
                    <div class="text-[6px] w-1/2">
                      <div class="font-bold underline">Terms & Conditions:</div>
                      <p>Goods once sold will not be taken back.</p>
                    </div>
                    <div class="text-center w-1/3 border-t border-black pt-1">Authorized Signature</div>
                  </div>
                </ng-container>

                <ng-container *ngIf="form.get('templateType')?.value === 'custom'">
                  <!-- Custom Template Preview (Modern) -->
                  <!-- Invoice Header -->
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <div
                      *ngIf="form.get('showLogo')?.value"
                      class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden"
                    >
                      <i class="bi bi-image text-gray-300 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold" [style.color]="form.get('accentColor')?.value">
                      CLOTHIFY SHOP
                    </h3>
                    <p class="text-gray-500">123 Fashion Street, New Delhi, 110001</p>
                    <p class="text-gray-500">GST: 07AAAAA0000A1Z5</p>
                  </div>
                  <div class="text-right">
                    <h2 class="text-2xl font-black text-gray-300">INVOICE</h2>
                    <p class="font-bold text-gray-900 mt-2">
                      {{ form.get('prefix')?.value || 'INV-' }}1001
                    </p>
                    <p class="text-gray-500">Date: Feb 21, 2026</p>
                  </div>
                </div>

                <!-- Client Info -->
                <div class="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-100">
                  <div>
                    <p class="text-[8px] uppercase font-bold text-gray-400 mb-1">Bill To</p>
                    <p class="font-bold">John Doe</p>
                    <p class="text-gray-500">+91 98765 43210</p>
                  </div>
                </div>

                <!-- Table -->
                <div class="flex-1">
                  <table class="w-full text-left">
                    <thead>
                      <tr class="border-b border-gray-200 text-[8px] uppercase text-gray-400">
                        <th class="py-2">Item</th>
                        <th class="py-2 text-right">Qty</th>
                        <th class="py-2 text-right">Price</th>
                        <th class="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 font-medium">Premium Cotton T-Shirt (Black/M)</td>
                        <td class="py-3 text-right">2</td>
                        <td class="py-3 text-right">₹999</td>
                        <td class="py-3 text-right font-bold">₹1,998</td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 font-medium">Slim Fit Denim Jeans</td>
                        <td class="py-3 text-right">1</td>
                        <td class="py-3 text-right">₹2,499</td>
                        <td class="py-3 text-right font-bold">₹2,499</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Totals -->
                <div class="mt-8 flex justify-between items-end">
                  <div class="w-1/2">
                    <div
                      *ngIf="form.get('showQrCode')?.value"
                      class="w-20 h-20 bg-gray-50 border border-gray-100 rounded p-1 flex items-center justify-center"
                    >
                      <i class="bi bi-qr-code text-3xl"></i>
                    </div>
                  </div>
                  <div class="w-1/3 space-y-1">
                    <div class="flex justify-between text-gray-500">
                      <span>Subtotal:</span>
                      <span>₹4,497</span>
                    </div>
                    <div
                      *ngIf="form.get('showGstBreakdown')?.value"
                      class="flex justify-between text-gray-500"
                    >
                      <span>GST (18%):</span>
                      <span>₹809.46</span>
                    </div>
                    <div
                      class="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"
                      [style.color]="form.get('accentColor')?.value"
                    >
                      <span>Total:</span>
                      <span>₹5,306.46</span>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="mt-8 pt-4 border-t border-gray-100 text-center">
                  <p class="font-medium text-gray-600 mb-2">
                    {{ form.get('footerText')?.value || 'Thank you for shopping!' }}
                  </p>
                  <div
                    *ngIf="form.get('showTermsAndConditions')?.value"
                    class="text-[6px] text-gray-400 text-left bg-gray-50 p-2 rounded"
                  >
                    <p class="font-bold mb-1">TERMS & CONDITIONS</p>
                    <p class="whitespace-pre-line">{{ form.get('termsText')?.value }}</p>
                  </div>
                  <div *ngIf="form.get('showSignatureLine')?.value" class="mt-4 flex justify-end">
                    <div class="text-right">
                      <div class="w-24 border-b border-gray-300 ml-auto mb-1"></div>
                      <p class="text-[8px] uppercase text-gray-400">Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>
              <p class="text-center text-xs text-gray-500 mt-4 italic">
                Note: This is a live preview. Actual scale may vary on print.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class InvoiceTemplateComponent implements OnInit {
  form: FormGroup;
  saving = false;
  saved = false;
  loading = true;
  shopId: string = '';

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
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

  loadShopInvoiceConfig() {
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        if (res.data?.invoiceConfig) {
          this.form.patchValue(res.data.invoiceConfig);
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
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
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => (this.saving = false),
    });
  }
}
