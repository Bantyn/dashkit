import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WebsiteService } from '../../core/services/website.service';
import { CartService } from '../../core/services/cart.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { Product, ProductVariant } from '../../core/models/product.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, tap, map, shareReplay, take } from 'rxjs/operators';


import { FormsModule } from '@angular/forms';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { OptimizeImagePipe } from '../../shared/pipes/optimize-image.pipe';
import { ReviewSummaryCardComponent } from '../../shared/components/review-summary-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UiLoadingComponent,
    OptimizeImagePipe,
  ],
  providers: [OptimizeImagePipe],
  template: `
    <div class="bg-white min-h-screen pt-4 pb-24 text-gray-900">
      <div class="container mx-auto px-4 max-w-7xl">
        <ng-container *ngIf="product$ | async as product; else loading">
          <nav class="flex items-center text-xs font-bold tracking-wider uppercase text-gray-400 mb-6 mt-4">
            <a [routerLink]="routePrefix" class="hover:text-black">Home</a>
            <span class="mx-2 text-gray-300">/</span>
            <a [routerLink]="routePrefix.concat(['products'])" class="hover:text-black">Collection</a>
            <span class="mx-2 text-gray-300">/</span>
            <span class="text-gray-900 capitalize">{{ product.category }}</span>
          </nav>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
            <div class="lg:col-span-7">
              <div class="hidden lg:flex flex-col gap-6 w-full">
                <div
                  *ngFor="let img of getStackedImages(product)"
                  class="w-full aspect-[3/4] bg-[#f8f9ff] overflow-hidden rounded-2xl border border-gray-50 shadow-sm relative"
                >
                  <img [src]="img | optimizeImage:'zoom'" class="w-full h-full object-contain" />
                </div>
              </div>

              <div class="lg:hidden relative w-full aspect-[3/4] bg-[#f8f9ff] overflow-hidden mb-6 rounded-2xl">
                <img [src]="selectedImage$.value | optimizeImage:'product'" class="w-full h-full object-cover" />
              </div>
            </div>

            <div class="lg:col-span-5">
              <div class="lg:sticky lg:top-24 h-fit text-left">
                <span class="text-[10px] font-bold tracking-widest uppercase text-gray-400 block mb-2">
                  {{ product.subcategory || product.category }}
                </span>

                <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-3 leading-tight">
                  {{ product.name }}
                </h1>

                <div class="mb-6 text-left">
                  <p class="text-2xl font-bold text-gray-900">
                    ₹{{ (selectedVariant$ | async)?.price || product.variants[0]?.price }}
                  </p>
                </div>

                <p class="text-sm text-gray-600 leading-relaxed mb-8 font-light">
                  {{ product.description || 'Experience premium craftsmanship with our newest arrival.' }}
                </p>

                <div *ngIf="cartEnabled" class="mb-10">
                  <div class="flex gap-4">
                    <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden h-12 w-28 bg-white">
                      <button (click)="quantity = Math.max(1, quantity - 1)" class="w-9 h-full flex items-center justify-center text-gray-500 hover:text-black">
                        <i class="bi bi-dash"></i>
                      </button>
                      <span class="flex-1 text-center font-bold text-sm text-gray-900">
                        {{ quantity }}
                      </span>
                      <button (click)="quantity = quantity + 1" class="w-9 h-full flex items-center justify-center text-gray-500 hover:text-black">
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>

                    <button
                      (click)="addToCart(product)"
                      [disabled]="isAdding || isOutOfStock(product)"
                      class="flex-[2] bg-black text-white h-12 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-40 flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <ng-container *ngIf="!isAdding">
                        {{ isOutOfStock(product) ? 'Out of Stock' : 'Add to Bag' }}
                      </ng-container>
                      <ng-container *ngIf="isAdding">
                        <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                      </ng-container>
                    </button>
                  </div>
                </div>

                <div *ngIf="!cartEnabled" class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
                  <p class="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1">Showcase Item</p>
                  <p class="text-xs text-amber-700 leading-relaxed">This product is for display only.</p>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <ng-template #loading>
          <div class="h-[60vh] flex flex-col items-center justify-center">
            <app-ui-loading size="lg"></app-ui-loading>
            <p class="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse mt-6">
              Loading Product Details...
            </p>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class WebsiteProductDetailComponent implements OnInit {
  product$: Observable<Product>;
  selectedImage$ = new BehaviorSubject<string>('');
  selectedVariant$ = new BehaviorSubject<ProductVariant | null>(null);

  quantity = 1;
  Math = Math;
  isAdding = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private websiteService: WebsiteService,
    private cartService: CartService,
    private tenantService: TenantService,
    private shopContextService: ShopContextService,
  ) {
    this.product$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) throw new Error('Product ID not found');
        return this.websiteService.getProduct(id);
      }),
      tap((product) => {
        if (product.images?.length) {
          this.selectedImage$.next(product.images[0]);
        }
        if (product.variants?.length) {
          this.selectedVariant$.next(product.variants[0]);
        }
      }),
      shareReplay(1),
    );
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  get cartEnabled(): boolean {
    return this.shopContextService.isCartEnabled();
  }

  ngOnInit() {}

  getStackedImages(product: Product): string[] {
    const variant = this.selectedVariant$.value;
    const baseImages = variant?.images && variant.images.length > 0 ? variant.images : product.images || [];
    return baseImages.length > 0 ? baseImages : ['assets/placeholder.jpg'];
  }

  isOutOfStock(product: Product): boolean {
    if (this.selectedVariant$.value) {
      return (this.selectedVariant$.value.stock || 0) <= 0;
    }
    return product.variants.reduce((total, v) => total + (v.stock || 0), 0) <= 0;
  }

  addToCart(product: Product) {
    this.isAdding = true;
    setTimeout(() => {
      const variant = this.selectedVariant$.value || product.variants[0];
      this.cartService.addToCart(product, this.quantity, variant);
      this.isAdding = false;
    }, 400);
  }
}
