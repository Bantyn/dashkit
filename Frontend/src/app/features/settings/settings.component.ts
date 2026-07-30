import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../core/models/shop.model';
import { ToastService } from '../../core/services/toast.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiInputComponent, UiLoadingComponent],
  template: `
    <div class="h-full bg-primary-50 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <h2 class="text-xl font-bold text-gray-900">Settings</h2>
        @if (saveSuccess) {
          <div class="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in">
            Settings saved successfully!
          </div>
        }
      </div>

      <div class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
        <div class="w-full">

          @if (loading) {
            <div class="flex justify-center p-12">
              <app-ui-loading size="lg"></app-ui-loading>
            </div>
          } @else if (error) {
            <div class="p-4 bg-red-50 text-red-600 rounded-lg mb-6 border border-red-100">
              {{ error }}
            </div>
          } @else {
            <!-- GENERAL SETTINGS -->
            <div class="space-y-6">
              <!-- Shop Profile Section -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <form [formGroup]="shopForm" (ngSubmit)="onSubmit()">
                  <div class="flex items-center justify-between mb-8">
                    <div>
                      <h3 class="text-lg font-bold text-gray-900">Shop Profile</h3>
                      <p class="text-sm text-gray-500">
                        Manage your public shop information and branding.
                      </p>
                    </div>
                    <button
                      type="submit"
                      [disabled]="shopForm.invalid || saving"
                      class="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      @if (saving) {
                        <div
                          class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"
                        ></div>
                      }
                      {{ saving ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>

                  <div class="flex flex-col gap-5">
                    <!-- Owner Information -->
                    <div>
                      <p class="text-sm font-bold text-gray-700 mb-3">Owner Information</p>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <app-ui-input
                          formControlName="ownerName"
                          label="Owner Name"
                          placeholder="Enter owner full name"
                        ></app-ui-input>
                      </div>
                    </div>

                    <!-- Shop Information -->
                    <div class="border-t border-gray-200 pt-5">
                      <p class="text-sm font-bold text-gray-700 mb-3">Shop Information</p>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <app-ui-input
                          formControlName="shopName"
                          label="Shop Name"
                          placeholder="Enter shop name"
                        ></app-ui-input>
                        <app-ui-input
                          formControlName="email"
                          type="email"
                          label="Support Email"
                          placeholder="Enter support email"
                        ></app-ui-input>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <app-ui-input
                        formControlName="phone"
                        type="tel"
                        label="Phone Number"
                        placeholder="Enter shop phone number"
                      ></app-ui-input>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Shop Description</label
                      >
                      <textarea
                        formControlName="description"
                        rows="3"
                        class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="Enter Shop Description"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Pickup Address -->
                  <div class="mt-8 pt-6 border-t border-gray-200" formGroupName="pickupAddress">
                    <h4 class="text-sm font-bold text-gray-700 mb-4">Shop / Pickup Address</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <app-ui-input
                          formControlName="address"
                          label="Street Address"
                          placeholder="e.g. 12, Main Road, Ring Road"
                        ></app-ui-input>
                        <app-ui-input
                          formControlName="city"
                          label="City"
                          placeholder="e.g. Surat"
                        ></app-ui-input>
                        <app-ui-input
                          formControlName="state"
                          label="State"
                          placeholder="e.g. Gujarat"
                        ></app-ui-input>
                        <app-ui-input
                          formControlName="pincode"
                          label="Pincode"
                          placeholder="e.g. 395007"
                        ></app-ui-input>
                    </div>
                    <!-- end .grid -->
                  </div>
                </form>
              </div>

              <!-- Subscription & Usage Limits Section -->
              <div class="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Subscription & Usage Limits</h3>
                    <p class="text-sm text-gray-500 mt-1">
                      Monitor your usage limits and add capacity as you grow.
                    </p>
                  </div>
                  <div class="mt-3 sm:mt-0">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-normal bg-primary-50 text-primary-700 border border-primary-100 tracking-wide">
                      Plan: {{ shop?.subscriptionPlan || 'free' }}
                    </span>
                  </div>
                </div>

                @if (loadingUsage) {
                  <div class="flex justify-center py-6">
                    <div class="animate-spin h-6 w-6 border-2 border-primary-600 border-b-transparent rounded-full"></div>
                  </div>
                } @else if (usageDetails) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- Staff Count -->
                    <div class="border border-gray-200 rounded-xl p-5 bg-primary-50/50 flex flex-col justify-between hover:border-gray-200 transition-all">
                      <div>
                        <div class="flex justify-between items-center mb-1">
                          <h4 class="font-normal text-gray-800 text-sm">Staff Members</h4>
                          <span class="text-xs font-normal text-gray-500">
                            {{ usageDetails.staff_count?.used || 0 }} / {{ usageDetails.staff_count?.allowed === null ? 'Unlimited' : usageDetails.staff_count?.allowed }}
                          </span>
                        </div>
                        <div class="w-full bg-gray-200/80 rounded-full h-1.5 mb-3">
                          <div class="bg-primary-600 h-1.5 rounded-full" [style.width.%]="usageDetails.staff_count?.allowed === null ? 0 : usageDetails.staff_count?.percentage"></div>
                        </div>
                      </div>
                      <div class="flex justify-between items-center pt-2 border-t border-gray-200/50 mt-2">
                        <span class="text-xs text-gray-400 font-medium">₹199 / additional staff</span>
                        <button type="button" (click)="buyAddon('staff_count')" class="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm">
                          Buy Add-on
                        </button>
                      </div>
                    </div>

                    <!-- Branch Count -->
                    <div class="border border-gray-200 rounded-xl p-5 bg-primary-50/50 flex flex-col justify-between hover:border-gray-200 transition-all">
                      <div>
                        <div class="flex justify-between items-center mb-1">
                          <h4 class="font-normal text-gray-800 text-sm">Branches Active</h4>
                          <span class="text-xs font-normal text-gray-500">
                            {{ usageDetails.branch_count?.used || 0 }} / {{ usageDetails.branch_count?.allowed === null ? 'Unlimited' : usageDetails.branch_count?.allowed }}
                          </span>
                        </div>
                        <div class="w-full bg-gray-200/80 rounded-full h-1.5 mb-3">
                          <div class="bg-primary-600 h-1.5 rounded-full" [style.width.%]="usageDetails.branch_count?.allowed === null ? 0 : usageDetails.branch_count?.percentage"></div>
                        </div>
                      </div>
                      <div class="flex justify-between items-center pt-2 border-t border-gray-200/50 mt-2">
                        <span class="text-xs text-gray-400 font-medium">₹500/mo / location</span>
                        <button type="button" (click)="buyAddon('branch_count')" class="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm">
                          Buy Add-on
                        </button>
                      </div>
                    </div>

                    <!-- Products Count -->
                    <div class="border border-gray-200 rounded-xl p-5 bg-primary-50/50 flex flex-col justify-between hover:border-gray-200 transition-all">
                      <div>
                        <div class="flex justify-between items-center mb-1">
                          <h4 class="font-normal text-gray-800 text-sm">Products Count</h4>
                          <span class="text-xs font-normal text-gray-500">
                            {{ usageDetails.products_count?.used || 0 }} / {{ usageDetails.products_count?.allowed === null ? 'Unlimited' : usageDetails.products_count?.allowed }}
                          </span>
                        </div>
                        <div class="w-full bg-gray-200/80 rounded-full h-1.5 mb-3">
                          <div class="bg-primary-600 h-1.5 rounded-full" [style.width.%]="usageDetails.products_count?.allowed === null ? 0 : usageDetails.products_count?.percentage"></div>
                        </div>
                      </div>
                      <div class="flex justify-between items-center pt-2 border-t border-gray-200/50 mt-2">
                        <span class="text-xs text-gray-400 font-medium">₹99 / 1,000 products</span>
                        <button type="button" (click)="buyAddon('products_count')" class="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm">
                          Buy Add-on
                        </button>
                      </div>
                    </div>

                    <!-- Invoices Count -->
                    <div class="border border-gray-200 rounded-xl p-5 bg-primary-50/50 flex flex-col justify-between hover:border-gray-200 transition-all">
                      <div>
                        <div class="flex justify-between items-center mb-1">
                          <h4 class="font-normal text-gray-800 text-sm">Invoices / Month</h4>
                          <span class="text-xs font-normal text-gray-500">
                            {{ usageDetails.invoices_per_month?.used || 0 }} / {{ usageDetails.invoices_per_month?.allowed === null ? 'Unlimited' : usageDetails.invoices_per_month?.allowed }}
                          </span>
                        </div>
                        <div class="w-full bg-gray-200/80 rounded-full h-1.5 mb-3">
                          <div class="bg-primary-600 h-1.5 rounded-full" [style.width.%]="usageDetails.invoices_per_month?.allowed === null ? 0 : usageDetails.invoices_per_month?.percentage"></div>
                        </div>
                      </div>
                      <div class="flex justify-between items-center pt-2 border-t border-gray-200/50 mt-2">
                        <span class="text-xs text-gray-400 font-medium">₹199 / 500 invoices</span>
                        <button type="button" (click)="buyAddon('invoices_per_month')" class="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm">
                          Buy Add-on
                        </button>
                      </div>
                    </div>

                  </div>
                }
              </div>

              <!-- Preferences Section -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 class="text-lg font-bold text-gray-900 mb-6">Preferences</h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
                    <div class="flex gap-4 items-center">
                      <div
                        class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"
                      >
                        <i class="bi bi-bell-fill"></i>
                      </div>
                      <div>
                        <p class="text-sm font-normal text-gray-900">Order Notifications</p>
                        <p class="text-xs text-gray-500">
                          Receive alerts for new orders and status updates.
                        </p>
                      </div>
                    </div>
                    <div class="w-12 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                      <div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
                    <div class="flex gap-4 items-center">
                      <div
                        class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"
                      >
                        <i class="bi bi-shield-lock-fill"></i>
                      </div>
                      <div>
                        <p class="text-sm font-normal text-gray-900">Two-Factor Authentication</p>
                        <p class="text-xs text-gray-500">Secure your account with 2FA.</p>
                      </div>
                    </div>
                    <div class="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                      <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Danger Zone -->
              <div class="bg-red-50/30 rounded-2xl shadow-sm border border-red-100 p-8">
                <h3 class="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
                <p class="text-sm text-red-600 mb-6">
                  Irreversible actions that affect your shop data.
                </p>
                <button
                  (click)="showDeactivateModal = true"
                  class="px-6 py-2 border border-red-200 text-red-600 font-medium text-sm rounded-lg hover:bg-red-100 transition-colors"
                >
                  Deactivate Shop
                </button>
              </div>
            </div>

            <!-- Deactivate Modal -->
            @if (showDeactivateModal) {
              <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">Deactivate Shop</h3>
                  <p class="text-sm text-gray-600 mb-4">
                    Please provide a reason for deactivating your shop. This request will be sent to the platform administrator.
                  </p>
                  
                  <textarea
                    [(ngModel)]="deactivateReason"
                    rows="4"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-4"
                    placeholder="Why do you want to deactivate?"
                  ></textarea>

                  <div class="flex justify-end gap-3">
                    <button
                      (click)="showDeactivateModal = false"
                      [disabled]="submittingDeactivation"
                      class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      (click)="requestDeactivation()"
                      [disabled]="!deactivateReason || submittingDeactivation"
                      class="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      @if (submittingDeactivation) {
                        <div class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"></div>
                      }
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  shopId: string | null = null;
  shop: Shop | null = null;
  shopForm: FormGroup;
  loading = true;
  saving = false;
  error: string | null = null;
  saveSuccess = false;

  showDeactivateModal = false;
  submittingDeactivation = false;
  deactivateReason = '';

  usageDetails: any = null;
  loadingUsage = false;

  limitUpgradePrices = {
    staff_count: { price: 199, increment: 1, label: "Extra Staff Member" },
    branch_count: { price: 500, increment: 1, label: "Extra Branch" },
    invoices_per_month: { price: 199, increment: 500, label: "Pack of 500 Invoices" },
    products_count: { price: 99, increment: 1000, label: "Pack of 1000 Products" }
  };

  constructor(
    private authService: AuthService,
    private shopService: ShopService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastService: ToastService,
  ) {
    this.shopForm = this.fb.group({
      ownerName: ['', [Validators.required]],
      shopName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      phone: [''],
      pickupAddress: this.fb.group({
        address: [''],
        city: [''],
        state: [''],
        pincode: [''],
      }),
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) {
        this.loadShopSettings();
        this.loadUsageDetails();
      }
    });
  }

  loadUsageDetails() {
    if (!this.shopId) return;
    this.loadingUsage = true;
    this.shopService.getShopDetails(this.shopId).subscribe({
      next: (res) => {
        this.usageDetails = res.data?.usage?.plan || null;
        this.loadingUsage = false;
      },
      error: (err) => {
        console.error('Error loading usage details:', err);
        this.loadingUsage = false;
      }
    });
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  buyAddon(limitKey: string) {
    if (!this.shopId) return;
    const config = (this.limitUpgradePrices as any)[limitKey];
    if (!config) return;

    this.toastService.showInfo(`Initiating checkout for ${config.label}...`);
    
    this.shopService.createLimitUpgradeOrder(this.shopId, limitKey, 1).subscribe({
      next: async (res: any) => {
        const orderData = res.data;
        if (!orderData) {
          this.toastService.showError('Failed to create payment order');
          return;
        }

        const scriptLoaded = await this.loadRazorpayScript();
        if (!scriptLoaded) {
          this.toastService.showError('Failed to load Razorpay payment gateway');
          return;
        }

        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Clothify Admin',
          description: `Add-on Purchase: ${config.label}`,
          order_id: orderData.order_id,
          handler: (response: any) => {
            this.toastService.showInfo('Verifying payment, please wait...');
            this.shopService.verifyLimitUpgradePayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }).subscribe({
              next: (verifyRes: any) => {
                this.toastService.showSuccess(`Success! ${config.label} has been added to your account.`);
                this.loadShopSettings();
                this.loadUsageDetails();
              },
              error: (verifyErr: any) => {
                console.error('Payment verification failed:', verifyErr);
                this.toastService.showError('Payment verification failed. Please contact support.');
              }
            });
          },
          prefill: {
            name: this.shop?.shopName || '',
            email: this.shop?.email || '',
            contact: this.shop?.phone || ''
          },
          theme: {
            color: '#4f46e5'
          },
          modal: {
            ondismiss: () => {
              this.toastService.showWarning('Payment cancelled.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        console.error('Failed to initiate add-on purchase:', err);
        this.toastService.showError(err.error?.error?.message || 'Failed to initiate purchase');
      }
    });
  }

  loadShopSettings() {
    if (!this.shopId) return;
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        this.shop = res.data;
        if (this.shop) {
          this.shopForm.patchValue({
            ownerName: this.shop.ownerName || '',
            shopName: this.shop.shopName,
            email: this.shop.email,
            description: this.shop.description,
            phone: this.shop.phone,
            pickupAddress: {
              address: this.shop.pickupAddress?.address || '',
              city: this.shop.pickupAddress?.city || '',
              state: this.shop.pickupAddress?.state || '',
              pincode: this.shop.pickupAddress?.pincode || '',
            },
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading shop settings:', err);
        this.error = 'Failed to load shop settings. Please try again.';
        this.loading = false;
      },
    });
  }

  onSubmit() {
    if (this.shopForm.invalid || !this.shopId) return;

    this.saving = true;
    this.saveSuccess = false;
    this.error = null;

    this.shopService.updateShop(this.shopId, this.shopForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.showSuccess('Settings saved successfully!');
      },
      error: (err) => {
        console.error('Error updating shop settings:', err);
        this.toastService.showError('Failed to save changes. Please try again.');
        this.saving = false;
      },
    });
  }

  requestDeactivation() {
    if (!this.shopId || !this.deactivateReason) return;
    
    this.submittingDeactivation = true;
    this.shopService.requestDeactivation(this.shopId, this.deactivateReason).subscribe({
      next: () => {
        this.submittingDeactivation = false;
        this.showDeactivateModal = false;
        this.deactivateReason = '';
        this.toastService.showSuccess('Your deactivation request has been submitted to the platform admin.');
      },
      error: (err) => {
        console.error('Error submitting deactivation request:', err);
        this.submittingDeactivation = false;
        this.toastService.showError('Failed to submit deactivation request.');
      }
    });
  }
}
