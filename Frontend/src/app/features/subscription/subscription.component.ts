import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { SubscriptionPlanService } from '../../core/services/subscription-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { map, switchMap, of, BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { UiCounterComponent } from '../../shared/components/ui-counter.component';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiCounterComponent],
  template: `
    <div class="h-full bg-gray-50 flex flex-col overflow-hidden">
      <!-- Sticky Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Subscription & Billing</h2>
        </div>
        
        <!-- Current Plan Badge in Header -->
        <div class="flex items-center gap-3">
          <span class="text-xs font-normal text-gray-500">Active Plan:</span>
          <div class="bg-primary-50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary-100">
            <span class="text-sm font-semibold text-primary-700">
              {{ (shop$ | async)?.subscriptionPlan || 'Free' | uppercase }}
            </span>
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
        <div class="w-full animate-fade-in-up">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 class="text-2xl font-semibold text-gray-900">Your Current Plan: {{ (shop$ | async)?.subscriptionPlan | uppercase }}</h2>
              <p class="text-gray-500 mt-2">Enjoying the features? You can upgrade anytime to unlock more limits.</p>
            </div>
          </div>

          <!-- Storage Usage Card -->
          @if ((shop$ | async); as shop) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 animate-fade-in">
              <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div class="flex-1 w-full">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">Image Storage Usage</h3>
                    @if (shop.storageLimitReached) {
                      <span class="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-full animate-pulse">Exceeded</span>
                    } @else if (getStoragePercentage(shop) >= 80) {
                      <span class="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full animate-pulse">Low Storage</span>
                    }
                  </div>
                  <p class="text-sm text-gray-500 mb-5">
                    Only final compressed AVIF images are counted. Original files or deleted image size are excluded from your billable quota.
                  </p>
                  
                  <!-- Progress bar -->
                  <div class="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden relative">
                    <div class="h-full rounded-full transition-all duration-500"
                         [style.width.%]="getStoragePercentage(shop)"
                         [class.bg-emerald-500]="getStoragePercentage(shop) < 80"
                         [class.bg-amber-500]="getStoragePercentage(shop) >= 80 && getStoragePercentage(shop) < 90"
                         [class.bg-rose-500]="getStoragePercentage(shop) >= 90">
                    </div>
                  </div>

                  <div class="flex justify-between items-center text-sm font-semibold">
                    <div class="text-gray-700 flex items-center gap-1.5">
                      <span class="text-gray-900 font-bold">{{ formatSize(shop.currentStorageBytes || 0) }}</span>
                      <span class="text-gray-400">/</span>
                      <span class="text-gray-500">{{ formatSize(getTotalAllowedMB(shop) * 1024 * 1024) }}</span>
                    </div>
                    <div class="text-gray-500">
                      {{ formatSize(getRemainingBytes(shop)) }} Remaining
                    </div>
                  </div>
                </div>

                <div class="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-6 lg:border-l border-gray-100 lg:pl-8 pt-6 lg:pt-0 shrink-0">
                  <div>
                    <div class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Plan Allocation</div>
                    <div class="text-sm font-semibold text-gray-900">{{ shop.humanReadableStorage || (shop.includedStorageMB || 500) + ' MB' }} Included</div>
                    @if (shop.storageAddonEnabled) {
                      <div class="text-xs text-emerald-600 font-medium mt-1">
                        +{{ shop.storageAddonPlan }} addon (₹{{ shop.storageAddonAmount }}/mo)
                      </div>
                    }
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <button (click)="openStorageDialog()"
                            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                      <i class="bi bi-hdd-fill"></i>
                      Manage Storage Add-on
                    </button>
                    
                    <button (click)="recalculateStorage(shop.id)"
                            [disabled]="recalcLoading"
                            class="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl transition-all"
                            title="Recalculate Storage">
                      <i class="bi bi-arrow-clockwise" [class.animate-spin]="recalcLoading"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Active Add-ons Section -->
          @if ((activeAddons$ | async)?.length) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
              <h3 class="text-xl font-semibold text-gray-900 mb-6">Active Add-ons</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (addon of (activeAddons$ | async); track addon.id) {
                  <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                           [class.bg-emerald-50]="addon.status === 'active'"
                           [class.text-emerald-600]="addon.status === 'active'"
                           [class.bg-amber-50]="addon.status !== 'active'"
                           [class.text-amber-600]="addon.status !== 'active'">
                        <i class="bi bi-plugin"></i>
                      </div>
                      <div>
                        <div class="font-bold text-gray-900">{{ addon.name }}</div>
                        <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>Key: {{ addon.itemKey }}</span>
                          &bull;
                          <span
                            class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                            [class.bg-emerald-100]="addon.status === 'active'"
                            [class.text-emerald-800]="addon.status === 'active'"
                            [class.bg-amber-100]="addon.status !== 'active'"
                            [class.text-amber-800]="addon.status !== 'active'"
                          >
                            {{ addon.status === 'active' ? 'Active' : 'Pending Payment' }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="text-right">
                        <div class="font-bold text-gray-900">₹{{ addon.price }}/mo</div>
                        <div class="text-[11px] font-medium"
                             [class.text-emerald-600]="addon.status === 'active'"
                             [class.text-amber-600]="addon.status !== 'active'">
                          {{ addon.status === 'active' ? 'Active Subscription' : 'Awaiting Payment' }}
                        </div>
                      </div>
                      @if (addon.status !== 'active' && addon.paymentLinkUrl) {
                        <a [href]="addon.paymentLinkUrl" target="_blank" class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors">
                          Pay Now
                        </a>
                      }
                      <button (click)="cancelAddon(addon.id)" class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove Add-on">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                }
              </div>
              
              <!-- Upcoming Invoice Summary -->
              @if (upcomingInvoice$ | async; as invoice) {
                <div class="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between">
                  <div>
                    <h4 class="font-semibold text-gray-900">Upcoming Invoice Estimate</h4>
                    <p class="text-sm text-gray-500">Base Plan (₹{{ invoice.baseAmount }}) + Add-ons (₹{{ invoice.addonsAmount }})</p>
                  </div>
                  <div class="text-right mt-4 md:mt-0">
                    <div class="text-sm text-gray-500 font-normal tracking-wide mb-1">Total Next Amount</div>
                    <div class="text-3xl font-semibold text-gray-900 flex items-baseline leading-none justify-end">
                      <span class="text-[30px] font-semibold leading-none mr-0.5">₹</span>
                      <app-ui-counter
                        [value]="invoice.totalAmount"
                        [fontSize]="30"
                        [fontWeight]="600"
                        textColor="#111827"
                        [gap]="1"
                        gradientFrom="transparent"
                        gradientTo="transparent"
                        [gradientHeight]="0"
                        class="leading-none"
                      ></app-ui-counter>
                      <span class="text-base font-normal text-gray-500 ml-1">/mo</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
          <!-- Billing Summary -->
          @if ((shop$ | async); as shop) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ shop.paymentStatus === 'expired' || shop.paymentStatus === 'past_due' ? 'Payment Due' : 'Next Billing Date' }}
                </h3>
                <p class="text-gray-500 text-sm mt-1">
                  @if (shop.autoPayEnabled) {
                    Your plan will auto-renew automatically on this date.
                  } @else {
                    Please renew manually on or before this date to prevent interruption.
                  }
                </p>
                
                @if (upcomingInvoice$ | async; as invoice) {
                  <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 inline-block min-w-[280px]">
                    <div class="flex justify-between mb-1">
                      <span>{{ (shop.selectedPlan || shop.subscriptionPlan) | titlecase }} Plan ({{ shop.billingCycle || 'monthly' | titlecase }}):</span>
                      <span class="font-medium text-gray-900">₹{{ invoice.baseAmount }}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                      <span>Active Add-ons:</span>
                      <span class="font-medium text-gray-900">₹{{ invoice.addonsAmount }}</span>
                    </div>
                    @if (invoice.gst && invoice.gst > 0) {
                      <div class="flex justify-between mb-2 text-xs text-gray-500">
                        <span>GST:</span>
                        <span class="font-medium text-gray-700">₹{{ invoice.gst }}</span>
                      </div>
                    }
                    <div class="flex justify-between pt-2 border-t border-gray-200">
                      <span class="font-medium text-gray-900">Total Renewal Amount:</span>
                      <span class="font-bold text-primary-600 text-base">₹{{ invoice.totalAmount }}</span>
                    </div>
                  </div>
                }

                <!-- Grace period alert -->
                @if (shop.paymentStatus === 'past_due') {
                  <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 font-semibold animate-pulse">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Grace Period Active: Action Required
                  </div>
                }
                @if (shop.paymentStatus === 'expired') {
                  <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs text-rose-800 font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Account Suspended
                  </div>
                }
                @if (hasQueuedPlan(shop)) {
                  <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-800 font-semibold">
                    <i class="bi bi-stack text-indigo-500"></i>
                    1 Upcoming Plan Queued
                  </div>
                }
              </div>
              <div class="flex items-center gap-6 self-stretch justify-between md:justify-end">
                <div class="text-right">
                  <div class="text-2xl font-bold text-gray-900 flex items-center justify-end gap-2">
                    {{ formatDate(getBillingDateToUse(shop)) | date:'mediumDate' }}
                    <span class="text-xs font-semibold px-2 py-1 rounded-md border"
                          [class.bg-emerald-50]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'good'"
                          [class.border-emerald-200]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'good'"
                          [class.text-emerald-700]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'good'"
                          [class.bg-amber-50]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'warning'"
                          [class.border-amber-200]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'warning'"
                          [class.text-amber-700]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'warning'"
                          [class.bg-rose-50]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'expired'"
                          [class.border-rose-200]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'expired'"
                          [class.text-rose-700]="getDaysRemainingClass(getBillingDateToUse(shop)) === 'expired'">
                      {{ getLiveRemainingTimeText(getBillingDateToUse(shop)) }}
                    </span>
                  </div>
                  <div class="text-sm font-semibold text-primary-600 mt-1 capitalize">
                    {{ isTrial(shop) ? 'Free Trial' : ((shop.subscriptionPlan || 'free') + ' Plan (' + (shop.billingCycle || 'monthly') + ')') }}
                  </div>
                </div>
                <!-- Manual Billing Pay Button -->
                @if (!shop.autoPayEnabled && shop.subscriptionPlan !== 'free') {
                  <button (click)="payManualBilling(shop)"
                          [disabled]="manualPayLoading"
                          class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0">
                    @if (manualPayLoading) {
                      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    } @else {
                      <i class="bi bi-credit-card-fill"></i>
                    }
                    {{ isTrial(shop) ? 'Start Billing' : (shop.paymentStatus === 'expired' ? 'Re-Activate Now' : (shop.paymentStatus === 'past_due' ? 'Pay Renewal Now' : 'Add 1 Month')) }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- AutoPay / eMandate Card -->
          @if ((shop$ | async); as shop) {
            <div class="bg-white rounded-2xl shadow-sm border mb-8 overflow-hidden"
                 [class.border-emerald-200]="shop.autoPayEnabled"
                 [class.border-gray-100]="!shop.autoPayEnabled">
              <div class="flex items-center gap-4 px-6 py-5 border-b"
                   [class.border-emerald-100]="shop.autoPayEnabled"
                   [class.border-gray-100]="!shop.autoPayEnabled"
                   [class.bg-emerald-50]="shop.autoPayEnabled"
                   [class.bg-gray-50]="!shop.autoPayEnabled">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                     [class.bg-emerald-100]="shop.autoPayEnabled"
                     [class.text-emerald-600]="shop.autoPayEnabled"
                     [class.bg-gray-100]="!shop.autoPayEnabled"
                     [class.text-gray-500]="!shop.autoPayEnabled">
                  <i class="bi bi-arrow-repeat"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-base font-semibold text-gray-900">AutoPay (UPI / eMandate)</h3>
                  <p class="text-sm text-gray-500">
                    @if (shop.autoPayEnabled && shop.autoPayStatus === 'active') {
                      <span class="text-emerald-600 font-semibold">✓ Active</span> — Your plan renews automatically each month.
                    } @else if (shop.autoPayStatus === 'pending_mandate') {
                      <span class="text-amber-600 font-semibold">⏳ Pending</span> — Complete the mandate registration to activate AutoPay.
                    } @else if (shop.autoPayStatus === 'halted') {
                      <span class="text-red-600 font-semibold">⚠ Halted</span> — Auto-debit failed. Please update your payment method.
                    } @else if (shop.autoPayStatus === 'paused') {
                      <span class="text-blue-600 font-semibold">⏸ Paused</span> — AutoPay is paused. Resume to continue auto-billing.
                    } @else if (shop.autoPayStatus === 'cancelling') {
                      <span class="text-orange-600 font-semibold">↩ Cancelling</span> — Will cancel at end of current cycle.
                    } @else {
                      Enable auto-renewal. Never worry about missed payments.
                    }
                  </p>
                </div>
                <!-- Status badge -->
                <span class="px-3 py-1 text-xs font-normal rounded-full"
                      [class.bg-emerald-100]="shop.autoPayEnabled"
                      [class.text-emerald-700]="shop.autoPayEnabled"
                      [class.bg-gray-100]="!shop.autoPayEnabled"
                      [class.text-gray-500]="!shop.autoPayEnabled">
                  {{ shop.autoPayEnabled ? 'ON' : 'OFF' }}
                </span>
              </div>

              <div class="px-6 py-5">
                <!-- Last charge info -->
                @if (shop.lastAutoChargeAt || shop.lastAutoChargeAmount) {
                  <div class="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl text-sm">
                    <i class="bi bi-check2-circle text-green-500 text-lg"></i>
                    <span class="text-gray-600">
                      Last auto-charge: <strong class="text-gray-900">₹{{ shop.lastAutoChargeAmount | number:'1.0-0' }}</strong>
                      @if (shop.lastAutoChargeAt) {
                        on {{ formatDate(shop.lastAutoChargeAt) | date:'mediumDate' }}
                      }
                    </span>
                  </div>
                }

                <!-- Action buttons -->
                <div class="flex flex-wrap gap-3">
                  @if (!shop.autoPayEnabled && shop.autoPayStatus !== 'pending_mandate') {
                    <!-- Enable AutoPay -->
                    <button
                      id="enable-autopay-btn"
                      (click)="enableAutoPay(shop)"
                      [disabled]="autoPayLoading"
                      class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
                      @if (autoPayLoading) {
                        <i class="bi bi-arrow-clockwise animate-spin"></i> Setting up...
                      } @else {
                        <i class="bi bi-arrow-repeat"></i> Enable AutoPay
                      }
                    </button>
                  }

                  @if (shop.autoPayStatus === 'pending_mandate' && (shop.autoPayUrl || lastAutoPayUrl)) {
                    <!-- Resume mandate registration -->
                    <a
                      [href]="shop.autoPayUrl || lastAutoPayUrl"
                      target="_blank"
                      class="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl shadow-sm transition-all text-sm">
                      <i class="bi bi-arrow-up-right-circle"></i> Complete Mandate
                    </a>
                  }

                  @if (shop.autoPayEnabled && shop.autoPayStatus === 'active') {
                    <!-- Pause -->
                    <button
                      id="pause-autopay-btn"
                      (click)="pauseAutoPay(shop)"
                      [disabled]="autoPayLoading"
                      class="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold rounded-xl transition-all text-sm">
                      <i class="bi bi-pause-circle"></i> Pause
                    </button>
                  }

                  @if (shop.autoPayStatus === 'paused') {
                    <!-- Resume -->
                    <button
                      id="resume-autopay-btn"
                      (click)="resumeAutoPay(shop)"
                      [disabled]="autoPayLoading"
                      class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm">
                      <i class="bi bi-play-circle"></i> Resume
                    </button>
                  }

                  @if (shop.razorpaySubscriptionId && shop.autoPayStatus !== 'cancelled' && shop.autoPayStatus !== 'cancelling') {
                    <!-- Cancel -->
                    <button
                      id="cancel-autopay-btn"
                      (click)="cancelAutoPay(shop)"
                      [disabled]="autoPayLoading"
                      class="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-semibold rounded-xl transition-all text-sm">
                      <i class="bi bi-x-circle"></i> Cancel AutoPay
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          @if ((shop$ | async)?.subscriptionPlan === 'custom' && (shop$ | async)?.customFeatures?.length) {
            <!-- Custom Features -->
            <div class="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 mb-8 relative overflow-hidden">
              <div class="absolute top-0 right-0 p-6 text-emerald-50 opacity-50 transform translate-x-4 -translate-y-4">
                <i class="bi bi-star-fill text-8xl"></i>
              </div>
              <div class="relative z-10">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-semibold text-gray-900">Your Tailored Plan Features</h3>
                  <div class="text-right">
                    <div class="text-xs text-emerald-600 font-semibold uppercase tracking-widest mb-1">Total Plan Value</div>
                    <div class="text-3xl font-black text-gray-900">₹{{ (shop$ | async)?.customPrice || 0 }}<span class="text-base font-medium text-gray-500">/month</span></div>
                  </div>
                </div>
                
                <div class="mt-8 border-t border-gray-100 pt-6">
                  <p class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Included Modules</p>
                  <div class="flex flex-wrap gap-3">
                    @for (f of (shop$ | async)?.customFeatures; track f) {
                      <span class="px-3 py-2 bg-white text-gray-700 border shadow-sm border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all rounded-xl text-sm font-medium flex items-center gap-2">
                        <i class="bi bi-check-circle-fill text-emerald-500"></i>
                        {{ customFeatureMap[f]?.name || f }}
                        @if (customFeatureMap[f]?.price) {
                          <span class="text-gray-400 font-semibold ml-1 bg-gray-50 px-1.5 rounded text-xs">₹{{ customFeatureMap[f]?.price }}</span>
                        }
                      </span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
          <!-- Transactions Table -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-5 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">Billing Transactions</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-4">Transaction ID</th>
                    <th scope="col" class="px-6 py-4">Date</th>
                    <th scope="col" class="px-6 py-4">Plan / Item</th>
                    <th scope="col" class="px-6 py-4">Amount</th>
                    <th scope="col" class="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of (billingTransactions$ | async); track tx.id) {
                  <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {{ tx.id }}
                    </td>
                    <td class="px-6 py-4">
                      {{ tx.date | date:'mediumDate' }}
                    </td>
                    <td class="px-6 py-4">
                      {{ tx.type === 'subscription' ? (tx.planCode | uppercase) : (tx.featureCode || tx.type | uppercase) }}
                    </td>
                    <td class="px-6 py-4 font-medium">
                      ₹{{ tx.amount }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="px-2.5 py-1 text-xs font-semibold rounded-full"
                        [class.bg-green-100]="tx.status === 'success'"
                        [class.text-green-800]="tx.status === 'success'"
                        [class.bg-yellow-100]="tx.status === 'pending'"
                        [class.text-yellow-800]="tx.status === 'pending'"
                        [class.bg-red-100]="tx.status === 'failed'"
                        [class.text-red-800]="tx.status === 'failed'"
                      >
                        {{ tx.status | uppercase }}
                      </span>
                      @if (tx.invoiceUrl) {
                        <a [href]="tx.invoiceUrl" target="_blank" class="ml-3 text-blue-600 hover:text-blue-800" title="View Invoice">
                          <i class="bi bi-file-earmark-pdf-fill text-lg"></i>
                        </a>
                      }
                    </td>
                  </tr>
                  }
                  @if ((billingTransactions$ | async)?.length === 0 || !(billingTransactions$ | async)) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          <!-- Wallet Transactions Table -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Wallet Transactions</h3>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">Credits for SMS & WhatsApp</span>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-4">Date</th>
                    <th scope="col" class="px-6 py-4">Description</th>
                    <th scope="col" class="px-6 py-4">Type</th>
                    <th scope="col" class="px-6 py-4">Amount</th>
                    <th scope="col" class="px-6 py-4">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of (walletTransactions$ | async); track tx.id) {
                  <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4">
                      {{ (tx.createdAt?._seconds ? tx.createdAt._seconds * 1000 : tx.createdAt) | date:'mediumDate' }}
                    </td>
                    <td class="px-6 py-4 text-gray-900 font-medium">
                      {{ tx.description }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="px-2 py-1 text-xs font-semibold rounded-md uppercase"
                        [class.bg-blue-50]="tx.type === 'sms'"
                        [class.text-blue-700]="tx.type === 'sms'"
                        [class.bg-green-50]="tx.type === 'whatsapp'"
                        [class.text-green-700]="tx.type === 'whatsapp'"
                      >
                        {{ tx.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-bold"
                        [class.text-green-600]="tx.amount > 0"
                        [class.text-red-600]="tx.amount < 0">
                      {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
                    </td>
                    <td class="px-6 py-4 text-xs font-mono text-gray-400">
                      {{ tx.referenceId || '-' }}
                    </td>
                  </tr>
                  }
                  @if ((walletTransactions$ | async)?.length === 0 || !(walletTransactions$ | async)) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      No wallet transactions found.
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage Addon Dialog -->
    @if (showStorageDialog) {
      <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-scale-in">
          <button (click)="closeStorageDialog()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <i class="bi bi-x-lg text-lg"></i>
          </button>
          
          <h3 class="text-xl font-bold text-gray-900 mb-2">Manage Storage Add-on</h3>
          <p class="text-sm text-gray-500 mb-6">
            Expand your storage quota to upload more catalog images. Charges are added directly to your monthly bill.
          </p>

          <!-- Plan Tiers -->
          <div class="space-y-3 mb-6">
            @for (tier of storagePricing?.addons; track tier.sizeGB) {
              <div (click)="selectedAddonSize = tier.sizeGB"
                   class="p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center"
                   [class.border-primary-500]="selectedAddonSize === tier.sizeGB"
                   [class.bg-primary-50/30]="selectedAddonSize === tier.sizeGB"
                   [class.border-gray-100]="selectedAddonSize !== tier.sizeGB"
                   [class.hover:border-gray-200]="selectedAddonSize !== tier.sizeGB">
                <div>
                  <div class="font-semibold text-gray-900">{{ tier.displayName }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">Recurring subscription addon</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-gray-900 text-lg">₹{{ tier.price }}</div>
                  <div class="text-xs text-gray-400">/month</div>
                </div>
              </div>
            }
          </div>

          <!-- Billing Summary inside modal -->
          @if (getSelectedTier(); as selectedTier) {
            <div class="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
              <div class="flex justify-between mb-2">
                <span class="text-gray-500">Storage Size:</span>
                <span class="font-semibold text-gray-900">+{{ selectedTier.sizeGB }} GB</span>
              </div>
              <div class="flex justify-between mb-2">
                <span class="text-gray-500">Price:</span>
                <span class="font-semibold text-gray-900">₹{{ selectedTier.price }} / month</span>
              </div>
              <div class="flex justify-between border-t border-gray-200 pt-2 mt-2 font-semibold">
                <span class="text-gray-700">Total Charged:</span>
                <span class="text-primary-600">₹{{ selectedTier.price }} / month</span>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="flex gap-3">
            <button (click)="closeStorageDialog()"
                    class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm">
              Cancel
            </button>
            <button (click)="buyStorageAddon()"
                    [disabled]="purchaseLoading"
                    class="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2">
              @if (purchaseLoading) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              } @else {
                <i class="bi bi-credit-card-fill"></i>
              }
              Purchase Add-on
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .scroll-mt-8 {
        scroll-margin-top: 2rem;
      }
    `,
  ],
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private shopService = inject(ShopService);
  private subscriptionPlanService = inject(SubscriptionPlanService);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private paymentService = inject(PaymentService);
  private confirmationService = inject(ConfirmationService);

  private route = inject(ActivatedRoute);

  autoPayLoading = false;
  lastAutoPayUrl: string | null = null;
  currentTime = Date.now();
  private timerInterval: any;

  private refreshTrigger = new BehaviorSubject<void>(undefined);
  nextBillingDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 1));
  
  customFeatureMap: Record<string, { name: string, price: number }> = {
    'inv_product_listing': { name: 'Product Listing', price: 49 },
    'inv_categories': { name: 'Categories', price: 19 },
    'inv_brands': { name: 'Brands Management', price: 19 },
    'inv_variants': { name: 'Product Variants', price: 29 },
    'inv_barcode': { name: 'Barcode Support', price: 39 },
    'inv_stock_tracking': { name: 'Stock Tracking', price: 79 },
    'inv_low_stock_alerts': { name: 'Low Stock Alerts', price: 29 },
    'inv_purchase_orders': { name: 'Purchase Orders', price: 49 },
    'inv_suppliers': { name: 'Suppliers', price: 29 },
    'inv_bulk_import': { name: 'Bulk Product Import', price: 49 },
    'inv_reports': { name: 'Inventory Reports', price: 59 },
    'inv_opening_stock': { name: 'Opening Stock', price: 19 },
    'inv_color_inventory': { name: 'Color-wise Inventory', price: 39 },
    'seasonal_collections': { name: 'Seasonal Collections', price: 39 },
    'inv_stock_transfer': { name: 'Stock Transfer', price: 79 },
    
    'sell_pos_billing': { name: 'POS Billing', price: 79 },
    'sell_invoices': { name: 'Invoices', price: 39 },
    'sell_credit_notes': { name: 'Credit Notes', price: 29 },
    'sell_drafts': { name: 'Draft Orders', price: 29 },
    'sell_returns': { name: 'Sales Returns', price: 39 },
    'sell_daily_closing': { name: 'Daily Closing', price: 29 },
    'sell_offers_discounts': { name: 'Offers & Discounts', price: 49 },
    'wholesale_system': { name: 'Wholesale System', price: 149 },
    'sell_checkout': { name: 'Online Checkout', price: 99 },
    'sell_online_payments': { name: 'Online Payments', price: 99 },
    'sell_cod': { name: 'Cash on Delivery', price: 19 },
    
    'web_storefront': { name: 'Storefront Website', price: 149 },
    'web_settings': { name: 'Website Settings', price: 29 },
    'web_theme': { name: 'Theme Customization', price: 49 },
    'web_pages': { name: 'Custom Pages', price: 39 },
    'web_seo': { name: 'SEO Tools', price: 49 },
    'web_domain': { name: 'Custom Domain', price: 29 },
    
    'cust_list': { name: 'Customer List', price: 29 },
    'cust_history': { name: 'Purchase History', price: 29 },
    'cust_credits': { name: 'Customer Credits', price: 39 },
    'cust_reviews': { name: 'Customer Reviews', price: 29 },
    'cust_online_customers': { name: 'Online Customers', price: 49 },
    
    'staff_management': { name: 'Staff Management', price: 49 },
    'staff_add': { name: 'Add Staff Module', price: 19 },
    'staff_role_permissions': { name: 'Role Permissions', price: 59 },
    'staff_commission': { name: 'Staff Commission', price: 39 },
    'staff_logs': { name: 'Staff Logs', price: 29 },
    'staff_performance': { name: 'Staff Performance', price: 49 },
    'tailor_job_cards': { name: 'Tailor Job Cards', price: 149 },
    
    'fin_transactions': { name: 'Transactions', price: 29 },
    'fin_expenses': { name: 'Expense Tracking', price: 39 },
    'fin_payments': { name: 'Payment Management', price: 49 },
    'fin_tax_report': { name: 'Tax Report', price: 59 },
    'fin_pnl_report': { name: 'P&L Report', price: 99 },
    
    'acc_cash_book': { name: 'Cash Book', price: 49 },
    'acc_bank_book': { name: 'Bank Book', price: 49 },
    'acc_receivables': { name: 'Accounts Receivable', price: 79 },
    'acc_payables': { name: 'Accounts Payable', price: 79 },
    'acc_ledger': { name: 'General Ledger', price: 99 },
    
    'mktg_loyalty': { name: 'Loyalty Program', price: 99 },
    'crm_birthday_wishes': { name: 'Birthday Wishes', price: 39 },
    'crm_customer_segmentation': { name: 'Customer Segmentation', price: 79 },
    'crm_vip_leaderboard': { name: 'VIP Leaderboard', price: 49 },
    
    'analytics_dashboard': { name: 'Analytics Dashboard', price: 49 },
    'analytics_sales': { name: 'Sales Analytics', price: 79 },
    'analytics_products': { name: 'Product Analytics', price: 79 },
    'analytics_customers': { name: 'Customer Analytics', price: 79 },
    'analytics_branches': { name: 'Branch Analytics', price: 99 },
    
    'mktg_promotions': { name: 'Promotions', price: 39 },
    'mktg_festival_offers': { name: 'Festival Offers', price: 29 },
    'mktg_sms': { name: 'SMS Campaigns', price: 149 },
    'mktg_whatsapp': { name: 'WhatsApp Campaigns', price: 199 },
    'mktg_templates': { name: 'Message Templates', price: 29 },
    
    'intg_api_access': { name: 'API Access', price: 299 },
    'intg_invoice_template': { name: 'Invoice Templates', price: 39 },
    
    'ship_setup': { name: 'Shipping Setup', price: 39 },
    'ship_shiprocket': { name: 'Shiprocket Integration', price: 99 },
    
    'ent_multi_branch': { name: 'Multi Branch', price: 500 },
    'ent_audit_logs': { name: 'Audit Logs', price: 149 }
  };

  shopId$ = this.refreshTrigger.pipe(
    switchMap(() => {
      const parentParams = this.route.parent ? this.route.parent.snapshot.paramMap.get('shopId') : null;
      if (parentParams) {
        return of(parentParams);
      }
      return this.authService.currentUser$.pipe(
        map(user => user?.shopId || null)
      );
    })
  );

  shop$ = this.shopId$.pipe(
    switchMap((shopId) => {
      if (shopId) {
        return this.shopService.getShop(shopId).pipe(map((res) => res.data));
      }
      return of(null);
    })
  );
  billingTransactions$: Observable<any[]> = this.shop$.pipe(
    switchMap((shop) => {
      if (shop?.id) {
        return this.paymentService.getShopBillingTransactions(shop.id).pipe(map((res) => res.data));
      }
      return of([]);
    })
  );

  walletTransactions$: Observable<any[]> = this.shop$.pipe(
    switchMap((shop) => {
      if (shop?.id) {
        return this.http.get<any>(`${environment.apiUrl}/wallet/shop/${shop.id}/transactions`).pipe(
          map(res => res.data)
        );
      }
      return of([]);
    })
  );

  activeAddons$ = this.shop$.pipe(
    switchMap((shop) => {
      if (shop?.id) {
        return this.paymentService.getActiveAddons(shop.id).pipe(map((res) => res.data));
      }
      return of([]);
    })
  );

  upcomingInvoice$ = this.shop$.pipe(
    switchMap((shop) => {
      if (shop?.id) {
        return this.paymentService.getUpcomingInvoice(shop.id).pipe(
          map((res) => {
            const data = res.data;
            if (!data) return null;
            const addonsTotal = data.addons?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
            return {
              baseAmount: data.basePlan?.price || 0,
              addonsAmount: addonsTotal,
              gst: data.gst || 0,
              totalAmount: data.total || 0,
              nextBillingDate: data.nextBillingDate
            };
          })
        );
      }
      return of(null);
    })
  );

  ngOnInit() {
    this.timerInterval = setInterval(() => {
      this.currentTime = Date.now();
    }, 1000);
    this.refreshTrigger.next();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // ─── AutoPay Actions ────────────────────────────────────────────────────────

  async enableAutoPay(shop: any) {
    if (!shop?.id) return;
    const planCode = shop.subscriptionPlan || 'free';
    if (planCode === 'free' || planCode === 'trial') {
      this.toastService.showError('Please select a paid plan first to enable AutoPay.');
      return;
    }
    this.autoPayLoading = true;
    try {
      const billingCycle: 'monthly' | 'yearly' = shop.billingCycle || 'monthly';

      const res = await firstValueFrom(
        this.paymentService.createAutoPaySubscription(shop.id, planCode, billingCycle)
      );

      if (res?.data?.paymentUrl) {
        this.lastAutoPayUrl = res.data.paymentUrl;
        this.toastService.showSuccess('Subscription created! Redirecting to mandate registration...');
        // Open Razorpay mandate page in a new tab
        window.open(res.data.paymentUrl, '_blank');
        // Refresh shop data after a short delay so updated status is shown
        setTimeout(() => this.refreshTrigger.next(), 3000);
      }
    } catch (err: any) {
      this.toastService.showError(err?.error?.message || err?.message || 'Failed to setup AutoPay. Please try again.');
    } finally {
      this.autoPayLoading = false;
    }
  }

  async cancelAutoPay(shop: any) {
    if (!shop?.id) return;
    const confirmed = await this.confirmationService.confirm({
      title: 'Cancel AutoPay?',
      description: 'Are you sure you want to cancel AutoPay? Your subscription will remain active until the end of this billing cycle.',
      type: 'warning',
      primaryButtonText: 'Cancel AutoPay',
      secondaryButtonText: 'Keep AutoPay'
    });
    if (!confirmed) return;

    this.autoPayLoading = true;
    try {
      await firstValueFrom(this.paymentService.cancelAutoPaySubscription(shop.id, true));
      this.toastService.showSuccess('AutoPay cancelled. It will stop at end of current billing cycle.');
      this.refreshTrigger.next();
    } catch (err: any) {
      this.toastService.showError(err?.error?.message || err?.message || 'Failed to cancel AutoPay.');
    } finally {
      this.autoPayLoading = false;
    }
  }

  async pauseAutoPay(shop: any) {
    if (!shop?.id) return;
    this.autoPayLoading = true;
    try {
      await firstValueFrom(this.paymentService.pauseAutoPaySubscription(shop.id));
      this.toastService.showSuccess('AutoPay paused successfully.');
      this.refreshTrigger.next();
    } catch (err: any) {
      this.toastService.showError(err?.error?.message || err?.message || 'Failed to pause AutoPay.');
    } finally {
      this.autoPayLoading = false;
    }
  }

  async resumeAutoPay(shop: any) {
    if (!shop?.id) return;
    this.autoPayLoading = true;
    try {
      await firstValueFrom(this.paymentService.resumeAutoPaySubscription(shop.id));
      this.toastService.showSuccess('AutoPay resumed successfully.');
      this.refreshTrigger.next();
    } catch (err: any) {
      this.toastService.showError(err?.error?.message || err?.message || 'Failed to resume AutoPay.');
    } finally {
      this.autoPayLoading = false;
    }
  }

  formatDate(dateObj: any): Date | null {
    if (!dateObj) return null;
    if (dateObj instanceof Date) return dateObj;
    if (dateObj.toDate) return dateObj.toDate();
    if (dateObj._seconds) return new Date(dateObj._seconds * 1000);
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000);
    if (typeof dateObj === 'string' || typeof dateObj === 'number') return new Date(dateObj);
    return null;
  }

  manualPayLoading = false;

  async payManualBilling(shop: any) {
    if (!shop?.id) return;
    this.manualPayLoading = true;
    try {
      const token = await this.authService.getIdToken();
      const planCode = shop.subscriptionPlan || 'plus';
      const billingCycle = shop.billingCycle || 'monthly';

      this.http.post<any>(`${environment.apiUrl}/payment/create-order`, {
        shopId: shop.id,
        planCode,
        billingCycle
      }, {
        headers: { Authorization: `Bearer \${token}` }
      }).subscribe({
        next: (orderRes) => {
          if (!orderRes.success) {
            this.toastService.showError('Failed to create payment order.');
            this.manualPayLoading = false;
            return;
          }

          const options = {
            key: orderRes.data.key_id,
            amount: orderRes.data.amount,
            currency: orderRes.data.currency,
            name: "Clothify",
            description: `Manual Renewal - \${planCode.toUpperCase()}`,
            order_id: orderRes.data.order_id,
            handler: (response: any) => {
              this.verifyManualPayment(response, shop.id, planCode, billingCycle, token);
            },
            prefill: {
              name: shop.shopName,
              email: shop.email,
              contact: shop.phone
            },
            theme: {
              color: "#3b82f6"
            },
            modal: {
               ondismiss: () => {
                 this.toastService.showWarning('Payment cancelled.');
                 this.manualPayLoading = false;
               }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        },
        error: (err) => {
          this.toastService.showError(err.error?.message || 'Failed to initialize payment gateway.');
          this.manualPayLoading = false;
        }
      });
    } catch (e) {
      this.toastService.showError('Failed to authenticate payment.');
      this.manualPayLoading = false;
    }
  }

  private verifyManualPayment(response: any, shopId: string, planCode: string, billingCycle: string, token: any) {
    this.http.post<any>(`${environment.apiUrl}/payment/verify-payment`, {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
      shopId,
      planCode,
      billingCycle
    }, {
      headers: { Authorization: `Bearer \${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('Subscription renewed successfully!');
          this.refreshTrigger.next();
        } else {
          this.toastService.showError('Payment verification failed.');
        }
        this.manualPayLoading = false;
      },
      error: (err) => {
         this.toastService.showError('Payment verification failed.');
         this.manualPayLoading = false;
      }
    });
  }

  async cancelAddon(addonId: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Remove Add-on?',
      description: 'Are you sure you want to remove this add-on?',
      type: 'warning',
      primaryButtonText: 'Remove',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;
    
    try {
      const shop = await firstValueFrom(this.shop$);
      if (!shop?.id) return;
      
      await firstValueFrom(this.paymentService.cancelAddon(shop.id, addonId));
      this.toastService.showSuccess('Add-on removed successfully');
      this.refreshTrigger.next(); // Refresh lists
    } catch (error: any) {
      this.toastService.showError(error.error?.message || 'Failed to remove add-on');
    }
  }

  // Storage properties
  showStorageDialog = false;
  selectedAddonSize = 1;
  storagePricing: any = {
    addons: [
      { sizeGB: 1, price: 49, displayName: "+1 GB Extra" },
      { sizeGB: 2, price: 99, displayName: "+2 GB Extra" },
      { sizeGB: 5, price: 199, displayName: "+5 GB Extra" }
    ]
  };
  purchaseLoading = false;
  recalcLoading = false;

  getStoragePercentage(shop: any): number {
    const included = shop.includedStorageMB ?? 500;
    let addon = 0;
    if (shop.storageAddonEnabled && shop.storageAddonPlan) {
      const planStr = String(shop.storageAddonPlan);
      if (planStr.includes("1 GB") || planStr.includes("1GB")) addon = 1024;
      else if (planStr.includes("2 GB") || planStr.includes("2GB")) addon = 2048;
      else if (planStr.includes("5 GB") || planStr.includes("5GB")) addon = 5120;
    }
    const total = (included + addon) * 1024 * 1024;
    const current = shop.currentStorageBytes ?? 0;
    return total > 0 ? Number(((current / total) * 100).toFixed(2)) : 0;
  }

  getTotalAllowedMB(shop: any): number {
    const included = shop.includedStorageMB ?? 500;
    let addon = 0;
    if (shop.storageAddonEnabled && shop.storageAddonPlan) {
      const planStr = String(shop.storageAddonPlan);
      if (planStr.includes("1 GB") || planStr.includes("1GB")) addon = 1024;
      else if (planStr.includes("2 GB") || planStr.includes("2GB")) addon = 2048;
      else if (planStr.includes("5 GB") || planStr.includes("5GB")) addon = 5120;
    }
    return included + addon;
  }

  getRemainingBytes(shop: any): number {
    const total = this.getTotalAllowedMB(shop) * 1024 * 1024;
    const current = shop.currentStorageBytes ?? 0;
    return Math.max(0, total - current);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  getSelectedTier() {
    return this.storagePricing?.addons?.find((a: any) => a.sizeGB === this.selectedAddonSize) || null;
  }

  openStorageDialog() {
    this.showStorageDialog = true;
    const shopId = this.route.parent ? this.route.parent.snapshot.paramMap.get("shopId") : null;
    if (shopId) {
      this.http.get<any>(`${environment.apiUrl}/shops/${shopId}/storage/pricing`).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.storagePricing = res.data;
          }
        }
      });
    }
  }

  closeStorageDialog() {
    this.showStorageDialog = false;
  }

  async recalculateStorage(shopId: string) {
    this.recalcLoading = true;
    try {
      const token = await this.authService.getIdToken();
      this.http.post<any>(`${environment.apiUrl}/shops/${shopId}/storage/recalculate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (res) => {
          this.recalcLoading = false;
          if (res.success) {
            this.toastService.showSuccess("Storage usage recalculated successfully.");
            this.refreshTrigger.next();
          } else {
            this.toastService.showError("Failed to recalculate storage.");
          }
        },
        error: (err) => {
          this.recalcLoading = false;
          this.toastService.showError(err.error?.message || "Failed to recalculate storage.");
        }
      });
    } catch (e) {
      this.recalcLoading = false;
      this.toastService.showError("Auth token error");
    }
  }

  async buyStorageAddon() {
    const shop = await firstValueFrom(this.shop$);
    if (!shop?.id) return;

    const tier = this.getSelectedTier();
    if (!tier) return;

    this.purchaseLoading = true;
    try {
      const token = await this.authService.getIdToken();
      this.http.post<any>(`${environment.apiUrl}/shops/${shop.id}/storage/addon`, {
        addonSizeGB: tier.sizeGB,
        price: tier.price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (res) => {
          this.purchaseLoading = false;
          if (res.success && res.data?.paymentUrl) {
            this.toastService.showSuccess("Checkout generated! Redirecting to payment...");
            window.open(res.data.paymentUrl, "_blank");
            this.closeStorageDialog();
            // Refresh details
            setTimeout(() => this.refreshTrigger.next(), 3000);
          } else {
            this.toastService.showError("Failed to create purchase session.");
          }
        },
        error: (err) => {
          this.purchaseLoading = false;
          this.toastService.showError(err.error?.message || "Failed to complete purchase.");
        }
      });
    } catch (e) {
      this.purchaseLoading = false;
      this.toastService.showError("Authentication error");
    }
  }
  isTrial(shop: any): boolean {
    if (!shop) return false;
    const plan = String(shop.subscriptionPlan || '').toLowerCase();
    const status = String(shop.subscriptionStatus || '').toLowerCase();
    const payment = String(shop.paymentStatus || '').toLowerCase();
    return plan === 'trial' || status === 'trial' || payment === 'trial';
  }

  getBillingDateToUse(shop: any): any {
    if (!shop) return this.nextBillingDate;
    if (this.isTrial(shop)) {
      return shop.trialExpiresAt || shop.nextBillingDate || this.nextBillingDate;
    }
    return shop.nextBillingDate || this.nextBillingDate;
  }

  getDaysRemaining(dateString: any): number {
    const expiry = this.formatDate(dateString);
    if (!expiry || isNaN(expiry.getTime())) return 0;
    const now = new Date();
    expiry.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysRemainingClass(dateString: any): string {
    const expiry = this.formatDate(dateString);
    if (!expiry || isNaN(expiry.getTime())) return 'good';
    const days = this.getDaysRemaining(expiry);
    if (days < 0) return 'expired';
    if (days <= 5) return 'warning';
    return 'good';
  }

  getLiveRemainingTimeText(dateString: any): string {
    const expiry = this.formatDate(dateString);
    if (!expiry || isNaN(expiry.getTime())) return '';
    const diffTime = expiry.getTime() - this.currentTime;
    
    if (diffTime <= 0) {
      const days = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
      return days === 0 ? 'Expired today' : `Expired ${days}d ago`;
    }

    const totalSeconds = Math.floor(diffTime / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let text = '';
    if (days > 0) text += `${days}d `;
    text += `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s left`;
    
    return text;
  }

  hasQueuedPlan(shop: any): boolean {
    if (!shop || (!shop.nextBillingDate && !this.nextBillingDate)) return false;
    const dateToUse = shop.nextBillingDate || this.nextBillingDate;
    const days = this.getDaysRemaining(dateToUse);
    const cycle = shop.billingCycle || 'monthly';
    
    if (cycle === 'yearly' && days > 366) return true;
    if (cycle === 'monthly' && days > 32) return true;
    return false;
  }

}
