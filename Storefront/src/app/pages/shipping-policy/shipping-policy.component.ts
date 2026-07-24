import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopContextService } from '../../core/services/shop-context.service';

@Component({
  selector: 'app-shipping-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="min-h-screen bg-white" *ngIf="shopConfig$ | async as config">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Shipping Policy</h1>
    <div *ngIf="config.pages?.shippingPolicyContent" class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
      [innerHTML]="config.pages.shippingPolicyContent"></div>
    <div *ngIf="!config.pages?.shippingPolicyContent" class="space-y-6 text-gray-600 text-sm leading-relaxed">
      <p>We process and ship orders within 1-3 business days of receiving your order. Once your order is dispatched, you will receive an email with tracking information.</p>
      <h3 class="text-base font-bold text-gray-900">Delivery Timeframes</h3>
      <ul class="list-disc list-inside space-y-2">
        <li>Standard Delivery: 5-7 business days</li>
        <li>Express Delivery: 2-3 business days</li>
        <li>Same Day Delivery: Available in select locations</li>
      </ul>
      <h3 class="text-base font-bold text-gray-900">Shipping Charges</h3>
      <p>Free shipping on all orders above ₹999. A flat shipping charge of ₹79 applies to orders below ₹999.</p>
      <h3 class="text-base font-bold text-gray-900">International Shipping</h3>
      <p>We currently ship within India only. International shipping is not available at this time.</p>
      <p class="text-xs text-gray-400">For queries, contact us at {{ config.contactEmail || config.email || 'support@example.com' }}</p>
    </div>
  </div>
</div>
  `,
})
export class WebsiteShippingPolicyComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) { this.shopConfig$ = this.shopContext.shopConfig$; }
}
