import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountingService, GSTReport, DateRange } from '../../../core/services/accounting.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { UiDatePickerComponent } from '../../../shared/components/ui-date-picker.component';

@Component({
  selector: 'app-gst-report',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, UiDropdownComponent, UiDatePickerComponent],
  template: `
    <div class="h-[calc(100vh-64px)] bg-[#f5f7fa] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <i class="bi bi-file-earmark-text text-emerald-600"></i> GST Report
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">CGST, SGST and IGST summary from invoices</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <app-ui-dropdown
            [(ngModel)]="quickPeriod"
            (onSelect)="onQuickPeriod()"
            [options]="periodOptions"
          ></app-ui-dropdown>
          <app-ui-date-picker [(ngModel)]="startDate"></app-ui-date-picker>
          <span class="text-gray-400 text-sm">to</span>
          <app-ui-date-picker [(ngModel)]="endDate"></app-ui-date-picker>
          <button (click)="load()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <i class="bi bi-funnel-fill mr-1"></i> Generate
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-6">
        @if (loading) {
          <div class="flex items-center justify-center h-48"><app-ui-loading size="md"></app-ui-loading></div>
        } @else if (error) {
          <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">{{ error }}</div>
        } @else if (report) {
          <!-- Summary Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Taxable Revenue</div>
              <div class="text-xl font-black text-gray-900">₹{{ report.summary.totalTaxableRevenue | number }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ report.summary.taxableInvoiceCount }} invoices</div>
            </div>
            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
              <div class="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total GST Collected</div>
              <div class="text-xl font-black text-emerald-700">₹{{ report.summary.totalOutputTax | number }}</div>
              <div class="text-xs text-emerald-500 mt-1">Net output tax liability</div>
            </div>
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
              <div class="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">CGST + SGST</div>
              <div class="text-xl font-black text-blue-700">₹{{ (report.summary.totalCgst + report.summary.totalSgst) | number }}</div>
              <div class="text-xs text-blue-500 mt-1">Intra-state</div>
            </div>
            <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 shadow-sm">
              <div class="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Effective Tax Rate</div>
              <div class="text-xl font-black text-purple-700">{{ report.summary.effectiveTaxRate }}</div>
              <div class="text-xs text-purple-500 mt-1">Average rate</div>
            </div>
          </div>

          <!-- GST Breakdown Table -->
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-900">GST Breakdown — {{ report.period }}</h3>
              <span class="text-xs text-gray-400">GSTR-1 Summary</span>
            </div>
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-5 py-3">Tax Bucket</th>
                  <th class="px-5 py-3 text-right">Taxable Sales</th>
                  <th class="px-5 py-3 text-right">Tax Amount</th>
                  <th class="px-5 py-3 text-right">Effective Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (row of report.rows; track row.taxBucket) {
                  <tr [ngClass]="row.taxBucket === 'Total' ? 'bg-emerald-50 font-bold' : 'hover:bg-gray-50/50'">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" [ngClass]="getBucketDot(row.taxBucket)"></span>
                        <span class="text-sm font-semibold text-gray-800">{{ row.taxBucket }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-sm text-right text-gray-700">₹{{ row.taxableSales | number }}</td>
                    <td class="px-5 py-4 text-sm text-right font-bold text-emerald-700">₹{{ row.taxAmount | number }}</td>
                    <td class="px-5 py-4 text-sm text-right text-gray-500">{{ row.effectiveRate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- IGST Note -->
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <i class="bi bi-info-circle mr-2"></i>
            <strong>Note:</strong> IGST applies to inter-state transactions. If IGST is ₹0, all sales are intra-state (CGST + SGST).
          </div>
        }
      </div>
    </div>
  `,
})
export class GSTReportComponent implements OnInit {
  report: GSTReport | null = null;
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  startDate = '';
  endDate = '';
  quickPeriod = 'this_month';

  readonly periodOptions = [
    { value: '', label: 'Custom Range' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' }
  ];

  constructor(
    private accountingService: AccountingService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.onQuickPeriod();
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  onQuickPeriod() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    if (this.quickPeriod === 'this_month') {
      this.startDate = new Date(y, m, 1).toISOString().substring(0, 10);
      this.endDate = new Date(y, m + 1, 0).toISOString().substring(0, 10);
    } else if (this.quickPeriod === 'last_month') {
      this.startDate = new Date(y, m - 1, 1).toISOString().substring(0, 10);
      this.endDate = new Date(y, m, 0).toISOString().substring(0, 10);
    } else if (this.quickPeriod === 'this_quarter') {
      const q = Math.floor(m / 3);
      this.startDate = new Date(y, q * 3, 1).toISOString().substring(0, 10);
      this.endDate = new Date(y, q * 3 + 3, 0).toISOString().substring(0, 10);
    } else if (this.quickPeriod === 'this_year') {
      this.startDate = `${y}-01-01`;
      this.endDate = `${y}-12-31`;
    }
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    const range: DateRange | undefined = this.startDate && this.endDate
      ? { start: this.startDate, end: this.endDate } : undefined;
    this.accountingService.getGSTReport(this.shopId, range).subscribe({
      next: res => { this.report = res.data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Failed to load GST report.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  getBucketDot(bucket: string) {
    const m: Record<string, string> = {
      CGST: 'bg-blue-400', SGST: 'bg-indigo-400', IGST: 'bg-purple-400', Total: 'bg-emerald-500',
    };
    return m[bucket] || 'bg-gray-300';
  }
}
