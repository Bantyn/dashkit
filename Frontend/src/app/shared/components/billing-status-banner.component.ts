import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReadOnlyService } from '../../core/services/read-only.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-billing-status-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Read-Only Mode Banner (sticky, highest priority) -->
    <div
      *ngIf="isReadOnly"
      class="w-full mb-5 rounded-2xl overflow-hidden shadow-lg shadow-rose-100 border border-rose-200"
    >
      <!-- Gradient top stripe -->
      <div class="h-1 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400"></div>
      <div class="bg-gradient-to-br from-rose-50 to-pink-50 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <!-- Icon -->
          <div class="w-12 h-12 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-center justify-center shrink-0">
            <i class="bi bi-lock-fill text-xl text-rose-500"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-black text-[15px] text-rose-900 leading-tight">
                Your Subscription Has Expired
              </h4>
              <span class="bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-200">
                Read-Only Mode
              </span>
            </div>
            <p class="text-sm mt-1 text-rose-700 leading-relaxed">
              Your business data is safe. You can view everything but cannot create, edit or delete records until you renew.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
          <button
            (click)="navigateToBilling()"
            class="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-200 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
          >
            <i class="bi bi-credit-card-fill"></i>
            Pay Now
          </button>
          <button
            (click)="navigateToBilling()"
            class="px-4 py-2.5 rounded-xl font-semibold text-sm text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-all duration-200 whitespace-nowrap"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>

    <!-- Standard Billing Banners (when NOT in full read-only) -->
    <div
      *ngIf="!isReadOnly && bannerState"
      class="w-full mb-6 rounded-2xl border p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 shadow-sm"
      [ngClass]="bannerClasses[bannerState].wrapper"
    >
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0"
          [ngClass]="bannerClasses[bannerState].iconBg"
        >
          <i [ngClass]="bannerClasses[bannerState].icon"></i>
        </div>
        <div>
          <h4
            class="font-bold text-[16px] leading-tight"
            [ngClass]="bannerClasses[bannerState].textTitle"
          >
            {{ bannerClasses[bannerState].title }}
          </h4>
          <p class="text-sm mt-1 font-medium opacity-90" [ngClass]="bannerClasses[bannerState].textDesc">
            {{ message }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          (click)="navigateToBilling()"
          class="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm border shrink-0"
          [ngClass]="bannerClasses[bannerState].btnClass"
        >
          {{ bannerClasses[bannerState].btnText }}
        </button>
      </div>
    </div>
  `,
})
export class BillingStatusBannerComponent implements OnInit, OnDestroy {
  @Input() shop: any;

  bannerState: 'trial_ending' | 'payment_due' | 'grace_period' | null = null;
  message = '';
  daysRemaining = 0;
  isReadOnly = false;

  private readOnlyService = inject(ReadOnlyService);
  private authService = inject(AuthService);
  private sub?: Subscription;

  bannerClasses = {
    trial_ending: {
      wrapper: 'bg-amber-50 border-amber-200 text-amber-900',
      iconBg: 'bg-amber-100/80 text-amber-700',
      icon: 'bi bi-clock-history',
      title: 'Free Trial Ending Soon',
      textTitle: 'text-amber-900',
      textDesc: 'text-amber-800',
      btnClass: 'bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700 text-white',
      btnText: 'Choose Plan',
    },
    payment_due: {
      wrapper: 'bg-orange-50 border-orange-200 text-orange-900',
      iconBg: 'bg-orange-100/80 text-orange-700',
      icon: 'bi bi-credit-card',
      title: 'Subscription Renewal Due',
      textTitle: 'text-orange-900',
      textDesc: 'text-orange-800',
      btnClass: 'bg-orange-600 hover:bg-orange-700 border-orange-600 hover:border-orange-700 text-white',
      btnText: 'Renew Now',
    },
    grace_period: {
      wrapper: 'bg-orange-100/50 border-orange-300 text-orange-950',
      iconBg: 'bg-orange-200/60 text-orange-800',
      icon: 'bi bi-exclamation-triangle-fill',
      title: 'Payment Past Due (Grace Period Active)',
      textTitle: 'text-orange-950',
      textDesc: 'text-orange-900',
      btnClass: 'bg-orange-700 hover:bg-orange-800 border-orange-700 hover:border-orange-800 text-white',
      btnText: 'Complete Payment',
    },
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // Subscribe to reactive read-only state
    this.sub = this.readOnlyService.isReadOnly$.subscribe((isReadOnly) => {
      this.isReadOnly = isReadOnly;
      if (!isReadOnly) {
        this.checkBillingStatus();
      }
    });

    // Also run sync check on shop input for non-reactive fallback
    this.checkBillingStatus();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  checkBillingStatus() {
    if (!this.shop) return;

    const now = new Date();
    const paymentStatus = this.shop.paymentStatus;
    const plan = this.shop.subscriptionPlan;

    // Expired states are handled by isReadOnly$ — skip here
    if (paymentStatus === 'expired') return;

    if (paymentStatus === 'past_due') {
      this.bannerState = 'grace_period';
      const graceStart = this.formatDate(this.shop.gracePeriodStartedAt || this.shop.nextBillingDate || this.shop.updatedAt);
      const graceExpiry = new Date(graceStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      const remainingMs = graceExpiry.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

      if (remainingHours > 24) {
        this.message = `Payment is past due. Grace period ends in ${Math.ceil(remainingHours / 24)} days. Please pay to avoid suspension.`;
      } else {
        this.message = `Payment is past due. Grace period ends in ${remainingHours} hours! Renew now to prevent service block.`;
      }
      return;
    }

    if (paymentStatus === 'trial' && this.shop.trialExpiresAt) {
      const expiry = this.formatDate(this.shop.trialExpiresAt);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      if (diffDays <= 3) {
        this.bannerState = 'trial_ending';
        this.daysRemaining = diffDays;
        this.message = `Your free trial expires in ${diffDays} day${diffDays !== 1 ? 's' : ''} (${expiry.toLocaleDateString()}). Upgrade to keep using Clothify.`;
      }
      return;
    }

    if (paymentStatus === 'active' && this.shop.nextBillingDate && !this.shop.autoPayEnabled) {
      const nextBilling = this.formatDate(this.shop.nextBillingDate);
      const diffTime = nextBilling.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      if (diffDays <= 7) {
        this.bannerState = 'payment_due';
        this.daysRemaining = diffDays;
        this.message = `Your manual billing renewal of plan ${plan.toUpperCase()} is due in ${diffDays} day${diffDays !== 1 ? 's' : ''} (${nextBilling.toLocaleDateString()}).`;
      }
      return;
    }
  }

  formatDate(dateObj: any): Date {
    if (!dateObj) return new Date();
    if (dateObj instanceof Date) return dateObj;
    if (dateObj.toDate) return dateObj.toDate();
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000);
    return new Date(dateObj);
  }

  navigateToBilling() {
    const shopId = this.shop?.id || this.authService.getCurrentUser()?.shopId;
    if (shopId) {
      this.router.navigate([`/${shopId}/subscription`]);
    }
  }
}
