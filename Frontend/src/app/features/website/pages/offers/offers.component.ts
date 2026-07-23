import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../../../core/services/tenant.service';
import { WebsiteService } from '../../services/website.service';
import { Offer } from '../../../../core/models/offer.model';
import { ShopContextService } from '../../../../core/services/shop-context.service';
import { OptimizeImagePipe } from '../../../../shared/pipes/optimize-image.pipe';

interface OfferCard {
  tag: string;
  title: string;
  subtitle: string;
  code: string;
  expiry: string;
  image: string;
  category: string;
  type: string;
}

interface LimitedTimeDeal {
  title: string;
  desc: string;
  code: string;
  image: string;
  category: string;
  type: string;
  timeLeft: number; // in seconds
  hours: string;
  minutes: string;
  seconds: string;
}

interface CouponCode {
  code: string;
  subtitle: string;
  desc: string;
  copied?: boolean;
}

@Component({
  selector: 'app-website-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OptimizeImagePipe],
  template: `
    <div class="bg-white min-h-screen pt-4 pb-20 text-left font-sans selection:bg-black selection:text-white">
      
      <!-- Clean Minimalist Header & Main Layout -->
      <div class="container mx-auto px-4 max-w-9xl pt-8 animate-fade-in-up">
        <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-6">
          Offers
        </h1>

        <!-- Category Pills & Actions Desktop -->
        <div class="hidden lg:flex justify-between items-center border-b border-gray-100 pb-6 mb-10">
          <!-- Pills -->
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let cat of ['All', 'Clothing', 'Accessories', 'Footwear', 'Bags', 'Home', 'Beauty']"
              (click)="selectCategory(cat)"
              class="px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer"
              [class.bg-black]="selectedCategory === cat"
              [class.text-white]="selectedCategory === cat"
              [class.border-black]="selectedCategory === cat"
              [class.bg-white]="selectedCategory !== cat"
              [class.text-gray-600]="selectedCategory !== cat"
              [class.border-gray-200]="selectedCategory !== cat"
              [class.hover:border-black]="selectedCategory !== cat"
              [class.hover:text-black]="selectedCategory !== cat"
            >
              {{ cat === 'All' ? 'All Offers' : cat }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-8">
            <!-- Sort dropdown -->
            <div class="relative flex items-center gap-2">
              <span class="text-xs font-bold tracking-widest uppercase text-gray-400">Sort</span>
              <select class="appearance-none bg-transparent pr-8 pl-1 py-1.5 focus:outline-none font-semibold text-gray-900 cursor-pointer text-sm">
                <option>Newest First</option>
                <option>Discount High to Low</option>
                <option>Expiring Soon</option>
              </select>
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

        <!-- Mobile Pills & Actions -->
        <div class="lg:hidden flex flex-col gap-4 mb-8">
          <!-- Horizontal Scroll Pills -->
          <div class="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4">
            <button
              *ngFor="let cat of ['All', 'Clothing', 'Accessories', 'Footwear', 'Bags', 'Home', 'Beauty']"
              (click)="selectCategory(cat)"
              class="px-5 py-2 rounded-full border text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0"
              [class.bg-black]="selectedCategory === cat"
              [class.text-white]="selectedCategory === cat"
              [class.border-black]="selectedCategory === cat"
              [class.bg-white]="selectedCategory !== cat"
              [class.text-gray-600]="selectedCategory !== cat"
              [class.border-gray-200]="selectedCategory !== cat"
            >
              {{ cat === 'All' ? 'All Offers' : cat }}
            </button>
          </div>

          <!-- Sort / Filter Bar -->
          <div class="grid grid-cols-2 border-t border-b border-gray-100 py-3.5 text-center text-sm font-semibold">
            <!-- Sort Mobile -->
            <div class="relative flex items-center justify-center gap-2 border-r border-gray-100">
              <span class="text-xs font-bold tracking-widest uppercase text-gray-400">Sort</span>
              <select class="appearance-none bg-transparent pr-6 pl-1 py-1 focus:outline-none font-semibold text-gray-900 cursor-pointer">
                <option>Newest First</option>
                <option>Discount High to Low</option>
                <option>Expiring Soon</option>
              </select>
              <i class="bi bi-chevron-down text-[10px] text-gray-400 absolute right-8 pointer-events-none"></i>
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



        <!-- MAIN OFFERS PAGE CONTENT -->
        <div class="space-y-12 w-full overflow-hidden">

            <!-- Ribbon Grid (4 Highlights) -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-gray-100">
              <!-- Top Deals -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gray-50 text-gray-900 flex items-center justify-center flex-shrink-0">
                  <i class="bi bi-tags text-base"></i>
                </div>
                <div>
                  <h4 class="text-base font-black text-gray-900 leading-tight">Top Deals</h4>
                  <p class="text-[11px] text-gray-400 font-normal mt-0.5">Best offers for you</p>
                </div>
              </div>
              <!-- Limited Time -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gray-50 text-gray-900 flex items-center justify-center flex-shrink-0">
                  <i class="bi bi-clock text-base animate-pulse"></i>
                </div>
                <div>
                  <h4 class="text-base font-black text-gray-900 leading-tight">Limited Time</h4>
                  <p class="text-[11px] text-gray-400 font-normal mt-0.5">Hurry, don't miss out!</p>
                </div>
              </div>
              <!-- Extra Savings -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gray-50 text-gray-900 flex items-center justify-center flex-shrink-0">
                  <i class="bi bi-percent text-base"></i>
                </div>
                <div>
                  <h4 class="text-base font-black text-gray-900 leading-tight">Extra Savings</h4>
                  <p class="text-[11px] text-gray-400 font-normal mt-0.5">On your favorite styles</p>
                </div>
              </div>
              <!-- Free Shipping -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gray-50 text-gray-900 flex items-center justify-center flex-shrink-0">
                  <i class="bi bi-truck text-base"></i>
                </div>
                <div>
                  <h4 class="text-base font-black text-gray-900 leading-tight">Free Shipping</h4>
                  <p class="text-[11px] text-gray-400 font-normal mt-0.5">On select offers</p>
                </div>
              </div>
            </div>



            <!-- LIMITED TIME DEALS SECTION -->
            <div class="space-y-8">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 class="text-base font-black text-gray-900 uppercase tracking-widest">Limited Time Deals</h2>
                <a class="text-[12px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1 cursor-pointer">
                  View All <i class="bi bi-arrow-right"></i>
                </a>
              </div>

              <!-- Grid -->
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                <div 
                  *ngFor="let deal of limitedTimeDeals" 
                  class="group relative flex flex-col h-full cursor-pointer animate-fade-in"
                >
                  <a [routerLink]="routePrefix.concat(['products'])" class="block flex-grow flex flex-col">
                    <!-- Image Container -->
                    <div class="relative aspect-[3/4] bg-[#f8f9ff] overflow-hidden mb-4">
                      <img [src]="deal.image | optimizeImage:'card'" [alt]="deal.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" loading="lazy" />
                      
                      <!-- Timer Overlay -->
                      <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-150 py-1.5 px-2 flex gap-1.5 text-center shadow-sm">
                        <div>
                          <span class="block text-[12px] font-black text-gray-900 leading-none">{{ deal.hours }}</span>
                          <span class="block text-[6px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">hrs</span>
                        </div>
                        <span class="text-[12px] font-bold text-gray-400 leading-none">:</span>
                        <div>
                          <span class="block text-[12px] font-black text-gray-900 leading-none">{{ deal.minutes }}</span>
                          <span class="block text-[6px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">mins</span>
                        </div>
                        <span class="text-[12px] font-bold text-gray-400 leading-none">:</span>
                        <div>
                          <span class="block text-[12px] font-black text-red-600 leading-none">{{ deal.seconds }}</span>
                          <span class="block text-[6px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">secs</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Card Details -->
                    <div class="flex flex-col text-left">
                      <h3 class="text-sm font-semibold text-gray-900 mt-1 mb-1 leading-tight group-hover:underline">
                        {{ deal.title }}
                      </h3>
                      <p class="text-sm text-gray-500 font-semibold">
                        {{ deal.desc }} • Code: {{ deal.code }}
                      </p>
                    </div>
                  </a>
                </div>
              </div>
              <div *ngIf="limitedTimeDeals.length === 0" class="text-center py-12 text-gray-400 text-sm font-semibold">
                No limited time deals matching the filters.
              </div>
            </div>

            <!-- TOP COUPON CODES SECTION -->
            <div class="space-y-6">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 class="text-base font-black text-gray-900 uppercase tracking-widest">Top Coupon Codes</h2>
                <a class="text-[12px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1 cursor-pointer">
                  View All <i class="bi bi-arrow-right"></i>
                </a>
              </div>

              <!-- Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div 
                  *ngFor="let coupon of coupons; let idx = index" 
                  class="relative flex bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden group hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:-translate-y-1"
                >
                  
                  <!-- Left Colored Sidebar -->
                  <div class="w-14 sm:w-16 flex-shrink-0 flex items-center justify-center relative"
                       [style.background-color]="getCouponBgColor(idx)">
                    
                    <!-- Semi-circle Cutout on the left edge (outer) -->
                    <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-inner"></div>
                    
                    <!-- Vertical Text -->
                    <div class="transform -rotate-90 text-white font-black tracking-widest text-[10px] sm:text-xs whitespace-nowrap uppercase opacity-90">
                      Discount
                    </div>
                  </div>

                  <!-- Divider Line (Dashed) -->
                  <div class="w-0 border-l-2 border-dashed border-gray-200 relative flex-shrink-0"></div>

                  <!-- Right Content Area -->
                  <div class="p-5 flex-1 relative bg-white">
                    <!-- Top-right circles decorator -->
                    <div class="absolute top-4 right-4 w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm">
                       <div class="w-3 h-3 rounded-full" [style.background-color]="getCouponBgColor(idx)"></div>
                       <div class="w-3 h-3 rounded-full -ml-1 opacity-70 mix-blend-multiply" [style.background-color]="getCouponBgColor(idx + 1)"></div>
                    </div>

                    <div class="space-y-4">
                      <div class="space-y-1 pr-10">
                         <h3 class="text-sm font-bold text-gray-500">{{ coupon.subtitle }}</h3>
                         <div class="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{{ coupon.code }}</div>
                      </div>
                      
                      <div class="space-y-1">
                        <p class="text-xs font-semibold text-gray-600">{{ coupon.desc }}</p>
                        <p class="text-[10px] text-primary-600 font-semibold">*Terms & conditions</p>
                      </div>
                      
                      <button 
                        (click)="copyCode(coupon.code, idx)"
                        class="w-full py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none"
                        [class.bg-green-50]="coupon.copied"
                        [class.border-green-200]="coupon.copied"
                        [class.text-green-700]="coupon.copied"
                      >
                        {{ coupon.copied ? 'Code Applied!' : 'Apply Code' }}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- PROMO BANNER CARDS GRID -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              
              <!-- Card 1: Bank Offers -->
              <a 
                [routerLink]="routePrefix.concat(['products'])"
                class="group relative block aspect-[1.8/1] sm:aspect-auto sm:h-36 overflow-hidden bg-gray-900 border border-gray-200 shadow-none"
              >
                <!-- Background Image -->
                <img 
                  src="/Cloth_placeholder.png" 
                  class="absolute inset-0 w-full h-full object-cover opacity-35 scale-102 group-hover:scale-105 transition-transform duration-700" 
                />
                <div class="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <!-- Content overlay -->
                <div class="absolute inset-0 p-5 flex flex-col justify-between items-start text-white text-left">
                  <div class="space-y-1">
                    <h3 class="text-sm font-black tracking-wide uppercase">Bank Offers</h3>
                    <p class="text-[11px] text-gray-300 font-medium leading-tight max-w-[150px]">Extra Savings on Credit & Debit Cards</p>
                  </div>
                  <div class="w-8 h-8 bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-colors">
                    <i class="bi bi-arrow-right text-sm"></i>
                  </div>
                </div>
              </a>

              <!-- Card 2: Student Offers -->
              <a 
                [routerLink]="routePrefix.concat(['products'])"
                class="group relative block aspect-[1.8/1] sm:aspect-auto sm:h-36 overflow-hidden bg-gray-900 border border-gray-200 shadow-none"
              >
                <img 
                  src="/Cloth_placeholder.png" 
                  class="absolute inset-0 w-full h-full object-cover opacity-35 scale-102 group-hover:scale-105 transition-transform duration-700" 
                />
                <div class="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div class="absolute inset-0 p-5 flex flex-col justify-between items-start text-white text-left">
                  <div class="space-y-1">
                    <h3 class="text-sm font-black tracking-wide uppercase">Student Offers</h3>
                    <p class="text-[11px] text-gray-300 font-medium leading-tight max-w-[150px]">Extra Discount For Students</p>
                  </div>
                  <div class="w-8 h-8 bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-colors">
                    <i class="bi bi-arrow-right text-sm"></i>
                  </div>
                </div>
              </a>

              <!-- Card 3: New User Offers -->
              <a 
                [routerLink]="routePrefix.concat(['products'])"
                class="group relative block aspect-[1.8/1] sm:aspect-auto sm:h-36 overflow-hidden bg-gray-900 border border-gray-200 shadow-none"
              >
                <img 
                  src="/Cloth_placeholder.png" 
                  class="absolute inset-0 w-full h-full object-cover opacity-35 scale-102 group-hover:scale-105 transition-transform duration-700" 
                />
                <div class="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div class="absolute inset-0 p-5 flex flex-col justify-between items-start text-white text-left">
                  <div class="space-y-1">
                    <h3 class="text-sm font-black tracking-wide uppercase">New User Offers</h3>
                    <p class="text-[11px] text-gray-300 font-medium leading-tight max-w-[150px]">Special Deals For New Users</p>
                  </div>
                  <div class="w-8 h-8 bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-colors">
                    <i class="bi bi-arrow-right text-sm"></i>
                  </div>
                </div>
              </a>

              <!-- Card 4: Clearance Sale -->
              <a 
                [routerLink]="routePrefix.concat(['products'])"
                class="group relative block aspect-[1.8/1] sm:aspect-auto sm:h-36 overflow-hidden bg-gray-900 border border-gray-200 shadow-none"
              >
                <img 
                  src="/Cloth_placeholder.png" 
                  class="absolute inset-0 w-full h-full object-cover opacity-35 scale-102 group-hover:scale-105 transition-transform duration-700" 
                />
                <div class="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div class="absolute inset-0 p-5 flex flex-col justify-between items-start text-white text-left">
                  <div class="space-y-1">
                    <h3 class="text-sm font-black tracking-wide uppercase">Clearance Sale</h3>
                    <p class="text-[11px] text-gray-300 font-medium leading-tight max-w-[150px]">Up to 60% Off, Grab Before It's Gone</p>
                  </div>
                  <div class="w-8 h-8 bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-colors">
                    <i class="bi bi-arrow-right text-sm"></i>
                  </div>
                </div>
              </a>

            </div>
          </div>
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
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 class="text-xl font-black text-gray-900 tracking-tight">Filters</h2>
          <button (click)="toggleMobileFilters()" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        
        <div class="flex-grow p-6 overflow-y-auto space-y-8">
          <!-- Search Box -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Search</h3>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="applyFilters()"
                placeholder="Search offers..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
              <i class="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
          </div>

          <!-- Category (Mobile Only) -->
          <div class="lg:hidden">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Category</h3>
            <div class="space-y-1">
              <button
                *ngFor="let cat of ['All', 'Clothing', 'Accessories', 'Footwear', 'Bags', 'Home', 'Beauty']"
                (click)="selectCategory(cat); toggleMobileFilters()"
                class="w-full text-left py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                [class.bg-gray-100]="selectedCategory === cat"
                [class.text-black]="selectedCategory === cat"
                [class.font-bold]="selectedCategory === cat"
                [class.text-gray-600]="selectedCategory !== cat"
                [class.hover:bg-gray-50]="selectedCategory !== cat"
              >
                {{ cat === 'All' ? 'All Offers' : cat }}
              </button>
            </div>
          </div>

          <!-- Offer Type -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Offer Type</h3>
            <div class="space-y-1">
              <button
                *ngFor="let type of ['All', 'Percent Off', 'Buy More, Save More', 'Flat Discount', 'Free Shipping']"
                (click)="selectOfferType(type)"
                class="w-full text-left py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex justify-between items-center"
                [class.bg-gray-100]="selectedOfferType === type"
                [class.text-black]="selectedOfferType === type"
                [class.font-bold]="selectedOfferType === type"
                [class.text-gray-600]="selectedOfferType !== type"
                [class.hover:bg-gray-50]="selectedOfferType !== type"
              >
                {{ type === 'All' ? 'All Types' : type }}
                <i *ngIf="selectedOfferType === type" class="bi bi-check text-lg"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
          <button (click)="clearAll(); toggleMobileFilters()" class="flex-1 py-3 text-sm font-bold border border-gray-200 bg-white rounded-xl hover:border-black transition-colors">
            Reset All
          </button>
          <button (click)="toggleMobileFilters()" class="flex-1 py-3 text-sm font-bold bg-black text-white rounded-xl hover:opacity-90 transition-opacity">
            Apply
          </button>
        </div>
      </aside>
    </div>
  `,
})
export class WebsiteOffersComponent implements OnInit, OnDestroy {
  // Filter bindings
  searchQuery: string = '';
  selectedCategory: string = 'All';
  selectedOfferType: string = 'All';
  selectedDiscount: string = 'All';
  maxPrice: number = 1000;
  expiryFilter: string = 'All';
  showMobileFilters: boolean = false;

