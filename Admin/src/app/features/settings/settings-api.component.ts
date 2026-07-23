import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings-api',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 xl:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">API & Integrations</h1>
          <p class="text-gray-500 mt-1">Configure global platform API endpoints and external integrations (WhatsApp, Shipping, SMS).</p>
        </div>
        
        <div class="space-y-6">
          <div class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 max-w-full mx-auto">
        <div *ngIf="loading" class="py-20 text-center text-gray-400">
          <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
          <p class="text-sm font-semibold text-gray-500">Loading settings...</p>
        </div>

        <form *ngIf="!loading && settings" (submit)="saveSettings($event)" class="space-y-10">
          
          <!-- Webhooks Section -->
          <div>
            <h3 class="font-bold text-gray-900 text-lg mb-6">Webhook Subscriptions</h3>
            
            <div class="space-y-8">
              <app-ui-input
                [(ngModel)]="settings.webhookEndpoint"
                name="webhookEndpoint"
                label="Webhook Endpoint URL"
                type="url"
                placeholder="https://api.yourdomain.com/webhooks"
                error=""
              ></app-ui-input>

              <div class="space-y-1.5 relative">
                <app-ui-input
                  [(ngModel)]="settings.webhookSecret"
                  name="webhookSecret"
                  label="Webhook Secret Signature"
                  type="password"
                  placeholder="whsec_xxxxxxxxxxxx"
                ></app-ui-input>
                <button
                  type="button"
                  (click)="copySecret()"
                  class="absolute right-3 top-[34px] text-gray-400 hover:text-gray-900 cursor-pointer"
                  title="Copy secret key"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Platform URLs Section -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-lg mb-6">Application Paths</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <app-ui-input
                [(ngModel)]="settings.apiBaseUrl"
                name="apiBaseUrl"
                label="API Base URL"
                type="url"
                placeholder="https://api.clothify.com"
              ></app-ui-input>

              <app-ui-input
                [(ngModel)]="settings.callbackUrl"
                name="callbackUrl"
                label="Frontend Callback URL"
                type="url"
                placeholder="https://admin.clothify.com/callback"
              ></app-ui-input>
            </div>
          </div>

          <!-- Third Party Integrations Section -->
          <div class="pt-8 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 text-lg mb-6">External API Integrations</h3>
            
            <div class="space-y-8" *ngIf="integrations">
              <!-- WhatsApp -->
              <div class="bg-green-50/50 p-6 rounded-xl border border-green-100">
                <h4 class="font-semibold text-green-800 mb-4 flex items-center gap-2"><i class="bi bi-whatsapp"></i> WhatsApp API</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-ui-input [(ngModel)]="integrations.whatsapp.provider" name="waProvider" label="Provider Name" placeholder="e.g. meta"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.whatsapp.apiKey" name="waKey" label="Access Token (Bearer)" type="password" placeholder="EAAI..."></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.whatsapp.phoneNumberId" name="waPhoneId" label="Phone Number ID" placeholder="e.g. 102345678901234"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.whatsapp.wabaId" name="waWabaId" label="WhatsApp Business Account ID" placeholder="e.g. 104567890123456"></app-ui-input>
                </div>
              </div>

              <!-- Shipping -->
              <div class="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <h4 class="font-semibold text-primary-700 mb-4 flex items-center gap-2"><i class="bi bi-truck"></i> Shipping API</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-ui-input [(ngModel)]="integrations.shipping.provider" name="shipProvider" label="Provider Name" placeholder="e.g. Shiprocket"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.shipping.apiKey" name="shipKey" label="API Key" type="password" placeholder="••••••••"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.shipping.apiSecret" name="shipSecret" label="API Secret" type="password" placeholder="••••••••"></app-ui-input>
                </div>
              </div>

              <!-- SMS -->
              <div class="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                <h4 class="font-semibold text-orange-800 mb-4 flex items-center gap-2"><i class="bi bi-chat-left-text"></i> SMS API</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-ui-input [(ngModel)]="integrations.sms.provider" name="smsProvider" label="Provider Name" placeholder="e.g. Twilio / MSG91"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.sms.apiKey" name="smsKey" label="API Key" type="password" placeholder="••••••••"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.sms.senderId" name="smsSender" label="Sender ID" placeholder="e.g. CLOTHI"></app-ui-input>
                </div>
              </div>

              <!-- Cloudinary -->
              <div class="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
                <h4 class="font-semibold text-purple-800 mb-4 flex items-center gap-2"><i class="bi bi-cloud-arrow-up"></i> Cloudinary API</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-ui-input [(ngModel)]="integrations.cloudinary.cloudName" name="cloudName" label="Cloud Name" placeholder="e.g. clothify"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.cloudinary.apiKey" name="cloudKey" label="API Key" type="password" placeholder="••••••••"></app-ui-input>
                  <app-ui-input [(ngModel)]="integrations.cloudinary.apiSecret" name="cloudSecret" label="API Secret" type="password" placeholder="••••••••"></app-ui-input>
                </div>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-8 border-t border-gray-100">
            <button type="submit" [disabled]="saving"
              class="bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving) {
                <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
              }
              Save API Settings
            </button>
          </div>
        </form>
      </div>
    </div>
      </main>
    </div>
  `
})
export class SettingsApiComponent {
  loading = true;
  saving = false;
  settings: any = null;
  integrations = {
    whatsapp: {
      provider: 'meta',
      apiKey: '',
      phoneNumberId: '',
      wabaId: ''
    },
    shipping: {
      provider: 'shiprocket',
      apiKey: '',
      apiSecret: ''
    },
    sms: { provider: '', apiKey: '', senderId: '' },
    cloudinary: { cloudName: '', apiKey: '', apiSecret: '' }
  };

  private api = inject(AdminApiService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  constructor() {
    this.loadData();
  }

  async loadData() {
    try {
      this.api.getBillingSettings().subscribe(res => {
        if (res.data) this.settings = res.data;
      });

      // Load integrations dynamically
      this.http.get<any>(`${environment.apiUrl}/platform/integrations`, { withCredentials: true }).subscribe({
        next: (res: any) => {
          if (res.data) {
            this.integrations = { ...this.integrations, ...res.data };
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } catch (e) {
      this.loading = false;
    }
  }

  saveSettings(e: Event) {
    e.preventDefault();
    this.saving = true;
    
    // Save billing (webhooks/urls)
    this.api.updateBillingSettings(this.settings).subscribe({
      next: () => {
        // Save integrations
        this.http.put<any>(`${environment.apiUrl}/platform/integrations`, this.integrations, { withCredentials: true }).subscribe({
          next: () => {
            this.saving = false;
            this.toast.showSuccess('API settings updated successfully.');
          },
          error: () => {
            this.saving = false;
            this.toast.showError('Failed to save integration settings.');
          }
        });
      },
      error: () => {
        this.saving = false;
        this.toast.showError('Failed to update webhooks settings.');
      }
    });
  }

  copySecret() {
    const val = this.settings?.webhookSecret;
    if (val) {
      navigator.clipboard.writeText(val).then(() => {
        this.toast.showSuccess('Webhook secret copied to clipboard.');
      });
    }
  }
}
