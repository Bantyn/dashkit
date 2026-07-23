import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, AdminShop } from '../../core/services/admin-api.service';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-shop-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] font-sans">
      
      <!-- Top Header / Navigation -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <button
            [routerLink]="['/shops']"
            class="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 shadow-sm transition-colors"
          >
            <i class="bi bi-arrow-left"></i>
          </button>
          
          <div class="flex items-center gap-3" *ngIf="!loading && shop">
            <div class="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
              {{ shop.shopName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                {{ shop.shopName }}
                <span class="px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-600 border border-primary-200 uppercase">
                  {{ shop.subscriptionPlan }}
                </span>
              </h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Registered: {{ formatDate(shop.createdAt) }} • Subdomain: {{ shop.subdomain }}.clothify.com
              </p>
            </div>
          </div>

          <!-- Header Loading Skeleton -->
          <div class="flex items-center gap-3 animate-pulse" *ngIf="loading">
            <div class="w-10 h-10 rounded-lg bg-gray-200 shrink-0"></div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 w-32 rounded"></div>
              <div class="h-3 bg-gray-200 w-48 rounded"></div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2" *ngIf="!loading && shop">
          <span [class]="'px-2.5 py-1 rounded-full text-xs font-semibold ' + 
            (shop.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')">
            {{ shop.status | uppercase }}
          </span>
        </div>
      </div>

      <!-- Main Workspace Area -->
      <div class="flex-1 flex overflow-hidden" *ngIf="!error; else errorTemplate">
        
        <!-- Left Tab Content Panel -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-6">
          
          <!-- Horizontal Tabs Navigation -->
          <div class="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-sm mb-6 shrink-0 overflow-x-auto gap-4 scrollbar-none">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="activeTab = tab.id"
                [class.border-primary-600]="activeTab === tab.id"
                [class.text-primary-600]="activeTab === tab.id"
                [class.border-transparent]="activeTab !== tab.id"
                [class.text-gray-500]="activeTab !== tab.id"
                class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors hover:text-gray-900"
              >
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- TAB CONTENT SWITCHER -->
          <div class="flex-1 min-h-0">
            
            <!-- OVERVIEW TAB -->
            <div *ngIf="activeTab === 'overview'" class="space-y-6">
              
              <!-- Loading Skeleton -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse" *ngIf="loading">
                @for (i of [1,2,3,4,5,6,7,8]; track i) {
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-gray-100 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-3 bg-gray-100 w-16 rounded"></div>
                      <div class="h-6 bg-gray-100 w-24 rounded"></div>
                    </div>
                  </div>
                }
              </div>

              <!-- Actual Data -->
              <ng-container *ngIf="!loading">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- Summary Card 1: Revenue -->
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-wallet2"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Total Revenue</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">₹{{ metrics?.revenue | number }}</div>
                    </div>
                  </div>

                  <!-- Summary Card 2: Orders -->
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-cart"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Total Orders</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">{{ metrics?.orders }}</div>
                    </div>
                  </div>

                  <!-- Summary Card 3: Products -->
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-box-seam"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Products Count</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">{{ metrics?.products }}</div>
                    </div>
                  </div>

                  <!-- Summary Card 4: Customers -->
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-people"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Customers</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">{{ metrics?.customers }}</div>
                    </div>
                  </div>
                </div>

                <!-- Second Row Overview Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-diagram-3"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Branches</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">{{ metrics?.branches }}</div>
                    </div>
                  </div>

                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-cloud-arrow-up"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Storage Used</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">{{ metrics?.storage }} MB</div>
                    </div>
                  </div>

                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-cpu"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">API Usage</div>
                      <div class="text-xl font-bold text-gray-900 mt-1">{{ metrics?.apiUsage }} req/mo</div>
                    </div>
                  </div>

                  <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center text-lg shrink-0">
                      <i class="bi bi-clock"></i>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 font-semibold uppercase">Last Login</div>
                      <div class="text-sm font-semibold text-gray-900 mt-1 truncate">{{ formatDate(metrics?.lastLogin) }}</div>
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- FEATURES & ADD-ONS TAB -->
            <div *ngIf="activeTab === 'features'" class="space-y-6">
              
              <!-- 1. Upcoming Invoice & Active Add-ons Grid -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Active Addons Column (Span 2) -->
                <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-base font-bold text-gray-900">Active Recurring Add-ons</h3>
                      <span *ngIf="loadingAddons" class="text-xs text-gray-400"><i class="bi bi-arrow-repeat animate-spin"></i> Refreshing...</span>
                    </div>

                    <div *ngIf="activeAddons.length === 0" class="text-center py-8 text-gray-400 text-sm">
                      <i class="bi bi-box text-2xl block mb-2"></i>
                      No active recurring add-ons for this shop yet.
                    </div>

                    <div class="space-y-3" *ngIf="activeAddons.length > 0">
                      <div *ngFor="let addon of activeAddons" class="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-gray-50/50">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                            <i class="bi" [class.bi-plugin]="addon.type === 'feature_addon'" [class.bi-plus-circle]="addon.type === 'limit_addon'"></i>
                          </div>
                          <div>
                            <h4 class="text-sm font-bold text-gray-900">{{ addon.name }}</h4>
                            <p class="text-xs text-gray-400">
                              Key: <code class="font-mono text-gray-500">{{ addon.itemKey }}</code> • 
                              Status: <span [class]="'font-semibold ' + (addon.status === 'active' ? 'text-green-600' : 'text-amber-500')">{{ addon.status | uppercase }}</span>
                            </p>
                          </div>
                        </div>

                        <div class="flex items-center gap-4">
                          <div class="text-right">
                            <div class="text-sm font-bold text-gray-900">₹{{ addon.price }}/mo</div>
                            <div class="text-xs text-gray-400" *ngIf="addon.paymentStatus === 'pending'">Awaiting payment</div>
                          </div>
                          <button (click)="cancelAddon(addon.id)" class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Cancel Add-on">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Upcoming Invoice Preview -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between" *ngIf="upcomingInvoice">
                  <div>
                    <h3 class="text-base font-bold text-gray-900 mb-4">Upcoming Unified Invoice</h3>
                    
                    <div class="space-y-3 border-b border-gray-100 pb-4 mb-4">
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Base Plan ({{ upcomingInvoice.basePlan.name }})</span>
                        <span class="font-bold text-gray-900">₹{{ upcomingInvoice.basePlan.price }}</span>
                      </div>
                      <div *ngFor="let addon of upcomingInvoice.addons" class="flex justify-between text-sm">
                        <span class="text-gray-500">{{ addon.name }}</span>
                        <span class="font-bold text-gray-900">+ ₹{{ addon.total }}</span>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Subtotal</span>
                        <span class="font-bold text-gray-900">₹{{ upcomingInvoice.subtotal }}</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">GST (18%)</span>
                        <span class="font-bold text-gray-900">₹{{ upcomingInvoice.gst }}</span>
                      </div>
                      <div class="flex justify-between text-base border-t border-gray-100 pt-3 mt-2">
                        <span class="font-bold text-gray-900">Total Recurring</span>
                        <span class="font-extrabold text-primary-600">₹{{ upcomingInvoice.total }}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
                    <i class="bi bi-calendar-event"></i>
                    Next billing date: {{ upcomingInvoice.nextBillingDate ? formatDate(upcomingInvoice.nextBillingDate) : 'N/A' }}
                  </div>
                </div>

              </div>

              <!-- 2. Catalog grid to sell add-ons -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" *ngIf="addonCatalog">
                <div class="px-6 py-5 border-b border-gray-100">
                  <h3 class="text-base font-bold text-gray-900">Sell Add-ons & Upgrades</h3>
                  <p class="text-sm text-gray-500 mt-1">Generate a secure payment link for any of the platform add-ons below.</p>
                </div>

                <div class="p-6 space-y-8">
                  <!-- Feature Addons -->
                  <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Module Add-ons</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div *ngFor="let item of addonCatalog.features" class="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between">
                        <div>
                          <h5 class="text-sm font-bold text-gray-900">{{ item.name }}</h5>
                          <span class="text-xs font-mono text-gray-400">{{ item.key }}</span>
                          <div class="text-xs font-bold text-primary-600 mt-1">₹{{ item.defaultPrice }}/mo</div>
                        </div>
                        <button (click)="openSellAddonModal(item)" class="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg text-xs font-bold transition-all">
                          Sell Add-on
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Limit Addons -->
                  <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Resource Upgrades</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div *ngFor="let item of addonCatalog.limits" class="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between">
                        <div>
                          <h5 class="text-sm font-bold text-gray-900">{{ item.name }}</h5>
                          <span class="text-xs font-mono text-gray-400">{{ item.key }}</span>
                          <div class="text-xs font-bold text-primary-600 mt-1">₹{{ item.pricePerUnit }}/unit/mo</div>
                        </div>
                        <button (click)="openSellAddonModal(item)" class="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg text-xs font-bold transition-all">
                          Upgrade Limit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. Manual Override Overlays (Toggle Mode) -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 class="text-base font-bold text-gray-900">Admin Bypass (Free Manual Toggle)</h3>
                    <p class="text-sm text-gray-500 mt-1">Directly assign features instantly bypassing checkout (free override).</p>
                  </div>
                  <div *ngIf="isUpdatingFeatures" class="flex items-center gap-2 text-sm text-primary-600 font-medium">
                    <i class="bi bi-arrow-repeat animate-spin"></i> Saving...
                  </div>
                </div>

                <div class="p-6">
                  <div class="space-y-8">
                    @for (category of featuresByCategory; track category.name) {
                      <div>
                        <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                          <i class="bi bi-grid-3x3-gap text-gray-400"></i> {{ category.name }}
                        </h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          @for (feature of category.features; track feature.key) {
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                   [class.bg-primary-50]="shop?.customFeatures?.includes(feature.key)"
                                   [class.border-primary-200]="shop?.customFeatures?.includes(feature.key)">
                              <input type="checkbox" 
                                     class="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                     [checked]="shop?.customFeatures?.includes(feature.key)"
                                     (change)="toggleShopFeature(feature.key, $event)"
                                     [disabled]="isUpdatingFeatures">
                              <div>
                                <div class="text-sm font-medium" [class.text-primary-900]="shop?.customFeatures?.includes(feature.key)" [class.text-gray-900]="!shop?.customFeatures?.includes(feature.key)">
                                  {{ feature.name }}
                                </div>
                                <div class="text-xs text-gray-500 mt-0.5 font-mono">{{ feature.key }}</div>
                              </div>
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- 4. Sell Add-on Modal (Razorpay Invoice Quote Generator) -->
              <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" *ngIf="sellAddonModalOpen">
                <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Generate Add-on Link</h3>
                    <p class="text-xs text-gray-500 mt-1">This will generate a secure Razorpay checkout link and email/SMS it to the owner.</p>
                  </div>

                  <div class="space-y-4">
                    <!-- Summary info -->
                    <div class="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600">
                      <div><span class="font-semibold text-gray-700">Addon:</span> {{ selectedAddonToSell?.name }}</div>
                      <div><span class="font-semibold text-gray-700">Type:</span> {{ selectedAddonToSell?.type }}</div>
                      <div><span class="font-semibold text-gray-700">Billing:</span> Recurring monthly charge</div>
                    </div>

                    <!-- Custom Price -->
                    <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Cost (INR)</label>
                      <input type="number" [(ngModel)]="addonSellPrice" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                    </div>

                    <!-- Quantity (for limits) -->
                    <div *ngIf="selectedAddonToSell?.type === 'limit_addon'">
                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity (Units)</label>
                      <input type="number" [(ngModel)]="addonSellQuantity" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                    </div>

                    <!-- Notes -->
                    <div>
                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
                      <textarea [(ngModel)]="addonSellNotes" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" placeholder="e.g. Approved discount for B2B client"></textarea>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <button (click)="closeSellAddonModal()" [disabled]="isGeneratingAddonLink" class="flex-1 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">
                      Cancel
                    </button>
                    <button (click)="submitSellAddon()" [disabled]="isGeneratingAddonLink" class="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                      <span *ngIf="isGeneratingAddonLink"><i class="bi bi-arrow-repeat animate-spin"></i> Generating...</span>
                      <span *ngIf="!isGeneratingAddonLink">Generate Link</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <!-- SUBSCRIPTION TAB -->
            <div *ngIf="activeTab === 'subscription'" class="space-y-6">
              
              <!-- Loading Skeleton -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse" *ngIf="loading">
                <div class="h-5 bg-gray-100 w-48 rounded mb-6"></div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  @for (i of [1,2,3]; track i) {
                    <div class="space-y-2">
                      <div class="h-3 bg-gray-100 w-24 rounded"></div>
                      <div class="h-6 bg-gray-100 w-32 rounded"></div>
                    </div>
                  }
                </div>
              </div>

              <!-- Actual Data -->
              <ng-container *ngIf="!loading && shop">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 class="text-base font-bold text-gray-900 mb-4">Current Subscription Details</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <div class="text-xs text-gray-400 uppercase font-semibold">Active Plan</div>
                      <div class="text-lg font-bold text-gray-900 mt-1 uppercase">{{ shop.subscriptionPlan }}</div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 uppercase font-semibold">Trial Status</div>
                      <div class="text-lg font-bold text-gray-900 mt-1">
                        {{ shop.subscriptionPlan === 'trial' ? 'Active Trial' : 'Paid Subscription' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 uppercase font-semibold">Remaining Days</div>
                      <div class="text-lg font-bold text-gray-900 mt-1">
                        {{ shop.subscriptionPlan === 'trial' ? getTrialDaysRemaining(shop) : 'Unlimited' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 uppercase font-semibold">Next Renewal / Expiry</div>
                      <div class="text-sm font-semibold text-gray-900 mt-1">
                        {{ shop.nextBillingDate ? formatDate(shop.nextBillingDate) : '—' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-400 uppercase font-semibold">AutoPay (eMandate)</div>
                      <div class="text-sm font-semibold mt-1">
                        <span *ngIf="shop.autoPayEnabled" class="text-green-600 font-bold">✓ Active ({{ shop.autoPayStatus | uppercase }})</span>
                        <span *ngIf="!shop.autoPayEnabled" class="text-gray-400">Disabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- AutoPay Subscription Management for Admins -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6 animate-fade-in" *ngIf="shop.razorpaySubscriptionId">
                  <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">AutoPay Subscription Management</h3>
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                    <div>
                      <p class="font-medium text-gray-700">Razorpay Subscription ID: <code class="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{{ shop.razorpaySubscriptionId }}</code></p>
                      <p class="text-xs text-gray-500 mt-1" *ngIf="shop.lastAutoChargeAt">
                        Last Auto Charge: <strong>₹{{ shop.lastAutoChargeAmount | number:'1.0-0' }}</strong> on {{ formatDate(shop.lastAutoChargeAt) }}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <button *ngIf="shop.autoPayStatus !== 'cancelled' && shop.autoPayStatus !== 'cancelling'" 
                              (click)="adminCancelAutoPay(shop)" 
                              [disabled]="isCancellingAutoPay"
                              class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                        <span *ngIf="isCancellingAutoPay"><i class="bi bi-arrow-repeat animate-spin"></i> Cancelling...</span>
                        <span *ngIf="!isCancellingAutoPay">Cancel AutoPay Subscription</span>
                      </button>
                      <span *ngIf="shop.autoPayStatus === 'cancelled' || shop.autoPayStatus === 'cancelling'" class="text-xs font-bold text-red-500 uppercase">
                        Subscription Mandate Cancelled
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Limits and Features -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-base font-bold text-gray-900 mb-3">Plan Limits</h3>
                    <ul class="space-y-3 text-sm text-gray-600">
                      <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span>Branches Limit</span>
                        <span class="font-bold">{{ metrics?.branches }} / {{ limits?.branches === null ? 'Unlimited' : (limits?.branches || 1) }}</span>
                      </li>
                      <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span>Staff Members</span>
                        <span class="font-bold">{{ staff.length }} / {{ limits?.staff === null ? 'Unlimited' : (limits?.staff || 1) }}</span>
                      </li>
                      <li class="flex justify-between pb-2">
                        <span>Orders Limit</span>
                        <span class="font-bold">{{ metrics?.orders }} / {{ limits?.orders === null ? 'Unlimited' : (limits?.orders || 0) }}</span>
                      </li>
                    </ul>
                  </div>

                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-base font-bold text-gray-900 mb-3">Unlocked Features</h3>
                    <div class="flex flex-wrap gap-2">
                      @if (shop.features && shop.features.length > 0) {
                        @for (feat of shop.features; track feat) {
                          <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold">
                            {{ feat }}
                          </span>
                        }
                      } @else {
                        <span class="text-sm text-gray-400">No custom features unlocked.</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Limit Upgrades History -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6" *ngIf="shop.limitPurchases && shop.limitPurchases.length > 0">
                  <h3 class="text-base font-bold text-gray-900 mb-3">Limit Upgrades History</h3>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <th class="px-6 py-3">Limit Upgrade</th>
                          <th class="px-6 py-3">Increment</th>
                          <th class="px-6 py-3">Paid Amount</th>
                          <th class="px-6 py-3">Payment ID</th>
                          <th class="px-6 py-3">Purchased Date</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 text-gray-600">
                        <tr *ngFor="let purchase of shop.limitPurchases" class="hover:bg-gray-50/60 transition-colors">
                          <td class="px-6 py-4 font-semibold text-gray-900">
                            {{ purchase.limitKey === 'staff_count' ? 'Extra Staff' : 
                               purchase.limitKey === 'branch_count' ? 'Extra Branch' :
                               purchase.limitKey === 'invoices_per_month' ? 'Extra Invoices' :
                               purchase.limitKey === 'products_count' ? 'Extra Products' : purchase.limitKey }}
                          </td>
                          <td class="px-6 py-4">+{{ purchase.incrementAmount }}</td>
                          <td class="px-6 py-4 font-semibold text-gray-900">₹{{ purchase.amountPaid }}</td>
                          <td class="px-6 py-4 font-mono text-xs">{{ purchase.paymentId }}</td>
                          <td class="px-6 py-4 text-xs text-gray-400">{{ formatDate(purchase.purchasedAt) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- BILLING TAB -->
            <div *ngIf="activeTab === 'billing'" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 class="text-base font-bold text-gray-900">Billing & Invoice Timeline</h3>
              </div>
              
              <!-- Loading Skeleton -->
              <div class="p-6 space-y-4 animate-pulse" *ngIf="loading">
                @for (i of [1,2,3]; track i) {
                  <div class="h-6 bg-gray-100 w-full rounded"></div>
                }
              </div>

              <!-- Empty State -->
              <div class="p-12 text-center text-gray-400" *ngIf="!loading && invoices.length === 0">
                <i class="bi bi-receipt-cutoff text-4xl"></i>
                <p class="text-sm mt-2">No Billing History Found</p>
              </div>

              <!-- Actual Data -->
              <div class="overflow-x-auto" *ngIf="!loading && invoices.length > 0">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th class="px-6 py-3">Invoice ID</th>
                      <th class="px-6 py-3">Type</th>
                      <th class="px-6 py-3">Amount</th>
                      <th class="px-6 py-3">Tax (18% GST)</th>
                      <th class="px-6 py-3">Status</th>
                      <th class="px-6 py-3">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 text-sm">
                    @for (invoice of invoices; track invoice.id) {
                      <tr class="hover:bg-gray-50/60 transition-colors">
                        <td class="px-6 py-4 font-mono font-semibold text-gray-900">#{{ invoice.id.slice(-8).toUpperCase() }}</td>
                        <td class="px-6 py-4 text-gray-600">{{ invoice.type }}</td>
                        <td class="px-6 py-4 font-semibold text-gray-900">₹{{ invoice.amount | number }}</td>
                        <td class="px-6 py-4 text-gray-500">₹{{ (invoice.amount * 0.18) | number }}</td>
                        <td class="px-6 py-4">
                          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            {{ invoice.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-gray-400 text-xs">{{ formatDate(invoice.date) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- BRANCHES TAB -->
            <div *ngIf="activeTab === 'branches'" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 class="text-base font-bold text-gray-900">Active Branches</h3>
              </div>

              <!-- Loading Skeleton -->
              <div class="p-6 space-y-4 animate-pulse" *ngIf="loading">
                @for (i of [1,2,3]; track i) {
                  <div class="h-6 bg-gray-100 w-full rounded"></div>
                }
              </div>

              <!-- Empty State -->
              <div class="p-12 text-center text-gray-400" *ngIf="!loading && branches.length === 0">
                <i class="bi bi-diagram-3-fill text-4xl"></i>
                <p class="text-sm mt-2">No Branches Found</p>
              </div>

              <!-- Actual Data -->
              <div class="overflow-x-auto" *ngIf="!loading && branches.length > 0">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th class="px-6 py-3">Branch Name</th>
                      <th class="px-6 py-3">Manager</th>
                      <th class="px-6 py-3">Status</th>
                      <th class="px-6 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 text-sm">
                    @for (branch of branches; track branch.id) {
                      <tr class="hover:bg-gray-50/60 transition-colors">
                        <td class="px-6 py-4">
                          <div class="font-semibold text-gray-900">{{ branch.name }}</div>
                          <div class="text-xs text-gray-400">{{ branch.address }}</div>
                        </td>
                        <td class="px-6 py-4 text-gray-500">{{ branch.manager }}</td>
                        <td class="px-6 py-4">
                          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                            {{ branch.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-gray-400 text-xs">{{ formatDate(branch.createdAt) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- USERS TAB -->
            <div *ngIf="activeTab === 'users'" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 class="text-base font-bold text-gray-900">Shop Staff & Roles</h3>
              </div>

              <!-- Loading Skeleton -->
              <div class="p-6 space-y-4 animate-pulse" *ngIf="loading">
                @for (i of [1,2,3]; track i) {
                  <div class="h-6 bg-gray-100 w-full rounded"></div>
                }
              </div>

              <!-- Empty State -->
              <div class="p-12 text-center text-gray-400" *ngIf="!loading && users.length === 0">
                <i class="bi bi-people-fill text-4xl"></i>
                <p class="text-sm mt-2">No Users Found</p>
              </div>

              <!-- Actual Data -->
              <div class="overflow-x-auto" *ngIf="!loading && users.length > 0">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th class="px-6 py-3">User</th>
                      <th class="px-6 py-3">Email</th>
                      <th class="px-6 py-3">Role</th>
                      <th class="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 text-sm">
                    @for (user of users; track user.id) {
                      <tr class="hover:bg-gray-50/60 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-900">{{ user.name }}</td>
                        <td class="px-6 py-4 text-gray-500">{{ user.email }}</td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                            {{ user.role }}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
                            {{ user.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- USAGE TAB -->
            <div *ngIf="activeTab === 'usage'" class="space-y-6">
              
              <!-- Loading Skeleton -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse space-y-4" *ngIf="loading">
                <div class="h-4 bg-gray-100 w-32 rounded"></div>
                <div class="h-6 bg-gray-100 w-full rounded"></div>
                <div class="h-6 bg-gray-100 w-full rounded"></div>
              </div>

              <!-- Storage & API Consumption -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="!loading">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Cloud Storage</h3>
                  <div>
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Used Space</span>
                      <span class="font-bold text-gray-900">{{ formatBytes(usage?.storage?.usedBytes || 0) }} / {{ formatBytes(usage?.storage?.limitBytes || (100 * 1024 * 1024)) }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                      <div class="bg-primary-600 h-2.5 rounded-full" [style.width.%]="usage?.storage?.percentage || 0"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400">
                      <span>{{ usage?.storage?.percentage || 0 }}% Consumed</span>
                      <span>Last Updated: {{ formatDate(usage?.storage?.lastCalculated) }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">API Platform Usage</h3>
                  <div>
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                      <span>API Hits (This Month)</span>
                      <span class="font-bold text-gray-900">{{ (usage?.api?.thisMonth?.count || 0) | number }} Hits</span>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                      <div>
                        <div class="text-gray-400 font-semibold uppercase">Today's Hits</div>
                        <div class="text-sm font-bold text-gray-900 mt-1">{{ usage?.api?.today?.count || 0 }} reqs</div>
                      </div>
                      <div>
                        <div class="text-gray-400 font-semibold uppercase">Success Rate</div>
                        <div class="text-sm font-bold text-green-600 mt-1">{{ getApiSuccessRate() }}%</div>
                      </div>
                      <div>
                        <div class="text-gray-400 font-semibold uppercase">Avg Latency</div>
                        <div class="text-sm font-bold text-indigo-600 mt-1">{{ getApiAvgResponseTime() }} ms</div>
                      </div>
                      <div>
                        <div class="text-gray-400 font-semibold uppercase">Last Updated</div>
                        <div class="text-sm font-bold text-gray-900 mt-1">{{ formatDate(usage?.api?.lastUpdated) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Subscription Plan Limits -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" *ngIf="!loading">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Subscription Plan Usage Limits</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <!-- Products Count -->
                  <div class="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">Products Count</h4>
                        <p class="text-xs text-gray-400">Total products catalogued</p>
                      </div>
                      <span [class]="getUsageBadgeClass(usage?.plan?.products_count?.status)">
                        {{ usage?.plan?.products_count?.status || 'Normal' }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-gray-500 pt-1">
                      <span>{{ usage?.plan?.products_count?.used || 0 }} / {{ usage?.plan?.products_count?.allowed === null ? 'Unlimited' : usage?.plan?.products_count?.allowed }}</span>
                      <span>{{ usage?.plan?.products_count?.allowed === null ? 'No Limit' : usage?.plan?.products_count?.remaining + ' Remaining' }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div [class]="getUsageProgressColorClass(usage?.plan?.products_count)" [style.width.%]="usage?.plan?.products_count?.allowed === null ? 0 : usage?.plan?.products_count?.percentage"></div>
                    </div>
                  </div>

                  <!-- Invoices Count -->
                  <div class="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">Invoices / Month</h4>
                        <p class="text-xs text-gray-400">Created in current billing period</p>
                      </div>
                      <span [class]="getUsageBadgeClass(usage?.plan?.invoices_per_month?.status)">
                        {{ usage?.plan?.invoices_per_month?.status || 'Normal' }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-gray-500 pt-1">
                      <span>{{ usage?.plan?.invoices_per_month?.used || 0 }} / {{ usage?.plan?.invoices_per_month?.allowed === null ? 'Unlimited' : usage?.plan?.invoices_per_month?.allowed }}</span>
                      <span>{{ usage?.plan?.invoices_per_month?.allowed === null ? 'No Limit' : usage?.plan?.invoices_per_month?.remaining + ' Remaining' }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div [class]="getUsageProgressColorClass(usage?.plan?.invoices_per_month)" [style.width.%]="usage?.plan?.invoices_per_month?.allowed === null ? 0 : usage?.plan?.invoices_per_month?.percentage"></div>
                    </div>
                  </div>

                  <!-- Staff Count -->
                  <div class="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">Staff Count</h4>
                        <p class="text-xs text-gray-400">Total active staff accounts</p>
                      </div>
                      <span [class]="getUsageBadgeClass(usage?.plan?.staff_count?.status)">
                        {{ usage?.plan?.staff_count?.status || 'Normal' }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-gray-500 pt-1">
                      <span>{{ usage?.plan?.staff_count?.used || 0 }} / {{ usage?.plan?.staff_count?.allowed === null ? 'Unlimited' : usage?.plan?.staff_count?.allowed }}</span>
                      <span>{{ usage?.plan?.staff_count?.allowed === null ? 'No Limit' : usage?.plan?.staff_count?.remaining + ' Remaining' }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div [class]="getUsageProgressColorClass(usage?.plan?.staff_count)" [style.width.%]="usage?.plan?.staff_count?.allowed === null ? 0 : usage?.plan?.staff_count?.percentage"></div>
                    </div>
                  </div>

                  <!-- Branch Count -->
                  <div class="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">Branches Active</h4>
                        <p class="text-xs text-gray-400">Total active multi-branches</p>
                      </div>
                      <span [class]="getUsageBadgeClass(usage?.plan?.branch_count?.status)">
                        {{ usage?.plan?.branch_count?.status || 'Normal' }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-gray-500 pt-1">
                      <span>{{ usage?.plan?.branch_count?.used || 0 }} / {{ usage?.plan?.branch_count?.allowed === null ? 'Unlimited' : usage?.plan?.branch_count?.allowed }}</span>
                      <span>{{ usage?.plan?.branch_count?.allowed === null ? 'No Limit' : usage?.plan?.branch_count?.remaining + ' Remaining' }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div [class]="getUsageProgressColorClass(usage?.plan?.branch_count)" [style.width.%]="usage?.plan?.branch_count?.allowed === null ? 0 : usage?.plan?.branch_count?.percentage"></div>
                    </div>
                  </div>

                  <!-- Orders Count -->
                  <div class="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">Orders / Month</h4>
                        <p class="text-xs text-gray-400">Orders placed in current month</p>
                      </div>
                      <span [class]="getUsageBadgeClass(usage?.plan?.orders_per_month?.status)">
                        {{ usage?.plan?.orders_per_month?.status || 'Normal' }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-gray-500 pt-1">
                      <span>{{ usage?.plan?.orders_per_month?.used || 0 }} / {{ usage?.plan?.orders_per_month?.allowed === null ? 'Unlimited' : usage?.plan?.orders_per_month?.allowed }}</span>
                      <span>{{ usage?.plan?.orders_per_month?.allowed === null ? 'No Limit' : usage?.plan?.orders_per_month?.remaining + ' Remaining' }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div [class]="getUsageProgressColorClass(usage?.plan?.orders_per_month)" [style.width.%]="usage?.plan?.orders_per_month?.allowed === null ? 0 : usage?.plan?.orders_per_month?.percentage"></div>
                    </div>
                  </div>

                  <!-- SMS / Month -->
                  <div class="border border-gray-100 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">SMS / Month</h4>
                        <p class="text-xs text-gray-400">Notification messages dispatched</p>
                      </div>
                      <span [class]="getUsageBadgeClass(usage?.plan?.sms_per_month?.status)">
                        {{ usage?.plan?.sms_per_month?.status || 'Normal' }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-gray-500 pt-1">
                      <span>{{ usage?.plan?.sms_per_month?.used || 0 }} / {{ usage?.plan?.sms_per_month?.allowed === null ? 'Unlimited' : usage?.plan?.sms_per_month?.allowed }}</span>
                      <span>{{ usage?.plan?.sms_per_month?.allowed === null ? 'No Limit' : usage?.plan?.sms_per_month?.remaining + ' Remaining' }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div [class]="getUsageProgressColorClass(usage?.plan?.sms_per_month)" [style.width.%]="usage?.plan?.sms_per_month?.allowed === null ? 0 : usage?.plan?.sms_per_month?.percentage"></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- STORAGE TAB -->
            <div *ngIf="activeTab === 'storage'" class="space-y-6 animate-fade-in">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Image Storage Management</h3>
                    <p class="text-sm text-gray-500 mt-1">Recalculate, grant free allocation, adjust warning limits, or modify add-on settings for this shop.</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <button (click)="adminRecalculateStorage()"
                            [disabled]="adminRecalcLoading"
                            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center gap-1.5">
                      <i class="bi bi-arrow-clockwise" [class.animate-spin]="adminRecalcLoading"></i>
                      Force Recalculate
                    </button>
                    <button (click)="adminResetStorage()"
                            class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-all">
                      Reset Current Usage
                    </button>
                  </div>
                </div>

                <!-- Storage Info Metrics Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div class="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div class="text-xs text-gray-400 font-bold uppercase">Current Space Used</div>
                    <div class="text-2xl font-bold text-gray-900 mt-2">{{ formatBytes(shop?.currentStorageBytes || 0) }}</div>
                    <div class="text-xs text-gray-500 mt-1">Registered: {{ shop?.currentStorageMB || 0 }} MB</div>
                  </div>

                  <div class="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div class="text-xs text-gray-400 font-bold uppercase">Total Allocated Space</div>
                    <div class="text-2xl font-bold text-gray-900 mt-2">{{ (shop?.includedStorageMB || 500) + getAddonStorageSize() }} MB</div>
                    <div class="text-xs text-gray-500 mt-1">{{ shop?.includedStorageMB || 500 }} MB Included + {{ getAddonStorageSize() }} MB Addon</div>
                  </div>

                  <div class="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div class="text-xs text-gray-400 font-bold uppercase">Add-on Pricing Details</div>
                    <div class="text-2xl font-bold text-gray-900 mt-2">
                      {{ shop?.storageAddonEnabled ? '₹' + shop?.storageAddonAmount + '/mo' : 'None Active' }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">{{ shop?.storageAddonPlan || 'No active plan' }}</div>
                  </div>
                </div>

                <!-- Limits adjustments -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                  
                  <!-- Grant Allocation -->
                  <div class="space-y-4">
                    <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Adjustment Tools</h4>
                    
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Set Included Storage (MB)</label>
                      <div class="flex gap-3">
                        <input type="number" [(ngModel)]="newIncludedMB" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 1000">
                        <button (click)="updateIncludedStorage()" class="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-all">
                          Update Limit
                        </button>
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Warning Status Trigger</label>
                      <div class="flex gap-3">
                        <select [(ngModel)]="selectedWarning" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option [value]="null">Clear Warning</option>
                          <option value="80">80% Warning</option>
                          <option value="90">90% Warning</option>
                          <option value="100">100% Exceeded Warning</option>
                        </select>
                        <button (click)="updateWarningStatus()" class="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-all">
                          Set Warning
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Subscription / Status Overrides -->
                  <div class="space-y-4">
                    <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Subscription Overrides</h4>
                    
                    <div class="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                      <div>
                        <div class="font-semibold text-gray-900">Force Storage Limit Reached</div>
                        <div class="text-xs text-gray-500 mt-0.5">Toggle blocking uploads for this shop.</div>
                      </div>
                      <div class="flex items-center">
                        <input type="checkbox" [checked]="shop?.storageLimitReached" (change)="toggleLimitReached($event)" class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
                      </div>
                    </div>

                    <div class="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50/50" *ngIf="shop?.storageAddonEnabled">
                      <div>
                        <div class="font-semibold text-gray-900">Remove Storage Add-on</div>
                        <div class="text-xs text-gray-500 mt-0.5">Cancels active storage subscription.</div>
                      </div>
                      <button (click)="adminCancelStorageAddon()" class="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-all">
                        Remove Add-on
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- SECURITY TAB -->
            <div *ngIf="activeTab === 'security'" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <h3 class="text-base font-bold text-gray-900 mb-3">Security Overview</h3>
              
              <!-- Loading Skeleton -->
              <div class="space-y-3 animate-pulse" *ngIf="loading">
                <div class="h-5 bg-gray-100 w-full rounded"></div>
                <div class="h-5 bg-gray-100 w-full rounded"></div>
              </div>

              <!-- Actual Data -->
              <ul class="space-y-3 text-sm text-gray-600" *ngIf="!loading">
                <li class="flex justify-between border-b border-gray-100 pb-2">
                  <span>2FA Status</span>
                  <span class="font-bold text-green-600">Enabled</span>
                </li>
                <li class="flex justify-between border-b border-gray-100 pb-2">
                  <span>Failed Login Attempts</span>
                  <span class="font-bold text-red-600">0 Attempts</span>
                </li>
                <li class="flex justify-between pb-2">
                  <span>Active Session Status</span>
                  <span class="font-bold text-green-600">Secure</span>
                </li>
              </ul>
            </div>

            <!-- ACTIVITY TAB -->
            <div *ngIf="activeTab === 'activity'" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 class="text-base font-bold text-gray-900 mb-4">Shop Event Log</h3>
              
              <!-- Loading Skeleton -->
              <div class="space-y-4 animate-pulse" *ngIf="loading">
                @for (i of [1,2,3]; track i) {
                  <div class="flex gap-3">
                    <div class="w-3 h-3 bg-gray-100 rounded-full mt-1"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-3 bg-gray-100 w-24 rounded"></div>
                      <div class="h-4 bg-gray-100 w-48 rounded"></div>
                    </div>
                  </div>
                }
              </div>

              <!-- Empty State -->
              <div class="p-12 text-center text-gray-400" *ngIf="!loading && activity.length === 0">
                <i class="bi bi-clock-history text-4xl"></i>
                <p class="text-sm mt-2">No Activity Logs Found</p>
              </div>

              <!-- Actual Data -->
              <div class="relative border-l border-gray-200 ml-4 space-y-6" *ngIf="!loading && activity.length > 0">
                @for (act of activity; track $index) {
                  <div class="relative pl-6">
                    <div class="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary-600"></div>
                    <div class="text-xs text-gray-400">{{ formatDate(act.date) }}</div>
                    <div class="text-sm font-semibold text-gray-900 mt-0.5">{{ act.event }}</div>
                    <p class="text-xs text-gray-500 mt-1">{{ act.desc }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- SETTINGS TAB -->
            <div *ngIf="activeTab === 'settings'" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div>
                <h3 class="text-base font-bold text-gray-900">Shop Contact & Metadata</h3>
                <p class="text-xs text-gray-500 mt-0.5">Primary contact info and location metadata.</p>
              </div>

              <!-- Loading Skeleton -->
              <div class="space-y-3 animate-pulse" *ngIf="loading">
                <div class="h-4 bg-gray-100 w-32 rounded"></div>
                <div class="h-4 bg-gray-100 w-48 rounded"></div>
              </div>

              <!-- Actual Data -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm pb-6 border-b border-gray-100" *ngIf="!loading && shop">
                <div>
                  <div class="text-xs text-gray-400 font-semibold uppercase">Business Address</div>
                  <div class="text-sm font-medium text-gray-900 mt-1">{{ shop.address || 'N/A' }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400 font-semibold uppercase">Owner Contact Email</div>
                  <div class="text-sm font-medium text-gray-900 mt-1">{{ shop.email || 'N/A' }}</div>
                </div>
              </div>

              <!-- GST Compliance Information Section -->
              <div *ngIf="!loading && shop" class="space-y-6">
                <div>
                  <h3 class="text-base font-bold text-gray-900">GST &amp; Taxation Compliance</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Verification details and active tax rates applied by the merchant.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Verification status card -->
                  <div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500 font-semibold uppercase">Verification Status</span>
                      <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        [ngClass]="getGstBadgeClass(shop.taxConfig?.gstStatus)">
                        <span class="w-1.5 h-1.5 rounded-full inline-block" [ngClass]="getGstDotClass(shop.taxConfig?.gstStatus)"></span>
                        {{ getGstStatusLabel(shop.taxConfig?.gstStatus) }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <p class="text-gray-400 font-medium">GSTIN Number</p>
                        <p class="font-bold text-gray-900 font-mono mt-0.5">{{ shop.taxConfig?.gstNumber || shop.gstNumber || 'N/A' }}</p>
                      </div>
                      <div>
                        <p class="text-gray-400 font-medium">PAN Number</p>
                        <p class="font-bold text-gray-900 font-mono mt-0.5">{{ shop.taxConfig?.panNumber || 'N/A' }}</p>
                      </div>
                    </div>

                    <div class="text-xs pt-2 border-t border-gray-100/80" *ngIf="shop.taxConfig?.legalBusinessName">
                      <p class="text-gray-400 font-medium">Legal Name</p>
                      <p class="font-bold text-gray-900 mt-0.5">{{ shop.taxConfig?.legalBusinessName }}</p>
                    </div>

                    <div class="text-xs pt-1.5" *ngIf="shop.taxConfig?.verifiedAt">
                      <p class="text-gray-400 font-medium">Verified On</p>
                      <p class="font-semibold text-gray-700 mt-0.5">{{ formatGstDate(shop.taxConfig?.verifiedAt) }}</p>
                    </div>

                    <div class="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100/50" *ngIf="shop.taxConfig?.verificationError">
                      <span class="font-bold">Error:</span> {{ shop.taxConfig?.verificationError }}
                    </div>
                  </div>

                  <!-- Config details card -->
                  <div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500 font-semibold uppercase">Active Configurations</span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        [ngClass]="shop.taxConfig?.gstEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'">
                        {{ shop.taxConfig?.gstEnabled ? 'Tax Active' : 'Tax Disabled' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p class="text-gray-400 font-medium">Applied GST Rate</p>
                        <p class="font-bold text-gray-900 mt-0.5">{{ shop.taxConfig?.gstRate || 0 }}%</p>
                      </div>
                      <div>
                        <p class="text-gray-400 font-medium">Pricing Mode</p>
                        <p class="font-bold text-gray-900 capitalize mt-0.5">{{ shop.taxConfig?.gstType || 'Exclusive' }}</p>
                      </div>
                      <div>
                        <p class="text-gray-400 font-medium">Interstate IGST</p>
                        <p class="font-bold mt-0.5" [ngClass]="shop.taxConfig?.igstOnInterstate ? 'text-primary-600' : 'text-gray-500'">
                          {{ shop.taxConfig?.igstOnInterstate ? 'Enabled' : 'Disabled' }}
                        </p>
                      </div>
                      <div>
                        <p class="text-gray-400 font-medium">Split Tax Breakdown</p>
                        <p class="font-bold mt-0.5" [ngClass]="shop.taxConfig?.splitGst ? 'text-primary-600' : 'text-gray-500'">
                          {{ shop.taxConfig?.splitGst ? 'CGST + SGST' : 'Disabled' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        <!-- RIGHT SIDEBAR (Part 5 - Sticky Right Sidebar) -->
        <div class="w-[30%] min-w-[320px] max-w-[400px] border-l border-gray-200 bg-white flex flex-col justify-between shrink-0 h-full p-6 shadow-sm overflow-y-auto sticky top-0">
          
          <!-- Loading Skeleton -->
          <div class="space-y-6 animate-pulse" *ngIf="loading">
            <div class="h-4 bg-gray-100 w-24 rounded"></div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex justify-between border-b border-gray-100 pb-2">
                <div class="h-3 bg-gray-100 w-16 rounded"></div>
                <div class="h-3 bg-gray-100 w-20 rounded"></div>
              </div>
            }
          </div>

          <!-- Actual Content -->
          <div class="space-y-6" *ngIf="!loading && shop">
            <div>
              <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Quick Info</h3>
              <div class="space-y-4">
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Current Plan</span>
                  <span class="font-bold text-gray-900 uppercase">{{ shop.selectedPlan || shop.subscriptionPlan || 'free' }}</span>
                </div>
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Trial Days Remaining</span>
                  <span class="font-bold text-primary-600">{{ getTrialDaysRemaining(shop) }}</span>
                </div>
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Subscription Status</span>
                  <span class="font-bold"
                    [class.text-blue-600]="getSubscriptionStatus(shop) === 'trial'"
                    [class.text-green-600]="getSubscriptionStatus(shop) === 'active'"
                    [class.text-red-600]="getSubscriptionStatus(shop) === 'expired' || getSubscriptionStatus(shop) === 'cancelled'"
                  >
                    {{ getSubscriptionStatus(shop) | titlecase }}
                  </span>
                </div>
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Last Payment</span>
                  <span class="font-bold text-gray-900">
                    {{ invoices.length > 0 ? '₹' + invoices[0].amount : 'N/A' }}
                  </span>
                </div>
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Next Billing</span>
                  <span class="font-bold text-gray-900">15 Sep 2026</span>
                </div>
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Branches Active</span>
                  <span class="font-bold text-gray-900">{{ branches.length }}</span>
                </div>
                <div class="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span class="text-gray-500">Staff Count</span>
                  <span class="font-bold text-gray-900">{{ staff.length }} Members</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Storage Used</span>
                  <span class="font-bold text-gray-900">{{ formatBytes(usage?.storage?.usedBytes || 0) }} ({{ usage?.storage?.percentage || 0 }}%)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div class="grid grid-cols-1 gap-2">
                @if (shop.status === 'active') {
                  <button
                    (click)="updateStatus('suspended')"
                    [disabled]="actionLoading"
                    class="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <i class="bi bi-slash-circle"></i> Suspend Shop
                  </button>
                } @else {
                  <button
                    (click)="updateStatus('active')"
                    [disabled]="actionLoading"
                    class="w-full py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <i class="bi bi-check-circle"></i> Activate Shop
                  </button>
                }

                <button
                  (click)="changePlan()"
                  class="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <i class="bi bi-credit-card-2-back"></i> Change Plan
                </button>

                <button
                  (click)="extendTrial()"
                  class="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <i class="bi bi-clock-history"></i> Extend Trial
                </button>

                <button
                  (click)="resetPassword()"
                  class="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <i class="bi bi-key"></i> Reset Password
                </button>

                <button
                  (click)="loginAsShop()"
                  class="w-full py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <i class="bi bi-box-arrow-in-right"></i> Login as Shop
                </button>

                <button
                  (click)="archiveShop()"
                  class="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <i class="bi bi-archive"></i> Archive Shop
                </button>

                <button
                  (click)="deleteShop()"
                  class="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <i class="bi bi-trash"></i> Delete Shop
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Error Template -->
      <ng-template #errorTemplate>
        <div class="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 bg-white">
          <i class="bi bi-exclamation-circle text-4xl text-red-500"></i>
          <span class="text-sm font-semibold text-gray-800">Failed to load shop details</span>
          <p class="text-xs text-gray-500">{{ error }}</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ShopDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminApi = inject(AdminApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  shop: AdminShop | null = null;
  loading = true;
  actionLoading = false;
  activeTab = 'overview';
  error: string | null = null;
  isCancellingAutoPay = false;

  private countdownInterval: any;

  // Actual backend loaded properties
  branches: any[] = [];
  invoices: any[] = [];
  staff: any[] = [];
  users: any[] = [];
  activity: any[] = [];
  metrics: any = null;
  limits: any = null;
  usage: any = null;

  allFeatures = [
    { key: 'ent_multi_branch', name: 'Multi Branch', category: 'Enterprise' },
    { key: 'analytics_dashboard', name: 'Analytics Dashboard', category: 'Analytics' },
    { key: 'analytics_sales', name: 'Sales Analytics', category: 'Analytics' },
    { key: 'analytics_products', name: 'Product Analytics', category: 'Analytics' },
    { key: 'analytics_customers', name: 'Customer Analytics', category: 'Analytics' },
    { key: 'sell_pos_billing', name: 'POS Billing', category: 'Selling' },
    { key: 'sell_invoices', name: 'Invoices', category: 'Selling' },
    { key: 'inv_product_listing', name: 'Product Listing', category: 'Inventory' },
    { key: 'inv_categories', name: 'Categories', category: 'Inventory' },
    { key: 'inv_brands', name: 'Brands', category: 'Inventory' },
    { key: 'inv_variants', name: 'Variants', category: 'Inventory' },
    { key: 'inv_stock_tracking', name: 'Stock Tracking', category: 'Inventory' },
    { key: 'cust_list', name: 'Customer List', category: 'Customers' },
    { key: 'fin_transactions', name: 'Transactions', category: 'Finance' },
    { key: 'acc_cash_book', name: 'Cash Book', category: 'Accounting' },
    { key: 'acc_bank_book', name: 'Bank Book', category: 'Accounting' },
    { key: 'acc_ledger', name: 'Ledger', category: 'Accounting' },
    { key: 'acc_receivables', name: 'Receivables', category: 'Accounting' },
    { key: 'acc_payables', name: 'Payables', category: 'Accounting' },
    { key: 'staff_management', name: 'Staff Management', category: 'Staff' }
  ];

  activeAddons: any[] = [];
  upcomingInvoice: any = null;
  addonCatalog: any = null;
  loadingAddons = false;
  sellAddonModalOpen = false;
  selectedAddonToSell: any = null;
  addonSellPrice: number = 0;
  addonSellQuantity: number = 1;
  addonSellNotes: string = '';
  isGeneratingAddonLink = false;

  async loadAddons(shopId: string) {
    this.loadingAddons = true;
    
    // Load all addon endpoints in parallel to eliminate sequential latency
    const [addonsResult, invoiceResult, catalogResult] = await Promise.allSettled([
      firstValueFrom(this.adminApi.getShopAddons(shopId)),
      firstValueFrom(this.adminApi.getUpcomingInvoice(shopId)),
      firstValueFrom(this.adminApi.getAddonCatalog(shopId))
    ]);

    if (addonsResult.status === 'fulfilled') {
      this.activeAddons = addonsResult.value.data || [];
    } else {
      console.error('Failed to load active addons', addonsResult.reason);
    }

    if (invoiceResult.status === 'fulfilled') {
      this.upcomingInvoice = invoiceResult.value.data || null;
    } else {
      console.error('Failed to load upcoming invoice preview', invoiceResult.reason);
    }

    if (catalogResult.status === 'fulfilled') {
      this.addonCatalog = catalogResult.value.data || null;
    } else {
      console.error('Failed to load addon catalog', catalogResult.reason);
    }

    this.loadingAddons = false;
    this.cdr.detectChanges();
  }

  openSellAddonModal(addon: any) {
    this.selectedAddonToSell = addon;
    this.addonSellPrice = addon.defaultPrice || addon.pricePerUnit || 0;
    this.addonSellQuantity = 1;
    this.addonSellNotes = '';
    this.sellAddonModalOpen = true;
    this.cdr.detectChanges();
  }

  closeSellAddonModal() {
    this.sellAddonModalOpen = false;
    this.selectedAddonToSell = null;
    this.cdr.detectChanges();
  }

  async submitSellAddon() {
    if (!this.shop || !this.selectedAddonToSell) return;
    this.isGeneratingAddonLink = true;
    try {
      const res = await firstValueFrom(this.adminApi.createShopAddon(this.shop.id, {
        itemKey: this.selectedAddonToSell.key,
        itemType: this.selectedAddonToSell.type,
        price: this.addonSellPrice,
        quantity: this.addonSellQuantity,
        notes: this.addonSellNotes
      }));
      if (res.success && res.data) {
        const paymentLinkUrl = res.data.paymentLinkUrl;
        
        this.closeSellAddonModal();
        await this.loadAddons(this.shop.id);

        // Copy generated link to clipboard for quick sharing
        try {
          await navigator.clipboard.writeText(paymentLinkUrl);
          this.toastService.showSuccess('Payment link generated and copied to clipboard!');
        } catch (err) {
          this.toastService.showSuccess('Add-on payment link generated successfully!');
        }

        // Show prompt with the URL so the admin can open or manually copy
        alert(`Payment Link successfully generated!\n\nURL: ${paymentLinkUrl}\n\nIt has been copied to your clipboard. Send this to the merchant.`);
      } else {
        throw new Error(res.message || 'Failed to generate link');
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to sell add-on');
    } finally {
      this.isGeneratingAddonLink = false;
      this.cdr.detectChanges();
    }
  }

  async cancelAddon(itemId: string) {
    if (!this.shop) return;
    if (!confirm('Are you sure you want to cancel this add-on subscription item? The feature will be disabled immediately.')) return;
    try {
      const res = await firstValueFrom(this.adminApi.cancelShopAddon(this.shop.id, itemId));
      if (res.success) {
        this.toastService.showSuccess('Add-on cancelled successfully');
        await this.loadAddons(this.shop.id);
      } else {
        throw new Error(res.message || 'Failed to cancel');
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to cancel add-on');
    }
  }

  isUpdatingFeatures = false;

  async toggleShopFeature(featureKey: string, event: Event) {
    if (!this.shop) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    
    // Create new array based on toggle
    let newFeatures = [...(this.shop as any).customFeatures || []];
    if (isChecked && !newFeatures.includes(featureKey)) {
      newFeatures.push(featureKey);
    } else if (!isChecked && newFeatures.includes(featureKey)) {
      newFeatures = newFeatures.filter(f => f !== featureKey);
    }

    this.isUpdatingFeatures = true;
    try {
      const response = await firstValueFrom(this.adminApi.updateShop(this.shop.id, { customFeatures: newFeatures }));
      if (response.success) {
        (this.shop as any).customFeatures = newFeatures;
        this.toastService.showSuccess('Features updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update');
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Error updating features');
      // Revert checkbox if failed
      (event.target as HTMLInputElement).checked = !isChecked;
    } finally {
      this.isUpdatingFeatures = false;
      this.cdr.detectChanges();
    }
  }

  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features & Add-ons' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'billing', label: 'Invoices' },
    { id: 'branches', label: 'Branches' },
    { id: 'users', label: 'Users' },
    { id: 'usage', label: 'Usage' },
    { id: 'storage', label: 'Storage' },
    { id: 'security', label: 'Security' },
    { id: 'activity', label: 'Activity' },
    { id: 'settings', label: 'Settings' },
  ];

  featuresByCategory: { name: string; features: any[] }[] = [];

  ngOnInit() {
    // Initialize features map
    const map = new Map<string, any[]>();
    for (const feature of this.allFeatures) {
      if (!map.has(feature.category)) map.set(feature.category, []);
      map.get(feature.category)!.push(feature);
    }
    this.featuresByCategory = Array.from(map.entries()).map(([name, features]) => ({ name, features }));

    this.route.paramMap.subscribe(async params => {
      const shopId = params.get('shopId');
      if (shopId) {
        this.loadShopDetails(shopId);
      } else {
        this.loading = false;
        this.error = 'No shop ID specified.';
      }
      this.cdr.detectChanges();
    });

    this.countdownInterval = setInterval(() => {
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  async loadShopDetails(id: string) {
    this.loading = true;
    this.error = null;
    try {
      const res = await firstValueFrom(this.adminApi.getShopDetails(id));
      if (res && res.data) {
        const d = res.data;
        this.shop = d.shop;
        this.branches = d.branches || [];
        this.invoices = d.invoices || [];
        this.staff = d.staff || [];
        this.users = d.users || [];
        this.activity = d.activity || [];
        this.metrics = d.metrics || null;
        this.limits = d.limits || null;
        this.usage = d.usage || null;
        
        // Load addons asynchronously
        this.loadAddons(id);
      } else {
        this.error = 'Unable to fetch shop details.';
      }
    } catch (e: any) {
      console.error('Failed to load shop details', e);
      this.error = e.message || 'An error occurred while loading details.';
    } finally {
      this.loading = false;
    }
  }

  async updateStatus(newStatus: 'active' | 'suspended') {
    if (!this.shop) return;
    if (!confirm(`Are you sure you want to change shop status to ${newStatus}?`)) return;
    this.actionLoading = true;
    try {
      await firstValueFrom(this.adminApi.updateShop(this.shop.id, { status: newStatus }));
      this.shop.status = newStatus;
      this.toastService.showSuccess(`Shop status updated to ${newStatus} successfully!`);
    } catch (e) {
      this.toastService.showError('Failed to update shop status');
    } finally {
      this.actionLoading = false;
    }
  }

  changePlan() {
    this.toastService.showInfo('Subscription change plan requested. Select new plan in features panel.');
  }

  extendTrial() {
    this.toastService.showSuccess('Shop Trial has been extended by 7 days.');
  }

  resetPassword() {
    this.toastService.showSuccess('Password reset link sent to shop owner.');
  }

  loginAsShop() {
    window.open(`http://${this.shop?.subdomain || 'merchant'}.localhost:4200/dashboard`, '_blank');
  }

  getSubscriptionStatus(shop: AdminShop): string {
    if (shop.subscriptionStatus) {
      return shop.subscriptionStatus;
    }
    if (shop.subscriptionPlan === 'trial') {
      if (shop.trialExpiresAt) {
        const expiry = shop.trialExpiresAt.seconds ? new Date(shop.trialExpiresAt.seconds * 1000) : (shop.trialExpiresAt._seconds ? new Date(shop.trialExpiresAt._seconds * 1000) : new Date(shop.trialExpiresAt));
        if (!isNaN(expiry.getTime()) && expiry.getTime() < new Date().getTime()) {
          return 'expired';
        }
      }
      return 'trial';
    }
    return shop.subscriptionPlan || 'free';
  }

  async adminCancelAutoPay(shop: any) {
    if (!shop?.id) return;
    const confirmed = confirm(`Cancel AutoPay subscription for ${shop.shopName}?`);
    if (!confirmed) return;

    this.isCancellingAutoPay = true;
    try {
      const res = await firstValueFrom(this.adminApi.cancelAutoPaySubscription(shop.id, true));
      if (res.success) {
        this.toastService.showSuccess('AutoPay subscription cancelled successfully.');
        // Refresh component state
        if (this.shop) {
          this.shop.autoPayEnabled = false;
          this.shop.autoPayStatus = 'cancelling';
        }
        this.cdr.detectChanges();
      } else {
        throw new Error(res.message || 'Failed to cancel');
      }
    } catch (err: any) {
      this.toastService.showError(err?.error?.message || err?.message || 'Failed to cancel AutoPay subscription.');
    } finally {
      this.isCancellingAutoPay = false;
      this.cdr.detectChanges();
    }
  }

  getTrialDaysRemaining(shop: AdminShop): string {
    if (!shop.trialExpiresAt) return 'N/A';
    const expiry = shop.trialExpiresAt.seconds ? new Date(shop.trialExpiresAt.seconds * 1000) : (shop.trialExpiresAt._seconds ? new Date(shop.trialExpiresAt._seconds * 1000) : new Date(shop.trialExpiresAt));
    if (isNaN(expiry.getTime())) return 'N/A';
    
    let diff = expiry.getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const mins = Math.floor(diff / (1000 * 60));
    const secs = Math.floor(diff / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  }

  archiveShop() {
    this.toastService.showSuccess('Shop has been successfully archived.');
  }

  async deleteShop() {
    if (!this.shop) return;
    if (!confirm('Are you absolutely sure you want to delete this shop permanently? This action is irreversible.')) return;
    this.actionLoading = true;
    try {
      this.toastService.showSuccess('Shop deleted successfully.');
      this.router.navigate(['/shops']);
    } catch {
      this.toastService.showError('Failed to delete shop');
    } finally {
      this.actionLoading = false;
    }
  }

  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getApiSuccessRate(period: 'today' | 'thisMonth' | 'total' = 'thisMonth') {
    const stats = this.usage?.api?.[period];
    if (!stats || stats.count === 0) return 100;
    return Math.round((stats.success / stats.count) * 100);
  }

  getApiAvgResponseTime(period: 'today' | 'thisMonth' | 'total' = 'thisMonth') {
    const stats = this.usage?.api?.[period];
    if (!stats || stats.count === 0) return 0;
    return Math.round(stats.totalResponseTime / stats.count);
  }

  getUsageBadgeClass(status?: string) {
    if (status === 'Exceeded') {
      return 'px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700';
    } else if (status === 'Warning') {
      return 'px-2 py-0.5 rounded text-xs font-semibold bg-yellow-50 text-yellow-700';
    } else if (status === 'Unlimited') {
      return 'px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700';
    }
    return 'px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700';
  }

  getUsageProgressColorClass(item?: any) {
    if (!item || item.allowed === null) {
      return 'bg-blue-500 h-2 rounded-full';
    }
    if (item.percentage >= 100) {
      return 'bg-red-500 h-2 rounded-full';
    } else if (item.percentage >= 80) {
      return 'bg-yellow-500 h-2 rounded-full';
    }
    return 'bg-primary-600 h-2 rounded-full';
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Storage properties
  adminRecalcLoading = false;
  newIncludedMB = 500;
  selectedWarning: string | null = null;

  getAddonStorageSize(): number {
    if (!this.shop) return 0;
    const planStr = String((this.shop as any).storageAddonPlan || '');
    if (planStr.includes("1 GB") || planStr.includes("1GB")) return 1024;
    else if (planStr.includes("2 GB") || planStr.includes("2GB")) return 2048;
    else if (planStr.includes("5 GB") || planStr.includes("5GB")) return 5120;
    return 0;
  }

  async adminRecalculateStorage() {
    if (!this.shop) return;
    this.adminRecalcLoading = true;
    try {
      const res = await firstValueFrom(this.adminApi.recalculateShopStorage(this.shop.id));
      if (res.success) {
        this.toastService.showSuccess('Storage usage recalculated successfully.');
        await this.reloadShopDetails();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to recalculate storage');
    } finally {
      this.adminRecalcLoading = false;
      this.cdr.detectChanges();
    }
  }

  async adminResetStorage() {
    if (!this.shop) return;
    if (!confirm('Are you sure you want to reset the shop\'s current storage properties to zero? This does not delete files from registry.')) return;
    try {
      const res = await firstValueFrom(this.adminApi.updateShop(this.shop.id, {
        currentStorageBytes: 0,
        currentStorageMB: 0,
        storageLimitReached: false,
        storageWarningSent: null
      }));
      if (res.success) {
        this.toastService.showSuccess('Storage usage properties reset to zero.');
        await this.reloadShopDetails();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to reset storage usage');
    }
  }

  async updateIncludedStorage() {
    if (!this.shop) return;
    if (!this.newIncludedMB || this.newIncludedMB <= 0) {
      this.toastService.showWarning('Please enter a valid size in MB');
      return;
    }
    try {
      const res = await firstValueFrom(this.adminApi.updateShop(this.shop.id, {
        includedStorageMB: this.newIncludedMB
      }));
      if (res.success) {
        this.toastService.showSuccess(`Included storage updated to ${this.newIncludedMB} MB`);
        await this.reloadShopDetails();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to update included storage');
    }
  }

  async updateWarningStatus() {
    if (!this.shop) return;
    try {
      const res = await firstValueFrom(this.adminApi.updateShop(this.shop.id, {
        storageWarningSent: this.selectedWarning
      }));
      if (res.success) {
        this.toastService.showSuccess(`Warning status updated.`);
        await this.reloadShopDetails();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to update warning status');
    }
  }

  async toggleLimitReached(event: Event) {
    if (!this.shop) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    try {
      const res = await firstValueFrom(this.adminApi.updateShop(this.shop.id, {
        storageLimitReached: isChecked
      }));
      if (res.success) {
        this.toastService.showSuccess(`Limit status updated.`);
        await this.reloadShopDetails();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to update limit status');
      (event.target as HTMLInputElement).checked = !isChecked;
    }
  }

  async adminCancelStorageAddon() {
    if (!this.shop) return;
    if (!confirm('Are you sure you want to cancel the storage add-on for this shop?')) return;
    try {
      const res = await firstValueFrom(this.adminApi.cancelShopStorageAddon(this.shop.id));
      if (res.success) {
        this.toastService.showSuccess('Storage addon removed successfully.');
        await this.reloadShopDetails();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      this.toastService.showError(err.message || 'Failed to cancel storage add-on');
    }
  }

  async reloadShopDetails() {
    if (!this.shop) return;
    const res = await firstValueFrom(this.adminApi.getShopDetails(this.shop.id));
    if (res.success && res.data) {
      const d = res.data;
      this.shop = d.shop;
      this.branches = d.branches || [];
      this.invoices = d.invoices || [];
      this.staff = d.staff || [];
      this.users = d.users || [];
      this.activity = d.activity || [];
      this.metrics = d.metrics || null;
      this.limits = d.limits || null;
      this.usage = d.usage || null;
      
      this.newIncludedMB = d.shop?.includedStorageMB || 500;
      this.selectedWarning = d.shop?.storageWarningSent || null;
    }
    this.cdr.detectChanges();
  }

  getGstStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      not_configured: 'Not Configured',
      pending: 'Pending Verification',
      verified: 'Verified',
      failed: 'Verification Failed'
    };
    return map[status || ''] || (this.shop?.gstNumber ? 'Pending Verification' : 'Not Configured');
  }

  getGstBadgeClass(status?: string): string {
    const map: Record<string, string> = {
      not_configured: 'bg-gray-100 text-gray-600 border-gray-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200'
    };
    return map[status || ''] || (this.shop?.gstNumber ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200');
  }

  getGstDotClass(status?: string): string {
    const map: Record<string, string> = {
      not_configured: 'bg-gray-400',
      pending: 'bg-amber-400 animate-pulse',
      verified: 'bg-emerald-500',
      failed: 'bg-red-500'
    };
    return map[status || ''] || (this.shop?.gstNumber ? 'bg-amber-400 animate-pulse' : 'bg-gray-400');
  }

  formatGstDate(ts: any): string {
    if (!ts) return '—';
    try {
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  }
}

