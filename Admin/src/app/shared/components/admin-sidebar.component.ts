import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { UiLogoComponent } from './ui-logo.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, UiLogoComponent],
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
    `,
  ],
  template: `
    <aside class="fixed left-0 top-0 h-screen w-64 bg-white flex flex-col z-50">
      <!-- Logo -->
      <div class="p-6 flex items-center gap-3">
        <div class="w-10 h-10 bg-[var(--color-primary-600)] rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/20">
          <app-ui-logo size="24px" className="fill-current text-white"></app-ui-logo>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900">DashKit</h1>
          <p class="text-xs text-gray-500 font-medium">Admin Panel</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <ul class="space-y-0.5 pb-20">
          @for (item of menuItems; track item.label) {
            <li>
              @if (item.divider) {
                <!-- Section Divider -->
                <div class="pt-4 pb-1.5 px-3 flex items-center gap-2">
                  <span class="text-[10px] font-normal tracking-widest text-gray-400">{{ item.label }}</span>
                  <div class="flex-1 h-px bg-gray-100"></div>
                </div>
              } @else if (!item.children) {
                <a
                  routerLink="/{{ item.route }}"
                  routerLinkActive="bg-[var(--color-primary-600)] text-primary-50 font-medium"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-black/5 hover:text-primary-700 transition-colors group"
                >
                  <i [class]="'bi ' + item.icon + ' text-lg'"></i>
                  <span class="text-sm">{{ item.label }}</span>
                </a>
              } @else {
                <div class="space-y-0.5">
                  <button
                    (click)="toggleMenu(item)"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-black/5 hover:text-primary-700 transition-colors group"
                    [class.text-primary-600]="item.expanded"
                    [class.bg-gray-50]="item.expanded"
                  >
                    <div class="flex items-center gap-3">
                      <i [class]="'bi ' + item.icon + ' text-lg'"></i>
                      <span class="text-sm font-medium">{{ item.label }}</span>
                    </div>
                    <svg
                      class="w-3.5 h-3.5 transition-transform duration-200 text-gray-400"
                      [class.rotate-180]="item.expanded"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  @if (item.expanded) {
                    <div class="pl-10 space-y-0.5">
                      @for (subItem of item.children; track subItem.label) {
                        <a
                          routerLink="/{{ subItem.route }}"
                          routerLinkActive="text-primary-600 bg-primary-50 font-medium"
                          class="block px-3 py-2.5 rounded-lg text-xs text-gray-600 hover:text-primary-600 hover:bg-black/5 transition-colors"
                        >
                          {{ subItem.label }}
                        </a>
                      }
                    </div>
                  }
                </div>
              }
            </li>
          }
        </ul>
      </nav>

      <!-- User Profile -->
      <div class="p-4 bg-white">
        <div class="flex items-center gap-3 mb-3">
          <div
            class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold border-2 border-white shadow-sm"
          >
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-gray-900 truncate">{{ userName }}</div>
            <div class="text-xs text-gray-500 truncate">{{ userEmail }}</div>
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
export class AdminSidebarComponent {
  userName: string = 'Admin';
  userEmail: string = '';
  userInitial: string = 'A';

  menuItems: any[] = [];

  private authService = inject(AuthService);

