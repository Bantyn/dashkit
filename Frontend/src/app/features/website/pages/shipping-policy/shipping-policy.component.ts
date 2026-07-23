import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopContextService } from '../../../../core/services/shop-context.service';

@Component({
  selector: 'app-website-shipping-policy',
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
              <a [routerLink]="['/shipping-policy']" class="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 transition-colors">
                <i class="bi bi-box-seam text-lg"></i> Shipping Policy
              </a>
              <a [routerLink]="['/return-policy']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
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
            <div class="relative bg-[#f8f6f4] rounded-2xl overflow-hidden min-h-[300px] flex items-center mb-10">
              <div class="px-10 py-12 md:px-16 w-full md:w-3/5 z-10">
                <h1 class="text-4xl md:text-[44px] font-medium text-gray-900 leading-tight mb-4">
                  Shipping Policy
                </h1>
                <p class="text-[14px] text-gray-700 leading-relaxed max-w-md">
                  Everything you need to know about our shipping methods, delivery times, and rates. 
                  We strive to get your premium items to you safely and quickly.
                </p>
              </div>
              <!-- Placeholder Image -->
              <div class="absolute inset-y-0 right-0 w-full md:w-2/5 hidden md:block">
                <img src="/shipping-banner.jpg" alt="Shipping Box" class="w-full h-full object-contain object-left mix-blend-multiply" onerror="this.src='https://placehold.co/600x400/f8f6f4/e2e8f0?text=Shipping+Image'"/>
              </div>
            </div>

            <!-- Custom Content (rendered if provided) -->
            <div *ngIf="config.pages.shippingPolicyContent" class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-8 md:p-12 mb-6">
              <div class="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                {{ config.pages.shippingPolicyContent }}
              </div>
            </div>

            <!-- Default Content Sections (rendered if no custom content is provided) -->
            <div *ngIf="!config.pages.shippingPolicyContent" class="space-y-0">
              
              <!-- Section 1 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Processing Time</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    All orders are subject to a processing time of 1-3 business days before they are dispatched from our warehouse. 
                    Orders placed after 2:00 PM EST or on weekends/holidays will begin processing the next business day. 
                    You will receive an email confirmation with tracking information once your order has been shipped.
                  </p>
                </div>
              </div>

              <!-- Section 2 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Rates & Estimates</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed mb-6">
                    Shipping charges for your order will be calculated and displayed at checkout. Below are our estimated shipping timelines.
                  </p>
                  
                  <div class="border border-gray-150 rounded-xl overflow-hidden mb-4">
                    <table class="w-full text-left text-[13px]">
                      <thead class="bg-[#f8f6f4] text-gray-900 border-b border-gray-150 font-bold">
                        <tr>
                          <th class="px-5 py-4 font-bold">Shipping Method</th>
                          <th class="px-5 py-4 font-bold">Estimated Delivery</th>
                          <th class="px-5 py-4 font-bold text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-150 text-gray-700">
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-5 py-4 font-medium text-gray-900">Standard Shipping</td>
                          <td class="px-5 py-4">5-7 Business Days</td>
                          <td class="px-5 py-4 text-right font-bold text-gray-900">Free over $95</td>
                        </tr>
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-5 py-4 font-medium text-gray-900">Expedited Shipping</td>
                          <td class="px-5 py-4">2-3 Business Days</td>
                          <td class="px-5 py-4 text-right font-medium">$15.00</td>
                        </tr>
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-5 py-4 font-medium text-gray-900">Overnight Delivery</td>
                          <td class="px-5 py-4">1 Business Day</td>
                          <td class="px-5 py-4 text-right font-medium">$25.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p class="text-[12px] text-gray-500 italic">
                    * Delivery delays can occasionally occur due to extreme weather or carrier disruptions.
                  </p>
                </div>
              </div>

              <!-- Section 3 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">International Shipping</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed mb-4">
                    We currently ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination 
                    and will be calculated at checkout. Please note that international orders may take between 7-21 business days to arrive.
                  </p>
                  <div class="bg-[#f8f6f4] rounded-xl p-6">
                    <h4 class="text-[13px] font-bold text-gray-900 mb-2">Duties and Taxes</h4>
                    <p class="text-[12px] leading-relaxed text-gray-600">
                      Your order may be subject to import duties and taxes (including VAT), which are incurred once a shipment reaches your destination country. 
                      We are not responsible for these charges if they are applied and are your responsibility as the customer.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Section 4 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    4
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Order Tracking</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    When your order has shipped, you will receive an email notification from us which will include a tracking number you can 
                    use to check its status. Please allow 48 hours for the tracking information to become available. If you haven't received 
                    your order within 5 days of receiving your shipping confirmation email, please contact us with your name and order number.
                  </p>
                </div>
              </div>

              <!-- Help Block -->
              <div class="mt-8 bg-[#f8f6f4] rounded-2xl p-6 md:px-10 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                  <div class="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-900 bg-white shadow-sm">
                    <i class="bi bi-box-seam text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-[15px] font-bold text-gray-900 mb-1">Still have questions?</h3>
                    <p class="text-[13px] text-gray-600">If you have any further questions regarding your shipment.</p>
                  </div>
                </div>
                <button [routerLink]="['/contact']" class="bg-black text-white px-8 py-3 rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors w-full md:w-auto">
                  Contact Support
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WebsiteShippingPolicyComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }
}
