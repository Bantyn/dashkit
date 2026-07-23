import { WebsiteService } from '../../services/website.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { ShopContextService, ShopConfig } from '../../../../core/services/shop-context.service';
import { OrderService } from '../../../../core/services/order.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { Order } from '../../../../core/models/order.model';
import { Observable, of, combineLatest } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="bg-white min-h-screen">
      <div class="max-w-[1600px] mx-auto px-6 md:px-12 py-16">
        <div class="flex flex-col lg:flex-row gap-12">
          
          <!-- Sidebar -->
          <aside class="lg:w-80 flex-shrink-0 lg:border-r lg:border-gray-100 lg:pr-12">
            <!-- Sidebar Header -->
            <div class="mb-10 text-left">
              <h2 class="text-2xl font-medium text-gray-900 mb-2 tracking-tight">My Account</h2>
              <p class="text-sm text-gray-500" *ngIf="user">
                Welcome back, {{ user.displayName || 'User' }}
              </p>
            </div>

            <!-- User details in sidebar (Clean & Flat) -->
            <div class="mb-8 p-5 bg-gray-50/50 rounded-lg text-left" *ngIf="user">
              <p class="text-sm font-bold text-gray-900 truncate">{{ user.displayName || 'User' }}</p>
              <p class="text-xs text-gray-500 truncate mt-0.5">{{ user.email || user.mobile }}</p>
            </div>

            <!-- Mobile Nav (horizontal scrollable) -->
            <div class="lg:hidden flex overflow-x-auto border-b border-gray-100 scrollbar-hide mb-8">
              <button
                *ngFor="let item of sidebarItems"
                (click)="item.key === 'signout' ? logout() : switchTab(item.key)"
                class="flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2"
                [class.border-gray-900]="activeTab === item.key"
                [class.text-gray-900]="activeTab === item.key"
                [class.border-transparent]="activeTab !== item.key"
                [class.text-gray-500]="activeTab !== item.key"
              >
                <i [class]="item.icon + ' mr-1.5'"></i>
                {{ item.label }}
              </button>
            </div>

            <!-- Desktop Nav (vertical) -->
            <ul class="hidden lg:block space-y-1">
              <li *ngFor="let item of sidebarItems">
                <button
                  (click)="item.key === 'signout' ? logout() : switchTab(item.key)"
                  class="w-full flex items-center gap-3 py-3 px-4 text-sm font-medium transition-all duration-200 rounded-lg text-left"
                  [class.bg-gray-50]="activeTab === item.key && item.key !== 'signout'"
                  [class.text-gray-900]="activeTab === item.key && item.key !== 'signout'"
                  [class.text-gray-500]="activeTab !== item.key && item.key !== 'signout'"
                  [class.hover:text-gray-900]="activeTab !== item.key && item.key !== 'signout'"
                  [class.text-red-500]="item.key === 'signout'"
                  [class.hover:bg-red-50/50]="item.key === 'signout'"
                >
                  <i [class]="item.icon + ' text-base'"></i>
                  {{ item.label }}
                </button>
              </li>
            </ul>
          </aside>

          <!-- Main Content -->
          <main class="flex-grow min-w-0 text-left">
            <!-- Overview Tab -->
            <div *ngIf="activeTab === 'overview'" class="animate-fade-in space-y-10">
              <div>
                <h2 class="text-3xl font-medium text-gray-900 tracking-tight">Account Overview</h2>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="user">
                <div class="p-6 bg-gray-50/50 rounded-lg">
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Name</p>
                  <p class="text-sm font-medium text-gray-900">{{ user.displayName || '-' }}</p>
                </div>
                <div class="p-6 bg-gray-50/50 rounded-lg">
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email</p>
                  <p class="text-sm font-medium text-gray-900">{{ user.email || '-' }}</p>
                </div>
                <div class="p-6 bg-gray-50/50 rounded-lg">
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</p>
                  <p class="text-sm font-medium text-gray-900">{{ user.mobile || user.phone || '-' }}</p>
                </div>
                <div class="p-6 bg-gray-50/50 rounded-lg">
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</p>
                  <p class="text-sm font-medium text-gray-900">{{ user.dateOfBirth ? (user.dateOfBirth | date: 'mediumDate') : '-' }}</p>
                </div>
                <div class="p-6 bg-gray-50/50 rounded-lg">
                  <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Member Since</p>
                  <p class="text-sm font-medium text-gray-900">{{ toDate(user.createdAt) | date: 'mediumDate' }}</p>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="pt-8 border-t border-gray-100">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Quick Actions</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button (click)="activeTab = 'orders'" class="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all group">
                    <i class="bi bi-box-seam text-xl text-gray-400 group-hover:text-gray-900 transition-colors"></i>
                    <span class="text-xs font-semibold text-gray-600 group-hover:text-gray-900">My Orders</span>
                  </button>
                  <button (click)="activeTab = 'tracking'" class="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all group">
                    <i class="bi bi-truck text-xl text-gray-400 group-hover:text-gray-900 transition-colors"></i>
                    <span class="text-xs font-semibold text-gray-600 group-hover:text-gray-900">Track Order</span>
                  </button>
                  <button (click)="activeTab = 'wishlist'" class="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all group">
                    <i class="bi bi-heart text-xl text-gray-400 group-hover:text-gray-900 transition-colors"></i>
                    <span class="text-xs font-semibold text-gray-600 group-hover:text-gray-900">Wishlist</span>
                  </button>
                  <button (click)="activeTab = 'settings'" class="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all group">
                    <i class="bi bi-gear text-xl text-gray-400 group-hover:text-gray-900 transition-colors"></i>
                    <span class="text-xs font-semibold text-gray-600 group-hover:text-gray-900">Settings</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- My Orders Tab -->
            <div *ngIf="activeTab === 'orders'" class="animate-fade-in space-y-6">
              <div>
                <h2 class="text-3xl font-medium text-gray-900 tracking-tight">My Orders</h2>
                <p class="text-sm text-gray-500 mt-1">View and manage your orders</p>
              </div>

              <!-- Filter Tabs -->
              <div class="flex gap-8 border-b border-gray-200 overflow-x-auto">
                <button
                  *ngFor="let filter of orderFilters"
                  (click)="activeOrderFilter = filter"
                  class="pb-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
                  [class.border-black]="activeOrderFilter === filter"
                  [class.text-gray-900]="activeOrderFilter === filter"
                  [class.border-transparent]="activeOrderFilter !== filter"
                  [class.text-gray-400]="activeOrderFilter !== filter"
                >
                  {{ filter }}
                </button>
              </div>

              <!-- Loading State -->
              <div *ngIf="loadingOrders" class="py-12 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p class="text-gray-500 text-sm">Loading your orders...</p>
              </div>

              <!-- Orders List -->
              <div *ngIf="!loadingOrders && filteredOrders.length > 0" class="space-y-4">
                <div *ngFor="let order of filteredOrders" class="border border-gray-200 rounded-lg p-5 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <div class="flex items-center gap-6">
                    <!-- First Product Image -->
                    <div class="w-16 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                      <img 
                        [src]="order.products[0]?.imageUrl || 'https://placehold.co/100x120?text=No+Image'" 
                        alt="Product" 
                        class="w-full h-full object-cover"
                        onerror="this.src='https://placehold.co/100x120?text=No+Image'"
                      />
                    </div>
                    
                    <!-- Order Info -->
                    <div>
                      <h4 class="text-sm font-bold text-gray-900">Order #{{ order.id | slice:0:9 | uppercase }}</h4>
                      <p class="text-[13px] text-gray-500 mt-0.5">{{ toDate(order.createdAt) | date: 'mediumDate' }}</p>
                    </div>
                  </div>

                  <!-- Items Count -->
                  <div class="hidden sm:block text-[13px] text-gray-500 font-medium w-16 text-center">
                    {{ (order.products.length || 0) }} Item{{ (order.products.length || 0) !== 1 ? 's' : '' }}
                  </div>

                  <!-- Price -->
                  <div class="hidden sm:block text-sm text-gray-900 font-medium w-20 text-center">
                    ₹ {{ order.totalAmount | number:'1.0-0' }}/-
                  </div>

                  <!-- Status -->
                  <div class="hidden md:flex items-center gap-2 w-28">
                    <span 
                      class="w-2 h-2 rounded-full"
                      [ngClass]="{
                        'bg-green-600': order.orderStatus === 'delivered',
                        'bg-blue-600': order.orderStatus === 'shipped',
                        'bg-orange-500': order.orderStatus === 'pending' || order.orderStatus === 'confirmed',
                        'bg-red-600': order.orderStatus === 'cancelled'
                      }"
                    ></span>
                    <span 
                      class="text-[13px] font-bold capitalize"
                      [ngClass]="{
                        'text-green-600': order.orderStatus === 'delivered',
                        'text-blue-600': order.orderStatus === 'shipped',
                        'text-orange-500': order.orderStatus === 'pending' || order.orderStatus === 'confirmed',
                        'text-red-600': order.orderStatus === 'cancelled'
                      }"
                    >
                      {{ order.orderStatus === 'pending' || order.orderStatus === 'confirmed' ? 'Processing' : order.orderStatus }}
                    </span>
                  </div>

                  <!-- Action Link -->
                  <div>
                    <a [routerLink]="routePrefix.concat(['orders', order.id])" class="text-[13px] font-bold text-gray-900 hover:underline flex items-center gap-1.5 underline-offset-4 decoration-1 decoration-gray-400 cursor-pointer">
                      View Details <i class="bi bi-chevron-right text-[10px]"></i>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div *ngIf="!loadingOrders && filteredOrders.length === 0" class="py-16 text-center border border-dashed border-gray-200 rounded-lg">
                <i class="bi bi-box-seam text-4xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-500 font-medium">No orders found</p>
                <p class="text-xs text-gray-400 mt-1">Your order history will appear here</p>
                <a [routerLink]="routePrefix.concat(['products'])" class="inline-block mt-6 px-6 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors">
                  Start Shopping
                </a>
              </div>
            </div>

            <!-- Order Tracking Tab -->
            <div *ngIf="activeTab === 'tracking'" class="animate-fade-in space-y-6">
              <div>
                <h2 class="text-3xl font-medium text-gray-900 tracking-tight">Order Tracking</h2>
                <p class="text-sm text-gray-500 mt-1">Enter your order number to track your package</p>
              </div>
              
              <!-- Search Box -->
              <div *ngIf="!trackedOrder" class="max-w-lg">
                <div class="flex gap-3">
                  <input
                    type="text"
                    [(ngModel)]="trackingOrderId"
                    placeholder="Enter order number (e.g., ORD-12345)"
                    class="flex-1 px-4 py-3 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-all"
                  />
                  <button
                    (click)="trackOrder()"
                    [disabled]="loadingTracking"
                    class="px-6 py-3 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    <span *ngIf="!loadingTracking">Track</span>
                    <span *ngIf="loadingTracking" class="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  </button>
                </div>
                <p *ngIf="trackingError" class="text-sm text-red-600 mt-2 font-medium">{{ trackingError }}</p>
              </div>

              <!-- Real-time Tracking Results Visualizer -->
              <div *ngIf="trackedOrder" class="space-y-8 animate-fade-in">
                <!-- Back Button -->
                <button (click)="trackedOrder = null; trackingOrderId = ''" class="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1">
                  <i class="bi bi-arrow-left"></i> Track Another Order
                </button>

                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <!-- Left: Order Details & Address -->
                  <div class="lg:col-span-3 space-y-6">
                    <!-- Order Summary Card -->
                    <div class="border border-gray-200 rounded-lg p-6">
                      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div>
                          <h3 class="text-lg font-bold text-gray-900">Order #{{ trackedOrder.id | slice:0:9 | uppercase }}</h3>
                          <p class="text-xs text-gray-500 mt-0.5">Placed on {{ toDate(trackedOrder.createdAt) | date: 'MMMM d, y' }} at {{ toDate(trackedOrder.createdAt) | date: 'h:mm a' }}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-sm text-gray-500 font-medium">{{ trackedOrder.products.length || 0 }} Items</p>
                          <p class="text-lg font-black text-gray-900 mt-0.5">{{ trackedOrder.totalAmount | currency:'USD':'symbol':'1.0-0' }}</p>
                        </div>
                      </div>

                      <!-- Current Status Detail -->
                      <div class="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-sm text-gray-600">Current Status</span>
                        <span 
                          class="text-sm font-bold uppercase tracking-wider px-3 py-1 bg-gray-50 rounded-full"
                          [ngClass]="{
                            'text-green-600': trackedOrder.orderStatus === 'delivered',
                            'text-blue-600': trackedOrder.orderStatus === 'shipped',
                            'text-orange-500': trackedOrder.orderStatus === 'pending' || trackedOrder.orderStatus === 'confirmed',
                            'text-red-600': trackedOrder.orderStatus === 'cancelled'
                          }"
                        >
                          {{ trackedOrder.orderStatus === 'pending' || trackedOrder.orderStatus === 'confirmed' ? 'Processing' : trackedOrder.orderStatus }}
                        </span>
                      </div>
                    </div>

                    <!-- Shipping Address Card -->
                    <div class="border border-gray-200 rounded-lg p-6">
                      <h4 class="text-sm font-bold text-gray-900 mb-4">Shipping Address</h4>
                      <div class="text-sm text-gray-600 leading-relaxed">
                        <p class="font-semibold text-gray-900 mb-1">{{ trackedOrder.shippingAddress?.name || user?.displayName }}</p>
                        <p>{{ trackedOrder.shippingAddress?.addressLine1 }}</p>
                        <p *ngIf="trackedOrder.shippingAddress?.addressLine2">{{ trackedOrder.shippingAddress?.addressLine2 }}</p>
                        <p>{{ trackedOrder.shippingAddress?.city }}, {{ trackedOrder.shippingAddress?.state }} {{ trackedOrder.shippingAddress?.postalCode }}</p>
                        <p>{{ trackedOrder.shippingAddress?.country || 'India' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Vertical Timeline -->
                  <div class="lg:col-span-2">
                    <div class="border border-gray-200 rounded-lg p-6">
                      <h4 class="text-sm font-bold text-gray-900 mb-6">Tracking Timeline</h4>
                      
                      <div class="relative">
                        <!-- Connect Line -->
                        <div class="absolute left-[15px] top-6 bottom-6 w-px bg-gray-200"></div>
                        <!-- Active Progress Indicator -->
                        <div 
                          class="absolute left-[15px] top-6 w-px bg-green-500 transition-all duration-700 ease-out"
                          [style.height]="getTrackingProgressHeight(getTrackingSteps(trackedOrder))"
                        ></div>

                        <!-- Steps -->
                        <div class="space-y-6">
                          <div 
                            *ngFor="let step of getTrackingSteps(trackedOrder); let i = index" 
                            class="relative flex items-start gap-4"
                          >
                            <!-- Step indicator dot -->
                            <div class="relative z-10 flex-shrink-0 mt-0.5">
                              <!-- Completed checkmark -->
                              <div 
                                *ngIf="step.completed" 
                                class="w-[30px] h-[30px] rounded-full bg-green-500 flex items-center justify-center shadow-sm"
                              >
                                <i class="bi bi-check text-white text-base"></i>
                              </div>
                              <!-- Next pending -->
                              <div 
                                *ngIf="!step.completed && i === getTrackingStepIndex(getTrackingSteps(trackedOrder)) + 1" 
                                class="w-[30px] h-[30px] rounded-full bg-white border-2 border-gray-300 flex items-center justify-center"
                              >
                                <i [class]="step.icon + ' text-gray-500 text-xs'"></i>
                              </div>
                              <!-- Future step -->
                              <div 
                                *ngIf="!step.completed && i !== getTrackingStepIndex(getTrackingSteps(trackedOrder)) + 1" 
                                class="w-[30px] h-[30px] rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center"
                              >
                                <i [class]="step.icon + ' text-gray-300 text-xs'"></i>
                              </div>
                            </div>

                            <!-- Content -->
                            <div class="pt-0.5">
                              <h5 
                                class="text-sm font-bold"
                                [class.text-gray-900]="step.completed"
                                [class.text-gray-400]="!step.completed"
                              >
                                {{ step.label }}
                              </h5>
                              <p 
                                *ngIf="step.date" 
                                class="text-xs text-gray-500 mt-0.5"
                              >
                                {{ toDate(step.date) | date: 'MMMM d, y' }} at {{ toDate(step.date) | date: 'h:mm a' }}
                              </p>
                              <p 
                                *ngIf="!step.date" 
                                class="text-xs text-gray-300 mt-0.5"
                              >
                                Pending
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Wishlist Tab -->
            <div *ngIf="activeTab === 'wishlist'" class="animate-fade-in space-y-6">
              <div>
                <h2 class="text-3xl font-medium text-gray-900 tracking-tight">Wishlist</h2>
                <p class="text-sm text-gray-500 mt-1">Items you've saved for later</p>
              </div>
              
              <div *ngIf="loadingWishlist" class="text-center py-16">
                <span class="inline-block animate-spin border-4 border-gray-200 border-t-black rounded-full w-8 h-8"></span>
              </div>
              
              <div *ngIf="!loadingWishlist && wishlistProducts.length === 0" class="text-center py-16 border border-dashed border-gray-200 rounded-lg">
                <i class="bi bi-heart text-4xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-500 font-medium">Your wishlist is empty</p>
                <p class="text-xs text-gray-400 mt-1">Browse products and add your favorites</p>
                <a [routerLink]="routePrefix.concat(['products'])" class="inline-block mt-6 px-6 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors">
                  Browse Products
                </a>
              </div>
              
              <div *ngIf="!loadingWishlist && wishlistProducts.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div *ngFor="let product of wishlistProducts" class="group relative flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <a [routerLink]="routePrefix.concat(['products', product.id])" class="relative aspect-[3/4] overflow-hidden bg-gray-100 block">
                    <img [src]="(product.images && product.images.length > 0) ? (product.images[0]) : '/Cloth_placeholder.png'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </a>
                  <div class="p-4 flex flex-col flex-1">
                    <p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1 line-clamp-1">{{ product.category || 'Apparel' }}</p>
                    <a [routerLink]="routePrefix.concat(['products', product.id])" class="font-bold text-sm text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2">{{ product.name }}</a>
                    <div class="mt-auto pt-2 flex items-center justify-between">
                      <span class="font-black text-gray-900">{{ product.variants[0]?.price | currency: 'INR' }}</span>
                      <button (click)="removeFromWishlist(product.id)" class="text-gray-400 hover:text-red-500 transition-colors" title="Remove from wishlist">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Address Book Tab -->
            <div *ngIf="activeTab === 'addresses'" class="animate-fade-in space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-3xl font-medium text-gray-900 tracking-tight">Address Book</h2>
                  <p class="text-sm text-gray-500 mt-1">Manage your delivery addresses</p>
                </div>
                <button *ngIf="!editingAddress" (click)="openAddressForm()" class="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors">
                  Add Address
                </button>
              </div>
              
              <!-- Address Form -->
              <div *ngIf="editingAddress" class="border border-gray-200 rounded-lg p-6 bg-white animate-fade-in">
                <h3 class="text-lg font-bold text-gray-900 mb-6">{{ addressForm.id ? 'Edit Address' : 'Add New Address' }}</h3>
                <div *ngIf="addressError" class="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-semibold">
                  {{ addressError }}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Full Name *</label>
                    <input type="text" [(ngModel)]="addressForm.name" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="e.g. John Doe">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Phone Number *</label>
                    <input type="tel" [(ngModel)]="addressForm.phone" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="10-digit number">
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Address Line 1 *</label>
                    <input type="text" [(ngModel)]="addressForm.addressLine1" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="Street, House/Flat No.">
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Address Line 2 (Optional)</label>
                    <input type="text" [(ngModel)]="addressForm.addressLine2" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="Apartment, Suite, Landmark">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">City *</label>
                    <input type="text" [(ngModel)]="addressForm.city" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="City">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">State *</label>
                    <input type="text" [(ngModel)]="addressForm.state" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="State">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Postal Code *</label>
                    <input type="text" [(ngModel)]="addressForm.postalCode" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none" placeholder="PIN / ZIP Code">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Country</label>
                    <input type="text" [(ngModel)]="addressForm.country" class="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:border-gray-900 focus:outline-none bg-gray-50" readonly>
                  </div>
                  <div class="md:col-span-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" id="isDefault" [(ngModel)]="addressForm.isDefault" class="rounded text-gray-900 focus:ring-gray-900">
                    <label for="isDefault" class="text-sm text-gray-700">Set as default shipping address</label>
                  </div>
                </div>
                <div class="flex items-center gap-3 mt-8">
                  <button (click)="saveAddress()" [disabled]="savingAddress" class="px-6 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors disabled:opacity-50">
                    <span *ngIf="savingAddress" class="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3 mr-1"></span>
                    Save Address
                  </button>
                  <button (click)="cancelAddressForm()" class="px-6 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Address List -->
              <div *ngIf="!editingAddress && user?.addresses?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div *ngFor="let addr of user?.addresses; let i = index" class="border border-gray-200 rounded-lg p-5 relative hover:border-gray-300 transition-colors">
                  <div *ngIf="addr.isDefault" class="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg rounded-tr-lg">
                    Default
                  </div>
                  <h4 class="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <i class="bi bi-geo-alt text-gray-400"></i>
                    {{ addr.name }}
                  </h4>
                  <p class="text-sm text-gray-600 mt-2">{{ addr.addressLine1 }}</p>
                  <p class="text-sm text-gray-600" *ngIf="addr.addressLine2">{{ addr.addressLine2 }}</p>
                  <p class="text-sm text-gray-600">{{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p>
                  <p class="text-sm text-gray-600 mb-3">{{ addr.country }}</p>
                  <p class="text-sm font-medium text-gray-900 flex items-center gap-1.5"><i class="bi bi-telephone text-gray-400"></i> {{ addr.phone }}</p>
                  
                  <div class="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4">
                    <button (click)="editAddress(i)" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider flex items-center gap-1"><i class="bi bi-pencil"></i> Edit</button>
                    <button (click)="deleteAddress(i)" class="text-xs font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider flex items-center gap-1"><i class="bi bi-trash"></i> Delete</button>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div *ngIf="!editingAddress && !user?.addresses?.length" class="text-center py-16 border border-dashed border-gray-200 rounded-lg">
                <i class="bi bi-geo-alt text-4xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-500 font-medium">No saved addresses</p>
                <p class="text-xs text-gray-400 mt-1">Add a delivery address to get started</p>
              </div>
            </div>

            <!-- Payment Methods Tab -->
            <div *ngIf="activeTab === 'payments'" class="animate-fade-in space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-3xl font-medium text-gray-900 tracking-tight">Payment Methods</h2>
                  <p class="text-sm text-gray-500 mt-1">Manage your saved payment methods</p>
                </div>
                <button class="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-black transition-colors">
                  Add Method
                </button>
              </div>
              
              <div class="text-center py-16 border border-dashed border-gray-200 rounded-lg">
                <i class="bi bi-credit-card text-4xl text-gray-300 mb-4 block"></i>
                <p class="text-gray-500 font-medium">No saved payment methods</p>
                <p class="text-xs text-gray-400 mt-1">Payment methods will be saved during checkout</p>
              </div>
            </div>

            <!-- Account Settings Tab -->
            <div *ngIf="activeTab === 'settings'" class="animate-fade-in space-y-6">
              <div>
                <h2 class="text-3xl font-medium text-gray-900 tracking-tight">Account Settings</h2>
              </div>

              <div class="space-y-6" *ngIf="user">
                <!-- Profile Section -->
                <div class="p-6 border border-gray-200 rounded-lg">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-gray-900">Profile Information</h3>
                    <button *ngIf="!editMode" (click)="toggleEditMode()" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      <i class="bi bi-pencil mr-1"></i>Edit
                    </button>
                    <div *ngIf="editMode" class="flex items-center gap-2">
                      <button (click)="toggleEditMode()" [disabled]="savingProfile" class="text-xs font-bold text-gray-500 hover:text-gray-700 disabled:opacity-50">
                        Cancel
                      </button>
                      <button (click)="saveProfile()" [disabled]="savingProfile" class="text-xs px-3 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50">
                        <span *ngIf="savingProfile" class="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3 mr-1"></span>
                        Save
                      </button>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        [(ngModel)]="profileForm.displayName"
                        [readonly]="!editMode"
                        [class.bg-white]="editMode"
                        [class.bg-gray-50]="!editMode"
                        [class.border-indigo-300]="editMode"
                        class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded text-gray-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        [value]="user.email || ''"
                        readonly
                        class="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700 focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
                      <input
                        type="tel"
                        [(ngModel)]="profileForm.mobile"
                        [readonly]="!editMode"
                        [class.bg-white]="editMode"
                        [class.bg-gray-50]="!editMode"
                        [class.border-indigo-300]="editMode"
                        class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded text-gray-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        [(ngModel)]="profileForm.dateOfBirth"
                        [readonly]="!editMode"
                        [class.bg-white]="editMode"
                        [class.bg-gray-50]="!editMode"
                        [class.border-indigo-300]="editMode"
                        class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded text-gray-700 focus:outline-none"
                      />
                    </div>
                    <div class="md:col-span-2">
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                      <textarea
                        [(ngModel)]="profileForm.address"
                        [readonly]="!editMode"
                        [class.bg-white]="editMode"
                        [class.bg-gray-50]="!editMode"
                        [class.border-indigo-300]="editMode"
                        rows="2"
                        class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded text-gray-700 focus:outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Danger Zone -->
                <div class="p-6 border border-red-200 rounded-lg bg-red-50/20">
                  <h3 class="text-sm font-bold text-red-700 mb-2">Danger Zone</h3>
                  <p class="text-xs text-red-600/70 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button (click)="deleteAccount()" class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </main>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class MyAccountComponent implements OnInit {
  user: UserProfile | null = null;
  activeTab = 'overview';
  activeOrderFilter = 'All Orders';
  wishlistProducts: any[] = [];
  loadingWishlist = false;
  trackingOrderId = '';
  shopId = 'shop_default';
  
  orders: Order[] = [];
  loadingOrders = true;
  trackedOrder: Order | null = null;
  loadingTracking = false;
  trackingError = '';
  addressError = '';

  orderFilters = ['All Orders', 'Processing', 'Shipped', 'Delivered', 'Returns'];

  sidebarItems = [
    { key: 'overview', label: 'Overview', icon: 'bi bi-person' },
    { key: 'orders', label: 'My Orders', icon: 'bi bi-box-seam' },
    { key: 'tracking', label: 'Order Tracking', icon: 'bi bi-truck' },
    { key: 'wishlist', label: 'Wishlist', icon: 'bi bi-heart' },
    { key: 'addresses', label: 'Address Book', icon: 'bi bi-geo-alt' },
    { key: 'payments', label: 'Payment Methods', icon: 'bi bi-credit-card' },
    { key: 'settings', label: 'Account Settings', icon: 'bi bi-gear' },
    { key: 'signout', label: 'Sign Out', icon: 'bi bi-box-arrow-right' },
  ];

  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
    private orderService: OrderService,
    private customerService: CustomerService,
    private shopContextService: ShopContextService,
    private websiteService: WebsiteService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
  ) {}

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    if (slug) {
      return ['/shop', slug];
    }
    return ['/'];
  }

  ngOnInit() {
    combineLatest([
      this.shopContextService.shopConfig$,
      this.authService.currentUser$
    ]).subscribe(([config, user]) => {
      if (config && config.id) {
        this.shopId = config.id;
      }
      this.user = user;
      if (this.user && !this.editMode) {
        this.profileForm = {
          displayName: this.user.displayName || '',
          mobile: this.user.mobile || this.user.phone || '',
          address: this.user.address || '',
          dateOfBirth: this.user.dateOfBirth || ''
        };
      }
      
      // Only fetch orders when we have both a valid user and a valid shopId (not the default placeholder)
      if (this.user && this.shopId !== 'shop_default') {
        this.fetchOrders();
      }
    });
  }

  editMode = false;
  savingProfile = false;
  profileForm = {
    displayName: '',
    mobile: '',
    address: '',
    dateOfBirth: ''
  };

  toggleEditMode() {
    if (this.editMode) {
      // Cancel edit, reset form
      this.editMode = false;
      if (this.user) {
        this.profileForm = {
          displayName: this.user.displayName || '',
          mobile: this.user.mobile || this.user.phone || '',
          address: this.user.address || '',
          dateOfBirth: this.user.dateOfBirth || ''
        };
      }
    } else {
      this.editMode = true;
    }
  }

  async saveProfile() {
    if (!this.user || !this.user.uid) return;
    this.savingProfile = true;
    
    // Update user profile in Firebase
    await this.authService.updateUserProfile(this.user.uid, {
      displayName: this.profileForm.displayName,
      mobile: this.profileForm.mobile,
      address: this.profileForm.address,
      dateOfBirth: this.profileForm.dateOfBirth
    });

    // Also update the customer record if they exist in the shop
    this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.customerService.updateCustomer(res.data.id!, {
            name: this.profileForm.displayName,
            phoneNumber: this.profileForm.mobile,
            dateOfBirth: this.profileForm.dateOfBirth
          }).subscribe();
        }
      }
    });

    this.savingProfile = false;
    this.editMode = false;
  }


  fetchOrders() {
    this.loadingOrders = true;

    if (!this.user?.email && !this.user?.uid) {
      this.loadingOrders = false;
      return;
    }

    // Fetch orders directly by user email (fastest, most reliable)
    if (this.user.email) {
      this.orderService.getMyOrders(this.shopId, undefined, this.user.email).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.orders = response.data;
          }
          this.loadingOrders = false;
        },
        error: (error) => {
          console.error('Error fetching orders by email:', error);
          this.loadingOrders = false;
        }
      });
      return;
    }

    // Fallback: find customer by userId then fetch orders
    this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe({
      next: (customerRes) => {
        if (customerRes.success && customerRes.data) {
          this.orderService.getMyOrders(this.shopId, customerRes.data.id).subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.orders = response.data;
              }
              this.loadingOrders = false;
            },
            error: (error) => {
              console.error('Error fetching orders:', error);
              this.loadingOrders = false;
            }
          });
        } else {
          this.loadingOrders = false;
        }
      },
      error: (err) => {
        console.error('Error finding customer:', err);
        this.loadingOrders = false;
      }
    });
  }

  loadWishlist() {
    if (!this.user || !this.user.wishlist || this.user.wishlist.length === 0) {
      this.wishlistProducts = [];
      return;
    }
    
    this.loadingWishlist = true;
    const requests = this.user.wishlist.map(id => this.websiteService.getProduct(id));
    import('rxjs').then(({ forkJoin }) => {
      import('rxjs/operators').then(({ catchError }) => {
        const { of } = require('rxjs');
        const safeRequests = requests.map(req => req.pipe(catchError(() => of(null))));
        forkJoin(safeRequests).subscribe(products => {
          this.wishlistProducts = products.filter(p => p !== null);
          this.loadingWishlist = false;
        });
      });
    });
  }

  get filteredOrders(): Order[] {
    if (!this.orders) return [];
    
    switch (this.activeOrderFilter) {
      case 'Processing':
        return this.orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'confirmed');
      case 'Shipped':
        return this.orders.filter(o => o.orderStatus === 'shipped');
      case 'Delivered':
        return this.orders.filter(o => o.orderStatus === 'delivered');
      case 'Returns':
        return this.orders.filter(o => o.orderStatus === 'cancelled');
      case 'All Orders':
      default:
        return this.orders;
    }
  }

  async removeFromWishlist(productId: string) {
    if (!this.user || !this.user.wishlist) return;
    const currentWishlist = this.user.wishlist.filter(id => id !== productId);
    this.user.wishlist = currentWishlist;
    this.wishlistProducts = this.wishlistProducts.filter(p => p.id !== productId);
    try {
      await this.authService.updateUserProfile(this.user.uid, { wishlist: currentWishlist });
    } catch (e) {
      console.error(e);
    }
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'wishlist') {
      this.loadWishlist();
    }
  }

  toDate(value: any): Date | null {
    if (!value) return null;
    let d: Date | null = null;
    if (typeof value.toDate === 'function') {
      d = value.toDate(); // Firestore Timestamp
    } else if (value._seconds !== undefined) {
      d = new Date(value._seconds * 1000); // serialized Timestamp
    } else {
      d = new Date(value);
    }
    // Guard against Invalid Date
    return d && !isNaN(d.getTime()) ? d : null;
  }

  trackOrder() {
    if (!this.trackingOrderId.trim()) return;
    this.loadingTracking = true;
    this.trackingError = '';
    this.trackedOrder = null;

    this.orderService.trackOrder(this.trackingOrderId.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.trackedOrder = response.data;
        } else {
          this.trackingError = 'Order not found';
        }
        this.loadingTracking = false;
      },
      error: (err) => {
        console.error('Error tracking order:', err);
        this.trackingError = 'Order not found or access denied';
        this.loadingTracking = false;
      }
    });
  }

  getTrackingSteps(order: any) {
    if (!order) return [];
    const status = order.orderStatus;
    const date = order.createdAt;
    const isPlaced = true;
    const isProcessing = status === 'confirmed' || status === 'shipped' || status === 'delivered';
    const isShipped = status === 'shipped' || status === 'delivered';
    const isOut = status === 'shipped' || status === 'delivered';
    const isDelivered = status === 'delivered';

    return [
      { label: 'Order Placed', completed: isPlaced, icon: 'bi bi-bag-check', date: date },
      { label: 'Processing', completed: isProcessing, icon: 'bi bi-gear', date: isProcessing ? order.updatedAt : null },
      { label: 'Shipped', completed: isShipped, icon: 'bi bi-truck', date: isShipped ? order.updatedAt : null },
      { label: 'Out for Delivery', completed: isOut, icon: 'bi bi-box-seam', date: isOut ? order.updatedAt : null },
      { label: 'Delivered', completed: isDelivered, icon: 'bi bi-check-circle', date: isDelivered ? order.updatedAt : null },
    ];
  }

  getTrackingStepIndex(steps: any[]): number {
    if (!steps) return -1;
    let lastCompletedIndex = -1;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].completed) {
        lastCompletedIndex = i;
      } else {
        break;
      }
    }
    return lastCompletedIndex;
  }

  getTrackingProgressHeight(steps: any[]): string {
    if (!steps) return '0%';
    const completedCount = steps.filter((s) => s.completed).length;
    if (completedCount <= 1) return '0%';
    return (completedCount - 1) * 25 + '%';
  }

  logout() {
    this.authService.logout();
  }

  // --- Address Book Methods ---
  editingAddress = false;
  savingAddress = false;
  editingAddressIndex = -1;
  addressForm: any = {};

  openAddressForm() {
    this.editingAddress = true;
    this.editingAddressIndex = -1;
    this.addressForm = {
      name: this.user?.displayName || '',
      phone: this.user?.mobile || this.user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: !this.user?.addresses?.length
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
    if (!this.user || !this.user.uid) return;
    
    // Basic validation
    if (!this.addressForm.name || !this.addressForm.phone || !this.addressForm.addressLine1 || 
        !this.addressForm.city || !this.addressForm.state || !this.addressForm.postalCode) {
      this.addressError = "Please fill all required fields";
      return;
    }

    this.savingAddress = true;
    this.addressError = '';
    const addresses = this.user.addresses ? [...this.user.addresses] : [];

    // If new address is set as default, remove default from others
    if (this.addressForm.isDefault) {
      addresses.forEach(a => a.isDefault = false);
    }

    // Ensure at least one default if it's the only address
    if (addresses.length === 0 || (this.editingAddressIndex !== -1 && addresses.length === 1)) {
      this.addressForm.isDefault = true;
    }

    if (this.editingAddressIndex >= 0) {
      addresses[this.editingAddressIndex] = { ...this.addressForm };
    } else {
      // Add id for new address
      this.addressForm.id = Math.random().toString(36).substring(2, 9);
      addresses.push({ ...this.addressForm });
    }

    // Update in backend
    try {
      await this.authService.updateUserProfile(this.user.uid, { addresses });
      
      // Update customer table if needed
      this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.customerService.updateCustomer(res.data.id!, { addresses }).subscribe();
          }
        }
      });

      this.user.addresses = addresses;
      this.toastService.showSuccess("Address saved successfully!");
      this.cancelAddressForm();
    } catch (e) {
      console.error(e);
      this.toastService.showError("Error saving address");
    } finally {
      this.savingAddress = false;
    }
  }

  async deleteAddress(index: number) {
    if (!this.user || !this.user.uid || !this.user.addresses) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Address',
      description: 'Are you sure you want to delete this address?',
      type: 'danger',
      primaryButtonText: 'Delete Address',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    const addresses = [...this.user.addresses];
    const wasDefault = addresses[index].isDefault;
    addresses.splice(index, 1);

    // If we deleted the default and there are remaining addresses, make the first one default
    if (wasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    try {
      await this.authService.updateUserProfile(this.user.uid, { addresses });
      
      // Update customer table if needed
      this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.customerService.updateCustomer(res.data.id!, { addresses }).subscribe();
          }
        }
      });

      this.user.addresses = addresses;
      this.toastService.showSuccess("Address deleted successfully!");
    } catch (e) {
      console.error(e);
      this.toastService.showError("Error deleting address");
    }
  }

  async deleteAccount() {
    if (!this.user || !this.user.uid) return;
    const confirmDelete = await this.confirmationService.confirm({
      title: 'Delete Account?',
      description: 'Are you absolutely sure you want to delete your account? This action cannot be undone. Note: Your transaction history will be preserved as per store policy.',
      type: 'danger',
      primaryButtonText: 'Delete Account',
      secondaryButtonText: 'Cancel',
      requireCheckbox: true,
      checkboxLabel: 'I understand this action cannot be undone and I want to delete my account.'
    });
    
    if (confirmDelete) {
      try {
        // Find and delete the CRM Customer record so they are removed from the store's active customer list
        this.customerService.findCustomer(this.shopId, undefined, undefined, this.user.uid).subscribe(async (res) => {
          if (res.success && res.data && res.data.id) {
            // we delete the CRM record but transactions pointing to it still exist.
            await this.customerService.deleteCustomer(res.data.id).toPromise();
          }
          
          // Delete Firebase Auth User
          const deleteRes = await this.authService.deleteAuthUser();
          if (deleteRes.success) {
            this.toastService.showSuccess('Your account has been successfully deleted.');
            setTimeout(() => {
              window.location.href = this.routePrefix.join('/');
            }, 1500);
          } else {
            this.toastService.showError('Could not delete account. You may need to sign in again to perform this action.');
          }
        });
      } catch (e) {
        console.error(e);
        this.toastService.showError('An error occurred while deleting your account.');
      }
    }
  }
}
