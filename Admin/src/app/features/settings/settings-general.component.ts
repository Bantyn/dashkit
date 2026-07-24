import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-settings-general',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 xl:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">General Settings</h1>
          <p class="text-gray-500 mt-1">Configure global platform details and notification channels.</p>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 max-w-full">
            <form (submit)="saveSettings($event)" class="space-y-8">

              <!-- Platform Identity -->
              <div>
                <h3 class="text-base font-semibold text-gray-900 mb-1">Platform Identity</h3>
                <p class="text-sm text-gray-500 mb-5">Basic information displayed across the platform.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-ui-input
                    [(ngModel)]="platformName"
                    name="platformName"
                    label="Platform Name"
                    placeholder="e.g. DashKit"
                  ></app-ui-input>

                  <app-ui-input
                    [(ngModel)]="supportEmail"
                    name="supportEmail"
                    label="Support Email"
                    type="email"
                    placeholder="support@dashkit.com"
                  ></app-ui-input>
                </div>
              </div>

              <!-- Admin Notifications -->
              <div class="pt-6 border-t border-gray-100">
                <h3 class="text-base font-semibold text-gray-900 mb-1">Admin Notifications</h3>
                <p class="text-sm text-gray-500 mb-5">
                  This email receives an alert whenever a new shop successfully registers on the platform.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-ui-input
                    [(ngModel)]="adminEmail"
                    name="adminEmail"
                    label="Admin Notification Email"
                    type="email"
                    placeholder="admin@dashkit.com"
                  ></app-ui-input>
                </div>
                <div class="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <i class="bi bi-info-circle text-blue-500 mt-0.5 text-sm"></i>
                  <p class="text-xs text-blue-700">
                    A rich HTML notification email with the shop name, owner, mobile, plan, and trial details will be sent to this address on every successful registration.
                  </p>
                </div>
              </div>

              <!-- Telemetry -->
              <div class="pt-6 border-t border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Telemetry &amp; Observability</h3>
                <div class="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p class="font-medium text-gray-900">Enable Live Monitoring &amp; Analytics</p>
                    <p class="text-sm text-gray-500 mt-1">
                      Tracks API requests, Firestore operations, and errors for the Admin Observability Dashboard.
                      Turn off to reduce database write costs.
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [(ngModel)]="telemetryEnabled" name="telemetryEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-700"></div>
                  </label>
                </div>
              </div>

              <div class="flex justify-end pt-8 border-t border-gray-100">
                <button type="submit" [disabled]="saving || loading"
                  class="bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2">
                  <span *ngIf="saving" class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  Save General Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `
})
export class SettingsGeneralComponent implements OnInit {
  platformName = 'DashKit';
  supportEmail = '';
  adminEmail = '';
  telemetryEnabled = true;
  loading = false;
  saving = false;

  private toast = inject(ToastService);
  private api = inject(AdminApiService);

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    forkJoin({
      general: this.api.getPlatformGeneralSettings(),
      telemetry: this.api.getPlatformTelemetrySettings(),
    }).subscribe({
      next: ({ general, telemetry }) => {
        if (general.success && general.data) {
          this.platformName = general.data.platformName || 'DashKit';
          this.supportEmail = general.data.supportEmail || '';
          this.adminEmail = general.data.adminEmail || '';
        }
        if (telemetry.success && telemetry.data) {
          this.telemetryEnabled = telemetry.data.enabled;
        }
        this.loading = false;
      },
      error: () => {
        this.toast.showError('Failed to load settings');
        this.loading = false;
      }
    });
  }

  saveSettings(e: Event) {
    e.preventDefault();
    this.saving = true;

    forkJoin({
      general: this.api.updatePlatformGeneralSettings({
        platformName: this.platformName,
        supportEmail: this.supportEmail,
        adminEmail: this.adminEmail,
      }),
      telemetry: this.api.updatePlatformTelemetrySettings({ enabled: this.telemetryEnabled }),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.toast.showSuccess('Settings updated successfully.');
      },
      error: () => {
        this.saving = false;
        this.toast.showError('Failed to save settings');
      }
    });
  }
}
