import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { ShopContextService, ShopConfig } from '../../core/services/shop-context.service';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { CartService, CartItem } from '../../core/services/cart.service';
import { TenantService } from '../../core/services/tenant.service';
import { Offer } from '../../core/models/offer.model';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { Observable, combineLatest, startWith } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WebsiteService } from '../../core/services/website.service';
import { WebsiteLoadingComponent } from '../../components/website-loading.component';
import { FormsModule } from '@angular/forms';
import { OptimizeImagePipe } from '../../shared/pipes/optimize-image.pipe';

@Component({
  selector: 'app-website-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    WebsiteLoadingComponent,
    FormsModule,
    OptimizeImagePipe,
  ],
  template: `
    <div
      class="min-h-screen flex flex-col font-sans selection:bg-primary-200 selection:text-primary-900"
      *ngIf="shopConfig$ | async as config; else loading"
      [style.background-color]="config.theme?.secondaryColor || '#f9fafb'"
      [style.fontFamily]="config.theme?.fontFamily || 'Inter, sans-serif'"
    >
      <ng-container *ngIf="config.websiteEnabled !== false; else websiteDisabled">
        <!-- Top Announcement Bar -->
        <div 
          *ngIf="offers && offers.length > 0; else defaultAnnouncement"
          class="bg-black text-white text-[11px] py-2.5 font-medium tracking-widest uppercase overflow-hidden relative"
        >
          <div class="marquee-wrapper flex overflow-hidden whitespace-nowrap">
            <div class="marquee-track flex animate-marquee hover:[animation-play-state:paused]">
              <!-- First Track -->
              <div class="flex items-center gap-16 px-8 shrink-0 min-w-full justify-around">
                <ng-container *ngFor="let text of announcementTexts">
                  <span class="flex items-center gap-2">
                    <span>{{ text }}</span>
                    <a [routerLink]="routePrefix.concat(['products'])" class="underline hover:text-gray-300 ml-1">Shop now</a>
                  </span>
                  <span class="w-1.5 h-1.5 bg-white/30 rounded-full"></span>
                </ng-container>
              </div>
              <!-- Second Track for Infinite Seamless Loop -->
              <div class="flex items-center gap-16 px-8 shrink-0 min-w-full justify-around">
                <ng-container *ngFor="let text of announcementTexts">
                  <span class="flex items-center gap-2">
                    <span>{{ text }}</span>
                    <a [routerLink]="routePrefix.concat(['products'])" class="underline hover:text-gray-300 ml-1">Shop now</a>
                  </span>
                  <span class="w-1.5 h-1.5 bg-white/30 rounded-full"></span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <ng-template #defaultAnnouncement>
          <div class="bg-black text-white text-[11px] py-2.5 px-4 text-center font-medium tracking-widest uppercase">
            Complimentary U.S. No-Rush Shipping on orders of $95 or more. 
            <a [routerLink]="routePrefix.concat(['products'])" class="underline hover:text-gray-300 ml-1">Shop now</a>
          </div>
        </ng-template>

      <!-- Premium Navbar -->
      <nav class="sticky top-0 z-50 bg-white border-b border-gray-100 transition-all duration-300 relative">
        <div class="container mx-auto px-6 h-20 flex items-center justify-between">
          <!-- Logo / Brand -->
          <a
            [routerLink]="routePrefix"
            class="flex items-center gap-3 z-50 relative hover:opacity-80 transition-opacity"
          >
            <ng-container *ngIf="config.theme?.logo; else defaultLogo">
              <img [src]="config.theme?.logo | optimizeImage:'thumbnail':true" onerror="this.src='/Cloth_placeholder.png'" alt="Shop Logo" class="h-8 md:h-10 w-auto object-contain" />
            </ng-container>
            <ng-template #defaultLogo>
              <img src="/Cloth_placeholder.png" alt="Shop Logo" class="h-8 md:h-10 w-auto object-contain" />
            </ng-template>
          </a>

                    <div class="hidden md:flex items-center gap-8">
            <!-- Shop Menu with hover event binding -->
            <div 
              *ngIf="config.pages.products"
              (mouseenter)="onMouseEnterShop()" 
              (mouseleave)="onMouseLeaveShop()"
              class="relative py-7"
            >
              <button
                class="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1 focus:outline-none"
                [class.text-primary-600]="showShopDropdown"
              >
                Shop
                <i class="bi bi-chevron-down text-[10px] transition-transform duration-200" [class.rotate-180]="showShopDropdown"></i>
              </button>
            </div>

            <a
              *ngIf="config.pages.products"
              [routerLink]="routePrefix.concat(['products'])"
              [queryParams]="{sort: 'newest'}"
              routerLinkActive="text-primary-600 font-bold"
              class="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors py-7"
              >New Arrivals</a
            >
            <a
              [routerLink]="routePrefix.concat(['offers'])"
              routerLinkActive="text-primary-600 font-bold"
              class="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors py-7"
              *ngIf="config.pages.offers"
              >Offers</a
            >
            <a
              *ngIf="config.pages.contact"
              [routerLink]="routePrefix.concat(['contact'])"
              class="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors py-7"
              >Contact</a
            >
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-5">
            <!-- Search Icon (Desktop Toggle) -->
            <button class="hidden md:block p-2 text-gray-600 hover:text-primary-600 transition-colors focus:outline-none" (click)="toggleDesktopSearch()">
              <i class="bi bi-search text-xl"></i>
            </button>

            <!-- Stores (Desktop link) -->
            <a [routerLink]="routePrefix" class="hidden md:block text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors">Stores</a>

            <!-- Auth / Profile Icon (Desktop) -->
            <div class="hidden md:block">
              <ng-container *ngIf="currentUser$ | async as user; else guestUser">
                <div class="relative" #profileDropdownRef>
                  <button class="flex items-center gap-2 hover-lift focus:outline-none" (click)="toggleProfileDropdown($event)" aria-haspopup="true" [attr.aria-expanded]="showProfileDropdown">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-100 to-indigo-50 flex items-center justify-center text-primary-700 font-bold border border-gray-200 shadow-sm ring-2 transition-all duration-300" [class.ring-primary-300]="showProfileDropdown" [class.ring-transparent]="!showProfileDropdown">
                      {{ (user.displayName || 'U').charAt(0).toUpperCase() }}
                    </div>
                  </button>
                  <div *ngIf="showProfileDropdown" class="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-xl py-2 border border-white/60 z-50 animate-fade-in">
                    <div class="px-5 py-4 border-b border-gray-100 mb-2 bg-white/40">
                      <p class="text-sm font-bold text-gray-900 truncate">{{ user.displayName || 'User' }}</p>
                      <p class="text-xs text-gray-500 truncate mt-0.5">{{ user.email || user.mobile }}</p>
                    </div>
                    <a [routerLink]="routePrefix.concat(['account'])" (click)="closeProfileDropdown()" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"><i class="bi bi-person opacity-50"></i> My Account</a>
                    <a [routerLink]="routePrefix.concat(['order-history'])" (click)="closeProfileDropdown()" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"><i class="bi bi-bag opacity-50"></i> Order History</a>
                    <a [routerLink]="routePrefix.concat(['account'])" [queryParams]="{tab: 'addresses'}" (click)="closeProfileDropdown()" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"><i class="bi bi-geo-alt opacity-50"></i> Saved Addresses</a>
                    <div class="border-t border-gray-100 my-2"></div>
                    <button (click)="logout(); closeProfileDropdown()" class="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"><i class="bi bi-box-arrow-right opacity-50"></i> Sign Out</button>
                  </div>
                </div>
              </ng-container>
              <ng-template #guestUser>
                <a [routerLink]="routePrefix.concat(['auth', 'login'])" class="p-2 text-gray-600 hover:text-primary-600 transition-colors focus:outline-none"><i class="bi bi-person text-xl"></i></a>
              </ng-template>
            </div>

            <!-- Wishlist Heart Icon (Desktop) -->
            <button [routerLink]="routePrefix.concat(['account'])" [queryParams]="{tab: 'wishlist'}" class="hidden md:flex relative p-2 text-gray-600 hover:text-primary-600 transition-colors hover-lift focus:outline-none">
              <i class="bi bi-heart text-xl"></i>
              <span *ngIf="(currentUser$ | async) as user" class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-gray-900 rounded-full border-2 border-white shadow-sm">
                {{ user?.wishlist?.length || 0 }}
              </span>
              <span *ngIf="!(currentUser$ | async)" class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-gray-900 rounded-full border-2 border-white shadow-sm">
                0
              </span>
            </button>

            <!-- Cart Bag Icon -->
            <button (click)="toggleShoppingBag()" class="relative p-2 text-gray-600 hover:text-primary-600 transition-colors hover-lift focus:outline-none">
              <i class="bi bi-bag text-xl"></i>
              <span *ngIf="cartCount$ | async as count" class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gray-900 rounded-full border-2 border-white animate-bounce-short shadow-sm">{{ count }}</span>
            </button>

            <!-- Mobile Search Toggle -->
            <button class="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors focus:outline-none" (click)="toggleMobileSearch()">
              <i class="bi bi-search text-xl"></i>
            </button>

<!-- Mobile Menu Toggle Button -->
            <button
              class="md:hidden p-2 text-gray-600 hover:text-primary-600 z-50 relative transition-colors focus:outline-none"
              (click)="toggleMobileMenu()"
            >
              <div class="w-6 h-5 relative flex flex-col justify-between">
                <span
                  class="w-full h-0.5 bg-current rounded-full transition-all duration-300"
                  [class.rotate-45]="showMobileMenu"
                  [class.translate-y-2]="showMobileMenu"
                ></span>
                <span
                  class="w-full h-0.5 bg-current rounded-full transition-all duration-300"
                  [class.opacity-0]="showMobileMenu"
                ></span>
                <span
                  class="w-full h-0.5 bg-current rounded-full transition-all duration-300"
                  [class.-rotate-45]="showMobileMenu"
                  [class.-translate-y-2.5]="showMobileMenu"
                ></span>
              </div>
            </button>
          </div>
        </div>

        <!-- Expandable Search Bar (Desktop Overlay) -->
        <div
          *ngIf="showDesktopSearch"
          class="hidden md:block absolute left-0 right-0 top-full bg-white border-b border-gray-200 py-6 shadow-sm z-40 animate-fade-in"
        >
          <div class="container mx-auto px-6 max-w-5xl">
            <div class="relative flex items-center">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                placeholder="Search products..."
                class="w-full pl-6 pr-14 py-4 text-base bg-[#F8F9FA] border border-gray-100 text-gray-900 rounded-full focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"
              />
              <button
                (click)="onSearch()"
                class="absolute right-2 top-2 bottom-2 px-4 text-gray-500 hover:text-primary-600 rounded-full transition-colors flex items-center justify-center"
              >
                <i class="bi bi-search text-lg"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Mega Dropdown Panel -->
        <div
          *ngIf="showShopDropdown"
          (mouseenter)="onMouseEnterShop()"
          (mouseleave)="onMouseLeaveShop()"
          class="hidden md:block absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 animate-fade-in"
        >
          <div class="container mx-auto px-12 py-10 grid grid-cols-4 gap-8">
            <!-- Categories Column -->
            <div>
              <h4 class="font-bold text-gray-400 text-xs tracking-wider uppercase mb-5">Categories</h4>
              <ul class="space-y-3">
                <li *ngFor="let cat of categories$ | async">
                  <a [routerLink]="routePrefix.concat(['products'])" 
                     [queryParams]="cat === 'all' ? {} : {category: cat}" 
                     (click)="closeShopDropdown()" 
                     class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm capitalize">
                    {{ cat === 'all' ? 'Shop All' : cat }}
                  </a>
                </li>
              </ul>
            </div>
            <!-- Featured Column -->
            <div>
              <h4 class="font-bold text-gray-400 text-xs tracking-wider uppercase mb-5">Featured</h4>
              <ul class="space-y-3">
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'newest'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">New Arrivals</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'bestsellers'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Bestsellers</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'trending'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Trending Now</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{subcategory: 'loungewear'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Loungewear</a></li>
              </ul>
            </div>
            <!-- Collections Column -->
            <div>
              <h4 class="font-bold text-gray-400 text-xs tracking-wider uppercase mb-5">Collections</h4>
              <ul class="space-y-3">
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Party and events'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Party and events</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Office looks'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Office looks</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Selection'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Selection</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Online Exclusive'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Online Exclusive</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Knitwear'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Knitwear</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Total Look'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Total Look</a></li>
                <li><a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Basics'}" (click)="closeShopDropdown()" class="block text-gray-900 font-medium hover:text-primary-600 transition-colors text-sm">Basics</a></li>
              </ul>
            </div>
            <!-- Model Banner visual Column -->
            <div class="relative h-[280px] rounded-2xl overflow-hidden shadow-md group/img">
              <img src="assets/dropdown-model.png" alt="Featured Knitwear" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-5">
                <span class="text-white font-bold text-sm">New Knitwear Collection</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Search Bar (Expandable) -->
        <div
          class="md:hidden px-4 overflow-hidden transition-all duration-300 ease-in-out bg-white"
          [style.max-height]="showMobileSearch ? '90px' : '0px'"
          [style.padding-bottom]="showMobileSearch ? '20px' : '0px'"
          [style.opacity]="showMobileSearch ? '1' : '0'"
        >
          <div class="flex items-center relative mt-3 rounded-full">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              placeholder="Search products..."
              class="w-full pl-5 pr-12 py-3.5 text-sm bg-[#F8F9FA] border border-gray-100 rounded-full focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all text-gray-900"
            />
            <button
              (click)="onSearch()"
              class="absolute right-1 top-1 bottom-1 px-3 text-gray-500 hover:text-primary-600 flex items-center justify-center rounded-full m-1 transition-colors"
            >
              <i class="bi bi-search text-base"></i>
            </button>
          </div>
        </div>
      </nav>

      <!-- Mobile Menu Drawer (Custom Accordion Design) -->
      <div
        class="fixed inset-0 z-50 md:hidden"
        *ngIf="showMobileMenu"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
          (click)="toggleMobileMenu()"
        ></div>

        <!-- Drawer Panel -->
        <div
          class="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col h-full"
        >
          <!-- Drawer Header with close button -->
          <div class="p-6 border-b border-gray-100 flex items-center justify-between">
            <ng-container *ngIf="config.theme?.logo; else mobileTextLogo">
              <img [src]="config.theme?.logo | optimizeImage:'thumbnail':true" alt="Shop Logo" class="h-8 w-auto object-contain" />
            </ng-container>
            <ng-template #mobileTextLogo>
              <span class="font-black text-xl text-gray-900">{{ config.displayName || config.shopName || 'Shop' }}</span>
            </ng-template>
            <button (click)="toggleMobileMenu()" class="p-2 text-gray-600 hover:text-gray-900">
              <i class="bi bi-x-lg text-xl"></i>
            </button>
          </div>

          <!-- Drawer Accordion Navigation -->
          <div class="flex-grow overflow-y-auto px-6 py-4">
            <div class="space-y-4">
              <!-- Shop Accordion -->
              <div class="border-b border-gray-100 pb-4" *ngIf="config.pages.products">
                <button (click)="toggleMobileShop()" class="flex items-center justify-between w-full py-2 text-left font-bold text-lg text-gray-900 focus:outline-none">
                  <span>Shop</span>
                  <i class="bi text-sm" [class.bi-dash-lg]="mobileShopOpen" [class.bi-plus-lg]="!mobileShopOpen"></i>
                </button>
                
                <div *ngIf="mobileShopOpen" class="pl-4 mt-2 space-y-4 animate-fade-in">
                  <!-- Categories Sub-Accordion -->
                  <div>
                    <button (click)="toggleMobileCategories()" class="flex items-center justify-between w-full py-1.5 text-left font-semibold text-gray-700 text-sm focus:outline-none">
                      <span>Categories</span>
                      <i class="bi text-xs" [class.bi-dash]="mobileCategoriesOpen" [class.bi-plus]="!mobileCategoriesOpen"></i>
                    </button>
                    <div *ngIf="mobileCategoriesOpen" class="pl-4 mt-1.5 space-y-2 border-l border-gray-100 animate-fade-in">
                      <a *ngFor="let cat of categories$ | async" 
                         [routerLink]="routePrefix.concat(['products'])" 
                         [queryParams]="cat === 'all' ? {} : {category: cat}" 
                         (click)="toggleMobileMenu()" 
                         class="block text-gray-600 hover:text-primary-600 text-sm py-1 capitalize">
                        {{ cat === 'all' ? 'Shop All' : cat }}
                      </a>
                    </div>
                  </div>
                  
                  <!-- Featured Sub-Accordion -->
                  <div>
                    <button (click)="toggleMobileFeatured()" class="flex items-center justify-between w-full py-1.5 text-left font-semibold text-gray-700 text-sm focus:outline-none">
                      <span>Featured</span>
                      <i class="bi text-xs" [class.bi-dash]="mobileFeaturedOpen" [class.bi-plus]="!mobileFeaturedOpen"></i>
                    </button>
                    <div *ngIf="mobileFeaturedOpen" class="pl-4 mt-1.5 space-y-2 border-l border-gray-100 animate-fade-in">
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'newest'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">New Arrivals</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'bestsellers'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Bestsellers</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{sort: 'trending'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Trending Now</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{subcategory: 'loungewear'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Loungewear</a>
                    </div>
                  </div>

                  <!-- Collections Sub-Accordion -->
                  <div>
                    <button (click)="toggleMobileCollections()" class="flex items-center justify-between w-full py-1.5 text-left font-semibold text-gray-700 text-sm focus:outline-none">
                      <span>Collections</span>
                      <i class="bi text-xs" [class.bi-dash]="mobileCollectionsOpen" [class.bi-plus]="!mobileCollectionsOpen"></i>
                    </button>
                    <div *ngIf="mobileCollectionsOpen" class="pl-4 mt-1.5 space-y-2 border-l border-gray-100 animate-fade-in">
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Party and events'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Party and events</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Office looks'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Office looks</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Selection'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Selection</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Online Exclusive'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Online Exclusive</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Knitwear'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Knitwear</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Total Look'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Total Look</a>
                      <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{collection: 'Basics'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Basics</a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Arrivals Accordion -->
              <div class="border-b border-gray-100 pb-4" *ngIf="config.pages.products">
                <button (click)="toggleMobileNewArrivals()" class="flex items-center justify-between w-full py-2 text-left font-bold text-lg text-gray-900 focus:outline-none">
                  <span>New Arrivals</span>
                  <i class="bi text-sm" [class.bi-dash-lg]="mobileNewArrivalsOpen" [class.bi-plus-lg]="!mobileNewArrivalsOpen"></i>
                </button>
                <div *ngIf="mobileNewArrivalsOpen" class="pl-4 mt-2 space-y-2 border-l border-gray-100 animate-fade-in">
                  <a [routerLink]="routePrefix.concat(['products'])" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">All New Arrivals</a>
                  <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{category: 'men'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">New in Men</a>
                  <a [routerLink]="routePrefix.concat(['products'])" [queryParams]="{category: 'women'}" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">New in Women</a>
                </div>
              </div>

              <!-- Sales Accordion -->
              <div class="border-b border-gray-100 pb-4" *ngIf="config.pages.offers">
                <button (click)="toggleMobileSales()" class="flex items-center justify-between w-full py-2 text-left font-bold text-lg text-gray-900 focus:outline-none">
                  <span>Sales</span>
                  <i class="bi text-sm" [class.bi-dash-lg]="mobileSalesOpen" [class.bi-plus-lg]="!mobileSalesOpen"></i>
                </button>
                <div *ngIf="mobileSalesOpen" class="pl-4 mt-2 space-y-2 border-l border-gray-100 animate-fade-in">
                  <a [routerLink]="routePrefix.concat(['offers'])" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Active Offers</a>
                  <a [routerLink]="routePrefix.concat(['offers'])" (click)="toggleMobileMenu()" class="block text-gray-600 hover:text-primary-600 text-sm py-1">Clearance Sale</a>
                </div>
              </div>



              <!-- Static Links at the bottom -->
              <div class="pt-4 space-y-4">
                <a *ngIf="config.pages.contact" [routerLink]="routePrefix.concat(['contact'])" (click)="toggleMobileMenu()" class="block font-semibold text-gray-700 text-base py-1">Contact</a>
                <a [routerLink]="routePrefix.concat(['account'])" (click)="toggleMobileMenu()" class="block font-semibold text-gray-700 text-base py-1">Account</a>
                <a [routerLink]="routePrefix" (click)="toggleMobileMenu()" class="block font-semibold text-gray-700 text-base py-1">Stores</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="flex-grow">
        <ng-container *ngIf="isPageEnabled$ | async; else pageOffline">
          <router-outlet></router-outlet>
        </ng-container>
        <ng-template #pageOffline>
          <div class="flex-grow flex flex-col items-center justify-center py-32 px-6 text-center" style="min-height: 60vh;">
            <i class="bi bi-cone-striped text-5xl text-gray-300 mb-4 block"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Page Unavailable</h2>
            <p class="text-gray-500 max-w-md mx-auto">Storefront page is not online currently. The shop owner has temporarily disabled this section.</p>
            <button [routerLink]="routePrefix" class="mt-6 px-6 py-2.5 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
              Return Home
            </button>
          </div>
        </ng-template>
      </main>

      <!-- Trust Badges Section -->
      <section class="py-16 mt-auto " [style.background-color]="(config.theme?.primaryColor || '#f9fafb') + '50'">
        <div class="container mx-auto px-4 max-w-6xl">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div
              class="flex flex-col items-center justify-center space-y-4 hover-lift p-4 rounded-xl"
            >
              <div
                class="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-primary-600 mb-2 border border-primary-100"
              >
                <i class="bi bi-shield-check text-3xl"></i>
              </div>
              <div>
                <h5 class="font-bold text-gray-900 text-lg">Secure Payments</h5>
                <p class="text-sm text-gray-500 mt-1">100% Secure SSL encrypted</p>
              </div>
            </div>
            <div
              class="flex flex-col items-center justify-center space-y-4 hover-lift p-4 rounded-xl"
            >
              <div
                class="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-primary-600 mb-2 border border-primary-100"
              >
                <i class="bi bi-box-seam text-3xl"></i>
              </div>
              <div>
                <h5 class="font-bold text-gray-900 text-lg">Free Shipping</h5>
                <p class="text-sm text-gray-500 mt-1">On premium orders</p>
              </div>
            </div>
            <div
              class="flex flex-col items-center justify-center space-y-4 hover-lift p-4 rounded-xl"
            >
              <div
                class="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-primary-600 mb-2 border border-primary-100"
              >
                <i class="bi bi-arrow-return-left text-3xl"></i>
              </div>
              <div>
                <h5 class="font-bold text-gray-900 text-lg">Easy Returns</h5>
                <p class="text-sm text-gray-500 mt-1">30-day money back guarantee</p>
              </div>
            </div>
            <div
              class="flex flex-col items-center justify-center space-y-4 hover-lift p-4 rounded-xl"
            >
              <div
                class="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-primary-600 mb-2 border border-primary-100"
              >
                <i class="bi bi-headset text-3xl"></i>
              </div>
              <div>
                <h5 class="font-bold text-gray-900 text-lg">24/7 Support</h5>
                <p class="text-sm text-gray-500 mt-1">Always here to help you</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Dynamic Theme Footer -->
      <footer
        class="text-white pt-24 pb-12 border-t relative overflow-hidden"
        [style.background-color]="config.theme?.secondaryColor || '#030712'"
        [style.border-color]="
          config.theme?.primaryColor
            ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.15)
            : 'rgba(255,255,255,0.08)'
        "
      >
        <!-- Subtle background glow using theme colors -->
        <div
          class="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-20"
          [style.background-color]="config.theme?.primaryColor || '#4c1d95'"
        ></div>
        <div
          class="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-10"
          [style.background-color]="config.theme?.primaryColor || '#6d28d9'"
        ></div>

        <div class="container mx-auto px-4 max-w-7xl relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-20">
            <div class="md:col-span-4 space-y-6">
              <a
                [routerLink]="routePrefix"
                class="flex items-center gap-3 text-2xl font-black text-white hover:opacity-80 transition-opacity"
              >
                <img
                  *ngIf="config.theme?.logo"
                  [src]="config.theme?.logo | optimizeImage:'thumbnail':true"
                  alt="Logo"
                  class="h-12 w-auto rounded-full object-cover ring-2 ring-white/10"
                />
                <span *ngIf="!config.theme?.logo" class="tracking-tight text-3xl">{{
                  config.displayName || config.shopName
                }}</span>
              </a>
              <p
                class="text-base leading-relaxed max-w-sm opacity-60"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                {{
                  config.description ||
                    'Discover premium items crafted for excellence. Upgrade your lifestyle with our curated collection.'
                }}
              </p>
              <div class="flex gap-4 pt-4" *ngIf="config.socialLinks">
                <a
                  *ngIf="config.socialLinks.facebook"
                  [href]="config.socialLinks.facebook"
                  target="_blank"
                  class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white hover:border-transparent transition-all hover:-translate-y-1 shadow-lg"
                  ><i class="bi bi-facebook text-lg"></i
                ></a>
                <a
                  *ngIf="config.socialLinks.instagram"
                  [href]="config.socialLinks.instagram"
                  target="_blank"
                  class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white hover:border-transparent transition-all hover:-translate-y-1 shadow-lg"
                  ><i class="bi bi-instagram text-lg"></i
                ></a>
                <a
                  *ngIf="config.socialLinks.twitter"
                  [href]="config.socialLinks.twitter"
                  target="_blank"
                  class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-sky-500 hover:text-white hover:border-transparent transition-all hover:-translate-y-1 shadow-lg"
                  ><i class="bi bi-twitter-x text-lg"></i
                ></a>
              </div>
            </div>

            <div class="md:col-span-2 md:col-start-7">
              <h4
                class="font-bold mb-8 text-white tracking-widest uppercase text-xs"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                Shop
              </h4>
              <ul
                class="space-y-4 text-base opacity-60 hover:opacity-100 transition-opacity duration-300"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                <li *ngIf="config.pages.home">
                  <a
                    [routerLink]="routePrefix"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    Home</a
                  >
                </li>
                <li *ngIf="config.pages.products">
                  <a
                    [routerLink]="routePrefix.concat(['products'])"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    Collection</a
                  >
                </li>
                <li *ngIf="config.pages.offers">
                  <a
                    [routerLink]="routePrefix.concat(['offers'])"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    Offers</a
                  >
                </li>
              </ul>
            </div>

            <div class="md:col-span-2">
              <h4
                class="font-bold mb-8 tracking-widest uppercase text-xs"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                Support
              </h4>
              <ul
                class="space-y-4 text-base opacity-60 hover:opacity-100 transition-opacity duration-300"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                <li>
                  <a
                    href="#"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    FAQ</a
                  >
                </li>
                <li *ngIf="config.pages.contact">
                  <a
                    [routerLink]="routePrefix.concat(['contact'])"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    Contact Us</a
                  >
                </li>
                <li *ngIf="config.pages.shippingPolicy">
                  <a
                    [routerLink]="routePrefix.concat(['shipping-policy'])"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    Shipping Policy</a
                  >
                </li>
                <li *ngIf="config.pages.returnPolicy">
                  <a
                    [routerLink]="routePrefix.concat(['return-policy'])"
                    class="hover:text-white transition-colors flex items-center gap-3 group"
                    ><span
                      class="w-1.5 h-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      [style.background-color]="config.theme?.primaryColor || '#7c3aed'"
                    ></span>
                    Returns &amp; Refunds</a
                  >
                </li>
              </ul>
            </div>

            <div class="md:col-span-2">
              <h4
                class="font-bold mb-8 tracking-widest uppercase text-xs"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                Contact
              </h4>
              <ul
                class="space-y-5 text-base opacity-60 hover:opacity-100 transition-opacity duration-300"
                [style.color]="
                  config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
                "
              >
                <li *ngIf="config.address" class="flex items-start gap-4">
                  <div
                    class="mt-1 p-2 rounded-lg bg-white/5"
                    [style.color]="config.theme?.primaryColor || '#a78bfa'"
                  >
                    <i class="bi bi-geo-alt"></i>
                  </div>
                  <span class="leading-relaxed">{{ config.address }}</span>
                </li>
                <li *ngIf="config.contactEmail" class="flex items-center gap-4">
                  <div
                    class="p-2 rounded-lg bg-white/5"
                    [style.color]="config.theme?.primaryColor || '#a78bfa'"
                  >
                    <i class="bi bi-envelope"></i>
                  </div>
                  <a
                    href="mailto:{{ config.contactEmail }}"
                    class="hover:text-white transition-colors"
                    >{{ config.contactEmail }}</a
                  >
                </li>
                <li *ngIf="config.contactPhone" class="flex items-center gap-4">
                  <div
                    class="p-2 rounded-lg bg-white/5"
                    [style.color]="config.theme?.primaryColor || '#a78bfa'"
                  >
                    <i class="bi bi-telephone"></i>
                  </div>
                  <a
                    href="tel:{{ config.contactPhone }}"
                    class="hover:text-white transition-colors"
                    >{{ config.contactPhone }}</a
                  >
                </li>
              </ul>
            </div>
          </div>

          <div
            class="border-t pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm opacity-60"
            [style.border-color]="
              config.theme?.primaryColor
                ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.12)
                : 'rgba(255,255,255,0.08)'
            "
            [style.color]="
              config.theme?.primaryColor ? hexToRgba(config.theme?.primaryColor || '#ffffff', 0.9) : 'white'
            "
          >
            <p>&copy; {{ year }} {{ config.displayName }}. Powered by Clothify.</p>
            <div class="flex gap-8">
              <a *ngIf="config.pages.privacyPolicy" [routerLink]="routePrefix.concat(['privacy-policy'])" class="hover:text-white transition-colors">Privacy Policy</a>
              <a *ngIf="config.pages.termsAndConditions" [routerLink]="routePrefix.concat(['terms-and-conditions'])" class="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <!-- Shopping Bag Side Drawer Overlay -->
      <div 
        *ngIf="showShoppingBag" 
        (click)="closeShoppingBag()" 
        class="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity animate-fade-in"
      ></div>

      <!-- Shopping Bag Side Drawer Panel -->
      <div 
        class="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col"
        [class.translate-x-full]="!showShoppingBag"
        [class.translate-x-0]="showShoppingBag"
      >
        <!-- Drawer Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 class="text-lg font-black tracking-tight text-gray-900">Shopping Bag</h2>
          <button (click)="closeShoppingBag()" class="text-gray-500 hover:text-black focus:outline-none">
            <i class="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <!-- Drawer Content -->
        <div class="flex-grow overflow-y-auto px-6 py-4 divide-y divide-gray-100">
          <ng-container *ngIf="cartItems$ | async as items">
            <div *ngIf="items.length === 0" class="h-full flex flex-col items-center justify-center py-20 text-center">
              <i class="bi bi-bag-x text-4xl text-gray-300 mb-4 animate-pulse"></i>
              <p class="text-sm font-semibold text-gray-900 mb-1">Your bag is empty</p>
              <p class="text-xs text-gray-400">Discover our collections and add items.</p>
            </div>

            <div 
              *ngFor="let item of items; let i = index" 
              class="flex gap-4 py-6 first:pt-2 last:pb-2 relative group"
            >
              <!-- Remove Button -->
              <button 
                (click)="removeItem(i)" 
                class="absolute top-6 right-0 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
              >
                <i class="bi bi-x-lg text-sm"></i>
              </button>

              <!-- Image -->
              <div 
                [routerLink]="routePrefix.concat(['products', item.product.id])" 
                (click)="closeShoppingBag()"
                class="w-20 h-26 bg-[#f8f9ff] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
              >
                <img [src]="((item.product.images && item.product.images[0]) | optimizeImage:'thumbnail') || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
              </div>

              <!-- Details -->
              <div class="flex-grow flex flex-col justify-between text-left pr-6">
                <div>
                  <h4 
                    [routerLink]="routePrefix.concat(['products', item.product.id])" 
                    (click)="closeShoppingBag()"
                    class="text-xs font-bold text-gray-900 leading-tight hover:underline cursor-pointer"
                  >
                    {{ item.product.name }}
                  </h4>
                  <p class="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wider">
                    <span *ngIf="item.variant?.color">{{ item.variant?.color }}</span>
                    <span *ngIf="item.variant?.color && item.variant?.size"> / </span>
                    <span *ngIf="item.variant?.size">{{ item.variant?.size }}</span>
                  </p>
                </div>

                <div class="flex items-center justify-between mt-4">
                  <span class="text-xs font-black text-gray-900">
                    {{ item.variant?.price || item.product.variants[0]?.price | currency: 'INR' }}
                  </span>

                  <!-- Quantity Modifiers -->
                  <div class="flex items-center border border-gray-200 rounded-full overflow-hidden h-7 bg-white">
                    <button 
                      (click)="updateQuantity(i, item.quantity - 1)" 
                      class="w-6 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus:outline-none"
                      [disabled]="item.quantity <= 1"
                    >
                      <i class="bi bi-dash text-xs"></i>
                    </button>
                    <span class="px-2 text-center font-bold text-[10px] text-gray-900 select-none">
                      {{ item.quantity }}
                    </span>
                    <button 
                      (click)="updateQuantity(i, item.quantity + 1)" 
                      class="w-6 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus:outline-none"
                    >
                      <i class="bi bi-plus text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Drawer Footer -->
        <div class="p-6 border-t border-gray-100 bg-gray-50/50 text-left space-y-4">
          <p class="text-[10px] font-semibold tracking-wide text-gray-500 text-center uppercase">
            Shipping & taxes calculated at checkout
          </p>
          
          <div class="flex gap-3">
            <a 
              [routerLink]="routePrefix.concat(['cart'])" 
              (click)="closeShoppingBag()"
              class="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border border-gray-200 bg-white hover:border-black rounded-lg transition-all"
            >
              View Full Bag
            </a>
            <button 
              *ngIf="cartCount$ | async as count"
              [routerLink]="routePrefix.concat(['checkout'])" 
              (click)="closeShoppingBag()"
              class="flex-1 bg-black text-white py-3 text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity flex justify-between items-center px-4"
            >
              <span>Go To Checkout</span>
              <span>{{ cartTotal$ | async | currency: 'INR' }}</span>
            </button>
          </div>
        </div>
      </div>
      </ng-container>

      <ng-template #websiteDisabled>
        <div class="flex-grow flex items-center justify-center py-20 px-6">
          <div class="max-w-2xl w-full text-center space-y-12 bg-white/40 backdrop-blur-md border border-white/60 p-12 md:p-16 rounded-[2.5rem] shadow-xl">
            <!-- Brand Logo / Name -->
            <div class="flex flex-col items-center gap-4">
              <ng-container *ngIf="config.theme?.logo; else textLogo">
                <img [src]="config.theme?.logo | optimizeImage:'thumbnail':true" alt="Shop Logo" class="h-20 w-auto object-contain drop-shadow-sm" />
              </ng-container>
              <ng-template #textLogo>
                <span class="tracking-tight font-black text-4xl text-gray-900 uppercase">{{ config.displayName || config.shopName || 'Shop' }}</span>
              </ng-template>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-100 text-primary-800 mt-2">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse"></span>
                Coming Soon
              </div>
            </div>

            <!-- Message -->
            <div class="space-y-4">
              <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Our Online Store is Under Construction
              </h2>
              <p class="text-gray-500 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                {{ config.description || 'We are currently preparing our collections and setting up our store for a premium shopping experience. We look forward to welcoming you soon!' }}
              </p>
            </div>

            <!-- Contact & Social Details -->
            <div class="pt-8 border-t border-gray-100/80 space-y-6">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Get In Touch</p>
              
              <div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-gray-700">
                <a *ngIf="config.contactEmail" href="mailto:{{ config.contactEmail }}" class="flex items-center gap-2 hover:text-primary-600 transition-colors">
                  <i class="bi bi-envelope text-lg opacity-75"></i>
                  <span>{{ config.contactEmail }}</span>
                </a>
                <a *ngIf="config.contactPhone" href="tel:{{ config.contactPhone }}" class="flex items-center gap-2 hover:text-primary-600 transition-colors">
                  <i class="bi bi-telephone text-lg opacity-75"></i>
                  <span>{{ config.contactPhone }}</span>
                </a>
              </div>

              <!-- Address -->
              <p *ngIf="config.address" class="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                <i class="bi bi-geo-alt mr-1"></i> {{ config.address }}
              </p>

              <!-- Social Links -->
              <div class="flex justify-center gap-4 pt-4" *ngIf="config.socialLinks">
                <a
                  *ngIf="config.socialLinks.facebook"
                  [href]="config.socialLinks.facebook"
                  target="_blank"
                  class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white hover:border-transparent transition-all shadow-sm"
                  ><i class="bi bi-facebook"></i
                ></a>
                <a
                  *ngIf="config.socialLinks.instagram"
                  [href]="config.socialLinks.instagram"
                  target="_blank"
                  class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white hover:border-transparent transition-all shadow-sm"
                  ><i class="bi bi-instagram"></i
                ></a>
                <a
                  *ngIf="config.socialLinks.twitter"
                  [href]="config.socialLinks.twitter"
                  target="_blank"
                  class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-sky-500 hover:text-white hover:border-transparent transition-all shadow-sm"
                  ><i class="bi bi-twitter-x"></i
                ></a>
              </div>
            </div>
            
            <!-- Powered by Clothify -->
            <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest pt-4">
              Powered by Clothify
            </div>
          </div>
        </div>
      </ng-template>
    </div>

    <ng-template #loading>
      <app-website-loading
        text="Loading Premium Experience..."
        subtext="Getting things ready for you"
      ></app-website-loading>
    </ng-template>
  `,
  styles: [
    `
      .animate-marquee {
        animation: marquee-scroll 25s linear infinite;
      }
      @keyframes marquee-scroll {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-50%);
        }
      }
    `
  ]
})
export class DefaultThemeLayoutComponent implements OnInit, OnDestroy {
  shopConfig$;
  offers: Offer[] = [];
  private originalTitle = '';
  year = new Date().getFullYear();
  cartCount$: Observable<number>;
  showShoppingBag = false;
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  categories$: Observable<string[]>;
  currentUser$: Observable<UserProfile | null>;
  searchQuery = '';
  showMobileSearch = false;
  showMobileMenu = false;
  showProfileDropdown = false;
  showDesktopSearch = false;
  showShopDropdown = false;
  private hoverTimeout: any;

