import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopContextService } from '../../../../core/services/shop-context.service';

@Component({
  selector: 'app-website-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white min-h-screen font-sans pb-24" *ngIf="shopConfig$ | async as config">
      <div class="container mx-auto px-6 max-w-[1400px] pt-12 md:pt-16">
        <div class="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">
          <!-- LEFT SIDEBAR: HELP & SUPPORT -->
          <div class="w-full lg:w-64 shrink-0 hidden lg:block sticky top-28">
            <h4 class="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-8">
              Help & Support
            </h4>
            <nav class="space-y-2 text-[13px] font-semibold text-gray-500">
              <a
                [routerLink]="['/shipping-policy']"
                class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <i class="bi bi-box-seam text-lg"></i> Shipping Policy
              </a>
              <a
                [routerLink]="['/return-policy']"
                class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <i class="bi bi-arrow-repeat text-lg"></i> Returns & Exchanges
              </a>
              <a
                href="#"
                class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <i class="bi bi-credit-card text-lg"></i> Payments & Promotions
              </a>
              <a
                [routerLink]="['/size-guide']"
                class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <i class="bi bi-rulers text-lg"></i> Size Guide
              </a>
              <a
                [routerLink]="['/contact']"
                class="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 transition-colors"
              >
                <i class="bi bi-envelope text-lg"></i> Contact Us
              </a>
              <a
                [routerLink]="['/terms-and-conditions']"
                class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <i class="bi bi-file-earmark-text text-lg"></i> Terms & Conditions
              </a>
            </nav>
          </div>

          <!-- MAIN CONTENT -->
          <div class="flex-1 w-full max-w-5xl">
            <!-- Hero Banner -->
            <div
              class="relative bg-[#f8f6f4] rounded-2xl overflow-hidden min-h-[300px] flex items-center mb-10"
            >
              <div class="px-10 py-12 md:px-16 w-full md:w-3/5 z-10">
                <h3
                  class="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-gray-900 uppercase mb-4"
                >
                  Contact Us
                </h3>
                <h1 class="text-3xl md:text-[40px] font-medium text-gray-900 leading-tight mb-6">
                  We'd love to hear from you.
                </h1>
                <p class="text-[14px] text-gray-700 leading-relaxed max-w-md mb-8">
                  Our team is here to help with any questions or feedback you may have.
                </p>
                <div class="flex flex-col sm:flex-row gap-6 sm:gap-12">
                  <div class="flex items-center gap-3">
                    <i class="bi bi-clock text-lg text-gray-900"></i>
                    <span class="text-xs font-semibold text-gray-900">Mon-Fri 9am-3pm PT</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <i class="bi bi-envelope text-lg text-gray-900"></i>
                    <span class="text-xs font-semibold text-gray-900">{{
                      config.contactEmail || 'support@example.com'
                    }}</span>
                  </div>
                </div>
              </div>
              <!-- Placeholder Image -->
              <div class="absolute inset-y-0 right-0 w-full md:w-2/5 hidden md:block">
                <img
                  src="/Contact_banner.jpg"
                  alt="Contact Us"
                  class="w-full h-full object-contain object-left mix-blend-multiply"
                  onerror="this.src='https://placehold.co/600x400/f8f6f4/e2e8f0?text=Contact+Image'"
                />
              </div>
            </div>

            <!-- Info Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <!-- Visit Us -->
              <div
                class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors"
              >
                <i class="bi bi-geo-alt text-xl text-gray-900"></i>
                <div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Visit Us</h4>
                  <p class="text-[12px] text-gray-500 leading-relaxed" *ngIf="config.address">
                    {{ config.address }}
                  </p>
                  <p class="text-[12px] text-gray-500 leading-relaxed" *ngIf="!config.address">
                    123 Fashion St.<br />New York, NY 10001
                  </p>
                </div>
              </div>
              <!-- Email Us -->
              <div
                class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors"
              >
                <i class="bi bi-envelope text-xl text-gray-900"></i>
                <div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Email Us</h4>
                  <p class="text-[12px] text-gray-900 font-semibold mb-1 truncate max-w-full">
                    {{ config.contactEmail || 'support@example.com' }}
                  </p>
                  <p class="text-[12px] text-gray-500">We'll respond quickly.</p>
                </div>
              </div>
              <!-- Call Us -->
              <div
                class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors"
              >
                <i class="bi bi-telephone text-xl text-gray-900"></i>
                <div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Call Us</h4>
                  <p class="text-[12px] text-gray-900 font-semibold mb-1">
                    {{ config.contactPhone || '+1 (844) 326-6000' }}
                  </p>
                  <p class="text-[12px] text-gray-500">Mon-Fri 9am-3pm PT</p>
                </div>
              </div>
              <!-- Live Chat -->
              <div
                class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors"
              >
                <i class="bi bi-chat-dots text-xl text-gray-900"></i>
                <div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Live Chat</h4>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Available during business hours.
                  </p>
                </div>
              </div>
            </div>

            <!-- Form and FAQs -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <!-- Contact Form -->
              <div class="bg-white border border-gray-150 rounded-2xl p-8">
                <h2 class="text-[16px] font-bold text-gray-900 mb-2">Send Us a Message</h2>
                <p class="text-[12px] text-gray-500 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <form class="space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors placeholder-gray-400 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors placeholder-gray-400 rounded-lg"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors placeholder-gray-400 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Order Number (Optional)"
                    class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors placeholder-gray-400 rounded-lg"
                  />
                  <textarea
                    rows="4"
                    placeholder="Your Message"
                    class="w-full bg-white border border-gray-200 px-4 py-3.5 text-xs focus:outline-none focus:border-black transition-colors resize-none placeholder-gray-400 rounded-lg"
                  ></textarea>

                  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      class="w-full sm:w-auto bg-black text-white px-8 py-3.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                    >
                      Send Message
                    </button>
                    <div class="flex items-center gap-2 text-gray-500 text-[11px]">
                      <i class="bi bi-shield-check text-sm"></i>
                      <span>Your info is safe.</span>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Common Questions -->
              <div class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-8">
                <h2 class="text-[16px] font-bold text-gray-900 mb-6">Common Questions</h2>
                <div class="space-y-0 divide-y divide-gray-150 border-y border-gray-150">
                  <a
                    href="javascript:void(0)"
                    class="flex items-center justify-between py-4 group hover:bg-white/40 transition-colors px-2 -mx-2"
                  >
                    <span class="text-xs font-semibold text-gray-700">Where is my order?</span>
                    <i
                      class="bi bi-chevron-right text-gray-400 group-hover:text-black transition-colors text-[10px]"
                    ></i>
                  </a>

                  <a
                    href="javascript:void(0)"
                    class="flex items-center justify-between py-4 group hover:bg-white/40 transition-colors px-2 -mx-2"
                  >
                    <span class="text-xs font-semibold text-gray-700"
                      >What are your shipping options?</span
                    >
                    <i
                      class="bi bi-chevron-right text-gray-400 group-hover:text-black transition-colors text-[10px]"
                    ></i>
                  </a>

                  <a
                    href="javascript:void(0)"
                    class="flex items-center justify-between py-4 group hover:bg-white/40 transition-colors px-2 -mx-2"
                  >
                    <span class="text-xs font-semibold text-gray-700">How do I make a return?</span>
                    <i
                      class="bi bi-chevron-right text-gray-400 group-hover:text-black transition-colors text-[10px]"
                    ></i>
                  </a>

                  <a
                    href="javascript:void(0)"
                    class="flex items-center justify-between py-4 group hover:bg-white/40 transition-colors px-2 -mx-2"
                  >
                    <span class="text-xs font-semibold text-gray-700"
                      >How can I track my order?</span
                    >
                    <i
                      class="bi bi-chevron-right text-gray-400 group-hover:text-black transition-colors text-[10px]"
                    ></i>
                  </a>
                </div>
                <button
                  [routerLink]="['/size-guide']"
                  type="button"
                  class="w-full mt-6 bg-white border border-gray-200 px-6 py-3 rounded-lg text-xs font-bold text-gray-900 hover:border-black transition-colors"
                >
                  View Sizing Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WebsiteContactComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }
}
