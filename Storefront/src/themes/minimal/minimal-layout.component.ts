import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ShopContextService } from '../../app/core/services/shop-context.service';
import { CartService } from '../../app/core/services/cart.service';
import { TenantService } from '../../app/core/services/tenant.service';
import { Observable } from 'rxjs';
import { WebsiteLoadingComponent } from '../../app/shared/components/website-loading.component';

@Component({
  selector: 'app-minimal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, WebsiteLoadingComponent],
  template: `
    <div *ngIf="shopConfig$ | async as config; else loading" class="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      <header class="border-b border-gray-100 py-6 px-8">
        <div class="container mx-auto flex items-center justify-between">
          <a [routerLink]="routePrefix" class="text-xl font-light tracking-widest uppercase">
            {{ config.displayName || config.shopName }}
          </a>

          <nav class="flex items-center gap-6 text-xs uppercase tracking-wider font-medium text-gray-500">
            <a [routerLink]="routePrefix" class="hover:text-black">Home</a>
            <a [routerLink]="routePrefix.concat(['products'])" class="hover:text-black">Shop</a>
            <a [routerLink]="routePrefix.concat(['cart'])" class="hover:text-black">Cart ({{ (cartCount$ | async) || 0 }})</a>
          </nav>
        </div>
      </header>

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <footer class="py-8 px-6 text-center text-xs text-gray-400 border-t border-gray-100 mt-auto">
        © {{ currentYear }} {{ config.displayName || config.shopName }}. Minimal Storefront Engine.
      </footer>
    </div>

    <ng-template #loading>
      <app-website-loading [fullScreen]="true" text="Loading Minimal Store..."></app-website-loading>
    </ng-template>
  `
})
export class MinimalLayoutComponent implements OnInit {
  shopConfig$: Observable<any>;
  cartCount$: Observable<number>;
  currentYear = new Date().getFullYear();

  constructor(
    private shopContext: ShopContextService,
    private cartService: CartService,
    private tenantService: TenantService,
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$;
    this.cartCount$ = this.cartService.cartCount$;
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {}
}
