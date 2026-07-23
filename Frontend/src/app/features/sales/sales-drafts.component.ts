import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { Customer, CustomerService } from '../../core/services/customer.service';
import { Invoice, InvoiceItem } from '../../core/models/invoice.model';
import { InvoiceService } from '../../core/services/invoice.service';
import { PermissionService } from '../../core/services/permission.service';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { Shop } from '../../core/models/shop.model';
import { ShopService } from '../../core/services/shop.service';
import { Staff, StaffService } from '../../core/services/staff.service';
import { ShopContextService } from '../../core/services/shop-context.service';

type DraftSortKey =
  | 'recent'
  | 'oldest'
  | 'amount-high'
  | 'amount-low'
  | 'customer'
  | 'invoice';

type FlashTone = 'success' | 'error' | 'info';

type ConfirmAction =
  | { type: 'delete-single'; draftId: string }
  | { type: 'delete-bulk'; draftIds: string[] }
  | { type: 'status-single'; draftId: string; status: Invoice['status'] }
  | { type: 'status-bulk'; draftIds: string[]; status: Invoice['status'] };

interface TimelineEntry {
  id: string;
  title: string;
  detail: string;
  timestamp: Date | null;
  tone: 'neutral' | 'success' | 'warning';
}

interface DraftInvoiceView extends Omit<Invoice, 'invoiceDate' | 'dueDate' | 'createdAt' | 'updatedAt'> {
  customer?: Customer;
  staff?: Staff;
  invoiceDate: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  dueDate: Date | null;
  lastTouchedAt: Date | null;
  itemCount: number;
  quantityTotal: number;
  dueAmount: number;
  customerSource: string;
  itemsPreview: string;
  paymentLabel: string;
  activityTimeline: TimelineEntry[];
  ageInDays: number;
  gstSummary: string;
  cgst: number;
  sgst: number;
  igst: number;
  isInterstate: boolean;
}

