import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  AdminNotificationService,
  AdminNotification,
  AdminNotificationCategory,
  CATEGORY_META,
} from '../../core/services/admin-notification.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Admin Notifications</h2>
            <p class="text-xs text-gray-500 mt-1">Platform-wide alerts and system events.</p>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="w-full md:w-[70%] flex flex-col min-w-0 bg-gray-50 transition-all duration-300 border-r border-gray-200 overflow-hidden">
          
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <!-- Loading -->
            <div *ngIf="loading" class="flex items-center justify-center py-20">
              <div class="text-center text-gray-400">
                <div class="w-8 h-8 border-2 border-[var(--color-primary-400)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-sm font-medium">Loading notifications...</p>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && filteredNotifications.length === 0" class="flex flex-col items-center justify-center py-24 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <i class="bi bi-bell-slash text-2xl text-gray-300"></i>
              </div>
              <h3 class="text-sm font-bold text-gray-900 mb-1">No notifications</h3>
              <p class="text-xs text-gray-400">{{ activeFilter === 'all' ? "You're all caught up!" : 'No notifications in this category.' }}</p>
            </div>

            <!-- Notification Cards -->
            <div *ngIf="!loading && filteredNotifications.length > 0" class="space-y-3">
              @for (notif of filteredNotifications; track notif.id) {
                <div
                  class="group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm"
                  [class.border-gray-200]="notif.status === 'read'"
                  [class.bg-white]="notif.status === 'read'"
                  [style.borderColor]="notif.status === 'unread' ? getCategoryBorder(notif.category) : ''"
                  [style.backgroundColor]="notif.status === 'unread' ? getCategoryBg(notif.category) : ''"
                  (click)="onClickNotif(notif)"
                >
                  <!-- Icon -->
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm bg-white"
                    [style.border]="'1.5px solid ' + getCategoryBorder(notif.category)"
                  >
                    {{ notif.icon }}
                  </div>

                  <!-- Body -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span
                            class="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border"
                            [style.color]="getCategoryColor(notif.category)"
                            [style.background]="getCategoryBg(notif.category)"
                            [style.borderColor]="getCategoryBorder(notif.category)"
                          >{{ getCategoryLabel(notif.category) }}</span>
                          <span
                            class="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border"
                            [class.bg-red-50]="notif.priority === 'critical'"
                            [class.text-red-700]="notif.priority === 'critical'"
                            [class.border-red-100]="notif.priority === 'critical'"
                            [class.bg-orange-50]="notif.priority === 'high'"
                            [class.text-orange-700]="notif.priority === 'high'"
                            [class.border-orange-100]="notif.priority === 'high'"
                            [class.bg-gray-50]="notif.priority === 'medium' || notif.priority === 'low'"
                            [class.text-gray-600]="notif.priority === 'medium' || notif.priority === 'low'"
                            [class.border-gray-200]="notif.priority === 'medium' || notif.priority === 'low'"
                          >{{ notif.priority }}</span>
                          <span *ngIf="notif.status === 'unread'" class="w-2 h-2 bg-[var(--color-primary-500)] rounded-full flex-shrink-0"></span>
                        </div>
                        <h3 class="text-sm font-semibold text-gray-900" [class.font-bold]="notif.status === 'unread'">{{ notif.title }}</h3>
                        <p class="text-xs text-gray-500 mt-1 leading-relaxed">{{ notif.message }}</p>
                      </div>
                      <div class="flex flex-col items-end gap-2 flex-shrink-0">
                        <span class="text-[10px] font-bold text-gray-400 tracking-wider">{{ notifService.formatTime(notif.createdAt) }}</span>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            *ngIf="notif.status === 'unread'"
                            (click)="onMarkRead($event, notif)"
                            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <i class="bi bi-check2-all text-sm"></i>
                          </button>
                          <button
                            (click)="onDeleteOne($event, notif)"
                            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <i class="bi bi-trash text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Action Link -->
                    <div *ngIf="notif.actionLink" class="mt-3">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-700)] bg-[var(--color-primary-50)] border border-[var(--color-primary-100)] rounded-lg hover:bg-[var(--color-primary-100)] transition-colors">
                        {{ notif.actionLink }}
                        <i class="bi bi-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Filters & Actions) -->
        <div class="w-full md:w-[30%] flex flex-col bg-white overflow-hidden transition-all duration-300 transform translate-x-0">
          <div class="p-6 border-b border-gray-100 shrink-0 bg-white z-10">
            <h3 class="text-lg font-bold text-gray-900">Filters & Actions</h3>
            <p class="text-xs font-normal text-gray-500 tracking-wider mt-1">Manage notifications.</p>
          </div>
          
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <!-- Actions -->
            <div class="space-y-3">
              <button
                *ngIf="unreadCount > 0"
                (click)="onMarkAllRead()"
                [disabled]="loadingAction"
                class="w-full px-4 py-3 text-sm font-bold text-[var(--color-primary-700)] bg-white border border-[var(--color-primary-200)] rounded-xl hover:bg-[var(--color-primary-50)] transition-colors shadow-sm disabled:opacity-50 text-left flex items-center gap-3"
              >
                <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center">
                  <i class="bi bi-check2-all text-lg"></i>
                </div>
                Mark All as Read ({{ unreadCount }})
              </button>
              <button
                *ngIf="notifications.length > 0"
                (click)="onDeleteAll()"
                [disabled]="loadingAction"
                class="w-full px-4 py-3 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50 text-left flex items-center gap-3"
              >
                <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <i class="bi bi-trash text-lg"></i>
                </div>
                Clear All Notifications
              </button>
            </div>

            <!-- Categories -->
            <div>
              <h4 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Categories</h4>
              <div class="space-y-2">
                <button
                  (click)="setFilter('all')"
                  [class.border-[var(--color-primary-500)]]="activeFilter === 'all'"
                  [class.bg-[var(--color-primary-50)]]="activeFilter === 'all'"
                  [class.border-gray-200]="activeFilter !== 'all'"
                  class="w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-50 bg-white shadow-sm"
                >
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-primary-600)] bg-white border border-gray-100">
                    <i class="bi bi-collection"></i>
                  </div>
                  <span class="text-sm font-bold flex-1 text-left" [class.text-[var(--color-primary-700)]]="activeFilter === 'all'" [class.text-gray-700]="activeFilter !== 'all'">All Notifications</span>
                  <span class="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">{{ totalCount }}</span>
                </button>

                @for (cat of categoryList; track cat.key) {
                  <button
                    (click)="setFilter(cat.key)"
                    [style.borderColor]="activeFilter === cat.key ? cat.color : ''"
                    [style.backgroundColor]="activeFilter === cat.key ? cat.bg : ''"
                    [class.border-gray-200]="activeFilter !== cat.key"
                    class="w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-50 bg-white shadow-sm"
                  >
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-100 bg-white text-lg"
                         [style.color]="cat.color">
                      {{ cat.icon }}
                    </div>
                    <span class="text-sm font-bold flex-1 text-left text-gray-700" [style.color]="activeFilter === cat.key ? cat.color : ''">{{ cat.label }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminNotificationsComponent implements OnInit {
  protected notifService = inject(AdminNotificationService);
  private router = inject(Router);

  notifications: AdminNotification[] = [];
  filteredNotifications: AdminNotification[] = [];
  activeFilter: string = 'all';
  loading = false;
  loadingAction = false;
  unreadCount = 0;
  totalCount = 0;

  categoryList = Object.entries(CATEGORY_META).map(([key, val]) => ({
    key: key as AdminNotificationCategory,
    ...val,
  }));

  ngOnInit() {
    this.loadAll();
    this.notifService.unreadCount$.subscribe(c => (this.unreadCount = c));
  }

  loadAll() {
    this.loading = true;
    this.notifService.getNotifications({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.notifications = res?.data?.notifications || [];
        this.unreadCount = res?.data?.unreadCount ?? 0;
        this.totalCount = this.notifications.length;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredNotifications = [...this.notifications];
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.category === this.activeFilter);
    }
  }

  onClickNotif(notif: AdminNotification) {
    if (notif.status === 'unread') {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => { notif.status = 'read'; }
      });
    }
    if (notif.actionLink) {
      this.router.navigateByUrl(notif.actionLink);
    }
  }

  onMarkRead(event: Event, notif: AdminNotification) {
    event.stopPropagation();
    if (notif.status === 'unread') {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => { notif.status = 'read'; }
      });
    }
  }

  onDeleteOne(event: Event, notif: AdminNotification) {
    event.stopPropagation();
    this.notifService.deleteOne(notif.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notif.id);
        if (notif.status === 'unread') this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.totalCount = this.notifications.length;
        this.applyFilter();
      }
    });
  }

  onMarkAllRead() {
    this.loadingAction = true;
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => (n.status = 'read'));
        this.unreadCount = 0;
        this.loadingAction = false;
      },
      error: () => { this.loadingAction = false; },
    });
  }

  onDeleteAll() {
    if (!confirm('Delete ALL notifications permanently? This cannot be undone.')) return;
    this.loadingAction = true;
    this.notifService.deleteAll().subscribe({
      next: () => {
        this.notifications = [];
        this.filteredNotifications = [];
        this.totalCount = 0;
        this.unreadCount = 0;
        this.loadingAction = false;
      },
      error: () => { this.loadingAction = false; },
    });
  }

  // Category helpers
  getCategoryBg(cat: string) { return (CATEGORY_META as any)[cat]?.bg || '#f9fafb'; }
  getCategoryBorder(cat: string) { return (CATEGORY_META as any)[cat]?.border || '#e5e7eb'; }
  getCategoryColor(cat: string) { return (CATEGORY_META as any)[cat]?.color || '#6b7280'; }
  getCategoryLabel(cat: string) { return (CATEGORY_META as any)[cat]?.label || cat; }
}
