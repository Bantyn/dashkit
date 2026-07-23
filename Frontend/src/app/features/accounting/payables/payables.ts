import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountingService, PayableEntry } from '../../../core/services/accounting.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-payables',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, UiDropdownComponent],
  template: `
    <div class="h-[calc(100vh-64px)] bg-[#f5f7fa] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <i class="bi bi-arrow-up-right-circle text-rose-600"></i> Payables
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">Pending purchase order payments — money you owe to suppliers</p>
        </div>
        <div class="flex items-center gap-3">
          <app-ui-dropdown
            [(ngModel)]="bucketFilter"
            [options]="agingOptions"
          ></app-ui-dropdown>
        </div>
      </div>

      <!-- Aging Summary -->
      <div class="px-6 py-4 bg-white border-b border-gray-100 shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-green-50 border border-green-100 rounded-xl p-4">
          <div class="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">0–30 Days</div>
          <div class="text-xl font-black text-green-700">₹{{ (bucketSummary['0-30'] || 0) | number }}</div>
        </div>
        <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div class="text-xs text-yellow-600 font-semibold uppercase tracking-wider mb-1">31–60 Days</div>
          <div class="text-xl font-black text-yellow-700">₹{{ (bucketSummary['31-60'] || 0) | number }}</div>
        </div>
        <div class="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <div class="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">61–90 Days</div>
          <div class="text-xl font-black text-orange-700">₹{{ (bucketSummary['61-90'] || 0) | number }}</div>
        </div>
        <div class="bg-red-50 border border-red-100 rounded-xl p-4">
          <div class="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">90+ Days</div>
          <div class="text-xl font-black text-red-700">₹{{ (bucketSummary['90+'] || 0) | number }}</div>
        </div>
      </div>

      <!-- Total + Search -->
      <div class="px-4 py-3 bg-white shrink-0 border-b border-gray-100 flex items-center gap-3">
        <div class="relative flex-1">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search supplier..." class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 rounded-lg text-sm" />
        </div>
        <div class="text-sm font-bold text-rose-700 bg-rose-50 border border-rose-100 px-4 py-2 rounded-lg whitespace-nowrap">
          Total Payable: ₹{{ totalOutstanding | number }}
        </div>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto p-4">
        @if (loading) {
          <div class="flex items-center justify-center h-48"><app-ui-loading size="md"></app-ui-loading></div>
        } @else if (error) {
          <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">{{ error }}</div>
        } @else if (filteredEntries.length === 0) {
          <div class="bg-white rounded-xl p-12 text-center">
            <i class="bi bi-check-circle text-4xl text-green-300 block mb-2"></i>
            <p class="text-gray-400 text-sm">No pending payables. All suppliers are paid!</p>
          </div>
        } @else {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-5 py-3">Supplier</th>
                  <th class="px-5 py-3">Order Date</th>
                  <th class="px-5 py-3 text-right">Order Amt</th>
                  <th class="px-5 py-3 text-right">Paid</th>
                  <th class="px-5 py-3 text-right">Outstanding</th>
                  <th class="px-5 py-3 text-center">Status</th>
                  <th class="px-5 py-3 text-center">Aging</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (entry of filteredEntries; track entry.purchaseOrderId) {
                  <tr class="hover:bg-rose-50/30 transition-colors">
                    <td class="px-5 py-3 text-sm font-medium text-gray-900">{{ entry.supplierName }}</td>
                    <td class="px-5 py-3 text-xs text-gray-500">{{ entry.orderDate | date:'d MMM yy' }}</td>
                    <td class="px-5 py-3 text-sm text-right text-gray-800">₹{{ entry.totalAmount | number }}</td>
                    <td class="px-5 py-3 text-sm text-right text-green-600">₹{{ entry.paidAmount | number }}</td>
                    <td class="px-5 py-3 text-sm text-right font-bold text-rose-600">₹{{ entry.outstanding | number }}</td>
                    <td class="px-5 py-3 text-center">
                      <span class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize bg-yellow-100 text-yellow-700">{{ entry.status }}</span>
                    </td>
                    <td class="px-5 py-3 text-center">
                      <span class="text-xs px-2 py-0.5 rounded-full font-semibold" [ngClass]="getAgingClass(entry.agingBucket)">{{ entry.agingBucket }} days</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class Payables implements OnInit {
  entries: PayableEntry[] = [];
  totalOutstanding = 0;
  bucketSummary: Record<string, number> = {};

  readonly agingOptions = [
    { value: '', label: 'All Aging' },
    { value: '0-30', label: '0-30 Days' },
    { value: '31-60', label: '31-60 Days' },
    { value: '61-90', label: '61-90 Days' },
    { value: '90+', label: '90+ Days' }
  ];

  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  bucketFilter = '';

  constructor(
    private accountingService: AccountingService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredEntries(): PayableEntry[] {
    let list = this.entries;
    if (this.bucketFilter) list = list.filter(e => e.agingBucket === this.bucketFilter);
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(e => e.supplierName.toLowerCase().includes(q));
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    this.accountingService.getPayables(this.shopId).subscribe({
      next: res => {
        this.entries = res.data.entries;
        this.totalOutstanding = res.data.totalOutstanding;
        this.bucketSummary = res.data.bucketSummary;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Failed to load payables.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  getAgingClass(bucket: string) {
    const m: Record<string, string> = {
      '0-30': 'bg-green-100 text-green-700',
      '31-60': 'bg-yellow-100 text-yellow-700',
      '61-90': 'bg-orange-100 text-orange-700',
      '90+': 'bg-red-100 text-red-700',
    };
    return m[bucket] || 'bg-gray-100 text-gray-600';
  }
}
