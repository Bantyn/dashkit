import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopContextService } from '../../core/services/shop-context.service';
import { WebsiteService } from '../../core/services/website.service';
import { TenantService } from '../../core/services/tenant.service';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { Product } from '../../core/models/product.model';
import { map } from 'rxjs/operators';
import { OptimizeImagePipe } from '../../shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-website-home',
  standalone: true,
  imports: [CommonModule, RouterModule, OptimizeImagePipe],
  template: `
    <div class="flex flex-col min-h-screen font-sans" *ngIf="shopConfig$ | async as config">
      <!-- 1. Minimalist Hero Section -->
      <section class="relative h-[85vh] min-h-[500px] flex items-center bg-gray-900 overflow-hidden">
        <div class="absolute inset-0">
          <img
            [src]="(config.theme?.banner || '/Cloth_placeholder.png') | optimizeImage:'hero'"
            onerror="this.src='/Cloth_placeholder.png'"
            alt="Elevate Your Style"
            class="w-full h-full object-cover opacity-60"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        </div>

        <div class="relative z-10 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto w-full">
          <div class="max-w-2xl">
            <h1 class="text-4xl md:text-6xl font-extrabold mb-4 leading-tight text-white tracking-tight">
              {{ config.displayName || config.shopName }}<br />
              <span class="text-indigo-400">Timeless Style & Quality</span>
            </h1>
            <p class="text-gray-300 text-base md:text-lg mb-8 max-w-lg">
              {{ config.description || 'Explore our latest collection of premium fashion essentials and handcrafted apparel.' }}
            </p>
            <div>
              <a
                [routerLink]="routePrefix.concat(['products'])"
                class="inline-block bg-white text-gray-900 px-8 py-3.5 font-bold text-sm rounded-lg hover:bg-gray-100 transition shadow-lg"
              >
                Explore Products →
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Products Section -->
      <section class="px-6 md:px-12 py-16 max-w-7xl mx-auto w-full">
        <div class="flex justify-between items-end mb-10">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
            <p class="text-sm text-gray-500 mt-1">Discover our top-rated arrivals</p>
          </div>
          <a [routerLink]="routePrefix.concat(['products'])" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All →</a>
        </div>

        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-6"
          *ngIf="products$ | async as products; else loadingProducts"
        >
          <div *ngFor="let product of products" class="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
            <a [routerLink]="routePrefix.concat(['products', product.id])" class="block">
              <div class="relative bg-gray-50 aspect-square overflow-hidden">
                <img
                  [src]="((product.images && product.images[0]) || '/Cloth_placeholder.png') | optimizeImage:'card'"
                  [alt]="product.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              <div class="p-4 text-left">
                <h3 class="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                  {{ product.name }}
                </h3>
                <p class="text-sm font-bold text-indigo-600">
                  ₹{{ product.variants[0]?.price }}
                </p>
              </div>
            </a>
          </div>
        </div>

        <ng-template #loadingProducts>
          <div class="flex justify-center py-20">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </ng-template>
      </section>
    </div>
  `
})
export class WebsiteHomeComponent implements OnInit {
  shopConfig$: Observable<any>;
  products$: Observable<Product[]> | null = null;

  constructor(
    private shopContext: ShopContextService,
    private websiteService: WebsiteService,
    private tenantService: TenantService,
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$.pipe(map((c) => c as any));
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.products$ = this.websiteService.getProducts({ limit: 8 });
  }
}
