import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopContextService } from '../../../../core/services/shop-context.service';

@Component({
  selector: 'app-website-privacy-policy',
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
                  Privacy Policy
                </h1>
                <p class="text-[13px] font-bold text-gray-900 mb-6 uppercase tracking-wider">
                  Last updated: May 20, 2024
                </p>
                <p class="text-[14px] text-gray-700 leading-relaxed max-w-md">
                  We value your privacy and are committed to protecting your personal data.
                </p>
              </div>
              <!-- Placeholder Image -->
              <div class="absolute inset-y-0 right-0 w-full md:w-2/5 hidden md:block">
                <img src="assets/images/privacy-banner.jpg" alt="Privacy Policy" class="w-full h-full object-cover object-left" onerror="this.src='https://placehold.co/600x400/f8f6f4/e2e8f0?text=Privacy+Image'"/>
              </div>
            </div>

            <!-- Custom Content (rendered if provided) -->
            <div *ngIf="config.pages.privacyPolicyContent" class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-8 md:p-12 mb-6">
              <div class="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                {{ config.pages.privacyPolicyContent }}
              </div>
            </div>

            <!-- Default Content Sections (rendered if no custom content is provided) -->
            <div *ngIf="!config.pages.privacyPolicyContent" class="space-y-0">
              
              <!-- Section 1 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Information We Collect</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    We collect information you provide directly to us when purchasing items, registering accounts, signing up for newsletters, or contacting customer service. This includes name, email, shipping address, billing address, phone number, and payment information.
                  </p>
                </div>
              </div>

              <!-- Section 2 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">How We Use Information</h3>
                </div>
                <div class="flex-1 pt-2">
                  <ul class="text-[13px] text-gray-700 leading-relaxed list-disc list-outside ml-4 space-y-2">
                    <li class="pl-2">To process transactions, fulfill orders, and manage your account.</li>
                    <li class="pl-2">To communicate with you regarding updates, promotions, and customer support.</li>
                    <li class="pl-2">To monitor, optimize, and analyze site functionality and user experience.</li>
                  </ul>
                </div>
              </div>

              <!-- Section 3 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8 border-b border-gray-100">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Information Sharing</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    We do not sell your personal data. We only share data with trusted third-party service providers (like payment processors and shipping carriers) necessary to complete transaction processing and order fulfillment.
                  </p>
                </div>
              </div>

              <!-- Section 4 -->
              <div class="flex flex-col md:flex-row gap-6 md:gap-12 py-8">
                <div class="flex items-start gap-5 md:w-[280px] shrink-0">
                  <div class="w-10 h-10 rounded-full bg-[#f3ede7] text-gray-900 font-bold flex items-center justify-center shrink-0 text-sm">
                    4
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 pt-2">Your Security Rights</h3>
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-[13px] text-gray-700 leading-relaxed">
                    You have the right to request access to, correction of, or deletion of your personal data. You may opt out of marketing communications at any time. We deploy SSL encryption and secure firewalls to guard your data.
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
export class WebsitePrivacyPolicyComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }
}
