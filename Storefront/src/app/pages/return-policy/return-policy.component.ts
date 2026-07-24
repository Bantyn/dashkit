import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopContextService } from '../../core/services/shop-context.service';

@Component({
  selector: 'app-return-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="min-h-screen bg-white" *ngIf="shopConfig$ | async as config">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Return & Exchange Policy</h1>
    <div *ngIf="config.pages.returnPolicyContent" class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
      [innerHTML]="config.pages.returnPolicyContent"></div>
    <div *ngIf="!config.pages.returnPolicyContent" class="space-y-6 text-gray-600 text-sm leading-relaxed">
      <p>We want you to be completely satisfied with your purchase. If you're not happy, we offer a hassle-free return and exchange policy.</p>
      <h3 class="text-base font-bold text-gray-900">Return Window</h3>
      <p>Items can be returned or exchanged within <strong>7 days</strong> of delivery. Items must be unused, unwashed, and in their original packaging with all tags intact.</p>
      <h3 class="text-base font-bold text-gray-900">Non-Returnable Items</h3>
      <ul class="list-disc list-inside space-y-2">
        <li>Sale/discounted items</li>
        <li>Innerwear and swimwear</li>
        <li>Customized or personalized orders</li>
      </ul>
      <h3 class="text-base font-bold text-gray-900">How to Return</h3>
      <p>Contact us at <strong>{{ config.contactEmail || config.email || 'support@example.com' }}</strong> or call <strong>{{ config.contactPhone || config.phone || 'our helpline' }}</strong> with your order ID and reason for return. Our team will guide you through the process.</p>
      <h3 class="text-base font-bold text-gray-900">Refund Timeline</h3>
      <p>Refunds are processed within 5-7 business days of receiving the returned item. Refunds will be credited to your original payment method or as store credit.</p>
    </div>
  </div>
</div>
  `,
})
export class WebsiteReturnPolicyComponent {
  shopConfig$;
  constructor(private shopContext: ShopContextService) { this.shopConfig$ = this.shopContext.shopConfig$; }
}
