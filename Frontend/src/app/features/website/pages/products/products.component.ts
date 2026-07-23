import { UiDropdownComponent } from '../../../../shared/components/ui-dropdown.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsiteService } from '../../services/website.service';
import { Product, ProductVariant } from '../../../../core/models/product.model';
import { Observable, combineLatest, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { map, switchMap, startWith, takeUntil, finalize, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ShopContextService } from '../../../../core/services/shop-context.service';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { OptimizeImagePipe } from '../../../../shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-website-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiLoadingComponent, OptimizeImagePipe,
    UiDropdownComponent
  ],
  providers: [OptimizeImagePipe],
  template: `
    <div class="min-h-screen pt-4 pb-20 bg-white">
      <!-- Clean Minimalist Header -->
      <div class="container mx-auto px-4 max-w-9xl pt-8 pb-4 animate-fade-in-up">
        <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-6">
          {{ (currentCollection$ | async) ? (currentCollection$ | async) : 'Shop' }}
        </h1>

        <!-- Category Pills & Actions Desktop -->
        <div class="hidden lg:flex justify-between items-center border-b border-gray-100 pb-6 mb-10">
          <!-- Pills -->
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
              [class.hover:border-black]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
              [class.hover:text-black]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
            >
              {{ cat === 'all' ? 'All Pieces' : (cat | titlecase) }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-8">
            <!-- Sort dropdown -->
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
              <i class="bi bi-chevron-down text-[10px] text-gray-400 absolute right-1 pointer-events-none"></i>
            </div>

            <!-- Filter Button -->
            <button
              (click)="toggleMobileFilters()"
              class="text-sm font-bold text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-2"
            >
              Filter
            </button>
          </div>
        </div>

        <!-- Subcategories Desktop -->
        <div *ngIf="(subcategories$ | async) as subcats" class="hidden lg:flex flex-wrap items-center gap-1.5 mb-8 -mt-6">
          <button
            *ngFor="let sub of (showAllSubcats ? subcats : (subcats | slice:0:10))"
            (click)="toggleSubcategory(sub)"
            class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border"
            [class.bg-gray-900]="(currentSubcategory$ | async) === sub"
            [class.text-white]="(currentSubcategory$ | async) === sub"
            [class.border-gray-900]="(currentSubcategory$ | async) === sub"
            [class.bg-gray-50]="(currentSubcategory$ | async) !== sub"
            [class.text-gray-600]="(currentSubcategory$ | async) !== sub"
            [class.border-gray-200]="(currentSubcategory$ | async) !== sub"
            [class.hover:border-gray-900]="(currentSubcategory$ | async) !== sub"
          >
            {{ sub | titlecase }}
          </button>
          <button
            *ngIf="subcats.length > 10"
            (click)="showAllSubcats = !showAllSubcats"
            class="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
          >
            {{ showAllSubcats ? 'Show Less' : '+' + (subcats.length - 10) + ' more' }}
          </button>
        </div>

        <!-- Mobile Pills & Actions -->
        <div class="lg:hidden flex flex-col gap-4 mb-8">
          <!-- Horizontal Scroll Pills -->
          <div class="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4">
            <button
              *ngFor="let cat of categories$ | async"
              (click)="setCategory(cat)"
              class="px-5 py-2 rounded-full border text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0"
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

          <!-- Horizontal Scroll Subcategories Mobile -->
          <div *ngIf="(subcategories$ | async) as subcats" class="flex items-center overflow-x-auto gap-1.5 pb-2 scrollbar-hide -mx-4 px-4 -mt-2">
            <button
              *ngFor="let sub of (showAllSubcats ? subcats : (subcats | slice:0:10))"
              (click)="toggleSubcategory(sub)"
              class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 border"
              [class.bg-gray-900]="(currentSubcategory$ | async) === sub"
              [class.text-white]="(currentSubcategory$ | async) === sub"
              [class.border-gray-900]="(currentSubcategory$ | async) === sub"
              [class.bg-gray-50]="(currentSubcategory$ | async) !== sub"
              [class.text-gray-600]="(currentSubcategory$ | async) !== sub"
              [class.border-gray-200]="(currentSubcategory$ | async) !== sub"
            >
              {{ sub | titlecase }}
            </button>
            <button
              *ngIf="subcats.length > 10"
              (click)="showAllSubcats = !showAllSubcats"
              class="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-500 whitespace-nowrap flex-shrink-0"
            >
              {{ showAllSubcats ? 'Show Less' : '+' + (subcats.length - 10) + ' more' }}
            </button>
          </div>

          <!-- Sort / Filter Bar (Two Equal Columns) -->
          <div class="grid grid-cols-2 border-t border-b border-gray-100 py-3.5 text-center text-sm font-semibold">
            <!-- Sort Mobile -->
            <div class="relative flex items-center justify-center gap-2 border-r border-gray-100">
              <span class="text-xs font-bold tracking-widest uppercase text-gray-400">Sort</span>
              <div class="w-36 text-left">
                <app-ui-dropdown
                  [options]="sortOptions"
                  [ngModel]="currentSort$.value"
                  (ngModelChange)="currentSort$.next($event)"
                  placeholder="Sort"
                ></app-ui-dropdown>
              </div>
            </div>

            <!-- Filter Mobile -->
            <button
              (click)="toggleMobileFilters()"
              class="flex items-center justify-center gap-2 text-gray-900 font-semibold"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="container mx-auto px-4 max-w-9xl animate-fade-in-up" style="animation-delay: 0.15s">
        <ng-container *ngIf="products$ | async as products; else loading">
          
          <!-- Desktop Active Filters and Count -->
          <div class="flex items-center justify-between mb-8">
            <p class="text-gray-500 font-medium text-xs tracking-wider uppercase">
              Showing <span class="text-gray-900 font-bold">{{ products.length }}</span> items
            </p>
          </div>

          <!-- Product Cards Grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            <div *ngFor="let product of products" class="group relative flex flex-col h-full cursor-pointer">
              <!-- Link Wrapper for details -->
              <a [routerLink]="routePrefix.concat(['products', product.id])" class="block flex-grow flex flex-col">
                
                <!-- Image Container with Aspect Ratio and Light Grey BG -->
                <div class="relative aspect-[3/4] bg-[#fff] overflow-hidden mb-4">
                  <img
                    [src]="((product.images && product.images[0]) | optimizeImage:'card') || '/Cloth_placeholder.png'"
                    [alt]="product.name"
                    class="w-full h-full object-contain  transition-transform duration-500 ease-in-out"
                    loading="lazy"
                  />

                  <!-- Wishlist Heart Toggle (Top-Right) -->
                  <button
                    (click)="toggleFavorite($event, product.id)"
                    class="absolute top-4 right-4 text-gray-900 hover:text-red-500 transition-colors z-8 p-1.5 focus:outline-none"
                  >
                    <i 
                      class="bi text-lg" 
                      [class.bi-heart]="!isFavorited(product.id)" 
                      [class.bi-heart-fill]="isFavorited(product.id)" 
                      [class.text-red-500]="isFavorited(product.id)"
                    ></i>
                  </button>

                  <!-- Out of Stock Badge -->
                  <div
                    *ngIf="isOutOfStock(product)"
                    class="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm shadow-sm z-10"
                  >
                    Out of Stock
                  </div>

                  <!-- Plus Icon Add-to-Bag (Bottom-Right) -->
                  <button
                    *ngIf="cartEnabled && !isOutOfStock(product)"
                    (click)="quickAdd($event, product)"
                    class="absolute bottom-4 right-4 w-12 h-12 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-md z-10 focus:outline-none"
                    [disabled]="isLoadingMap[product.id]"
                  >
                    <i *ngIf="!isLoadingMap[product.id]" class="bi bi-plus text-xl"></i>
                    <span *ngIf="isLoadingMap[product.id]" class="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></span>
                  </button>
                  
                </div>

                <!-- Card Details -->
                <div class="flex flex-col text-left">
                  <h3 class="text-sm font-semibold text-gray-900 mt-1 mb-1 leading-tight group-hover:underline">
                    {{ product.name }}
                  </h3>
                  <p class="text-sm text-gray-500 font-semibold">
                    {{ product.variants[0]?.price | currency: 'INR' }}
                  </p>
                </div>

              </a>
            </div>
          </div>

          <!-- Empty State -->
          <div
            *ngIf="products.length === 0"
            class="text-center py-24 bg-white rounded-3xl border border-gray-100 mt-4"
          >
            <i class="bi bi-search text-5xl text-gray-300 mb-6 inline-block"></i>
            <h3 class="text-2xl font-black text-gray-900 mb-2">No matching pieces found</h3>
            <p class="text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any products matching your current filters. Try adjusting your
              search or category.
            </p>
            <button
              (click)="resetFilters()"
              class="bg-black text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg"
            >
              Clear All Filters
            </button>
          </div>
        </ng-container>

        <!-- Loading Template -->
        <ng-template #loading>
          <div class="h-96 flex flex-col items-center justify-center">
            <app-ui-loading size="lg"></app-ui-loading>
            <p class="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse mt-6">
              Loading Collection...
            </p>
          </div>
        </ng-template>
      </div>

      <!-- Backdrop for Filters Slide Drawer -->
      <div
        class="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity animate-fade-in"
        *ngIf="showMobileFilters"
        (click)="toggleMobileFilters()"
      ></div>

      <!-- Slide Drawer Filters Panel -->
      <aside
        class="fixed inset-y-0 right-0 z-[70] w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col"
        [class.translate-x-full]="!showMobileFilters"
        [class.translate-x-0]="showMobileFilters"
      >
        <!-- Drawer Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 class="text-xl font-black text-gray-900 tracking-tight">Filters</h2>
          <button
            (click)="toggleMobileFilters()"
            class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        <!-- Drawer Content -->
        <div class="flex-grow p-6 overflow-y-auto space-y-8">
          <!-- Search Box -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Search</h3>
            <div class="relative">
              <input
                type="text"
                [ngModel]="currentSearch$ | async"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search products..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
              <i class="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
          </div>

          <!-- Category Selection -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Category</h3>
            <div class="space-y-1">
              <button
                *ngFor="let cat of categories$ | async"
                (click)="setCategory(cat); toggleMobileFilters()"
                class="w-full text-left py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                [class.bg-gray-100]="(currentCategory$ | async) === (cat === 'all' ? '' : cat)"
                [class.text-black]="(currentCategory$ | async) === (cat === 'all' ? '' : cat)"
                [class.font-bold]="(currentCategory$ | async) === (cat === 'all' ? '' : cat)"
                [class.text-gray-600]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
                [class.hover:bg-gray-50]="(currentCategory$ | async) !== (cat === 'all' ? '' : cat)"
              >
                {{ cat === 'all' ? 'All Pieces' : (cat | titlecase) }}
              </button>
            </div>
          </div>

          <!-- Subcategory Selection Mobile Drawer -->
          <div *ngIf="(subcategories$ | async) as subcats">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 mt-6">Subcategory</h3>
            <div class="space-y-1">
              <button
                *ngFor="let sub of (showAllSubcats ? subcats : (subcats | slice:0:10))"
                (click)="toggleSubcategory(sub); toggleMobileFilters()"
                class="w-full text-left py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                [class.bg-gray-100]="(currentSubcategory$ | async) === sub"
                [class.text-black]="(currentSubcategory$ | async) === sub"
                [class.font-bold]="(currentSubcategory$ | async) === sub"
                [class.text-gray-600]="(currentSubcategory$ | async) !== sub"
                [class.hover:bg-gray-50]="(currentSubcategory$ | async) !== sub"
              >
                {{ sub | titlecase }}
              </button>
              <button
                *ngIf="subcats.length > 10"
                (click)="showAllSubcats = !showAllSubcats"
                class="w-full text-left py-2.5 px-4 rounded-xl text-sm font-medium text-gray-500 transition-colors"
              >
                {{ showAllSubcats ? 'Show Less' : '+' + (subcats.length - 10) + ' more' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Drawer Actions Footer -->
        <div class="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
          <button
            (click)="resetFilters(); toggleMobileFilters()"
            class="flex-1 py-3 text-sm font-bold border border-gray-200 bg-white rounded-xl hover:border-black transition-colors"
          >
            Reset All
          </button>
          <button
            (click)="toggleMobileFilters()"
            class="flex-1 py-3 text-sm font-bold bg-black text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      </aside>
    </div>
  `,
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

  isLoadingMap: { [key: string]: boolean } = {};
  showMobileFilters = false;
  showAllSubcats = false;
  sortOptions = [
    { value: '', label: 'Featured', icon: 'star' },
    { value: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up-circle' },
    { value: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down-circle' }
  ];
  favoritedProducts: Set<string> = new Set();
  private destroy$ = new Subject<void>();

  /** True only when the shop's plan allows online selling (pro / custom). */
  get cartEnabled(): boolean {
    return this.shopContextService.isCartEnabled();
  }

  constructor(
    private websiteService: WebsiteService,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private tenantService: TenantService,
    private authService: AuthService,
    private shopContextService: ShopContextService,
    private optimizeImagePipe: OptimizeImagePipe
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
          }),
          // Eagerly preload the primary images for the listing so Cloudinary processing doesn't block lazy-loading
          tap((products: Product[]) => {
            setTimeout(() => {
              products.forEach(product => {
                if (product.images && product.images.length > 0) {
                  const preloader = new Image();
                  preloader.src = this.optimizeImagePipe.transform(product.images[0], 'card');
                }
              });
            }, 100);
          })
        );
      }),
    );
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['category']) {
        this.currentCategory$.next(params['category']);
      } else {
        this.currentCategory$.next('');
      }
      if (params['subcategory']) {
        this.currentSubcategory$.next(params['subcategory']);
      } else {
        this.currentSubcategory$.next('');
      }
      if (params['search']) {
        this.currentSearch$.next(params['search']);
      } else {
        this.currentSearch$.next('');
      }
      if (params['collection']) {
        this.currentCollection$.next(params['collection']);
      } else {
        this.currentCollection$.next('');
      }
      if (params['sort']) {
        this.currentSort$.next(params['sort']);
      } else {
        this.currentSort$.next('');
      }
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
    this.currentCollection$.next('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category || null, subcategory: null, collection: null },
      queryParamsHandling: 'merge',
    });
  }

  setSubcategory(sub: string) {
    this.currentSubcategory$.next(sub);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { subcategory: sub || null },
      queryParamsHandling: 'merge',
    });
  }

  toggleSubcategory(sub: string) {
    const current = this.currentSubcategory$.value;
    this.setSubcategory(current === sub ? '' : sub);
  }

  setSort(event: Event) {
    const sort = (event.target as HTMLSelectElement).value;
    this.currentSort$.next(sort);
  }

  onSearchChange(search: string) {
    this.currentSearch$.next(search);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: search || null },
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

  toggleMobileFiltersIfMobile() {
    if (window.innerWidth < 1024) {
      this.showMobileFilters = false;
    }
  }

  isFavorited(productId: string): boolean {
    return this.favoritedProducts.has(productId);
  }

  toggleFavorite(event: Event, productId: string) {
    event.stopPropagation();
    event.preventDefault();
    if (this.favoritedProducts.has(productId)) {
      this.favoritedProducts.delete(productId);
    } else {
      this.favoritedProducts.add(productId);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorited_products', JSON.stringify(Array.from(this.favoritedProducts)));
    }
  }

  hasColors(product: Product): boolean {
    return product.variants.some((v) => !!v.color);
  }

  getUniqueColors(product: Product): ProductVariant[] {
    const colors = new Set();
    return product.variants.filter((v) => {
      if (v.color && !colors.has(v.color)) {
        colors.add(v.color);
        return true;
      }
      return false;
    });
  }

  getColorHex(color?: string): string {
    if (!color) return '#ccc';
    const colorMap: { [key: string]: string } = {
      black: '#000000',
      white: '#ffffff',
      gray: '#808080',
      grey: '#808080',
      beige: '#f5f5dc',
      blue: '#0000ff',
      navy: '#000080',
      red: '#ff0000',
      green: '#008000',
      brown: '#a52a2a',
      yellow: '#ffff00',
      pink: '#ffc0cb',
      purple: '#800080',
      orange: '#ffa500',
      cream: '#fffdd0',
      tan: '#d2b48c',
      sand: '#c2b280'
    };
    return colorMap[color.toLowerCase()] || color;
  }

  isOutOfStock(product: Product): boolean {
    if (!product || !product.variants || product.variants.length === 0) return true;
    return product.variants.reduce((total, v) => total + (v.stock || 0), 0) <= 0;
  }

  quickAdd(event: Event, product: Product) {
    event.stopPropagation();
    event.preventDefault();
    if (product.variants && product.variants.length > 0) {
      if (this.authService.isAuthenticated()) {
        this.isLoadingMap[product.id] = true;

        // Simulating a quick network request feel before clearing loading
        setTimeout(() => {
          this.cartService.addToCart(product, 1, product.variants[0]);
          this.isLoadingMap[product.id] = false;
        }, 400);
      } else {
        this.router.navigate(
          ['/shop', this.tenantService.getPathSlug() || 'default', 'auth', 'login'],
          {
            queryParams: { returnUrl: this.router.url },
          },
        );
      }
    }
  }
}
