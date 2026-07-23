import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, ThemeSettings } from '../../core/services/admin-api.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-admin-themes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-primary-700 flex items-center gap-2">
              <i class="bi bi-palette-fill text-primary-700"></i> Theme Controller
            </h2>
            <p class="text-xs text-gray-500 mt-1">Design and preview the brand appearance of the Admin portal and Merchant Shop. Only saved themes affect the real application.</p>
          </div>
          <button
            (click)="save()"
            [disabled]="saving || !previewSettings"
            class="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm shrink-0 cursor-pointer"
          >
            @if (saving) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            } @else {
              <i class="bi bi-cloud-arrow-up-fill"></i>
            }
            Save Theme Settings
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        @if (!previewSettings) {
          <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div class="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            <span class="text-sm">Loading theme settings...</span>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- LEFT PANEL: Presets & Customization (lg:col-span-7) -->
          <div class="lg:col-span-7 space-y-8">
            
            <!-- App/Panel Selector Tabs -->
            <div class="bg-white p-2 rounded-2xl border border-primary-100 shadow-sm flex gap-2">
              <button
                (click)="activeTab = 'admin'"
                [class.bg-primary-700]="activeTab === 'admin'"
                [class.text-white]="activeTab === 'admin'"
                [class.bg-transparent]="activeTab !== 'admin'"
                [class.text-gray-600]="activeTab !== 'admin'"
                class="flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i class="bi bi-shield-lock-fill"></i> Admin Panel Theme
              </button>
              <button
                (click)="activeTab = 'shop'"
                [class.bg-primary-700]="activeTab === 'shop'"
                [class.text-white]="activeTab === 'shop'"
                [class.bg-transparent]="activeTab !== 'shop'"
                [class.text-gray-600]="activeTab !== 'shop'"
                class="flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i class="bi bi-shop"></i> Merchant Shop Theme
              </button>
              <button
                (click)="activeTab = 'website'"
                [class.bg-primary-700]="activeTab === 'website'"
                [class.text-white]="activeTab === 'website'"
                [class.bg-transparent]="activeTab !== 'website'"
                [class.text-gray-600]="activeTab !== 'website'"
                class="flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i class="bi bi-laptop"></i> Landing Website Theme
              </button>
            </div>

            <!-- Theme Presets section -->
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i class="bi bi-grid-fill text-indigo-500"></i> Theme Presets
              </h2>
              <p class="text-xs text-gray-500">Select a preset palette to quickly apply beautiful coordinated color combinations.</p>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (preset of presets; track preset.name) {
                  <div
                    (click)="applyPreset(preset)"
                    [class.ring-2]="isPresetActive(preset)"
                    [class.ring-primary-700]="isPresetActive(preset)"
                    [class.border-transparent]="isPresetActive(preset)"
                    [class.border-gray-100]="!isPresetActive(preset)"
                    class="p-4 rounded-2xl border bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group"
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-sm text-gray-800">{{ preset.name }}</span>
                      @if (isPresetActive(preset)) {
                        <span class="w-5 h-5 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px]">
                          <i class="bi bi-check-lg"></i>
                        </span>
                      }
                    </div>
                    
                    <div class="flex gap-1.5 items-center">
                      <span [style.background-color]="preset.colors.primaryColor" class="w-5 h-5 rounded-full border border-white shadow-sm" title="Primary"></span>
                      <span [style.background-color]="preset.colors.secondaryColor" class="w-5 h-5 rounded-full border border-white shadow-sm" title="Secondary"></span>
                      <span [style.background-color]="preset.colors.accentColor" class="w-5 h-5 rounded-full border border-white shadow-sm" title="Accent"></span>
                      <span [style.background-color]="preset.colors.surfaceColor" class="w-5 h-5 rounded-full border border-white shadow-sm" title="Surface"></span>
                      <span [style.background-color]="preset.colors.backgroundColor" class="w-5 h-5 rounded-full border border-white shadow-sm" title="Background"></span>
                      <span [style.background-color]="preset.colors.textColor" class="w-5 h-5 rounded-full border border-white shadow-sm" title="Text"></span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Customization panel -->
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i class="bi bi-sliders text-rose-500"></i> Customize Theme
              </h2>
              <p class="text-xs text-gray-500 font-medium">Fine-tune individual properties to match your brand style guidelines. Click the pickers or type hex values.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Primary Color -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Primary Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      type="color"
                      [(ngModel)]="previewSettings[activeTab].primaryColor"
                      class="h-11 w-11 border border-gray-200 p-1 rounded-xl cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="previewSettings[activeTab].primaryColor"
                      placeholder="#000000"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>

                <!-- Secondary Color -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Secondary Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      type="color"
                      [(ngModel)]="previewSettings[activeTab].secondaryColor"
                      class="h-11 w-11 border border-gray-200 p-1 rounded-xl cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="previewSettings[activeTab].secondaryColor"
                      placeholder="#000000"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>

                <!-- Accent Color -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Accent Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      type="color"
                      [(ngModel)]="previewSettings[activeTab].accentColor"
                      class="h-11 w-11 border border-gray-200 p-1 rounded-xl cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="previewSettings[activeTab].accentColor"
                      placeholder="#000000"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>

                <!-- Surface Color -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Surface / Card Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      type="color"
                      [(ngModel)]="previewSettings[activeTab].surfaceColor"
                      class="h-11 w-11 border border-gray-200 p-1 rounded-xl cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="previewSettings[activeTab].surfaceColor"
                      placeholder="#000000"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>

                <!-- Background Color -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Background Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      type="color"
                      [(ngModel)]="previewSettings[activeTab].backgroundColor"
                      class="h-11 w-11 border border-gray-200 p-1 rounded-xl cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="previewSettings[activeTab].backgroundColor"
                      placeholder="#000000"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>

                <!-- Text Color -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Text Color</label>
                  <div class="flex items-center gap-3">
                    <input
                      type="color"
                      [(ngModel)]="previewSettings[activeTab].textColor"
                      class="h-11 w-11 border border-gray-200 p-1 rounded-xl cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="previewSettings[activeTab].textColor"
                      placeholder="#000000"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>

                <!-- Font Family -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Font Family</label>
                  <select
                    [(ngModel)]="previewSettings[activeTab].fontFamily"
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium transition-all outline-none focus:bg-white focus:border-gray-900 cursor-pointer"
                  >
                    @for (font of fontOptions; track font.value) {
                      <option [value]="font.value">{{ font.label }}</option>
                    }
                  </select>
                </div>

                <!-- Border Radius -->
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Border Radius</label>
                  <input
                    type="text"
                    [(ngModel)]="previewSettings[activeTab].radius"
                    placeholder="e.g. 12px or 1.5rem"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:border-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT PANEL: Live Previews (lg:col-span-5) -->
          <div class="lg:col-span-5 space-y-8">
            
            <!-- Admin Dashboard Preview card -->
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">Admin Dashboard Preview</h2>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-primary-600 border border-indigo-100">Live Mockup</span>
              </div>

              <!-- Sandbox wrapper setting Admin CSS variables locally -->
              <div
                [style.--admin-primary]="previewSettings.admin.primaryColor"
                [style.--admin-secondary]="previewSettings.admin.secondaryColor"
                [style.--admin-accent]="previewSettings.admin.accentColor"
                [style.--admin-surface]="previewSettings.admin.surfaceColor"
                [style.--admin-bg]="previewSettings.admin.backgroundColor || '#f8fafc'"
                [style.--admin-text]="previewSettings.admin.textColor || '#0f172a'"
                [style.--admin-font]="previewSettings.admin.fontFamily || 'Inter'"
                [style.--admin-radius]="previewSettings.admin.radius || '12px'"
                class="admin-mockup-container border border-gray-200 rounded-2xl overflow-hidden aspect-video flex font-sans select-none"
                [style.font-family]="'var(--admin-font)'"
              >
                <!-- Mock Sidebar -->
                <div class="w-1/4 bg-[var(--admin-secondary)] p-3 flex flex-col gap-4 text-white shrink-0">
                  <div class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[var(--admin-secondary)] text-[10px] font-bold shadow-sm">C</span>
                    <span class="text-[9px] font-extrabold tracking-wider">Clothify</span>
                  </div>
                  <div class="space-y-1.5 flex-1">
                    <div class="px-2 py-1.5 rounded bg-[var(--admin-primary)] flex items-center gap-1 text-[8px] font-bold">
                      <i class="bi bi-grid-1x2-fill"></i> Dashboard
                    </div>
                    <div class="px-2 py-1.5 rounded flex items-center gap-1 text-[8px] opacity-75">
                      <i class="bi bi-shop"></i> Shops
                    </div>
                    <div class="px-2 py-1.5 rounded flex items-center gap-1 text-[8px] opacity-75">
                      <i class="bi bi-people-fill"></i> Users
                    </div>
                  </div>
                  <div class="text-[7px] opacity-60">v1.2.0</div>
                </div>

                <!-- Mock Content & Header area -->
                <div class="flex-1 bg-[var(--admin-bg)] flex flex-col overflow-hidden">
                  <!-- Mock Header -->
                  <div class="h-10 bg-[var(--admin-surface)] px-4 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <div class="w-20 h-5 bg-gray-50 border border-gray-100 rounded-full flex items-center px-2 text-[6px] text-gray-400 gap-1">
                      <i class="bi bi-search"></i> Search...
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="bi bi-bell text-gray-400 text-[10px]"></i>
                      <span class="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">CA</span>
                    </div>
                  </div>

                  <!-- Mock Main Content -->
                  <div class="flex-1 p-4 overflow-auto space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-[10px] font-extrabold" [style.color]="'var(--admin-text)'">Overview</span>
                      <span class="px-2 py-0.5 text-[6px] font-semibold text-white rounded bg-[var(--admin-primary)] shadow-sm">Export</span>
                    </div>

                    <!-- Grid cards -->
                    <div class="grid grid-cols-3 gap-2">
                      <div class="bg-[var(--admin-surface)] p-2 border border-gray-100 shadow-sm flex flex-col gap-1" [style.border-radius]="'var(--admin-radius)'">
                        <span class="text-[6px] text-gray-400">Total Shops</span>
                        <span class="text-xs font-black" [style.color]="'var(--admin-text)'">42</span>
                        <span class="px-1 py-0.5 rounded text-[5px] text-green-700 bg-green-50 self-start font-bold">+12%</span>
                      </div>
                      <div class="bg-[var(--admin-surface)] p-2 border border-gray-100 shadow-sm flex flex-col gap-1" [style.border-radius]="'var(--admin-radius)'">
                        <span class="text-[6px] text-gray-400">Active Plans</span>
                        <span class="text-xs font-black" [style.color]="'var(--admin-text)'">18</span>
                        <!-- Mock chart bar -->
                        <div class="flex gap-0.5 items-end h-3 mt-0.5">
                          <span class="w-1 bg-[var(--admin-accent)] rounded-t" style="height: 40%"></span>
                          <span class="w-1 bg-[var(--admin-primary)] rounded-t" style="height: 80%"></span>
                          <span class="w-1 bg-[var(--admin-accent)] rounded-t" style="height: 60%"></span>
                        </div>
                      </div>
                      <div class="bg-[var(--admin-surface)] p-2 border border-gray-100 shadow-sm flex flex-col gap-1" [style.border-radius]="'var(--admin-radius)'">
                        <span class="text-[6px] text-gray-400">Revenue</span>
                        <span class="text-xs font-black" [style.color]="'var(--admin-text)'">₹84K</span>
                        <span class="px-1 py-0.5 rounded text-[5px] text-white bg-[var(--admin-accent)] self-start font-bold">MRR</span>
                      </div>
                    </div>

                    <!-- Table mockup -->
                    <div class="bg-[var(--admin-surface)] p-3 border border-gray-100 shadow-sm space-y-2" [style.border-radius]="'var(--admin-radius)'">
                      <span class="text-[8px] font-bold block" [style.color]="'var(--admin-text)'">Recent Merchants</span>
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between border-b border-gray-50 pb-1.5">
                          <span class="text-[7px] font-semibold" [style.color]="'var(--admin-text)'">Shop1</span>
                          <span class="text-[6px] text-gray-400">07 Jul 2026</span>
                          <span class="px-1.5 py-0.5 text-[5px] rounded-full bg-green-50 text-green-700 font-bold">Active</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-[7px] font-semibold" [style.color]="'var(--admin-text)'">Shop2</span>
                          <span class="text-[6px] text-gray-400">06 Jul 2026</span>
                          <span class="px-1.5 py-0.5 text-[5px] rounded-full bg-green-50 text-green-700 font-bold">Active</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Shop Dashboard Preview card -->
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">Shop Dashboard Preview</h2>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">Live Mockup</span>
              </div>

              <!-- Sandbox wrapper setting Shop CSS variables locally -->
              <div
                [style.--shop-primary]="previewSettings.shop.primaryColor"
                [style.--shop-secondary]="previewSettings.shop.secondaryColor"
                [style.--shop-accent]="previewSettings.shop.accentColor"
                [style.--shop-surface]="previewSettings.shop.surfaceColor"
                [style.--shop-bg]="previewSettings.shop.backgroundColor || '#fafafa'"
                [style.--shop-text]="previewSettings.shop.textColor || '#1a1a1a'"
                [style.--shop-font]="previewSettings.shop.fontFamily || 'Inter'"
                [style.--shop-radius]="previewSettings.shop.radius || '8px'"
                class="shop-mockup-container border border-gray-200 rounded-2xl overflow-hidden aspect-video flex font-sans select-none"
                [style.font-family]="'var(--shop-font)'"
              >
                <!-- Mock Sidebar -->
                <div class="w-1/4 bg-[var(--shop-secondary)] p-3 flex flex-col gap-4 text-white shrink-0">
                  <div class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[var(--shop-secondary)] text-[10px] font-bold shadow-sm">🛍️</span>
                    <span class="text-[9px] font-extrabold tracking-wider">Merchant</span>
                  </div>
                  <div class="space-y-1.5 flex-1">
                    <div class="px-2 py-1.5 rounded bg-[var(--shop-primary)] flex items-center gap-1 text-[8px] font-bold">
                      <i class="bi bi-grid-1x2-fill"></i> Dashboard
                    </div>
                    <div class="px-2 py-1.5 rounded flex items-center gap-1 text-[8px] opacity-75">
                      <i class="bi bi-calculator"></i> POS Billing
                    </div>
                    <div class="px-2 py-1.5 rounded flex items-center gap-1 text-[8px] opacity-75">
                      <i class="bi bi-bag-fill"></i> Products
                    </div>
                    <div class="px-2 py-1.5 rounded flex items-center gap-1 text-[8px] opacity-75">
                      <i class="bi bi-box-seam-fill"></i> Inventory
                    </div>
                  </div>
                  <div class="text-[7px] opacity-60">v1.2.0</div>
                </div>

                <!-- Mock Content & Header area -->
                <div class="flex-1 bg-[var(--shop-bg)] flex flex-col overflow-hidden">
                  <!-- Mock Header -->
                  <div class="h-10 bg-[var(--shop-surface)] px-4 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <div class="w-20 h-5 bg-gray-50 border border-gray-100 rounded-full flex items-center px-2 text-[6px] text-gray-400 gap-1">
                      <i class="bi bi-search"></i> Search...
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="bi bi-bell text-gray-400 text-[10px]"></i>
                      <span class="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">MS</span>
                    </div>
                  </div>

                  <!-- Mock Main Content -->
                  <div class="flex-1 p-4 overflow-auto space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-[10px] font-extrabold" [style.color]="'var(--shop-text)'">Shop Analytics</span>
                      <span class="px-2 py-0.5 text-[6px] font-semibold text-white rounded bg-[var(--shop-primary)] shadow-sm">Sales</span>
                    </div>

                    <!-- Grid cards -->
                    <div class="grid grid-cols-3 gap-2">
                      <div class="bg-[var(--shop-surface)] p-2 border border-gray-100 shadow-sm flex flex-col gap-1" [style.border-radius]="'var(--shop-radius)'">
                        <span class="text-[6px] text-gray-400">Sales</span>
                        <span class="text-xs font-black" [style.color]="'var(--shop-text)'">₹12.4K</span>
                        <span class="px-1 py-0.5 rounded text-[5px] text-green-700 bg-green-50 self-start font-bold">+8%</span>
                      </div>
                      <div class="bg-[var(--shop-surface)] p-2 border border-gray-100 shadow-sm flex flex-col gap-1" [style.border-radius]="'var(--shop-radius)'">
                        <span class="text-[6px] text-gray-400">Orders</span>
                        <span class="text-xs font-black" [style.color]="'var(--shop-text)'">48</span>
                        <!-- Mock chart bar -->
                        <div class="flex gap-0.5 items-end h-3 mt-0.5">
                          <span class="w-1 bg-[var(--shop-accent)] rounded-t" style="height: 30%"></span>
                          <span class="w-1 bg-[var(--shop-primary)] rounded-t" style="height: 90%"></span>
                          <span class="w-1 bg-[var(--shop-accent)] rounded-t" style="height: 50%"></span>
                        </div>
                      </div>
                      <div class="bg-[var(--shop-surface)] p-2 border border-gray-100 shadow-sm flex flex-col gap-1" [style.border-radius]="'var(--shop-radius)'">
                        <span class="text-[6px] text-gray-400">Customers</span>
                        <span class="text-xs font-black" [style.color]="'var(--shop-text)'">124</span>
                        <span class="px-1 py-0.5 rounded text-[5px] text-white bg-[var(--shop-accent)] self-start font-bold">New</span>
                      </div>
                    </div>

                    <!-- Table mockup -->
                    <div class="bg-[var(--shop-surface)] p-3 border border-gray-100 shadow-sm space-y-2" [style.border-radius]="'var(--shop-radius)'">
                      <span class="text-[8px] font-bold block" [style.color]="'var(--shop-text)'">Recent Invoices</span>
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between border-b border-gray-50 pb-1.5">
                          <span class="text-[7px] font-semibold" [style.color]="'var(--shop-text)'">INV-0012</span>
                          <span class="text-[6px] text-gray-400">₹1,249</span>
                          <span class="px-1.5 py-0.5 text-[5px] rounded-full bg-green-50 text-green-700 font-bold">Paid</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-[7px] font-semibold" [style.color]="'var(--shop-text)'">INV-0013</span>
                          <span class="text-[6px] text-gray-400">₹899</span>
                          <span class="px-1.5 py-0.5 text-[5px] rounded-full bg-amber-50 text-amber-700 font-bold">Pending</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Landing Website Preview card -->
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">Landing Website Preview</h2>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">Live Mockup</span>
              </div>

              <!-- Sandbox wrapper setting Website CSS variables locally -->
              <div
                [style.--web-primary]="previewSettings.website.primaryColor"
                [style.--web-secondary]="previewSettings.website.secondaryColor"
                [style.--web-accent]="previewSettings.website.accentColor"
                [style.--web-surface]="previewSettings.website.surfaceColor"
                [style.--web-bg]="previewSettings.website.backgroundColor || '#f8fafc'"
                [style.--web-text]="previewSettings.website.textColor || '#0f172a'"
                [style.--web-font]="previewSettings.website.fontFamily || 'Inter'"
                [style.--web-radius]="previewSettings.website.radius || '24px'"
                class="web-mockup-container border border-gray-200 rounded-2xl overflow-hidden aspect-video flex flex-col font-sans select-none"
                [style.font-family]="'var(--web-font)'"
                [style.background-color]="'var(--web-bg)'"
              >
                <!-- Mock Website Header -->
                <div class="h-9 bg-white px-3 flex items-center justify-between border-b border-gray-100 shrink-0">
                  <div class="flex items-center gap-1">
                    <span class="w-4 h-4 rounded-full bg-[var(--web-primary)] flex items-center justify-center text-white text-[8px] font-bold shadow-sm">C</span>
                    <span class="text-[8px] font-black tracking-wider text-gray-800">Clothify</span>
                  </div>
                  <div class="flex gap-2 text-[6px] font-bold text-gray-500">
                    <span>Features</span>
                    <span [style.color]="'var(--web-primary)'">Pricing</span>
                    <span>Resources</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[6px] font-bold text-white bg-[var(--web-primary)]">Get Started</span>
                </div>

                <!-- Mock Website Body (Pricing Page Mock) -->
                <div class="flex-1 p-3 overflow-auto space-y-3 flex flex-col justify-center">
                  <div class="text-center space-y-0.5">
                    <h3 class="text-[9px] font-black" [style.color]="'var(--web-text)'">Flexible Pricing Plans</h3>
                    <p class="text-[5px] text-gray-400">Scale your retail business with ease</p>
                  </div>

                  <!-- Mock Pricing Cards Grid -->
                  <div class="grid grid-cols-3 gap-2 px-1">
                    <!-- Free Plan Card -->
                    <div class="bg-[var(--web-surface)] p-2 border border-gray-100 shadow-sm flex flex-col justify-between gap-1.5" [style.border-radius]="'var(--web-radius)'">
                      <div class="space-y-0.5">
                        <span class="text-[5px] font-bold text-gray-400 uppercase tracking-wider block">Free</span>
                        <span class="text-[8px] font-black block" [style.color]="'var(--web-text)'">₹0/mo</span>
                      </div>
                      <div class="w-full py-0.5 rounded text-[4px] font-bold text-center bg-gray-100 text-gray-600">Start Free</div>
                    </div>

                    <!-- Pro Plan Card (Featured) -->
                    <div class="bg-[var(--web-surface)] p-2 border-2 shadow-md flex flex-col justify-between gap-1.5 relative overflow-hidden" [style.border-color]="'var(--web-primary)'" [style.border-radius]="'var(--web-radius)'">
                      <span class="absolute top-0 right-0 px-1 py-0.2 bg-[var(--web-primary)] text-white text-[3px] font-bold uppercase rounded-bl">Popular</span>
                      <div class="space-y-0.5">
                        <span class="text-[5px] font-bold uppercase tracking-wider block" [style.color]="'var(--web-primary)'">Pro</span>
                        <span class="text-[8px] font-black block" [style.color]="'var(--web-text)'">₹2,999/mo</span>
                      </div>
                      <div class="w-full py-0.5 rounded text-[4px] font-bold text-center text-white bg-[var(--web-primary)] shadow-sm">Try Pro</div>
                    </div>

                    <!-- Enterprise Plan Card -->
                    <div class="bg-[var(--web-surface)] p-2 border border-gray-100 shadow-sm flex flex-col justify-between gap-1.5" [style.border-radius]="'var(--web-radius)'">
                      <div class="space-y-0.5">
                        <span class="text-[5px] font-bold text-gray-400 uppercase tracking-wider block">Custom</span>
                        <span class="text-[8px] font-black block" [style.color]="'var(--web-text)'">Let's Talk</span>
                      </div>
                      <div class="w-full py-0.5 rounded text-[4px] font-bold text-center bg-primary-600 text-white">Contact Us</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      }
    </div>
  `,
})
export class AdminThemesComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly themeService = inject(ThemeService);

  activeTab: 'admin' | 'shop' | 'website' = 'admin';
  saving = false;

  settings: ThemeSettings | null = null;
  previewSettings: ThemeSettings | null = null;
  
  // presets... (lines 492-646 kept unchanged)


  presets = [
    {
      name: 'Default',
      colors: {
        primaryColor: '#7379e8',
        secondaryColor: '#4a4fb5',
        accentColor: '#8e94f2',
        surfaceColor: '#ffffff',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a'
      },
      fontFamily: 'Inter',
      radius: '24px'
    },
    {
      name: 'Classic Blue',
      colors: {
        primaryColor: '#1e40af',
        secondaryColor: '#1e3a8a',
        accentColor: '#3b82f6',
        surfaceColor: '#ffffff',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a'
      },
      fontFamily: 'Inter',
      radius: '16px'
    },
    {
      name: 'Emerald',
      colors: {
        primaryColor: '#065f46',
        secondaryColor: '#064e3b',
        accentColor: '#10b981',
        surfaceColor: '#ffffff',
        backgroundColor: '#f0fdf4',
        textColor: '#064e3b'
      },
      fontFamily: 'Inter',
      radius: '12px'
    },
    {
      name: 'Royal Purple',
      colors: {
        primaryColor: '#6b21a8',
        secondaryColor: '#581c87',
        accentColor: '#a855f7',
        surfaceColor: '#ffffff',
        backgroundColor: '#faf5ff',
        textColor: '#3b0764'
      },
      fontFamily: 'Poppins',
      radius: '20px'
    },
    {
      name: 'Midnight',
      colors: {
        primaryColor: '#0f172a',
        secondaryColor: '#020617',
        accentColor: '#38bdf8',
        surfaceColor: '#1e293b',
        backgroundColor: '#0f172a',
        textColor: '#f8fafc'
      },
      fontFamily: 'Inter',
      radius: '8px'
    },
    {
      name: 'Ocean',
      colors: {
        primaryColor: '#0369a1',
        secondaryColor: '#0c4a6e',
        accentColor: '#0ea5e9',
        surfaceColor: '#ffffff',
        backgroundColor: '#f0f9ff',
        textColor: '#0369a1'
      },
      fontFamily: 'Outfit',
      radius: '16px'
    },
    {
      name: 'Rose',
      colors: {
        primaryColor: '#be123c',
        secondaryColor: '#881337',
        accentColor: '#f43f5e',
        surfaceColor: '#ffffff',
        backgroundColor: '#fff1f2',
        textColor: '#4c0519'
      },
      fontFamily: 'Poppins',
      radius: '24px'
    },
    {
      name: 'Sunset',
      colors: {
        primaryColor: '#c2410c',
        secondaryColor: '#7c2d12',
        accentColor: '#ea580c',
        surfaceColor: '#ffffff',
        backgroundColor: '#fff7ed',
        textColor: '#431407'
      },
      fontFamily: 'Outfit',
      radius: '16px'
    },
    {
      name: 'Forest',
      colors: {
        primaryColor: '#1b4332',
        secondaryColor: '#081c15',
        accentColor: '#2d6a4f',
        surfaceColor: '#ffffff',
        backgroundColor: '#edf7f6',
        textColor: '#1b4332'
      },
      fontFamily: 'Inter',
      radius: '12px'
    },
    {
      name: 'Corporate',
      colors: {
        primaryColor: '#1e293b',
        secondaryColor: '#0f172a',
        accentColor: '#475569',
        surfaceColor: '#ffffff',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a'
      },
      fontFamily: 'Inter',
      radius: '4px'
    },
    {
      name: 'Minimal',
      colors: {
        primaryColor: '#000000',
        secondaryColor: '#1a1a1a',
        accentColor: '#4d4d4d',
        surfaceColor: '#ffffff',
        backgroundColor: '#fafafa',
        textColor: '#000000'
      },
      fontFamily: 'Inter',
      radius: '0px'
    }
  ];

  fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Outfit', label: 'Outfit' },
    { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
    { value: 'Open Sans', label: 'Open Sans' },
  ];

  constructor() {
    this.adminApi.getThemeSettings().subscribe((response) => {
      this.settings = this.sanitizeSettings(response.data);
      this.previewSettings = JSON.parse(JSON.stringify(this.settings));
    });
  }

  private sanitizeSettings(data: ThemeSettings): ThemeSettings {
    const sanitized = JSON.parse(JSON.stringify(data));
    if (!sanitized.admin.backgroundColor) sanitized.admin.backgroundColor = '#f8fafc';
    if (!sanitized.admin.textColor) sanitized.admin.textColor = '#0f172a';
    if (!sanitized.shop.backgroundColor) sanitized.shop.backgroundColor = '#fafafa';
    if (!sanitized.shop.textColor) sanitized.shop.textColor = '#1a1a1a';
    if (!sanitized.website) {
      sanitized.website = {
        primaryColor: '#7379e8',
        secondaryColor: '#4a4fb5',
        accentColor: '#8e94f2',
        surfaceColor: '#ffffff',
        fontFamily: 'Inter',
        radius: '24px',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a'
      };
    }
    if (!sanitized.website.backgroundColor) sanitized.website.backgroundColor = '#f8fafc';
    if (!sanitized.website.textColor) sanitized.website.textColor = '#0f172a';
    return sanitized;
  }

  applyPreset(preset: any) {
    if (!this.previewSettings) return;
    this.previewSettings[this.activeTab] = {
      ...this.previewSettings[this.activeTab],
      primaryColor: preset.colors.primaryColor,
      secondaryColor: preset.colors.secondaryColor,
      accentColor: preset.colors.accentColor,
      surfaceColor: preset.colors.surfaceColor,
      backgroundColor: preset.colors.backgroundColor,
      textColor: preset.colors.textColor,
      fontFamily: preset.fontFamily,
      radius: preset.radius,
    };
  }

  isPresetActive(preset: any): boolean {
    if (!this.previewSettings) return false;
    const current = this.previewSettings[this.activeTab];
    return current.primaryColor?.toLowerCase() === preset.colors.primaryColor.toLowerCase() &&
           current.secondaryColor?.toLowerCase() === preset.colors.secondaryColor.toLowerCase() &&
           current.accentColor?.toLowerCase() === preset.colors.accentColor.toLowerCase() &&
           current.surfaceColor?.toLowerCase() === preset.colors.surfaceColor.toLowerCase();
  }

  async save() {
    if (!this.previewSettings) return;
    this.saving = true;
    try {
      const response = await firstValueFrom(this.adminApi.updateThemeSettings(this.previewSettings));
      this.settings = this.sanitizeSettings(response.data);
      this.previewSettings = JSON.parse(JSON.stringify(this.settings));
      this.themeService.applyAdminTheme(this.settings.admin);
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    } finally {
      this.saving = false;
    }
  }
}
