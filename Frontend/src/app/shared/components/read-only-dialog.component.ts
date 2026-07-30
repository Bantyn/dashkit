import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReadOnlyService } from '../../core/services/read-only.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * ReadOnlyDialogComponent
 *
 * A premium upgrade dialog shown when the user attempts a write operation
 * while in Read-Only Mode. Can be triggered:
 *   1. Imperatively via ReadOnlyService.showUpgradeDialog$
 *   2. Via [visible] input binding
 *
 * Usage:
 *   <app-read-only-dialog></app-read-only-dialog>
 *
 * Place once in the app shell (layout or dashboard), it auto-subscribes to
 * ReadOnlyService.showUpgradeDialog$ and shows/hides itself.
 */
@Component({
  selector: 'app-read-only-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      class="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6"
      (click)="onBackdropClick($event)"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
        [class.opacity-100]="isVisible"
      ></div>

      <!-- Dialog Card -->
      <div
        class="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300"
        [class.scale-100]="isVisible"
        [class.opacity-100]="isVisible"
      >
        <!-- Top Brand Accent Bar -->
        <div class="h-1.5 w-full bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-500"></div>

        <!-- Close Cross Button -->
        <button
          type="button"
          (click)="close()"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer border-0 z-20"
          aria-label="Close"
        >
          <i class="bi bi-x-lg text-xs font-bold"></i>
        </button>

        <div class="p-6 sm:p-8 flex flex-col items-center">
          <!-- Icon Badge -->
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-5 shadow-sm">
            <i class="bi bi-shield-lock-fill text-2xl"></i>
          </div>

          <!-- Title & Subtitle -->
          <h2 class="text-2xl font-bold text-slate-900 text-center tracking-tight mb-1">
            Subscription Required
          </h2>
          <p class="text-xs text-slate-500 text-center font-medium mb-6">
            Your plan has expired. Reactivate to restore full write access.
          </p>

          <!-- Data Safety Banner -->
          <div class="w-full p-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl flex items-start gap-3.5 mb-6 shadow-sm">
            <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <i class="bi bi-shield-check-fill text-base"></i>
            </div>
            <div class="flex-1">
              <p class="text-xs font-bold text-emerald-950 mb-0.5">Your data is 100% safe & preserved</p>
              <p class="text-[11px] text-emerald-800/90 leading-relaxed">
                All your invoices, products, customers, and inventory remain untouched and fully accessible in read-only mode.
              </p>
            </div>
          </div>

          <!-- Read-Only Explanation -->
          <div class="w-full bg-slate-50/80 border border-slate-100 rounded-2xl p-4 mb-6">
            <p class="text-xs text-slate-600 leading-relaxed mb-3">
              You are currently in <span class="font-bold text-slate-900">Read-Only Mode</span>. Creating, editing, or modifying records requires an active subscription plan.
            </p>

            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Restricted Actions
            </p>
            
            <!-- Restricted Items Grid -->
            <div class="grid grid-cols-2 gap-2">
              <div *ngFor="let item of blockedItems" class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/60 text-xs font-medium text-slate-700 shadow-2xs">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span class="truncate">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="w-full flex flex-col gap-2.5">
            <button
              type="button"
              (click)="navigateToSubscription('pay')"
              class="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.99] transition-all duration-200 shadow-md shadow-primary-600/20 flex items-center justify-center gap-2 border-0 cursor-pointer"
            >
              <i class="bi bi-credit-card-fill text-base"></i>
              Pay Now & Restore Access
            </button>

            <button
              type="button"
              (click)="navigateToSubscription('plans')"
              class="w-full py-3 px-6 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200/70 transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
            >
              <i class="bi bi-grid-fill text-slate-400 text-xs"></i>
              View Subscription Plans
            </button>

            <button
              type="button"
              (click)="close()"
              class="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer mt-1"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReadOnlyDialogComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  isVisible = false;

  blockedItems = [
    'Create Invoice',
    'Add Product',
    'Edit Customer',
    'Update Inventory',
    'New Purchase',
    'Add Staff',
    'Import Data',
    'Change Settings',
  ];

  private sub?: Subscription;

  constructor(
    private readOnlyService: ReadOnlyService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isVisible = this.visible;

    // Auto-show when a blocked write is attempted anywhere in the app
    this.sub = this.readOnlyService.showUpgradeDialog$.subscribe(() => {
      // Don't show the modal if the user is already on the subscription page
      // so they aren't blocked from actually paying!
      if (!this.router.url.includes('/subscription')) {
        this.isVisible = true;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  close() {
    this.isVisible = false;
    this.visibleChange.emit(false);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as Element).classList.contains('fixed')) {
      this.close();
    }
  }

  navigateToSubscription(action: 'pay' | 'plans') {
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (shopId) {
      this.router.navigate(['/', shopId, 'subscription'], {
        queryParams: action === 'pay' ? { action: 'pay' } : {},
      });
    }
    this.close();
  }
}
