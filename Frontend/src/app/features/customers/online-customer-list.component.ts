import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CustomerService, Customer } from '../../core/services/customer.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { Invoice } from '../../core/models/invoice.model';
import { InvoicePrintComponent } from '../../shared/components/invoice-print.component';
import * as XLSX from 'xlsx';

import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-online-customer-list',
  imports: [CommonModule, InvoicePrintComponent, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Customer List -->
      <div
        class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300 no-print"
      >
        <div
          class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900">Online Customers</h2>
          <div class="flex items-center gap-3">
            <button
              (click)="exportToExcel()"
              class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <i class="bi bi-download"></i>
              <span class="text-sm">Export</span>
            </button>
          </div>
        </div>

        <div class="p-4 flex gap-4 bg-white shrink-0">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search online customers by name, phone or email..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Contact</th>
                  <th class="px-6 py-3 text-center">Orders</th>
                  <th class="px-6 py-3">Total Spent</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Last Active</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading online customers...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error) {
                  <tr>
                    <td colspan="5" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                        {{ error }}
                      </div>
                    </td>
                  </tr>
                } @else if (filteredCustomers.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      @if (customers.length === 0) {
                        No online customers found yet.
                      } @else {
                        No online customers match your search.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (customer of filteredCustomers; track customer.id) {
                    <tr
                      (click)="selectCustomer(customer)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedCustomer?.id === customer.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0"
                          >
                            {{ customer.name ? customer.name.charAt(0) : '?' }}
                          </div>
                          <div
                            class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors"
                          >
                            {{ customer.name || 'Unknown' }}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600">
                        {{ customer.phoneNumber || 'N/A' }}
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span
                          class="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                        >
                          {{ customer.totalOrders }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{{ customer.totalSpent }}
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-500 hidden lg:table-cell">
                        {{ toDate(customer.lastPurchase) | date: 'mediumDate' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Customer Detail & Invoices -->
      <div
        class="w-[40%] min-w-[350px] max-w-[500px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0"
        *ngIf="selectedCustomer"
      >
        <!-- Detail Header -->
        <div
          class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50"
        >
          <div>
            <h3 class="text-lg font-bold text-gray-900">Customer Details</h3>
          </div>
          <button
            (click)="closeDetail()"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors md:hidden"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
          <!-- Customer Info Card -->
          <div
            class="flex items-center gap-4 mb-8 p-4 bg-white border border-gray-100 shadow-sm rounded-xl text-center flex-col"
          >
            <div
              class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mx-auto shadow-inner"
            >
              {{ selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : '?' }}
            </div>
            <div>
              <div class="text-xl font-bold text-gray-900">
                {{ selectedCustomer.name || 'Unknown' }}
              </div>
              <div class="text-sm text-gray-500 mt-1 flex justify-center items-center gap-4">
                <span
                  ><i class="bi bi-telephone-fill"></i>
                  {{ selectedCustomer.phoneNumber || 'N/A' }}</span
                >
                <span *ngIf="selectedCustomer.email"
                  ><i class="bi bi-envelope-fill"></i> {{ selectedCustomer.email }}</span
                >
              </div>
            </div>
            <div class="flex w-full mt-4 border-t border-gray-100 pt-4 divide-x divide-gray-100">
              <div class="flex-1">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Spent</div>
                <div class="text-lg font-bold text-primary-600">
                  ₹{{ selectedCustomer.totalSpent }}
                </div>
              </div>
              <div class="flex-1">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Orders</div>
                <div class="text-lg font-bold text-gray-900">
                  {{ selectedCustomer.totalOrders }}
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Invoices List -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Purchase History
              </h4>
              <span class="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium"
                >{{ customerInvoices.length }} Orders</span
              >
            </div>

            @if (loadingInvoices) {
              <div class="flex flex-col items-center justify-center py-10 gap-3">
                <app-ui-loading size="sm"></app-ui-loading>
                <p class="text-xs text-gray-500 font-medium pt-2">Fetching history...</p>
              </div>
            } @else if (customerInvoices.length === 0) {
              <div
                class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200"
              >
                <i class="bi bi-receipt text-3xl text-gray-300"></i>
                <p class="text-gray-500 mt-2 text-sm font-medium">No purchase history found.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (inv of customerInvoices; track inv.id) {
                  <div
                    class="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all group"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-bold text-gray-900">{{ inv.invoiceNumber }}</span>
                      <span
                        [class]="getStatusClass(inv.status)"
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      >
                        {{ inv.status }}
                      </span>
                    </div>
                    <div class="flex justify-between items-end">
                      <div>
                        <p class="text-xs text-gray-500">
                          {{ toDate(inv.createdAt) | date: 'mediumDate' }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1 capitalize">
                          {{ inv.paymentMethod }} Method
                        </p>
                      </div>
                      <div class="text-right flex flex-col items-end gap-2">
                        <p class="text-sm font-bold text-gray-900">₹{{ inv.total | number }}</p>
                        <button
                          (click)="printInvoice(inv)"
                          class="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i class="bi bi-printer"></i> Print
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <div
        *ngIf="!selectedCustomer"
        class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[350px] max-w-[500px] bg-white border-l border-gray-200 text-center p-8 no-print h-full sticky top-0"
      >
        <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <i class="bi bi-globe text-2xl text-blue-400"></i>
        </div>
        <h3 class="text-gray-900 font-medium mb-1">No customer selected</h3>
        <p class="text-gray-500 text-sm">
          Select an online customer from the list to view their purchase history.
        </p>
      </div>

      <!-- Hidden Print Area -->
      <div class="print-only hidden" *ngIf="isPrinting && printingInvoice">
        <app-invoice-print [invoice]="printingInvoice"></app-invoice-print>
      </div>
    </div>

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
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
          visibility: visible !important;
        }
        body {
          background: white !important;
        }
      }
    </style>
  `,
})
export class OnlineCustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';

  // Detail View State
  loadingInvoices = false;
  selectedCustomer: Customer | null = null;
  customerInvoices: Invoice[] = [];
  isPrinting = false;
  printingInvoice: Invoice | null = null;

  constructor(
    private customerService: CustomerService,
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredCustomers(): Customer[] {
    // START FILTER: Online customers (source='online' OR has userId)
    let filtered = this.customers.filter((c) => c.source === 'online' || !!c.userId);
    // END FILTER

    if (!this.searchQuery.trim()) {
      return filtered;
    }
    const query = this.searchQuery.toLowerCase();
    return filtered.filter(
      (customer) =>
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.phoneNumber && customer.phoneNumber.includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query)),
    );
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) {
        this.loadCustomers();
      }
    });
  }

  loadCustomers() {
    this.loading = true;
    if (!this.shopId) return;

    this.customerService.getCustomersByShop(this.shopId).subscribe({
      next: (response) => {
        this.customers = response.data;
        this.loading = false;
        // Select first customer by default if desktop
        if (this.customers.length > 0 && window.innerWidth >= 768) {
          const onlineCustomers = this.filteredCustomers;
          if (onlineCustomers.length > 0) {
            this.selectCustomer(onlineCustomers[0]);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.error = 'Failed to load customers.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Reuse existing logic from CustomerList
  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.loadingInvoices = true;
    this.customerInvoices = [];

    this.invoiceService.getInvoicesByCustomer(customer.id!).subscribe({
      next: (response) => {
        this.customerInvoices = response.data;
        this.loadingInvoices = false;
      },
      error: (err) => {
        console.error('Error fetching customer invoices:', err);
        this.loadingInvoices = false;
      },
    });
  }

  printInvoice(invoice: Invoice) {
    this.printingInvoice = invoice;
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
    }, 100);
  }

  closeDetail() {
    this.selectedCustomer = null;
    this.customerInvoices = [];
  }

  exportToExcel() {
    const list = this.filteredCustomers;
    if (list.length === 0) return;

    const data = list.map((customer) => ({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      email: customer.email || 'N/A',
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      lastPurchase: customer.lastPurchase
        ? new Date(customer.lastPurchase).toLocaleDateString()
        : 'N/A',
      source: 'Online Store',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Online Customers');
    XLSX.writeFile(workbook, `online_customers_export_${new Date().getTime()}.xlsx`);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'partial':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
}