  // Master lists
  featuredOffersMaster: OfferCard[] = [
    {
      tag: "30% OFF",
      title: "Flat 30% Off",
      subtitle: "On All Winter Collection",
      code: "WINTER30",
      expiry: "Valid till 31 May, 2026",
      image: "/Cloth_placeholder.png",
      category: "Clothing",
      type: "Percent Off"
    },
    {
      tag: "20% OFF",
      title: "Extra 20% Off",
      subtitle: "On Orders Above $199",
      code: "EXTRA20",
      expiry: "Valid till 25 May, 2026",
      image: "/Cloth_placeholder.png",
      category: "Accessories",
      type: "Percent Off"
    },
    {
      tag: "15% OFF",
      title: "Flat 15% Off",
      subtitle: "On Footwear",
      code: "STEP15",
      expiry: "Valid till 20 May, 2026",
      image: "/Cloth_placeholder.png",
      category: "Footwear",
      type: "Percent Off"
    },
    {
      tag: "BOGO",
      title: "Buy 1 Get 1 Free",
      subtitle: "On Selected Perfumes",
      code: "BOGO1",
      expiry: "Valid till 30 May, 2026",
      image: "/Cloth_placeholder.png",
      category: "Beauty",
      type: "Buy More, Save More"
    }
  ];

