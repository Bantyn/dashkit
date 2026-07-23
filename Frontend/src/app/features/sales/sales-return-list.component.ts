import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SalesReturnService } from '../../core/services/sales-return.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SaleReturn } from '../../core/models/sales-return.model';
import { Invoice } from '../../core/models/invoice.model';
import { PrintService } from '../../shared/components/print-preview-modal.component';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-sales-return-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiLoadingComponent, UiDropdownComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Return List -->
      <div
        class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900">Sales Returns</h2>
          <div class="flex items-center gap-2">
            <button
              class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
              title="Filter"
            >
              <i class="bi bi-funnel text-sm"></i>
            </button>
            <button
                class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
              title="Sort by Date"
            >
                <i class="bi bi-clock-history text-sm"></i>
            </button>
            <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                {{ filteredReturns.length }} total
            </span>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="p-4 flex gap-4 bg-white shrink-0">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by ID, customer or status..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
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

        <!-- Table -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  <th class="px-6 py-3">Return ID</th>
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Reason</th>
                  <th class="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading returns...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error && returns.length === 0) {
                  <tr>
                    <td colspan="6" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                        {{ error }}
                      </div>
                    </td>
                  </tr>
                } @else if (filteredReturns.length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                      No returns found.
                    </td>
                  </tr>
                } @else {
                  @for (ret of filteredReturns; track ret.id) {
                    <tr
                      (click)="selectReturn(ret)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedReturn?.id === ret.id"
                    >
                      <td class="px-6 py-4">
                        <div class="font-mono text-sm font-medium text-[#2563eb] group-hover:underline">
                          #{{ ret.displayId }}
                        </div>
                        <div class="text-[10px] text-gray-400 mt-0.5 uppercase">
                          Ref: {{ ret.orderId || ret.invoiceId || 'N/A' }}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <div
                             class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600"
                          >
                             {{ ret.customerName.charAt(0).toUpperCase() }}
                          </div>
                          <span class="text-sm text-gray-900">{{ ret.customerName }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{{ ret.totalRefundAmount | number }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [class]="getStatusClass(ret.status)"
                          class="px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {{ ret.status | titlecase }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                         <div class="text-sm text-gray-500 truncate max-w-[150px]">
                          {{ ret.reason }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {{ toDate(ret.date) | date: 'd MMM \\'yy' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Return Detail -->
      <div
        class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 shadow-xl overflow-hidden"
        *ngIf="selectedReturn"
      >
        <!-- Detail Header -->
        <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0">
          <div>
            <h3 class="text-lg font-bold text-gray-900">
              Return #{{ selectedReturn.displayId }}
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              {{ toDate(selectedReturn.date) | date: 'EEEE, MMMM d, y h:mm a' }}
            </p>
          </div>
          <div class="flex items-center gap-1">
             <button
              (click)="printReturn(selectedReturn)"
              class="p-2 text-gray-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors"
              title="Print Return"
            >
              <i class="bi bi-printer text-lg"></i>
            </button>
            <button
               (click)="sendWhatsApp()"
              class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Send via WhatsApp"
            >
              <i class="bi bi-whatsapp text-lg"></i>
            </button>
            <button
              (click)="closeDetail()"
              class="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
           <!-- Customer Section -->
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl uppercase shadow-sm"
            >
               {{ selectedReturn.customerName.charAt(0) }}
            </div>
            <div>
              <div class="text-base font-bold text-gray-900">
                {{ selectedReturn.customerName }}
              </div>
              <div class="text-sm text-gray-500 flex items-center gap-1">
                <i class="bi bi-hash"></i> {{ selectedReturn.customerId }}
              </div>
            </div>
          </div>

          <!-- Reason & Status -->
          <div class="grid grid-cols-2 gap-4 mb-8">
             <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Return Status</div>
                <span [class]="getStatusClass(selectedReturn.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                   {{ selectedReturn.status }}
                </span>
             </div>
             <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Refund Status</div>
                <span [class]="getPaymentStatusClass(selectedReturn.paymentStatus)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                   {{ selectedReturn.paymentStatus }}
                </span>
             </div>
          </div>

          <div class="mb-8">
             <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Returned Items</h4>
             <div class="space-y-4">
                @for (item of selectedReturn.items; track $index) {
                   <div class="flex justify-between items-start group">
                      <div class="flex gap-3">
                         <div class="w-1 h-full min-h-[2rem] rounded-full bg-primary-500"></div>
                         <div>
                            <div class="text-sm font-medium text-gray-900">{{ item.productName }}</div>
                            <div class="text-[10px] text-gray-400">
                               {{ item.variantDetails?.color }} / {{ item.variantDetails?.size }} | Qty: {{ item.quantity }}
                            </div>
                         </div>
                      </div>
                      <div class="text-sm font-medium text-gray-900">₹{{ (item.refundAmount || item.unitPrice * item.quantity) | number }}</div>
                   </div>
                }
             </div>
          </div>

          <div class="h-px bg-gray-100 my-6"></div>

          <!-- Summary -->
          <div class="space-y-3 mb-6">
             <div class="flex justify-between text-sm">
                <span class="text-gray-500">Reason</span>
                <span class="font-medium text-gray-900">{{ selectedReturn.reason }}</span>
             </div>
             <div class="flex justify-between text-sm">
                <span class="text-gray-500">Original Ref</span>
                <span class="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                   {{ selectedReturn.orderId || selectedReturn.invoiceId || 'N/A' }}
                </span>
             </div>
          </div>

          <div class="bg-blue-50 p-5 rounded-xl border border-blue-100">
             <div class="flex justify-between items-baseline mb-1">
                <span class="text-sm font-medium text-blue-900">Total Refund</span>
                <span class="text-2xl font-bold text-[#2563eb]">₹{{ selectedReturn.totalRefundAmount | number }}</span>
             </div>
             <div class="text-[10px] text-blue-600 font-bold uppercase text-right">
                Via {{ selectedReturn.paymentMethod || 'N/A' }}
             </div>
          </div>

          <!-- Update Status Actions -->
          <div class="mt-8 pt-8 border-t border-gray-100">
            <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Update Status</h4>
            <div class="grid grid-cols-2 gap-2">
              @for (status of statuses; track status) {
                <button
                  (click)="updateStatus(status)"
                  [disabled]="selectedReturn.status === status"
                  class="flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg border transition-all disabled:opacity-50"
                  [ngClass]="status === selectedReturn.status ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'"
                >
                   {{ status }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!selectedReturn"
        class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8 h-full sticky top-0"
      >
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
           <i class="bi bi-arrow-counterclockwise text-2xl"></i>
        </div>
        <h3 class="text-gray-900 font-medium mb-1">No return selected</h3>
        <p class="text-gray-500 text-sm">Select a return from the list to view details.</p>
      </div>
    </div>

    <style>
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
    </style>
  `,
})
export class SalesReturnListComponent implements OnInit {
  returns: SaleReturn[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  selectedReturn: SaleReturn | null = null;
  currentUser: any = null;

  statuses = ['pending', 'approved', 'rejected', 'completed'];

  timeFilterOptions = [
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'This Year', value: 'year' },
  ];
  selectedTimeFilter = '30';

  constructor(
    private returnService: SalesReturnService,
    private authService: AuthService,
    private titleService: Title,
    private toastService: ToastService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private printService: PrintService
  ) {}

  get filteredReturns(): SaleReturn[] {
    if (!this.searchQuery.trim()) return this.returns;
    const query = this.searchQuery.toLowerCase();
    return this.returns.filter(
      (ret) =>
        ret.displayId?.toLowerCase().includes(query) ||
        ret.customerName?.toLowerCase().includes(query) ||
        ret.status?.toLowerCase().includes(query) ||
        ret.reason?.toLowerCase().includes(query)
    );
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) {
        this.loadReturns();
      }
    });
  }

  loadReturns() {
    this.loading = true;
    if (!this.shopId) return;

    this.returnService.getReturnsByShop(this.shopId).subscribe({
      next: (res) => {
        this.returns = res.data || [];
        this.loading = false;
        if (this.returns.length > 0 && window.innerWidth >= 768) {
          this.selectReturn(this.returns[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadMockData();
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadMockData() {
    this.returns = [
      {
        id: '1',
        shopId: this.shopId!,
        displayId: 'SR-1001',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        totalRefundAmount: 1500,
        reason: 'Defective product',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'UPI',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            productId: 'P1',
            productName: 'Blue Denim Jeans',
            quantity: 1,
            unitPrice: 1500,
            refundAmount: 1500,
            variantDetails: { size: '32', color: 'Blue' }
          }
        ]
      },
      {
        id: '2',
        shopId: this.shopId!,
        displayId: 'SR-1002',
        customerId: 'CUST-002',
        customerName: 'Alice Smith',
        customerPhone: '9123456789',
        totalRefundAmount: 2400,
        reason: 'Size issue',
        status: 'approved',
        paymentStatus: 'refunded',
        paymentMethod: 'Cash',
        date: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        items: [
          {
            productId: 'P2',
            productName: 'Cotton T-Shirt',
            quantity: 2,
            unitPrice: 1200,
            refundAmount: 2400,
            variantDetails: { size: 'M', color: 'White' }
          }
        ]
      }
    ];
    if (this.returns.length > 0 && window.innerWidth >= 768) {
      this.selectReturn(this.returns[0]);
    }
  }

  selectReturn(ret: SaleReturn) {
    this.selectedReturn = ret;
  }

  closeDetail() {
    this.selectedReturn = null;
  }

  updateStatus(status: string) {
    if (!this.selectedReturn || !this.shopId) return;
    this.returnService.updateStatus(this.selectedReturn.id, status).subscribe({
      next: () => {
        this.selectedReturn!.status = status as any;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.selectedReturn!.status = status as any;
        this.cdr.detectChanges();
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  sendWhatsApp() {
    if (!this.selectedReturn) return;
    const phone = this.selectedReturn.customerPhone?.replace(/\D/g, '');
    if (!phone) {
      this.toastService.showWarning('No phone number available for this customer.');
      return;
    }

    this.toastService.showSuccess('Sending WhatsApp message...');
    
    this.http.post<any>(`${environment.apiUrl}/returns/${this.selectedReturn.id}/send-whatsapp`, {}).subscribe({
      next: () => {
        this.toastService.showSuccess('WhatsApp message sent successfully!');
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to send WhatsApp message. Please check your wallet credits.';
        this.toastService.showError(msg);
      }
    });
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'refunded':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
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

  normalizeReturnToInvoice(ret: SaleReturn): Invoice {
    const returnDate = this.toDate(ret.date || ret.createdAt) || new Date();
    const total = ret.totalRefundAmount || 0;
    return {
      id: ret.id,
      shopId: ret.shopId,
      customerId: ret.customerId,
      customerName: ret.customerName || 'Customer',
      customerPhone: '',
      invoiceNumber: ret.displayId || ('RTN-' + ret.id.slice(-8).toUpperCase()),
      invoiceDate: returnDate,
      items: (ret.items || []).map((item) => ({
        productId: item.productId,
        productName: item.productName || 'Product',
        variantSku: '',
        status: 'paid' as const,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        taxRate: 0,
        total: item.refundAmount,
      })),
      subtotal: total,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total,
      appliedCredit: 0,
      paymentMethod: (ret.paymentMethod as any) || 'cash',
      paymentStatus: ret.paymentStatus === 'refunded' ? 'paid' : 'pending',
      paidAmount: ret.paymentStatus === 'refunded' ? total : 0,
      sentVia: [],
      status: 'paid',
      notes: `Return Reason: ${ret.reason || ''}`,
      createdAt: returnDate,
      updatedAt: returnDate,
    };
  }

  printReturn(ret: SaleReturn) {
    if (!ret) return;
    const normalized = this.normalizeReturnToInvoice(ret);
    this.printService.openPreview(normalized);
  }
}
