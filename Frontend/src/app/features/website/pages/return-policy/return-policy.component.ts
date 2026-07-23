import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopContextService } from '../../../../core/services/shop-context.service';

@Component({
  selector: 'app-website-return-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white min-h-screen font-sans pb-24" *ngIf="shopConfig$ | async as config">
      <div class="container mx-auto px-6 max-w-[1400px] pt-12 md:pt-16">
        <div class="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">
          
          <!-- LEFT SIDEBAR: HELP & SUPPORT -->
          <div class="w-full lg:w-64 shrink-0 hidden lg:block sticky top-28">
            <h4 class="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-8">Help & Support</h4>
            <nav class="space-y-2 text-[13px] font-semibold text-gray-500">
              <a [routerLink]="['/shipping-policy']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-box-seam text-lg"></i> Shipping Policy
              </a>
              <a [routerLink]="['/return-policy']" class="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 transition-colors">
                <i class="bi bi-arrow-repeat text-lg"></i> Returns & Exchanges
              </a>
              <a href="#" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-credit-card text-lg"></i> Payments & Promotions
              </a>
              <a [routerLink]="['/size-guide']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-rulers text-lg"></i> Size Guide
              </a>
              <a [routerLink]="['/contact']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-envelope text-lg"></i> Contact Us
              </a>
              <a [routerLink]="['/terms-and-conditions']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-file-earmark-text text-lg"></i> Terms & Conditions
              </a>
            </nav>
          </div>

          <!-- MAIN CONTENT -->
          <div class="flex-1 w-full max-w-5xl">
            
            <!-- Hero Banner -->
            <div class="relative bg-[#f8f6f4] rounded-2xl overflow-hidden min-h-[300px] flex items-center mb-8">
              <div class="px-10 py-12 md:px-16 w-full md:w-3/5 z-10">
                <h1 class="text-4xl md:text-[44px] font-medium text-gray-900 leading-tight mb-4">
                  Returns & Refunds
                </h1>
                <p class="text-[15px] text-gray-700 leading-relaxed max-w-md">
                  We want you to love what you ordered. <br>
                  If not, we're here to make returns easy.
                </p>
              </div>
              <!-- Placeholder Image -->
              <div class="absolute inset-y-0 right-0 w-full md:w-2/5 hidden md:block">
                <img src="/returns-banner.jpg" alt="Returns box" class="w-full h-full object-contain object-left mix-blend-multiply" onerror="this.src='https://placehold.co/600x400/f8f6f4/e2e8f0?text=Returns+Image'"/>
              </div>
            </div>

            <!-- Custom Content (rendered if provided) -->
            <div *ngIf="config.pages.returnPolicyContent" class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-8 md:p-12 mb-6">
              <div class="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                {{ config.pages.returnPolicyContent }}
              </div>
            </div>

            <!-- Default Content Sections (rendered if no custom content is provided) -->
            <div *ngIf="!config.pages.returnPolicyContent" class="space-y-0">
              
              <!-- Features Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
                <!-- Feature 1 -->
                <div class="border border-gray-150 rounded-2xl p-6 text-center hover:border-gray-300 transition-colors">
                  <div class="w-12 h-12 mx-auto mb-4 text-gray-900 flex items-center justify-center">
                    <i class="bi bi-calendar3 text-2xl"></i>
                  </div>
                  <h3 class="text-[13px] font-bold text-gray-900 mb-2">30-Day Returns</h3>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    You have 30 days from the delivery date to return eligible items.
                  </p>
                </div>
                
                <!-- Feature 2 -->
                <div class="border border-gray-150 rounded-2xl p-6 text-center hover:border-gray-300 transition-colors">
                  <div class="w-12 h-12 mx-auto mb-4 text-gray-900 flex items-center justify-center">
                    <i class="bi bi-box-seam text-2xl"></i>
                  </div>
                  <h3 class="text-[13px] font-bold text-gray-900 mb-2">Easy & Free Returns</h3>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Free return shipping on all U.S. orders.
                  </p>
                </div>

                <!-- Feature 3 -->
                <div class="border border-gray-150 rounded-2xl p-6 text-center hover:border-gray-300 transition-colors">
                  <div class="w-12 h-12 mx-auto mb-4 text-gray-900 flex items-center justify-center">
                    <i class="bi bi-credit-card text-2xl"></i>
                  </div>
                  <h3 class="text-[13px] font-bold text-gray-900 mb-2">Quick Refunds</h3>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Refunds are issued to your original payment method within 5-7 business days.
                  </p>
                </div>

                <!-- Feature 4 -->
                <div class="border border-gray-150 rounded-2xl p-6 text-center hover:border-gray-300 transition-colors">
                  <div class="w-12 h-12 mx-auto mb-4 text-gray-900 flex items-center justify-center">
                    <i class="bi bi-tag text-2xl"></i>
                  </div>
                  <h3 class="text-[13px] font-bold text-gray-900 mb-2">Exchange Available</h3>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Get a different size or color—free and easy.
                  </p>
                </div>
              </div>

              <!-- Returns Process Timeline -->
              <div class="mb-14">
                <h2 class="text-xl font-medium text-gray-900 mb-2">Our Returns Process</h2>
                <p class="text-[13px] text-gray-500 mb-10">Returning an item is simple.</p>
                
                <div class="relative">
                  <!-- Timeline Line -->
                  <div class="absolute top-6 left-0 right-0 h-[1px] bg-gray-200 border-t border-dashed border-gray-300 hidden md:block"></div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                    <!-- Step 1 -->
                    <div class="flex flex-col items-center text-center">
                      <div class="w-12 h-12 rounded-full bg-[#f8f6f4] text-gray-900 font-bold flex items-center justify-center mb-5 text-sm">
                        1
                      </div>
                      <h4 class="text-[13px] font-bold text-gray-900 mb-2">Start Your Return</h4>
                      <p class="text-[12px] text-gray-500 leading-relaxed px-2">
                        Log in to your account and select the order. Choose the items you want to return.
                      </p>
                    </div>

                    <!-- Step 2 -->
                    <div class="flex flex-col items-center text-center">
                      <div class="w-12 h-12 rounded-full bg-[#f8f6f4] text-gray-900 font-bold flex items-center justify-center mb-5 text-sm">
                        2
                      </div>
                      <h4 class="text-[13px] font-bold text-gray-900 mb-2">Pack Your Items</h4>
                      <p class="text-[12px] text-gray-500 leading-relaxed px-2">
                        Pack items in their original condition with tags attached.
                      </p>
                    </div>

                    <!-- Step 3 -->
                    <div class="flex flex-col items-center text-center">
                      <div class="w-12 h-12 rounded-full bg-[#f8f6f4] text-gray-900 font-bold flex items-center justify-center mb-5 text-sm">
                        3
                      </div>
                      <h4 class="text-[13px] font-bold text-gray-900 mb-2">Ship It Back</h4>
                      <p class="text-[12px] text-gray-500 leading-relaxed px-2">
                        Use the prepaid return label to ship your items back to us.
                      </p>
                    </div>

                    <!-- Step 4 -->
                    <div class="flex flex-col items-center text-center">
                      <div class="w-12 h-12 rounded-full bg-[#f8f6f4] text-gray-900 font-bold flex items-center justify-center mb-5 text-sm">
                        4
                      </div>
                      <h4 class="text-[13px] font-bold text-gray-900 mb-2">Refund Issued</h4>
                      <p class="text-[12px] text-gray-500 leading-relaxed px-2">
                        Once we receive and inspect your return, we'll issue your refund.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Return Policy Block -->
                <div class="bg-[#faf9f8] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
                  <div class="flex-1">
                    <h3 class="text-[15px] font-bold text-gray-900 mb-4">Return Policy</h3>
                    <ul class="space-y-3 text-[13px] text-gray-700 list-disc list-inside">
                      <li>Items must be returned within 30 days of delivery.</li>
                      <li>Items must be unworn, unwashed, and in original condition with all tags attached.</li>
                      <li>Final sale items, gift cards, and face masks are not eligible for return.</li>
                      <li>Original shipping charges are non-refundable.</li>
                      <li>{{ config.displayName || config.shopName }} is not responsible for return packages lost or damaged in transit.</li>
                    </ul>
                  </div>
                  <div class="w-24 h-24 shrink-0 text-gray-800 opacity-80">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="w-full h-full">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline stroke-linecap="round" stroke-linejoin="round" points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" stroke-linecap="round" stroke-linejoin="round" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 16h4m0 0v-4m0 4-4-4" />
                    </svg>
                  </div>
                </div>

                <!-- Two Column Additional Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <!-- Refunds -->
                  <div class="border border-gray-150 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div>
                      <h3 class="text-[15px] font-bold text-gray-900 mb-3">How Refunds Are Issued</h3>
                      <p class="text-[13px] text-gray-600 leading-relaxed">
                        Refunds are issued to your original payment method once your return is received and inspected. 
                        Please allow 5-7 business days for the refund to appear in your account.
                      </p>
                    </div>
                    <div class="w-16 h-16 shrink-0 text-gray-800 opacity-80 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="17" cy="17" r="4" fill="#f3e8df" stroke="none"/>
                        <path d="M15.5 17l1 1 2-2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  
                  <!-- Exchanges -->
                  <div class="border border-gray-150 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div>
                      <h3 class="text-[15px] font-bold text-gray-900 mb-3">Exchanges</h3>
                      <p class="text-[13px] text-gray-600 leading-relaxed">
                        Need a different size or color? Start an exchange from your account, and we'll ship the new item as soon as possible.
                      </p>
                    </div>
                    <div class="w-16 h-16 shrink-0 text-gray-800 opacity-80 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="w-12 h-12">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="16" y1="8" x2="2" y2="22" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="17.5" y1="15" x2="9" y2="6.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="17" cy="17" r="4" fill="#f3e8df" stroke="none"/>
                        <path d="M15.5 17l1 1 2-2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Help Block -->
                <div class="bg-[#f8f6f4] rounded-2xl p-6 md:px-10 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-900 bg-white shadow-sm">
                      <i class="bi bi-headset text-xl"></i>
                    </div>
                    <div>
                      <h3 class="text-[15px] font-bold text-gray-900 mb-1">Need Help?</h3>
                      <p class="text-[13px] text-gray-600">Our customer support team is here for you.</p>
                    </div>
                  </div>
                  <button [routerLink]="['/contact']" class="bg-black text-white px-8 py-3 rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors w-full md:w-auto">
                    Contact Us
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WebsiteReturnPolicyComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }
}
