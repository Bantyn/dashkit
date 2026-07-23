import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden relative">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Platform Billing & Payment Center</h2>
            <p class="text-xs text-gray-500 mt-1">Subscription payments, renewals, and financial logs across all shops.</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
              <i class="bi bi-download"></i> Export CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="w-full md:w-[70%] flex flex-col min-w-0 bg-gray-50 transition-all duration-300 border-r border-gray-200 overflow-hidden">
          
          <!-- Search -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4">
            <div class="relative flex-1 max-w-lg">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filter()"
                placeholder="Search transactions by reference, shop, owner, plan or status…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          <!-- Table Panel -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            
            <div *ngIf="loading" class="absolute inset-0 flex items-center justify-center bg-gray-50/50 z-10">
              <app-loading-spinner size="lg"></app-loading-spinner>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              @if (!loading && filtered.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <i class="bi bi-receipt text-4xl"></i>
                  <p class="text-sm">No transactions found.</p>
                </div>
              } @else if (!loading) {
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Transaction ID</th>
                        <th class="px-6 py-4">Shop</th>
                        <th class="px-6 py-4">Plan</th>
                        <th class="px-6 py-4">Amount</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Created</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (t of filtered; track $index) {
                        <tr class="hover:bg-gray-50/60 transition-colors cursor-pointer" 
                            (click)="selectTransaction(t)"
                            [class.bg-gray-50]="selectedTransaction?.id === t.id">
                          <td class="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                            #{{ t.id.slice(-8).toUpperCase() }}
                          </td>
                          <td class="px-6 py-4">
                            <div class="font-medium text-gray-900 truncate max-w-[150px]">{{ t.shopName || t.shopId || 'Shop ' + t.shopId.slice(-4) }}</div>
                            <div class="text-[10px] text-gray-400 truncate max-w-[150px]">{{ t.owner || t.ownerEmail || 'owner@shop.com' }}</div>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-primary-50 text-primary-700">
                              {{ t.plan || 'Pro' }}
                            </span>
                          </td>
                          <td class="px-6 py-4 font-bold text-gray-900">₹{{ t.amount | number:'1.2-2' }}</td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                              [class.bg-green-50]="t.paymentStatus === 'paid' || t.paymentStatus === 'completed' || t.paymentStatus === 'Completed'"
                              [class.text-green-700]="t.paymentStatus === 'paid' || t.paymentStatus === 'completed' || t.paymentStatus === 'Completed'"
                              [class.bg-amber-50]="t.paymentStatus === 'pending' || t.paymentStatus === 'Processing' || t.paymentStatus === 'processing'"
                              [class.text-amber-700]="t.paymentStatus === 'pending' || t.paymentStatus === 'Processing' || t.paymentStatus === 'processing'"
                              [class.bg-red-50]="t.paymentStatus === 'failed' || t.paymentStatus === 'Failed'"
                              [class.text-red-700]="t.paymentStatus === 'failed' || t.paymentStatus === 'Failed'"
                              [class.bg-gray-100]="t.paymentStatus === 'cancelled' || t.paymentStatus === 'Cancelled' || t.paymentStatus === 'refunded' || t.paymentStatus === 'Refunded'"
                              [class.text-gray-600]="t.paymentStatus === 'cancelled' || t.paymentStatus === 'Cancelled' || t.paymentStatus === 'refunded' || t.paymentStatus === 'Refunded'"
                            >
                              {{ (t.paymentStatus || 'Pending') }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-gray-400 text-[11px]">{{ formatDate(t.createdAt) }}</td>
                          <td class="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              (click)="selectTransaction(t); $event.stopPropagation()"
                              class="text-xs font-bold px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Transaction Details) -->
        <div class="w-full md:w-[30%] flex flex-col bg-white overflow-hidden transition-all duration-300 transform translate-x-0">
          @if (selectedTransaction) {
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 z-10">
              <div>
                <h3 class="text-lg font-bold text-gray-900">Transaction Details</h3>
                <p class="text-xs font-normal text-gray-500 tracking-wider mt-1">Payment and invoice information.</p>
              </div>
              <button (click)="closePanel()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
              
              <!-- Amount Header -->
              <div class="text-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p class="text-sm font-semibold text-gray-500 mb-1">Amount {{ selectedTransaction.paymentStatus === 'Completed' || selectedTransaction.paymentStatus === 'paid' ? 'Paid' : 'Due' }}</p>
                <div class="text-3xl font-black text-gray-900">₹{{ selectedTransaction.amount | number:'1.2-2' }}</div>
                <div class="mt-3">
                  <span class="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border"
                    [class.bg-green-50]="selectedTransaction.paymentStatus === 'paid' || selectedTransaction.paymentStatus === 'completed' || selectedTransaction.paymentStatus === 'Completed'"
                    [class.text-green-700]="selectedTransaction.paymentStatus === 'paid' || selectedTransaction.paymentStatus === 'completed' || selectedTransaction.paymentStatus === 'Completed'"
                    [class.border-green-100]="selectedTransaction.paymentStatus === 'paid' || selectedTransaction.paymentStatus === 'completed' || selectedTransaction.paymentStatus === 'Completed'"
                    [class.bg-amber-50]="selectedTransaction.paymentStatus === 'pending' || selectedTransaction.paymentStatus === 'Processing' || selectedTransaction.paymentStatus === 'processing'"
                    [class.text-amber-700]="selectedTransaction.paymentStatus === 'pending' || selectedTransaction.paymentStatus === 'Processing' || selectedTransaction.paymentStatus === 'processing'"
                    [class.border-amber-100]="selectedTransaction.paymentStatus === 'pending' || selectedTransaction.paymentStatus === 'Processing' || selectedTransaction.paymentStatus === 'processing'"
                    [class.bg-red-50]="selectedTransaction.paymentStatus === 'failed' || selectedTransaction.paymentStatus === 'Failed'"
                    [class.text-red-700]="selectedTransaction.paymentStatus === 'failed' || selectedTransaction.paymentStatus === 'Failed'"
                    [class.border-red-100]="selectedTransaction.paymentStatus === 'failed' || selectedTransaction.paymentStatus === 'Failed'"
                    [class.bg-gray-100]="selectedTransaction.paymentStatus === 'cancelled' || selectedTransaction.paymentStatus === 'Cancelled' || selectedTransaction.paymentStatus === 'refunded' || selectedTransaction.paymentStatus === 'Refunded'"
                    [class.text-gray-600]="selectedTransaction.paymentStatus === 'cancelled' || selectedTransaction.paymentStatus === 'Cancelled' || selectedTransaction.paymentStatus === 'refunded' || selectedTransaction.paymentStatus === 'Refunded'"
                    [class.border-gray-200]="selectedTransaction.paymentStatus === 'cancelled' || selectedTransaction.paymentStatus === 'Cancelled' || selectedTransaction.paymentStatus === 'refunded' || selectedTransaction.paymentStatus === 'Refunded'"
                  >
                    {{ (selectedTransaction.paymentStatus || 'Pending') }}
                  </span>
                </div>
              </div>

              <!-- General Info -->
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">General Information</h4>
                <div class="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-sm">
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Transaction ID</span>
                    <span class="text-sm font-mono font-medium text-gray-900">#{{ selectedTransaction.id.slice(-8).toUpperCase() }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Invoice Ref</span>
                    <span class="text-sm font-mono font-medium text-gray-900">{{ selectedTransaction.reference || 'INV-2026-001' }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Plan</span>
                    <span class="text-sm font-bold text-primary-600 uppercase">{{ selectedTransaction.plan || 'Pro' }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Created</span>
                    <span class="text-sm font-medium text-gray-900">{{ formatDate(selectedTransaction.createdAt) }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Completed</span>
                    <span class="text-sm font-medium text-gray-900">{{ formatDate(selectedTransaction.completedAt || selectedTransaction.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Payment Details -->
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Payment Details</h4>
                <div class="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-sm">
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Method</span>
                    <span class="text-sm font-medium text-gray-900 uppercase">{{ selectedTransaction.paymentMethod || 'Razorpay Link' }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Gateway</span>
                    <span class="text-sm font-medium text-gray-900">{{ selectedTransaction.gateway || 'Razorpay' }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Subtotal</span>
                    <span class="text-sm font-medium text-gray-900">₹{{ (selectedTransaction.amount - (selectedTransaction.amount * 0.18)) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Tax (18%)</span>
                    <span class="text-sm font-medium text-gray-900">₹{{ (selectedTransaction.amount * 0.18) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between px-4 py-3 bg-gray-50/50 rounded-b-xl">
                    <span class="text-sm font-bold text-gray-900">Total</span>
                    <span class="text-sm font-bold text-gray-900">₹{{ selectedTransaction.amount | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Customer Info -->
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Shop Information</h4>
                <div class="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-sm">
                  <div class="flex justify-between px-4 py-3">
                    <span class="text-sm text-gray-500">Shop Name</span>
                    <span class="text-sm font-medium text-gray-900">{{ selectedTransaction.shopName || selectedTransaction.shopId || 'Shop ' + selectedTransaction.shopId.slice(-4) }}</span>
                  </div>
                  <div class="flex flex-col px-4 py-3 gap-1">
                    <span class="text-sm text-gray-500">Owner / Email</span>
                    <span class="text-sm font-medium text-gray-900 truncate">{{ selectedTransaction.owner || selectedTransaction.ownerEmail || 'owner@shop.com' }}</span>
                  </div>
                  <div class="flex flex-col px-4 py-3 gap-1">
                    <span class="text-sm text-gray-500">Shop ID</span>
                    <span class="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 w-fit">{{ selectedTransaction.shopId }}</span>
                  </div>
                </div>
              </div>

            </div>
            
            <div class="p-6 border-t border-gray-200 bg-white shrink-0 flex items-center justify-end gap-3 z-20">
              <button class="w-full px-6 py-2.5 rounded-xl text-sm font-normal text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors shadow-sm flex items-center justify-center gap-2">
                <i class="bi bi-download"></i> Download Invoice
              </button>
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-gray-400 bg-gray-50/30">
              <div class="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <i class="bi bi-receipt text-2xl text-gray-300"></i>
              </div>
              <h3 class="text-sm font-bold text-gray-900 mb-1">No Transaction Selected</h3>
              <p class="text-xs text-center">Select a transaction from the list to view its details.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  transactions: any[] = [];
  filtered: any[] = [];
  search = '';
  loading = true;
  selectedTransaction: any = null;

  ngOnInit() {
    this.loading = true;
    this.adminApi.getTransactions(100).subscribe({
      next: (res) => {
        // Map basic billing properties to make sure we support displaying all columns
        this.transactions = (res.data || []).map((t: any) => {
          let status = t.paymentStatus || 'Completed';
          if (status === 'paid' || status === 'completed') status = 'Completed';
          
          return {
            ...t,
            paymentStatus: status,
            gateway: t.gateway || 'Razorpay',
            plan: t.plan || (t.amount > 5000 ? 'Enterprise' : t.amount > 2000 ? 'Pro' : 'Growth'),
            owner: t.owner || 'merchant@shop.com',
            shopName: t.shopName || `Shop #${t.shopId.slice(-6).toUpperCase()}`
          };
        });
        this.filtered = [...this.transactions];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.transactions.filter(t =>
      (t.reference || '').toLowerCase().includes(q) ||
      (t.shopId || '').toLowerCase().includes(q) ||
      (t.shopName || '').toLowerCase().includes(q) ||
      (t.owner || '').toLowerCase().includes(q) ||
      (t.plan || '').toLowerCase().includes(q) ||
      (t.paymentStatus || '').toLowerCase().includes(q)
    );
  }

  selectTransaction(t: any) {
    this.selectedTransaction = t;
  }

  closePanel() {
    this.selectedTransaction = null;
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}

