import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CustomerCreditService, CustomerCredit } from '../../core/services/customer-credit.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-customer-credits',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Customer Credits List -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Customer Credits</h2>
            <p class="text-xs text-gray-400 mt-0.5">Manage customer store credits and wallet balances</p>
          </div>
          <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
            {{ filteredEntries.length }} customers
          </span>
        </div>

        <!-- Stats Bar -->
        <div class="px-6 py-4 bg-white border-b border-gray-100 shrink-0 grid grid-cols-3 gap-3">
          <div class="bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
            <div class="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">Total Balance Issued</div>
            <div class="text-lg font-black text-primary-700">₹{{ totalCreditsIssued | number }}</div>
          </div>
          <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <div class="text-xs text-green-500 font-semibold uppercase tracking-wider mb-1">Active Wallets</div>
            <div class="text-lg font-black text-green-700">{{ activeWalletsCount }}</div>
          </div>
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <div class="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Max Balance</div>
            <div class="text-lg font-black text-blue-700">₹{{ maxCreditBalance | number }}</div>
          </div>
        </div>

        <!-- Search Input -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by customer name, phone or email..."
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all"
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
                  <th class="px-6 py-3">Credit Balance</th>
                  <th class="px-6 py-3">Phone</th>
                  <th class="px-6 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="4" class="px-6 py-10 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span class="text-sm text-gray-400">Loading customer credits...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (filteredEntries.length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-10 text-center text-gray-400 text-sm">
                      No customer credits found.
                    </td>
                  </tr>
                } @else {
                  @for (cc of filteredEntries; track cc.id) {
                    <tr
                      (click)="select(cc)"
                      class="cursor-pointer transition-colors hover:bg-primary-50/40 group"
                      [class.bg-primary-50]="selected?.id === cc.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ cc.customerName ? cc.customerName.charAt(0).toUpperCase() : '?' }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ cc.customerName }}</div>
                            <div class="text-xs text-gray-400 font-mono">{{ cc.customerId | slice:-8 | uppercase }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-bold text-gray-900">₹{{ cc.balance | number }}</td>
                      <td class="px-6 py-4 text-xs text-gray-500">{{ cc.customerPhone || 'N/A' }}</td>
                      <td class="px-6 py-4 text-xs text-gray-400">
                        {{ toDate(cc.updatedAt) | date:'d MMM yy H:mm' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Detail Panel: History & Manual Adjustment -->
      @if (selected) {
        <div class="w-[40%] min-w-[340px] max-w-[480px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <!-- Panel Header -->
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Wallet Details</h3>
              <p class="text-xs font-mono text-gray-400 mt-0.5">Cust: {{ selected.customerId | slice:-8 | uppercase }}</p>
            </div>
            <button (click)="selected = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Balance Card -->
            <div class="bg-gray-900 rounded-xl p-5 text-white flex justify-between items-center shadow-md">
              <div>
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Available Store Credit</div>
                <div class="text-3xl font-black">₹{{ selected.balance | number }}</div>
              </div>
              <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <i class="bi bi-wallet2 text-xl text-white"></i>
              </div>
            </div>

            <!-- Manual Credit Adjustment -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Adjust Balance</h4>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    (click)="adjType = 'credit'"
                    class="py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all"
                    [class]="adjType === 'credit' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                  >
                    Add Credit
                  </button>
                  <button
                    type="button"
                    (click)="adjType = 'debit'"
                    class="py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all"
                    [class]="adjType === 'debit' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                  >
                    Deduct Credit
                  </button>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="adjAmount"
                    min="1"
                    placeholder="₹ Amount"
                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason</label>
                  <input
                    type="text"
                    [(ngModel)]="adjReason"
                    placeholder="Customer reward / refund adjustment"
                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-primary-500"
                  />
                </div>
                <button
                  [disabled]="!adjAmount || adjAmount <= 0 || !adjReason"
                  (click)="submitAdjustment()"
                  class="w-full py-2 bg-primary-600 text-white text-xs font-bold uppercase rounded-lg shadow-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  Confirm Adjustment
                </button>
              </div>
            </div>

            <!-- Transaction History -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Credit History</h4>
              @if (!selected.history || selected.history.length === 0) {
                <div class="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No transactions yet.
                </div>
              } @else {
                <div class="space-y-2">
                  @for (h of selected.history; track $index) {
                    <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex justify-between items-start gap-4">
                      <div class="min-w-0">
                        <div class="text-xs font-medium text-gray-900 truncate">{{ h.reason }}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5">
                          {{ toDate(h.date) | date:'d MMM y H:mm' }}
                          <span *ngIf="h.referenceId" class="font-mono font-bold text-primary-500 ms-1">
                            #{{ h.referenceId | slice:-8 | uppercase }}
                          </span>
                        </div>
                      </div>
                      <div class="text-right shrink-0">
                        <div
                          class="text-sm font-black"
                          [class.text-green-600]="h.type === 'credit'"
                          [class.text-red-600]="h.type === 'debit'"
                        >
                          {{ h.type === 'credit' ? '+' : '-' }}₹{{ h.amount | number }}
                        </div>
                        <span class="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded"
                          [class.bg-green-50]="h.type === 'credit'"
                          [class.text-green-600]="h.type === 'credit'"
                          [class.bg-red-50]="h.type === 'debit'"
                          [class.text-red-600]="h.type === 'debit'"
                        >
                          {{ h.type }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[340px] max-w-[480px] bg-white border-l border-gray-200 text-center p-8">
          <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-wallet2 text-2xl text-primary-300"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No Customer Selected</h3>
          <p class="text-gray-400 text-sm">Select a customer to view store credit wallet history.</p>
        </div>
      }
    </div>
  `,
})
export class CustomerCreditsComponent implements OnInit {
  customerCredits: CustomerCredit[] = [];
  loading = true;
  shopId: string | null = null;
  searchQuery = '';
  selected: CustomerCredit | null = null;

  // Adjustment fields
  adjType: 'credit' | 'debit' = 'credit';
  adjAmount: number | undefined;
  adjReason = '';

  constructor(
    private ccService: CustomerCreditService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredEntries(): CustomerCredit[] {
    if (!this.searchQuery.trim()) return this.customerCredits;
    const q = this.searchQuery.toLowerCase();
    return this.customerCredits.filter(
      (cc) =>
        cc.customerName?.toLowerCase().includes(q) ||
        cc.customerPhone?.toLowerCase().includes(q) ||
        cc.customerEmail?.toLowerCase().includes(q),
    );
  }

  get totalCreditsIssued() {
    return this.customerCredits.reduce((s, cc) => s + (cc.balance || 0), 0);
  }
  get activeWalletsCount() {
    return this.customerCredits.filter((c) => c.balance > 0).length;
  }
  get maxCreditBalance() {
    return this.customerCredits.reduce((m, c) => c.balance > m ? c.balance : m, 0);
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    this.loading = true;
    if (!this.shopId) return;
    this.ccService.getCreditsByShop(this.shopId).subscribe({
      next: (res) => {
        this.customerCredits = res.data;
        // Sort highest balance first
        this.customerCredits.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        this.loading = false;
        if (this.customerCredits.length > 0 && window.innerWidth >= 768) {
          this.select(this.customerCredits[0]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  select(cc: CustomerCredit) {
    this.selected = cc;
    // reset adjustments
    this.adjType = 'credit';
    this.adjAmount = undefined;
    this.adjReason = '';
  }

  submitAdjustment() {
    if (!this.selected || !this.shopId || !this.adjAmount || !this.adjReason) return;
    this.ccService.adjustCredit({
      shopId: this.shopId,
      customerId: this.selected.customerId,
      customerName: this.selected.customerName,
      customerPhone: this.selected.customerPhone,
      customerEmail: this.selected.customerEmail,
      amount: this.adjAmount,
      type: this.adjType,
      reason: this.adjReason,
      referenceId: 'manual',
    }).subscribe({
      next: (res) => {
        // update selection
        this.selected = res.data;
        // reload list
        this.load();
      },
      error: (err) => console.error('Failed adjustment:', err),
    });
  }

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