  constructor() {
    this.initMenu();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.displayName || 'Admin';
        this.userEmail = user.email || '';
        this.userInitial = this.userName.charAt(0).toUpperCase();
      }
    });
  }

  toggleMenu(item: any) {
    item.expanded = !item.expanded;
  }

  initMenu() {
    this.menuItems = [
      {
        label: 'Dashboard',
        icon: 'bi-speedometer2',
        route: 'dashboard',
        children: null,
      },
      { divider: true, label: 'PLATFORM' },
      {
        label: 'Platform',
        icon: 'bi-grid-fill',
        expanded: false,
        children: [
          { label: 'Platform Overview',      route: 'dashboard' },
          { label: 'Platform Health',        route: 'platform/health' },
          { label: 'Platform Observability', route: 'observability' },
          { label: 'Firestore Cost Monitor', route: 'cost-monitor' },
        ],
      },
      { divider: true, label: 'BUSINESS' },
      {
        label: 'Shops',
        icon: 'bi-shop-window',
        expanded: false,
        children: [
          { label: 'All Shops',            route: 'shops' },
          { label: 'Store Requests',       route: 'shops/requests' },
          { label: 'Custom Plan Requests', route: 'shops/custom-plan-requests' },
          { label: 'Shop Reviews',         route: 'shops/reviews' },
          { label: 'Suspended Shops',      route: 'shops/suspended' },
        ],
      },
      {
        label: 'Users',
        icon: 'bi-people-fill',
        expanded: false,
        children: [
          { label: 'All Users',      route: 'users' },
          { label: 'Admins',         route: 'users/admins' },
          { label: 'Staff',          route: 'users/staffs' },
          { label: 'Customers',      route: 'users/customers' },
          { label: 'Activity Logs',  route: 'users/activity-logs' },
        ],
      },
      { divider: true, label: 'COMMERCE' },
      {
        label: 'Subscriptions',
        icon: 'bi-credit-card-2-front-fill',
        expanded: false,
        children: [
          { label: 'Plans',          route: 'plans' },
          { label: 'Features',       route: 'features' },
          { label: 'Billing Config', route: 'billing' },
          { label: 'Credit Packs',   route: 'billing/credit-packs' },
          { label: 'Transactions',   route: 'transactions' },
        ],
      },
      {
        label: 'Notifications',
        icon: 'bi-bell-fill',
        route: 'admin/notifications',
        children: null,
      },
      {
        label: 'Announcements',
        icon: 'bi-megaphone-fill',
        expanded: false,
        children: [
          { label: 'Announcement Center', route: 'announcements' },
        ]
      },
      { divider: true, label: 'REPORTS' },
      {
        label: 'Analytics',
        icon: 'bi-bar-chart-line-fill',
        expanded: false,
        children: [
          { label: 'Revenue',         route: 'reports/revenue' },
          { label: 'Shops',           route: 'reports/shops' },
          { label: 'Staff',           route: 'reports/staff' },
          { label: 'Usage',           route: 'reports/usage' },
          { label: 'Cost Analytics',  route: 'reports/costs' },
        ],
      },
      {
        label: 'Downloads',
        icon: 'bi-cloud-arrow-down-fill',
        expanded: false,
        children: [
          { label: 'Export Center', route: 'downloads/export-center' },
          { label: 'Export History', route: 'downloads/history' },
        ],
      },
      { divider: true, label: 'DATA & SYSTEM' },
      {
        label: 'Data Management',
        icon: 'bi-folder-symlink-fill',
        expanded: false,
        children: [
          { label: 'Export Center', route: 'data-management/export' },
          { label: 'Import Center', route: 'data-management/import' },
        ]
      },
      {
        label: 'Database',
        icon: 'bi-database-fill',
        expanded: false,
        children: [
          { label: 'Overview',         route: 'database/overview' },
          { label: 'Firestore',        route: 'database/firestore' },
          { label: 'Supabase',         route: 'database/supabase' },
          { label: 'MongoDB',          route: 'database/mongodb' },
          { label: 'SQL Server',       route: 'database/sqlserver' },
          { label: 'Active Provider',  route: 'database/active' },
          { label: 'Migration',        route: 'database/migration' },
          { label: 'Health',           route: 'database/health' },
          { label: 'Logs',             route: 'database/logs' },
          { label: 'Backup',           route: 'database/backup' },
          { label: 'Cache',            route: 'database/cache' },
          { label: 'Advanced',         route: 'database/advanced' },
        ],
      },
      {
        label: 'Roles & Permissions',
        icon: 'bi-shield-lock-fill',
        route: 'roles',
        children: null,
      },
      {
        label: 'Themes',
        icon: 'bi-palette2',
        route: 'themes',
        children: null,
      },
      {
        label: 'Leads',
        icon: 'bi-funnel-fill',
        route: 'leads',
        children: null,
      },
      {
        label: 'System',
        icon: 'bi-cpu-fill',
        route: 'system',
        children: null,
      },
      {
        label: 'Settings',
        icon: 'bi-gear-wide-connected',
        expanded: false,
        children: [
          { label: 'General', route: 'settings/general' },
          { label: 'Payment Gateways', route: 'settings/payment' },
          { label: 'GST & Tax', route: 'settings/gst' },
          { label: 'API & Integrations', route: 'settings/api' },
          { label: 'Infrastructure Pricing', route: 'settings/cost-pricing' },
          { label: 'Maintenance Mode', route: 'settings/maintenance' }
        ],
      }
    ];
  }

  async handleLogout() {
    await this.authService.logout();
  }
}
