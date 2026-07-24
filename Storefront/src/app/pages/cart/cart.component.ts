import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { Observable } from 'rxjs';
import { OptimizeImagePipe } from '../../shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-website-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, OptimizeImagePipe],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <h1 class="text-3xl font-black text-gray-900 mb-8 tracking-tight">Shopping Bag</h1>

        <div *ngIf="(cartItems$ | async) as items">
          <div *ngIf="items.length > 0; else emptyCart" class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-2 space-y-4">
              <div *ngFor="let item of items; let idx = index" class="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center">
                <img [src]="(item.product.images && item.product.images[0]) | optimizeImage:'thumbnail'" class="w-20 h-20 object-cover rounded-xl bg-gray-50" />
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900 text-sm">{{ item.product.name }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Price: ₹{{ item.variant?.price || item.product.variants[0]?.price }}</p>
                  
                  <div class="flex items-center gap-3 mt-3">
                    <button (click)="updateQuantity(idx, item.quantity - 1)" class="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs hover:bg-gray-200">-</button>
                    <span class="text-xs font-bold text-gray-900">{{ item.quantity }}</span>
                    <button (click)="updateQuantity(idx, item.quantity + 1)" class="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs hover:bg-gray-200">+</button>
                  </div>
                </div>
                <button (click)="removeItem(idx)" class="text-red-500 text-sm hover:text-red-700 p-2">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-gray-100 h-fit space-y-4">
              <h2 class="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">Order Summary</h2>
              <div class="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span class="font-bold text-gray-900">₹{{ cartTotal$ | async }}</span>
              </div>
              <div class="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span class="text-green-600 font-semibold">Calculated at Checkout</span>
              </div>
              <div class="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-gray-900">
                <span>Total</span>
                <span>₹{{ cartTotal$ | async }}</span>
              </div>

              <button
                (click)="proceedToCheckout()"
                class="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition"
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>

        <ng-template #emptyCart>
          <div class="bg-white rounded-3xl p-12 text-center border border-gray-100 max-w-md mx-auto">
            <i class="bi bi-bag-x text-5xl text-gray-300 mb-4 inline-block"></i>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Your Bag is Empty</h2>
            <p class="text-xs text-gray-500 mb-6">Looks like you haven't added any fashion items yet.</p>
            <a [routerLink]="routePrefix.concat(['products'])" class="inline-block bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold">
              Shop Collection
            </a>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class WebsiteCartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;

  constructor(
    private cartService: CartService,
    private tenantService: TenantService,
    private router: Router
  ) {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.cartTotal$;
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {}

  updateQuantity(index: number, qty: number) {
    this.cartService.updateQuantity(index, qty);
  }

  removeItem(index: number) {
    this.cartService.removeFromCart(index);
  }

  proceedToCheckout() {
    this.router.navigate([...this.routePrefix, 'checkout']);
  }
}
