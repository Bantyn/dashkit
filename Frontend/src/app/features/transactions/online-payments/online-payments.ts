import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransactionService, TransactionEntry } from '../../../core/services/transaction.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

@Component({
  selector: 'app-online-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">

      <!-- Left Panel -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">

        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Online Payments</h2>
            <p class="text-xs text-gray-400 mt-0.5">Razorpay & digital payments via website checkout</p>
          </div>
          <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
            {{ filteredEntries.length }} records
          </span>
        </div>

        <!-- Stats Bar -->
        <div class="px-6 py-4 bg-white border-b border-gray-100 shrink-0 grid grid-cols-3 gap-3">
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <div class="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Online</div>
            <div class="text-lg font-black text-blue-700">₹{{ totalRevenue | number }}</div>
          </div>
          <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <div class="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Paid</div>
            <div class="text-lg font-black text-green-700">₹{{ paidRevenue | number }}</div>
          </div>
          <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
            <div class="text-xs text-yellow-600 font-semibold uppercase tracking-wider mb-1">Pending</div>
            <div class="text-lg font-black text-yellow-700">₹{{ pendingRevenue | number }}</div>
          </div>
        </div>

        <!-- Search + Chips -->
        <div class="px-4 py-3 bg-white shrink-0 border-b border-gray-100 flex items-center gap-3">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search customer or payment status..."
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
          <span class="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-semibold whitespace-nowrap">
            <i class="bi bi-check-circle"></i> {{ paidCount }} Paid
          </span>
          <span class="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full font-semibold whitespace-nowrap">
            <i class="bi bi-clock"></i> {{ pendingCount }} Pending
          </span>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Payment</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Order</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Proof</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="6" class="px-6 py-10 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span class="text-sm text-gray-400">Loading online payments...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error) {
                  <tr>
                    <td colspan="6" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">{{ error }}</div>
                    </td>
                  </tr>
                } @else if (filteredEntries.length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-10 text-center">
                      <div class="flex flex-col items-center gap-4">
                        <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <i class="bi bi-credit-card text-blue-300 text-xl"></i>
                        </div>
                        <span class="text-gray-400 text-sm">
                          {{ transactions.length === 0 ? 'No online payments found.' : 'No records match your search.' }}
                        </span>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (txn of filteredEntries; track txn.id) {
                    <tr
                      (click)="select(txn)"
                      class="cursor-pointer transition-colors hover:bg-blue-50/40 group"
                      [class.bg-blue-50]="selected?.id === txn.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ txn.customerName ? txn.customerName.charAt(0).toUpperCase() : '?' }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ txn.customerName }}</div>
                            <div class="text-xs text-gray-400 font-mono">ORD-{{ txn.orderId | slice:-6 | uppercase }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-bold text-gray-900">₹{{ txn.amount | number }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [class]="getPayStatusClass(txn.paymentStatus)">{{ txn.paymentStatus }}</span>
                      </td>
                      <td class="px-6 py-4 hidden lg:table-cell">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [class]="getOrdStatusClass(txn.orderStatus)">{{ txn.orderStatus }}</span>
                      </td>
                      <td class="px-6 py-4 hidden lg:table-cell">
                        <span *ngIf="txn.paymentDetails?.razorpayPaymentId"
                          class="px-2 py-0.5 bg-blue-50 text-blue-500 border border-blue-100 rounded text-[10px] font-mono">
                          <i class="bi bi-shield-check"></i> Verified
                        </span>
                        <span *ngIf="!txn.paymentDetails?.razorpayPaymentId"
                          class="text-xs text-gray-300">—</span>
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                        {{ toDate(txn.date) | date:'d MMM yy' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Detail Panel -->
      @if (selected) {
        <div class="w-[40%] min-w-[340px] max-w-[480px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Online Payment</h3>
              <p class="text-xs font-mono text-gray-400 mt-0.5">ORD-{{ selected.orderId | slice:-8 | uppercase }}</p>
            </div>
            <button (click)="selected = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-5">

            <!-- Customer Card -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm p-5 text-center">
              <div class="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl mx-auto mb-3">
                {{ selected.customerName.charAt(0).toUpperCase() }}
              </div>
              <div class="text-lg font-bold text-gray-900">{{ selected.customerName }}</div>
              <div class="text-sm text-gray-400 mt-0.5" *ngIf="selected.customerPhone">{{ selected.customerPhone }}</div>
              <div class="text-xs text-gray-400" *ngIf="selected.customerEmail">{{ selected.customerEmail }}</div>
              <div class="flex border-t border-gray-100 mt-4 pt-4 divide-x divide-gray-100">
                <div class="flex-1">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Amount</div>
                  <div class="text-xl font-black text-blue-700">₹{{ selected.amount | number }}</div>
                </div>
                <div class="flex-1">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Payment</div>
                  <span class="text-xs font-bold px-2 py-1 rounded-full inline-block mt-1" [class]="getPayStatusClass(selected.paymentStatus)">
                    {{ selected.paymentStatus }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Shipping Address -->
            <div *ngIf="selected.shippingAddress?.addressLine1 || selected.shippingAddress?.city" class="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <i class="bi bi-geo-alt text-blue-500"></i>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Address</span>
              </div>
              <p class="text-sm text-gray-700" *ngIf="selected.shippingAddress?.addressLine1">
                {{ selected.shippingAddress?.addressLine1 }}
                <span *ngIf="selected.shippingAddress?.addressLine2">, {{ selected.shippingAddress?.addressLine2 }}</span>
              </p>
              <p class="text-xs text-gray-500 mt-1" *ngIf="selected.shippingAddress?.city">
                {{ selected.shippingAddress?.city }}, {{ selected.shippingAddress?.state }} {{ selected.shippingAddress?.postalCode }}
              </p>
            </div>

            <!-- Transaction Info -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Info</h4>
              </div>
              <div class="divide-y divide-gray-50">
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Gateway</span>
                  <span class="text-sm font-semibold text-gray-900">Razorpay</span>
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Order Status</span>
                  <span class="px-2 py-0.5 text-xs font-bold rounded-full" [class]="getOrdStatusClass(selected.orderStatus)">{{ selected.orderStatus | titlecase }}</span>
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Date & Time</span>
                  <span class="text-sm font-medium text-gray-900">{{ toDate(selected.date) | date:'medium' }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Proof -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <i class="bi bi-shield-check text-blue-500 text-sm"></i>
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Proof</h4>
              </div>
              @if (selected.paymentDetails?.razorpayPaymentId || selected.paymentDetails?.razorpayOrderId) {
                <div class="divide-y divide-gray-50">
                  @if (selected.paymentDetails?.razorpayPaymentId) {
                    <div class="px-4 py-3 flex justify-between gap-4">
                      <span class="text-xs text-gray-500 whitespace-nowrap">Payment ID</span>
                      <span class="text-xs font-mono font-medium text-blue-700 break-all text-right">{{ selected.paymentDetails.razorpayPaymentId }}</span>
                    </div>
                  }
                  @if (selected.paymentDetails?.razorpayOrderId) {
                    <div class="px-4 py-3 flex justify-between gap-4">
                      <span class="text-xs text-gray-500 whitespace-nowrap">Order ID</span>
                      <span class="text-xs font-mono font-medium text-blue-700 break-all text-right">{{ selected.paymentDetails.razorpayOrderId }}</span>
                    </div>
                  }
                  @if (selected.paymentDetails?.paidAt) {
                    <div class="px-4 py-3 flex justify-between gap-4">
                      <span class="text-xs text-gray-500 whitespace-nowrap">Paid At</span>
                      <span class="text-xs font-medium text-gray-900">{{ toDate(selected.paymentDetails.paidAt) | date:'medium' }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="px-4 py-4 text-center text-xs text-gray-400">
                  <i class="bi bi-clock-history me-1"></i>Payment proof not available yet
                </div>
              }
            </div>

            <!-- Total Amount Block -->
            <div class="bg-blue-700 rounded-xl p-5 text-white flex justify-between items-center">
              <div>
                <div class="text-xs text-blue-300 uppercase tracking-wider mb-1">Online Amount</div>
                <div class="text-2xl font-black">₹{{ selected.amount | number }}</div>
              </div>
              <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <i class="bi bi-credit-card text-lg text-white"></i>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[340px] max-w-[480px] bg-white border-l border-gray-200 text-center p-8">
          <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-credit-card text-2xl text-blue-300"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No payment selected</h3>
          <p class="text-gray-400 text-sm">Click any row to view online payment details & proof.</p>
        </div>
      }
    </div>
  `,
})
export class OnlinePayments implements OnInit {
  transactions: TransactionEntry[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  selected: TransactionEntry | null = null;

  constructor(
    private txnService: TransactionService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredEntries(): TransactionEntry[] {
    if (!this.searchQuery.trim()) return this.transactions;
    const q = this.searchQuery.toLowerCase();
    return this.transactions.filter(
      (t) =>
        t.customerName?.toLowerCase().includes(q) ||
        t.paymentStatus?.toLowerCase().includes(q) ||
        t.orderStatus?.toLowerCase().includes(q),
    );
  }

  get totalRevenue() { return this.transactions.reduce((s, t) => s + t.amount, 0); }
  get paidRevenue() { return this.transactions.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.amount, 0); }
  get pendingRevenue() { return this.transactions.filter(t => t.paymentStatus === 'pending').reduce((s, t) => s + t.amount, 0); }
  get paidCount() { return this.transactions.filter(t => t.paymentStatus === 'paid').length; }
  get pendingCount() { return this.transactions.filter(t => t.paymentStatus === 'pending').length; }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    this.loading = true;
    if (!this.shopId) return;
    this.txnService.getOnlineTransactions(this.shopId).subscribe({
      next: (res) => {
        this.transactions = res.data;
        this.loading = false;
        if (this.transactions.length > 0 && window.innerWidth >= 768) {
          this.selected = this.transactions[0];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load online payments.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  select(txn: TransactionEntry) { this.selected = txn; }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && ('seconds' in value || '_seconds' in value))
      return new Date((value.seconds || value._seconds) * 1000);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  getPayStatusClass(s: string) {
    const m: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }

  getOrdStatusClass(s: string) {
    const m: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-indigo-100 text-indigo-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
