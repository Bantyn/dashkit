import { Routes } from '@angular/router';
import { enforcementGuard } from '../../core/guards/enforcement.guard';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./analytics-shell.component').then((m) => m.AnalyticsShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./analytics-entry.component').then((m) => m.AnalyticsEntryComponent),
      },
      {
        path: 'sales',
        canActivate: [enforcementGuard],
        data: { permission: 'view_sales_analytics' },
        loadComponent: () =>
          import('./pages/sales-analytics.component').then((m) => m.SalesAnalyticsComponent),
      },
      {
        path: 'customers',
        canActivate: [enforcementGuard],
        data: { permission: 'view_customer_analytics' },
        loadComponent: () =>
          import('./pages/customer-analytics.component').then((m) => m.CustomerAnalyticsComponent),
      },
      {
        path: 'products',
        canActivate: [enforcementGuard],
        data: { permission: 'view_product_performance' },
        loadComponent: () =>
          import('./pages/product-performance.component').then(
            (m) => m.ProductPerformanceComponent,
          ),
      },
      {
        path: 'branches',
        canActivate: [enforcementGuard],
        data: { permission: 'view_branch_performance' },
        loadComponent: () =>
          import('./pages/branch-performance.component').then(
            (m) => m.BranchPerformanceComponent,
          ),
      },
    ],
  },
] satisfies Routes;
