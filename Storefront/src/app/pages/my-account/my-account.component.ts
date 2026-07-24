import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { WebsiteService } from '../../core/services/website.service';
import { Order } from '../../core/models/order.model';
import { Observable, firstValueFrom } from 'rxjs';

type AccountTab = 'orders' | 'wishlist' | 'addresses' | 'settings';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
<div class="min-h-screen bg-gray-50">
  <div class="max-w-6xl mx-auto px-4 py-12">

    <!-- Not logged in -->
    <div *ngIf="!user" class="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
      <i class="bi bi-person-circle text-5xl text-gray-300"></i>
      <h2 class="text-xl font-bold text-gray-900">You're not signed in</h2>
      <p class="text-sm text-gray-500">Please sign in to view your account.</p>
      <a [routerLink]="[...routePrefix, 'auth', 'login']" class="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">Sign In</a>
    </div>

    <!-- Logged in -->
    <div *ngIf="user">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Account</h1>
          <p class="text-sm text-gray-500 mt-1">{{ user.email || user.mobile }}</p>
        </div>
        <button (click)="logout()" class="text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-xl transition-colors">
          <i class="bi bi-box-arrow-right mr-1"></i> Sign Out
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto">
        <button *ngFor="let tab of tabs" (click)="activeTab = tab.id"
          [class.border-b-2]="activeTab === tab.id" [class.border-gray-900]="activeTab === tab.id" [class.text-gray-900]="activeTab === tab.id"
          class="px-4 py-3 text-sm font-semibold text-gray-500 whitespace-nowrap hover:text-gray-900 transition-colors">
          <i [class]="tab.icon + ' mr-1.5'"></i>{{ tab.label }}
        </button>
      </div>

      <!-- ORDERS TAB -->
      <div *ngIf="activeTab === 'orders'">
        <div *ngIf="loadingOrders" class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
        <div *ngIf="!loadingOrders && orders.length === 0" class="text-center py-16 text-gray-400 text-sm">
          <i class="bi bi-bag text-4xl block mb-3"></i> No orders yet.
        </div>
        <div class="space-y-4" *ngIf="!loadingOrders && orders.length > 0">
          <div *ngFor="let order of orders" class="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-sm transition-shadow">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-1">Order #{{ order.id.slice(-8).toUpperCase() }}</p>
                <p class="text-sm font-bold text-gray-900">{{ order.totalAmount | currency:'INR' }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ order.createdAt | date:'mediumDate' }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide"
                  [ngClass]="{
                    'bg-green-100 text-green-700': order.orderStatus === 'delivered',
                    'bg-blue-100 text-blue-700': order.orderStatus === 'shipped',
                    'bg-yellow-100 text-yellow-700': order.orderStatus === 'pending' || order.orderStatus === 'confirmed',
                    'bg-red-100 text-red-700': order.orderStatus === 'cancelled',
                    'bg-gray-100 text-gray-600': !['delivered','shipped','pending','confirmed','cancelled'].includes(order.orderStatus)
                  }">
                  {{ order.orderStatus | titlecase }}
                </span>
                <a [routerLink]="[...routePrefix, 'track', order.id]" class="text-xs text-gray-900 underline hover:no-underline font-semibold">Track Order</a>
              </div>
            </div>
            <!-- Products -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex gap-2 overflow-x-auto">
              <div *ngFor="let item of order.products" class="shrink-0 text-center">
                <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <img *ngIf="item.imageUrl" [src]="item.imageUrl" [alt]="item.productName" class="w-full h-full object-cover" />
                  <i *ngIf="!item.imageUrl" class="bi bi-image text-gray-300 text-xl flex items-center justify-center h-full"></i>
                </div>
                <p class="text-[10px] text-gray-500 mt-1 w-12 truncate">{{ item.productName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WISHLIST TAB -->
      <div *ngIf="activeTab === 'wishlist'">
        <div *ngIf="!user.wishlist || user.wishlist.length === 0" class="text-center py-16 text-gray-400 text-sm">
          <i class="bi bi-heart text-4xl block mb-3"></i> Your wishlist is empty.
          <br><a [routerLink]="[...routePrefix, 'products']" class="text-gray-900 font-semibold underline mt-2 inline-block">Browse Products</a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" *ngIf="user.wishlist && user.wishlist.length > 0">
          <div *ngFor="let productId of user.wishlist" class="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p class="text-xs text-gray-500">Product ID: {{ productId }}</p>
            <a [routerLink]="[...routePrefix, 'products', productId]" class="text-xs text-gray-900 underline font-semibold mt-2 inline-block">View Product</a>
          </div>
        </div>
      </div>

      <!-- ADDRESSES TAB -->
      <div *ngIf="activeTab === 'addresses'">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-gray-900">Saved Addresses</h3>
          <button *ngIf="!editingAddress" (click)="openAddressForm()"
            class="text-xs font-semibold bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
            + Add Address
          </button>
        </div>

        <!-- Address Form -->
        <div *ngIf="editingAddress" class="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
          <h4 class="text-sm font-bold text-gray-900 mb-4">{{ editingAddressIndex >= 0 ? 'Edit Address' : 'New Address' }}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input [(ngModel)]="addressForm.name" placeholder="Full Name *" class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.phone" placeholder="Phone *" class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.addressLine1" placeholder="Address Line 1 *" class="sm:col-span-2 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.addressLine2" placeholder="Address Line 2 (optional)" class="sm:col-span-2 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.city" placeholder="City *" class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.state" placeholder="State *" class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.postalCode" placeholder="Pincode *" class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
            <input [(ngModel)]="addressForm.country" placeholder="Country" class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
          </div>
          <div class="flex items-center gap-2 mt-4">
            <input type="checkbox" id="isDefault" [(ngModel)]="addressForm.isDefault" class="w-4 h-4" />
            <label for="isDefault" class="text-xs text-gray-700 font-medium">Set as default address</label>
          </div>
          <div *ngIf="addressError" class="text-xs text-red-600 mt-2">{{ addressError }}</div>
          <div class="flex gap-3 mt-4">
            <button (click)="saveAddress()" [disabled]="savingAddress"
              class="px-6 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
              {{ savingAddress ? 'Saving...' : 'Save Address' }}
            </button>
            <button (click)="cancelAddressForm()" class="px-6 py-2.5 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>

        <!-- Address List -->
        <div *ngIf="!editingAddress">
          <div *ngIf="!user.addresses || user.addresses.length === 0" class="text-center py-12 text-gray-400 text-sm">
            <i class="bi bi-geo-alt text-4xl block mb-3"></i> No saved addresses.
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div *ngFor="let addr of user.addresses; let i = index" class="bg-white border rounded-2xl p-5 relative"
              [class.border-gray-900]="addr.isDefault" [class.border-gray-200]="!addr.isDefault">
              <div *ngIf="addr.isDefault" class="absolute top-3 right-3 text-[10px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">Default</div>
              <p class="text-sm font-bold text-gray-900 mb-1">{{ addr.name }}</p>
              <p class="text-xs text-gray-500">{{ addr.phone }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ addr.addressLine1 }}, {{ addr.addressLine2 }}</p>
              <p class="text-xs text-gray-500">{{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p>
              <p class="text-xs text-gray-500">{{ addr.country }}</p>
              <div class="flex gap-3 mt-4">
                <button (click)="editAddress(i)" class="text-xs text-gray-900 underline font-semibold">Edit</button>
                <button (click)="deleteAddress(i)" class="text-xs text-red-600 underline font-semibold">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SETTINGS TAB -->
      <div *ngIf="activeTab === 'settings'">
        <div class="max-w-lg">
          <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <h3 class="text-sm font-bold text-gray-900 mb-4">Account Details</h3>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <span class="text-gray-500 text-xs">Name</span>
                <span class="font-semibold text-gray-900">{{ user.name || user.displayName || '—' }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <span class="text-gray-500 text-xs">Email</span>
                <span class="font-semibold text-gray-900">{{ user.email || '—' }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-gray-500 text-xs">Mobile</span>
                <span class="font-semibold text-gray-900">{{ user.mobile || user.phone || '—' }}</span>
              </div>
            </div>
          </div>

          <div class="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h3 class="text-sm font-bold text-red-700 mb-2">Danger Zone</h3>
            <p class="text-xs text-red-600 mb-4">Deleting your account is permanent and cannot be undone.</p>
            <button (click)="deleteAccount()" class="px-6 py-2.5 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors">Delete Account</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
})
export class MyAccountComponent implements OnInit {
  user: UserProfile | null = null;
  shopId: string | null = null;
  orders: Order[] = [];
  loadingOrders = false;
  activeTab: AccountTab = 'orders';
  addressError = '';
  editingAddress = false;
  savingAddress = false;
  editingAddressIndex = -1;
  addressForm: any = {};

  tabs = [
    { id: 'orders' as AccountTab, label: 'Orders', icon: 'bi bi-bag' },
    { id: 'wishlist' as AccountTab, label: 'Wishlist', icon: 'bi bi-heart' },
    { id: 'addresses' as AccountTab, label: 'Addresses', icon: 'bi bi-geo-alt' },
    { id: 'settings' as AccountTab, label: 'Settings', icon: 'bi bi-gear' },
  ];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private customerService: CustomerService,
    private toastService: ToastService,
    private tenantService: TenantService,
    private shopContext: ShopContextService,
    private router: Router,
  ) {}

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (!user) return;
      this.shopContext.shopConfig$.subscribe((config) => {
        this.shopId = config?.id || null;
        this.loadOrders(user);
      });
    });
  }

  loadOrders(user: UserProfile) {
    if (!this.shopId) return;
    this.loadingOrders = true;
    this.orderService.getMyOrders(this.shopId, undefined, user.email).subscribe({
      next: (res) => {
        this.orders = (res.data || []).sort((a: any, b: any) => {
          const da = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const db = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return db - da;
        });
        this.loadingOrders = false;
      },
      error: () => { this.loadingOrders = false; }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(this.routePrefix);
  }

  openAddressForm() {
    this.editingAddress = true;
    this.editingAddressIndex = -1;
    this.addressForm = {
      name: this.user?.name || '',
      phone: this.user?.mobile || this.user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: !this.user?.addresses?.length,
    };
  }

  editAddress(index: number) {
    if (!this.user?.addresses) return;
    this.addressError = '';
    this.editingAddress = true;
    this.editingAddressIndex = index;
    this.addressForm = { ...this.user.addresses[index] };
  }

  cancelAddressForm() {
    this.addressError = '';
    this.editingAddress = false;
    this.addressForm = {};
  }

  async saveAddress() {
    if (!this.user?.uid) return;
    if (!this.addressForm.name || !this.addressForm.phone || !this.addressForm.addressLine1 || !this.addressForm.city || !this.addressForm.state || !this.addressForm.postalCode) {
      this.addressError = 'Please fill all required fields.';
      return;
    }
    this.savingAddress = true;
    this.addressError = '';
    const addresses = this.user.addresses ? [...this.user.addresses] : [];
    if (this.addressForm.isDefault) addresses.forEach((a: any) => (a.isDefault = false));
    if (addresses.length === 0) this.addressForm.isDefault = true;
    if (this.editingAddressIndex >= 0) {
      addresses[this.editingAddressIndex] = { ...this.addressForm };
    } else {
      this.addressForm.id = Math.random().toString(36).substring(2, 9);
      addresses.push({ ...this.addressForm });
    }
    try {
      await this.authService.updateUserProfile(this.user.uid, { addresses });
      if (this.shopId) {
        this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe((res) => {
          if (res.success && res.data?.id) this.customerService.updateCustomer(res.data.id, { addresses }).subscribe();
        });
      }
      this.user.addresses = addresses;
      this.toastService.showSuccess('Address saved!');
      this.cancelAddressForm();
    } catch { this.toastService.showError('Error saving address.'); }
    finally { this.savingAddress = false; }
  }

  async deleteAddress(index: number) {
    if (!this.user?.uid || !this.user.addresses) return;
    if (!confirm('Delete this address?')) return;
    const addresses = [...this.user.addresses];
    const wasDefault = addresses[index].isDefault;
    addresses.splice(index, 1);
    if (wasDefault && addresses.length > 0) addresses[0].isDefault = true;
    try {
      await this.authService.updateUserProfile(this.user.uid, { addresses });
      this.user.addresses = addresses;
      this.toastService.showSuccess('Address deleted.');
    } catch { this.toastService.showError('Error deleting address.'); }
  }

  async deleteAccount() {
    if (!this.user?.uid) return;
    if (!confirm('Are you sure? This cannot be undone.')) return;
    if (this.shopId) {
      this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe(async (res) => {
        if (res.success && res.data?.id) await firstValueFrom(this.customerService.deleteCustomer(res.data.id!));
        const deleteRes = await this.authService.deleteAuthUser();
        if (deleteRes.success) {
          this.toastService.showSuccess('Account deleted.');
          setTimeout(() => this.router.navigate(this.routePrefix), 1500);
        } else {
          this.toastService.showError('Could not delete account. Please sign in again.');
        }
      });
    }
  }
}
