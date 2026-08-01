import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AuthService } from '../../core/services/auth.service';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { PermissionService } from '../../core/services/permission.service';
import { BranchContextService } from '../../core/services/branch-context.service';
import { BranchService, Branch } from '../../core/services/branch.service';

import { UiLogoComponent } from './ui/ui-logo.component';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, HasPermissionDirective, UiLogoComponent],
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        display: none;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: var(--color-primary-200);
        border-radius: 4px;
        display: none;
      }
      @keyframes slideDownFader {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-menu-item {
        animation: slideDownFader 0.4s ease-out forwards;
        opacity: 0;
      }
    `,
  ],
  template: `
    <aside class="fixed left-0 top-0 h-screen w-64 bg-white flex flex-col z-50">
      <!-- Logo -->
      <div class="p-6 flex items-center gap-3">

        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-primary-600 shadow-md shadow-primary-500/20">
          <app-ui-logo size="34px" className="text-current"></app-ui-logo>
        </div>
        
        <div>
          <h1 class="text-xl font-bold text-gray-900">DashKit</h1>
          <p class="text-xs text-[var(--color-primary-500)] font-medium">Shop Management</p>
        </div>

      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <ul class="space-y-1 pb-20">
          @for (item of filteredMenuItems; track item.label; let i = $index) {
            <li class="animate-menu-item" [style.animation-delay]="(i * 0.05) + 's'">
              @if (!item.children) {
                <ng-container *hasPermission="item.permission || null">
                  <a
                    [routerLink]="getTopRoute(item.route)"
                    [queryParams]="item.queryParams || null"
                    [routerLinkActiveOptions]="item.routerLinkActiveOptions || { exact: false }"
                    routerLinkActive="bg-[var(--color-primary-50)] text-primary-600 font-medium"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors group"
                  >
                    <i [class]="'bi ' + item.icon + ' text-xl'"></i>
                    <span class="text-sm">{{ item.label }}</span>
                  </a>
                </ng-container>
              } @else {
                <div class="space-y-1">
                  <button
                    (click)="toggleMenu(item)"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-gray-50 hover:text-[var(--text-primary)] transition-colors group"
                    [class.text-primary-600]="item.expanded"
                    [class.bg-gray-50]="item.expanded"
                  >
                    <div class="flex items-center gap-3">
                      <i [class]="'bi ' + item.icon + ' text-xl'"></i>
                      <span class="text-sm font-medium">{{ item.label }}</span>
                    </div>
                    <svg
                      class="w-4 h-4 transition-transform duration-200"
                      [class.rotate-180]="item.expanded"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div class="grid transition-all duration-300 ease-in-out" [class]="item.expanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'">
                    <div class="overflow-hidden">
                      <div class="pl-11 space-y-1">
                        @for (subItem of item.children; track subItem.label) {
                          @if (hasFeature(subItem.feature)) {
                            <ng-container *hasPermission="subItem.permission || null">
                              <a
                                [routerLink]="getRoute(item.route, subItem.route)"
                                routerLinkActive="text-primary-600 font-medium"
                                class="block px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] hover:text-primary-600 hover:bg-primary-100 transition-colors"
                              >
                                {{ subItem.label }}
                              </a>
                            </ng-container>
                          }
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </li>
          }
        </ul>
      </nav>

      <!-- User Profile -->
      <div class="p-4">
        
        <div class="flex items-center gap-3 mb-3 pt-3 border-t border-1 border-primary-300">
          <div
            class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold border-2 border-white shadow-sm"
          >
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-gray-900 truncate">{{ userName }}</div>
            <div class="text-xs text-primary-500 truncate">{{ userEmail }}</div>
          </div>
        </div>
        <button
          (click)="handleLogout()"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-gray-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span class="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  userRole: string = 'shop_owner';
  userName: string = 'User';
  userEmail: string = '';
  userInitial: string = 'U';
  userShopId: string = '';
  menuItems: any[] = [];
  filteredMenuItems: any[] = [];
  activeBranchDetails: Branch | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private featureService: FeatureGuardService,
    private permissionService: PermissionService,
    private branchContext: BranchContextService,
    private branchService: BranchService,
  ) {
    this.initShopMenu();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userRole = user.role;
        this.userName = user.displayName;
        this.userEmail = user.email;
        this.userShopId = user.shopId || '';
        this.userInitial = user.displayName.charAt(0).toUpperCase();

        if (this.userRole === 'admin') {
          this.initAdminMenu();
        } else {
          this.initShopMenu();
        }
        this.fetchActiveBranchDetails();
        this.checkCurrentRouteFeature();
      }
    });

    this.branchContext.activeBranchInfo$.subscribe(() => {
      this.fetchActiveBranchDetails();
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkCurrentRouteFeature();
      }
    });
  }

  private normalizeChildPath(url: string) {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    if (segments.length <= 1) {
      return '';
    }
    if (segments[0] === 'shop' && segments.length > 2) {
      return segments.slice(2).join('/');
    }
    return segments.slice(1).join('/');
  }

  private checkCurrentRouteFeature() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role === 'admin') return;

    const requestedPath = this.normalizeChildPath(this.router.url);
    if (
      requestedPath === 'feature-unavailable' ||
      requestedPath === 'access-denied' ||
      requestedPath === 'dashboard' ||
      requestedPath === ''
    ) {
      return;
    }

    const featureKey = this.featureService.getFeatureForPath(requestedPath);
    if (!featureKey) return;

    const globalState = user.featureStates?.[featureKey] || 'active';
    if (
      globalState === 'inactive' ||
      globalState === 'deprecated' ||
      globalState === 'maintenance'
    ) {
      console.warn(`[Real-time Enforcement] Feature ${featureKey} has status ${globalState}. Redirecting.`);
      this.router.navigate(['/', user.shopId, 'feature-unavailable'], {
        queryParams: {
          blockedPath: requestedPath,
          featureKey: featureKey,
          state: globalState,
        },
      });
    }
  }

  fetchActiveBranchDetails() {
    const info = this.branchContext.getActiveBranchInfo();
    if (info.type === 'child' && info.id && this.userShopId) {
      this.branchService.getBranchById(this.userShopId, info.id).subscribe({
        next: (res) => {
          this.activeBranchDetails = res.data;
          this.refreshFilteredMenu();
        },
        error: () => {
          this.activeBranchDetails = null;
          this.refreshFilteredMenu();
        }
      });
    } else {
      this.activeBranchDetails = null;
      this.refreshFilteredMenu();
    }
  }

  // Helper to check feature access
  hasFeature(featureKey?: string): boolean {
    if (!featureKey) return true;
    if (this.userRole === 'admin') return true;
    
    const user = this.authService.getCurrentUser();
    if (!user || !user.shopId) return false;
    
    const shop = this.authService.getShopSync(user.shopId);
    return this.featureService.hasFeatureSync(shop, featureKey);
  }

  hasPermission(permissionKey?: string): boolean {
    if (!permissionKey) return true;
    if (this.userRole === 'admin') return true;
    return this.permissionService.hasPermission(permissionKey);
  }

  isModuleAllowed(module?: string | null): boolean {
    if (!module) return true;
    const info = this.branchContext.getActiveBranchInfo();
    if (info.type === 'parent') return true;
    
    if (this.activeBranchDetails && this.activeBranchDetails.allowedModules) {
      return this.activeBranchDetails.allowedModules.includes(module);
    }
    return true;
  }

  getModuleForMenuItem(item: any): string | null {
    if (item.module) return item.module;
    const route = item.route || '';
    if (route.startsWith('pos')) return 'pos';
    if (route.startsWith('orders') || route.startsWith('sales')) return 'pos';
    if (route.startsWith('invoices') || route.startsWith('payments') || route.startsWith('credit-notes')) return 'invoices';
    if (route.startsWith('transactions')) return 'transactions';
    if (route.startsWith('products') || route.startsWith('categories') || route.startsWith('reviews')) return 'products';
    if (route.startsWith('inventory')) return 'inventory';
    if (route.startsWith('purchases')) return 'purchases';
    if (route.startsWith('tailoring')) return 'tailoring';
    if (route.startsWith('customers')) return 'customers';
    if (route.startsWith('offers')) return 'offers';
    if (route.startsWith('promotions')) return 'promotions';
    if (route.startsWith('branches')) return 'branches';
    if (route.startsWith('shipping')) return 'integrations';
    if (route.startsWith('staff')) return 'staff';
    if (route.startsWith('reports')) return 'reports';
    if (route.startsWith('accounting')) return 'transactions';
    if (route.startsWith('crm')) return 'customers';
    if (route.startsWith('analytics')) return 'analytics';
    if (route.startsWith('website')) return 'website';
    if (route.startsWith('images')) return 'products';
    if (route.startsWith('notifications')) return 'promotions';
    if (route.startsWith('audit')) return 'staff';
    if (route.startsWith('expenses')) return 'pos';
    if (route.startsWith('settings')) return 'settings';
    
    const feat = item.feature || '';
    if (feat.startsWith('sell_pos')) return 'pos';
    if (feat.startsWith('sell_invoice')) return 'invoices';
    if (feat.startsWith('fin_transaction')) return 'transactions';
    if (feat.startsWith('inv_product')) return 'products';
    if (feat.startsWith('inv_stock') || feat.startsWith('inv_low') || feat.startsWith('inv_opening')) return 'inventory';
    if (feat.startsWith('inv_purchase') || feat.startsWith('inv_supplier')) return 'purchases';
    if (feat.startsWith('tailor')) return 'tailoring';
    if (feat.startsWith('cust_')) return 'customers';
    if (feat.startsWith('sell_offers')) return 'offers';
    if (feat.startsWith('mktg_')) return 'promotions';
    if (feat.startsWith('ent_multi') || feat.startsWith('analytics_branch')) return 'branches';
    if (feat.startsWith('ship_')) return 'integrations';
    if (feat.startsWith('staff_')) return 'staff';
    if (feat.startsWith('analytics_sales') || feat.startsWith('inv_reports') || feat.startsWith('fin_pnl') || feat.startsWith('fin_tax')) return 'reports';
    if (feat.startsWith('web_')) return 'website';
    if (feat.startsWith('fin_expenses')) return 'pos';
    
    return null;
  }

  refreshFilteredMenu() {
    this.filteredMenuItems = this.menuItems
      .map((item) => {
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter(
            (sub: any) => this.hasFeature(sub.feature) && this.hasPermission(sub.permission) && this.isModuleAllowed(this.getModuleForMenuItem(sub) || this.getModuleForMenuItem(item)),
          );
          return {
            ...item,
            children: filteredChildren,
          };
        }
        return { ...item };
      })
      .filter((item) => {
        if (!this.isModuleAllowed(this.getModuleForMenuItem(item))) {
          return false;
        }

        if (item.children && item.children.length > 0) {
          return true;
        }
        
        if (!item.children || item.children === null) {
          return this.hasFeature(item.feature) && this.hasPermission(item.permission);
        }

        return false;
      });
  }

  toggleMenu(item: any) {
    item.expanded = !item.expanded;
  }

  getTopRoute(route: string) {
    if (this.userRole === 'admin') {
      return ['/', ...route.split('/')];
    }
    return ['/', this.userShopId, ...route.split('/')];
  }

  getRoute(parent: string, child: string) {
    return ['/', this.userShopId, ...child.split('/')];
  }

  initAdminMenu() {
    this.menuItems = [
      {
        label: 'Admin Dashboard',
        icon: 'bi-speedometer2',
        route: 'admin/dashboard',
      },
      {
        label: 'Platform Overview',
        icon: 'bi-globe2',
        route: 'admin/overview',
      },
      {
        label: 'Shops Management',
        icon: 'bi-shop',
        expanded: false,
        children: [
          { label: 'All Shops', route: 'admin/shops' },
          { label: 'Store Requests', route: 'admin/shops/requests' },
          { label: 'Shop Reviews', route: 'admin/shops/reviews' },
          { label: 'Suspended Shops', route: 'admin/shops/suspended' },
        ],
      },
      {
        label: 'Users Management',
        icon: 'bi-people',
        expanded: false,
        children: [
          { label: 'All Users', route: 'admin/users' },
          { label: 'Admins', route: 'admin/admins' },
          { label: 'Activity Logs', route: 'admin/activity-logs' },
        ],
      },
      {
        label: 'Subscriptions',
        icon: 'bi-credit-card',
        expanded: false,
        children: [
          { label: 'Plans', route: 'admin/plans' },
          { label: 'Billing Logs', route: 'admin/billing' },
          { label: 'Transactions', route: 'admin/transactions' },
        ],
      },
      {
        label: 'Announcements',
        icon: 'bi-megaphone',
        route: 'admin/announcements',
      },
      {
        label: 'Platform Reports',
        icon: 'bi-bar-chart',
        expanded: false,
        children: [
          { label: 'Revenue Report', route: 'admin/reports/revenue' },
          { label: 'Shops Growth', route: 'admin/reports/shops' },
          { label: 'Usage Analytics', route: 'admin/reports/usage' },
        ],
      },
      {
        label: 'System Settings',
        icon: 'bi-gear',
        expanded: false,
        children: [
          { label: 'Global Settings', route: 'admin/settings' },
          { label: 'Payment Gateway', route: 'admin/settings/payment' },
          { label: 'SMS / Email API', route: 'admin/settings/api' },
          { label: 'Maintenance Mode', route: 'admin/settings/maintenance' },
        ],
      },
    ];
  }

  /**
   * All sidebar menu items are visible to ALL plans.
   * Plan-based access enforcement happens at route guard level (plan-access.guard.ts).
   * If a shop tries to access a feature their plan doesn't include,
   * they'll see an Access Denied page with upgrade options.
   */
  initShopMenu() {
    this.menuItems = [
      {
        label: 'Dashboard',
        icon: 'bi-grid-1x2-fill',
        route: 'dashboard',
        feature: 'analytics_dashboard',
        children: null,
      },
      {
        label: 'POS Sale',
        icon: 'bi-printer-fill',
        route: 'pos',
        feature: 'sell_pos_billing',
        children: null,
      },

      // Sales
      {
        label: 'Sales',
        icon: 'bi-cart-check-fill',
        expanded: false,
        feature: 'sell_pos_billing',
        children: [
          { label: 'Orders', route: 'orders', feature: 'sell_pos_billing' },
          { label: 'Returns', route: 'sales/returns', feature: 'sell_returns' },
          { label: 'Draft Bills', route: 'sales/drafts', feature: 'sell_drafts' },
          { label: 'Daily Closing', route: 'sales/daily-closing', feature: 'sell_daily_closing' },
        ],
      },

      // Invoices
      {
        label: 'Invoices',
        icon: 'bi-receipt',
        expanded: false,
        feature: 'sell_invoices',
        children: [
          { label: 'Shop Invoices', route: 'invoices/shop', feature: 'sell_invoices' },
          { label: 'Website Invoices', route: 'invoices/website', feature: 'web_storefront' },
          { label: 'Payments', route: 'payments', feature: 'fin_payments' },
          { label: 'Credit Notes', route: 'credit-notes', feature: 'sell_credit_notes' },
        ],
      },

      // Transactions
      {
        label: 'Transactions',
        icon: 'bi-arrow-left-right',
        expanded: false,
        feature: 'fin_transactions',
        children: [
          { label: 'All Transactions', route: 'transactions', feature: 'fin_transactions' },
          { label: 'Cash Ledger', route: 'transactions/cash', feature: 'fin_transactions' },
          { label: 'Online Payments', route: 'transactions/online', feature: 'sell_online_payments' },
          { label: 'Refunds', route: 'transactions/refunds', feature: 'sell_returns' },
        ],
      },

      // Products
      {
        label: 'Products',
        icon: 'bi-bag-fill',
        expanded: false,
        feature: 'inv_product_listing',
        children: [
          { label: 'All Products', route: 'products', feature: 'inv_product_listing' },
          { label: 'Categories', route: 'categories', feature: 'inv_categories' },
          { label: 'Brands', route: 'products/brands', feature: 'inv_brands' },
          { label: 'Variants', route: 'products/variants', feature: 'inv_variants' },
          { label: 'Seasonal Collections', route: 'products/seasons', feature: 'seasonal_collections' },
          { label: 'Bulk Import', route: 'products/import', feature: 'inv_bulk_import' },
          { label: 'Reviews', route: 'reviews', feature: 'cust_reviews' },
        ],
      },

      // Inventory
      {
        label: 'Inventory',
        icon: 'bi-box-seam-fill',
        expanded: false,
        feature: 'inv_stock_tracking',
        children: [
          { label: 'Daily Opening Stock', route: 'inventory/opening-stock', feature: 'inv_opening_stock' },
          { label: 'Stock Management', route: 'inventory', feature: 'inv_stock_tracking' },
          { label: 'Low Stock', route: 'inventory/low-stock', feature: 'inv_low_stock_alerts' },
          { label: 'Stock Transfer', route: 'inventory/transfer', feature: 'inv_stock_transfer' },
        ],
      },
      
      // Purchases
      {
        label: 'Purchases',
        icon: 'bi-bag-check-fill',
        expanded: false,
        feature: 'inv_purchase_orders',
        children: [
          { label: 'Purchase Orders', route: 'purchases/orders', feature: 'inv_purchase_orders' },
          { label: 'Goods Received', route: 'purchases/received', feature: 'inv_purchase_orders' },
          { label: 'Suppliers', route: 'purchases/suppliers', feature: 'inv_suppliers' },
          { label: 'Supplier Payments', route: 'purchases/payments', feature: 'inv_purchase_orders' },
          { label: 'Purchase Returns', route: 'purchases/returns', feature: 'inv_purchase_orders' },
        ],
      },

      // Tailoring
      {
        label: 'Tailoring',
        icon: 'bi-scissors',
        expanded: false,
        feature: 'tailor_job_cards',
        children: [
          { label: 'Job Cards & Alterations', route: 'tailoring', feature: 'tailor_job_cards' }
        ],
      },

      // Customers
      {
        label: 'Customers',
        icon: 'bi-people-fill',
        expanded: false,
        feature: 'cust_list',
        children: [
          { label: 'All Customers', route: 'customers', feature: 'cust_list' },
          { label: 'Online Customers', route: 'customers/online', feature: 'cust_online_customers' },
          { label: 'Customers Reviews', route: 'customers/review', feature: 'cust_reviews' },
          { label: 'Store Credit', route: 'customers/credits', feature: 'cust_credits' },
          { label: 'Order History', route: 'customers/history', feature: 'cust_history' },
        ],
      },

      // Offers
      {
        label: 'Offers',
        icon: 'bi-gift-fill',
        expanded: false,
        feature: 'sell_offers_discounts',
        children: [{ label: 'All Offers', route: 'offers', feature: 'sell_offers_discounts' }],
      },

      // Promotions
      {
        label: 'Promotions',
        icon: 'bi-gift',
        expanded: false,
        feature: 'mktg_promotions',
        children: [
          { label: 'Festival Campaigns', route: 'promotions/festival', feature: 'mktg_festival_offers' },
          { label: 'SMS Campaign', route: 'promotions/sms', feature: 'mktg_sms' },
          { label: 'WhatsApp Campaign', route: 'promotions/whatsapp', feature: 'mktg_whatsapp' },
          { label: 'Loyalty Programs', route: 'promotions/loyalty', feature: 'mktg_loyalty' },
        ],
      },

      // Branches
      {
        label: 'Branches',
        icon: 'bi-diagram-3-fill',
        expanded: false,
        feature: 'ent_multi_branch',
        permission: 'view_branches',
        children: [
          { label: 'All Branches', route: 'branches', feature: 'ent_multi_branch', permission: 'view_branches' },
          { label: 'Branch Analytics', route: 'branches/analytics', feature: 'analytics_branches', permission: 'view_branch_analytics' },
          { label: 'Permissions', route: 'branches/permissions', feature: 'ent_multi_branch', permission: 'manage_branch_permissions' },
          { label: 'Branch Settings', route: 'branches/settings', feature: 'ent_multi_branch', permission: 'edit_branch' },
        ],
      },

      // Shipping
      {
        label: 'Shipping',
        icon: 'bi-truck',
        expanded: false,
        feature: 'ship_setup',
        children: [
          { label: 'Shiprocket Setup', route: 'shipping/setup', feature: 'ship_shiprocket' },
          // Custom Delivery not included in any current plan
          // { label: 'Custom Delivery', route: 'shipping/custom-delivery', feature: 'ship_custom_delivery' },
          { label: 'Help', route: 'shipping/help', feature: 'ship_setup' },
        ],
      },

      // Staff
      {
        label: 'Staff',
        icon: 'bi-person-badge-fill',
        expanded: false,
        feature: 'staff_management',
        children: [
          { label: 'Staff List', route: 'staff', feature: 'staff_management' },
          { label: 'Commission', route: 'staff/commission', feature: 'staff_commission' },
          { label: 'Activity Logs', route: 'staff/logs', feature: 'staff_logs' },
          { label: 'Staff Performance', route: 'staff/performance', feature: 'staff_performance' },
        ],
      },

      // Reports
      {
        label: 'Reports',
        icon: 'bi-bar-chart-fill',
        expanded: false,
        feature: 'analytics_sales',
        children: [
          {
            label: 'Sales Report',
            route: 'reports/sales',
            feature: 'analytics_sales',
            permission: 'reports.sales.view',
          },
          {
            label: 'Website Sales',
            route: 'reports/website-sales',
            feature: 'web_storefront',
            permission: 'reports.website_sales.view',
          },
          {
            label: 'Inventory Report',
            route: 'reports/inventory',
            feature: 'inv_reports',
            permission: 'reports.inventory.view',
          },
          {
            label: 'Profit & Loss',
            route: 'reports/profit-loss',
            feature: 'fin_pnl_report',
            permission: 'reports.profit_loss.view',
          },
          {
            label: 'Tax Report',
            route: 'reports/tax',
            feature: 'fin_tax_report',
            permission: 'reports.tax.view',
          },
        ],
      },

      // Accounting
      {
        label: 'Accounting',
        icon: 'bi-journal-bookmark-fill',
        expanded: false,
        feature: 'fin_transactions',
        children: [
          { label: 'Cash Book', route: 'accounting/cashbook', feature: 'acc_cash_book' },
          { label: 'Bank Book', route: 'accounting/bankbook', feature: 'acc_bank_book' },
          { label: 'Ledger', route: 'accounting/ledger', feature: 'acc_ledger' },
          { label: 'Receivables', route: 'accounting/receivables', feature: 'acc_receivables' },
          { label: 'Payables', route: 'accounting/payables', feature: 'acc_payables' },
          { label: 'GST Report', route: 'accounting/gst-report', feature: 'fin_tax_report' },
        ],
      },

      // CRM
      {
        label: 'CRM',
        icon: 'bi-people-fill',
        expanded: false,
        feature: 'crm_customer_segmentation', // Base feature required to see the CRM menu
        children: [
          { label: 'Customer Segments', route: 'crm/segments', feature: 'crm_customer_segmentation' },
          { label: 'VIP Customers', route: 'crm/vip', feature: 'crm_vip_leaderboard' },
          { label: 'Birthday Wishes', route: 'crm/birthdays', feature: 'crm_birthday_wishes' }
        ],
      },

      // Analytics

      {
        label: 'Analytics',
        icon: 'bi-graph-up-arrow',
        expanded: false,
        feature: 'analytics_dashboard',
        children: [
          {
            label: 'Sales Analytics',
            route: 'analytics/sales',
            feature: 'analytics_sales',
            permission: 'view_sales_analytics',
          },
          {
            label: 'Customer Analytics',
            route: 'analytics/customers',
            feature: 'analytics_customers',
            permission: 'view_customer_analytics',
          },
          {
            label: 'Product Performance',
            route: 'analytics/products',
            feature: 'analytics_products',
            permission: 'view_product_performance',
          },
          {
            label: 'Branch Performance',
            route: 'analytics/branches',
            feature: 'analytics_branches',
            permission: 'view_branch_performance',
          },
        ],
      },

      // Website
      {
        label: 'Website',
        icon: 'bi-globe',
        expanded: false,
        feature: 'web_storefront',
        children: [
          { label: 'Website Theme', route: 'website/theme', feature: 'web_theme' },
          { label: 'Pages', route: 'website/pages', feature: 'web_pages' },
          { label: 'Sub Domain', route: 'website/domain', feature: 'web_domain' },
          { label: 'Configuration', route: 'website/settings', feature: 'web_settings' },
        ],
      },

      // Images
      {
        label: 'Images',
        icon: 'bi-images',
        expanded: false,
        feature: 'inv_product_listing',
        children: [
          { label: 'All Images', route: 'images', feature: 'inv_product_listing' },
          { label: 'Shop Images', route: 'images/shop', feature: 'inv_product_listing' },
          { label: 'Product Images', route: 'images/product', feature: 'inv_product_listing' },
          { label: 'Profile Images', route: 'images/profile', feature: 'inv_product_listing' },
          { label: 'Customer Images', route: 'images/customer', feature: 'inv_product_listing' },
        ],
      },

      // Notifications
      {
        label: 'Notifications',
        icon: 'bi-bell-fill',
        expanded: false,
        feature: 'mktg_templates',
        children: [
          { label: 'Email Templates', route: 'notifications/email', feature: 'mktg_templates' },
          { label: 'SMS Templates', route: 'notifications/sms', feature: 'mktg_sms' },
          { label: 'WhatsApp Templates', route: 'notifications/whatsapp', feature: 'mktg_whatsapp' },
          { label: 'Notification Logs', route: 'notifications/logs', feature: 'mktg_templates' },
        ],
      },

      // Audit
      {
        label: 'Audit Logs',
        icon: 'bi-shield-lock-fill',
        expanded: false,
        feature: 'ent_audit_logs',
        children: [
          // { label: 'Admin Logs', route: 'audit/admin', feature: 'ent_audit_logs' },
          { label: 'Staff Activity', route: 'audit/staff', feature: 'ent_audit_logs' },
          // { label: 'System Logs', route: 'audit/system', feature: 'ent_audit_logs' },
        ],
      },

      // Expenses
      {
        label: 'Expenses',
        icon: 'bi-cash-coin',
        expanded: false,
        feature: 'fin_expenses',
        children: [
          { label: 'Add Expense', route: 'expenses/add', feature: 'fin_expenses' },
          { label: 'Expense Categories', route: 'expenses/categories', feature: 'fin_expenses' },
          { label: 'Reports', route: 'expenses/reports', feature: 'fin_expenses' },
        ],
      },

      // Settings
      {
        label: 'Settings',
        icon: 'bi-gear-fill',
        expanded: false,
        feature: 'inv_product_listing',
        children: [
          { label: 'Shop Profile', route: 'settings', feature: 'inv_product_listing' },
          { label: 'POS Counters', route: 'settings/pos-counters', feature: 'sell_offline_pos_counters' },
          { label: 'Tax Settings', route: 'settings/tax', feature: 'fin_tax_report' },
          { label: 'Invoice Template', route: 'settings/invoice-template', feature: 'intg_invoice_template' },
          { label: 'Payment Methods', route: 'settings/payment-methods', feature: 'fin_payments' },
          { label: 'Subscription Plan', route: 'subscription', feature: 'inv_product_listing' },
          { label: 'Integrations', route: 'settings/integrations' },
          { label: 'Backup & Export', route: 'settings/backup', feature: 'ent_backup' },
          { label: 'Security', route: 'security', feature: 'ent_security' },
        ],
      },
      // help section
      {
        label: 'Help & Support',
        icon: 'bi-question-circle',
        expanded: false,
        feature: 'inv_product_listing', // Needs to be visible to all
        children: null,
        route: 'help'
      },
    ];
  }

  async handleLogout() {
    await this.authService.logout();
  }
}
