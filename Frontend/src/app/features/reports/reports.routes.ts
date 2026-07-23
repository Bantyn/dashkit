import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./reports-shell.component').then((m) => m.ReportsShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./reports-entry.component').then((m) => m.ReportsEntryComponent),
      },
      {
        path: 'sales',
        canActivate: [permissionGuard],
        data: { permission: 'reports.sales.view' },
        loadComponent: () =>
          import('./pages/sales-report.component').then((m) => m.SalesReportComponent),
      },
      {
        path: 'website-sales',
        canActivate: [permissionGuard],
        data: { permission: 'reports.website_sales.view' },
        loadComponent: () =>
          import('./pages/website-sales-report.component').then(
            (m) => m.WebsiteSalesReportComponent,
          ),
      },
      {
        path: 'inventory',
        canActivate: [permissionGuard],
        data: { permission: 'reports.inventory.view' },
        loadComponent: () =>
          import('./pages/inventory-report.component').then((m) => m.InventoryReportComponent),
      },
      {
        path: 'profit-loss',
        canActivate: [permissionGuard],
        data: { permission: 'reports.profit_loss.view' },
        loadComponent: () =>
          import('./pages/profit-loss-report.component').then((m) => m.ProfitLossReportComponent),
      },
      {
        path: 'tax',
        canActivate: [permissionGuard],
        data: { permission: 'reports.tax.view' },
        loadComponent: () =>
          import('./pages/tax-report.component').then((m) => m.TaxReportComponent),
      },
    ],
  },
] satisfies Routes;
