import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

export interface RefundEntry {
  id: string;
  date: any;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  source: string;
  status: string;
}

@Component({
  selector: 'app-refunds',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">

      <!-- Left Panel -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">

        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Refund Transactions</h2>
            <p class="text-xs text-gray-400 mt-0.5">Unified ledger of customer credit deductions & sales returns</p>
          </div>
          <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
            {{ filteredEntries.length }} records
          </span>
        </div>

        <!-- Stats Bar -->
        <div class="px-6 py-4 bg-white border-b border-gray-100 shrink-0 grid grid-cols-3 gap-3">
          <div class="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <div class="text-xs text-red-500 font-semibold uppercase tracking-wider mb-1">Total Refunded</div>
            <div class="text-lg font-black text-red-700">₹{{ totalRefunded | number }}</div>
          </div>
          <div class="bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
            <div class="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">Sales Returns</div>
            <div class="text-lg font-black text-primary-700">₹{{ returnRefunded | number }}</div>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <div class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Wallet Deductions</div>
            <div class="text-lg font-black text-gray-700">₹{{ creditRefunded | number }}</div>
          </div>
        </div>

        <!-- Search + Chips -->
        <div class="px-4 py-3 bg-white shrink-0 border-b border-gray-100 flex items-center gap-3">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search customer, source, or reason..."
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Source</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Status</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span class="text-sm text-gray-400">Loading refunds...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error) {
                  <tr>
                    <td colspan="5" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">{{ error }}</div>
                    </td>
                  </tr>
                } @else if (filteredEntries.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center text-gray-400 text-sm">
                      No refunds found.
                    </td>
                  </tr>
                } @else {
                  @for (txn of filteredEntries; track txn.id) {
                    <tr
                      (click)="select(txn)"
                      class="cursor-pointer transition-colors hover:bg-red-50/40 group"
                      [class.bg-red-50]="selected?.id === txn.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ txn.customerName ? txn.customerName.charAt(0).toUpperCase() : '?' }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ txn.customerName }}</div>
                            <div class="text-xs text-gray-400 font-mono" *ngIf="txn.customerPhone">{{ txn.customerPhone }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-bold text-gray-900">₹{{ txn.amount | number }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                          [class.bg-orange-50]="txn.source === 'Sales Return'"
                          [class.text-orange-600]="txn.source === 'Sales Return'"
                          [class.bg-purple-50]="txn.source === 'Store Credit Wallet'"
                          [class.text-purple-600]="txn.source === 'Store Credit Wallet'">{{ txn.source }}</span>
                      </td>
                      <td class="px-6 py-4 hidden lg:table-cell">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700">
                          {{ txn.status }}
                        </span>
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
              <h3 class="text-lg font-bold text-gray-900">Refund Details</h3>
              <p class="text-xs font-mono text-gray-400 mt-0.5">ID: {{ selected.id | slice:-8 | uppercase }}</p>
            </div>
            <button (click)="selected = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-5">
            <!-- Customer Card -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm p-5 text-center">
              <div class="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-2xl mx-auto mb-3">
                {{ selected.customerName.charAt(0).toUpperCase() }}
              </div>
              <div class="text-lg font-bold text-gray-900">{{ selected.customerName }}</div>
              <div class="text-sm text-gray-400 mt-0.5" *ngIf="selected.customerPhone">{{ selected.customerPhone }}</div>
              <div class="flex border-t border-gray-100 mt-4 pt-4 divide-x divide-gray-100">
                <div class="flex-1">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Amount</div>
                  <div class="text-xl font-black text-red-700">₹{{ selected.amount | number }}</div>
                </div>
                <div class="flex-1">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
                  <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 inline-block mt-1 uppercase">
                    {{ selected.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Transaction Info -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Refund Info</h4>
              </div>
              <div class="divide-y divide-gray-50">
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Source Ledger</span>
                  <span class="text-sm font-semibold text-gray-900">{{ selected.source }}</span>
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Reason</span>
                  <span class="text-sm font-semibold text-gray-900 max-w-[200px] truncate text-right" [title]="selected.reason">{{ selected.reason }}</span>
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Date</span>
                  <span class="text-sm font-medium text-gray-900">{{ toDate(selected.date) | date:'medium' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[340px] max-w-[480px] bg-white border-l border-gray-200 text-center p-8">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-arrow-counterclockwise text-2xl text-red-300"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No transaction selected</h3>
          <p class="text-gray-400 text-sm">Click any row to view refund transaction details.</p>
        </div>
      }
    </div>
  `,
})
export class Refunds implements OnInit {
  transactions: RefundEntry[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  selected: RefundEntry | null = null;

  constructor(
    private txnService: TransactionService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredEntries(): RefundEntry[] {
    if (!this.searchQuery.trim()) return this.transactions;
    const q = this.searchQuery.toLowerCase();
    return this.transactions.filter(
      (t) =>
        t.customerName?.toLowerCase().includes(q) ||
        t.source?.toLowerCase().includes(q) ||
        t.reason?.toLowerCase().includes(q),
    );
  }

  get totalRefunded() { return this.transactions.reduce((s, t) => s + t.amount, 0); }
  get returnRefunded() { return this.transactions.filter(t => t.source === 'Sales Return').reduce((s, t) => s + t.amount, 0); }
  get creditRefunded() { return this.transactions.filter(t => t.source === 'Store Credit Wallet').reduce((s, t) => s + t.amount, 0); }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    this.loading = true;
    if (!this.shopId) return;
    this.txnService.getRefundTransactions(this.shopId).subscribe({
      next: (res) => {
        this.transactions = res.data;
        this.loading = false;
        if (this.transactions.length > 0 && window.innerWidth >= 768) {
          this.selected = this.transactions[0];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load refund transactions.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  select(txn: RefundEntry) { this.selected = txn; }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && ('seconds' in value || '_seconds' in value))
      return new Date((value.seconds || value._seconds) * 1000);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
}