  // Mobile Accordion states
  mobileShopOpen = false;
  mobileCategoriesOpen = false;
  mobileFeaturedOpen = false;
  mobileCollectionsOpen = false;
  mobileNewArrivalsOpen = false;
  mobileSalesOpen = false;
  mobileJournalOpen = false;
  isPageEnabled$: Observable<boolean>;

  constructor(
    @Inject(ShopContextService) private shopContext: ShopContextService,
    private cartService: CartService,
    public authService: AuthService,
    private tenantService: TenantService,
    public router: Router,
    private route: ActivatedRoute,
    private elRef: ElementRef,
    @Inject(DOCUMENT) private document: Document,
    private titleService: Title,
    private websiteService: WebsiteService
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$;
    this.cartCount$ = this.cartService.cartCount$;
    this.currentUser$ = this.authService.currentUser$;
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.cartTotal$;
    this.categories$ = this.websiteService.getCategories();

    // Check if current page is enabled
    this.isPageEnabled$ = combineLatest([
      this.shopConfig$,
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null) // Trigger initial check
      )
    ]).pipe(
      map(([config]) => {
        if (!config || !config.pages) return true;
        
        const url = this.router.url;
        
        if (url.includes('/products') || url.includes('/collections')) return config.pages.products !== false;
        if (url.includes('/offers')) return config.pages.offers !== false;
        if (url.includes('/contact')) return config.pages.contact !== false;
        if (url.includes('/shipping-policy')) return config.pages.shippingPolicy !== false;
        if (url.includes('/return-policy')) return config.pages.returnPolicy !== false;
        if (url.includes('/terms-and-conditions')) return config.pages.termsAndConditions !== false;
        if (url.includes('/privacy-policy')) return config.pages.privacyPolicy !== false;
        
        // Check home page
        const slug = this.tenantService.getPathSlug();
        const basePath = slug ? `/shop_${slug}` : '/';
        if (url === basePath || url === `${basePath}/`) {
          return config.pages.home !== false;
        }
        
        return true; // Default true for cart, checkout, etc.
      })
    );

    // Close mobile menu on route change
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.showMobileMenu = false;
      this.showMobileSearch = false;
      this.showProfileDropdown = false;
      this.showDesktopSearch = false;
      this.showShopDropdown = false;
      this.showShoppingBag = false;

      // Reset mobile accordion states
      this.mobileShopOpen = false;
      this.mobileCategoriesOpen = false;
      this.mobileFeaturedOpen = false;
      this.mobileCollectionsOpen = false;
      this.mobileNewArrivalsOpen = false;
      this.mobileSalesOpen = false;
      this.mobileJournalOpen = false;
    });
  }

  /** Close profile dropdown when clicking anywhere outside the component */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showProfileDropdown && !this.elRef.nativeElement.contains(event.target)) {
      this.showProfileDropdown = false;
    }
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    if (slug) {
      return ['/shop', slug];
    }
    return ['/'];
  }

  get announcementTexts(): string[] {
    if (!this.offers || this.offers.length === 0) return [];
    return this.offers.map((offer) => {
      switch (offer.type) {
        case 'percentage':
          return offer.code
            ? `GET ${offer.value}% OFF! Use code: ${offer.code}`
            : `GET ${offer.value}% OFF ON ALL orders!`;
        case 'flat':
          return offer.code
            ? `GET FLAT Γé╣${offer.value} OFF! Use code: ${offer.code}`
            : `GET FLAT Γé╣${offer.value} OFF ON ALL orders!`;
        case 'buy_x_get_y':
          return `BUY ${offer.buyX} GET ${offer.getY} FREE!`;
        case 'free_shipping':
          return `FREE SHIPPING on orders of Γé╣${offer.minCalculatedAmount || 0} or more!`;
        default:
          return offer.title;
      }
    });
  }

  ngOnInit() {
    this.originalTitle = this.titleService.getTitle();
    this.shopConfig$.subscribe((config: any) => {
      if (config) {
        this.enforcePlan(config);
        const shopTitle = config.displayName || config.shopName || 'Clothify Shop';
        this.titleService.setTitle(shopTitle);

        if (config.googleAnalytics && config.googleAnalytics.connected && config.googleAnalytics.measurementId) {
          this.injectGoogleAnalytics(config.googleAnalytics.measurementId);
        }

        // Load active offers for marquee
        this.websiteService.getOffers().subscribe({
          next: (offers: any) => {
            this.offers = (offers || []).filter((o: any) => o.isActive && o.showOnWebsite !== false);
          },
          error: (err: any) => {
            console.error('Failed to load active offers for announcement bar', err);
            this.offers = [];
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.originalTitle) {
      this.titleService.setTitle(this.originalTitle);
    }
  }

  injectGoogleAnalytics(measurementId: string) {
    if (!this.document || typeof window === 'undefined') return;
    
    const scriptId = 'google-analytics-script';
    if (this.document.getElementById(scriptId)) return;

    const script = this.document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId.trim()}`;
    this.document.head.appendChild(script);

    const inlineScript = this.document.createElement('script');
    inlineScript.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId.trim()}');
    `;
    this.document.head.appendChild(inlineScript);
    console.log(`[Google Analytics] Dynamic script injected for ID: ${measurementId}`);
  }

  private enforcePlan(config: ShopConfig) {
    const isSubdomain = !!this.tenantService.getSubdomainSlug();
    const isPath = !!this.tenantService.getPathSlug();

    if (config.subdomainEnabled && isPath) {
      const protocol = this.document.location.protocol;
      const hostname = this.document.location.hostname;
      let newOrigin = '';
      if (hostname.includes('localhost')) {
        newOrigin = `${protocol}//${config.slug}.localhost:4200`;
      } else {
        const baseDomain = 'clothify.app';
        newOrigin = `${protocol}//${config.slug}.${baseDomain}`;
      }
      window.location.href = newOrigin;
    }

    if (!config.subdomainEnabled && isSubdomain) {
      const protocol = this.document.location.protocol;
      const hostname = this.document.location.hostname;
      let newOrigin = '';
      if (hostname.includes('localhost')) {
        newOrigin = `${protocol}//localhost:4200/shop/${config.slug}`;
      } else {
        newOrigin = `${protocol}//clothify.app/shop/${config.slug}`;
      }
      window.location.href = newOrigin;
    }
  }

  toggleProfileDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  closeProfileDropdown() {
    this.showProfileDropdown = false;
  }

  toggleShoppingBag() {
    this.showShoppingBag = !this.showShoppingBag;
  }

  closeShoppingBag() {
    this.showShoppingBag = false;
  }

  updateQuantity(index: number, quantity: number) {
    if (quantity > 0) {
      this.cartService.updateQuantity(index, quantity);
    }
  }

  removeItem(index: number) {
    this.cartService.removeFromCart(index);
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

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate([...this.routePrefix, 'products'], {
        queryParams: { search: this.searchQuery },
        queryParamsHandling: 'merge',
      });
      this.showMobileSearch = false;
    } else {
      this.router.navigate([...this.routePrefix, 'products'], {
        queryParams: { search: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  toggleMobileSearch() {
    this.showMobileSearch = !this.showMobileSearch;
    if (this.showMobileSearch) {
      this.showMobileMenu = false;
    }
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    if (this.showMobileMenu) {
      this.showMobileSearch = false;
    }
  }

  onMouseEnterShop() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.showShopDropdown = true;
  }

  onMouseLeaveShop() {
    this.hoverTimeout = setTimeout(() => {
      this.showShopDropdown = false;
    }, 150);
  }

  closeShopDropdown() {
    this.showShopDropdown = false;
  }

  toggleDesktopSearch() {
    this.showDesktopSearch = !this.showDesktopSearch;
  }

  toggleMobileShop() {
    this.mobileShopOpen = !this.mobileShopOpen;
  }

  toggleMobileCategories() {
    this.mobileCategoriesOpen = !this.mobileCategoriesOpen;
  }

  toggleMobileFeatured() {
    this.mobileFeaturedOpen = !this.mobileFeaturedOpen;
  }

  toggleMobileCollections() {
    this.mobileCollectionsOpen = !this.mobileCollectionsOpen;
  }

  toggleMobileNewArrivals() {
    this.mobileNewArrivalsOpen = !this.mobileNewArrivalsOpen;
  }

  toggleMobileSales() {
    this.mobileSalesOpen = !this.mobileSalesOpen;
  }

  toggleMobileJournal() {
    this.mobileJournalOpen = !this.mobileJournalOpen;
  }

  logout() {
    this.authService.logout();
  }

  /**
   * Converts a hex color to rgba with given opacity.
   * Used for dynamic footer border and glow effects.
   */
  hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255,255,255,${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  }
}
