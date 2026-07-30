import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';
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
                class="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center"
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
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-black"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100"
                >
                  <i class="bi bi-credit-card text-2xl text-primary-600"></i>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-900">Razorpay Integration</h2>
                  <p class="text-xs text-gray-500">
                    Accept Credit Cards, Debit Cards, Wallets, and Razorpay Official Merchant UPI.
                  </p>
                </div>
              </div>
              <div
                *ngIf="isRazorpayConnected"
                class="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              >
                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Connected
              </div>
            </div>

            <form [formGroup]="razorpayForm" (ngSubmit)="saveRazorpay()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <app-ui-input
                  formControlName="keyId"
                  label="Key ID"
                  placeholder="rzp_live_..."
                ></app-ui-input>

                <app-ui-input
                  formControlName="keySecret"
                  label="Key Secret"
                  placeholder="••••••••••••••••"
                ></app-ui-input>

                <app-ui-input
                  formControlName="merchantVpa"
                  label="Merchant VPA / UPI ID (Optional)"
                  placeholder="rzp.merchant@icici"
                ></app-ui-input>
              </div>
              <div class="flex justify-between items-center pt-2">
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  class="text-xs text-primary-600 hover:text-primary-700 underline font-medium"
                >Get API Keys from Razorpay Dashboard</a
                >
                <button
                  type="submit"
                  [disabled]="loading"
                  class="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  Save Razorpay Details
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
    private toastService: ToastService,
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
      merchantVpa: [''],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = params.get('shopId');
      if (id) {
        this.shopId = id;
        this.loadShopSettings();
      }
    });
  }

  loadShopSettings() {
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        if (res.data) {
          const shop = res.data;
          this.codEnabled = shop.paymentModes?.cod ?? true;

          if (shop.upiDetails) {
            this.upiForm.patchValue(shop.upiDetails);
          }
          if (shop.bankDetails) {
            this.bankForm.patchValue(shop.bankDetails);
          }
          if (shop.razorpay) {
            this.razorpayForm.patchValue({
              keyId: shop.razorpay.keyId || '',
              keySecret: shop.razorpay.keySecret || '',
              merchantVpa: shop.razorpay.merchantVpa || '',
            });
            this.isRazorpayConnected = !!shop.razorpay.connected;
          }
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleCod() {
    this.shopService
      .updateShop(this.shopId, {
        paymentModes: {
          cod: this.codEnabled,
          online: this.isRazorpayConnected,
          bankTransfer: true,
        },
      })
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            `COD payment has been ${this.codEnabled ? 'enabled' : 'disabled'}.`,
            'Settings Saved',
          );
        },
        error: () => {
          this.toastService.showError('Failed to update COD settings.', 'Error');
        },
      });
  }

  saveUpi() {
    const upiDetails: UpiDetails = this.upiForm.value;
    this.shopService.updateShop(this.shopId, { upiDetails }).subscribe({
      next: () => {
        this.toastService.showSuccess('UPI details saved successfully!', 'Saved');
      },
      error: () => {
        this.toastService.showError('Failed to save UPI details.', 'Error');
      },
    });
  }

  saveBank() {
    const bankDetails: BankDetails = this.bankForm.value;
    this.shopService.updateShop(this.shopId, { bankDetails }).subscribe({
      next: () => {
        this.toastService.showSuccess('Bank transfer details saved successfully!', 'Saved');
      },
      error: () => {
        this.toastService.showError('Failed to save bank details.', 'Error');
      },
    });
  }

  saveRazorpay() {
    const { keyId, keySecret, merchantVpa } = this.razorpayForm.value;
    const razorpay: RazorpayConfig = {
      keyId,
      keySecret,
      merchantVpa,
      connected: !!(keyId && keyId.trim().length > 3),
    };

    this.shopService.updateShop(this.shopId, { razorpay }).subscribe({
      next: () => {
        this.isRazorpayConnected = razorpay.connected;
        if (razorpay.connected) {
          this.toastService.showSuccess('Razorpay account connected successfully!', 'Connected');
        } else {
          this.toastService.showSuccess('Razorpay settings saved.', 'Saved');
        }
      },
      error: () => {
        this.toastService.showError('Failed to save Razorpay settings.', 'Error');
      },
    });
  }
}
