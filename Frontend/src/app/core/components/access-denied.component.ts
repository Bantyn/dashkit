import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex-1 overflow-y-auto">
      <div class="min-h-[80vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-lg w-full text-center">
          <!-- Lock Icon -->
          <div class="relative mb-8">
            <div
              class="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-50 flex items-center justify-center shadow-sm"
            >
              <i class="bi bi-shield-lock-fill text-4xl text-primary-600"></i>
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
            {{ denialType === 'subscription_expired' ? 'Subscription Suspended' : 'Access Denied' }}
          </h1>
          @if (denialType === 'subscription_expired') {
            <p class="mt-3 text-base text-gray-500 max-w-md mx-auto">
              Your subscription has expired and your account has been temporarily restricted.
            </p>
          } @else if (denialType === 'permission') {
            <p class="mt-3 text-base text-gray-500 max-w-md mx-auto">
              Your account does not currently include the permission required to open this area.
            </p>
          } @else {
            <p class="mt-3 text-base text-gray-500 max-w-md mx-auto">
              Your current plan
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 capitalize tracking-wider"
              >
                {{ currentPlan }}
              </span>
              does not include access to this feature.
            </p>
          }

          <!-- Feature Info Card -->
          @if (denialType === 'subscription_expired') {
            <div class="mt-8 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm p-6 text-left">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <i class="bi bi-shield-lock-fill text-rose-600 text-lg"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-rose-900">Subscription Renewal Required</h3>
                  <p class="mt-1 text-sm text-rose-700">
                    To continue using this feature and perform write operations, please complete your renewal payment.
                  </p>
                </div>
              </div>
            </div>
          } @else {
            <div class="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <i class="bi bi-lock-fill text-primary-600 text-lg"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">
                    {{ denialType === 'permission' ? 'This feature requires additional access' : 'This feature requires an upgrade' }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-500">
                    @if (denialType === 'permission') {
                      @if (blockedFeature) {
                        <span class="font-medium text-gray-700">{{ blockedFeature }}</span>
                        is protected by enforcement permissions.
                      } @else {
                        This area is protected by enforcement permissions.
                      }
                      @if (requiredPermission) {
                        <span class="block mt-2 text-xs font-semibold text-primary-700">
                          Required permission: {{ requiredPermission }}
                        </span>
                      }
                    } @else {
                      @if (blockedFeature) {
                        <span class="font-medium text-gray-700">{{ blockedFeature }}</span>
                        is available on an upgraded plan.
                      } @else {
                        This feature requires an upgraded subscription plan.
                      }
                    }
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            @if (denialType === 'subscription_expired') {
              <a
                [routerLink]="['/', shopId, 'subscription']"
                class="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
              >
                <i class="bi bi-credit-card-fill"></i>
                Renew Subscription
              </a>
            } @else if (denialType !== 'permission') {
              <a
                [routerLink]="['/', shopId, 'subscription']"
                class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
              >
                <i class="bi bi-arrow-up-circle"></i>
                Upgrade Plan
              </a>
            }
            <a
              [routerLink]="['/', shopId, 'dashboard']"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <i class="bi bi-arrow-left"></i>
              Go to Dashboard
            </a>
          </div>

          <!-- Help -->
          <div class="mt-10 text-center text-sm text-gray-400">
            <p>
              Need help choosing a plan?
              <a
                [routerLink]="['/', shopId, 'support']"
                class="font-medium text-primary-600 hover:text-primary-500"
                >Contact support</a
              >.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccessDeniedComponent implements OnInit {
  shopId = '';
  currentPlan = 'free';
  blockedFeature = '';
  requiredPlans = '';
  requiredPlansArray: string[] = [];
  denialType: 'plan' | 'permission' | 'subscription_expired' = 'plan';
  requiredPermission = '';

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId') || '';
    });

    this.route.queryParamMap.subscribe((params) => {
      this.denialType = (params.get('denialType') as 'plan' | 'permission' | 'subscription_expired') || 'plan';
      this.blockedFeature = this.formatBlockedPath(params.get('blockedPath') || '');
      this.requiredPlans = params.get('requiredPlans') || '';
      this.requiredPermission = params.get('requiredPermission') || '';
      this.currentPlan = params.get('currentPlan') || 'free';
      this.requiredPlansArray = this.requiredPlans
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    });
  }

  private formatBlockedPath(path: string): string {
    if (!path) return '';

    const featureMap: Record<string, string> = {
      audit: 'Audit Logs',
      branches: 'Branches Management',
      analytics: 'Analytics',
      'promotions/sms': 'SMS Campaigns',
      'promotions/whatsapp': 'WhatsApp Campaigns',
      'staff/logs': 'Staff Activity Logs',
      'staff/performance': 'Staff Performance',
      'reports/sales': 'Sales Report',
      'reports/website-sales': 'Website Sales Reports',
      'reports/inventory': 'Inventory Reports',
      'reports/profit-loss': 'Profit & Loss Report',
      'reports/tax': 'Tax Report',
      'analytics/sales': 'Sales Analytics',
      'analytics/customers': 'Customer Analytics',
      'analytics/products': 'Product Performance',
      'analytics/branches': 'Branch Performance',
      'settings/invoice-template': 'Invoice Template',
      'settings/integrations': 'Integrations',
      security: 'Security Settings',
      'website/settings': 'Website Configuration',
      'notifications/sms': 'SMS Notifications',
      'notifications/whatsapp': 'WhatsApp Notifications',
      transactions: 'Transactions',
      'products/brands': 'Brands',
      'products/variants': 'Variants',
      'products/import': 'Bulk Import',
      'customers/online': 'Online Customers',
      'customers/history': 'Order History',
      'sales/returns': 'Sales Returns',
      'sales/drafts': 'Draft Bills',
      payments: 'Payments',
      offers: 'Offers',
      promotions: 'Promotions',
      staff: 'Staff Management',
      shipping: 'Shipping',
      purchases: 'Purchases',
      website: 'Website',
      'notifications/email': 'Email Notifications',
      'notifications/logs': 'Notification Logs',
      expenses: 'Expenses',
      'settings/payment-methods': 'Payment Methods',
      'settings/backup': 'Backup & Export',
    };

    // Try exact match first, then prefix match
    if (featureMap[path]) return featureMap[path];

    for (const [key, value] of Object.entries(featureMap)) {
      if (path.startsWith(key)) return value;
    }

    // Fallback: capitalize
    return path
      .split('/')
      .pop()!
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