  limitedTimeDealsMaster: LimitedTimeDeal[] = [
    {
      title: "Cashmere Sweaters",
      desc: "Up to 40% Off",
      code: "CASH40",
      image: "/Cloth_placeholder.png",
      category: "Clothing",
      type: "Flat Discount",
      timeLeft: 8147, // 2h 15m 47s
      hours: '02',
      minutes: '15',
      seconds: '47'
    },
    {
      title: "Luxury Bags",
      desc: "Min. 25% Off",
      code: "BAG25",
      image: "/Cloth_placeholder.png",
      category: "Bags",
      type: "Flat Discount",
      timeLeft: 4547, // 1h 15m 47s
      hours: '01',
      minutes: '15',
      seconds: '47'
    },
    {
      title: "Summer Collection",
      desc: "Up to 30% Off",
      code: "SUMMER30",
      image: "/Cloth_placeholder.png",
      category: "Clothing",
      type: "Percent Off",
      timeLeft: 11747, // 3h 15m 47s
      hours: '03',
      minutes: '15',
      seconds: '47'
    },
    {
      title: "Sneaker Fest",
      desc: "Flat 20% Off",
      code: "SNEAK20",
      image: "/Cloth_placeholder.png",
      category: "Footwear",
      type: "Flat Discount",
      timeLeft: 15347, // 4h 15m 47s
      hours: '04',
      minutes: '15',
      seconds: '47'
    }
  ];

