import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ShopContextService } from '../../app/core/services/shop-context.service';
import { CartService } from '../../app/core/services/cart.service';
import { TenantService } from '../../app/core/services/tenant.service';
import { Observable } from 'rxjs';
import { WebsiteLoadingComponent } from '../../app/shared/components/website-loading.component';

@Component({
  selector: 'app-fashion-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, WebsiteLoadingComponent],
  template: `
    <div *ngIf="shopConfig$ | async as config; else loading" class="min-h-screen flex flex-col font-sans bg-stone-50 text-stone-900">
      <!-- Fashion Theme Hero Bar -->
      <div class="bg-stone-900 text-stone-200 text-xs py-2 text-center tracking-widest uppercase font-semibold">
        ✨ Exclusive Fashion Collection • Free Shipping Above ₹999
      </div>

      <!-- Fashion Navbar -->
      <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div class="container mx-auto px-6 h-20 flex items-center justify-between">
          <a [routerLink]="routePrefix" class="text-2xl font-serif font-bold text-stone-900 tracking-wider">
            {{ config.displayName || config.shopName }}
          </a>

          <nav class="flex items-center gap-8 text-xs uppercase tracking-widest font-semibold text-stone-700">
            <a [routerLink]="routePrefix" class="hover:text-black transition">Home</a>
            <a [routerLink]="routePrefix.concat(['products'])" class="hover:text-black transition">Catalog</a>
            <a [routerLink]="routePrefix.concat(['offers'])" class="hover:text-black transition">Lookbook / Offers</a>
            <a [routerLink]="routePrefix.concat(['cart'])" class="hover:text-black transition flex items-center gap-1.5">
              Bag <span *ngIf="(cartCount$ | async) as count" class="bg-black text-white px-2 py-0.5 rounded-full text-[10px]">{{ count }}</span>
            </a>
          </nav>
        </div>
      </header>

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <footer class="bg-stone-950 text-stone-400 py-12 px-6 border-t border-stone-800 text-xs mt-auto">
        <div class="container mx-auto text-center space-y-4">
          <h3 class="text-lg font-serif font-bold text-white">{{ config.displayName || config.shopName }}</h3>
          <p class="max-w-md mx-auto text-stone-400">{{ config.description || 'Premium Fashion & Apparel Collection.' }}</p>
          <p class="text-[11px] text-stone-600">© {{ currentYear }} {{ config.displayName || config.shopName }}. Powered by DashKit Fashion Theme Engine.</p>
        </div>
      </footer>
    </div>

    <ng-template #loading>
      <app-website-loading [fullScreen]="true" text="Loading Fashion Experience..."></app-website-loading>
    </ng-template>
  `
})
export class FashionLayoutComponent implements OnInit {
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
