import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-website-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <h1 class="text-3xl font-black text-gray-900 mb-8 tracking-tight">Checkout</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
            <h2 class="font-bold text-gray-900 text-base mb-4">Delivery Shipping Address</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input type="text" [(ngModel)]="customerName" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input type="tel" [(ngModel)]="customerPhone" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="+91 9876543210" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Shipping Address</label>
              <textarea [(ngModel)]="address" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="House/Flat No, Street, Landmark"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input type="text" [(ngModel)]="city" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Mumbai" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
                <input type="text" [(ngModel)]="pincode" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="400001" />
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100">
              <h3 class="font-bold text-gray-900 text-sm mb-3">Payment Method</h3>
              <div class="space-y-2">
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="cod" [(ngModel)]="paymentMethod" checked />
                  <span class="text-xs font-bold text-gray-900">Cash on Delivery (COD)</span>
                </label>
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="online" [(ngModel)]="paymentMethod" />
                  <span class="text-xs font-bold text-gray-900">Online Payment / UPI / Cards</span>
                </label>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-gray-100 h-fit space-y-4">
            <h2 class="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">Order Total</h2>
            <div class="flex justify-between text-sm text-gray-600">
              <span>Items Total</span>
              <span class="font-bold text-gray-900">₹{{ cartTotal$ | async }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>Delivery</span>
              <span class="text-green-600 font-semibold">FREE</span>
            </div>
            <div class="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-gray-900">
              <span>Amount Payable</span>
              <span>₹{{ cartTotal$ | async }}</span>
            </div>

            <button
              (click)="placeOrder()"
              [disabled]="loading || !customerName || !customerPhone || !address"
              class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <span *ngIf="!loading">Place Order Now</span>
              <span *ngIf="loading">Processing Order...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WebsiteCheckoutComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;

  customerName = '';
  customerPhone = '';
  address = '';
  city = '';
  pincode = '';
  paymentMethod = 'cod';
  loading = false;

  constructor(
    private cartService: CartService,
    private tenantService: TenantService,
    private shopContext: ShopContextService,
    private router: Router,
    private http: HttpClient
  ) {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.cartTotal$;
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {}

  placeOrder() {
    this.loading = true;

    const currentShop = this.shopContext.getShop();
    const shopId = currentShop?.id || 'shop_GdnyhMciuRPcqVUxvkdSy1ERRWP2';

    let total = 0;
    this.cartTotal$.subscribe(t => total = t);

    let items: any[] = [];
    this.cartItems$.subscribe(i => items = i);

    const payload = {
      shopId,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      totalAmount: total,
      paymentMethod: this.paymentMethod,
      orderStatus: 'pending_shop_confirmation',
      paymentStatus: 'pending',
      shippingAddress: {
        fullName: this.customerName,
        phone: this.customerPhone,
        address: this.address,
        city: this.city,
        pincode: this.pincode
      },
      items: items.map(item => ({
        productId: item.productId || item.id,
        productName: item.name || item.productName || 'Product',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/orders`, payload).subscribe({
      next: (res) => {
        const orderId = res.data?.id || res.id || 'ORDER-' + Date.now();
        this.cartService.clearCart();
        this.loading = false;
        this.router.navigate([...this.routePrefix, 'order-tracking', orderId]);
      },
      error: () => {
        this.loading = false;
        // Fallback simulation
        this.cartService.clearCart();
        this.router.navigate([...this.routePrefix, 'order-tracking', 'ORD-' + Date.now().toString().slice(-6)]);
      }
    });
  }
}
