import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Shop } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-website-settings-general',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">General Settings</h2>
            <p class="text-sm text-gray-500 mt-1">
              Configure payments, order flow, and website behaviour.
            </p>
          </div>
          <button
            (click)="onSave()"
            [disabled]="saving || loading"
            class="px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
          >
            @if (saving) {
              <div
                class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"
              ></div>
            }
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

        @if (loading) {
          <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        } @else {
          <form [formGroup]="form" class="space-y-6">
            <!-- Website Visibility -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <i class="bi bi-eye-fill text-indigo-600 text-lg"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">Website Visibility</p>
                    <p class="text-sm text-gray-500">
                      When disabled, visitors see a "Coming Soon" page.
                    </p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="websiteEnabled" class="sr-only peer" />
                  <div
                    class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                  ></div>
                </label>
              </div>
            </div>

            <!-- Payment Modes -->
            <div
              class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
              formGroupName="paymentModes"
            >
              <div class="flex items-center gap-3 pb-3 border-b border-gray-50">
                <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <i class="bi bi-credit-card-fill text-green-600 text-lg"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Payment Modes</h3>
                  <p class="text-xs text-gray-400">
                    Choose which payment methods customers can use at checkout.
                  </p>
                </div>
              </div>

              <!-- COD -->
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0"
                  >
                    <i class="bi bi-cash-stack text-orange-500"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">Cash on Delivery (COD)</p>
                    <p class="text-xs text-gray-400">Customer pays when the order is delivered</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="cod" class="sr-only peer" />
                  <div
                    class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                  ></div>
                </label>
              </div>

              <!-- Online -->
              <div class="flex items-center justify-between py-2 border-t border-gray-50">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0"
                  >
                    <i class="bi bi-phone-fill text-blue-500"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">Online Payment (UPI / Cards)</p>
                    <p class="text-xs text-gray-400" *ngIf="isRazorpayConnected">
                      UPI, debit/credit cards, and netbanking via your connected Razorpay account
                    </p>
                    <p class="text-xs text-red-500 font-semibold" *ngIf="!isRazorpayConnected">
                      Razorpay is not connected. <a [routerLink]="['/shop', shopId, 'settings', 'payment-methods']" class="text-primary-600 underline">Connect Razorpay</a> first to enable online payments.
                    </p>
                  </div>
                </div>
                <label class="relative inline-flex items-center" [class.cursor-pointer]="isRazorpayConnected" [class.opacity-50]="!isRazorpayConnected">
                  <input type="checkbox" formControlName="online" class="sr-only peer" />
                  <div
                    class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                  ></div>
                </label>
              </div>

              <!-- Bank Transfer -->
              <div class="flex items-center justify-between py-2 border-t border-gray-50">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0"
                  >
                    <i class="bi bi-bank2 text-purple-500"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">Bank Transfer</p>
                    <p class="text-xs text-gray-400">
                      Customer transfers directly to your bank account (manual verification)
                    </p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="bankTransfer" class="sr-only peer" />
                  <div
                    class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                  ></div>
                </label>
              </div>
            </div>

            <!-- Order Acceptance -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div class="flex items-center gap-3 pb-3 border-b border-gray-50">
                <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <i class="bi bi-bag-check-fill text-blue-600 text-lg"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Order Acceptance</h3>
                  <p class="text-xs text-gray-400">Control how new customer orders are handled.</p>
                </div>
              </div>

              <div class="space-y-3">
                <!-- Auto -->
                <label
                  (click)="setOrderAcceptance('auto')"
                  [class]="
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ' +
                    (form.value.orderAcceptance === 'auto'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200')
                  "
                >
                  <div
                    class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    [class]="
                      form.value.orderAcceptance === 'auto'
                        ? 'border-primary-500'
                        : 'border-gray-300'
                    "
                  >
                    @if (form.value.orderAcceptance === 'auto') {
                      <div class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                    }
                  </div>
                  <div>
                    <p class="font-medium text-sm text-gray-900">Auto Accept</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      All new orders are automatically accepted and move to processing.
                    </p>
                  </div>
                </label>

                <!-- Manual -->
                <label
                  (click)="setOrderAcceptance('manual')"
                  [class]="
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ' +
                    (form.value.orderAcceptance === 'manual'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200')
                  "
                >
                  <div
                    class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    [class]="
                      form.value.orderAcceptance === 'manual'
                        ? 'border-primary-500'
                        : 'border-gray-300'
                    "
                  >
                    @if (form.value.orderAcceptance === 'manual') {
                      <div class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                    }
                  </div>
                  <div>
                    <p class="font-medium text-sm text-gray-900">Manual Review</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      You must review and accept each order before it moves to processing.
                    </p>
                  </div>
                </label>

                <!-- Paused -->
                <label
                  (click)="setOrderAcceptance('paused')"
                  [class]="
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ' +
                    (form.value.orderAcceptance === 'paused'
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-100 hover:border-gray-200')
                  "
                >
                  <div
                    class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    [class]="
                      form.value.orderAcceptance === 'paused' ? 'border-red-400' : 'border-gray-300'
                    "
                  >
                    @if (form.value.orderAcceptance === 'paused') {
                      <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    }
                  </div>
                  <div>
                    <p class="font-medium text-sm text-gray-900 flex items-center gap-2">
                      Paused
                      <span
                        class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium"
                        >No new orders</span
                      >
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      Stop accepting new orders entirely. Customers will see a notice at checkout.
                    </p>
                  </div>
                </label>
              </div>

              <!-- Hidden control to hold the value -->
              <input type="hidden" formControlName="orderAcceptance" />
            </div>
          </form>
        }
      </main>
    </div>
  `,
})
export class WebsiteSettingsGeneralComponent implements OnInit {
  shopId: string | null = null;
  form: FormGroup;
  loading = true;
  saving = false;
  isRazorpayConnected = false;

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      displayName: [''],
      description: [''],
      phone: [''],
      email: [''],
      address: [''],
      orderAcceptance: ['auto'],
      paymentModes: this.fb.group({
        cod: [true],
        online: [{ value: false, disabled: true }],
        bankTransfer: [false],
      }),
      subscriptionPlan: ['free'],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res: any) => {
        const shop: Shop = res.data;
        this.isRazorpayConnected = !!shop.razorpay?.keyId && !!shop.razorpay?.keySecret;

        if (this.isRazorpayConnected) {
          this.form.get('paymentModes.online')?.enable();
        } else {
          this.form.get('paymentModes.online')?.disable();
        }

        this.form.patchValue({
          displayName: shop.displayName || '',
          description: shop.description || '',
          phone: shop.phone || '',
          email: shop.email || '',
          address: shop.address || '',
          orderAcceptance: shop.orderAcceptance || 'auto',
          subscriptionPlan: shop.subscriptionPlan || 'free',
          paymentModes: {
            cod: shop.paymentModes?.cod ?? true,
            online: this.isRazorpayConnected ? (shop.paymentModes?.online ?? false) : false,
            bankTransfer: shop.paymentModes?.bankTransfer ?? false,
          },
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.showError(err?.error?.message || 'Failed to load general settings.');
      },
    });
  }

  setOrderAcceptance(value: 'auto' | 'manual' | 'paused') {
    this.form.get('orderAcceptance')?.setValue(value);
  }

  onSave() {
    if (!this.shopId) return;
    this.saving = true;
    this.shopService.updateShop(this.shopId, this.form.getRawValue()).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.showSuccess('General website settings saved successfully!');
      },
      error: (err: any) => {
        this.saving = false;
        this.toastService.showError(err?.error?.message || 'Failed to save general settings.');
      },
    });
  }
}
