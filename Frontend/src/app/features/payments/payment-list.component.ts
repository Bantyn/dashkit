import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentService, PaymentTransaction } from '../../core/services/payment.service';
import { OrderService } from '../../core/services/order.service';

import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-payment-list',
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Transaction List -->
      <div
        class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900">Payments &amp; Transactions</h2>
          <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
            {{ filteredTransactions.length }} records
          </span>
        </div>

        <!-- Search + Stats bar -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by customer, method or status..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <!-- Summary Chips -->
        <div class="px-4 pt-3 pb-1 flex justify-end gap-2 bg-white shrink-0">
          <span
            class="text-xs px-5 py-2 bg-green-50 text-green-700  rounded-full font-semibold"
          >
            <i class="bi bi-check-circle"></i> {{ successCount }} Success
          </span>
          <span
            class="text-xs px-5 py-2 bg-yellow-50 text-yellow-700  rounded-full font-semibold"
          >
            <i class="bi bi-clock"></i> {{ pendingCount }} Pending
          </span>
          <span
            class="text-xs px-5 py-2 bg-red-50 text-red-700   rounded-full font-semibold"
          >
            <i class="bi bi-x-circle"></i> {{ failedCount }} Failed
          </span>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Method</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading payments...</span>
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
                } @else if (filteredTransactions.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      @if (transactions.length === 0) {
                        No payment records found.
                      } @else {
                        No records match your search.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (txn of filteredTransactions; track txn.id) {
                    <tr
                      (click)="selectTransaction(txn)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedTransaction?.id === txn.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0"
                          >
                            {{ txn.customerName ? txn.customerName.charAt(0).toUpperCase() : '?' }}
                          </div>
                          <div>
                            <div
                              class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors"
                            >
                              {{ txn.customerName || 'Unknown' }}
                            </div>
                            <div class="text-xs text-gray-400 font-mono">
                              ORD-{{ txn.orderId | slice: -6 | uppercase }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-bold text-gray-900">
                        ₹{{ txn.amount | number }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold uppercase tracking-wider"
                        >
                          {{ txn.method }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [class]="getStatusClass(txn.status)"
                          class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        >
                          {{ txn.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-500 hidden lg:table-cell">
                        {{ toDate(txn.date) | date: 'mediumDate' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Transaction Detail (flex sibling — scrolls independently) -->
      @if (selectedTransaction) {
        <div
          class="w-[42%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col overflow-hidden"
        >
          <!-- Header -->
          <div
            class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50"
          >
            <div>
              <h3 class="text-lg font-bold text-gray-900">Transaction Details</h3>
              <p class="text-xs font-mono text-gray-400 mt-0.5">{{ selectedTransaction.id }}</p>
            </div>
            <button
              (click)="closeDetail()"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Customer Card -->
            <div
              class="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-xl flex-col text-center"
            >
              <div
                class="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-2xl shadow-inner"
              >
                {{
                  selectedTransaction.customerName
                    ? selectedTransaction.customerName.charAt(0).toUpperCase()
                    : '?'
                }}
              </div>
              <div>
                <div class="text-xl font-bold text-gray-900">
                  {{ selectedTransaction.customerName || 'Unknown' }}
                </div>
              </div>
              <div class="flex w-full mt-2 border-t border-gray-100 pt-4 divide-x divide-gray-100">
                <div class="flex-1">
                  <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</div>
                  <div class="text-lg font-bold text-primary-600">
                    ₹{{ selectedTransaction.amount | number }}
                  </div>
                </div>
                <div class="flex-1">
                  <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
                  <span
                    [class]="getStatusClass(selectedTransaction.status)"
                    class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mt-1"
                  >
                    {{ selectedTransaction.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Transaction Info -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Transaction Info
                </h4>
              </div>
              <div class="divide-y divide-gray-50">
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Method</span>
                  <span class="text-sm font-semibold text-gray-900 uppercase">{{
                    selectedTransaction.method
                  }}</span>
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Linked Order</span>
                  <span class="text-xs font-mono font-semibold text-primary-600"
                    >ORD-{{ selectedTransaction.orderId | slice: -8 | uppercase }}</span
                  >
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Date &amp; Time</span>
                  <span class="text-sm font-medium text-gray-900">{{
                    toDate(selectedTransaction.date) | date: 'medium'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Proof (If available) -->
            @if (selectedTransaction.paymentDetails) {
              <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div class="px-4 py-3 border-b border-gray-100">
                  <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Payment Proofs
                  </h4>
                </div>
                <div class="divide-y divide-gray-50">
                  @if (selectedTransaction.paymentDetails.razorpayPaymentId) {
                    <div class="px-4 py-3 flex justify-between gap-4">
                      <span class="text-sm text-gray-500 whitespace-nowrap">Payment ID</span>
                      <span class="text-xs font-mono font-medium text-gray-900 break-all text-right">{{ selectedTransaction.paymentDetails.razorpayPaymentId }}</span>
                    </div>
                  }
                  @if (selectedTransaction.paymentDetails.razorpayOrderId) {
                    <div class="px-4 py-3 flex justify-between gap-4">
                      <span class="text-sm text-gray-500 whitespace-nowrap">Order ID</span>
                      <span class="text-xs font-mono font-medium text-gray-900 break-all text-right">{{ selectedTransaction.paymentDetails.razorpayOrderId }}</span>
                    </div>
                  }
                  @if (selectedTransaction.paymentDetails.offlineTransactionId) {
                    <div class="px-4 py-3 flex justify-between gap-4">
                      <span class="text-sm text-gray-500 whitespace-nowrap">Txn ID</span>
                      <span class="text-xs font-mono font-medium text-gray-900 break-all text-right">{{ selectedTransaction.paymentDetails.offlineTransactionId }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Amount Breakdown -->
            <div class="bg-gray-900 rounded-xl p-5 text-white flex justify-between items-center">
              <div>
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Amount</div>
                <div class="text-2xl font-black">₹{{ selectedTransaction.amount | number }}</div>
              </div>
              <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <i class="bi bi-credit-card text-lg text-white"></i>
              </div>
            </div>

            <!-- Status Badges -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</h4>
              </div>
              <div class="p-4 flex gap-2 flex-wrap">
                @for (s of ['success', 'pending', 'failed', 'refunded']; track s) {
                  <button
                    (click)="updatePaymentStatus(selectedTransaction, s)"
                    [disabled]="selectedTransaction.status === s"
                    [class]="getStatusClass(s)"
                    class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-55 hover:ring-2 hover:ring-gray-300"
                    [class.ring-2]="selectedTransaction.status === s"
                    [class.ring-offset-1]="selectedTransaction.status === s"
                    >{{ s === 'success' ? 'paid' : s }}</button
                  >
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div
          class="hidden md:flex flex-col items-center justify-center w-[42%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 text-center p-8"
        >
          <div class="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-credit-card text-2xl text-violet-400"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No transaction selected</h3>
          <p class="text-gray-500 text-sm">
            Select a transaction from the list to view its details.
          </p>
        </div>
      }
    </div>
  `,
})
export class PaymentListComponent implements OnInit {
  transactions: PaymentTransaction[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  selectedTransaction: PaymentTransaction | null = null;

  constructor(
    private paymentService: PaymentService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  updatePaymentStatus(txn: PaymentTransaction, status: string) {
    const backendStatus = status === 'success' ? 'paid' : status;
    this.orderService.updatePaymentStatus(txn.orderId, backendStatus).subscribe({
      next: () => {
        txn.status = status as any;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update payment status:', err);
      }
    });
  }

  get filteredTransactions(): PaymentTransaction[] {
    if (!this.searchQuery.trim()) return this.transactions;
    const query = this.searchQuery.toLowerCase();
    return this.transactions.filter(
      (t) =>
        t.customerName?.toLowerCase().includes(query) ||
        t.method?.toLowerCase().includes(query) ||
        t.status?.toLowerCase().includes(query),
    );
  }

  get successCount() {
    return this.transactions.filter((t) => t.status === 'success').length;
  }
  get pendingCount() {
    return this.transactions.filter((t) => t.status === 'pending').length;
  }
  get failedCount() {
    return this.transactions.filter((t) => t.status === 'failed').length;
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.loadPayments();
    });
  }

  loadPayments() {
    this.loading = true;
    if (!this.shopId) return;
    this.paymentService.getPaymentsByShop(this.shopId).subscribe({
      next: (response) => {
        this.transactions = response.data;
        // Sort latest first
        this.transactions.sort((a, b) => {
          const timeA = a.date ? new Date(a.date).getTime() : 0;
          const timeB = b.date ? new Date(b.date).getTime() : 0;
          return timeB - timeA;
        });
        
        this.loading = false;
        if (this.transactions.length > 0 && window.innerWidth >= 768) {
          this.selectTransaction(this.transactions[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.error = 'Failed to load payments.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectTransaction(txn: PaymentTransaction) {
    this.selectedTransaction = txn;
  }

  closeDetail() {
    this.selectedTransaction = null;
  }

  /** Safely convert Firestore Timestamp / plain object / string to Date */
  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && 'seconds' in value) return new Date(value.seconds * 1000);
    if (typeof value === 'object' && '_seconds' in value) return new Date(value._seconds * 1000);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
