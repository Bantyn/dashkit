import { Injectable, inject } from '@angular/core';
import { ShopService } from './shop.service';
import { Shop } from '../models/shop.model';
import { Observable, map, of, distinctUntilChanged } from 'rxjs';



/**
 * Maps route paths to their required feature keys.
 * This is used by the PlanAccessGuard to perform dynamic checks.
 */
export const ROUTE_FEATURE_MAPPING: Record<string, string> = {
  'dashboard': 'analytics_dashboard',
  'pos': 'sell_pos_billing',
  'orders': 'sell_pos_billing',
  'sales/returns': 'sell_returns',
  'sales/drafts': 'sell_drafts',
  'sales/daily-closing': 'sell_daily_closing',
  'invoices': 'sell_invoices',
  'credit-notes': 'sell_credit_notes',
  'inventory/history': 'inv_stock_tracking',
  'purchases/received': 'inv_stock_tracking',
  'purchases/suppliers': 'inv_suppliers',
  'purchases/payments': 'fin_payments',
  'purchases/returns': 'sell_returns',
  'crm/anniversaries': 'crm_birthday_wishes',
  'audit': 'ent_audit_logs',
  'images': 'web_storefront',
  'notifications/logs': 'mktg_templates',
  'invoices/website': 'web_storefront',
  'payments': 'fin_payments',
  'invoices/credit-notes': 'sell_credit_notes',
  'transactions': 'fin_transactions',
  'transactions/cash': 'fin_transactions',
  'transactions/online': 'sell_online_payments',
  'transactions/refunds': 'sell_returns',
  'products': 'inv_product_listing',
  'categories': 'inv_categories',
  'products/brands': 'inv_brands',
  'products/variants': 'inv_variants',
  'products/import': 'inv_bulk_import',
  'inventory': 'inv_stock_tracking',
  'inventory/opening-stock': 'inv_opening_stock',
  'inventory/low-stock': 'inv_low_stock_alerts',
  'inventory/purchase-orders': 'inv_purchase_orders',
  'inventory/suppliers': 'inv_suppliers',
  'inventory/transfer': 'inv_stock_transfer',
  'purchases/orders': 'inv_purchase_orders',
  'customers': 'cust_list',
  'customers/online': 'cust_online_customers',
  'customers/review': 'cust_reviews',
  'reviews': 'cust_reviews',
  'customers/credits': 'cust_credits',
  'customers/history': 'cust_history',
  'offers': 'sell_offers_discounts',
  'reports/sales': 'analytics_sales',
  'reports/website-sales': 'web_storefront',
  'reports/inventory': 'inv_reports',
  'reports/profit-loss': 'fin_pnl_report',
  'reports/tax': 'fin_tax_report',
  'promotions/festival': 'mktg_festival_offers',
  'promotions/sms': 'mktg_sms',
  'promotions/whatsapp': 'mktg_whatsapp',
  'promotions/loyalty': 'mktg_loyalty',
  'branches': 'ent_multi_branch',
  'branches/analytics': 'analytics_branches',
  'branches/permissions': 'ent_multi_branch',
  'branches/settings': 'ent_multi_branch',
  'shipping/setup': 'ship_setup',
  'staff': 'staff_management',
  'staff/add': 'staff_add',
  'staff/commission': 'staff_commission',
  'staff/logs': 'staff_logs',
  'staff/performance': 'staff_performance',
  'analytics/sales': 'analytics_sales',
  'analytics/customers': 'analytics_customers',
  'analytics/products': 'analytics_products',
  'analytics/branches': 'analytics_branches',
  'staff/job-cards': 'tailor_job_cards',
  'tailoring': 'tailor_job_cards',
  'products/seasons': 'seasonal_collections',
  'accounting/cashbook': 'acc_cash_book',
  'accounting/bankbook': 'acc_bank_book',
  'accounting/ledger': 'acc_ledger',
  'accounting/receivables': 'acc_receivables',
  'accounting/payables': 'acc_payables',
  'accounting/gst-report': 'fin_tax_report',
  'crm/segments': 'crm_customer_segmentation',
  'crm/vip': 'crm_vip_leaderboard',
  'crm/birthdays': 'crm_birthday_wishes',
  'notifications/email': 'mktg_templates',
  'notifications/sms': 'mktg_sms',
  'notifications/whatsapp': 'mktg_whatsapp',
  'expenses/add': 'fin_expenses',
  'expenses/categories': 'fin_expenses',
  'expenses/reports': 'fin_expenses',
};

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FeatureGuardService {
  private shopService = inject(ShopService);
  private authService = inject(AuthService);

  /**
   * Check if a specific feature is enabled for the current shop.
   * This is used for UI enforcement (hiding buttons, menu items, etc.)
   */
  hasFeature(shopId: string, featureKey: string): Observable<boolean> {
    if (!shopId) return of(false);

    return this.authService.initialized$.pipe(
      map(() => {
        const user = this.authService.getCurrentUser();
        if (!user) return false;
        
        // Custom feature override via shop data if needed
        // But primarily rely on the user profile's features
        if (Array.isArray(user.features) && user.features.includes(featureKey)) {
          return true;
        }

        return false;
      }),
      distinctUntilChanged(),
    );
  }

  /**
   * Synchronous check if a feature is enabled.
   * Requires shop data or user context to be pre-loaded in cache.
   */
  hasFeatureSync(context: any, featureKey: string): boolean {
    if (!featureKey) return true;

    // Use dynamic features attached to the user session
    const user = this.authService.getCurrentUser();
    if (user && Array.isArray(user.features) && user.features.includes(featureKey)) {
      return true;
    }

    // Allow custom features fallback if passed explicitly on a shop context object
    if (context && Array.isArray(context.customFeatures) && context.customFeatures.includes(featureKey)) {
      return true;
    }

    return false;
  }

  getFeatureForPath(path: string): string | null {
    // Exact match
    if (ROUTE_FEATURE_MAPPING[path]) return ROUTE_FEATURE_MAPPING[path];
    
    // Sort by path length for specific match
    const paths = Object.keys(ROUTE_FEATURE_MAPPING).sort((a, b) => b.length - a.length);
    const match = paths.find(p => path === p || path.startsWith(`${p}/`));
    
    return match ? ROUTE_FEATURE_MAPPING[match] : null;
  }
}
