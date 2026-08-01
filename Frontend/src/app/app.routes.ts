import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { planAccessGuard } from './core/guards/plan-access.guard';
import { subscriptionRedirectGuard } from './core/guards/subscription-redirect.guard';
import { enforcementGuard } from './core/guards/enforcement.guard';

export const routes: Routes = [
  {
    path: 'shop/:shopId/analytics',
    pathMatch: 'full',
    redirectTo: ':shopId/analytics',
  },
  {
    path: 'shop/:shopId/analytics/:page',
    redirectTo: ':shopId/analytics/:page',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'subscription',
        canActivate: [subscriptionRedirectGuard],
        children: [], // Guard handles redirect, no component needed
      },
      // Shop Owner routes (protected)
      {
        path: ':shopId',
        canActivate: [authGuard, roleGuard],
        canActivateChild: [planAccessGuard],
        data: { role: 'shop_owner' },
        children: [
          {
            path: 'access-denied',
            loadComponent: () =>
              import('./core/components/access-denied.component').then(
                (m) => m.AccessDeniedComponent,
              ),
          },
          {
            path: 'feature-unavailable',
            loadComponent: () =>
              import('./core/components/feature-unavailable.component').then(
                (m) => m.FeatureUnavailableComponent,
              ),
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
          },
          {
            path: 'pos',
            loadComponent: () =>
              import('./features/sales/pos.component').then((m) => m.POSComponent),
          },
          {
            path: 'help',
            loadComponent: () =>
              import('./features/help/help.component').then((m) => m.HelpComponent),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/sales/order-list.component').then((m) => m.OrderListComponent),
          },
          {
            path: 'invoices/shop',
            loadComponent: () =>
              import('./features/invoices/invoice-list.component').then(
                (m) => m.InvoiceListComponent,
              ),
          },
          {
            path: 'invoices/website',
            loadComponent: () =>
              import('./features/invoices/invoice-list.component').then(
                (m) => m.InvoiceListComponent,
              ),
          },
          {
            path: 'products',
            loadComponent: () =>
              import('./features/products/product-list.component').then(
                (m) => m.ProductListComponent,
              ),
          },
          {
            path: 'products/brands',
            loadComponent: () =>
              import('./features/products/brand-list.component').then((m) => m.BrandListComponent),
          },
          {
            path: 'products/variants',
            loadComponent: () =>
              import('./features/products/variant-list.component').then(
                (m) => m.VariantListComponent,
              ),
          },
          {
            path: 'products/import',
            loadComponent: () =>
              import('./features/products/bulk-import.component').then(
                (m) => m.BulkImportComponent,
              ),
          },
          {
            path: 'products/seasons',
            loadComponent: () =>
              import('./features/products/seasonal-collections.component').then(
                (m) => m.SeasonalCollectionsComponent,
              ),
          },
          {
            path: 'customers',
            loadComponent: () =>
              import('./features/customers/customer-list.component').then(
                (m) => m.CustomerListComponent,
              ),
          },
          {
            path: 'customers/online',
            loadComponent: () =>
              import('./features/customers/online-customer-list.component').then(
                (m) => m.OnlineCustomerListComponent,
              ),
          },
          {
            path: 'customers/history',
            loadComponent: () =>
              import('./features/sales/order-list.component').then((m) => m.OrderListComponent),
          },
          {
            path: 'customers/credits',
            loadComponent: () =>
              import('./features/customers/customer-credits.component').then(
                (m) => m.CustomerCreditsComponent,
              ),
          },
          {
            path: 'customers/review',
            loadComponent: () =>
              import('./features/reviews/reviews.component').then((m) => m.ReviewsComponent),
          },
          {
            path: 'sales/returns',
            loadComponent: () =>
              import('./features/sales/sales-return-list.component').then(
                (m) => m.SalesReturnListComponent,
              ),
          },
          {
            path: 'sales/drafts',
            loadComponent: () =>
              import('./features/sales/sales-drafts.component').then((m) => m.SalesDraftsComponent),
          },
          {
            path: 'payments',
            loadComponent: () =>
              import('./features/payments/payment-list.component').then(
                (m) => m.PaymentListComponent,
              ),
          },
          {
            path: 'credit-notes',
            loadComponent: () =>
              import('./features/credit-notes/credit-note-list.component').then(
                (m) => m.CreditNoteListComponent,
              ),
          },
          {
            path: 'reviews',
            loadComponent: () =>
              import('./features/reviews/reviews.component').then((m) => m.ReviewsComponent),
          },
          {
            path: 'security',
            loadComponent: () =>
              import('./features/security/security.component').then((m) => m.SecurityComponent),
          },
          {
            path: 'support',
            loadComponent: () =>
              import('./features/support/support.component').then((m) => m.SupportComponent),
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./features/categories/category-list.component').then(
                (m) => m.CategoryListComponent,
              ),
          },
          {
            path: 'inventory',
            loadComponent: () =>
              import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
          },
          {
            path: 'inventory/low-stock',
            loadComponent: () =>
              import('./features/inventory/low-stock-list.component').then(
                (m) => m.LowStockListComponent,
              ),
          },
          {
            path: 'inventory/transfer',
            loadComponent: () =>
              import('./features/inventory/stock-transfer.component').then(
                (m) => m.StockTransferComponent,
              ),
          },
          {
            path: 'inventory/history',
            loadComponent: () =>
              import('./features/inventory/inventory-history.component').then(
                (m) => m.InventoryHistoryComponent,
              ),
          },
          {
            path: 'offers',
            loadComponent: () =>
              import('./features/offers/offers.component').then((m) => m.OffersComponent),
          },
          // Expenses
          {
            path: 'expenses/add',
            loadComponent: () =>
              import('./features/expenses/expenses-add.component').then(
                (m) => m.ExpensesAddComponent,
              ),
          },
          {
            path: 'expenses/categories',
            loadComponent: () =>
              import('./features/expenses/expenses-categories.component').then(
                (m) => m.ExpensesCategoriesComponent,
              ),
          },
          {
            path: 'expenses/reports',
            loadComponent: () =>
              import('./features/expenses/expenses-reports.component').then(
                (m) => m.ExpensesReportsComponent,
              ),
          },
          // Opening Stock
          {
            path: 'inventory/opening-stock',
            loadComponent: () =>
              import('./features/inventory/daily-opening-stock.component').then(
                (m) => m.DailyOpeningStockComponent,
              ),
          },
          // Daily Closing
          {
            path: 'sales/daily-closing',
            loadComponent: () =>
              import('./features/sales/daily-closing.component').then(
                (m) => m.DailyClosingComponent,
              ),
          },
          {
            path: 'reports',
            loadChildren: () => import('./features/reports/reports.routes'),
          },
          {
            path: 'analytics',
            loadChildren: () => import('./features/analytics/analytics.routes'),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/settings/settings.component').then((m) => m.SettingsComponent),
          },
          {
            path: 'settings/tax',
            loadComponent: () =>
              import('./features/settings/tax/tax-settings.component').then(
                (m) => m.TaxSettingsComponent,
              ),
          },
          {
            path: 'settings/invoice-template',
            loadComponent: () =>
              import('./features/settings/invoice-template/invoice-template.component').then(
                (m) => m.InvoiceTemplateComponent,
              ),
          },
          {
            path: 'settings/payment-methods',
            loadComponent: () =>
              import('./features/settings/payment-methods/payment-methods.component').then(
                (m) => m.PaymentMethodsComponent,
              ),
          },
          {
            path: 'settings/integrations',
            loadComponent: () =>
              import('./features/settings/integrations/integrations.component').then(
                (m) => m.IntegrationsComponent,
              ),
          },
          {
            path: 'settings/backup',
            loadComponent: () =>
              import('./features/settings/backup/backup-export.component').then(
                (m) => m.BackupExportComponent,
              ),
          },
          {
            path: 'settings/pos-counters',
            loadComponent: () =>
              import('./features/settings/pos-counters/pos-counters.component').then(
                (m) => m.PosCountersComponent,
              ),
          },
          {
            path: 'website',
            loadComponent: () =>
              import('./features/settings/website-settings/website-overview.component').then(
                (m) => m.WebsiteOverviewComponent,
              ),
          },
          {
            path: 'website/theme',
            loadComponent: () =>
              import('./features/settings/website-settings/website-theme.component').then(
                (m) => m.WebsiteThemeComponent,
              ),
          },
          {
            path: 'website/pages',
            loadComponent: () =>
              import('./features/settings/website-settings/website-pages.component').then(
                (m) => m.WebsitePagesComponent,
              ),
          },
          {
            path: 'website/domain',
            loadComponent: () =>
              import('./features/settings/website-settings/website-domain.component').then(
                (m) => m.WebsiteDomainComponent,
              ),
          },
          {
            path: 'website/settings',
            loadComponent: () =>
              import('./features/settings/website-settings/website-settings-general.component').then(
                (m) => m.WebsiteSettingsGeneralComponent,
              ),
          },
          {
            path: 'staff',
            loadComponent: () =>
              import('./features/staff/staff-list.component').then((m) => m.StaffListComponent),
          },
          {
            path: 'staff/add',
            loadComponent: () =>
              import('./features/staff/staff-form.component').then((m) => m.StaffFormComponent),
          },
          {
            path: 'staff/edit/:id',
            loadComponent: () =>
              import('./features/staff/staff-form.component').then((m) => m.StaffFormComponent),
          },
          {
            path: 'staff/profile/:id',
            loadComponent: () =>
              import('./features/staff/staff-profile.component').then(
                (m) => m.StaffProfileComponent,
              ),
          },
          {
            path: 'staff/commission',
            loadComponent: () =>
              import('./features/staff/staff-commission.component').then(
                (m) => m.StaffCommissionComponent,
              ),
          },
          {
            path: 'staff/logs',
            loadComponent: () =>
              import('./features/staff/staff-logs.component').then((m) => m.StaffLogsComponent),
          },
          {
            path: 'staff/performance',
            loadComponent: () =>
              import('./features/staff/staff-performance.component').then(
                (m) => m.StaffPerformanceComponent,
              ),
          },
          {
            path: 'staff/job-cards',
            loadComponent: () =>
              import('./features/staff/tailor-job-cards.component').then(
                (m) => m.TailorJobCardsComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/profile/profile.component').then((m) => m.ProfileComponent),
          },
          {
            path: 'subscription',
            loadComponent: () =>
              import('./features/subscription/subscription.component').then(
                (m) => m.SubscriptionComponent,
              ),
          },
          {
            path: 'shipping/setup',
            loadComponent: () =>
              import('./features/shipping/shipping-setup.component').then(
                (m) => m.ShippingSetupComponent,
              ),
          },
          {
            path: 'shipping/help',
            loadComponent: () =>
              import('./features/shipping/shipping-help.component').then(
                (m) => m.ShippingHelpComponent,
              ),
          },
          {
            path: 'promotions',
            loadComponent: () =>
              import('./features/promotions/promotions.component').then(
                (m) => m.PromotionsComponent,
              ),
          },
          {
            path: 'promotions/festival',
            loadComponent: () =>
              import('./features/promotions/festival-campaigns.component').then(
                (m) => m.FestivalCampaignsComponent,
              ),
          },
          {
            path: 'promotions/sms',
            loadComponent: () =>
              import('./features/promotions/sms-campaign.component').then(
                (m) => m.SmsCampaignComponent,
              ),
          },
          {
            path: 'promotions/whatsapp',
            loadComponent: () =>
              import('./features/promotions/whatsapp-campaign.component').then(
                (m) => m.WhatsappCampaignComponent,
              ),
          },
          {
            path: 'promotions/loyalty',
            loadComponent: () =>
              import('./features/promotions/loyalty-programs.component').then(
                (m) => m.LoyaltyProgramsComponent,
              ),
          },
          {
            path: 'promotions/templates',
            loadComponent: () =>
              import('./features/promotions/message-templates.component').then(
                (m) => m.MessageTemplatesComponent,
              ),
          },
          // Branches
          {
            path: 'branches',
            canActivate: [enforcementGuard],
            data: { permission: 'view_branches' },
            loadComponent: () =>
              import('./features/branches/branch-list/branch-list').then((m) => m.BranchList),
          },
          {
            path: 'branches/analytics',
            canActivate: [enforcementGuard],
            data: { permission: 'view_branch_analytics' },
            loadComponent: () =>
              import('./features/branches/branch-analytics/branch-analytics-list').then(
                (m) => m.BranchAnalyticsList,
              ),
          },
          {
            path: 'branches/permissions',
            canActivate: [enforcementGuard],
            data: { permission: 'manage_branch_permissions' },
            loadComponent: () =>
              import('./features/branches/branch-permissions/branch-permissions').then(
                (m) => m.BranchPermissions,
              ),
          },
          {
            path: 'branches/settings',
            canActivate: [enforcementGuard],
            data: { permission: 'edit_branch' },
            loadComponent: () =>
              import('./features/branches/branch-settings/branch-settings').then(
                (m) => m.BranchSettings,
              ),
          },
          {
            path: 'branches/settings/:branchId',
            canActivate: [enforcementGuard],
            data: { permission: 'edit_branch' },
            loadComponent: () =>
              import('./features/branches/branch-settings/branch-settings').then(
                (m) => m.BranchSettings,
              ),
          },
          {
            path: 'branches/:branchId/analytics',
            canActivate: [enforcementGuard],
            data: { permission: 'view_branch_analytics' },
            loadComponent: () =>
              import('./features/branches/branch-analytics/branch-analytics').then(
                (m) => m.BranchAnalytics,
              ),
          },
          // Purchases
          {
            path: 'purchases/orders',
            loadComponent: () =>
              import('./features/purchases/purchase-orders/purchase-orders').then(
                (m) => m.PurchaseOrders,
              ),
          },
          {
            path: 'purchases/received',
            loadComponent: () =>
              import('./features/purchases/goods-received/goods-received').then(
                (m) => m.GoodsReceived,
              ),
          },
          {
            path: 'purchases/suppliers',
            loadComponent: () =>
              import('./features/purchases/suppliers/suppliers').then(
                (m) => m.Suppliers,
              ),
          },
          {
            path: 'purchases/payments',
            loadComponent: () =>
              import('./features/purchases/supplier-payments/supplier-payments').then(
                (m) => m.SupplierPayments,
              ),
          },
          {
            path: 'purchases/returns',
            loadComponent: () =>
              import('./features/purchases/purchase-returns/purchase-returns').then(
                (m) => m.PurchaseReturns,
              ),
          },
          // Transactions
          {
            path: 'transactions',
            loadComponent: () =>
              import('./features/transactions/transaction-list/transaction-list').then(
                (m) => m.TransactionList,
              ),
          },
          {
            path: 'transactions/cash',
            loadComponent: () =>
              import('./features/transactions/cash-ledger/cash-ledger').then((m) => m.CashLedger),
          },
          {
            path: 'transactions/online',
            loadComponent: () =>
              import('./features/transactions/online-payments/online-payments').then(
                (m) => m.OnlinePayments,
              ),
          },
          {
            path: 'transactions/refunds',
            loadComponent: () =>
              import('./features/transactions/refunds/refunds').then((m) => m.Refunds),
          },
          // Accounting
          {
            path: 'accounting/cashbook',
            loadComponent: () =>
              import('./features/accounting/cash-book/cash-book').then((m) => m.CashBook),
          },
          {
            path: 'accounting/bankbook',
            loadComponent: () =>
              import('./features/accounting/bank-book/bank-book').then((m) => m.BankBook),
          },
          {
            path: 'accounting/ledger',
            loadComponent: () =>
              import('./features/accounting/ledger/ledger').then((m) => m.Ledger),
          },
          {
            path: 'accounting/receivables',
            loadComponent: () =>
              import('./features/accounting/receivables/receivables').then((m) => m.Receivables),
          },
          {
            path: 'accounting/payables',
            loadComponent: () =>
              import('./features/accounting/payables/payables').then((m) => m.Payables),
          },
          {
            path: 'accounting/gst-report',
            loadComponent: () =>
              import('./features/accounting/gst-report/gst-report').then((m) => m.GSTReportComponent),
          },
          // CRM
          {
            path: 'crm/segments',
            loadComponent: () =>
              import('./features/crm/customer-segments/customer-segments').then((m) => m.CustomerSegments),
          },
          {
            path: 'crm/vip',
            loadComponent: () =>
              import('./features/crm/vip-customers/vip-customers').then((m) => m.VipCustomers),
          },
          {
            path: 'crm/birthdays',
            loadComponent: () =>
              import('./features/crm/birthday-wishes/birthday-wishes').then((m) => m.BirthdayWishes),
          },
          {
            path: 'crm/anniversaries',
            loadComponent: () =>
              import('./features/crm/anniversary-offers/anniversary-offers').then((m) => m.AnniversaryOffers),
          },
          // Tailoring
          {
            path: 'tailoring',
            loadChildren: () => import('./features/tailoring/tailoring.routes').then(m => m.TAILORING_ROUTES),
          },
          // Audit

          {
            path: 'audit/admin',
            loadComponent: () =>
              import('./features/audit/admin-logs/admin-logs').then((m) => m.AdminLogs),
          },
          {
            path: 'audit/staff',
            loadComponent: () =>
              import('./features/audit/staff-activity/staff-activity').then((m) => m.StaffActivity),
          },
          {
            path: 'audit/system',
            loadComponent: () =>
              import('./features/audit/system-logs/system-logs').then((m) => m.SystemLogs),
          },
          // Images
          {
            path: 'images',
            loadComponent: () =>
              import('./features/images/image-gallery.component').then(
                (m) => m.ImageGalleryComponent,
              ),
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/images/all-images.component').then(
                    (m) => m.AllImagesComponent,
                  ),
              },
              {
                path: 'shop',
                loadComponent: () =>
                  import('./features/images/shop-images.component').then(
                    (m) => m.ShopImagesComponent,
                  ),
              },
              {
                path: 'website',
                loadComponent: () =>
                  import('./features/images/website-images.component').then(
                    (m) => m.WebsiteImagesComponent,
                  ),
              },

              {
                path: 'product',
                loadComponent: () =>
                  import('./features/images/product-images.component').then(
                    (m) => m.ProductImagesComponent,
                  ),
              },
              {
                path: 'invoice',
                loadComponent: () =>
                  import('./features/images/invoice-images.component').then(
                    (m) => m.InvoiceImagesComponent,
                  ),
              },
              {
                path: 'profile',
                loadComponent: () =>
                  import('./features/images/profile-images.component').then(
                    (m) => m.ProfileImagesComponent,
                  ),
              },
              {
                path: 'customer',
                loadComponent: () =>
                  import('./features/images/customer-images.component').then(
                    (m) => m.CustomerImagesComponent,
                  ),
              },
            ],
          },

          // Notifications
          {
            path: 'notifications/email',
            loadComponent: () =>
              import('./features/notifications/email-templates/email-templates').then(
                (m) => m.EmailTemplates,
              ),
          },
          {
            path: 'notifications/sms',
            loadComponent: () =>
              import('./features/notifications/sms-templates/sms-templates').then(
                (m) => m.SmsTemplates,
              ),
          },
          {
            path: 'notifications/whatsapp',
            loadComponent: () =>
              import('./features/notifications/whatsapp-templates/whatsapp-templates').then(
                (m) => m.WhatsappTemplates,
              ),
          },
          {
            path: 'notifications/logs',
            loadComponent: () =>
              import('./features/notifications/notification-logs/notification-logs').then(
                (m) => m.NotificationLogs,
              ),
          },
        ],
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
      },
      // Public Print Route
      {
        path: ':shopId/invoices/:invoiceId/print',
        loadComponent: () =>
          import('./features/invoices/invoice-print-page.component').then(
            (m) => m.InvoicePrintPageComponent,
          ),
      },
  // Fallback
  {
    path: '**',
    loadComponent: () =>
      import('./core/components/page-not-found.component').then((m) => m.PageNotFoundComponent),
  },
];
