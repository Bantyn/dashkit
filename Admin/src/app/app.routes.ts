import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'notifications',
    redirectTo: 'admin/notifications',
    pathMatch: 'full',
  },
  {
    path: 'admin/notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/admin-notifications.component').then(
        (m) => m.AdminNotificationsComponent,
      ),
  },
  {
    path: 'system',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/observability/live-monitoring.component').then(
        (m) => m.LiveMonitoringComponent,
      ),
  },
  {
    path: 'observability',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/observability/admin-observability.component').then(
        (m) => m.AdminObservabilityComponent,
      ),
  },
  {
    path: 'cost-monitor',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/observability/firestore-cost-monitor.component').then(
        (m) => m.FirestoreCostMonitorComponent,
      ),
  },
  {
    path: 'shops',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shops/admin-shops.component').then((m) => m.AdminShopsComponent),
  },
  {
    path: 'shops/requests',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shops/shop-requests.component').then((m) => m.ShopRequestsComponent),
  },
  {
    path: 'shops/reviews',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shops/shop-reviews.component').then((m) => m.ShopReviewsComponent),
  },
  {
    path: 'shops/suspended',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shops/shop-suspended.component').then((m) => m.ShopSuspendedComponent),
  },
  {
    path: 'shops/custom-plan-requests',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shops/custom-plan-requests.component').then((m) => m.CustomPlanRequestsComponent),
  },
  {
    path: 'shops/:shopId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shops/shop-details.component').then((m) => m.ShopDetailsComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/admin-users.component').then((m) => m.AdminUsersComponent),
  },
  {
    path: 'users/admins',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/admin-admins.component').then((m) => m.AdminAdminsComponent),
  },
  {
    path: 'users/staffs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/admin-staffs.component').then((m) => m.AdminStaffsComponent),
  },
  {
    path: 'users/customers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/admin-customers.component').then((m) => m.AdminCustomersComponent),
  },
  {
    path: 'users/activity-logs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/admin-activity-logs.component').then((m) => m.AdminActivityLogsComponent),
  },
  {
    path: 'plans',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/plans/admin-plans.component').then((m) => m.AdminPlansComponent),
  },
  {
    path: 'features',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/features/admin-features.component').then(
        (m) => m.AdminFeaturesComponent,
      ),
  },
  {
    path: 'roles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/roles/admin-roles.component').then((m) => m.AdminRolesComponent),
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/admin-billing.component').then((m) => m.AdminBillingComponent),
  },
  {
    path: 'billing/credit-packs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/credit-packs.component').then((m) => m.CreditPacksComponent),
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/admin-transactions.component').then(
        (m) => m.AdminTransactionsComponent,
      ),
  },
  {
    path: 'themes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/themes/admin-themes.component').then((m) => m.AdminThemesComponent),
  },
  {
    path: 'leads',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/leads/admin-leads.component').then((m) => m.AdminLeadsComponent),
  },
  {
    path: 'reports/revenue',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/admin-reports-revenue.component').then((m) => m.AdminReportsRevenueComponent),
  },
  {
    path: 'reports/shops',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/admin-reports-shops.component').then((m) => m.AdminReportsShopsComponent),
  },
  {
    path: 'reports/usage',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/admin-reports-usage.component').then((m) => m.AdminReportsUsageComponent),
  },
  {
    path: 'reports/staff',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/admin-reports-staff.component').then((m) => m.AdminReportsStaffComponent),
  },
  {
    path: 'reports/costs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/admin-reports-costs.component').then((m) => m.AdminReportsCostsComponent),
  },
  {
    path: 'settings/general',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-general.component').then(m => m.SettingsGeneralComponent)
  },
  {
    path: 'settings/payment',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-payment.component').then(m => m.SettingsPaymentComponent)
  },
  {
    path: 'settings/gst',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-gst.component').then(m => m.SettingsGstComponent)
  },
  {
    path: 'settings/api',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-api.component').then(m => m.SettingsApiComponent)
  },
  {
    path: 'settings/cost-pricing',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-cost-pricing.component').then(m => m.SettingsCostPricingComponent)
  },
  {
    path: 'settings/maintenance',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-maintenance.component').then(m => m.SettingsMaintenanceComponent)
  },
  {
    path: 'settings',
    redirectTo: 'settings/general',
    pathMatch: 'full'
  },
  {
    path: 'database',
    redirectTo: 'database/overview',
    pathMatch: 'full',
  },
  {
    path: 'downloads/export-center',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/downloads/export-center.component').then((m) => m.ExportCenterComponent),
  },
  {
    path: 'downloads/history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/downloads/export-history.component').then((m) => m.ExportHistoryComponent),
  },
  {
    path: 'data-management/export',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/data-management/data-export.component').then((m) => m.DataManagementExportComponent),
  },
  {
    path: 'data-management/import',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/data-management/data-import.component').then((m) => m.DataManagementImportComponent),
  },
  {
    path: 'platform/health',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/observability/platform-health.component').then((m) => m.PlatformHealthComponent),
  },
  {
    path: 'announcements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/announcements/admin-announcements.component').then((m) => m.AdminAnnouncementsComponent),
  },
  {
    path: 'announcements/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/announcements/admin-announcement-form.component').then((m) => m.AdminAnnouncementFormComponent),
  },
  {
    path: 'database/:tab',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings-database.component').then((m) => m.SettingsDatabaseComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./core/components/not-found.component').then((m) => m.NotFoundComponent),
  },
];

