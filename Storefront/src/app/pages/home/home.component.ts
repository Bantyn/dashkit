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
    <div class="flex flex-col min-h-screen font-sans selection:bg-primary-200 selection:text-primary-900" *ngIf="shopConfig$ | async as config">
      
      <!-- 1. Minimalist Hero Section -->
      <section class="relative h-[85vh] min-h-[600px] flex items-center bg-[#eaeaea] overflow-hidden">
        <!-- Hero Background Image -->
        <div class="absolute inset-0">
          <img
            [src]="(config.theme?.banner || placeholder) | optimizeImage:'hero'"
            (error)="$any($event.target).src = placeholder"
            alt="Elevate Your Style"
            class="w-full h-full object-cover object-center sm:object-[center_30%]"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto w-full pt-10">
          <div class="max-w-2xl">
            <h1 class="text-4xl md:text-6xl lg:text-[72px] font-medium mb-4 leading-[1.1] text-white tracking-tight drop-shadow-md">
              {{ config.displayName || config.shopName }}<br />
              <span class="text-white/90 font-light text-2xl md:text-4xl block mt-2">Timeless Style & Quality</span>
            </h1>
            <p class="text-white/80 text-base md:text-lg mb-8 max-w-lg font-light">
              {{ config.description || 'Explore our latest collection of premium fashion essentials and handcrafted apparel.' }}
            </p>
            <div class="mt-8">
              <a
                [routerLink]="routePrefix.concat(['products'])"
                class="inline-block bg-white text-gray-900 px-8 py-3.5 font-bold text-sm hover:bg-gray-100 transition-colors rounded-lg shadow-lg"
              >
                Shop Collection →
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Introduction Philosophy -->
      <section class="py-16 md:py-24 px-6 md:px-12 max-w-4xl mx-auto text-center md:text-left">
        <p class="text-lg md:text-2xl text-gray-900 font-medium leading-relaxed max-w-3xl">
          Elevate your lifestyle with a more intelligent, superior wardrobe.<br />
          Our range is crafted sustainably with longevity in mind.
        </p>
      </section>

      <!-- 3. Categories Grid -->
      <section class="px-6 md:px-12 mb-20 max-w-full mx-auto w-full">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <!-- New Arrivals -->
          <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'newest'}" class="group relative block aspect-[4/5] bg-gray-100 overflow-hidden rounded-xl">
            <img [src]="(config.theme?.homepageSettings?.categoryBanners?.newArrivals || placeholder) | optimizeImage:'product'" alt="New Arrivals" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div class="absolute bottom-6 left-6 z-10">
              <span class="text-white text-xl md:text-2xl font-medium drop-shadow-md tracking-wide">New Arrivals</span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </a>
          <!-- The Casual Edit -->
          <a [routerLink]="routePrefix.concat(['products'])" class="group relative block aspect-[4/5] bg-gray-100 overflow-hidden rounded-xl">
            <img [src]="(config.theme?.homepageSettings?.categoryBanners?.casualEdit || placeholder) | optimizeImage:'product'" alt="The Casual Edit" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div class="absolute bottom-6 left-6 z-10">
              <span class="text-white text-xl md:text-2xl font-medium drop-shadow-md tracking-wide">The Casual Edit</span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </a>
          <!-- Best-Sellers -->
          <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'bestsellers'}" class="group relative block aspect-[4/5] bg-gray-100 overflow-hidden rounded-xl">
            <img [src]="(config.theme?.homepageSettings?.categoryBanners?.bestSellers || placeholder) | optimizeImage:'product'" alt="Best-Sellers" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div class="absolute bottom-6 left-6 z-10">
              <span class="text-white text-xl md:text-2xl font-medium drop-shadow-md tracking-wide">Best-Sellers</span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </a>
        </div>
      </section>

      <!-- Seasonal Collections Section -->
      <section class="px-6 md:px-12 py-12 max-w-[1600px] mx-auto w-full" *ngIf="(seasonalCollections$ | async) as seasons">
        <div *ngIf="seasons.length > 0">
          <h2 class="text-xl md:text-2xl font-medium text-gray-900 mb-8 tracking-tight">Shop by Season</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <a *ngFor="let season of seasons" [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: season.id}" class="group relative block aspect-[16/9] bg-slate-900 overflow-hidden rounded-2xl shadow-sm border border-slate-100">
              <div class="absolute inset-0 bg-gradient-to-tr transition-transform duration-700 group-hover:scale-105"
                [ngClass]="{
                  'from-amber-500/80 to-orange-600/80': season.season === 'summer',
                  'from-sky-500/80 to-blue-700/80': season.season === 'winter',
                  'from-rose-500/80 to-red-700/80': season.season === 'festive',
                  'from-indigo-500/80 to-purple-700/80': season.season === 'other'
                }">
              </div>
              <div class="absolute inset-0 bg-black/10"></div>
              <div class="absolute inset-0 p-6 flex flex-col justify-end text-white text-left">
                <span class="text-[9px] font-bold uppercase tracking-widest text-white/70">{{ season.season }} Collection</span>
                <h3 class="text-xl font-bold mt-1 tracking-tight leading-none group-hover:underline">{{ season.name }}</h3>
                <p *ngIf="season.description" class="text-xs text-white/80 mt-2 line-clamp-1 font-light">{{ season.description }}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- 4. What to Wear Now (Products) -->
      <section class="px-6 md:px-12 py-12 max-w-[1600px] mx-auto w-full">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-xl md:text-2xl font-medium text-gray-900">What to Wear Now</h2>
          <a [routerLink]="routePrefix.concat(['products'])" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View All →</a>
        </div>
        
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          *ngIf="products$ | async as products; else loadingProducts"
        >
          <div *ngFor="let product of products" class="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition">
            <a [routerLink]="routePrefix.concat(['products', product.id])" class="block h-full">
              <!-- Minimal Product Image -->
              <div class="relative bg-[#f6f6f6] aspect-square md:aspect-[4/5] overflow-hidden flex items-center justify-center group-hover:bg-[#f0f0f0] transition-colors">
                <img
                  [src]="((product.images && product.images[0]) || placeholder) | optimizeImage:'card'"
                  [alt]="product.name"
                  class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              
              <!-- Clean Product Info -->
              <div class="p-4 text-left">
                <h3 class="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                  {{ product.name }}
                </h3>
                <p class="text-sm font-bold text-gray-900">
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

      <!-- 5. Featured Editorials Grid -->
      <section class="px-6 md:px-12 py-16 max-w-full mx-auto w-full">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- The Smart Chic -->
          <a [routerLink]="routePrefix.concat(['products'])" class="group relative block aspect-[4/5] md:aspect-square bg-gray-100 overflow-hidden rounded-2xl">
            <img [src]="(config.theme?.homepageSettings?.editorials?.smartChic || placeholder) | optimizeImage:'zoom'" alt="The Smart Chic" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div class="absolute bottom-8 left-8 z-10">
              <span class="text-white text-xl md:text-2xl font-medium drop-shadow-md tracking-wide">The Smart Chic</span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </a>
          <!-- Ready To Go -->
          <a [routerLink]="routePrefix.concat(['products'])" class="group relative block aspect-[4/5] md:aspect-square bg-gray-100 overflow-hidden rounded-2xl">
            <img [src]="(config.theme?.homepageSettings?.editorials?.readyToGo || placeholder) | optimizeImage:'zoom'" alt="Ready To Go" class="w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div class="absolute bottom-8 left-8 z-10">
              <span class="text-white text-xl md:text-2xl font-medium drop-shadow-md tracking-wide">Ready To Go</span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </a>
        </div>
      </section>

      <!-- 6. Philosophy -->
      <section class="py-24 px-6 bg-[#f7f7f7]">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-2xl md:text-[32px] font-medium text-gray-900 mb-8 tracking-tight">The Art of Fewer, Better Choices</h2>
          <p class="text-[15px] md:text-[17px] text-gray-800 leading-relaxed max-w-2xl mx-auto font-normal">
            Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings.
          </p>
        </div>
      </section>

    </div>
  `
})
export class WebsiteHomeComponent implements OnInit {
  shopConfig$: Observable<any>;
  products$: Observable<Product[]> | null = null;
  seasonalCollections$: Observable<any[]> | null = null;

  /** Inline SVG placeholder — avoids 404s on subdomain tenants */
  readonly placeholder = 'assets/placeholder.jpg';

  constructor(
    private shopContext: ShopContextService,
    private websiteService: WebsiteService,
    private tenantService: TenantService,
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$.pipe(map(c => c as any));
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.products$ = this.websiteService.getProducts({ limit: 8 });
    this.seasonalCollections$ = this.websiteService.getSeasonalCollections();
  }
}
