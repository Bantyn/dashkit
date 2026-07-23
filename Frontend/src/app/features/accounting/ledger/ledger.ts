import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountingService, LedgerEntry, LedgerResult, DateRange } from '../../../core/services/accounting.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { UiDatePickerComponent } from '../../../shared/components/ui-date-picker.component';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, UiDropdownComponent, UiDatePickerComponent],
  template: `
    <div class="h-[calc(100vh-64px)] bg-[#f5f7fa] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <i class="bi bi-journal-text text-violet-600"></i> Ledger
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">All financial entries with running balance (Dr/Cr)</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="w-36">
            <app-ui-dropdown
              [(ngModel)]="typeFilter"
              [options]="typeOptions"
              placeholder="All Types"
              (onSelect)="typeFilter = $event"
            ></app-ui-dropdown>
          </div>
          <div class="w-40">
            <app-ui-dropdown
              [(ngModel)]="sourceFilter"
              [options]="sourceOptions"
              placeholder="All Sources"
              (onSelect)="sourceFilter = $event"
            ></app-ui-dropdown>
          </div>
          <div class="w-40">
            <app-ui-date-picker
              [(ngModel)]="startDate"
              placeholder="Start date"
            ></app-ui-date-picker>
          </div>
          <span class="text-gray-400 text-sm">to</span>
          <div class="w-40">
            <app-ui-date-picker
              [(ngModel)]="endDate"
              placeholder="End date"
            ></app-ui-date-picker>
          </div>
          <button (click)="load()" class="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
            <i class="bi bi-funnel-fill mr-1"></i> Filter
          </button>
          <button (click)="clearFilter()" class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">Clear</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="px-6 py-4 bg-white border-b border-gray-100 shrink-0 grid grid-cols-3 gap-4">
        <div class="bg-green-50 border border-green-100 rounded-xl p-4">
          <div class="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Total Credit</div>
          <div class="text-2xl font-black text-green-700">₹{{ (result?.totalCredit || 0) | number }}</div>
        </div>
        <div class="bg-red-50 border border-red-100 rounded-xl p-4">
          <div class="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Total Debit</div>
          <div class="text-2xl font-black text-red-700">₹{{ (result?.totalDebit || 0) | number }}</div>
        </div>
        <div class="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <div class="text-xs text-violet-600 font-semibold uppercase tracking-wider mb-1">Closing Balance</div>
          <div class="text-2xl font-black" [ngClass]="closingBalance >= 0 ? 'text-violet-700' : 'text-orange-600'">
            ₹{{ closingBalance | number }}
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="px-4 py-3 bg-white shrink-0 border-b border-gray-100 flex items-center gap-3">
        <div class="relative flex-1">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search narration or party..." class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-lg text-sm transition-all" />
        </div>
        <span class="text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full font-semibold">{{ filteredEntries.length }} entries</span>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto p-4">
        @if (loading) {
          <div class="flex items-center justify-center h-48"><app-ui-loading size="md"></app-ui-loading></div>
        } @else if (error) {
          <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">{{ error }}</div>
        } @else {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-5 py-3">Date</th>
                  <th class="px-5 py-3">Narration</th>
                  <th class="px-5 py-3">Source</th>
                  <th class="px-5 py-3">Method</th>
                  <th class="px-5 py-3 text-right">Debit (Dr)</th>
                  <th class="px-5 py-3 text-right">Credit (Cr)</th>
                  <th class="px-5 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @if (filteredEntries.length === 0) {
                  <tr><td colspan="7" class="py-12 text-center text-gray-400 text-sm">No ledger entries found.</td></tr>
                } @else {
                  @for (entry of filteredEntries; track entry.id) {
                    <tr class="hover:bg-violet-50/20 transition-colors">
                      <td class="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{{ entry.date | date:'d MMM yy' }}</td>
                      <td class="px-5 py-3 text-sm text-gray-800 max-w-xs truncate">{{ entry.narration }}</td>
                      <td class="px-5 py-3">
                        <span class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize" [ngClass]="getSourceClass(entry.source)">{{ entry.source }}</span>
                      </td>
                      <td class="px-5 py-3 text-xs text-gray-400 uppercase">{{ entry.paymentMethod }}</td>
                      <td class="px-5 py-3 text-sm text-right font-semibold" [ngClass]="entry.type === 'debit' ? 'text-red-500' : 'text-gray-200'">
                        {{ entry.type === 'debit' ? ('₹' + (entry.amount | number)) : '' }}
                      </td>
                      <td class="px-5 py-3 text-sm text-right font-semibold" [ngClass]="entry.type === 'credit' ? 'text-green-600' : 'text-gray-200'">
                        {{ entry.type === 'credit' ? ('₹' + (entry.amount | number)) : '' }}
                      </td>
                      <td class="px-5 py-3 text-sm text-right font-bold" [ngClass]="(entry.balance || 0) >= 0 ? 'text-violet-600' : 'text-orange-600'">
                        ₹{{ (entry.balance || 0) | number }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class Ledger implements OnInit {
  result: LedgerResult | null = null;
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  startDate = '';
  endDate = '';
  typeFilter = '';
  sourceFilter = '';

  readonly typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'credit', label: 'Credit (In)' },
    { value: 'debit', label: 'Debit (Out)' },
  ];

  readonly sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'expense', label: 'Expenses' },
    { value: 'return', label: 'Returns' },
  ];

  constructor(
    private accountingService: AccountingService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredEntries(): LedgerEntry[] {
    let entries = this.result?.entries || [];
    if (this.typeFilter) entries = entries.filter(e => e.type === this.typeFilter);
    if (this.sourceFilter) entries = entries.filter(e => e.source === this.sourceFilter);
    if (!this.searchQuery.trim()) return entries;
    const q = this.searchQuery.toLowerCase();
    return entries.filter(e => e.narration.toLowerCase().includes(q) || (e.partyName || '').toLowerCase().includes(q));
  }

  get closingBalance() { return this.result?.closingBalance || 0; }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    const range: DateRange | undefined = this.startDate && this.endDate
      ? { start: this.startDate, end: this.endDate } : undefined;
    this.accountingService.getLedger(this.shopId, range).subscribe({
      next: res => { this.result = res.data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Failed to load ledger.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  clearFilter() { this.startDate = ''; this.endDate = ''; this.typeFilter = ''; this.sourceFilter = ''; this.load(); }

  getSourceClass(source: string) {
    const m: Record<string, string> = {
      invoice: 'bg-green-100 text-green-700',
      expense: 'bg-red-100 text-red-700',
      return: 'bg-orange-100 text-orange-700',
      credit_note: 'bg-yellow-100 text-yellow-700',
    };
    return m[source] || 'bg-gray-100 text-gray-600';
  }
}
