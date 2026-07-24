import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsiteService } from '../../core/services/website.service';
import { Product, ProductVariant } from '../../core/models/product.model';
import { Observable, combineLatest, BehaviorSubject, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { OptimizeImagePipe } from '../../shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-website-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    UiLoadingComponent,
    UiDropdownComponent,
    OptimizeImagePipe
  ],
  providers: [OptimizeImagePipe],
  template: `
    <div class="min-h-screen pt-4 pb-20 bg-white">
      <div class="container mx-auto px-4 max-w-7xl pt-8 pb-4">
        <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-6">
          {{ (currentCollection$ | async) ? (currentCollection$ | async) : 'Shop Collection' }}
        </h1>

        <!-- Category Pills & Actions Desktop -->
        <div class="hidden lg:flex justify-between items-center border-b border-gray-100 pb-6 mb-10">
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let cat of categories$ | async"
              (click)="setCategory(cat)"
              class="px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer"
              [class.bg-black]="(currentCategory$ | async) === (cat === 'all' ? '' : cat)"
              [class.text-white]="(currentCategory$ | async) === (cat === 'all' ? '' : cat)"
              [class.border-black]="(currentCategory$ | async) === (cat === 'all' ? '' : cat)"
              [class.bg-white]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
              [class.text-gray-600]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
              [class.border-gray-200]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
            >
              {{ cat === 'all' ? 'All Pieces' : (cat | titlecase) }}
            </button>
          </div>

          <div class="flex items-center gap-8">
            <div class="relative flex items-center gap-2">
              <span class="text-xs font-bold tracking-widest uppercase text-gray-400">Sort</span>
              <div class="w-48">
                <app-ui-dropdown
                  [options]="sortOptions"
                  [ngModel]="currentSort$.value"
                  (ngModelChange)="currentSort$.next($event)"
                  placeholder="Sort By"
                ></app-ui-dropdown>
              </div>
            </div>

            <button
              (click)="toggleMobileFilters()"
              class="text-sm font-bold text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-2"
            >
              Filter
            </button>
          </div>
        </div>

        <!-- Product Cards Grid -->
        <div class="container mx-auto">
          <ng-container *ngIf="products$ | async as products; else loading">
            <div class="flex items-center justify-between mb-8">
              <p class="text-gray-500 font-medium text-xs tracking-wider uppercase">
                Showing <span class="text-gray-900 font-bold">{{ products.length }}</span> items
              </p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              <div *ngFor="let product of products" class="group relative flex flex-col h-full cursor-pointer">
                <a [routerLink]="routePrefix.concat(['products', product.id])" class="block flex-grow flex flex-col">
                  <div class="relative aspect-[3/4] bg-[#fff] overflow-hidden mb-4 rounded-xl border border-gray-100">
                    <img
                      [src]="(product.images && product.images[0]) | optimizeImage:'card'"
                      [alt]="product.name"
                      class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    <div
                      *ngIf="isOutOfStock(product)"
                      class="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm shadow-sm"
                    >
                      Out of Stock
                    </div>

                    <button
                      *ngIf="cartEnabled && !isOutOfStock(product)"
                      (click)="quickAdd($event, product)"
                      class="absolute bottom-4 right-4 w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-md"
                    >
                      <i class="bi bi-plus text-xl"></i>
                    </button>
                  </div>

                  <div class="flex flex-col text-left">
                    <h3 class="text-sm font-semibold text-gray-900 mt-1 mb-1 leading-tight group-hover:underline">
                      {{ product.name }}
                    </h3>
                    <p class="text-sm text-gray-900 font-bold">
                      ₹{{ product.variants[0]?.price }}
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div
              *ngIf="products.length === 0"
              class="text-center py-24 bg-white rounded-3xl border border-gray-100 mt-4"
            >
              <i class="bi bi-search text-5xl text-gray-300 mb-6 inline-block"></i>
              <h3 class="text-2xl font-black text-gray-900 mb-2">No matching items found</h3>
              <button
                (click)="resetFilters()"
                class="bg-black text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg"
              >
                Clear All Filters
              </button>
            </div>
          </ng-container>

          <ng-template #loading>
            <div class="h-96 flex flex-col items-center justify-center">
              <app-ui-loading size="lg"></app-ui-loading>
              <p class="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse mt-6">
                Loading Collection...
              </p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `
})
export class WebsiteProductsComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]>;
  categories$: Observable<string[]>;
  subcategories$: Observable<string[]>;

  currentCategory$ = new BehaviorSubject<string>('');
  currentSubcategory$ = new BehaviorSubject<string>('');
  currentSort$ = new BehaviorSubject<string>('');
  currentSearch$ = new BehaviorSubject<string>('');
  currentCollection$ = new BehaviorSubject<string>('');

  showMobileFilters = false;
  sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];
  private destroy$ = new Subject<void>();

  get cartEnabled(): boolean {
    return this.shopContextService.isCartEnabled();
  }

  constructor(
    private websiteService: WebsiteService,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private tenantService: TenantService,
    private shopContextService: ShopContextService,
  ) {
    this.categories$ = this.websiteService.getCategories();
    this.subcategories$ = this.currentCategory$.pipe(
      switchMap((category) => {
        const normalizedCategory = category && category !== 'all' ? category : undefined;
        return this.websiteService.getSubcategories(normalizedCategory);
      })
    );

    this.products$ = combineLatest([
      this.currentCategory$,
      this.currentSubcategory$,
      this.currentSort$,
      this.currentSearch$,
      this.currentCollection$,
    ]).pipe(
      switchMap(([category, subcategory, sort, search, collection]) => {
        const filters: any = {};
        if (category && category !== 'all') filters.category = category;
        if (sort) filters.sort = sort;
        if (search) filters.search = search;
        if (collection) filters.collection = collection;
        return this.websiteService.getProducts(filters).pipe(
          map((products: any[]) => {
            let filtered = products;
            if (subcategory) {
              filtered = filtered.filter((p: any) => p.subcategory === subcategory);
            }
            return filtered as Product[];
          })
        );
      })
    );
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['category']) this.currentCategory$.next(params['category']);
      if (params['subcategory']) this.currentSubcategory$.next(params['subcategory']);
      if (params['search']) this.currentSearch$.next(params['search']);
      if (params['collection']) this.currentCollection$.next(params['collection']);
      if (params['sort']) this.currentSort$.next(params['sort']);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setCategory(cat: string) {
    const category = cat === 'all' ? '' : cat;
    this.currentCategory$.next(category);
    this.currentSubcategory$.next('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category || null, subcategory: null },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters() {
    this.setCategory('all');
    this.currentSubcategory$.next('');
    this.currentSort$.next('');
    this.currentSearch$.next('');
    this.currentCollection$.next('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null, category: null, subcategory: null, collection: null },
      queryParamsHandling: 'merge',
    });
  }

  toggleMobileFilters() {
    this.showMobileFilters = !this.showMobileFilters;
  }

  isOutOfStock(product: Product): boolean {
    if (!product || !product.variants || product.variants.length === 0) return true;
    return product.variants.reduce((total, v) => total + (v.stock || 0), 0) <= 0;
  }

  quickAdd(event: Event, product: Product) {
    event.stopPropagation();
    event.preventDefault();
    if (product.variants && product.variants.length > 0) {
      this.cartService.addToCart(product, 1, product.variants[0]);
    }
  }
}
