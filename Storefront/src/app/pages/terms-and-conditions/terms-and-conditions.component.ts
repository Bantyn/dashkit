import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopContextService } from '../../core/services/shop-context.service';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="min-h-screen bg-white" *ngIf="shopConfig$ | async as config">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Terms & Conditions</h1>
    <div *ngIf="config.pages?.termsAndConditionsContent" class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
      [innerHTML]="config.pages.termsAndConditionsContent"></div>
    <div *ngIf="!config.pages?.termsAndConditionsContent" class="space-y-6 text-gray-600 text-sm leading-relaxed">
      <p>By using this website and placing orders, you agree to the following terms and conditions. Please read them carefully.</p>
      <h3 class="text-base font-bold text-gray-900">1. Use of Website</h3>
      <p>You agree to use this website for lawful purposes only. You must not use it in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website.</p>
      <h3 class="text-base font-bold text-gray-900">2. Orders & Payments</h3>
      <p>All orders are subject to availability. We reserve the right to refuse any order without giving a reason. Payment must be completed before dispatch of goods.</p>
      <h3 class="text-base font-bold text-gray-900">3. Pricing</h3>
      <p>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. We reserve the right to change prices at any time without notice.</p>
      <h3 class="text-base font-bold text-gray-900">4. Intellectual Property</h3>
      <p>All content on this website, including images, text, logos, and graphics, is the property of {{ config.displayName || config.shopName }} and is protected by applicable intellectual property laws.</p>
      <h3 class="text-base font-bold text-gray-900">5. Limitation of Liability</h3>
      <p>We shall not be liable for any indirect, incidental, or consequential damages arising out of or related to the use of this website or the products purchased.</p>
      <p class="text-xs text-gray-400 mt-8">Last updated: {{ today | date:'longDate' }}</p>
    </div>
  </div>
</div>
  `,
})
export class WebsiteTermsComponent {
  shopConfig$;
  today = new Date();
  constructor(private shopContext: ShopContextService) { this.shopConfig$ = this.shopContext.shopConfig$; }
}
