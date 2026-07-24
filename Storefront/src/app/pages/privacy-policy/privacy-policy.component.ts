import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ShopContextService } from '../../core/services/shop-context.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
<div class="min-h-screen bg-white" *ngIf="shopConfig$ | async as config">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Privacy Policy</h1>
    <div *ngIf="config.pages?.privacyPolicyContent" class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
      [innerHTML]="config.pages.privacyPolicyContent"></div>
    <div *ngIf="!config.pages?.privacyPolicyContent" class="space-y-6 text-gray-600 text-sm leading-relaxed">
      <p>Your privacy is important to us. This Privacy Policy explains how {{ config.displayName || config.shopName }} collects, uses, and protects your personal information.</p>
      <h3 class="text-base font-bold text-gray-900">Information We Collect</h3>
      <ul class="list-disc list-inside space-y-2">
        <li>Name, email address, and phone number when you register or place an order</li>
        <li>Shipping address and payment information</li>
        <li>Browsing data and order history</li>
      </ul>
      <h3 class="text-base font-bold text-gray-900">How We Use Your Information</h3>
      <ul class="list-disc list-inside space-y-2">
        <li>To process and fulfill your orders</li>
        <li>To send order confirmations and shipping updates</li>
        <li>To improve our products and services</li>
        <li>To send promotional offers (you can opt-out anytime)</li>
      </ul>
      <h3 class="text-base font-bold text-gray-900">Data Security</h3>
      <p>We implement appropriate security measures to protect your personal information. Payment data is encrypted using industry-standard SSL technology.</p>
      <h3 class="text-base font-bold text-gray-900">Third-Party Services</h3>
      <p>We use Razorpay for payment processing and Firebase for authentication. These services have their own privacy policies that govern the use of your data.</p>
      <h3 class="text-base font-bold text-gray-900">Your Rights</h3>
      <p>You have the right to access, correct, or delete your personal data at any time. Contact us at <strong>{{ config.contactEmail || config.email || 'support@example.com' }}</strong> to exercise these rights.</p>
      <p class="text-xs text-gray-400 mt-8">Last updated: {{ today | date:'longDate' }}</p>
    </div>
  </div>
</div>
  `,
})
export class WebsitePrivacyPolicyComponent {
  shopConfig$;
  today = new Date();
  constructor(private shopContext: ShopContextService) { this.shopConfig$ = this.shopContext.shopConfig$; }
}
