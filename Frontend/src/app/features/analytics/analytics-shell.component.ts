import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AuthService } from '../../core/services/auth.service';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { getRouteParamFromSnapshot } from '../../core/utils/workspace-route.utils';
import { ANALYTICS_NAV_ITEMS } from './analytics.constants';

@Component({
  selector: 'app-analytics-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, HasPermissionDirective],
  template: `
    <div class="border-b border-gray-100 bg-white px-6 py-4 xl:px-8">
      <div class="flex flex-wrap items-center gap-3">
        @for (item of navItems; track item.key) {
          @if (hasFeature(item.feature)) {
            <ng-container *hasPermission="item.permission">
              <a
                [routerLink]="absoluteRoute(item.route)"
                routerLinkActive="bg-primary-600 text-white shadow-sm"
                class="inline-flex items-center gap-2 rounded-2xl border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary-100 hover:bg-primary-50 hover:text-primary-700"
              >
                <i class="bi bi-graph-up-arrow"></i>
                {{ item.label }}
              </a>
            </ng-container>
          }
        }
      </div>
    </div>

    <router-outlet />
  `,
})
export class AnalyticsShellComponent implements OnInit {
  readonly navItems = ANALYTICS_NAV_ITEMS;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly featureGuard = inject(FeatureGuardService);
  private readonly shopContextService = inject(ShopContextService);

  ngOnInit() {
    this.shopContextService
      .connectWorkspaceRoute(this.route)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  hasFeature(feature: string) {
    const shopId = this.currentShopId();
    if (!shopId) {
      return false;
    }

    return this.featureGuard.hasFeatureSync(this.authService.getShopSync(shopId), feature);
  }

  absoluteRoute(route: string) {
    const shopId = this.currentShopId();
    return shopId ? ['/', shopId, 'analytics', route] : ['/'];
  }

  private currentShopId() {
    return (
      getRouteParamFromSnapshot(this.route.snapshot, 'shopId') ||
      this.authService.getCurrentUser()?.shopId ||
      null
    );
  }
}
