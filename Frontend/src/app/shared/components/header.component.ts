import { Component, HostListener, ElementRef, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { SearchService } from '../../core/services/search.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationCategory } from '../../core/models/notification.model';
import { map, of, switchMap, debounceTime, distinctUntilChanged, Subject, tap, filter, take } from 'rxjs';
import { BranchService, Branch } from '../../core/services/branch.service';
import { BranchContextService } from '../../core/services/branch-context.service';
import { StaffService } from '../../core/services/staff.service';
import { ToastService } from '../../core/services/toast.service';
import { RequestCache } from '../../core/utils/request-cache.util';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UiDropdownComponent, DropdownOption } from './ui-dropdown.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { ConfirmationService } from './confirmation-modal.component';
import { ReadOnlyService } from '../../core/services/read-only.service';
import { DashboardService } from '../../features/dashboard/dashboard.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, UiDropdownComponent],
  template: `
    <header class="bg-white  px-8 py-4 flex items-center justify-between relative ">
      <div>
        <h2 class="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
        <p class="text-sm text-[var(--text-primary)] mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative" id="search-container">
          <input
            type="search"
            [value]="searchQuery"
            (input)="onSearch($event)"
            placeholder="Search products, invoices, customers..."
            class="pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80 transition-all"
          />
          <svg
            class="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <!-- Search Results Dropdown -->
          <div
            *ngIf="showSearchResults && searchResults.length > 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div class="max-h-[400px] overflow-y-auto">
              @for (res of searchResults; track $index) {
                <div
                  (click)="handleSearchResult(res)"
                  class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 group"
                >
                  <div
                    [class]="
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm ' +
                      getResultIconBg(res.type)
                    "
                  >
                    <i [class]="getResultIcon(res.type)"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div
                      class="text-sm font-semibold text-gray-900 truncate"
                      [innerHTML]="highlightMatch(getResultTitle(res), searchQuery)"
                    ></div>
                    <div class="text-xs text-gray-500 flex items-center gap-2">
                      <span class="capitalize">{{ res.type }}</span>
                      <span>•</span>
                      <span class="truncate">{{ getResultSubtitle(res) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="p-2 bg-gray-50 text-[10px] text-center text-gray-400 font-medium">
              Press Esc to close
            </div>
          </div>
        </div>

        <!-- Branch Switcher -->
        <div class="flex flex-col" *ngIf="showBranchSwitcher$ | async" id="branch-switcher-container">
          <div class="w-56 flex items-center gap-1">
            <app-ui-dropdown
              [options]="branchOptions"
              [value]="activeBranchId"
              [class]="'w-full'"
              placeholder="Select Branch"
              (onSelect)="onBranchSelectById($event)"
            ></app-ui-dropdown>
            <span
              *ngIf="activeBranchStatus === 'Inactive'"
              class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap"
            >Inactive</span>
          </div>
        </div>

        <!-- Read-Only Mode Badge -->
        <div *ngIf="isReadOnly" class="flex items-center">
          <span class="flex items-center gap-1.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-rose-200 shadow-sm whitespace-nowrap">
            <i class="bi bi-lock-fill text-[9px]"></i>
            Read Only Mode
          </span>
        </div>

        <!-- Notifications -->
        <div class="relative" id="notifications-container">
          <button
            (click)="toggleNotifications($event)"
            class="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <svg
              class="w-6 h-6 text-primary-600 group-hover:text-primary-600"
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
            <span
              *ngIf="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold px-0.5"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <!-- Notifications Dropdown -->
          <div
            *ngIf="showNotifications"
            class="absolute right-0 mt-2 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            style="animation: slideDownFade 0.2s ease-out;"
          >
            <!-- Header -->
            <div class="px-4 pt-4 pb-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-gray-900 text-sm">🔔 Notifications</h3>
                  <span *ngIf="unreadCount > 0"
                    class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black"
                  >{{ unreadCount }} NEW</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    *ngIf="unreadCount > 0"
                    (click)="markAllAsRead(); $event.stopPropagation()"
                    title="Mark all as read"
                    class="text-[10px] text-primary-600 hover:text-primary-800 font-semibold px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                  >✓ All Read</button>
                  <button
                    *ngIf="notifications.length > 0"
                    (click)="deleteAllNotifications($event)"
                    title="Delete all notifications"
                    class="text-[10px] text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                  ><i class="bi bi-trash3"></i> Delete All</button>
                </div>
              </div>
              <!-- Smart Filters -->
              <div class="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                @for (filter of notificationFilters; track filter.key) {
                  <button
                    (click)="setNotificationFilter(filter.key); $event.stopPropagation()"
                    [class]="activeFilter === filter.key
                      ? 'flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-bold bg-primary-600 text-white transition-colors'
                      : 'flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'"
                  >{{ filter.label }}</button>
                }
              </div>
            </div>

            <!-- Notification List -->
            <div class="max-h-[420px] overflow-y-auto" style="scrollbar-width:thin">
              @if (filteredNotifications.length === 0) {
                <div class="p-10 text-center">
                  <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="bi bi-bell-slash text-2xl text-gray-400"></i>
                  </div>
                  <p class="text-sm font-semibold text-gray-500">No notifications</p>
                  <p class="text-xs text-gray-400 mt-1">You're all caught up!</p>
                </div>
              } @else {
                <!-- 🔴 Critical Section (always on top if any) -->
                @if (criticalNotifications.length > 0 && (activeFilter === 'all' || activeFilter === 'critical')) {
                  <div class="px-4 pt-3 pb-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-black text-red-600 uppercase tracking-wider">🔴 Critical — Immediate Action</span>
                      <div class="flex-1 h-px bg-red-100"></div>
                    </div>
                    @for (n of criticalNotifications; track n.id) {
                      <div
                        class="mb-2 p-3 rounded-xl border cursor-pointer transition-all group"
                        [class]="n.status === 'unread' ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-gray-100 hover:bg-gray-50'"
                        (click)="handleNotificationClick(n)"
                      >
                        <div class="flex gap-3">
                          <div [class]="'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' + getNotificationIconBg(n.type)">
                            <i [class]="getNotificationIcon(n.type) + ' text-xs'"></i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2">
                              <div>
                                <p class="text-xs font-bold text-gray-900">{{ n.title }}</p>
                                <p class="text-[11px] text-gray-600 mt-0.5 line-clamp-1">{{ n.message }}</p>
                              </div>
                              <div class="flex items-center gap-1 shrink-0">
                                <span *ngIf="n.status === 'unread'" class="w-2 h-2 bg-red-500 rounded-full"></span>
                                <button
                                  (click)="deleteNotification(n, $event)"
                                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition-all"
                                  title="Delete"
                                ><i class="bi bi-x text-sm"></i></button>
                              </div>
                            </div>
                            <div class="flex items-center justify-between mt-2">
                              <span class="text-[10px] text-gray-400">{{ getRelativeTime(n.createdAt) }}</span>
                              <button
                                *ngIf="n.actionLabel"
                                (click)="handleNotificationAction(n, $event)"
                                class="text-[10px] font-bold px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >{{ n.actionLabel }}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Today's Notifications -->
                @if (todayNonCritical.length > 0) {
                  <div class="px-4 pt-2 pb-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-black text-gray-500 uppercase tracking-wider">Today</span>
                      <div class="flex-1 h-px bg-gray-100"></div>
                    </div>
                    @for (n of todayNonCritical; track n.id) {
                      <ng-container *ngTemplateOutlet="notifItem; context: { n: n }"></ng-container>
                    }
                  </div>
                }

                <!-- Yesterday's Notifications -->
                @if (yesterdayNotifications.length > 0) {
                  <div class="px-4 pt-2 pb-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-black text-gray-500 uppercase tracking-wider">Yesterday</span>
                      <div class="flex-1 h-px bg-gray-100"></div>
                    </div>
                    @for (n of yesterdayNotifications; track n.id) {
                      <ng-container *ngTemplateOutlet="notifItem; context: { n: n }"></ng-container>
                    }
                  </div>
                }

                <!-- Older Notifications -->
                @if (olderNotifications.length > 0) {
                  <div class="px-4 pt-2 pb-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-black text-gray-500 uppercase tracking-wider">Earlier</span>
                      <div class="flex-1 h-px bg-gray-100"></div>
                    </div>
                    @for (n of olderNotifications; track n.id) {
                      <ng-container *ngTemplateOutlet="notifItem; context: { n: n }"></ng-container>
                    }
                  </div>
                }
              }
            </div>

            <!-- Notification Item Template -->
            <ng-template #notifItem let-n="n">
              <div
                class="mb-1.5 p-3 rounded-xl border cursor-pointer transition-all group"
                [class]="n.status === 'unread' ? 'bg-blue-50/60 border-blue-100 hover:bg-blue-50' : 'bg-white border-gray-100 hover:bg-gray-50'"
                (click)="handleNotificationClick(n)"
              >
                <div class="flex gap-3">
                  <div [class]="'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' + getNotificationIconBg(n.type)">
                    <i [class]="getNotificationIcon(n.type) + ' text-xs'"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-1">
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-gray-900 truncate">{{ n.title }}</p>
                        <p class="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{{ n.message }}</p>
                      </div>
                      <div class="flex items-center gap-1 shrink-0">
                        <span *ngIf="n.status === 'unread'" class="w-2 h-2 bg-primary-500 rounded-full"></span>
                        <button
                          (click)="deleteNotification(n, $event)"
                          class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-gray-300 hover:text-red-500 transition-all"
                          title="Delete"
                        ><i class="bi bi-x text-sm"></i></button>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-1.5">
                      <span class="text-[10px] text-gray-400">{{ getRelativeTime(n.createdAt) }}</span>
                      <button
                        *ngIf="n.actionLabel"
                        (click)="handleNotificationAction(n, $event)"
                        class="text-[10px] font-bold px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                      >{{ n.actionLabel }}</button>
                    </div>
                  </div>
                </div>
              </div>
            </ng-template>
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
              <div class="text-xs text-primary">
                {{ userRole | titlecase }}
              </div>
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
            class="absolute overflow-hidden right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
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

    <!-- Branch OTP Modal -->
    <div *ngIf="showOtpModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-100 bg-gray-50">
          <h2 class="text-xl font-bold text-gray-900">Security Verification</h2>
          <p class="text-sm text-gray-500 mt-1">First time accessing this branch from this device</p>
        </div>
        <div class="p-6">
          <div class="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 flex items-start gap-3">
            <i class="bi bi-shield-lock-fill text-blue-600 text-xl"></i>
            <div>
              <p class="font-bold mb-1">OTP Sent</p>
              <p>We've sent a One-Time Password to your organization's registered email address.</p>
            </div>
          </div>
          
          <label class="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
          <input 
            type="text" 
            [formControl]="otpControl"
            placeholder="e.g. 123456" 
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center tracking-[0.5em] text-lg font-bold"
            [class.border-red-500]="otpError"
          >
          <p *ngIf="otpError" class="text-red-500 text-xs mt-2 font-medium">{{ otpError }}</p>
        </div>
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            (click)="cancelBranchSwitch()"
            class="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="verifyBranchOtp()"
            [disabled]="otpControl.invalid || verifyingOtp"
            class="px-8 py-2.5 bg-primary-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <span *ngIf="verifyingOtp" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Verify
          </button>
        </div>
      </div>
    </div>

    <!-- Branch Switching Overlay -->
    <div *ngIf="isSwitchingBranch" class="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300">
      <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Switching Branch...</h2>
      <p class="text-gray-500 font-medium animate-pulse">Setting up {{ switchingBranchName }} workspace</p>
      
      <div class="mt-8 flex items-center gap-4 text-xs text-gray-400 font-semibold tracking-wider">
        <span class="flex items-center gap-1"><i class="bi bi-check2-circle text-green-500"></i> Dashboard</span>
        <span class="flex items-center gap-1"><i class="bi bi-check2-circle text-green-500"></i> Inventory</span>
        <span class="flex items-center gap-1"><i class="bi bi-check2-circle text-green-500"></i> POS</span>
      </div>
    </div>
  `,
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private shopService = inject(ShopService);
  private searchService = inject(SearchService);
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private eRef = inject(ElementRef);
  private branchService = inject(BranchService);
  private branchContext = inject(BranchContextService);
  private destroyRef = inject(DestroyRef);
  private featureGuard = inject(FeatureGuardService);
  private confirmationService = inject(ConfirmationService);
  private readOnlyService = inject(ReadOnlyService);
  private dashboardService = inject(DashboardService);

  showDropdown = false;
  showNotifications = false;
  showSearchResults = false;

  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  notifications: Notification[] = [];
  unreadCount = 0;

  // Notification filtering
  activeFilter: string = 'all';
  notificationFilters = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: '🔴 Critical' },
    { key: 'sales', label: '🛒 Sales' },
    { key: 'inventory', label: '📦 Inventory' },
    { key: 'finance', label: '💰 Finance' },
    { key: 'customer', label: '👥 Customer' },
    { key: 'staff', label: '👔 Staff' },
    { key: 'website', label: '🌐 Website' },
    { key: 'subscription', label: '🟣 Subscription' },
    { key: 'security', label: '🔐 Security' },
    { key: 'unread', label: 'Unread' },
  ];

  // Category map: type -> category
  private readonly typeCategoryMap: Record<string, string> = {
    stock_out: 'critical', low_stock: 'critical', payment_gateway_failed: 'critical',
    daily_closing_pending: 'critical', backup_failed: 'critical', subscription_expiring_today: 'critical',
    shop_suspended_warning: 'critical', gst_config_missing: 'critical',
    invoice_sequence_error: 'critical', branch_sync_failed: 'critical',
    new_pos_sale: 'sales', new_order: 'sales', cod_order: 'sales', order_cancelled: 'sales',
    order_returned: 'sales', draft_bill_pending: 'sales', large_order: 'sales', daily_target_achieved: 'sales',
    new_stock_added: 'inventory', purchase_received: 'inventory', stock_transfer_completed: 'inventory',
    opening_stock_pending: 'inventory', inventory_mismatch: 'inventory', barcode_duplicate: 'inventory',
    payment_received: 'finance', refund_issued: 'finance', supplier_payment_due: 'finance',
    gst_return_due: 'finance', expense_added: 'finance', bank_reconciliation_pending: 'finance',
    cash_closing_difference: 'finance', invoice: 'finance', credit_note: 'finance', credit: 'finance',
    new_customer: 'customer', customer_birthday: 'customer', vip_customer_visited: 'customer',
    review: 'customer', negative_review: 'customer', credit_limit_crossed: 'customer', loyalty_redeemed: 'customer',
    staff_login: 'staff', staff_checkout: 'staff', staff_late: 'staff', high_performer: 'staff',
    commission_generated: 'staff', staff_leave_request: 'staff', permission_request: 'staff',
    website_down: 'website', domain_expiring: 'website', theme_published: 'website',
    contact_form_submitted: 'website', product_out_of_stock_website: 'website',
    purchase_order_approved: 'purchases', goods_received: 'purchases',
    supplier_invoice_pending: 'purchases', purchase_return_completed: 'purchases',
    sales_target_achieved: 'analytics', best_selling_product: 'analytics', slow_moving_product: 'analytics',
    revenue_record: 'analytics', customer_growth: 'analytics', top_branch: 'analytics',
    trial_ending: 'subscription', subscription_renewed: 'subscription', subscription: 'subscription',
    plan_upgrade_available: 'subscription', storage_limit: 'subscription',
    staff_limit_reached: 'subscription', product_limit_reached: 'subscription',
    new_login_device: 'security', password_changed: 'security', permission_updated: 'security',
    multiple_failed_logins: 'security', api_key_regenerated: 'security',
    sms_campaign_completed: 'promotion', whatsapp_campaign_delivered: 'promotion',
    email_campaign_failed: 'promotion', festival_offer_started: 'promotion', coupon_expired: 'promotion',
  };

  get filteredNotifications(): Notification[] {
    if (this.activeFilter === 'all') return this.notifications;
    if (this.activeFilter === 'unread') return this.notifications.filter(n => n.status === 'unread');
    return this.notifications.filter(n => {
      const cat = n.category || this.typeCategoryMap[n.type] || 'info';
      return cat === this.activeFilter;
    });
  }

  get criticalNotifications(): Notification[] {
    return this.filteredNotifications.filter(n => {
      const cat = n.category || this.typeCategoryMap[n.type];
      return cat === 'critical' || n.priority === 'critical';
    });
  }

  private isToday(date: any): boolean {
    const d = this.toDate(date);
    if (!d) return false;
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  private isYesterday(date: any): boolean {
    const d = this.toDate(date);
    if (!d) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  }

  private toDate(date: any): Date | null {
    if (!date) return null;
    if (date && typeof date === 'object' && 'seconds' in date) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }

  get todayNonCritical(): Notification[] {
    return this.filteredNotifications.filter(n => {
      const cat = n.category || this.typeCategoryMap[n.type];
      return cat !== 'critical' && n.priority !== 'critical' && this.isToday(n.createdAt);
    });
  }

  get yesterdayNotifications(): Notification[] {
    return this.filteredNotifications.filter(n => {
      const cat = n.category || this.typeCategoryMap[n.type];
      return cat !== 'critical' && n.priority !== 'critical' && this.isYesterday(n.createdAt);
    });
  }

  get olderNotifications(): Notification[] {
    return this.filteredNotifications.filter(n => {
      const cat = n.category || this.typeCategoryMap[n.type];
      return cat !== 'critical' && n.priority !== 'critical' && !this.isToday(n.createdAt) && !this.isYesterday(n.createdAt);
    });
  }

  branches: Branch[] = [];
  branchOptions: DropdownOption[] = [];
  activeBranchId: string | null = null;
  activeBranchName = 'Loading...';
  activeBranchStatus = 'Active';
  
  showBranchSwitcher$ = of(false);
  
  showOtpModal = false;
  pendingBranchSwitch: Branch | null = null;
  otpControl = new FormControl('', [Validators.required, Validators.minLength(4)]);
  
  verifyingOtp = false;
  otpError = '';
  isSwitchingBranch = false;
  switchingBranchName = '';

  userName = 'User';
  userRole = 'shop_owner';
  initials = 'U';
  isReadOnly = false;

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((query) => {
        this.performSearch(query);
      });

    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user) {
        this.userName = user.displayName || 'User';
        this.userRole = user.role || 'shop_owner';
        this.initials = (user.displayName || 'U').charAt(0).toUpperCase();

        if (user.shopId) {
          this.loadNotifications(user.shopId);
          // Only fetch branches if they have the multi-branch feature enabled
          const shop = this.authService.getShopSync(user.shopId);
          if (this.featureGuard.hasFeatureSync(shop, 'ent_multi_branch')) {
            this.loadBranches(user.shopId);
          }
        }
      }
    });

    this.branchContext.activeBranchInfo$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((info) => {
      this.activeBranchId = info.id;
      this.activeBranchName = info.name || 'Parent Branch';
      this.activeBranchStatus = info.status || 'Active';
    });

    this.showBranchSwitcher$ = this.authService.currentUser$.pipe(
      map((user) => user?.role === 'shop_owner' || user?.role === 'admin')
    );

    // Subscribe to read-only state for badge display
    this.readOnlyService.isReadOnly$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((isReadOnly) => {
      this.isReadOnly = isReadOnly;
    });
  }

  loadNotifications(shopId: string) {
    this.notificationService.getNotifications(shopId).subscribe({
      next: (res) => {
        this.notifications = res.data || [];
        const firstWithCount = this.notifications.find(n => (n as any).unreadCount !== undefined);
        this.unreadCount = firstWithCount ? (firstWithCount as any).unreadCount : this.notifications.filter(n => n.status === 'unread').length;
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });
  }

  setNotificationFilter(key: string) {
    this.activeFilter = key;
  }

  deleteNotification(n: Notification, event: Event) {
    event.stopPropagation();
    const shopId = this.authService.getCurrentUser()?.shopId;
    // Optimistic remove
    this.notifications = this.notifications.filter(x => x.id !== n.id);
    this.unreadCount = this.notifications.filter(x => x.status === 'unread').length;
    this.notificationService.deleteNotification(n.id).subscribe({
      error: () => {
        if (shopId) this.loadNotifications(shopId);
      }
    });
  }

  deleteAllNotifications(event: Event) {
    event.stopPropagation();
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;
    this.notifications = [];
    this.unreadCount = 0;
    this.notificationService.deleteAllNotifications(shopId).subscribe({
      error: () => this.loadNotifications(shopId)
    });
  }

  getRelativeTime(date: any): string {
    const d = this.toDate(date);
    if (!d) return '';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  loadBranches(shopId: string) {
    this.branchService.getBranches(shopId).subscribe({
      next: (res) => {
        this.branches = res.data || [];
        this.buildBranchOptions();
      },
      error: (err) => console.error('Failed to load branches:', err)
    });
  }

  buildBranchOptions() {
    const options: DropdownOption[] = [
      { label: 'Parent Branch (All)', value: 'parent' }
    ];
    this.branches.forEach((b) => {
      options.push({
        label: b.name,
        value: b.id
      });
    });
    this.branchOptions = options;
  }

  onBranchSelectById(value: any) {
    if (value === 'parent') {
      const parentBranch: Branch = {
        id: 'parent',
        name: 'Parent Branch',
        shopId: this.authService.getCurrentUser()?.shopId || '',
        status: 'Active',
        manager: '',
        address: '',
        contactInfo: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        allowedModules: []
      };
      this.onBranchSelect(parentBranch);
    } else {
      const selected = this.branches.find(b => b.id === value);
      if (selected) {
        this.onBranchSelect(selected);
      }
    }
  }

  onSearch(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    if (query.length > 1) {
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  performSearch(query: string) {
    const user = this.authService.getCurrentUser();
    if (!user?.shopId) return;

    this.searchService.search(user.shopId, query).subscribe({
      next: (res) => {
        this.searchResults = res.data;
        this.showSearchResults = true;
      },
    });
  }

  highlightMatch(text: string, query: string): string {
    if (!query || !text) return text;
    const re = new RegExp(`(${query})`, 'gi');
    return text.replace(re, '<b class="text-primary-600">$1</b>');
  }

  getResultTitle(res: any): string {
    if (res.type === 'product') return res.name;
    if (res.type === 'invoice') return res.invoiceNumber;
    if (res.type === 'customer') return res.name;
    return 'Unknown';
  }


getResultSubtitle(res: any): string {
    if (res.type === 'product') return `${res.category} • ₹${res.variants[0]?.price || 0}`;
    if (res.type === 'invoice') return `${res.customerName} • ₹${res.total}`;
    if (res.type === 'customer') return res.phoneNumber;
    return '';
  }

  getResultIcon(type: string): string {
    switch (type) {
      case 'product':
        return 'bi bi-box-seam';
      case 'invoice':
        return 'bi bi-receipt';
      case 'customer':
        return 'bi bi-person';
      default:
        return 'bi bi-search';
    }
  }

  getResultIconBg(type: string): string {
    switch (type) {
      case 'product':
        return 'bg-blue-50 text-blue-600';
      case 'invoice':
        return 'bg-purple-50 text-purple-600';
      case 'customer':
        return 'bg-orange-50 text-orange-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  }

  handleSearchResult(res: any) {
    this.showSearchResults = false;
    this.searchQuery = '';
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;

    switch (res.type) {
      case 'product':
        this.router.navigate([`/${shopId}/inventory`]);
        break;
      case 'invoice':
        this.router.navigate([`/${shopId}/invoices/shop`]);
        break;
      case 'customer':
        this.router.navigate([`/${shopId}/customers`]);
        break;
    }
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showDropdown = false;
    this.showSearchResults = false;
  }

    // Removed auto-mark-all-read on open.
    // Users often want to keep notifications unread until they actually deal with them.
    // Plus, it reduces the "slow" feeling of firing N requests immediately.

  clearAllNotifications(event: Event) {
    event.stopPropagation();
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;

    // Optimistic UI update
    this.notifications.forEach(n => n.status = 'read');
    this.unreadCount = 0;

    // Call backend
    this.notificationService.markAllAsRead(shopId).subscribe({
      next: () => {
        // Reload to confirm from server
        this.loadNotifications(shopId);
      },
      error: (err) => console.error('Clear all notifications failed:', err)
    });
  }

  handleNotificationAction(n: Notification, event: Event) {
    event.stopPropagation();
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;
    this.showNotifications = false;
    if (n.actionRoute) {
      this.router.navigateByUrl(n.actionRoute);
    } else {
      this.handleNotificationClick(n);
    }
  }

  handleNotificationClick(notification: Notification) {
    // 1. Mark as read immediately in UI
    if (notification.status === 'unread') {
      notification.status = 'read';
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // 2. Navigate based on type
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;

    this.showNotifications = false;

    switch (notification.type) {
      // Critical
      case 'stock_out':
      case 'low_stock':              this.router.navigate([`/${shopId}/inventory/low-stock`]); break;
      case 'payment_gateway_failed': this.router.navigate([`/${shopId}/settings/payment-methods`]); break;
      case 'daily_closing_pending':  this.router.navigate([`/${shopId}/sales/daily-closing`]); break;
      case 'backup_failed':          this.router.navigate([`/${shopId}/settings/backup`]); break;
      case 'subscription_expiring_today':
      case 'trial_ending':
      case 'subscription_renewed':
      case 'plan_upgrade_available':
      case 'storage_limit':
      case 'staff_limit_reached':
      case 'product_limit_reached':
      case 'subscription':           this.router.navigate([`/${shopId}/subscription`]); break;
      case 'shop_suspended_warning': this.router.navigate([`/${shopId}/subscription`]); break;
      case 'gst_config_missing':     this.router.navigate([`/${shopId}/settings/tax`]); break;
      case 'invoice_sequence_error': this.router.navigate([`/${shopId}/settings/invoice-template`]); break;
      case 'branch_sync_failed':     this.router.navigate([`/${shopId}/branches`]); break;
      // Sales
      case 'new_pos_sale':           this.router.navigate([`/${shopId}/orders`]); break;
      case 'new_order':              this.router.navigate([`/${shopId}/invoices/website`], { queryParams: { invoiceId: notification.referenceId } }); break;
      case 'cod_order':              this.router.navigate([`/${shopId}/orders`]); break;
      case 'order_cancelled':        this.router.navigate([`/${shopId}/orders`]); break;
      case 'order_returned':         this.router.navigate([`/${shopId}/sales/returns`]); break;
      case 'draft_bill_pending':     this.router.navigate([`/${shopId}/sales/drafts`]); break;
      case 'large_order':            this.router.navigate([`/${shopId}/orders`]); break;
      case 'daily_target_achieved':  this.router.navigate([`/${shopId}/reports/sales`]); break;
      // Inventory
      case 'new_stock_added':        this.router.navigate([`/${shopId}/inventory`]); break;
      case 'purchase_received':      this.router.navigate([`/${shopId}/purchases/received`]); break;
      case 'stock_transfer_completed': this.router.navigate([`/${shopId}/inventory/transfer`]); break;
      case 'opening_stock_pending':  this.router.navigate([`/${shopId}/inventory/opening-stock`]); break;
      case 'inventory_mismatch':     this.router.navigate([`/${shopId}/inventory`]); break;
      case 'barcode_duplicate':      this.router.navigate([`/${shopId}/products`]); break;
      // Finance
      case 'payment_received':       this.router.navigate([`/${shopId}/payments`]); break;
      case 'refund_issued':          this.router.navigate([`/${shopId}/transactions/refunds`]); break;
      case 'supplier_payment_due':   this.router.navigate([`/${shopId}/purchases/payments`]); break;
      case 'gst_return_due':         this.router.navigate([`/${shopId}/accounting/gst-report`]); break;
      case 'expense_added':          this.router.navigate([`/${shopId}/expenses/add`]); break;
      case 'bank_reconciliation_pending': this.router.navigate([`/${shopId}/accounting/bankbook`]); break;
      case 'cash_closing_difference':    this.router.navigate([`/${shopId}/accounting/cashbook`]); break;
      case 'invoice':                this.router.navigate([`/${shopId}/invoices/shop`]); break;
      case 'credit_note':            this.router.navigate([`/${shopId}/credit-notes`]); break;
      case 'credit':                 this.router.navigate([`/${shopId}/customers`]); break;
      // Customer
      case 'new_customer':           this.router.navigate([`/${shopId}/customers`]); break;
      case 'customer_birthday':      this.router.navigate([`/${shopId}/crm/birthdays`]); break;
      case 'vip_customer_visited':   this.router.navigate([`/${shopId}/crm/vip`]); break;
      case 'review':                 this.router.navigate([`/${shopId}/reviews`]); break;
      case 'negative_review':        this.router.navigate([`/${shopId}/reviews`]); break;
      case 'credit_limit_crossed':   this.router.navigate([`/${shopId}/customers/credits`]); break;
      case 'loyalty_redeemed':       this.router.navigate([`/${shopId}/promotions/loyalty`]); break;
      // Staff
      case 'staff_login':
      case 'staff_checkout':
      case 'staff_late':
      case 'high_performer':
      case 'commission_generated':
      case 'staff_leave_request':
      case 'permission_request':     this.router.navigate([`/${shopId}/staff`]); break;
      // Website
      case 'website_down':
      case 'theme_published':
      case 'domain_expiring':
      case 'contact_form_submitted':
      case 'product_out_of_stock_website': this.router.navigate([`/${shopId}/website/settings`]); break;
      // Purchases
      case 'purchase_order_approved':
      case 'goods_received':
      case 'supplier_invoice_pending':
      case 'purchase_return_completed': this.router.navigate([`/${shopId}/purchases/orders`]); break;
      // Analytics
      case 'sales_target_achieved':
      case 'best_selling_product':
      case 'slow_moving_product':
      case 'revenue_record':
      case 'customer_growth':
      case 'top_branch':             this.router.navigate([`/${shopId}/analytics/sales`]); break;
      // Security
      case 'new_login_device':
      case 'password_changed':
      case 'permission_updated':
      case 'multiple_failed_logins':
      case 'api_key_regenerated':    this.router.navigate([`/${shopId}/security`]); break;
      // Promotion
      case 'sms_campaign_completed': this.router.navigate([`/${shopId}/promotions/sms`]); break;
      case 'whatsapp_campaign_delivered': this.router.navigate([`/${shopId}/promotions/whatsapp`]); break;
      case 'email_campaign_failed':  this.router.navigate([`/${shopId}/promotions`]); break;
      case 'festival_offer_started': this.router.navigate([`/${shopId}/promotions/festival`]); break;
      case 'coupon_expired':         this.router.navigate([`/${shopId}/offers`]); break;
      default:
        if (notification.link) { this.router.navigateByUrl(notification.link); }
        break;
    }
  }

  getNotificationDate(date: any): Date | string | null {
    if (!date) return null;

    try {
      // Handle Firestore Timestamp
      if (date && typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000);
      }

      // Handle already valid Date object
      if (date instanceof Date) {
        return date;
      }

      // Handle string or number
      if (typeof date === 'string' || typeof date === 'number') {
        const d = new Date(date);
        // Check if valid date
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    } catch (e) {
      console.warn('Invalid date in notification:', date);
    }

    return null; // Return null if invalid, DatePipe handles null gracefully
  }

  markAllAsRead() {
    // Optimistic update: Mark all locally first to avoid UI lag
    const unreadNotifications = this.notifications.filter((n) => n.status === 'unread');

    unreadNotifications.forEach((n) => {
      n.status = 'read';
    });
    this.unreadCount = 0;

    // Fire API calls in background (fire and forget for now, as we don't have a batch endpoint)
    // In a real production app, we should add a batch endpoint to the backend.
    unreadNotifications.forEach((n) => {
      this.notificationService.markAsRead(n.id).subscribe();
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      // Critical
      case 'stock_out':                return 'bi bi-x-circle-fill';
      case 'low_stock':                return 'bi bi-exclamation-triangle-fill';
      case 'payment_gateway_failed':   return 'bi bi-credit-card-fill';
      case 'daily_closing_pending':    return 'bi bi-clock-history';
      case 'backup_failed':            return 'bi bi-cloud-slash-fill';
      case 'subscription_expiring_today': return 'bi bi-calendar-x-fill';
      case 'shop_suspended_warning':   return 'bi bi-shield-x';
      case 'gst_config_missing':       return 'bi bi-file-earmark-x-fill';
      case 'invoice_sequence_error':   return 'bi bi-receipt';
      case 'branch_sync_failed':       return 'bi bi-diagram-3';
      // Sales
      case 'new_pos_sale':             return 'bi bi-printer-fill';
      case 'new_order':                return 'bi bi-cart-plus-fill';
      case 'cod_order':                return 'bi bi-cash-coin';
      case 'order_cancelled':          return 'bi bi-x-circle';
      case 'order_returned':           return 'bi bi-arrow-return-left';
      case 'draft_bill_pending':       return 'bi bi-file-earmark-text';
      case 'large_order':              return 'bi bi-bag-check-fill';
      case 'daily_target_achieved':    return 'bi bi-trophy-fill';
      // Inventory
      case 'new_stock_added':          return 'bi bi-plus-circle-fill';
      case 'purchase_received':        return 'bi bi-box-seam-fill';
      case 'stock_transfer_completed': return 'bi bi-arrow-left-right';
      case 'opening_stock_pending':    return 'bi bi-clipboard-check';
      case 'inventory_mismatch':       return 'bi bi-exclamation-diamond-fill';
      case 'barcode_duplicate':        return 'bi bi-upc-scan';
      // Finance
      case 'payment_received':         return 'bi bi-wallet2';
      case 'refund_issued':            return 'bi bi-arrow-counterclockwise';
      case 'supplier_payment_due':     return 'bi bi-calendar-check';
      case 'gst_return_due':           return 'bi bi-file-earmark-ruled-fill';
      case 'expense_added':            return 'bi bi-cash-stack';
      case 'bank_reconciliation_pending': return 'bi bi-bank2';
      case 'cash_closing_difference':  return 'bi bi-currency-rupee';
      case 'invoice':                  return 'bi bi-receipt';
      case 'credit_note':              return 'bi bi-arrow-counterclockwise';
      case 'credit':                   return 'bi bi-wallet2';
      // Customer
      case 'new_customer':             return 'bi bi-person-plus-fill';
      case 'customer_birthday':        return 'bi bi-balloon-fill';
      case 'vip_customer_visited':     return 'bi bi-star-fill';
      case 'review':                   return 'bi bi-star-half';
      case 'negative_review':          return 'bi bi-hand-thumbs-down-fill';
      case 'credit_limit_crossed':     return 'bi bi-exclamation-circle-fill';
      case 'loyalty_redeemed':         return 'bi bi-award-fill';
      // Staff
      case 'staff_login':              return 'bi bi-person-check-fill';
      case 'staff_checkout':           return 'bi bi-box-arrow-right';
      case 'staff_late':               return 'bi bi-alarm-fill';
      case 'high_performer':           return 'bi bi-lightning-fill';
      case 'commission_generated':     return 'bi bi-percent';
      case 'staff_leave_request':      return 'bi bi-calendar-event';
      case 'permission_request':       return 'bi bi-shield-lock-fill';
      // Website
      case 'website_down':             return 'bi bi-wifi-off';
      case 'domain_expiring':          return 'bi bi-globe2';
      case 'theme_published':          return 'bi bi-palette-fill';
      case 'contact_form_submitted':   return 'bi bi-envelope-fill';
      case 'product_out_of_stock_website': return 'bi bi-bag-x-fill';
      // Purchases
      case 'purchase_order_approved':  return 'bi bi-check-circle-fill';
      case 'goods_received':           return 'bi bi-truck';
      case 'supplier_invoice_pending': return 'bi bi-receipt-cutoff';
      case 'purchase_return_completed': return 'bi bi-arrow-return-left';
      // Analytics
      case 'sales_target_achieved':    return 'bi bi-graph-up-arrow';
      case 'best_selling_product':     return 'bi bi-fire';
      case 'slow_moving_product':      return 'bi bi-graph-down-arrow';
      case 'revenue_record':           return 'bi bi-bar-chart-fill';
      case 'customer_growth':          return 'bi bi-people-fill';
      case 'top_branch':               return 'bi bi-geo-alt-fill';
      // Subscription
      case 'trial_ending':             return 'bi bi-hourglass-split';
      case 'subscription_renewed':     return 'bi bi-arrow-repeat';
      case 'subscription':             return 'bi bi-credit-card-fill';
      case 'plan_upgrade_available':   return 'bi bi-rocket-takeoff-fill';
      case 'storage_limit':            return 'bi bi-hdd-fill';
      case 'staff_limit_reached':      return 'bi bi-person-x-fill';
      case 'product_limit_reached':    return 'bi bi-box-seam';
      // Security
      case 'new_login_device':         return 'bi bi-phone-fill';
      case 'password_changed':         return 'bi bi-key-fill';
      case 'permission_updated':       return 'bi bi-shield-check';
      case 'multiple_failed_logins':   return 'bi bi-lock-fill';
      case 'api_key_regenerated':      return 'bi bi-code-slash';
      // Promotion
      case 'sms_campaign_completed':   return 'bi bi-chat-dots-fill';
      case 'whatsapp_campaign_delivered': return 'bi bi-whatsapp';
      case 'email_campaign_failed':    return 'bi bi-envelope-x-fill';
      case 'festival_offer_started':   return 'bi bi-gift-fill';
      case 'coupon_expired':           return 'bi bi-tag-fill';
      default:                         return 'bi bi-bell-fill';
    }
  }

  getNotificationIconBg(type: string): string {
    const cat = this.typeCategoryMap?.[type] || 'info';
    switch (cat) {
      case 'critical':     return 'bg-red-100 text-red-600';
      case 'sales':        return 'bg-orange-100 text-orange-600';
      case 'inventory':    return 'bg-teal-100 text-teal-600';
      case 'finance':      return 'bg-indigo-100 text-indigo-600';
      case 'customer':     return 'bg-purple-100 text-purple-600';
      case 'staff':        return 'bg-amber-100 text-amber-600';
      case 'website':      return 'bg-blue-100 text-blue-600';
      case 'purchases':    return 'bg-cyan-100 text-cyan-600';
      case 'analytics':    return 'bg-emerald-100 text-emerald-600';
      case 'subscription': return 'bg-violet-100 text-violet-600';
      case 'security':     return 'bg-rose-100 text-rose-600';
      case 'promotion':    return 'bg-pink-100 text-pink-600';
      default:             return 'bg-gray-100 text-gray-600';
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    this.showNotifications = false;
    this.showSearchResults = false;
  }

  async onBranchSelect(branch: Branch) {
    if (branch.id === this.activeBranchId) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Switch Branch',
      description: `Are you sure you want to switch to <strong>${branch.name}</strong>?<br><br>Your dashboard, inventory, orders, customers, reports, and POS will now operate under this branch.`,
      type: 'warning',
      primaryButtonText: 'Switch Branch',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      if (branch.id === 'parent' || this.branchContext.isBranchTrusted(branch.id)) {
         this.switchBranchWithOverlay(branch);
      } else {
         this.initiateBranchOtp(branch);
      }
    }
  }

  initiateBranchOtp(branch: Branch) {
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;

    this.pendingBranchSwitch = branch;
    this.otpControl.reset();
    this.otpError = '';
    
    this.branchContext.sendSwitchOtp(shopId, branch.id).subscribe({
      next: () => {
        this.showOtpModal = true;
      },
      error: (err) => {
        this.toastService.showError('Failed to send OTP: ' + (err?.error?.message || err.message));
      }
    });
  }

  verifyBranchOtp() {
    if (!this.pendingBranchSwitch) return;
    
    const shopId = this.authService.getCurrentUser()?.shopId;
    if (!shopId) return;

    this.verifyingOtp = true;
    this.otpError = '';
    const branch = this.pendingBranchSwitch;
    
    this.branchContext.verifySwitchOtp(shopId, branch.id, String(this.otpControl.value)).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.showOtpModal = false;
        this.switchBranchWithOverlay(branch);
      },
      error: (err) => {
        this.verifyingOtp = false;
        this.otpError = err?.error?.message || 'Invalid OTP';
      }
    });
  }

  cancelBranchSwitch() {
    this.showOtpModal = false;
    this.pendingBranchSwitch = null;
  }

  switchBranchWithOverlay(branch: Branch) {
    this.isSwitchingBranch = true;
    this.switchingBranchName = branch.name;
    
    // Clear branch-specific caches from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
       const key = localStorage.key(i);
       if (key && (key.startsWith('offline_products_') || 
                   key.startsWith('offline_categories_') || 
                   key === 'shop_cart' ||
                   key.includes('filter') || 
                   key.includes('search') ||
                   key.includes('cache'))) {
         keysToRemove.push(key);
       }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // session storage
    sessionStorage.clear();

    // Clear all in-memory RequestCache instances
    RequestCache.clearAll();
    // Clear BranchService and DashboardService caches
    this.branchService.clearCache();
    this.dashboardService.clearCache();
    
    if (branch.id === 'parent') {
      this.branchContext.setActiveBranchWithInfo(null, 'Parent Branch', 'parent');
    } else {
      this.branchContext.setActiveBranchWithInfo(branch.id, branch.name, 'child');
    }
    this.pendingBranchSwitch = null;
    
    setTimeout(() => {
      this.isSwitchingBranch = false;
      this.toastService.showSuccess(`Switched to ${branch.name} successfully.`);
      const shopId = this.authService.getCurrentUser()?.shopId;
      if (shopId) {
        window.location.href = `/${shopId}/dashboard`;
      } else {
        window.location.reload();
      }
    }, 2000);
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
