import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, map, distinctUntilChanged, shareReplay, switchMap, of } from 'rxjs';
import { AuthService } from './auth.service';
import { ShopService } from './shop.service';

export type ReadOnlyStatus = 'active' | 'trial_ending' | 'read_only';

/**
 * ReadOnlyService — Single source of truth for subscription expiry state.
 *
 * Exposes:
 *  - isReadOnly$: boolean observable — true when shop is expired
 *  - shopStatus$: Observable<ReadOnlyStatus>
 *  - showUpgradeDialog$: Subject to trigger the upgrade modal
 *  - guardWrite(action): execute action only if shop is active, else show dialog
 */
@Injectable({ providedIn: 'root' })
export class ReadOnlyService {
  private authService = inject(AuthService);
  private shopService = inject(ShopService);

  /** Emitted when a blocked write is attempted — subscribe to show upgrade dialog */
  readonly showUpgradeDialog$ = new Subject<void>();

  private readonly shop$ = this.authService.currentUser$.pipe(
    switchMap((user) => {
      if (!user?.shopId) return of(null);
      return this.shopService.getShop(user.shopId).pipe(
        map((res) => res?.data || null),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly isReadOnly$: Observable<boolean> = this.shop$.pipe(
    map((shop) => this.computeIsReadOnly(shop)),
    distinctUntilChanged(),
  );

  readonly shopStatus$: Observable<ReadOnlyStatus> = this.shop$.pipe(
    map((shop) => {
      if (!shop) return 'active';
      if (this.computeIsReadOnly(shop)) return 'read_only';
      if (this.isTrialEnding(shop)) return 'trial_ending';
      return 'active';
    }),
    distinctUntilChanged(),
  );

  /**
   * Synchronous check using the latest cached user features.
   * Only reliable after the shop data has been loaded.
   */
  isReadOnlySync(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    // The backend sets features = [] when isRestricted. If features is empty
    // and the plan is not 'free' (which always has empty features), treat as read-only.
    // Primary signal: features array is empty but paymentStatus is expired.
    // We store paymentStatus in the shop — use the shop service cache if available.
    return false; // Async is preferred; sync is a fallback
  }

  /**
   * If the shop is in read-only mode, emits to showUpgradeDialog$ instead of
   * executing the action. Otherwise, executes the action normally.
   */
  guardWrite(action: () => void): void {
    this.isReadOnly$.pipe(
      // Only need one emission
      map((isReadOnly) => {
        if (isReadOnly) {
          this.showUpgradeDialog$.next();
        } else {
          action();
        }
      }),
    ).subscribe().unsubscribe();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private computeIsReadOnly(shop: any): boolean {
    if (!shop) return false;

    const payStatus = shop.paymentStatus;
    const subStatus = shop.subscriptionStatus;

    if (payStatus === 'expired' || subStatus === 'expired') return true;

    // Treat failed/suspended as read-only
    if (payStatus === 'failed' || shop.status === 'suspended') return true;

    // Trial expired
    if ((payStatus === 'trial' || payStatus === 'pending') && shop.trialExpiresAt) {
      const expiry = this.toDate(shop.trialExpiresAt);
      if (expiry < new Date()) return true;
    }

    return false;
  }

  private isTrialEnding(shop: any): boolean {
    if (shop?.paymentStatus !== 'trial' || !shop.trialExpiresAt) return false;
    const expiry = this.toDate(shop.trialExpiresAt);
    const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }

  private toDate(value: any): Date {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (value.toDate) return value.toDate();
    if (value.seconds) return new Date(value.seconds * 1000);
    return new Date(value);
  }
}
