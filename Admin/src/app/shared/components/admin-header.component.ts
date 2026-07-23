import { Component, HostListener, ElementRef, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminNotificationService, AdminNotification, CATEGORY_META } from '../../core/services/admin-notification.service';
import { UiInputComponent } from './ui-input.component';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white px-8 py-4 flex items-center justify-between relative">
      <div>
        <h2 class="text-2xl font-bold text-[var(--text-primary)]">{{ pageTitle }}</h2>
        <p class="text-sm text-[var(--text-secondary)] mt-1">
          {{ pageSubtitle }}
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative" id="search-container">
          <!-- Search Icon -->
          <span class="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          <!-- UiInput styled search — no autofocus -->
          <input
            type="text"
            [value]="searchQuery"
            (input)="onSearch($event)"
            (focus)="onSearchFocus()"
            placeholder="Search shops, users, plans..."
            autocomplete="off"
            class="flex h-[44px] w-80 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-transparent pl-9 pr-4 py-2 text-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 transition-colors"
          />

          <!-- Search Results Dropdown -->
          <div *ngIf="showSearchResults" class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            <div class="max-h-[400px] overflow-y-auto">
              @if (searchResults.length === 0) {
                <div class="p-8 text-center text-gray-400">
                  <i class="bi bi-search text-xl mb-2 block"></i>
                  <p class="text-xs">No results found for "{{searchQuery}}"</p>
                </div>
              } @else {
                @for (res of searchResults; track $index) {
                  <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 group" (click)="showSearchResults = false; searchQuery = ''">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-blue-50 text-blue-600">
                      <i class="bi bi-shop"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate" [innerHTML]="highlightMatch(res.title, searchQuery)"></div>
                      <div class="text-xs text-gray-500 flex items-center gap-2">
                        <span class="capitalize">{{ res.type }}</span>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
            <div class="p-2 bg-gray-50 text-[10px] text-center text-gray-400 font-medium">
              Press Esc to close
            </div>
          </div>
        </div>

        <!-- Notifications Bell -->
        <div class="relative" id="notifications-container">
          <button
            (click)="toggleNotifications($event)"
            class="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <svg
              class="w-6 h-6 text-gray-600 group-hover:text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <!-- Unread Badge -->
            <span
              *ngIf="unreadCount > 0"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <!-- Notifications Dropdown -->
          <div
            *ngIf="showNotifications"
            class="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            style="animation: slideDown 0.15s ease-out;"
          >
            <!-- Header -->
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-900 text-sm">Admin Notifications</h3>
                <span *ngIf="unreadCount > 0" class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{{ unreadCount }} UNREAD</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  *ngIf="unreadCount > 0"
                  (click)="onMarkAllRead()"
                  [disabled]="loadingAction"
                  class="text-[10px] text-primary-600 hover:text-primary-800 font-semibold px-2 py-1 rounded hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  Mark all read
                </button>
                <button
                  *ngIf="notifications.length > 0"
                  (click)="onDeleteAll()"
                  [disabled]="loadingAction"
                  class="text-[10px] text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Delete all
                </button>
              </div>
            </div>

            <!-- Notification List -->
            <div class="max-h-[400px] overflow-y-auto">
              <div *ngIf="loadingNotifs" class="p-8 text-center text-gray-400">
                <div class="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-xs">Loading...</p>
              </div>

              <div *ngIf="!loadingNotifs && notifications.length === 0" class="p-8 text-center text-gray-400">
                <i class="bi bi-bell-slash text-2xl mb-2 block"></i>
                <p class="text-xs font-medium">No notifications</p>
                <p class="text-[10px] text-gray-300 mt-1">You're all caught up!</p>
              </div>

              @for (notif of notifications; track notif.id) {
                <div
                  class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group"
                  [class.bg-blue-50]="notif.status === 'unread'"
                  (click)="onNotificationClick(notif)"
                >
                  <!-- Icon -->
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                    [style.background]="getCategoryBg(notif.category)"
                    [style.border]="'1px solid ' + getCategoryBorder(notif.category)"
                  >
                    {{ notif.icon }}
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-xs font-semibold text-gray-900 leading-tight" [class.font-bold]="notif.status === 'unread'">{{ notif.title }}</p>
                      <span class="text-[9px] text-gray-400 whitespace-nowrap flex-shrink-0">{{ notifService.formatTime(notif.createdAt) }}</span>
                    </div>
                    <p class="text-[11px] text-gray-500 mt-0.5 leading-snug">{{ notif.message }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[9px] font-medium px-1.5 py-0.5 rounded"
                        [style.color]="getCategoryColor(notif.category)"
                        [style.background]="getCategoryBg(notif.category)"
                      >{{ getCategoryLabel(notif.category) }}</span>
                      <span *ngIf="notif.status === 'unread'" class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Footer -->
            <a
              routerLink="/admin/notifications"
              (click)="showNotifications = false"
              class="block w-full py-3 text-xs font-bold text-primary-600 hover:bg-primary-50 transition-colors text-center border-t border-gray-100"
            >
              View All Notifications →
            </a>
          </div>
        </div>

        <!-- Profile -->
        <div class="relative" id="profile-dropdown-container">
          <div
            (click)="toggleDropdown($event)"
            class="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">
                {{ userName }}
              </div>
              <div class="text-xs text-gray-500">Super Admin</div>
            </div>
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shadow-sm"
            >
              {{ initials }}
            </div>
            <svg
              class="w-4 h-4 text-gray-400 transition-transform"
              [class.rotate-180]="showDropdown"
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
          </div>

          <!-- Dropdown Menu -->
          <div
            *ngIf="showDropdown"
            class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <a
              routerLink="/dashboard"
              (click)="showDropdown = false"
              class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              My Profile
            </a>
            <div class="h-px bg-gray-100 my-1"></div>
            <button
              (click)="logout()"
              class="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private eRef = inject(ElementRef);
  protected notifService = inject(AdminNotificationService);

  private subs = new Subscription();

  showDropdown = false;
  showNotifications = false;
  showSearchResults = false;
  loadingNotifs = false;
  loadingAction = false;

  searchQuery = '';
  searchResults: any[] = [];
  unreadCount = 0;
  notifications: AdminNotification[] = [];

  userName = 'Admin';
  initials = 'A';
  pageTitle = 'Admin Dashboard';
  pageSubtitle = "Welcome back! Here's what's happening today.";

  private pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Admin Dashboard', subtitle: "Welcome back! Here's what's happening today." },
    observability: { title: 'Platform Observability', subtitle: 'Real-time observability and health monitoring dashboard.' },
    shops: { title: 'Shops Management', subtitle: 'Manage all registered shops on the platform.' },
    users: { title: 'Users Management', subtitle: 'Manage admin users and merchant accounts.' },
    plans: { title: 'Subscription Plans', subtitle: 'Configure subscription plans and pricing.' },
    features: { title: 'Feature Management', subtitle: 'Manage platform features and categories.' },
    roles: { title: 'Roles & Permissions', subtitle: 'Configure RBAC roles and permissions.' },
    billing: { title: 'Billing', subtitle: 'Track billing logs and payment history.' },
    transactions: { title: 'Transactions', subtitle: 'Monitor all platform transactions.' },
    themes: { title: 'Theme Controller', subtitle: 'Manage shop and admin theme settings.' },
    settings: { title: 'System Settings', subtitle: 'Configure global platform settings.' },
    reports: { title: 'Platform Reports', subtitle: 'View analytics and growth reports.' },
    notifications: { title: 'Admin Notifications', subtitle: 'View and manage all platform notifications.' },
  };

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.displayName || 'Admin';
        this.initials = this.userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
      }
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });

    this.updatePageTitle(this.router.url);

    // Subscribe to unread count
    this.subs.add(
      this.notifService.unreadCount$.subscribe(count => this.unreadCount = count)
    );

    // Initial load of unread count
    this.loadUnreadCount();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private loadUnreadCount() {
    this.notifService.getNotifications({ limit: 1 }).subscribe({
      next: (res: any) => {
        if (res?.data?.unreadCount !== undefined) {
          this.unreadCount = res.data.unreadCount;
        }
      },
      error: () => {} // silently fail
    });
  }

  private loadNotifications() {
    this.loadingNotifs = true;
    this.notifService.getNotifications({ limit: 15 }).subscribe({
      next: (res: any) => {
        this.notifications = res?.data?.notifications || [];
        this.unreadCount = res?.data?.unreadCount ?? this.unreadCount;
        this.loadingNotifs = false;
      },
      error: () => { this.loadingNotifs = false; }
    });
  }

  private updatePageTitle(url: string) {
    const segment = url.split('?')[0].replace(/^\//, '').split('/')[0] || 'dashboard';
    const page = this.pageTitles[segment] || { title: 'Clothify Admin', subtitle: 'Admin control panel.' };
    this.pageTitle = page.title;
    this.pageSubtitle = page.subtitle;
  }

  onSearch(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    if (query.length > 1) {
      this.searchResults = [
        { type: 'shop', title: 'Example Shop A' },
        { type: 'user', title: 'Admin User' }
      ];
      this.showSearchResults = true;
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  onSearchFocus() {
    if (this.searchQuery.length > 1) {
      this.showSearchResults = true;
    }
  }

  highlightMatch(text: string, query: string): string {
    if (!query || !text) return text;
    const re = new RegExp(`(${query})`, 'gi');
    return text.replace(re, '<b class="text-primary-600">$1</b>');
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showDropdown = false;
    this.showSearchResults = false;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  onNotificationClick(notif: AdminNotification) {
    if (notif.status === 'unread') {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.status = 'read';
        }
      });
    }
    if (notif.actionLink) {
      this.showNotifications = false;
      this.router.navigateByUrl(notif.actionLink);
    }
  }

  onMarkAllRead() {
    this.loadingAction = true;
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.status = 'read');
        this.unreadCount = 0;
        this.loadingAction = false;
      },
      error: () => { this.loadingAction = false; }
    });
  }

  onDeleteAll() {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    this.loadingAction = true;
    this.notifService.deleteAll().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadCount = 0;
        this.loadingAction = false;
      },
      error: () => { this.loadingAction = false; }
    });
  }

  // Category display helpers
  getCategoryBg(cat: string): string {
    return (CATEGORY_META as any)[cat]?.bg || '#f9fafb';
  }
  getCategoryBorder(cat: string): string {
    return (CATEGORY_META as any)[cat]?.border || '#e5e7eb';
  }
  getCategoryColor(cat: string): string {
    return (CATEGORY_META as any)[cat]?.color || '#6b7280';
  }
  getCategoryLabel(cat: string): string {
    return (CATEGORY_META as any)[cat]?.label || cat;
  }
  formatTime(date: any): string {
    return this.notifService.formatTime(date);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    this.showNotifications = false;
    this.showSearchResults = false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
      this.showNotifications = false;
      this.showSearchResults = false;
    }
  }

  async logout() {
    this.showDropdown = false;
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
