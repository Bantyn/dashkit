import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopContextService } from '../../../../core/services/shop-context.service';

@Component({
  selector: 'app-website-terms',
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
              <a [routerLink]="['/terms-and-conditions']" class="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 transition-colors">
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
                  Terms & Conditions
                </h1>
                <p class="text-[13px] font-bold text-gray-900 mb-6 uppercase tracking-wider">
                  Last updated: May 20, 2024
                </p>
                <p class="text-[14px] text-gray-700 leading-relaxed max-w-md">
                  Please read these terms and conditions carefully before using our website and services.
                </p>
              </div>
              <!-- Placeholder Image -->
              <div class="absolute inset-y-0 right-0 w-full md:w-2/5 hidden md:block">
                <img src="/term-condition.jpg" alt="Terms books" class="w-full h-full object-contain object-left mix-blend-multiply" onerror="this.src='https://placehold.co/600x400/f8f6f4/e2e8f0?text=Terms+Image'"/>
              </div>
            </div>

            <!-- Custom Content (rendered if provided) -->
            <div *ngIf="config.pages.termsAndConditionsContent" class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-8 md:p-12 mb-6">
              <div class="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                {{ config.pages.termsAndConditionsContent }}
              </div>
            </div>

            <!-- Default Content Sections (rendered if no custom content is provided) -->
            <div *ngIf="!config.pages.termsAndConditionsContent" class="space-y-0">
              
              <!-- Term 1 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">General</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    By accessing or using the {{ config.displayName || config.shopName }} website (the "Site") and our services, you agree to be bound by these Terms & Conditions and our Privacy Policy.
                  </p>
                </div>
              </div>

              <!-- Term 2 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Orders & Acceptance</h3>
                </div>
                <div class="flex-1 pt-2">
                  <ul class="text-[13px] text-gray-700 leading-relaxed list-disc list-outside ml-4 space-y-2">
                    <li class="pl-2">All orders are subject to acceptance and availability.</li>
                    <li class="pl-2">We reserve the right to refuse or cancel any order for any reason.</li>
                    <li class="pl-2">Once an order is placed, you will receive an order confirmation email. This does not guarantee acceptance of your order.</li>
                  </ul>
                </div>
              </div>

              <!-- Term 3 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Pricing & Payment</h3>
                </div>
                <div class="flex-1 pt-2">
                  <ul class="text-[13px] text-gray-700 leading-relaxed list-disc list-outside ml-4 space-y-2">
                    <li class="pl-2">All prices are listed in USD and include applicable taxes unless stated otherwise.</li>
                    <li class="pl-2">We reserve the right to change prices at any time without prior notice.</li>
                    <li class="pl-2">Payment must be completed at the time of purchase. We accept major credit cards, debit cards, and other payment methods as shown at checkout.</li>
                  </ul>
                </div>
              </div>

              <!-- Term 4 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    4
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Shipping & Delivery</h3>
                </div>
                <div class="flex-1 pt-2">
                  <ul class="text-[13px] text-gray-700 leading-relaxed list-disc list-outside ml-4 space-y-2">
                    <li class="pl-2">We offer various shipping options as described in our Shipping Policy.</li>
                    <li class="pl-2">Delivery times are estimates and may vary.</li>
                    <li class="pl-2">{{ config.displayName || config.shopName }} is not responsible for delays caused by carriers or customs.</li>
                  </ul>
                </div>
              </div>

              <!-- Term 5 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    5
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Returns & Refunds</h3>
                </div>
                <div class="flex-1 pt-2">
                  <ul class="text-[13px] text-gray-700 leading-relaxed list-disc list-outside ml-4 space-y-2">
                    <li class="pl-2">We want you to love what you ordered. If not, you may return eligible items within 30 days of delivery.</li>
                    <li class="pl-2">Items must be unworn, unwashed, and in original condition with all tags attached.</li>
                    <li class="pl-2">Refunds will be issued to the original payment method within 5–7 business days after we receive and inspect your return.</li>
                    <li class="pl-2">For more details, please visit our <a [routerLink]="['/return-policy']" class="underline hover:text-black font-semibold">Returns & Exchanges Policy</a>.</li>
                  </ul>
                </div>
              </div>

              <!-- Term 6 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    6
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Intellectual Property</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    All content on this Site, including text, graphics, logos, images, and software, is the property of {{ config.displayName || config.shopName }} and is protected by copyright and trademark laws.
                  </p>
                </div>
              </div>

              <!-- Term 7 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    7
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Limitation of Liability</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    {{ config.displayName || config.shopName }} shall not be liable for any indirect, incidental, or consequential damages arising from the use of our Site or products.
                  </p>
                </div>
              </div>

              <!-- Term 8 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    8
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Changes to Terms</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    We may update these Terms & Conditions at any time. Changes will be posted on this page with the updated date.
                  </p>
                </div>
              </div>

              <!-- Term 9 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    9
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Contact Us</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    If you have any questions about these Terms & Conditions, please contact us at <a href="mailto:support@cein.com" class="font-semibold text-gray-900 hover:underline">support&#64;cein.com</a>.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WebsiteTermsComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }
}
