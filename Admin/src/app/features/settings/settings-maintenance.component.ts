import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 xl:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Maintenance Mode</h1>
          <p class="text-gray-500 mt-1">Configure global platform maintenance status.</p>
        </div>
        
        <div class="space-y-6">
          <div class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 max-w-full">

            <form (submit)="saveSettings($event)" class="space-y-8">
              <div class="p-8 rounded-[20px] border border-red-100 bg-red-50/50 flex items-start gap-6">
                <div class="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-sm">
                  <i class="bi bi-tools text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-red-900 mb-2 text-lg">Activate Maintenance Mode</h3>
                  <p class="text-sm text-red-700 leading-relaxed mb-6">
                    When active, the admin panel and shops may show a maintenance screen to users. 
                    Only platform super administrators will be allowed to log in and interact with the platform.
                  </p>
                  
                  <div class="flex items-center justify-between border-t border-red-100/70 pt-6">
                    <span class="text-sm font-bold text-red-800 tracking-wide uppercase">Platform Status</span>
                    <label class="relative inline-flex items-center cursor-pointer select-none">
                      <input type="checkbox" class="sr-only peer" [(ngModel)]="maintenanceMode" name="maintenanceMode">
                      <div class="w-14 h-7 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:trangray-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                      <span class="ml-4 text-sm font-bold text-red-800 w-16">{{ maintenanceMode ? 'ACTIVE' : 'OFFLINE' }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-8 mt-8 border-t border-red-100 w-full">
                <button type="submit" [disabled]="saving"
                  class="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  @if (saving) {
                    <span class="w-4 h-4 border-2 border-red-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Save Maintenance Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `
})
export class SettingsMaintenanceComponent {
  maintenanceMode = false;
  saving = false;

  private toast = inject(ToastService);

  saveSettings(e: Event) {
    e.preventDefault();
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.toast.showSuccess('Maintenance mode settings updated successfully.');
    }, 800);
  }
}
