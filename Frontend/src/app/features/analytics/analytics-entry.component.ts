import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { PermissionService } from '../../core/services/permission.service';
import { getRouteParamFromSnapshot } from '../../core/utils/workspace-route.utils';
import { ANALYTICS_NAV_ITEMS } from './analytics.constants';

@Component({
  selector: 'app-analytics-entry',
  standalone: true,
  template: '',
})
export class AnalyticsEntryComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly featureGuard = inject(FeatureGuardService);
  private readonly permissionService = inject(PermissionService);

  constructor() {
    const shopId =
      getRouteParamFromSnapshot(this.route.snapshot, 'shopId') ||
      this.authService.getCurrentUser()?.shopId;
    const shop = shopId ? this.authService.getShopSync(shopId) : null;
    const firstAccessible = ANALYTICS_NAV_ITEMS.find((item) =>
      this.permissionService.hasPermission(item.permission) &&
      this.featureGuard.hasFeatureSync(shop, item.feature),
    );

    if (shopId && firstAccessible) {
      void this.router.navigate(['/', shopId, 'analytics', firstAccessible.route], {
        replaceUrl: true,
      });
      return;
    }

    if (shopId) {
      void this.router.navigate(['/', shopId, 'access-denied'], {
        replaceUrl: true,
        queryParams: {
          denialType: 'permission',
          blockedPath: 'analytics',
          requiredPermission: 'view_sales_analytics',
        },
      });
      return;
    }

    void this.router.navigate(['/login']);
  }
}
