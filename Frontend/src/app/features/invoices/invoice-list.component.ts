import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Invoice } from '../../core/models/invoice.model';
import { CreateInvoiceComponent } from './create-invoice.component';
import { InvoicePrintComponent } from '../../shared/components/invoice-print.component';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { PrintService } from '../../shared/components/print-preview-modal.component';

import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CreateInvoiceComponent,
    InvoicePrintComponent,
    FormsModule,
    UiLoadingComponent,
    UiDropdownComponent,
  ],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Invoice List -->
      <div
        class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300 no-print"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900">{{ isWebsiteTab ? 'Website Invoices' : 'Invoices' }}</h2>
          <div class="flex items-center gap-3">
            <button
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i class="bi bi-funnel text-lg"></i>
            </button>
            <button
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i class="bi bi-clock-history text-lg"></i>
            </button>
            <button
              *ngIf="!isWebsiteTab"
              (click)="showCreateModal = true"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <i class="bi bi-plus-lg"></i>
              Generate New
            </button>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="p-4 flex gap-4 bg-white shrink-0">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search invoice number or customer name"
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all"
            />
          </div>
          <div class="relative w-40 z-20">
            <app-ui-dropdown
              [options]="timeFilterOptions"
              [(ngModel)]="selectedTimeFilter"
              placeholder="Select Time"
            ></app-ui-dropdown>
          </div>
          <button
            class="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors bg-white"
          >
            <i class="bi bi-download"></i>
          </button>
        </div>

        <!-- Table List -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  <th class="px-6 py-3">Invoice #</th>
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Phone</th>
                  <th class="px-6 py-3">Date</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Billed By</th>
                  <th class="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (isLoading) {
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading invoices...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (filteredInvoices.length === 0) {
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                      No invoices found.
                    </td>
                  </tr>
                } @else {
                  @for (invoice of filteredInvoices; track invoice.id) {
                    <tr
                      (click)="selectInvoice(invoice)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-black/5]="selectedInvoice?.id === invoice.id"
                    >
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-[#2563eb] group-hover:underline">
                          {{ invoice.invoiceNumber }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <div
                            class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600"
                          >
                            {{ invoice.customerName.charAt(0).toUpperCase() }}
                          </div>
                          <span class="text-sm text-gray-900">{{ invoice.customerName }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">{{ invoice.customerPhone }}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {{ invoice.invoiceDate || invoice.date | date: "d MMM 'yy" }}
                      </td>
                      <td class="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{{ invoice.total | number }}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        <div class="flex flex-col">
                          <span class="font-medium text-gray-700">{{
                            invoice.employeeName || 'Admin'
                          }}</span>
                          <span class="text-[10px] uppercase text-gray-400">{{
                            invoice.employeeRole || 'Admin'
                          }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-3 py-1 rounded-full text-xs font-medium"
                          [class.bg-primary-100]="(invoice.paymentStatus || invoice.status) === 'paid'"
                          [class.text-primary-700]="(invoice.paymentStatus || invoice.status) === 'paid'"
                          [class.bg-yellow-100]="(invoice.paymentStatus || invoice.status) === 'pending'"
                          [class.text-yellow-800]="(invoice.paymentStatus || invoice.status) === 'pending'"
                          [class.bg-gray-100]="(invoice.paymentStatus || invoice.status) === 'partial'"
                          [class.text-gray-700]="(invoice.paymentStatus || invoice.status) === 'partial'"


                        >
                          {{ (invoice.paymentStatus || invoice.status ) | titlecase }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 invoice-detail-panel"
        *ngIf="selectedInvoice"
      >
        <!-- Detail Header -->
        <div class="px-6 py-5 border-b border-gray-200 flex flex-col gap-4 shrink-0 z-10 bg-white">
          <div class="flex justify-between items-start gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-xl font-bold text-gray-900 uppercase tracking-wide break-all leading-tight">
                  {{ selectedInvoice.invoiceNumber }}
                </h2>
                <span
                  *ngIf="selectedInvoiceExt?.invoiceType === 'wholesale'"
                  class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md whitespace-nowrap"
                >
                  Wholesale
                </span>
              </div>
              <div class="text-sm text-gray-500 font-medium">
                {{ selectedInvoice.invoiceDate | date: 'mediumDate' }} • {{ selectedInvoice.invoiceDate | date: 'shortTime' }}
              </div>
            </div>
            <span
              class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full shrink-0 border"
              [ngClass]="{
                'bg-green-50 text-green-700 border-green-200': selectedInvoice.status === 'paid',
                'bg-yellow-50 text-yellow-700 border-yellow-200': selectedInvoice.status === 'sent',
                'bg-red-50 text-red-700 border-red-200': selectedInvoice.status === 'cancelled',
                'bg-gray-50 text-gray-700 border-gray-200': selectedInvoice.status === 'draft'
              }"
            >
              {{ selectedInvoice.status }}
            </span>
          </div>

          <div class="flex items-center gap-2 justify-end">
            <!-- Generate CN -->
            <button
              *ngIf="selectedInvoice.status !== 'cancelled'"
              (click)="generateCreditNote()"
              class="px-3 py-1.5 text-xs font-bold uppercase text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-1.5 border border-primary-200 shadow-sm whitespace-nowrap"
              title="Generate Credit Note"
            >
              <i class="bi bi-receipt-cutoff"></i>
              <span>Issue CN</span>
            </button>
            <!-- Print -->
            <button
              (click)="printInvoice()"
              class="p-1.5 text-gray-500 hover:text-[#2563eb] hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
              title="Print Invoice"
            >
              <i class="bi bi-printer text-lg"></i>
            </button>
            <!-- WhatsApp -->
            <button
              (click)="sendWhatsApp()"
              class="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
              title="Send via WhatsApp"
            >
              <i class="bi bi-whatsapp text-lg"></i>
            </button>
            <!-- More actions dropdown -->
            <div class="relative">
              <button
                (click)="showActionMenu = !showActionMenu"
                class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              >
                <i class="bi bi-three-dots-vertical text-lg"></i>
              </button>
              @if (showActionMenu) {
                <div
                  class="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-44"
                >
                  <button
                    *ngIf="!isWebsiteTab"
                    (click)="showCreateModal = true; showActionMenu = false"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <i class="bi bi-pencil text-gray-400"></i>
                    Edit Invoice
                  </button>
                  <button
                    (click)="downloadInvoice(); showActionMenu = false"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <i class="bi bi-download text-gray-400"></i>
                    Download PDF
                  </button>
                  <hr class="my-1 border-gray-100" />
                  <button
                    (click)="generateCreditNote(); showActionMenu = false"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <i class="bi bi-receipt text-primary-400"></i>
                    Generate CN
                  </button>
                  <hr *ngIf="!isWebsiteTab" class="my-1 border-gray-100" />
                  <button
                    *ngIf="!isWebsiteTab"
                    (click)="deleteInvoice(); showActionMenu = false"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <i class="bi bi-trash text-red-400"></i>
                    Delete Invoice
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <!-- Customer Section -->
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl shrink-0"
            >
              {{ selectedInvoice.customerName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-base font-bold text-gray-900">
                {{ selectedInvoice.customerName }}
              </div>
              <div class="text-sm text-gray-500">{{ selectedInvoice.customerPhone }}</div>
              <div class="text-xs text-gray-400" *ngIf="selectedInvoiceExt?.customerEmail">{{ selectedInvoiceExt?.customerEmail }}</div>
            </div>
          </div>

          <!-- Shipping Address + Order Status (website orders only) -->
          <div *ngIf="isWebsiteTab && selectedInvoiceExt?.shippingAddress" class="mb-6">
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
              <div class="flex items-center gap-2 mb-2">
                <i class="bi bi-truck text-primary-500"></i>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Shipping Details</span>
              </div>
              <p class="text-gray-700" *ngIf="selectedInvoiceExt?.shippingAddress?.addressLine1">
                {{ selectedInvoiceExt?.shippingAddress?.addressLine1 }}
                <span *ngIf="selectedInvoiceExt?.shippingAddress?.addressLine2">, {{ selectedInvoiceExt?.shippingAddress?.addressLine2 }}</span>
              </p>
              <p class="text-gray-600 text-xs" *ngIf="selectedInvoiceExt?.shippingAddress?.city">
                {{ selectedInvoiceExt?.shippingAddress?.city }}, {{ selectedInvoiceExt?.shippingAddress?.state }} {{ selectedInvoiceExt?.shippingAddress?.postalCode }}
              </p>
              <div class="flex items-center gap-4 pt-2 border-t border-gray-200 mt-2">
                <div>
                  <span class="text-xs text-gray-400">Order Status</span>
                  <span class="ml-2 px-2 py-0.5 text-xs font-bold rounded-full"
                    [class.bg-green-100]="selectedInvoiceExt?.orderStatus === 'delivered'"
                    [class.text-green-700]="selectedInvoiceExt?.orderStatus === 'delivered'"
                    [class.bg-primary-100]="selectedInvoiceExt?.orderStatus === 'shipped'"
                    [class.text-primary-700]="selectedInvoiceExt?.orderStatus === 'shipped'"
                    [class.bg-yellow-100]="selectedInvoiceExt?.orderStatus === 'pending' || selectedInvoiceExt?.orderStatus === 'confirmed'"
                    [class.text-yellow-700]="selectedInvoiceExt?.orderStatus === 'pending' || selectedInvoiceExt?.orderStatus === 'confirmed'"
                  >{{ (selectedInvoiceExt?.orderStatus || 'pending') | titlecase }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Proof (website orders) -->
          <div *ngIf="isWebsiteTab && selectedInvoiceExt?.paymentDetails" class="mb-6">
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Proof</h4>
              </div>
              <div class="divide-y divide-gray-50">
                <div class="px-4 py-2.5 flex justify-between gap-4" *ngIf="selectedInvoiceExt?.paymentDetails?.razorpayPaymentId">
                  <span class="text-xs text-gray-500 whitespace-nowrap">Payment ID</span>
                  <span class="text-xs font-mono font-medium text-gray-900 break-all text-right">{{ selectedInvoiceExt?.paymentDetails?.razorpayPaymentId }}</span>
                </div>
                <div class="px-4 py-2.5 flex justify-between gap-4" *ngIf="selectedInvoiceExt?.paymentDetails?.razorpayOrderId">
                  <span class="text-xs text-gray-500 whitespace-nowrap">Order ID</span>
                  <span class="text-xs font-mono font-medium text-gray-900 break-all text-right">{{ selectedInvoiceExt?.paymentDetails?.razorpayOrderId }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Services Section -->
          <div class="mb-8">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Services
            </h4>
            <div class="space-y-4">
              @for (item of selectedInvoice.items; track $index) {
                <div class="flex justify-between items-start group">
                  <div class="flex gap-3">
                    <div class="w-1 h-full min-h-[2rem] rounded-full bg-primary-500"></div>
                    <!-- Colored vertical bar -->
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ item.productName || item.name }}
                      </div>
                      <div class="text-xs text-gray-400">
                        by {{ selectedInvoice.employeeName || 'Admin' }}
                      </div>
                    </div>
                  </div>
                  <div class="text-sm font-medium text-gray-900">₹{{ item.total | number }}</div>
                </div>
              }
            </div>
          </div>

          <div class="h-px bg-primary-100 my-6"></div>

          <!-- Summary Section -->
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Sub total</span>
              <span class="font-medium text-gray-900"
                >₹{{ selectedInvoice.subtotal | number }}</span
              >
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Discount</span>
              <span class="font-medium text-gray-900"
                >₹{{ selectedInvoice.discount | number }}</span
              >
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Rounding off</span>
              <span class="font-medium text-gray-900">₹0</span>
            </div>
          </div>

          <div class="bg-blue-100 p-4 rounded-xl">
            <div class="flex justify-between items-baseline mb-1">
              <span class="text-sm font-medium text-primary-900">Total amount</span>
              <span class="text-2xl font-bold text-[#2563eb]"
                >₹{{ selectedInvoice.total | number }}</span
              >
            </div>
            <div class="text-xs text-primary-600 text-right">
              Payment Method: {{ selectedInvoice.paymentMethod | uppercase }}
            </div>
          </div>
        </div>
      </div>

      <div
        *ngIf="!selectedInvoice"
        class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8 no-print h-full sticky top-0"
      >
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <i class="bi bi-receipt text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-gray-900 font-medium mb-1">No invoice selected</h3>
        <p class="text-gray-500 text-sm">Select an invoice from the list to view details.</p>
      </div>
    </div>

    <!-- Hidden Printable Component - Visible ONLY during print -->
    <div class="hidden print-only">
      <app-invoice-print *ngIf="selectedInvoice" [invoice]="selectedInvoice"></app-invoice-print>
    </div>

    <app-create-invoice
      *ngIf="showCreateModal"
      (close)="closeCreateModal()"
      (invoiceCreated)="onInvoiceCreated()"
    ></app-create-invoice>

    <style>
      /* Custom Scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d1d5db;
      }

      @media print {
        @page {
          size: auto;
          margin: 0;
        }
        body {
          background: white;
          -webkit-print-color-adjust: exact;
        }

        /* Hide everything that shouldn't be printed */
        .no-print,
        .invoice-detail-panel {
          display: none !important;
        }

        /* Show the print template */
        .print-only {
          display: block !important;
          visibility: visible !important;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
        }
      }
    </style>
  `,
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  isLoading = true;
  userShopId: string | undefined;
  showCreateModal = false;
  selectedInvoice: Invoice | null = null;
  searchQuery = '';
  showActionMenu = false;
  isWebsiteTab = false;
  targetInvoiceId: string | null = null;

  timeFilterOptions = [
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'This Year', value: 'year' },
  ];
  selectedTimeFilter = '30';

  constructor(
    private invoiceService: InvoiceService,
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private printService: PrintService,
    private http: HttpClient
  ) {}

  get filteredInvoices(): Invoice[] {
    if (!this.searchQuery.trim()) {
      return this.invoices;
    }
    const query = this.searchQuery.toLowerCase();
    return this.invoices.filter(
      (invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        invoice.customerName?.toLowerCase().includes(query) ||
        invoice.customerPhone?.toLowerCase().includes(query),
    );
  }

  /** Expose selectedInvoice as a plain `any` so templates can access extended fields */
  get selectedInvoiceExt(): any {
    return this.selectedInvoice;
  }

  ngOnInit() {
    this.isWebsiteTab = this.router.url.includes('/invoices/website');

    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.userShopId = user.shopId;
        this.loadInvoices();
      } else {
        // Check parent route if shopId not found (common in nested routing)
        const shopIdFromRoute = this.route.parent?.snapshot.paramMap.get('shopId');
        if (shopIdFromRoute) {
          this.userShopId = shopIdFromRoute;
          this.loadInvoices();
        }
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'create') {
        this.showCreateModal = true;
      }
      if (params['invoiceId']) {
        this.targetInvoiceId = params['invoiceId'];
        if (this.invoices.length > 0) {
          this.trySelectTargetInvoice();
        }
      }
    });
  }

  private trySelectTargetInvoice() {
    if (!this.targetInvoiceId) return;
    const target = this.invoices.find(inv => inv.id === this.targetInvoiceId);
    if (target) {
      this.selectedInvoice = target;
      // Clear target after selecting so it doesn't re-trigger incorrectly on generic updates
      this.targetInvoiceId = null; 
    }
  }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && ('seconds' in value || '_seconds' in value)) {
      return new Date((value.seconds || value._seconds) * 1000);
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  normalizeOrderToInvoice(order: any): Invoice {
    const orderDate = this.toDate(order.createdAt) || new Date();
    const addr = order.shippingAddress || {};
    return {
      id: order.id,
      shopId: order.shopId,
      customerId: order.customerId,
      customerName: addr.name || addr.fullName || order.customerName || 'Online Customer',
      customerPhone: addr.phone || addr.phoneNumber || order.customerPhone || 'N/A',
      customerEmail: addr.email || order.customerEmail || '',
      invoiceNumber: `WEB-${order.id.slice(-8).toUpperCase()}`,
      invoiceDate: orderDate,
      date: orderDate,
      items: (order.products || order.items || []).map((p: any) => ({
        productId: p.productId,
        productName: p.productName || 'Product',
        quantity: p.quantity,
        unitPrice: p.price,
        total: (p.total != null ? p.total : p.price * p.quantity),
        variantDetails: p.variant ? { size: p.variant.size, color: p.variant.color } : undefined
      })),
      subtotal: order.totalAmount,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod || 'online',
      paymentStatus: order.paymentStatus || 'pending',
      orderStatus: order.orderStatus || 'pending',
      paidAmount: order.paymentStatus === 'paid' ? order.totalAmount : 0,
      status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
      createdAt: orderDate,
      updatedAt: this.toDate(order.updatedAt) || new Date(),
      employeeName: 'Website',
      employeeRole: 'Online Store',
      sentVia: [],
      shippingAddress: addr,
      paymentDetails: (order as any).paymentDetails
    } as any;
  }

  loadInvoices() {
    this.isLoading = true;
    if (!this.userShopId) return;

    if (this.isWebsiteTab) {
      this.orderService.getOrdersByShop(this.userShopId).subscribe({
        next: (res) => {
          this.invoices = (res.data || []).map((order: any) => this.normalizeOrderToInvoice(order));
          // Sort latest first using createdAt
          this.invoices.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0);
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0);
            return timeB - timeA;
          });
          this.isLoading = false;
          
          if (this.targetInvoiceId) {
            this.trySelectTargetInvoice();
          } else if (this.invoices.length > 0 && window.innerWidth >= 768) {
            // Select first invoice by default if desktop
            this.selectedInvoice = this.invoices[0];
          }
        },
        error: (err) => {
          console.error('Error loading website invoices/orders:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.invoiceService.getInvoicesByShop(this.userShopId).subscribe({
        next: (res) => {
          this.invoices = res.data.map((inv: any) => {
            let parsedInvoiceDate = null;
            if (inv.invoiceDate?._seconds) {
              parsedInvoiceDate = new Date(inv.invoiceDate._seconds * 1000);
            } else if (inv.invoiceDate) {
              parsedInvoiceDate = new Date(inv.invoiceDate);
            }

            let parsedDate = null;
            if (inv.date?._seconds) {
              parsedDate = new Date(inv.date._seconds * 1000);
            } else if (inv.date) {
              parsedDate = new Date(inv.date);
            }

            return {
              ...inv,
              invoiceDate: parsedInvoiceDate,
              date: parsedDate,
            };
          });
          // Sort latest first using createdAt for exact time precision
          this.invoices.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0);
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0);
            return timeB - timeA;
          });
          this.isLoading = false;
          
          if (this.targetInvoiceId) {
            this.trySelectTargetInvoice();
          } else if (this.invoices.length > 0 && window.innerWidth >= 768) {
            // Select first invoice by default if desktop
            this.selectedInvoice = this.invoices[0];
          }
        },
        error: (err) => {
          console.error('Error loading invoices:', err);
          this.isLoading = false;
        },
      });
    }
  }

  onInvoiceCreated() {
    this.closeCreateModal();
    this.loadInvoices();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    // Remove query param
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null },
      queryParamsHandling: 'merge'
    });
  }

  selectInvoice(invoice: Invoice) {
    this.selectedInvoice = invoice;
  }

  /**
   * Opens the dedicated print page in a new tab.
   * That page loads the full invoice+shop data, then auto-triggers window.print()
   * after everything is ready — eliminating the race condition of printing before data loads.
   */
  printInvoice() {
    if (!this.selectedInvoice) return;
    this.printService.openPreview(this.selectedInvoice);
  }

  /** Download PDF == open the print page (browser can save as PDF from there) */
  downloadInvoice() {
    this.printInvoice();
  }

  sendWhatsApp() {
    if (!this.selectedInvoice) return;
    const phone = this.selectedInvoice.customerPhone?.replace(/\D/g, '');
    if (!phone) {
      this.toastService.showWarning('No phone number available for this customer.');
      return;
    }

    this.toastService.showSuccess('Sending WhatsApp message...');
    
    this.http.post<any>(`${environment.apiUrl}/invoices/${this.selectedInvoice.id}/send-whatsapp`, {}).subscribe({
      next: () => {
        this.toastService.showSuccess('WhatsApp message sent successfully!');
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to send WhatsApp message. Please check your wallet credits.';
        this.toastService.showError(msg);
      }
    });
  }

  async deleteInvoice() {
    if (!this.selectedInvoice?.id || !this.userShopId) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Invoice?',
      description: `Are you sure you want to delete invoice <strong>${this.selectedInvoice.invoiceNumber}</strong>?<br><br>This action cannot be undone.`,
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.invoiceService
      .deleteInvoice(this.selectedInvoice.id)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.selectedInvoice = null;
        this.loadInvoices();
      });
  }

  generateCreditNote() {
    if (!this.selectedInvoice?.id || !this.userShopId) return;
    
    this.router.navigate(['../../credit-notes'], {
      relativeTo: this.route,
      queryParams: {
        invoiceId: this.selectedInvoice.invoiceNumber,
        orderId: (this.selectedInvoice as any).orderId || this.selectedInvoice.id,
        customerId: this.selectedInvoice.customerId,
        customerName: this.selectedInvoice.customerName,
        customerPhone: this.selectedInvoice.customerPhone,
        customerEmail: this.selectedInvoice.customerEmail,
        amount: this.selectedInvoice.total
      }
    });
  }
}