  couponsMaster: CouponCode[] = [
    { code: "WELCOME15", subtitle: "Flat 15% Off", desc: "On Your First Order" },
    { code: "VIP20", subtitle: "Extra 20% Off", desc: "For VIP Members" },
    { code: "FREESHIP", subtitle: "Free Shipping", desc: "On Orders Above $99" },
    { code: "BANK10", subtitle: "10% Instant Discount", desc: "On Select Bank Cards" }
  ];

  // Filtered lists shown in UI
  featuredOffers: OfferCard[] = [];
  limitedTimeDeals: LimitedTimeDeal[] = [];
  coupons: CouponCode[] = [];

  // Sidebar count indicators
  categoriesCount = {
    all: 0,
    clothing: 120,
    accessories: 58,
    footwear: 36,
    bags: 24,
    home: 18,
    beauty: 12
  };

  offerTypesCount = {
    all: 0,
    percent: 18,
    bogo: 12,
    flat: 14,
    freeShipping: 9,
    exchange: 6,
    bank: 8
  };

  timerInterval: any;
  loading: boolean = false;
  error: string = '';

  shopConfig$;

  constructor(
    private tenantService: TenantService,
    private websiteService: WebsiteService,
    private shopContext: ShopContextService
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }

  getCouponBgColor(index: number): string {
    const colors = [
      'var(--color-primary-600)',
      'var(--color-warning)', // Orange
      'var(--color-success)', // Green
      'var(--color-danger)',  // Red
      'var(--color-info)'     // Light blue/purple
    ];
    return colors[index % colors.length];
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.loadOffers();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadOffers() {
    this.loading = true;
    this.error = '';

    this.websiteService.getOffers().subscribe({
      next: (resOffers) => {
        const offers = (resOffers || []).filter(o => o.isActive && o.showOnWebsite !== false);
        if (offers.length > 0) {
          this.processDynamicOffers(offers);
        } else {
          // Fallback to mock data if shop has no offers defined yet
          this.featuredOffersMaster = [...this.featuredOffersMaster];
          this.limitedTimeDealsMaster = [...this.limitedTimeDealsMaster];
          this.couponsMaster = [...this.couponsMaster];
          this.resetFilteredData();
          this.startCountdown();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching shop offers:', err);
        // Fallback to mock data on error so UI remains complete
        this.featuredOffersMaster = [...this.featuredOffersMaster];
        this.limitedTimeDealsMaster = [...this.limitedTimeDealsMaster];
        this.couponsMaster = [...this.couponsMaster];
        this.resetFilteredData();
        this.startCountdown();
        this.loading = false;
      }
    });
  }

  processDynamicOffers(offers: Offer[]) {
    // Reset master lists to build dynamically
    this.featuredOffersMaster = [];
    this.limitedTimeDealsMaster = [];
    this.couponsMaster = [];

    offers.forEach((offer) => {
      const tag = this.getOfferTag(offer);
      const title = offer.title;
      const subtitle = this.getOfferSubtitle(offer);
      const code = offer.code || 'N/A';
      
      const endDate = new Date(offer.endDate);
      const expiry = `Valid till ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      const category = (offer as any).category || 'Clothing';
      const type = this.getOfferTypeLabel(offer.type);
      const image = (offer as any).image || this.getRandomOfferImage(offer.type);

      // 1. Featured Offers
      if (offer.type === 'percentage' || offer.type === 'flat' || offer.type === 'buy_x_get_y') {
        this.featuredOffersMaster.push({
          tag,
          title,
          subtitle,
          code,
          expiry,
          image,
          category,
          type
        });
      }

      // 2. Limited Time Deals
      const now = new Date().getTime();
      const end = isNaN(endDate.getTime()) ? now + 86400000 * 7 : endDate.getTime(); // default 7 days if no valid end date
      const timeLeft = Math.max(0, Math.floor((end - now) / 1000));

      if (timeLeft > 0 || isNaN(endDate.getTime())) {
        this.limitedTimeDealsMaster.push({
          title,
          desc: subtitle,
          code,
          image,
          category,
          type,
          timeLeft: timeLeft > 0 ? timeLeft : 86400,
          hours: '00',
          minutes: '00',
          seconds: '00'
        });
      }

      // 3. Coupon Codes
      if (offer.code) {
        this.couponsMaster.push({
          code: offer.code,
          subtitle: title,
          desc: subtitle
        });
      }
    });

    this.resetFilteredData();
    this.startCountdown();
  }

  getOfferTag(offer: Offer): string {
    if (offer.type === 'percentage') return `${offer.value}% OFF`;
    if (offer.type === 'flat') return `₹${offer.value} OFF`;
    if (offer.type === 'buy_x_get_y') return 'BOGO';
    if (offer.type === 'free_shipping') return 'FREE';
    return 'PROMO';
  }

  getOfferSubtitle(offer: Offer): string {
    if (offer.type === 'percentage') return `Get ${offer.value}% off on your purchase.`;
    if (offer.type === 'flat') return `Flat ₹${offer.value} discount on orders.`;
    if (offer.type === 'buy_x_get_y') return `Buy ${offer.buyX} and get ${offer.getY} free.`;
    if (offer.type === 'free_shipping') return 'Enjoy free shipping on your orders.';
    return 'Special promotional discount.';
  }

  getOfferTypeLabel(type: string): string {
    if (type === 'percentage') return 'Percent Off';
    if (type === 'buy_x_get_y') return 'Buy More, Save More';
    if (type === 'flat') return 'Flat Discount';
    if (type === 'free_shipping') return 'Free Shipping';
    return 'Percent Off';
  }

  getRandomOfferImage(type: string): string {
    const images: Record<string, string> = {
      percentage: '/Cloth_placeholder.png',
      flat: '/Cloth_placeholder.png',
      buy_x_get_y: '/Cloth_placeholder.png',
      free_shipping: '/Cloth_placeholder.png'
    };
    return images[type] || '/Cloth_placeholder.png';
  }

  resetFilteredData() {
    this.featuredOffers = [...this.featuredOffersMaster];
    this.limitedTimeDeals = [...this.limitedTimeDealsMaster];
    this.coupons = [...this.couponsMaster];
  }

  startCountdown() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      this.limitedTimeDeals.forEach(deal => {
        if (deal.timeLeft > 0) {
          deal.timeLeft--;
          const hrs = Math.floor(deal.timeLeft / 3600);
          const mins = Math.floor((deal.timeLeft % 3600) / 60);
          const secs = deal.timeLeft % 60;

          deal.hours = hrs < 10 ? `0${hrs}` : `${hrs}`;
          deal.minutes = mins < 10 ? `0${mins}` : `${mins}`;
          deal.seconds = secs < 10 ? `0${secs}` : `${secs}`;
        } else {
          deal.hours = '00';
          deal.minutes = '00';
          deal.seconds = '00';
        }
      });
    }, 1000);
  }

  copyCode(code: string, couponIndex: number) {
    navigator.clipboard.writeText(code).then(() => {
      this.coupons[couponIndex].copied = true;
      setTimeout(() => {
        this.coupons[couponIndex].copied = false;
      }, 2000);
    });
  }

  applyFilters() {
    // 1. Filter Featured Offers
    this.featuredOffers = this.featuredOffersMaster.filter(offer => {
      // Search Match
      const searchLower = this.searchQuery.toLowerCase();
      const matchSearch = !this.searchQuery || 
        offer.title.toLowerCase().includes(searchLower) ||
        offer.subtitle.toLowerCase().includes(searchLower) ||
        offer.code.toLowerCase().includes(searchLower) ||
        offer.category.toLowerCase().includes(searchLower);

      // Category Match
      const matchCategory = this.selectedCategory === 'All' || offer.category === this.selectedCategory;

      // Offer Type Match
      const matchType = this.selectedOfferType === 'All' || offer.type === this.selectedOfferType;

      return matchSearch && matchCategory && matchType;
    });

    // 2. Filter Limited Time Deals
    this.limitedTimeDeals = this.limitedTimeDealsMaster.filter(deal => {
      const searchLower = this.searchQuery.toLowerCase();
      const matchSearch = !this.searchQuery || 
        deal.title.toLowerCase().includes(searchLower) ||
        deal.desc.toLowerCase().includes(searchLower) ||
        deal.code.toLowerCase().includes(searchLower) ||
        deal.category.toLowerCase().includes(searchLower);

      const matchCategory = this.selectedCategory === 'All' || deal.category === this.selectedCategory;
      const matchType = this.selectedOfferType === 'All' || deal.type === this.selectedOfferType;

      return matchSearch && matchCategory && matchType;
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  selectOfferType(type: string) {
    this.selectedOfferType = type;
    this.applyFilters();
  }

  clearAll() {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.selectedOfferType = 'All';
    this.selectedDiscount = 'All';
    this.maxPrice = 1000;
    this.expiryFilter = 'All';
    this.resetFilteredData();
  }

  toggleMobileFilters() {
    this.showMobileFilters = !this.showMobileFilters;
  }
}
