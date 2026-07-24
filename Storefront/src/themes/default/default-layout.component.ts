import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
} from '@angular/router';
import { ShopContextService } from '../../app/core/services/shop-context.service';
import { CartService, CartItem } from '../../app/core/services/cart.service';
import { TenantService } from '../../app/core/services/tenant.service';
import { Offer } from '../../app/core/models/offer.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebsiteService } from '../../app/core/services/website.service';
import { WebsiteLoadingComponent } from '../../app/shared/components/website-loading.component';
import { FormsModule } from '@angular/forms';
import { OptimizeImagePipe } from '../../app/shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    WebsiteLoadingComponent,
    FormsModule,
    OptimizeImagePipe,
  ],
  template: `
    <div
      class="min-h-screen flex flex-col font-sans selection:bg-primary-200 selection:text-primary-900"
      *ngIf="shopConfig$ | async as config; else loading"
      [style.background-color]="config.theme?.secondaryColor || '#f9fafb'"
      [style.fontFamily]="config.theme?.fontFamily || 'Inter, sans-serif'"
    >
      <ng-container *ngIf="config.websiteEnabled !== false; else websiteDisabled">
        <!-- Announcement Bar -->
        <div
          *ngIf="offers && offers.length > 0; else defaultAnnouncement"
          class="bg-black text-white text-[11px] py-2.5 font-medium tracking-widest uppercase overflow-hidden relative"
        >
          <div class="marquee-wrapper flex overflow-hidden whitespace-nowrap">
            <div class="marquee-track flex animate-marquee hover:[animation-play-state:paused]">
              <div class="flex items-center gap-16 px-8 shrink-0 min-w-full justify-around">
                <ng-container *ngFor="let text of announcementTexts">
                  <span class="flex items-center gap-2">
                    <span>{{ text }}</span>
                    <a [routerLink]="routePrefix.concat(['products'])" class="underline hover:text-gray-300 ml-1">Shop now</a>
                  </span>
                  <span class="w-1.5 h-1.5 bg-white/30 rounded-full"></span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <ng-template #defaultAnnouncement>
          <div class="bg-black text-white text-[11px] py-2.5 px-4 text-center font-medium tracking-widest uppercase">
            Complimentary Free Shipping on qualifying orders.
            <a [routerLink]="routePrefix.concat(['products'])" class="underline hover:text-gray-300 ml-1">Shop now</a>
          </div>
        </ng-template>

        <!-- Navbar -->
        <nav class="sticky top-0 z-50 bg-white border-b border-gray-100 transition-all duration-300 relative">
          <div class="container mx-auto px-6 h-20 flex items-center justify-between">
            <a
              [routerLink]="routePrefix"
              class="flex items-center gap-3 z-50 relative hover:opacity-80 transition-opacity"
            >
              <ng-container *ngIf="config.theme?.logo; else defaultLogo">
                <img [src]="config.theme?.logo | optimizeImage:'thumbnail':true" onerror="this.onerror=null;this.style.display='none'" alt="Shop Logo" class="h-8 md:h-10 w-auto object-contain" />
              </ng-container>
              <ng-template #defaultLogo>
                <span class="text-xl font-bold text-gray-900 tracking-tight">{{ config.displayName || config.shopName }}</span>
              </ng-template>
            </a>

            <!-- Navigation Links -->
            <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
              <a [routerLink]="routePrefix" routerLinkActive="text-black font-semibold" [routerLinkActiveOptions]="{exact: true}" class="hover:text-black transition-colors">Home</a>
              <a [routerLink]="routePrefix.concat(['products'])" routerLinkActive="text-black font-semibold" class="hover:text-black transition-colors">Products</a>
              <a [routerLink]="routePrefix.concat(['offers'])" routerLinkActive="text-black font-semibold" class="hover:text-black transition-colors">Offers</a>
              <a [routerLink]="routePrefix.concat(['cart'])" routerLinkActive="text-black font-semibold" class="hover:text-black transition-colors flex items-center gap-1.5">
                Cart
                <span *ngIf="(cartCount$ | async) as count" class="px-1.5 py-0.5 text-[11px] font-bold bg-indigo-600 text-white rounded-full">{{ count }}</span>
              </a>
            </div>
          </div>
        </nav>

        <!-- Main Content View -->
        <main class="flex-1">
          <router-outlet></router-outlet>
        </main>

        <!-- Footer -->
        <footer class="bg-black text-white py-12 px-6 border-t border-gray-800 mt-auto">
          <div class="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-gray-400">
            <div>
              <h4 class="text-sm font-bold text-white mb-3">{{ config.displayName || config.shopName }}</h4>
              <p class="leading-relaxed">{{ config.description || 'Quality garments and curated fashion essentials.' }}</p>
            </div>
            <div>
              <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Shop Navigation</h5>
              <ul class="space-y-2">
                <li><a [routerLink]="routePrefix.concat(['products'])" class="hover:text-white">All Products</a></li>
                <li><a [routerLink]="routePrefix.concat(['offers'])" class="hover:text-white">Promotions & Offers</a></li>
                <li><a [routerLink]="routePrefix.concat(['cart'])" class="hover:text-white">Shopping Cart</a></li>
              </ul>
            </div>
            <div>
              <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Policies</h5>
              <ul class="space-y-2">
                <li><a [routerLink]="routePrefix.concat(['shipping-policy'])" class="hover:text-white">Shipping Policy</a></li>
                <li><a [routerLink]="routePrefix.concat(['return-policy'])" class="hover:text-white">Return Policy</a></li>
                <li><a [routerLink]="routePrefix.concat(['privacy-policy'])" class="hover:text-white">Privacy Policy</a></li>
                <li><a [routerLink]="routePrefix.concat(['terms-and-conditions'])" class="hover:text-white">Terms & Conditions</a></li>
              </ul>
            </div>
            <div>
              <h5 class="text-xs font-bold uppercase tracking-wider text-white mb-3">Contact Us</h5>
              <p *ngIf="config.contactPhone">Phone: {{ config.contactPhone }}</p>
              <p *ngIf="config.contactEmail">Email: {{ config.contactEmail }}</p>
              <p *ngIf="config.address">Address: {{ config.address }}</p>
            </div>
          </div>
          <div class="container mx-auto border-t border-gray-900 mt-8 pt-6 text-center text-[11px] text-gray-500">
            © {{ currentYear }} {{ config.displayName || config.shopName }}. Powered by DashKit Storefront.
          </div>
        </footer>
      </ng-container>

      <ng-template #websiteDisabled>
        <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <i class="bi bi-shop text-5xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900">Storefront Offline</h2>
          <p class="text-sm text-gray-500 max-w-md mt-2">
            This shop storefront is currently disabled by the owner. Please check back later.
          </p>
        </div>
      </ng-template>
    </div>

    <ng-template #loading>
      <app-website-loading [fullScreen]="true" text="Preparing Storefront..."></app-website-loading>
    </ng-template>
  `
})
export class DefaultLayoutComponent implements OnInit {
  shopConfig$: Observable<any>;
  cartCount$: Observable<number>;
  offers: Offer[] = [];
  announcementTexts: string[] = ['New Season Arrival', 'Special Online Offers', 'Free Standard Delivery'];
  currentYear = new Date().getFullYear();

  constructor(
    private shopContext: ShopContextService,
    private cartService: CartService,
    private tenantService: TenantService,
    private websiteService: WebsiteService,
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$;
    this.cartCount$ = this.cartService.cartCount$;
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.websiteService.getOffers().subscribe((offers) => {
      this.offers = offers || [];
      if (this.offers.length > 0) {
        this.announcementTexts = this.offers.map((o) => o.title);
      }
    });
  }
}
