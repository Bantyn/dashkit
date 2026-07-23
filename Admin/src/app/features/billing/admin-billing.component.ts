import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, BillingSettings } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 class="text-2xl font-black text-gray-900">Billing, Payment & Autopay</h2>
        <p class="mt-2 text-sm text-gray-500">
          Manage your payment gateway, autopay retries, webhooks, and API configurations here.
        </p>

        <!-- Gateway Credentials -->
        <div class="mt-8 border-t border-gray-100 pt-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Gateway Credentials</h3>
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Gateway Provider</label>
              <input [(ngModel)]="settings.gatewayProvider" placeholder="e.g., razorpay" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Currency</label>
              <input [(ngModel)]="settings.currency" placeholder="e.g., INR" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Razorpay Key ID</label>
              <input [(ngModel)]="settings.razorpayKeyId" placeholder="rzp_test_xxxxxx" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Razorpay Key Secret</label>
              <input [(ngModel)]="settings.razorpayKeySecret" type="password" placeholder="••••••••••••" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Autopay Settings -->
        <div class="mt-8 border-t border-gray-100 pt-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Autopay Settings</h3>
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Autopay Provider</label>
              <input [(ngModel)]="settings.autoPayProvider" placeholder="e.g., razorpay_subscriptions" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Grace Days</label>
              <input [(ngModel)]="settings.autoPayGraceDays" type="number" placeholder="Days to wait before failing" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Retry Attempts</label>
              <input [(ngModel)]="settings.retryAttempts" type="number" placeholder="Number of retries" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Retry Interval (Days)</label>
              <input [(ngModel)]="settings.retryIntervalDays" type="number" placeholder="Days between retries" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Webhooks & API -->
        <div class="mt-8 border-t border-gray-100 pt-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Webhooks & API</h3>
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Gateway API Base URL</label>
              <input [(ngModel)]="settings.apiBaseUrl" placeholder="https://api.razorpay.com/v1" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Callback URL</label>
              <input [(ngModel)]="settings.callbackUrl" placeholder="https://yoursite.com/payment/callback" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Webhook Endpoint</label>
              <input [(ngModel)]="settings.webhookEndpoint" placeholder="https://api.yoursite.com/webhook" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Webhook Secret</label>
              <input [(ngModel)]="settings.webhookSecret" type="password" placeholder="••••••••••••" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Miscellaneous -->
        <div class="mt-8 border-t border-gray-100 pt-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Miscellaneous</h3>
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Supported Methods</label>
              <input [(ngModel)]="supportedMethodsInput" placeholder="e.g., upi, card, netbanking" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
              <p class="mt-1 text-xs text-gray-500">Comma separated values</p>
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700">Transaction Fee (%)</label>
              <input [(ngModel)]="settings.transactionFeePercent" type="number" placeholder="2.0" class="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-gray-900 focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- System Toggles -->
        <div class="mt-8 border-t border-gray-100 pt-6 flex flex-wrap gap-8">
          <label class="flex cursor-pointer items-center gap-3">
            <div class="relative">
              <input [(ngModel)]="settings.autoPayEnabled" type="checkbox" class="peer sr-only" />
              <div class="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-700"></div>
              <div class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
            <span class="text-sm font-semibold text-gray-700">Enable Autopay</span>
          </label>
          <label class="flex cursor-pointer items-center gap-3">
            <div class="relative">
              <input [(ngModel)]="settings.testMode" type="checkbox" class="peer sr-only" />
              <div class="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-700"></div>
              <div class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
            <span class="text-sm font-semibold text-gray-700">Enable Test Mode</span>
          </label>
        </div>

        <button type="button" (click)="save()" class="mt-10 rounded-2xl bg-primary-700 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:bg-gray-800 shadow-lg shadow-gray-200">
          Save Settings
        </button>
      </div>
    </div>
  `,
})
export class AdminBillingComponent {
  private readonly adminApi = inject(AdminApiService);

  settings: BillingSettings = {
    gatewayProvider: 'razorpay',
    currency: 'INR',
    autoPayEnabled: false,
    autoPayProvider: 'razorpay_subscriptions',
    autoPayGraceDays: 3,
    retryAttempts: 3,
    retryIntervalDays: 2,
    testMode: true,
    webhookSecret: '',
    webhookEndpoint: '',
    callbackUrl: '',
    apiBaseUrl: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    supportedMethods: [],
    transactionFeePercent: 2,
  };

  supportedMethodsInput = '';

  constructor() {
    this.adminApi.getBillingSettings().subscribe((response) => {
      this.settings = response.data;
      this.supportedMethodsInput = (response.data.supportedMethods || []).join(', ');
    });
  }

  async save() {
    const payload = {
      ...this.settings,
      supportedMethods: this.supportedMethodsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const response = await firstValueFrom(this.adminApi.updateBillingSettings(payload));
    this.settings = response.data;
    this.supportedMethodsInput = (response.data.supportedMethods || []).join(', ');
  }
}
