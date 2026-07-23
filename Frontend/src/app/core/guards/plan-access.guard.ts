import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { filter, map, switchMap, take, of, catchError, defaultIfEmpty } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ShopService } from '../services/shop.service';
import { FeatureGuardService } from '../services/feature-guard.service';

type PlanId = 'free' | 'plus' | 'pro' | 'custom';

/**
 * Complete plan-based route access rules.
 * If a route is listed here, only specified plans can access it.
 * Routes NOT listed are accessible by all plans.
 */
// ROUTE_PLAN_RULES removed - now using dynamic mapping in FeatureGuardService

function normalizeChildPath(url: string) {
  const segments = url.split('?')[0].split('/').filter(Boolean);
  if (segments.length <= 1) {
    return '';
  }

  if (segments[0] === 'shop' && segments.length > 2) {
    return segments.slice(2).join('/');
  }

  return segments.slice(1).join('/');
}

export const planAccessGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(AuthService);
  const shopService = inject(ShopService);
  const featureGuard = inject(FeatureGuardService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    defaultIfEmpty(true as boolean),
    switchMap(() => {
      const user = authService.getCurrentUser();
      if (!user?.shopId) {
        return of(true as boolean | UrlTree);
      }

      const requestedPath = normalizeChildPath(state.url);

      if (requestedPath === 'access-denied' || requestedPath === 'dashboard' || requestedPath === '') {
        return of(true as boolean | UrlTree);
      }

      const featureKey = featureGuard.getFeatureForPath(requestedPath);
      // If no specific feature is mapped to this path, allow access
      if (!featureKey) {
        return of(true as boolean | UrlTree);
      }

      // Layer 1: Check Global Feature State first!
      const globalState = user.featureStates?.[featureKey] || 'active';
      if (globalState === 'inactive' || globalState === 'deprecated' || globalState === 'maintenance') {
        return of(router.createUrlTree(['/', user.shopId, 'feature-unavailable'], {
          queryParams: {
            blockedPath: requestedPath,
            featureKey: featureKey,
            state: globalState
          }
        }) as UrlTree);
      }

      return shopService.getShop(user.shopId).pipe(
        take(1),
        defaultIfEmpty({ success: false, data: null } as any),
        map((response) => {
          // DEFENSIVE: If we can't find shop data or plan, don't block.
          // This prevents accidental redirects during transient network states or cache refreshes.
          if (!response || !response.data || !response.data.subscriptionPlan) {
            console.warn('[PlanAccessGuard] Partial shop data detected, skipping block for feature:', featureKey);
            return true as boolean | UrlTree;
          }

          const shop = response.data;
          const isExpired = shop.paymentStatus === 'expired' || shop.subscriptionStatus === 'expired';

          // ── Read-Only Mode: allow all routes ───────────────────────────────
          // When a shop is expired, we do NOT block navigation. Instead, the
          // ReadOnlyService + BillingStatusBanner communicate the state, and the
          // backend enforces write-blocking. Users can browse all data freely.
          if (isExpired) {
            return true as boolean | UrlTree;
          }

          const hasAccess = featureGuard.hasFeatureSync(response.data, featureKey);
          
          if (hasAccess) {
            return true as boolean | UrlTree;
          }

          // Access Denied logic - ONLY if we are SURE the plan is insufficient
          const currentPlan = response.data.subscriptionPlan;

          return router.createUrlTree(['/', user.shopId, 'access-denied'], {
            queryParams: {
              blockedPath: requestedPath,
              featureKey: featureKey,
              requiredPlans: 'upgrade', // Generic value since it's dynamic
              currentPlan: currentPlan,
            },
          }) as UrlTree;
        }),
        catchError(() => of(true as boolean | UrlTree)),
      );
    }),
    catchError(() => of(true as boolean | UrlTree)),
  );
};
