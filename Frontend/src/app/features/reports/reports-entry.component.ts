import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { PermissionService } from '../../core/services/permission.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { REPORT_NAV_ITEMS } from './reports.constants';

@Component({
  selector: 'app-reports-entry',
  standalone: true,
  imports: [CommonModule, UiLoadingComponent],
  template: `
    <div class="flex h-[320px] items-center justify-center">
      <app-ui-loading size="md" />
    </div>
  `,
})
export class ReportsEntryComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly featureGuard = inject(FeatureGuardService);

  constructor() {
    const shopId = this.authService.getCurrentUser()?.shopId;
    const shop = shopId ? this.authService.getShopSync(shopId) : null;

    const firstAllowedReport = REPORT_NAV_ITEMS.find(
      (item) =>
        this.permissionService.hasPermission(item.permission) &&
        this.featureGuard.hasFeatureSync(shop, item.feature),
    );

    if (shopId && firstAllowedReport) {
      void this.router.navigate(['/', shopId, ...firstAllowedReport.route.replace(/^\//, '').split('/')], {
        replaceUrl: true,
      });
      return;
    }

    if (shopId) {
      void this.router.navigate(['/', shopId, 'access-denied'], {
        replaceUrl: true,
        queryParams: {
          denialType: 'permission',
          blockedPath: 'reports',
          requiredPermission: 'reports.*',
        },
      });
      return;
    }

    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
