import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-settings-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent, UiDropdownComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 xl:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Payment Gateways</h1>
          <p class="text-gray-500 mt-1">Configure billing, recurring payments, and transaction fees.</p>
        </div>
        
        <div class="space-y-6">
          <div class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 max-w-full">

        <div *ngIf="loading" class="py-20 text-center text-gray-400">
          <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
          <p class="text-sm font-semibold text-gray-500">Loading settings...</p>
        </div>

        <form *ngIf="!loading && settings" (submit)="saveSettings($event)" class="space-y-10">
          
          <!-- Razorpay Integration Section -->
          <div>
            <div class="flex items-start gap-4 mb-6">
              <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <i class="bi bi-credit-card-fill text-xl"></i>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-lg">Razorpay Credentials</h3>
                <p class="text-sm text-gray-500 mt-1">Primary gateway used for platform plan subscriptions and usage fees.</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <app-ui-input
                [(ngModel)]="settings.razorpayKeyId"
                name="keyId"
                label="Key ID"
                placeholder="rzp_live_xxx"
              ></app-ui-input>
              
              <app-ui-input
                [(ngModel)]="settings.razorpayKeySecret"
                name="keySecret"
                label="Key Secret"
                type="password"
                placeholder="••••••••••••••••"
              ></app-ui-input>
            </div>
          </div>

          <!-- Gateway Rules Section -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-lg mb-6">Currency & Fees</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div class="space-y-2 relative">
                <label class="text-sm font-semibold text-gray-700">Currency</label>
                <app-ui-dropdown
                  [(ngModel)]="settings.currency"
                  name="currency"
                  [options]="currencyOptions"
                  placeholder="Select Currency"
                ></app-ui-dropdown>
              </div>

              <app-ui-input
                [(ngModel)]="settings.transactionFeePercent"
                name="fee"
                label="Transaction Fee (%)"
                type="number"
                placeholder="e.g. 2.0"
              ></app-ui-input>
            </div>
          </div>

          <!-- AutoPay Section -->
          <div class="pt-8 border-t border-gray-100">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h3 class="font-bold text-gray-900 text-lg">AutoPay Configurations</h3>
                <p class="text-sm text-gray-500 mt-1">Enable and configure auto-renewal cycles for customer subscriptions.</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer select-none">
                <input type="checkbox" class="sr-only peer" [(ngModel)]="settings.autoPayEnabled" name="autoPay">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:trangray-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-700"></div>
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 transition-all" *ngIf="settings.autoPayEnabled">
              <app-ui-input
                [(ngModel)]="settings.autoPayGraceDays"
                name="grace"
                label="Grace Period (Days)"
                type="number"
                placeholder="e.g. 3"
              ></app-ui-input>

              <app-ui-input
                [(ngModel)]="settings.retryAttempts"
                name="retries"
                label="Retry Attempts"
                type="number"
                placeholder="e.g. 3"
              ></app-ui-input>
            </div>
          </div>

          <!-- Action Button -->
          <div class="flex justify-end pt-8 border-t border-gray-100">
            <button type="submit" [disabled]="saving"
              class="bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving) {
                <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
              }
              Save Payment Settings
            </button>
          </div>
        </form>
      </div>
    </div>
      </main>
    </div>
  `
})
export class SettingsPaymentComponent {
  loading = true;
  saving = false;
  settings: any = null;

  currencyOptions = [
    { value: 'INR', label: 'INR (₹)' },
    { value: 'USD', label: 'USD ($)' }
  ];

  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  constructor() {
    this.api.getBillingSettings().subscribe({
      next: (res) => {
        this.settings = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveSettings(e: Event) {
    e.preventDefault();
    this.saving = true;
    this.api.updateBillingSettings(this.settings).subscribe({
      next: () => {
        this.saving = false;
        this.toast.showSuccess('Payment settings updated successfully.');
      },
      error: () => {
        this.saving = false;
        this.toast.showError('Failed to update settings.');
      }
    });
  }
}
