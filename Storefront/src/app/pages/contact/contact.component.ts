import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopContextService } from '../../core/services/shop-context.service';

@Component({
  selector: 'app-website-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="min-h-screen bg-white" *ngIf="shopConfig$ | async as config">
  <div class="max-w-5xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Contact Us</h1>
    <p class="text-gray-500 text-sm mb-12">We'd love to hear from you. Reach out and we'll respond as soon as possible.</p>

    <!-- Contact Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      <div class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors">
        <i class="bi bi-geo-alt text-xl text-gray-900"></i>
        <div>
          <h4 class="text-[13px] font-bold text-gray-900 mb-2">Visit Us</h4>
          <p class="text-[12px] text-gray-500 leading-relaxed" *ngIf="config.address">{{ config.address }}</p>
          <p class="text-[12px] text-gray-500 leading-relaxed" *ngIf="!config.address">123 Fashion St, Mumbai</p>
        </div>
      </div>
      <div class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors">
        <i class="bi bi-envelope text-xl text-gray-900"></i>
        <div>
          <h4 class="text-[13px] font-bold text-gray-900 mb-2">Email Us</h4>
          <a [href]="'mailto:' + (config.contactEmail || config.email)" class="text-[12px] text-gray-900 font-semibold mb-1 truncate block hover:underline">{{ config.contactEmail || config.email || 'support@example.com' }}</a>
          <p class="text-[12px] text-gray-500">We'll respond quickly.</p>
        </div>
      </div>
      <div class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors">
        <i class="bi bi-telephone text-xl text-gray-900"></i>
        <div>
          <h4 class="text-[13px] font-bold text-gray-900 mb-2">Call Us</h4>
          <a [href]="'tel:' + (config.contactPhone || config.phone)" class="text-[12px] text-gray-900 font-semibold mb-1 block hover:underline">{{ config.contactPhone || config.phone || 'N/A' }}</a>
          <p class="text-[12px] text-gray-500">Mon-Sat 10am–7pm</p>
        </div>
      </div>
      <div class="bg-white border border-gray-150 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors">
        <i class="bi bi-instagram text-xl text-gray-900"></i>
        <div>
          <h4 class="text-[13px] font-bold text-gray-900 mb-2">Social</h4>
          <a *ngIf="config.socialLinks?.instagram" [href]="config.socialLinks?.instagram" target="_blank" rel="noopener" class="text-[12px] text-gray-900 font-semibold hover:underline">Instagram</a>
          <p *ngIf="!config.socialLinks?.instagram" class="text-[12px] text-gray-500">Follow us online.</p>
        </div>
      </div>
    </div>

    <!-- Form + FAQ -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white border border-gray-150 rounded-2xl p-8">
        <h2 class="text-[16px] font-bold text-gray-900 mb-2">Send Us a Message</h2>
        <p class="text-[12px] text-gray-500 mb-8">Fill out the form and we'll get back to you.</p>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <input type="text" placeholder="First Name" class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors rounded-lg" />
            <input type="text" placeholder="Last Name" class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors rounded-lg" />
          </div>
          <input type="email" placeholder="Email Address" class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors rounded-lg" />
          <input type="text" placeholder="Order Number (Optional)" class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors rounded-lg" />
          <textarea rows="4" placeholder="Your Message" class="w-full bg-white border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors resize-none rounded-lg"></textarea>
          <button type="button" class="w-full bg-black text-white px-8 py-3.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors">Send Message</button>
        </div>
      </div>

      <div class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-8">
        <h2 class="text-[16px] font-bold text-gray-900 mb-6">Common Questions</h2>
        <div class="space-y-0 divide-y divide-gray-150 border-y border-gray-150">
          <div *ngFor="let faq of faqs" class="flex items-center justify-between py-4 hover:bg-white/40 transition-colors px-2 -mx-2 cursor-pointer">
            <span class="text-xs font-semibold text-gray-700">{{ faq }}</span>
            <i class="bi bi-chevron-right text-gray-400 text-[10px]"></i>
          </div>
        </div>
        <a routerLink="/size-guide" class="w-full mt-6 block bg-white border border-gray-200 px-6 py-3 rounded-lg text-xs font-bold text-gray-900 hover:border-black transition-colors text-center">
          View Sizing Guide
        </a>
      </div>
    </div>
  </div>
</div>
  `,
})
export class WebsiteContactComponent {
  shopConfig$;
  faqs = [
    'Where is my order?',
    'What are your shipping options?',
    'How do I make a return?',
    'How can I track my order?',
    'What payment methods are accepted?',
  ];
  constructor(private shopContext: ShopContextService) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }
}
