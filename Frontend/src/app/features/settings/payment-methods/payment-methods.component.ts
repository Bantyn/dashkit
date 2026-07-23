import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { UpiDetails, BankDetails, RazorpayConfig } from '../../../core/models/shop.model';
import { UiInputComponent } from '../../../shared/components/ui-input.component';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiInputComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 lg:p-10 max-w-full mx-auto">
        <div class="mb-8 flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Payment Methods</h1>
            <p class="text-gray-500 mt-1">Manage how customers pay for their orders.</p>
          </div>
          <div *ngIf="loading" class="animate-spin text-primary-600">
            <i class="bi bi-arrow-repeat text-2xl"></i>
          </div>
        </div>

        <div class="space-y-6">
          <!-- 1. Cash on Delivery -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center"
                >
                  <i class="bi bi-cash-stack text-lg"></i>
                </div>
                <div>
                  <h2 class="font-bold text-gray-900">Cash on Delivery (COD)</h2>
                  <p class="text-xs text-gray-500">Enable customers to pay at their doorstep.</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="codEnabled"
                  (change)="toggleCod()"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>
          </div>

          <!-- 2. UPI Payments -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"
              >
                <i class="bi bi-qr-code-scan text-lg"></i>
              </div>
              <div>
                <h2 class="font-bold text-gray-900">UPI Payments</h2>
                <p class="text-xs text-gray-500">
                  Collect direct payments via BHIM, GPay, PhonePe, etc.
                </p>
              </div>
            </div>

            <form [formGroup]="upiForm" (ngSubmit)="saveUpi()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <app-ui-input
                  formControlName="upiId"
                  label="VPA / UPI ID"
                  placeholder="yourname@okaxis"
                ></app-ui-input>
                <app-ui-input
                  formControlName="accountName"
                  label="Display Name (Account Holder)"
                  placeholder="Clothify Fashion"
                ></app-ui-input>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  class="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 shadow-sm transition-all active:scale-95"
                >
                  Save UPI Info
                </button>
              </div>
            </form>
          </div>

          <!-- 3. Bank Transfer -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"
              >
                <i class="bi bi-bank text-lg"></i>
              </div>
              <div>
                <h2 class="font-bold text-gray-900">Bank Transfer (IMPS/NEFT/RTGS)</h2>
                <p class="text-xs text-gray-500">Provide bank details for manual transfers.</p>
              </div>
            </div>

            <form [formGroup]="bankForm" (ngSubmit)="saveBank()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <app-ui-input
                    formControlName="accountName"
                    label="Account Holder Name"
                  ></app-ui-input>
                </div>
                <app-ui-input
                  formControlName="accountNumber"
                  label="Account Number"
                ></app-ui-input>
                <app-ui-input
                  formControlName="ifscCode"
                  label="IFSC Code"
                  placeholder="BARB0VANIXX"
                ></app-ui-input>
                <app-ui-input
                  formControlName="bankName"
                  label="Bank Name"
                ></app-ui-input>
                <app-ui-input
                  formControlName="branch"
                  label="Branch Name (Optional)"
                ></app-ui-input>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  class="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 shadow-sm transition-all active:scale-95"
                >
                  Save Bank Details
                </button>
              </div>
            </form>
          </div>

          <!-- 4. Razorpay Integration -->
          <div
            class="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 shadow-xl p-8 text-white"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/5"
                >
                  <i class="bi bi-credit-card text-2xl text-primary-400"></i>
                </div>
                <div>
                  <h2 class="text-xl font-bold">Razorpay Integration</h2>
                  <p class="text-sm text-gray-400">
                    Accept Credit Cards, Debit Cards, and Wallets.
                  </p>
                </div>
              </div>
              <div
                *ngIf="isRazorpayConnected"
                class="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
              >
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Connected
              </div>
            </div>

            <form [formGroup]="razorpayForm" (ngSubmit)="saveRazorpay()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"
                    >Key ID</label
                  >
                  <input
                    formControlName="keyId"
                    type="text"
                    placeholder="rzp_live_..."
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-600 transition-all"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"
                    >Key Secret</label
                  >
                  <input
                    formControlName="keySecret"
                    type="password"
                    placeholder="••••••••••••••••"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div class="flex justify-between items-center pt-2">
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  class="text-xs text-primary-400 hover:text-primary-300 underline font-medium"
                  >Get API Keys</a
                >
                <button
                  type="submit"
                  [disabled]="loading"
                  class="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary-500 shadow-lg shadow-primary-900/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Connect Razorpay
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class PaymentMethodsComponent implements OnInit {
  upiForm: FormGroup;
  bankForm: FormGroup;
  razorpayForm: FormGroup;
  codEnabled = true;
  isRazorpayConnected = false;
  shopId: string = '';
  loading = true;

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private route: ActivatedRoute,
  ) {
    this.upiForm = this.fb.group({
      upiId: [''],
      accountName: [''],
    });

    this.bankForm = this.fb.group({
      accountName: [''],
      accountNumber: [''],
      ifscCode: [''],
      bankName: [''],
      branch: [''],
    });

    this.razorpayForm = this.fb.group({
      keyId: [''],
      keySecret: [''],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = params.get('shopId');
      if (id) {
        this.shopId = id;
        this.loadShopPaymentConfig();
      }
    });
  }

  loadShopPaymentConfig() {
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        const shop = res.data;
        if (shop) {
          this.codEnabled = shop.paymentModes?.cod ?? true;
          this.isRazorpayConnected = shop.razorpay?.connected ?? false;
          if (shop.upiDetails) this.upiForm.patchValue(shop.upiDetails);
          if (shop.bankDetails) this.bankForm.patchValue(shop.bankDetails);
          if (shop.razorpay) this.razorpayForm.patchValue({ keyId: shop.razorpay.keyId });
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleCod() {
    if (!this.shopId) return;
    this.shopService
      .updateShop(this.shopId, {
        paymentModes: {
          cod: this.codEnabled,
          online: this.isRazorpayConnected,
          bankTransfer: !!this.bankForm.get('accountNumber')?.value,
        },
      })
      .subscribe();
  }

  saveUpi() {
    if (!this.shopId) return;
    this.shopService.updateShop(this.shopId, { upiDetails: this.upiForm.value }).subscribe();
  }

  saveBank() {
    if (!this.shopId) return;
    this.shopService.updateShop(this.shopId, { bankDetails: this.bankForm.value }).subscribe();
  }

  saveRazorpay() {
    if (!this.shopId) return;
    const config: RazorpayConfig = {
      keyId: this.razorpayForm.value.keyId,
      keySecret: this.razorpayForm.value.keySecret,
      connected: true,
    };
    this.shopService.updateShop(this.shopId, { razorpay: config }).subscribe(() => {
      this.isRazorpayConnected = true;
    });
  }
}
