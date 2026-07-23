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
      class="fixed inset-0 z-[500] flex items-center justify-center p-4"
      (click)="onBackdropClick($event)"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300"
        [class.opacity-100]="isVisible"
      ></div>

      <!-- Dialog Card -->
      <div
        class="relative z-10 w-full max-w-md transform transition-all duration-300"
        [class.scale-100]="isVisible"
        [class.opacity-100]="isVisible"
      >
        <!-- Gradient top bar -->
        <div class="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500"></div>

        <div class="bg-white rounded-b-2xl shadow-2xl overflow-hidden">
          <!-- Header section -->
          <div class="bg-gradient-to-br from-rose-50 to-pink-50 px-7 pt-8 pb-6 text-center border-b border-rose-100">
            <!-- Icon badge -->
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-center justify-center">
              <i class="bi bi-lock-fill text-2xl text-rose-500"></i>
            </div>

            <h2 class="text-xl font-black text-slate-900 mb-1">Subscription Required</h2>
            <p class="text-sm text-slate-500 font-medium">Your plan has expired</p>
          </div>

          <!-- Body -->
          <div class="px-7 py-6">
            <!-- Data safety note -->
            <div class="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-5">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <i class="bi bi-shield-check-fill text-emerald-600"></i>
              </div>
              <div>
                <p class="text-sm font-bold text-emerald-800">Your data is 100% safe</p>
                <p class="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  All your products, customers, invoices and inventory are preserved and untouched.
                </p>
              </div>
            </div>

            <p class="text-sm text-slate-600 leading-relaxed mb-6">
              You are currently in <span class="font-bold text-rose-600">Read-Only Mode</span>.
              You can still view all your business data, but creating, editing or deleting records
              requires an active subscription.
            </p>

            <!-- What's blocked -->
            <div class="grid grid-cols-2 gap-2 mb-6">
              <div *ngFor="let item of blockedItems" class="flex items-center gap-2 text-xs text-slate-500">
                <i class="bi bi-x-circle-fill text-rose-400 shrink-0"></i>
                {{ item }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-7 pb-7 flex flex-col gap-3">
            <button
              (click)="navigateToSubscription('pay')"
              class="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <i class="bi bi-credit-card-fill"></i>
              Pay Now & Restore Access
            </button>

            <button
              (click)="navigateToSubscription('plans')"
              class="w-full py-2.5 rounded-xl font-semibold text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-200"
            >
              View Plans
            </button>

            <button
              (click)="close()"
              class="w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
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