@Component({
  selector: 'app-sales-drafts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (!canViewInvoices) {
      <div class="min-h-[calc(100vh-64px)] bg-[#f5f7fa] p-6 xl:p-8">
        <section class="mx-auto max-w-3xl rounded-[2rem] border border-amber-100 bg-amber-50 p-8 text-amber-900 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                <i class="bi bi-shield-lock"></i>
                Permission Required
              </div>
              <h1 class="mt-4 text-2xl font-bold tracking-tight text-gray-900">Sales drafts are locked for this account</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-amber-900/80">
                This workspace reads and updates invoice drafts, so it needs the
                <span class="font-semibold">invoices.view</span> permission before it can load live shop data.
              </p>
            </div>
            <button
              type="button"
              (click)="goToDashboard()"
              class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              <i class="bi bi-arrow-left"></i>
              Back to dashboard
            </button>
          </div>
        </section>
      </div>
    } @else {
      <div class="h-[calc(100vh-64px)] bg-[#f5f7fa] flex flex-col overflow-hidden">
        <header class="border-b border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-3xl">
              <div class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-700">
                <i class="bi bi-journal-text"></i>
                Sales Workspace
              </div>
              <div class="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 class="text-3xl font-bold tracking-tight text-gray-900">Draft Bills</h1>
                  <p class="mt-2 text-sm leading-6 text-gray-500">
                    Review saved POS bills before they turn into live invoices. Search by customer,
                    staff member, item mix, totals, tax profile, or last activity.
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                  <span class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {{ filteredDrafts.length }} visible drafts
                  </span>
                  <span class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                    <i class="bi bi-clock-history"></i>
                    Updated {{ latestUpdateLabel }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                (click)="loadDrafts()"
                class="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <i class="bi bi-arrow-repeat"></i>
                Refresh
              </button>
              <button
                type="button"
                (click)="toggleAdvancedFilters()"
                class="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition"
                [class.border-primary-200]="showAdvancedFilters"
                [class.bg-primary-50]="showAdvancedFilters"
                [class.text-primary-700]="showAdvancedFilters"
                [class.border-gray-200]="!showAdvancedFilters"
                [class.bg-white]="!showAdvancedFilters"
                [class.text-gray-700]="!showAdvancedFilters"
              >
                <i class="bi bi-funnel"></i>
                Filters
              </button>
              <button
                type="button"
                (click)="openInvoiceCreation()"
                class="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                <i class="bi bi-plus-lg"></i>
                New invoice
              </button>
            </div>
          </div>
        </header>

        @if (flashMessage) {
          <div class="px-6 pt-4">
            <div
              class="flex items-start justify-between gap-4 rounded-[1.5rem] border px-4 py-3 text-sm shadow-sm"
              [class.border-emerald-200]="flashTone === 'success'"
              [class.bg-emerald-50]="flashTone === 'success'"
              [class.text-emerald-800]="flashTone === 'success'"
              [class.border-rose-200]="flashTone === 'error'"
              [class.bg-rose-50]="flashTone === 'error'"
              [class.text-rose-800]="flashTone === 'error'"
              [class.border-sky-200]="flashTone === 'info'"
              [class.bg-sky-50]="flashTone === 'info'"
              [class.text-sky-800]="flashTone === 'info'"
            >
              <div class="flex items-start gap-3">
                <i
                  class="mt-0.5 bi"
                  [class.bi-check-circle-fill]="flashTone === 'success'"
                  [class.bi-exclamation-octagon-fill]="flashTone === 'error'"
                  [class.bi-info-circle-fill]="flashTone === 'info'"
                ></i>
                <p class="font-medium">{{ flashMessage }}</p>
              </div>
              <button
                type="button"
                (click)="clearFlash()"
                class="rounded-full p-1 text-current transition hover:bg-white/60"
                aria-label="Dismiss message"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        }

        <section class="px-6 pt-4">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            @for (card of summaryCards; track card.label) {
              <article class="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div class="flex items-center justify-between">
                  <div [class]="card.iconClass">
                    <i [class]="'bi ' + card.icon"></i>
                  </div>
                  <span class="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {{ card.badge }}
                  </span>
                </div>
                <p class="mt-4 text-sm font-medium text-gray-500">{{ card.label }}</p>
                <p class="mt-2 text-2xl font-bold tracking-tight text-gray-900">{{ card.value }}</p>
                <p class="mt-2 text-xs font-medium text-gray-400">{{ card.hint }}</p>
              </article>
            }
          </div>
        </section>

        <section class="px-6 pt-4">
          <div class="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div class="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,0.9fr))_auto]">
              <label class="relative block">
                <span class="sr-only">Search drafts</span>
                <i class="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  #searchInput
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onFiltersChanged()"
                  placeholder="Search draft no., customer, phone, product, staff, or note"
                  class="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                />
              </label>

              <label class="block">
                <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Sort</span>
                <select
                  [(ngModel)]="sortKey"
                  (ngModelChange)="onFiltersChanged()"
                  class="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                >
                  @for (option of sortOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <label class="block">
                <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Status</span>
                <select
                  [(ngModel)]="statusFilter"
                  (ngModelChange)="onFiltersChanged()"
                  class="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                >
                  <option value="all">All drafts</option>
                  @for (option of statusOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <label class="block">
                <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Payment</span>
                <select
                  [(ngModel)]="paymentStatusFilter"
                  (ngModelChange)="onFiltersChanged()"
                  class="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                >
                  <option value="all">All states</option>
                  @for (option of paymentStatusOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <button
                type="button"
                (click)="clearFilters()"
                [disabled]="!hasActiveFilters"
                class="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i class="bi bi-x-circle"></i>
                Clear
              </button>
            </div>

            @if (showAdvancedFilters) {
              <div class="mt-4 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-2 xl:grid-cols-5">
                <label class="block">
                  <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Method</span>
                  <select
                    [(ngModel)]="paymentMethodFilter"
                    (ngModelChange)="onFiltersChanged()"
                    class="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  >
                    <option value="all">All methods</option>
                    @for (option of paymentMethodOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </label>

                <label class="block">
                  <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Staff</span>
                  <select
                    [(ngModel)]="staffFilter"
                    (ngModelChange)="onFiltersChanged()"
                    class="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  >
                    <option value="all">Everyone</option>
                    @for (staff of staffFilterOptions; track staff.value) {
                      <option [value]="staff.value">{{ staff.label }}</option>
                    }
                  </select>
                </label>

                <label class="block">
                  <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Customer Source</span>
                  <select
                    [(ngModel)]="sourceFilter"
                    (ngModelChange)="onFiltersChanged()"
                    class="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  >
                    <option value="all">All sources</option>
                    @for (option of sourceOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </label>

                <label class="block">
                  <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Tax Profile</span>
                  <select
                    [(ngModel)]="taxFilter"
                    (ngModelChange)="onFiltersChanged()"
                    class="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  >
                    <option value="all">All tax types</option>
                    <option value="taxed">With tax</option>
                    <option value="untaxed">Without tax</option>
                    <option value="interstate">Interstate GST</option>
                  </select>
                </label>

                <label class="block">
                  <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Rows</span>
                  <select
                    [(ngModel)]="pageSize"
                    (ngModelChange)="onPageSizeChanged()"
                    class="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  >
                    <option [ngValue]="10">10 rows</option>
                    <option [ngValue]="20">20 rows</option>
                    <option [ngValue]="30">30 rows</option>
                    <option [ngValue]="50">50 rows</option>
                  </select>
                </label>
              </div>
            }
          </div>
        </section>

        @if (selectedIds.size > 0) {
          <section class="px-6 pt-4">
            <div class="flex flex-col gap-3 rounded-[1.5rem] border border-primary-100 bg-primary-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-sm">
                  <i class="bi bi-check2-square"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-primary-900">{{ selectedIds.size }} draft{{ selectedIds.size === 1 ? '' : 's' }} selected</p>
                  <p class="text-xs text-primary-700">Run bulk status changes, or remove stale drafts after a quick review.</p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  (click)="promptBulkStatusChange('sent')"
                  [disabled]="!canEditInvoices"
                  class="inline-flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i class="bi bi-send"></i>
                  Mark sent
                </button>
                <button
                  type="button"
                  (click)="promptBulkStatusChange('paid')"
                  [disabled]="!canEditInvoices"
                  class="inline-flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i class="bi bi-check-circle"></i>
                  Mark paid
                </button>
                <button
                  type="button"
                  (click)="promptBulkDelete()"
                  [disabled]="!canDeleteInvoices"
                  class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i class="bi bi-trash"></i>
                  Delete
                </button>
                <button
                  type="button"
                  (click)="clearSelection()"
                  class="inline-flex items-center gap-2 rounded-2xl border border-primary-200 bg-transparent px-3.5 py-2 text-sm font-semibold text-primary-700 transition hover:bg-white"
                >
                  <i class="bi bi-x-circle"></i>
                  Clear
                </button>
              </div>
            </div>
          </section>
        }

        <div class="min-h-0 flex-1 px-6 py-4">
          <div class="flex h-full min-h-0 gap-4">
            <section class="min-w-0 flex-1 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
              @if (loading) {
                <div class="h-full overflow-auto p-6">
                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    @for (_ of skeletonCards; track $index) {
                      <div class="animate-pulse rounded-[1.5rem] border border-gray-100 bg-[#f8fafc] p-5">
                        <div class="h-4 w-24 rounded-full bg-gray-200"></div>
                        <div class="mt-4 h-8 w-28 rounded-full bg-gray-200"></div>
                        <div class="mt-5 h-3 w-full rounded-full bg-gray-200"></div>
                        <div class="mt-2 h-3 w-2/3 rounded-full bg-gray-200"></div>
                      </div>
                    }
                  </div>
                  <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-gray-100">
                    @for (_ of skeletonRows; track $index) {
                      <div class="grid animate-pulse grid-cols-[44px_minmax(160px,1fr)_minmax(180px,1fr)_120px_140px_110px_44px] gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0">
                        <div class="h-5 w-5 rounded bg-gray-200"></div>
                        <div class="h-12 rounded-xl bg-gray-200"></div>
                        <div class="h-12 rounded-xl bg-gray-200"></div>
                        <div class="h-12 rounded-xl bg-gray-200"></div>
                        <div class="h-12 rounded-xl bg-gray-200"></div>
                        <div class="h-12 rounded-xl bg-gray-200"></div>
                        <div class="h-10 rounded-xl bg-gray-200"></div>
                      </div>
                    }
                  </div>
                </div>
              } @else if (errorMessage) {
                <div class="flex h-full items-center justify-center p-6">
                  <div class="max-w-lg rounded-[2rem] border border-rose-100 bg-rose-50 p-8 text-center shadow-sm">
                    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
                      <i class="bi bi-exclamation-triangle text-2xl"></i>
                    </div>
                    <h2 class="mt-5 text-xl font-bold text-gray-900">Unable to load draft bills</h2>
                    <p class="mt-3 text-sm leading-6 text-rose-800">{{ errorMessage }}</p>
                    <button
                      type="button"
                      (click)="loadDrafts()"
                      class="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      <i class="bi bi-arrow-repeat"></i>
                      Retry
                    </button>
                  </div>
                </div>
              } @else if (!filteredDrafts.length) {
                <div class="flex h-full items-center justify-center p-6">
                  <div class="max-w-xl text-center">
                    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-700 shadow-sm">
                      <i class="bi bi-file-earmark-text text-3xl"></i>
                    </div>
                    <h2 class="mt-6 text-2xl font-bold tracking-tight text-gray-900">
                      {{ drafts.length ? 'No drafts match these filters' : 'No draft bills saved yet' }}
                    </h2>
                    <p class="mt-3 text-sm leading-6 text-gray-500">
                      {{
                        drafts.length
                          ? 'Try clearing one or two filters, or search by invoice number, product, and customer phone.'
                          : 'Draft invoices appear here once a bill is saved without final checkout. This workspace will also show customer, staff, product, payment, and tax context automatically.'
                      }}
                    </p>
                    <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                      @if (drafts.length) {
                        <button
                          type="button"
                          (click)="clearFilters()"
                          class="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          <i class="bi bi-arrow-counterclockwise"></i>
                          Reset filters
                        </button>
                      }
                      <button
                        type="button"
                        (click)="openInvoiceCreation()"
                        class="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                      >
                        <i class="bi bi-plus-lg"></i>
                        New invoice
                      </button>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="flex h-full min-h-0 flex-col">
                  <div class="overflow-x-auto border-b border-gray-100">
                    <table class="min-w-full border-separate border-spacing-0">
                      <thead class="sticky top-0 z-20 bg-white">
                        <tr class="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                          <th class="px-5 py-4">
                            <input
                              type="checkbox"
                              [checked]="allVisibleSelected"
                              (change)="toggleSelectVisiblePage($event)"
                              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </th>
                          <th class="px-5 py-4">Draft</th>
                          <th class="px-5 py-4">Customer & Items</th>
                          <th class="px-5 py-4 text-right">Amount</th>
                          <th class="px-5 py-4">Staff</th>
                          <th class="px-5 py-4">Last activity</th>
                          <th class="px-5 py-4">Status</th>
                          <th class="px-5 py-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (draft of pagedDrafts; track draft.id) {
                          <tr
                            class="cursor-pointer border-t border-gray-100 transition hover:bg-[#fafcff]"
                            [class.bg-primary-50/50]="selectedDraft?.id === draft.id"
                            (click)="selectDraft(draft)"
                          >
                            <td class="px-5 py-4 align-top" (click)="$event.stopPropagation()">
                              <input
                                type="checkbox"
                                [checked]="isSelected(draft.id)"
                                (change)="toggleSelectDraft(draft.id, $event)"
                                class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </td>
                            <td class="px-5 py-4 align-top">
                              <div class="flex flex-col gap-2">
                                <div class="flex items-center gap-2">
                                  <span class="text-sm font-bold text-primary-700">{{ draft.invoiceNumber }}</span>
                                  @if (draft.dueAmount > 0) {
                                    <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                      Due {{ draft.dueAmount | currency: 'INR':'symbol':'1.0-0' }}
                                    </span>
                                  }
                                </div>
                                <div class="text-xs text-gray-500">
                                  Saved {{ draft.createdAt | date: 'd MMM, y h:mm a' }}
                                </div>
                                <div class="flex flex-wrap gap-2">
                                  <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                                    {{ draft.itemCount }} items
                                  </span>
                                  <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                                    {{ draft.quantityTotal }} qty
                                  </span>
                                  @if (draft.dueDate) {
                                    <span class="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                                      Due {{ draft.dueDate | date: 'd MMM' }}
                                    </span>
                                  }
                                </div>
                              </div>
                            </td>
                            <td class="px-5 py-4 align-top">
                              <div class="flex gap-3">
                                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-sm font-bold uppercase text-primary-700">
                                  {{ getCustomerInitial(draft) }}
                                </div>
                                <div class="min-w-0">
                                  <div class="flex flex-wrap items-center gap-2">
                                    <p class="truncate text-sm font-semibold text-gray-900">{{ draft.customerName || 'Walk-in customer' }}</p>
                                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                      {{ draft.customerSource }}
                                    </span>
                                  </div>
                                  <p class="mt-1 text-xs text-gray-500">{{ draft.customerPhone || 'No phone captured' }}</p>
                                  <p class="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">{{ draft.itemsPreview }}</p>
                                </div>
                              </div>
                            </td>
                            <td class="px-5 py-4 align-top text-right">
                              <div class="text-sm font-bold text-gray-900">{{ draft.total | currency: 'INR':'symbol':'1.0-0' }}</div>
                              <div class="mt-1 text-xs text-gray-500">Tax {{ draft.taxAmount | currency: 'INR':'symbol':'1.0-0' }}</div>
                              <div class="mt-1 text-xs text-gray-500">Paid {{ draft.paidAmount | currency: 'INR':'symbol':'1.0-0' }}</div>
                            </td>
                            <td class="px-5 py-4 align-top">
                              <div class="text-sm font-semibold text-gray-800">{{ draft.employeeName || draft.createdBy?.name || 'Owner desk' }}</div>
                              <div class="mt-1 text-xs uppercase tracking-wide text-gray-400">
                                {{ draft.employeeRole || draft.createdBy?.role || 'Admin' }}
                              </div>
                              @if (draft.staff?.branch) {
                                <div class="mt-2 text-xs text-gray-500">{{ draft.staff?.branch }}</div>
                              }
                            </td>
                            <td class="px-5 py-4 align-top">
                              <div class="text-sm font-semibold text-gray-800">{{ draft.lastTouchedAt | date: 'd MMM, h:mm a' }}</div>
                              <div class="mt-1 text-xs text-gray-500">
                                {{ draft.ageInDays === 0 ? 'Touched today' : draft.ageInDays + ' day' + (draft.ageInDays === 1 ? '' : 's') + ' ago' }}
                              </div>
                            </td>
                            <td class="px-5 py-4 align-top">
                              <div class="flex flex-col gap-2">
                                <span class="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" [class]="getDraftStatusClass(draft.status)">
                                  <span class="h-2 w-2 rounded-full bg-current opacity-70"></span>
                                  {{ draft.status | titlecase }}
                                </span>
                                <span class="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" [class]="getPaymentStatusClass(draft.paymentStatus)">
                                  <i class="bi bi-wallet2"></i>
                                  {{ draft.paymentStatus | titlecase }}
                                </span>
                              </div>
                            </td>
                            <td class="px-5 py-4 align-top" (click)="$event.stopPropagation()">
                              <div class="relative" data-draft-actions>
                                <button
                                  type="button"
                                  (click)="toggleActionMenu(draft.id)"
                                  class="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                                >
                                  <i class="bi bi-three-dots"></i>
                                </button>

                                @if (actionMenuDraftId === draft.id) {
                                  <div class="absolute right-0 top-11 z-40 w-52 rounded-[1.25rem] border border-gray-100 bg-white p-2 shadow-2xl shadow-black/10">
                                    <button
                                      type="button"
                                      (click)="selectDraft(draft); closeActionMenu()"
                                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                      <i class="bi bi-eye text-gray-400"></i>
                                      Open details
                                    </button>
                                    <button
                                      type="button"
                                      (click)="promptStatusChange(draft, 'sent')"
                                      [disabled]="!canEditInvoices"
                                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <i class="bi bi-send text-gray-400"></i>
                                      Mark sent
                                    </button>
                                    <button
                                      type="button"
                                      (click)="promptStatusChange(draft, 'paid')"
                                      [disabled]="!canEditInvoices"
                                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <i class="bi bi-check-circle text-gray-400"></i>
                                      Mark paid
                                    </button>
                                    <button
                                      type="button"
                                      (click)="promptStatusChange(draft, 'cancelled')"
                                      [disabled]="!canEditInvoices"
                                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <i class="bi bi-slash-circle text-gray-400"></i>
                                      Cancel draft
                                    </button>
                                    <div class="my-1 h-px bg-gray-100"></div>
                                    <button
                                      type="button"
                                      (click)="promptDelete(draft)"
                                      [disabled]="!canDeleteInvoices"
                                      class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <i class="bi bi-trash text-rose-400"></i>
                                      Delete draft
                                    </button>
                                  </div>
                                }
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div class="text-sm text-gray-500">
                      Showing {{ pageStartIndex + 1 }}-{{ pageEndIndex }} of {{ filteredDrafts.length }} drafts
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        (click)="goToPreviousPage()"
                        [disabled]="currentPage === 1"
                        class="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <i class="bi bi-arrow-left"></i>
                        Previous
                      </button>

                      @for (page of visiblePageNumbers; track page) {
                        <button
                          type="button"
                          (click)="goToPage(page)"
                          class="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition"
                          [class.bg-primary-600]="page === currentPage"
                          [class.text-white]="page === currentPage"
                          [class.shadow-sm]="page === currentPage"
                          [class.bg-white]="page !== currentPage"
                          [class.text-gray-700]="page !== currentPage"
                          [class.border]="page !== currentPage"
                          [class.border-gray-200]="page !== currentPage"
                          [class.hover:bg-gray-50]="page !== currentPage"
                        >
                          {{ page }}
                        </button>
                      }

                      <button
                        type="button"
                        (click)="goToNextPage()"
                        [disabled]="currentPage === totalPages"
                        class="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <i class="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </section>

            <aside class="hidden w-[400px] shrink-0 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm xl:block">
              @if (selectedDraft) {
                <ng-container [ngTemplateOutlet]="drawerTemplate"></ng-container>
              } @else {
                <div class="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div class="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                    <i class="bi bi-layout-text-window text-3xl"></i>
                  </div>
                  <h2 class="mt-6 text-xl font-bold tracking-tight text-gray-900">Pick a draft to inspect</h2>
                  <p class="mt-3 text-sm leading-6 text-gray-500">
                    Customer profile, line items, payment split, GST breakdown, and activity history all appear here.
                  </p>
                </div>
              }
            </aside>
          </div>
        </div>

        @if (selectedDraft) {
          <div class="fixed inset-0 z-40 bg-slate-950/35 xl:hidden" (click)="closeMobileDrawer()">
            <div class="absolute inset-y-0 right-0 w-full max-w-[420px] bg-white shadow-2xl" (click)="$event.stopPropagation()">
              <ng-container [ngTemplateOutlet]="drawerTemplate"></ng-container>
            </div>
          </div>
        }

        @if (confirmDialog) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div class="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <i class="bi bi-exclamation-triangle text-2xl"></i>
              </div>
              <h2 class="mt-5 text-xl font-bold text-gray-900">{{ confirmDialog.title }}</h2>
              <p class="mt-3 text-sm leading-6 text-gray-500">{{ confirmDialog.description }}</p>
              <div class="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="cancelConfirmation()"
                  class="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  (click)="confirmAction()"
                  [disabled]="processingAction"
                  class="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition"
                  [class.bg-rose-600]="confirmDialog.intent === 'danger'"
                  [class.hover:bg-rose-700]="confirmDialog.intent === 'danger'"
                  [class.bg-primary-600]="confirmDialog.intent !== 'danger'"
                  [class.hover:bg-primary-700]="confirmDialog.intent !== 'danger'"
                >
                  @if (processingAction) {
                    <span class="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  }
                  {{ confirmDialog.confirmLabel }}
                </button>
              </div>
            </div>
          </div>
        }

        <ng-template #drawerTemplate>
          <div class="flex h-full min-h-0 flex-col">
            <div class="border-b border-gray-100 px-6 py-5">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="truncate text-xl font-bold tracking-tight text-gray-900">{{ selectedDraft?.invoiceNumber }}</h2>
                    <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" [class]="getDraftStatusClass(selectedDraft?.status || 'draft')">
                      <span class="h-2 w-2 rounded-full bg-current opacity-70"></span>
                      {{ selectedDraft?.status | titlecase }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-gray-500">{{ selectedDraft?.createdAt | date: 'EEEE, d MMM y, h:mm a' }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="loadDrafts()"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    title="Refresh drafts"
                  >
                    <i class="bi bi-arrow-repeat"></i>
                  </button>
                  <button
                    type="button"
                    (click)="closeMobileDrawer()"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 xl:hidden"
                    title="Close details"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  (click)="promptStatusChange(selectedDraft!, 'sent')"
                  [disabled]="!canEditInvoices"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i class="bi bi-send"></i>
                  Send
                </button>
                <button
                  type="button"
                  (click)="promptStatusChange(selectedDraft!, 'paid')"
                  [disabled]="!canEditInvoices"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i class="bi bi-check-circle"></i>
                  Finalize
                </button>
                <button
                  type="button"
                  (click)="openInvoiceCreation()"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <i class="bi bi-box-arrow-up-right"></i>
                  New invoice
                </button>
                <button
                  type="button"
                  (click)="promptDelete(selectedDraft!)"
                  [disabled]="!canDeleteInvoices"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i class="bi bi-trash"></i>
                  Delete
                </button>
              </div>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <section class="rounded-[1.75rem] border border-gray-100 bg-[#f8fafc] p-5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Collection</p>
                    <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900">{{ selectedDraft?.total | currency: 'INR':'symbol':'1.0-0' }}</p>
                    <p class="mt-2 text-sm text-gray-500">
                      {{ selectedDraft?.paymentMethod | uppercase }} | {{ selectedDraft?.paymentStatus | titlecase }}
                    </p>
                  </div>
                  <div class="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Balance</p>
                    <p class="mt-1 text-sm font-bold text-amber-700">{{ selectedDraft?.dueAmount | currency: 'INR':'symbol':'1.0-0' }}</p>
                  </div>
                </div>

                <div class="mt-5 grid grid-cols-2 gap-3">
                  <div class="rounded-2xl bg-white p-3 shadow-sm">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Subtotal</p>
                    <p class="mt-2 text-sm font-bold text-gray-900">{{ selectedDraft?.subtotal | currency: 'INR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white p-3 shadow-sm">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Tax</p>
                    <p class="mt-2 text-sm font-bold text-gray-900">{{ selectedDraft?.taxAmount | currency: 'INR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white p-3 shadow-sm">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Discount</p>
                    <p class="mt-2 text-sm font-bold text-gray-900">{{ selectedDraft?.discount | currency: 'INR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white p-3 shadow-sm">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Paid</p>
                    <p class="mt-2 text-sm font-bold text-gray-900">{{ selectedDraft?.paidAmount | currency: 'INR':'symbol':'1.0-0' }}</p>
                  </div>
                </div>
              </section>

              <section class="mt-5 rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Customer</h3>
                    <p class="mt-1 text-sm text-gray-500">Profile and source captured when the draft was saved.</p>
                  </div>
                  <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {{ selectedDraft?.customerSource }}
                  </span>
                </div>
                <div class="mt-4 flex gap-3">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-lg font-bold uppercase text-primary-700">
                    {{ getCustomerInitial(selectedDraft) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900">{{ selectedDraft?.customerName || 'Walk-in customer' }}</p>
                    <p class="mt-1 text-sm text-gray-500">{{ selectedDraft?.customerPhone || 'No phone captured' }}</p>
                    @if (selectedDraft?.customer?.email) {
                      <p class="mt-1 text-sm text-gray-500">{{ selectedDraft?.customer?.email }}</p>
                    }
                    @if (selectedDraft?.customer) {
                      <div class="mt-3 flex flex-wrap gap-2">
                        <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                          {{ selectedDraft?.customer?.totalOrders || 0 }} lifetime orders
                        </span>
                        <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                          {{ selectedDraft?.customer?.totalSpent || 0 | currency: 'INR':'symbol':'1.0-0' }} spent
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </section>

              <section class="mt-5 rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Billing context</h3>
                    <p class="mt-1 text-sm text-gray-500">Staff assignment, payment rail, and tax configuration.</p>
                  </div>
                </div>

                <div class="mt-4 space-y-3">
                  <div class="flex items-start justify-between gap-4 rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Billed by</p>
                      <p class="mt-1 text-sm font-semibold text-gray-900">{{ selectedDraft?.employeeName || selectedDraft?.createdBy?.name || 'Owner desk' }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Role</p>
                      <p class="mt-1 text-sm font-semibold text-gray-700">{{ selectedDraft?.employeeRole || selectedDraft?.createdBy?.role || 'Admin' }}</p>
                    </div>
                  </div>

                  <div class="flex items-start justify-between gap-4 rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment method</p>
                      <p class="mt-1 text-sm font-semibold text-gray-900">{{ selectedDraft?.paymentMethod | uppercase }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Availability</p>
                      <p class="mt-1 text-sm font-semibold text-gray-700">{{ getPaymentAvailabilityLabel(selectedDraft) }}</p>
                    </div>
                  </div>

                  <div class="rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">GST profile</p>
                        <p class="mt-1 text-sm font-semibold text-gray-900">{{ selectedDraft?.gstSummary }}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Due date</p>
                        <p class="mt-1 text-sm font-semibold text-gray-700">
                          {{ selectedDraft?.dueDate ? (selectedDraft?.dueDate | date: 'd MMM y') : 'Not set' }}
                        </p>
                      </div>
                    </div>
                    @if (selectedDraft && selectedDraft.taxAmount > 0) {
                      <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div class="rounded-xl bg-white px-3 py-2">
                          <p class="font-semibold text-gray-400">CGST</p>
                          <p class="mt-1 text-sm font-bold text-gray-900">{{ selectedDraft.cgst | currency: 'INR':'symbol':'1.0-0' }}</p>
                        </div>
                        <div class="rounded-xl bg-white px-3 py-2">
                          <p class="font-semibold text-gray-400">SGST</p>
                          <p class="mt-1 text-sm font-bold text-gray-900">{{ selectedDraft.sgst | currency: 'INR':'symbol':'1.0-0' }}</p>
                        </div>
                        <div class="rounded-xl bg-white px-3 py-2">
                          <p class="font-semibold text-gray-400">IGST</p>
                          <p class="mt-1 text-sm font-bold text-gray-900">{{ selectedDraft.igst | currency: 'INR':'symbol':'1.0-0' }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </section>

              <section class="mt-5 rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Products</h3>
                    <p class="mt-1 text-sm text-gray-500">Every line item saved in the current draft bill.</p>
                  </div>
                  <span class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {{ selectedDraft?.itemCount }} lines
                  </span>
                </div>

                <div class="mt-4 space-y-3">
                  @for (item of selectedDraft?.items || []; track trackItem($index, item)) {
                    <div class="rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3">
                      <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-gray-900">{{ item.productName || item.name || 'Unnamed item' }}</p>
                          <p class="mt-1 text-xs text-gray-500">
                            {{ getVariantLabel(item) }}
                          </p>
                          <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                            @if (item.variantSku) {
                              <span class="rounded-full bg-white px-2 py-1 font-medium shadow-sm">SKU {{ item.variantSku }}</span>
                            }
                            <span class="rounded-full bg-white px-2 py-1 font-medium shadow-sm">Qty {{ item.quantity }}</span>
                            <span class="rounded-full bg-white px-2 py-1 font-medium shadow-sm">Rate {{ item.unitPrice | currency: 'INR':'symbol':'1.0-0' }}</span>
                            @if (item.taxRate) {
                              <span class="rounded-full bg-white px-2 py-1 font-medium shadow-sm">Tax {{ item.taxRate }}%</span>
                            }
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-sm font-bold text-gray-900">{{ getItemTotal(item) | currency: 'INR':'symbol':'1.0-0' }}</p>
                          <p class="mt-1 text-xs text-gray-500">Discount {{ item.discount | currency: 'INR':'symbol':'1.0-0' }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </section>

              <section class="mt-5 rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Activity timeline</h3>
                    <p class="mt-1 text-sm text-gray-500">System timestamps and matching staff activity for this draft.</p>
                  </div>
                </div>

                <div class="mt-4 space-y-4">
                  @for (entry of selectedDraft?.activityTimeline || []; track entry.id) {
                    <div class="flex gap-3">
                      <div class="flex flex-col items-center">
                        <span class="flex h-9 w-9 items-center justify-center rounded-2xl" [class]="getTimelineToneClass(entry.tone)">
                          <i
                            class="bi"
                            [class.bi-clock-history]="entry.tone === 'neutral'"
                            [class.bi-check2-circle]="entry.tone === 'success'"
                            [class.bi-exclamation-circle]="entry.tone === 'warning'"
                          ></i>
                        </span>
                        <span class="mt-2 h-full w-px bg-gray-100"></span>
                      </div>
                      <div class="min-w-0 pb-4">
                        <p class="text-sm font-semibold text-gray-900">{{ entry.title }}</p>
                        <p class="mt-1 text-sm leading-5 text-gray-500">{{ entry.detail }}</p>
                        <p class="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                          {{ entry.timestamp ? (entry.timestamp | date: 'd MMM y, h:mm a') : 'Time unavailable' }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </section>

              @if (selectedDraft?.notes) {
                <section class="mt-5 rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 class="text-lg font-semibold text-gray-900">Notes</h3>
                  <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{{ selectedDraft?.notes }}</p>
                </section>
              }
            </div>
          </div>
        </ng-template>
      </div>
    }
  `,
})
export class SalesDraftsComponent {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  private readonly destroyRef = inject(DestroyRef);
  private flashTimeoutId: ReturnType<typeof setTimeout> | null = null;

  loading = true;
  processingAction = false;
  errorMessage = '';
  flashMessage = '';
  flashTone: FlashTone = 'info';

  currentUser: UserProfile | null = null;
  shopId: string | null = null;
  shop: Shop | null = null;

  drafts: DraftInvoiceView[] = [];
  selectedDraftId: string | null = null;
  selectedIds = new Set<string>();
  actionMenuDraftId: string | null = null;
  showAdvancedFilters = false;

  searchQuery = '';
  statusFilter = 'all';
  paymentStatusFilter = 'all';
  paymentMethodFilter = 'all';
  staffFilter = 'all';
  sourceFilter = 'all';
  taxFilter = 'all';
  sortKey: DraftSortKey = 'recent';
  pageSize = 10;
  currentPage = 1;

  confirmDialog:
    | {
        title: string;
        description: string;
        confirmLabel: string;
        intent: 'danger' | 'primary';
        action: ConfirmAction;
      }
    | null = null;

  readonly skeletonCards = Array.from({ length: 4 });
  readonly skeletonRows = Array.from({ length: 8 });

  readonly sortOptions: Array<{ value: DraftSortKey; label: string }> = [
    { value: 'recent', label: 'Recently updated' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'amount-high', label: 'Amount high to low' },
    { value: 'amount-low', label: 'Amount low to high' },
    { value: 'customer', label: 'Customer name' },
    { value: 'invoice', label: 'Invoice number' },
  ];

  readonly statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  readonly paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
  ];

  readonly paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'credit', label: 'Credit' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly customerService: CustomerService,
    private readonly invoiceService: InvoiceService,
    private readonly permissionService: PermissionService,
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly shopContextService: ShopContextService,
    private readonly shopService: ShopService,
    private readonly staffService: StaffService,
  ) {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        if (this.shopId) {
          this.loadDrafts();
        }
      });

    this.shopContextService
      .connectWorkspaceRoute(this.route)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shopId) => {
        this.shopId = shopId;
        if (shopId) {
          this.loadDrafts();
        }
      });
  }

  get canViewInvoices() {
    return this.permissionService.hasPermission('invoices.view');
  }

  get canEditInvoices() {
    return this.permissionService.hasPermission('invoices.edit');
  }

  get canDeleteInvoices() {
    return this.permissionService.hasPermission('invoices.delete');
  }

  get selectedDraft(): DraftInvoiceView | null {
    return this.drafts.find((draft) => draft.id === this.selectedDraftId) || null;
  }

  get filteredDrafts(): DraftInvoiceView[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.sortedDrafts(this.drafts).filter((draft) => {
      if (this.statusFilter !== 'all' && draft.status !== this.statusFilter) {
        return false;
      }

      if (this.paymentStatusFilter !== 'all' && draft.paymentStatus !== this.paymentStatusFilter) {
        return false;
      }

      if (this.paymentMethodFilter !== 'all' && draft.paymentMethod !== this.paymentMethodFilter) {
        return false;
      }

      if (this.staffFilter !== 'all' && (draft.employeeId || 'unassigned') !== this.staffFilter) {
        return false;
      }

      if (this.sourceFilter !== 'all' && draft.customerSource.toLowerCase() !== this.sourceFilter) {
        return false;
      }

      if (this.taxFilter === 'taxed' && !(draft.taxAmount > 0)) {
        return false;
      }

      if (this.taxFilter === 'untaxed' && draft.taxAmount > 0) {
        return false;
      }

      if (this.taxFilter === 'interstate' && !draft.isInterstate) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        draft.invoiceNumber,
        draft.customerName,
        draft.customerPhone,
        draft.employeeName,
        draft.employeeRole,
        draft.itemsPreview,
        draft.notes,
        draft.customer?.email,
        draft.createdBy?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  get pagedDrafts(): DraftInvoiceView[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDrafts.slice(start, start + this.pageSize);
  }

  get pageStartIndex() {
    return this.filteredDrafts.length ? (this.currentPage - 1) * this.pageSize : 0;
  }

  get pageEndIndex() {
    return Math.min(this.pageStartIndex + this.pageSize, this.filteredDrafts.length);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredDrafts.length / this.pageSize));
  }

  get allVisibleSelected() {
    return this.pagedDrafts.length > 0 && this.pagedDrafts.every((draft) => this.selectedIds.has(draft.id));
  }

  get latestUpdateLabel() {
    const latest = [...this.drafts]
      .sort((a, b) => this.getDateValue(b.lastTouchedAt) - this.getDateValue(a.lastTouchedAt))[0]
      ?.lastTouchedAt;

    if (!latest) {
      return 'just now';
    }

    const diffDays = Math.floor((Date.now() - latest.getTime()) / 86_400_000);
    if (diffDays <= 0) {
      return 'today';
    }
    if (diffDays === 1) {
      return '1 day ago';
    }
    return `${diffDays} days ago`;
  }

  get summaryCards() {
    const source = this.filteredDrafts;
    const gross = source.reduce((sum, draft) => sum + Number(draft.total || 0), 0);
    const due = source.reduce((sum, draft) => sum + Number(draft.dueAmount || 0), 0);
    const staleCount = source.filter((draft) => draft.ageInDays >= 7).length;
    const avgTicket = source.length ? gross / source.length : 0;

    return [
      {
        label: 'Visible Draft Bills',
        value: String(source.length),
        hint: source.length ? 'Live rows after filters and permissions.' : 'No draft bills in the current scope.',
        badge: 'Count',
        icon: 'bi-collection',
        iconClass: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700',
      },
      {
        label: 'Draft Pipeline Value',
        value: this.formatCurrency(gross),
        hint: 'Grand total still sitting in saved-but-unfinished bills.',
        badge: 'Revenue',
        icon: 'bi-cash-stack',
        iconClass: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Outstanding Balance',
        value: this.formatCurrency(due),
        hint: 'Remaining collection after current paid amounts.',
        badge: 'Due',
        icon: 'bi-wallet2',
        iconClass: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700',
      },
      {
        label: 'Average Ticket',
        value: this.formatCurrency(avgTicket),
        hint: staleCount ? `${staleCount} drafts have been untouched for 7+ days.` : 'No stale drafts right now.',
        badge: staleCount ? 'Stale watch' : 'Healthy',
        icon: 'bi-graph-up-arrow',
        iconClass: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700',
      },
    ];
  }

  get visiblePageNumbers() {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 1);
    const end = Math.min(this.totalPages, start + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (!pages.includes(this.totalPages)) {
      while (pages.length < 3 && pages[0] > 1) {
        pages.unshift(pages[0] - 1);
      }
    }

    return pages;
  }

  get hasActiveFilters() {
    return (
      !!this.searchQuery.trim() ||
      this.statusFilter !== 'all' ||
      this.paymentStatusFilter !== 'all' ||
      this.paymentMethodFilter !== 'all' ||
      this.staffFilter !== 'all' ||
      this.sourceFilter !== 'all' ||
      this.taxFilter !== 'all' ||
      this.sortKey !== 'recent' ||
      this.pageSize !== 10
    );
  }

  get staffFilterOptions() {
    const unique = new Map<string, string>();
    this.drafts.forEach((draft) => {
      if (draft.employeeId) {
        unique.set(draft.employeeId, draft.employeeName || draft.staff?.fullName || 'Unknown staff');
      }
    });

    return [...unique.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }

  get sourceOptions() {
    const sources = new Set(this.drafts.map((draft) => draft.customerSource.toLowerCase()));
    return [...sources].sort().map((value) => ({
      value,
      label: value === 'pos' ? 'POS' : this.titlecase(value),
    }));
  }

  loadDrafts() {
    if (!this.shopId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.closeActionMenu();

    const canViewCustomers = this.permissionService.hasPermission('customers.view');
    const canViewStaff = this.permissionService.hasPermission('staff.view');

    forkJoin({
      invoices: this.invoiceService.getInvoicesByShop(this.shopId).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
      customers: canViewCustomers
        ? this.customerService.getCustomersByShop(this.shopId).pipe(catchError(() => of({ data: [] })))
        : of({ data: [] }),
      staff: canViewStaff
        ? this.staffService.getStaff(this.shopId).pipe(catchError(() => of({ data: [] })))
        : of({ data: [] }),
      products: this.productService.getProductsByShop(this.shopId).pipe(catchError(() => of({ data: [] }))),
      logs: canViewStaff
        ? this.staffService.getStaffLogs(this.shopId).pipe(catchError(() => of({ data: [] })))
        : of({ data: [] }),
      shop: this.shopService.getShop(this.shopId).pipe(catchError(() => of({ data: null } as any))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.shop = result.shop?.data || null;
          this.drafts = this.buildDraftViews(
            result.invoices?.data || [],
            result.customers?.data || [],
            result.staff?.data || [],
            result.products?.data || [],
            result.logs?.data || [],
          );
          this.currentPage = 1;
          this.reconcileSelection();
          this.ensureSelectedDraft();
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load sales drafts', error);
          this.loading = false;
          this.drafts = [];
          this.selectedDraftId = null;
          this.errorMessage =
            error?.error?.message ||
            'The draft workspace could not fetch invoices right now. Please retry in a moment.';
        },
      });
  }

  buildDraftViews(
    invoices: Invoice[],
    customers: Customer[],
    staffMembers: Staff[],
    products: Product[],
    staffLogs: any[],
  ) {
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));
    const customerByPhone = new Map(customers.map((customer) => [customer.phoneNumber, customer]));
    const staffById = new Map(staffMembers.map((member) => [member.id, member]));
    const productById = new Map(products.map((product) => [product.id, product]));

    return invoices
      .map((invoice) => this.normalizeDraftInvoice(invoice, customerById, customerByPhone, staffById, productById, staffLogs))
      .filter((invoice): invoice is DraftInvoiceView => !!invoice)
      .filter((invoice) => invoice.status === 'draft')
      .filter((invoice) => {
        if (this.currentUser?.role !== 'staff') {
          return true;
        }

        return invoice.employeeId === this.currentUser.uid || invoice.createdBy?.id === this.currentUser.uid;
      });
  }

  normalizeDraftInvoice(
    invoice: Invoice,
    customerById: Map<string, Customer>,
    customerByPhone: Map<string, Customer>,
    staffById: Map<string, Staff>,
    productById: Map<string, Product>,
    staffLogs: any[],
  ): DraftInvoiceView | null {
    const createdAt = this.toDate((invoice as any).createdAt);
    const updatedAt = this.toDate((invoice as any).updatedAt);
    const invoiceDate = this.toDate((invoice as any).invoiceDate || (invoice as any).date);
    const dueDate = this.toDate((invoice as any).dueDate);
    const lastTouchedAt = updatedAt || createdAt || invoiceDate;
    const customer = customerById.get(invoice.customerId) || customerByPhone.get(invoice.customerPhone);
    const staff = invoice.employeeId ? staffById.get(invoice.employeeId) : undefined;
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const quantityTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const dueAmount = Math.max(Number(invoice.total || 0) - Number(invoice.paidAmount || 0), 0);
    const ageInDays = lastTouchedAt ? Math.max(0, Math.floor((Date.now() - lastTouchedAt.getTime()) / 86_400_000)) : 0;

    const invoiceAny = invoice as any;
    const activityTimeline = this.buildTimeline(invoice, createdAt, updatedAt, dueDate, staffLogs);

    return {
      ...invoice,
      customer,
      staff,
      invoiceDate,
      createdAt,
      updatedAt,
      dueDate,
      lastTouchedAt,
      itemCount: items.length,
      quantityTotal,
      dueAmount,
      customerSource: customer?.source || 'pos',
      itemsPreview: this.buildItemsPreview(items, productById),
      paymentLabel: invoice.paymentMethod ? String(invoice.paymentMethod).toUpperCase() : 'UNSET',
      activityTimeline,
      ageInDays,
      gstSummary: this.buildGstSummary(invoice),
      cgst: Number(invoiceAny.cgst || 0),
      sgst: Number(invoiceAny.sgst || 0),
      igst: Number(invoiceAny.igst || 0),
      isInterstate: Boolean(invoiceAny.isInterstate),
    };
  }

  buildItemsPreview(items: InvoiceItem[], productById: Map<string, Product>) {
    const labels = items
      .map((item) => item.productName || item.name || productById.get(item.productId)?.name)
      .filter(Boolean) as string[];

    if (!labels.length) {
      return 'No line items captured yet';
    }

    if (labels.length === 1) {
      return labels[0];
    }

    if (labels.length === 2) {
      return `${labels[0]}, ${labels[1]}`;
    }

    return `${labels[0]}, ${labels[1]} +${labels.length - 2} more`;
  }

  buildGstSummary(invoice: Invoice) {
    const invoiceAny = invoice as any;

    if (!(invoice.taxAmount > 0)) {
      return 'No GST applied';
    }

    if (invoiceAny.isInterstate) {
      return `IGST ${invoice.taxRate || 0}%`;
    }

    if (invoiceAny.cgst || invoiceAny.sgst) {
      return `CGST/SGST split at ${invoice.taxRate || 0}%`;
    }

    return `GST ${invoice.taxRate || 0}%`;
  }

  buildTimeline(
    invoice: Invoice,
    createdAt: Date | null,
    updatedAt: Date | null,
    dueDate: Date | null,
    staffLogs: any[],
  ): TimelineEntry[] {
    const entries: TimelineEntry[] = [];
    const invoiceNumber = String(invoice.invoiceNumber || '').toLowerCase();
    const customerName = String(invoice.customerName || '').toLowerCase();

    if (createdAt) {
      entries.push({
        id: `${invoice.id}-created`,
        title: 'Draft created',
        detail: `${invoice.createdBy?.name || invoice.employeeName || 'A team member'} saved this bill as a draft.`,
        timestamp: createdAt,
        tone: 'success',
      });
    }

    if (updatedAt && (!createdAt || updatedAt.getTime() !== createdAt.getTime())) {
      entries.push({
        id: `${invoice.id}-updated`,
        title: 'Draft updated',
        detail: 'Amounts, items, payment details, or notes were changed after the initial save.',
        timestamp: updatedAt,
        tone: 'neutral',
      });
    }

    if (dueDate) {
      entries.push({
        id: `${invoice.id}-due`,
        title: 'Due date captured',
        detail: 'The draft includes a due date for follow-up or later collection.',
        timestamp: dueDate,
        tone: dueDate.getTime() < Date.now() ? 'warning' : 'neutral',
      });
    }

    staffLogs
      .filter((entry) => {
        const detail = String(entry?.details || '').toLowerCase();
        return !!detail && (detail.includes(invoiceNumber) || (customerName && detail.includes(customerName)));
      })
      .slice(0, 5)
      .forEach((entry, index) => {
        entries.push({
          id: `${invoice.id}-log-${index}`,
          title: entry?.action || 'Staff activity',
          detail: entry?.details || 'A related staff event was recorded for this draft.',
          timestamp: this.toDate(entry?.timestamp),
          tone: entry?.type === 'sale' ? 'success' : 'neutral',
        });
      });

    return entries.sort((a, b) => this.getDateValue(b.timestamp) - this.getDateValue(a.timestamp));
  }

  selectDraft(draft: DraftInvoiceView) {
    this.selectedDraftId = draft.id;
  }

  closeMobileDrawer() {
    if (window.innerWidth < 1280) {
      this.selectedDraftId = null;
    }
  }

  toggleSelectDraft(draftId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedIds.add(draftId);
    } else {
      this.selectedIds.delete(draftId);
    }
  }

  toggleSelectVisiblePage(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    this.pagedDrafts.forEach((draft) => {
      if (checked) {
        this.selectedIds.add(draft.id);
      } else {
        this.selectedIds.delete(draft.id);
      }
    });
  }

  isSelected(draftId: string) {
    return this.selectedIds.has(draftId);
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  toggleActionMenu(draftId: string) {
    this.actionMenuDraftId = this.actionMenuDraftId === draftId ? null : draftId;
  }

  closeActionMenu() {
    this.actionMenuDraftId = null;
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.paymentStatusFilter = 'all';
    this.paymentMethodFilter = 'all';
    this.staffFilter = 'all';
    this.sourceFilter = 'all';
    this.taxFilter = 'all';
    this.sortKey = 'recent';
    this.pageSize = 10;
    this.currentPage = 1;
  }

  onFiltersChanged() {
    this.currentPage = 1;
    this.reconcileSelection();
    this.ensureSelectedDraft();
  }

  onPageSizeChanged() {
    this.currentPage = 1;
    this.reconcileSelection();
  }

  goToPage(page: number) {
    this.currentPage = Math.min(this.totalPages, Math.max(1, page));
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  openInvoiceCreation() {
    if (!this.shopId) {
      return;
    }

    this.router.navigate(['/', this.shopId, 'invoices'], {
      queryParams: { action: 'create' },
    });
  }

  goToDashboard() {
    if (!this.shopId) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/', this.shopId, 'dashboard']);
  }

  promptDelete(draft: DraftInvoiceView) {
    this.closeActionMenu();
    this.confirmDialog = {
      title: `Delete ${draft.invoiceNumber}?`,
      description:
        'This draft bill will be permanently removed from the sales workspace. Use this only when the bill is no longer needed.',
      confirmLabel: 'Delete draft',
      intent: 'danger',
      action: { type: 'delete-single', draftId: draft.id },
    };
  }

  promptBulkDelete() {
    this.confirmDialog = {
      title: `Delete ${this.selectedIds.size} draft${this.selectedIds.size === 1 ? '' : 's'}?`,
      description:
        'The selected draft bills will be removed permanently. This is best for accidental or abandoned bills that should not stay in the queue.',
      confirmLabel: 'Delete selected',
      intent: 'danger',
      action: { type: 'delete-bulk', draftIds: [...this.selectedIds] },
    };
  }

  promptStatusChange(draft: DraftInvoiceView, status: Invoice['status']) {
    this.closeActionMenu();
    const statusLabel = this.titlecase(status);
    const message =
      status === 'paid'
        ? 'This moves the draft out of the queue and marks collection as complete.'
        : status === 'sent'
          ? 'This marks the bill as shared with the customer and removes it from the draft queue.'
          : status === 'cancelled'
            ? 'This keeps a record that the draft was intentionally closed and should not be billed.'
            : 'This moves the bill back into the draft queue.';

    this.confirmDialog = {
      title: `${statusLabel} ${draft.invoiceNumber}?`,
      description: message,
      confirmLabel: statusLabel,
      intent: status === 'cancelled' ? 'danger' : 'primary',
      action: { type: 'status-single', draftId: draft.id, status },
    };
  }

  promptBulkStatusChange(status: Invoice['status']) {
    const statusLabel = this.titlecase(status);
    this.confirmDialog = {
      title: `${statusLabel} ${this.selectedIds.size} draft${this.selectedIds.size === 1 ? '' : 's'}?`,
      description:
        status === 'paid'
          ? 'Every selected draft will be marked as paid and removed from this queue.'
          : `Every selected draft will be updated to ${statusLabel.toLowerCase()} and leave the draft queue.`,
      confirmLabel: statusLabel,
      intent: status === 'cancelled' ? 'danger' : 'primary',
      action: { type: 'status-bulk', draftIds: [...this.selectedIds], status },
    };
  }

  cancelConfirmation() {
    this.confirmDialog = null;
  }

  confirmAction() {
    if (!this.confirmDialog) {
      return;
    }

    const action = this.confirmDialog.action;
    this.processingAction = true;

    let request$: any;

    switch (action.type) {
      case 'delete-single':
        request$ = this.invoiceService.deleteInvoice(action.draftId);
        break;
      case 'delete-bulk':
        request$ = forkJoin(action.draftIds.map((draftId) => this.invoiceService.deleteInvoice(draftId)));
        break;
      case 'status-single': {
        const draft = this.drafts.find((item) => item.id === action.draftId);
        request$ = draft
          ? this.invoiceService.updateInvoice(action.draftId, this.buildStatusPayload(draft, action.status))
          : of(null);
        break;
      }
      case 'status-bulk': {
        const requests = action.draftIds
          .map((draftId) => {
            const draft = this.drafts.find((item) => item.id === draftId);
            return draft
              ? this.invoiceService.updateInvoice(draftId, this.buildStatusPayload(draft, action.status))
              : null;
          })
          .filter(Boolean);
        request$ = requests.length ? forkJoin(requests as any[]) : of(null);
        break;
      }
    }

    request$.subscribe({
      next: () => {
        this.processingAction = false;
        this.confirmDialog = null;
        this.handleLocalAction(action);
      },
      error: (error: any) => {
        console.error('Failed to process draft action', error);
        this.processingAction = false;
        this.confirmDialog = null;
        this.showFlash(
          error?.error?.message || 'The requested draft action could not be completed. Please retry.',
          'error',
        );
      },
    });
  }

  buildStatusPayload(draft: DraftInvoiceView, status: Invoice['status']) {
    if (status === 'paid') {
      const payload: Partial<Invoice> = {
        shopId: draft.shopId,
        status: 'paid',
        paymentStatus: 'paid',
        paidAmount: draft.total,
      };
      return payload;
    }

    if (status === 'sent') {
      const payload: Partial<Invoice> = {
        shopId: draft.shopId,
        status: 'sent',
      };
      return payload;
    }

    if (status === 'cancelled') {
      const payload: Partial<Invoice> = {
        shopId: draft.shopId,
        status: 'cancelled',
      };
      return payload;
    }

    const payload: Partial<Invoice> = {
      shopId: draft.shopId,
      status: 'draft',
    };
    return payload;
  }

  handleLocalAction(action: ConfirmAction) {
    switch (action.type) {
      case 'delete-single':
        this.removeDrafts([action.draftId]);
        this.showFlash('Draft bill deleted successfully.', 'success');
        break;
      case 'delete-bulk':
        this.removeDrafts(action.draftIds);
        this.showFlash(`${action.draftIds.length} draft bills deleted.`, 'success');
        break;
      case 'status-single':
        this.removeDrafts([action.draftId]);
        this.showFlash(`Draft bill marked ${this.titlecase(action.status).toLowerCase()}.`, 'success');
        break;
      case 'status-bulk':
        this.removeDrafts(action.draftIds);
        this.showFlash(
          `${action.draftIds.length} draft bill${action.draftIds.length === 1 ? '' : 's'} marked ${this.titlecase(action.status).toLowerCase()}.`,
          'success',
        );
        break;
    }
  }

  removeDrafts(draftIds: string[]) {
    const idSet = new Set(draftIds);
    this.drafts = this.drafts.filter((draft) => !idSet.has(draft.id));
    draftIds.forEach((draftId) => this.selectedIds.delete(draftId));

    if (this.selectedDraftId && idSet.has(this.selectedDraftId)) {
      this.selectedDraftId = null;
    }

    this.reconcileSelection();
    this.ensureSelectedDraft();
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  ensureSelectedDraft() {
    if (this.selectedDraftId && this.filteredDrafts.some((draft) => draft.id === this.selectedDraftId)) {
      return;
    }

    this.selectedDraftId = this.pagedDrafts[0]?.id || this.filteredDrafts[0]?.id || null;
  }

  reconcileSelection() {
    const validIds = new Set(this.drafts.map((draft) => draft.id));
    [...this.selectedIds].forEach((draftId) => {
      if (!validIds.has(draftId)) {
        this.selectedIds.delete(draftId);
      }
    });
  }

  showFlash(message: string, tone: FlashTone) {
    this.flashMessage = message;
    this.flashTone = tone;

    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }

    this.flashTimeoutId = setTimeout(() => {
      this.flashMessage = '';
    }, 4000);
  }

  clearFlash() {
    this.flashMessage = '';
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
      this.flashTimeoutId = null;
    }
  }

  getDraftStatusClass(status: Invoice['status']) {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'sent':
        return 'bg-sky-100 text-sky-700';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  getPaymentStatusClass(status: Invoice['paymentStatus']) {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'partial':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  getTimelineToneClass(tone: TimelineEntry['tone']) {
    switch (tone) {
      case 'success':
        return 'bg-emerald-100 text-emerald-700';
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  getCustomerInitial(draft: DraftInvoiceView | null) {
    return draft?.customerName?.trim()?.charAt(0)?.toUpperCase() || 'C';
  }

  getItemTotal(item: InvoiceItem) {
    return Number(item.total || item.unitPrice * item.quantity || 0);
  }

  getVariantLabel(item: InvoiceItem) {
    const parts = [item.variantDetails?.size, item.variantDetails?.color].filter(Boolean);
    return parts.length ? parts.join(' / ') : 'Variant details not captured';
  }

  getPaymentAvailabilityLabel(draft: DraftInvoiceView | null) {
    if (!draft || !this.shop?.paymentModes) {
      return 'Shop defaults';
    }

    if (draft.paymentMethod === 'cash') {
      return this.shop.paymentModes.cod ? 'Cash accepted' : 'Cash disabled';
    }

    if (draft.paymentMethod === 'upi' || draft.paymentMethod === 'card') {
      return this.shop.paymentModes.online ? 'Online enabled' : 'Online disabled';
    }

    if (draft.paymentMethod === 'credit') {
      return this.shop.paymentModes.bankTransfer ? 'Manual settlement enabled' : 'Follow shop policy';
    }

    return 'Shop defaults';
  }

  formatCurrency(value: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  toDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value?.toDate === 'function') {
      const converted = value.toDate();
      return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null;
    }

    if (typeof value === 'object' && ('seconds' in value || '_seconds' in value)) {
      const seconds = Number((value as any).seconds ?? (value as any)._seconds);
      const parsed = new Date(seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  getDateValue(value: Date | null | undefined) {
    return value instanceof Date ? value.getTime() : 0;
  }

  sortedDrafts(drafts: DraftInvoiceView[]) {
    return [...drafts].sort((a, b) => {
      switch (this.sortKey) {
        case 'oldest':
          return this.getDateValue(a.lastTouchedAt) - this.getDateValue(b.lastTouchedAt);
        case 'amount-high':
          return Number(b.total || 0) - Number(a.total || 0);
        case 'amount-low':
          return Number(a.total || 0) - Number(b.total || 0);
        case 'customer':
          return String(a.customerName || '').localeCompare(String(b.customerName || ''));
        case 'invoice':
          return String(a.invoiceNumber || '').localeCompare(String(b.invoiceNumber || ''));
        case 'recent':
        default:
          return this.getDateValue(b.lastTouchedAt) - this.getDateValue(a.lastTouchedAt);
      }
    });
  }

  titlecase(value: string) {
    return value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  trackItem(index: number, item: InvoiceItem) {
    return `${item.productId || item.productName || 'item'}-${item.variantSku || index}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-draft-actions]')) {
      return;
    }

    this.closeActionMenu();
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const isTypingContext =
      !!target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);

    if (event.key === '/' && !isTypingContext) {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
      return;
    }

    if ((event.key === 'r' || event.key === 'R') && !isTypingContext) {
      event.preventDefault();
      this.loadDrafts();
      return;
    }

    if (event.key === 'Escape') {
      this.closeActionMenu();

      if (this.confirmDialog) {
        this.cancelConfirmation();
        return;
      }

      if (window.innerWidth < 1280 && this.selectedDraftId) {
        this.selectedDraftId = null;
      }
    }
  }
}
