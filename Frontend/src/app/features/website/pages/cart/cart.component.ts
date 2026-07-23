import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { WebsiteService } from '../../services/website.service';
import { Product, ProductVariant } from '../../../../core/models/product.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { OptimizeImagePipe } from '../../../../shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, OptimizeImagePipe],
  template: `
    <div class="bg-[#fcfcfc] min-h-screen pt-12 pb-24 text-left">
      <div class="container mx-auto px-4 max-w-9xl animate-fade-in-up">
        <!-- Centered Serif Title -->
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 text-center tracking-tight uppercase mb-16 font-sans">
          Shopping Bag
        </h1>

        <ng-container *ngIf="cartItems$ | async as items">
          <div *ngIf="items.length > 0; else emptyCart" class="flex flex-col lg:flex-row gap-12 items-start">
            
            <!-- Left Column: Item Grid Cards -->
            <div class="lg:w-[65%] w-full grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div 
                *ngFor="let item of items; let i = index" 
                class="bg-white border border-gray-200/80 rounded-xl p-6 flex flex-col items-center relative group shadow-sm hover:shadow-md transition-shadow"
              >
                <!-- Remove Icon -->
                <button 
                  (click)="removeItem(i)" 
                  class="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors focus:outline-none"
                  title="Remove Item"
                >
                  <i class="bi bi-x-lg text-sm"></i>
                </button>

                <!-- Product Name Centered -->
                <h3 
                  [routerLink]="routePrefix.concat(['products', item.product.id])"
                  class="text-xs font-bold text-gray-900 hover:underline text-center cursor-pointer max-w-[85%] leading-tight"
                >
                  {{ item.product.name }}
                </h3>
                
                <!-- Color / Size display -->
                <p class="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest text-center">
                  <span *ngIf="item.variant?.color">{{ item.variant?.color }}</span>
                  <span *ngIf="item.variant?.color && item.variant?.size"> / </span>
                  <span *ngIf="item.variant?.size">{{ item.variant?.size }}</span>
                </p>

                <!-- Product Image aspect-[3/4] -->
                <div 
                  [routerLink]="routePrefix.concat(['products', item.product.id])"
                  class="w-full aspect-[3/4] bg-[#f8f9ff] rounded-lg overflow-hidden my-6 cursor-pointer"
                >
                  <img 
                    [src]="((item.product.images && item.product.images[0]) | optimizeImage:'thumbnail') || '/Cloth_placeholder.png'" 
                    [alt]="item.product.name" 
                    class="w-full h-full object-contain transition-transform duration-500 mix-blend-multiply"
                  />
                </div>

                <!-- Quantity pill selector -->
                <div class="flex items-center border border-gray-200 rounded-full overflow-hidden h-8.5 bg-white mb-6">
                  <button 
                    (click)="updateQuantity(i, item.quantity - 1)" 
                    class="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus:outline-none"
                    [disabled]="item.quantity <= 1"
                  >
                    <i class="bi bi-dash text-sm"></i>
                  </button>
                  <span class="px-3 text-center font-bold text-xs text-gray-900 select-none">
                    {{ item.quantity }}
                  </span>
                  <button 
                    (click)="updateQuantity(i, item.quantity + 1)" 
                    class="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus:outline-none"
                  >
                    <i class="bi bi-plus text-sm"></i>
                  </button>
                </div>

                <!-- Card Footer Subtotal border-t -->
                <div class="w-full border-t border-gray-100 pt-4 flex justify-between items-center text-xs font-semibold">
                  <span class="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Subtotal</span>
                  <span class="text-gray-900 font-bold">
                    {{ (item.variant?.price || item.product.variants[0]?.price || 0) * item.quantity | currency: 'INR' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right Column: Order Summary & Actions -->
            <div class="lg:w-[35%] w-full space-y-6">
              <div class="border border-gray-200/80 rounded-xl p-8 bg-white shadow-sm">
                <h2 class="text-xs font-bold text-gray-900 text-center uppercase tracking-widest mb-6 pb-4 border-b border-gray-100">
                  Order Summary
                </h2>

                <div class="space-y-4 text-xs font-semibold pb-6 border-b border-gray-100">
                  <div class="flex justify-between items-center text-gray-500">
                    <span>Subtotal</span>
                    <span class="font-bold text-gray-900">{{ cartTotal$ | async | currency: 'INR' }}</span>
                  </div>
                  <div class="flex justify-between items-center text-gray-500">
                    <span>Bag Total</span>
                    <span class="font-bold text-gray-900">{{ cartTotal$ | async | currency: 'INR' }}</span>
                  </div>
                </div>

                <!-- Gift Message Textbox -->
                <div class="mt-6 text-left">
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                    Add a gift message to your order
                  </label>
                  <textarea 
                    [(ngModel)]="giftMessage"
                    placeholder="Type your message here..."
                    class="w-full border border-gray-200 rounded-lg p-4 text-xs focus:outline-none focus:border-black transition-colors resize-none h-24 bg-gray-50/50"
                  ></textarea>
                </div>

                <!-- Shipping note & button -->
                <div class="mt-6 text-center">
                  <p class="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-4">
                    Shipping & taxes calculated at checkout
                  </p>
                  <button 
                    [routerLink]="routePrefix.concat(['checkout'])"
                    class="w-full bg-black text-white py-4 rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity focus:outline-none"
                  >
                    Go To Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty bag state -->
          <ng-template #emptyCart>
            <div
              class="text-center py-20 bg-white rounded-xl border border-gray-200 max-w-2xl mx-auto flex flex-col items-center shadow-sm"
            >
              <div
                class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner"
              >
                <i class="bi bi-bag-x text-3xl text-gray-300"></i>
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Your bag is empty</h2>
              <p class="text-gray-400 mb-8 text-sm max-w-xs">
                Looks like you haven't added anything to your cart yet. Discover our latest collections.
              </p>
              <button
                [routerLink]="routePrefix.concat(['products'])"
                class="bg-black text-white px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2 group"
              >
                Start Exploring
                <i class="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </ng-template>
        </ng-container>

        <!-- What to Wear Now (Recommended Grid) -->
        <div *ngIf="recommendedProducts$ | async as recommended" class="mt-28 pt-20 border-t border-gray-200">
          <h3 class="text-sm font-bold text-gray-900 text-center tracking-widest uppercase mb-12">
            What to Wear Now
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div *ngFor="let product of recommended" class="group relative flex flex-col cursor-pointer">
              <a [routerLink]="routePrefix.concat(['products', product.id])" class="block flex-grow flex flex-col">
                
                <!-- Card Image Container -->
                <div class="relative aspect-[3/4] bg-[#f8f9ff] overflow-hidden mb-4 rounded-xl">
                  <img 
                    [src]="((product.images && product.images[0]) | optimizeImage:'card') || '/Cloth_placeholder.png'" 
                    class="w-full h-full object-cover transition-transform duration-300" 
                    loading="lazy"
                  />
                  
                  <!-- Wishlist Toggle -->
                  <button 
                    (click)="toggleFavorite($event, product.id)" 
                    class="absolute top-3 right-3 text-gray-900 hover:text-red-500 transition-colors z-10 focus:outline-none"
                  >
                    <i 
                      class="bi text-base" 
                      [class.bi-heart]="!isFavorited(product.id)" 
                      [class.bi-heart-fill]="isFavorited(product.id)" 
                      [class.text-red-500]="isFavorited(product.id)"
                    ></i>
                  </button>

                  <!-- Quick Add Button -->
                  <button 
                    (click)="quickAdd($event, product)" 
                    class="absolute bottom-3 right-3 w-8 h-8 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm z-10 focus:outline-none" 
                    [disabled]="isLoadingMap[product.id]"
                  >
                    <i *ngIf="!isLoadingMap[product.id]" class="bi bi-plus text-lg"></i>
                    <span *ngIf="isLoadingMap[product.id]" class="w-4.5 h-4.5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></span>
                  </button>

                  <!-- Color Swatches Overlay on Hover -->
                  <div 
                    *ngIf="hasColors(product)" 
                    class="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex flex-col gap-1 border-t border-gray-100"
                  >
                    <span class="text-[9px] font-bold text-gray-900 uppercase tracking-widest">Colors</span>
                    <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let variant of getUniqueColors(product)"
                        [style.background-color]="getColorHex(variant.color)"
                        class="w-3.5 h-3.5 rounded-full border border-gray-200 block shadow-inner"
                        [title]="variant.color"
                      ></span>
                    </div>
                  </div>
                </div>

                <h4 class="text-[11px] font-bold text-gray-900 leading-tight group-hover:underline uppercase tracking-wide">
                  {{ product.name }}
                </h4>
                <p class="text-xs text-gray-500 font-semibold mt-1">{{ product.variants[0]?.price | currency: 'INR' }}</p>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class CartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  cartCount$: Observable<number>;
  recommendedProducts$: Observable<Product[]>;

  giftMessage = '';
  favoritedProducts: Set<string> = new Set();
  isLoadingMap: { [key: string]: boolean } = {};

  constructor(
    private cartService: CartService,
    private tenantService: TenantService,
    private websiteService: WebsiteService,
  ) {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.cartTotal$;
    this.cartCount$ = this.cartService.cartCount$;

    this.recommendedProducts$ = this.websiteService.getProducts({ limit: 4 });
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.loadFavorites();
  }

  updateQuantity(index: number, quantity: number) {
    if (quantity > 0) {
      this.cartService.updateQuantity(index, quantity);
    }
  }

  removeItem(index: number) {
    this.cartService.removeFromCart(index);
  }

  // Recommended products interactions
  toggleFavorite(event: Event, productId: string) {
    event.preventDefault();
    event.stopPropagation();
    if (this.favoritedProducts.has(productId)) {
      this.favoritedProducts.delete(productId);
    } else {
      this.favoritedProducts.add(productId);
    }
    this.saveFavorites();
  }

  isFavorited(productId: string): boolean {
    return this.favoritedProducts.has(productId);
  }

  quickAdd(event: Event, product: Product) {
    event.preventDefault();
    event.stopPropagation();

    this.isLoadingMap[product.id] = true;
    
    // Add first available variant
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    
    this.cartService.addToCart(
      product,
      1,
      variant ? {
        color: variant.color,
        size: variant.size,
        price: variant.price
      } : undefined
    );

    setTimeout(() => {
      this.isLoadingMap[product.id] = false;
    }, 500);
  }

  hasColors(product: Product): boolean {
    return product.variants?.some((v) => !!v.color) || false;
  }

  getUniqueColors(product: Product): ProductVariant[] {
    if (!product.variants) return [];
    const seen = new Set<string>();
    return product.variants.filter((v) => {
      if (!v.color) return false;
      const key = v.color.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
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

  private loadFavorites() {
    try {
      const stored = localStorage.getItem('wishlist_products');
      if (stored) {
        this.favoritedProducts = new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }

  private saveFavorites() {
    try {
      localStorage.setItem('wishlist_products', JSON.stringify(Array.from(this.favoritedProducts)));
    } catch (e) {
      console.error(e);
    }
  }
}
