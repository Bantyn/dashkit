import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CreditNoteService, CreditNote } from '../../core/services/credit-note.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ToastService } from '../../core/services/toast.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';

@Component({
  selector: 'app-credit-note-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, UiInputComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Credit Notes List -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Credit Notes</h2>
            <p class="text-xs text-gray-400 mt-0.5">Refunds and store adjustments management</p>
          </div>
          <div class="flex gap-2">
            <button
              (click)="openCreateModal()"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              <i class="bi bi-plus-lg"></i> Create Credit Note
            </button>
          </div>
        </div>

        <!-- Search + Stats Bar -->
        <div class="px-6 py-4 bg-white border-b border-gray-100 shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
            <div class="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">Total Notes</div>
            <div class="text-lg font-black text-primary-700">{{ creditNotes.length }}</div>
          </div>
          <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <div class="text-xs text-green-500 font-semibold uppercase tracking-wider mb-1">Converted</div>
            <div class="text-lg font-black text-green-700">₹{{ convertedAmount | number }}</div>
          </div>
          <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
            <div class="text-xs text-yellow-500 font-semibold uppercase tracking-wider mb-1">Pending</div>
            <div class="text-lg font-black text-yellow-700">₹{{ pendingAmount | number }}</div>
          </div>
          <div class="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <div class="text-xs text-red-500 font-semibold uppercase tracking-wider mb-1">Rejected</div>
            <div class="text-lg font-black text-red-700">₹{{ rejectedAmount | number }}</div>
          </div>
        </div>

        <!-- Search Input -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100 flex items-center gap-3">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by customer, reason or status..."
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <!-- Credit Notes Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Customer</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Reason</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span class="text-sm text-gray-400">Loading credit notes...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (filteredEntries.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center text-gray-400 text-sm">
                      No credit notes found.
                    </td>
                  </tr>
                } @else {
                  @for (cn of filteredEntries; track cn.id) {
                    <tr
                      (click)="select(cn)"
                      class="cursor-pointer transition-colors hover:bg-primary-50/40 group"
                      [class.bg-primary-50]="selected?.id === cn.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ cn.customerName ? cn.customerName.charAt(0).toUpperCase() : '?' }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ cn.customerName }}</div>
                            <div class="text-xs text-gray-400 font-mono">ID: {{ cn.id | slice:-8 | uppercase }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-bold text-gray-900">₹{{ cn.amount | number }}</td>
                      <td class="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{{ cn.reason }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [class]="getStatusClass(cn.status)">{{ cn.status }}</span>
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                        {{ toDate(cn.createdAt) | date:'d MMM yy' }}
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
              <h3 class="text-lg font-bold text-gray-900">Credit Note Detail</h3>
              <p class="text-xs font-mono text-gray-400 mt-0.5">CN-{{ selected.id | slice:-8 | uppercase }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="printSelected()" class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200" title="Print Credit Note">
                <i class="bi bi-printer"></i>
              </button>
              <button (click)="selected = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Customer Card -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm p-5 text-center">
              <div class="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-black text-2xl mx-auto mb-3">
                {{ selected.customerName.charAt(0).toUpperCase() }}
              </div>
              <div class="text-lg font-bold text-gray-900">{{ selected.customerName }}</div>
              <div class="text-xs text-gray-400 mt-0.5" *ngIf="selected.customerPhone">{{ selected.customerPhone }}</div>
              <div class="text-xs text-gray-400" *ngIf="selected.customerEmail">{{ selected.customerEmail }}</div>
              <div class="flex border-t border-gray-100 mt-4 pt-4 divide-x divide-gray-100">
                <div class="flex-1">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Adjustment Amount</div>
                  <div class="text-xl font-black text-primary-700">₹{{ selected.amount | number }}</div>
                </div>
                <div class="flex-1">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
                  <span class="text-xs font-bold px-2 py-1 rounded-full inline-block mt-1" [class]="getStatusClass(selected.status)">
                    {{ selected.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Linked Docs -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div class="px-4 py-3 border-b border-gray-100">
                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Linked Reference</h4>
              </div>
              <div class="divide-y divide-gray-50 text-sm">
                <div class="px-4 py-2.5 flex justify-between" *ngIf="selected.invoiceId">
                  <span class="text-gray-500">Invoice ID</span>
                  <span class="font-mono font-medium text-gray-900">{{ selected.invoiceId }}</span>
                </div>
                <div class="px-4 py-2.5 flex justify-between" *ngIf="selected.orderId">
                  <span class="text-gray-500">Order ID</span>
                  <span class="font-mono font-medium text-gray-900">{{ selected.orderId | slice:-8 | uppercase }}</span>
                </div>
                <div class="px-4 py-2.5 flex justify-between">
                  <span class="text-gray-500">Reason</span>
                  <span class="font-medium text-gray-900">{{ selected.reason }}</span>
                </div>
                <div class="px-4 py-2.5 flex justify-between">
                  <span class="text-gray-500">Created At</span>
                  <span class="font-medium text-gray-900">{{ toDate(selected.createdAt) | date:'medium' }}</span>
                </div>
              </div>
            </div>

            <!-- Actions Panel -->
            <div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4 space-y-3">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Actions</h4>
              
              <div class="grid grid-cols-2 gap-2" *ngIf="selected.status === 'pending'">
                <button
                  (click)="updateCNStatus('approved')"
                  class="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase rounded-lg shadow-sm"
                >
                  Approve CN
                </button>
                <button
                  (click)="updateCNStatus('rejected')"
                  class="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-lg shadow-sm"
                >
                  Reject CN
                </button>
              </div>

              <div *ngIf="selected.status === 'approved'">
                <button
                  (click)="convertToStoreCredit()"
                  class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <i class="bi bi-wallet2"></i> Convert to Store Credit
                </button>
              </div>

              <div *ngIf="selected.status === 'converted'" class="p-3 bg-primary-50 text-primary-700 rounded-lg text-xs text-center font-medium">
                <i class="bi bi-check-circle-fill me-1"></i> Already converted to store credit balance
              </div>
              <div *ngIf="selected.status === 'rejected'" class="p-3 bg-red-50 text-red-700 rounded-lg text-xs text-center font-medium">
                <i class="bi bi-x-circle-fill me-1"></i> Rejected and closed
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[340px] max-w-[480px] bg-white border-l border-gray-200 text-center p-8">
          <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-receipt-cutoff text-2xl text-primary-400"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No Credit Note Selected</h3>
          <p class="text-gray-400 text-sm">Select a credit note to view details or perform actions.</p>
        </div>
      }
    </div>

    <!-- Create Credit Note Modal -->
    <div *ngIf="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-900 text-base uppercase">Create Credit Note</h3>
          <button (click)="closeCreateModal()" class="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <form (submit)="createCreditNote($event)" class="p-6 space-y-4 overflow-y-auto">
          <app-ui-input
            [(ngModel)]="newCN.customerName"
            name="customerName"
            label="Customer Name *"
            placeholder="John Doe"
            [error]="showErrors && !newCN.customerName ? 'Customer name is required' : ''"
          ></app-ui-input>
          <div class="grid grid-cols-2 gap-4">
            <app-ui-input
              [(ngModel)]="newCN.customerPhone"
              name="customerPhone"
              label="Customer Phone"
              placeholder="9876543210"
            ></app-ui-input>
            <app-ui-input
              [(ngModel)]="newCN.customerEmail"
              name="customerEmail"
              type="email"
              label="Customer Email"
              placeholder="john@example.com"
            ></app-ui-input>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <app-ui-input
              [(ngModel)]="newCN.orderId"
              name="orderId"
              label="Linked Order ID"
              placeholder="Order ID"
            ></app-ui-input>
            <app-ui-input
              [(ngModel)]="newCN.invoiceId"
              name="invoiceId"
              label="Linked Invoice ID"
              placeholder="INV-XXXX"
            ></app-ui-input>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <app-ui-input
              [(ngModel)]="newCN.amount"
              name="amount"
              type="number"
              label="Adjustment Amount *"
              placeholder="₹ Amount"
              [error]="showErrors && !newCN.amount ? 'Amount is required' : ''"
            ></app-ui-input>
            <app-ui-input
              [(ngModel)]="newCN.customerId"
              name="customerId"
              label="Customer ID *"
              placeholder="customer-id"
              [error]="showErrors && !newCN.customerId ? 'Customer ID is required' : ''"
            ></app-ui-input>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Refund/CN*</label>
            <textarea [(ngModel)]="newCN.reason" name="reason" required placeholder="Defective product returned..." rows="3"
              class="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:bg-white transition-colors"
              [ngClass]="showErrors && !newCN.reason ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500'"></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" (click)="closeCreateModal()" class="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider">Save CN</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CreditNoteListComponent implements OnInit {
  creditNotes: CreditNote[] = [];
  loading = true;
  shopId: string | null = null;
  searchQuery = '';
  selected: CreditNote | null = null;
  showCreateModal = false;
  showErrors = false;

  newCN: Partial<CreditNote> = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    orderId: '',
    invoiceId: '',
    amount: undefined,
    customerId: '',
    reason: '',
  };

  constructor(
    private cnService: CreditNoteService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  get filteredEntries(): CreditNote[] {
    if (!this.searchQuery.trim()) return this.creditNotes;
    const q = this.searchQuery.toLowerCase();
    return this.creditNotes.filter(
      (cn) =>
        cn.customerName?.toLowerCase().includes(q) ||
        cn.reason?.toLowerCase().includes(q) ||
        cn.status?.toLowerCase().includes(q),
    );
  }

  get convertedAmount() {
    return this.creditNotes.filter((c) => c.status === 'converted').reduce((s, c) => s + c.amount, 0);
  }
  get pendingAmount() {
    return this.creditNotes.filter((c) => c.status === 'pending' || c.status === 'approved').reduce((s, c) => s + c.amount, 0);
  }
  get rejectedAmount() {
    return this.creditNotes.filter((c) => c.status === 'rejected').reduce((s, c) => s + c.amount, 0);
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });

    this.route.queryParamMap.subscribe((qParams) => {
      const invoiceId = qParams.get('invoiceId');
      if (invoiceId) {
        this.newCN = {
          invoiceId: invoiceId,
          orderId: qParams.get('orderId') || '',
          customerId: qParams.get('customerId') || 'guest',
          customerName: qParams.get('customerName') || '',
          customerPhone: qParams.get('customerPhone') || '',
          customerEmail: qParams.get('customerEmail') || '',
          amount: qParams.get('amount') ? Number(qParams.get('amount')) : undefined,
          reason: `Credit note for Invoice ${invoiceId}`,
        };
        // Small delay to ensure view is ready
        setTimeout(() => {
          this.showCreateModal = true;
          this.cdr.detectChanges();
        }, 50);
      }
    });
  }

  load() {
    this.loading = true;
    if (!this.shopId) return;
    this.cnService.getCreditNotesByShop(this.shopId).subscribe({
      next: (res) => {
        this.creditNotes = res.data;
        // Sort latest first
        this.creditNotes.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        this.loading = false;
        if (this.creditNotes.length > 0 && window.innerWidth >= 768) {
          this.selected = this.creditNotes[0];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  select(cn: CreditNote) {
    this.selected = cn;
  }

  openCreateModal() {
    this.newCN = {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      orderId: '',
      invoiceId: '',
      amount: undefined,
      customerId: '',
      reason: '',
      shopId: this.shopId || '',
      status: 'pending',
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.showErrors = false;
  }

  createCreditNote(e: Event) {
    e.preventDefault();
    if (!this.newCN.customerName || !this.newCN.amount || !this.newCN.reason || !this.newCN.customerId) {
      this.showErrors = true;
      setTimeout(() => {
        const firstInvalid = document.querySelector('.border-red-500') as HTMLElement;
        if (firstInvalid) firstInvalid.focus();
      }, 0);
      return;
    }
    
    // Ensure shopId is attached
    this.newCN.shopId = this.shopId || '';
    if (!this.newCN.shopId) return;

    this.showErrors = false;

    this.cnService.createCreditNote(this.newCN).subscribe({
      next: () => {
        this.closeCreateModal();
        this.load();
      },
      error: (err) => {
        console.error('Failed to create credit note:', err);
        this.toastService.showError('Failed to generate credit note. Check the console for details.');
        this.cdr.detectChanges();
      },
    });
  }


  updateCNStatus(status: 'pending' | 'approved' | 'rejected' | 'converted') {
    if (!this.selected) return;
    this.cnService.updateStatus(this.selected.id, status).subscribe({
      next: () => {
        this.selected!.status = status;
        this.load();
      },
    });
  }

  convertToStoreCredit() {
    if (!this.selected) return;
    this.cnService.convertToCredit(this.selected.id).subscribe({
      next: (res) => {
        this.selected = res.data;
        this.load();
      },
      error: (err) => {
        this.toastService.showError(err?.error?.message || 'Failed to convert to store credit');
      },
    });
  }

  printSelected() {
    if (!this.selected) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const dateStr = new Date(this.toDate(this.selected.createdAt) || new Date()).toLocaleDateString();
    w.document.write(`
      <html>
      <head>
        <title>Credit Note CN-${this.selected.id.slice(-8).toUpperCase()}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .title { font-size: 24px; font-weight: bold; color: var(--color-primary-800); }
          .meta-item { margin-bottom: 8px; font-size: 14px; }
          .details { margin-top: 40px; border-collapse: collapse; width: 100%; }
          .details th, .details td { border: 1px solid #eee; padding: 12px; text-align: left; }
          .details th { bg-color: #fafafa; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 30px; color: var(--color-primary-800); }
        </style>
      </head>
      <body onload="window.print()">
        <div class="header">
          <div>
            <div class="title">CREDIT NOTE</div>
            <div class="meta-item" style="margin-top:10px;">ID: CN-${this.selected.id.toUpperCase()}</div>
            <div class="meta-item">Date: ${dateStr}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight:bold; font-size:16px;">Clothify Shop</div>
            <div class="meta-item">Shop ID: ${this.selected.shopId}</div>
          </div>
        </div>

        <div style="margin-top:20px;">
          <h3 style="font-size:14px; text-transform:uppercase; color:#666;">Customer Details</h3>
          <div class="meta-item"><strong>Name:</strong> ${this.selected.customerName}</div>
          <div class="meta-item" *ngIf="selected.customerPhone"><strong>Phone:</strong> ${this.selected.customerPhone}</div>
          <div class="meta-item" *ngIf="selected.customerEmail"><strong>Email:</strong> ${this.selected.customerEmail}</div>
        </div>

        <table class="details">
          <thead>
            <tr>
              <th>Description</th>
              <th>Reference Invoice/Order</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${this.selected.reason}</td>
              <td>${this.selected.invoiceId || 'N/A'} / ${this.selected.orderId ? 'ORD-' + this.selected.orderId.slice(-8).toUpperCase() : 'N/A'}</td>
              <td>₹${this.selected.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">Total Adjustment: ₹${this.selected.amount.toLocaleString()}</div>
      </body>
      </html>
    `);
    w.document.close();
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

  getStatusClass(s: string) {
    const m: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      converted: 'bg-primary-100 text-primary-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
