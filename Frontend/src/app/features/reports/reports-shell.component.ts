import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AuthService } from '../../core/services/auth.service';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { REPORT_NAV_ITEMS } from './reports.constants';

@Component({
  selector: 'app-reports-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HasPermissionDirective],
  template: `
    <section class="flex-1 overflow-y-auto">
      <div class="border-b border-white/60 bg-white/90 px-6 pb-4 pt-6 backdrop-blur xl:px-8">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-[var(--text-primary)]">Store Reports</h2>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">
              Plan access and permission strings both apply here, so the report UI stays aligned with your current shop enforcement setup.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            @for (item of reportNavItems; track item.key) {
              @if (hasFeature(item.feature)) {
                <ng-container *hasPermission="item.permission">
                  <a
                    [routerLink]="absoluteRoute(item.route)"
                    routerLinkActive="bg-primary-600 text-white shadow-sm"
                    class="rounded-full border border-gray-200  px-4 py-2 text-sm font-medium hover:bg-primary-200 hover:text-primary-600 hover:border-primary-600 transition-colors "
                  >
                    {{ item.label }}
                  </a>
                </ng-container>
              }
            }
          </div>
        </div>
      </div>

      <router-outlet />
    </section>
  `,
})
export class ReportsShellComponent {
  private readonly authService = inject(AuthService);
  private readonly featureGuard = inject(FeatureGuardService);

  readonly reportNavItems = REPORT_NAV_ITEMS;

  hasFeature(feature: string) {
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) {
      return false;
    }

    return this.featureGuard.hasFeatureSync(this.authService.getShopSync(shopId), feature);
  }

  absoluteRoute(route: string) {
    const shopId = this.authService.getCurrentUser()?.shopId;
    return shopId ? ['/', shopId, ...route.replace(/^\//, '').split('/')] : ['/'];
  }
}
