import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CRMService, SegmentSummary, CRMCustomer, CustomerSegment } from '../../../core/services/crm.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

@Component({
  selector: 'app-customer-segments',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <i class="bi bi-bar-chart-steps text-indigo-600"></i> Customer Segmentation
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">Customers grouped by purchase behavior</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="recalculate()" [disabled]="recalculating" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            <i class="bi bi-arrow-clockwise" [class.animate-spin]="recalculating"></i>
            {{ recalculating ? 'Updating...' : 'Recalculate Segments' }}
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-6">
        @if (loading) {
          <div class="flex items-center justify-center h-48"><app-ui-loading size="md"></app-ui-loading></div>
        } @else if (error) {
          <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">{{ error }}</div>
        } @else {
          <!-- Segment Summary Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            @for (seg of summaries; track seg.segment) {
              <button
                (click)="activeSegment = activeSegment === seg.segment ? '' : seg.segment"
                class="rounded-xl border-2 p-4 text-left transition-all hover:shadow-md"
                [ngClass]="getSegmentCardClass(seg, activeSegment === seg.segment)"
              >
                <div class="text-2xl font-black mb-1">{{ seg.count }}</div>
                <div class="text-sm font-bold mb-1">{{ seg.label }}</div>
                <div class="text-xs opacity-70">{{ seg.description }}</div>
                <div class="mt-2 text-xs font-semibold">₹{{ seg.totalRevenue | number }}</div>
              </button>
            }
          </div>

          <!-- Customer Table -->
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-900">
                {{ activeSegment ? (activeSegment | titlecase) + ' Customers' : 'All Customers' }}
                <span class="text-gray-400 font-normal ml-2">({{ filteredCustomers.length }})</span>
              </h3>
              <div class="relative">
                <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input type="text" [(ngModel)]="searchQuery" placeholder="Search..." class="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
              </div>
            </div>
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-5 py-3">Customer</th>
                  <th class="px-5 py-3">Contact</th>
                  <th class="px-5 py-3 text-center">Orders</th>
                  <th class="px-5 py-3 text-right">Total Spent</th>
                  <th class="px-5 py-3 text-center">Segment</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @if (filteredCustomers.length === 0) {
                  <tr><td colspan="5" class="py-10 text-center text-gray-400 text-sm">No customers found.</td></tr>
                } @else {
                  @for (c of filteredCustomers; track c.id) {
                    <tr class="hover:bg-indigo-50/20 transition-colors">
                      <td class="px-5 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" [ngClass]="getAvatarClass(c.segment)">
                            {{ c.name.charAt(0).toUpperCase() }}
                          </div>
                          <span class="text-sm font-medium text-gray-900">{{ c.name }}</span>
                        </div>
                      </td>
                      <td class="px-5 py-3 text-xs text-gray-500">{{ c.phoneNumber }}</td>
                      <td class="px-5 py-3 text-sm text-center text-gray-700">{{ c.totalOrders }}</td>
                      <td class="px-5 py-3 text-sm text-right font-semibold text-gray-900">₹{{ c.totalSpent | number }}</td>
                      <td class="px-5 py-3 text-center">
                        <span class="text-xs px-2 py-0.5 rounded-full font-bold capitalize" [ngClass]="getSegmentBadge(c.segment)">{{ c.segment | titlecase }}</span>
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
export class CustomerSegments implements OnInit {
  summaries: SegmentSummary[] = [];
  buckets: Record<string, CRMCustomer[]> = {};
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  activeSegment: string = '';
  searchQuery = '';
  recalculating = false;

  constructor(
    private crmService: CRMService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredCustomers(): CRMCustomer[] {
    const all: CRMCustomer[] = this.activeSegment
      ? (this.buckets[this.activeSegment] || [])
      : Object.values(this.buckets).flat();
    if (!this.searchQuery.trim()) return all;
    const q = this.searchQuery.toLowerCase();
    return all.filter(c => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q));
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
    this.crmService.getSegmentedCustomers(this.shopId).subscribe({
      next: res => {
        this.summaries = res.data.summaries;
        this.buckets = res.data.buckets;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Failed to load segments.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  recalculate() {
    if (!this.shopId) return;
    this.recalculating = true;
    this.crmService.recalculateSegments(this.shopId).subscribe({
      next: res => { this.recalculating = false; this.load(); },
      error: () => { this.recalculating = false; this.cdr.detectChanges(); },
    });
  }

  getSegmentCardClass(seg: SegmentSummary, active: boolean): string {
    const base: Record<string, string> = {
      vip: 'bg-purple-50 border-purple-200 text-purple-800',
      loyal: 'bg-blue-50 border-blue-200 text-blue-800',
      regular: 'bg-green-50 border-green-200 text-green-800',
      new: 'bg-teal-50 border-teal-200 text-teal-800',
      at_risk: 'bg-red-50 border-red-200 text-red-800',
    };
    const activeClass: Record<string, string> = {
      vip: 'ring-2 ring-purple-500',
      loyal: 'ring-2 ring-blue-500',
      regular: 'ring-2 ring-green-500',
      new: 'ring-2 ring-teal-500',
      at_risk: 'ring-2 ring-red-500',
    };
    return (base[seg.segment] || 'bg-gray-50 border-gray-200 text-gray-800') + (active ? ` ${activeClass[seg.segment]}` : '');
  }

  getAvatarClass(seg: CustomerSegment): string {
    const m: Record<string, string> = {
      vip: 'bg-purple-100 text-purple-700',
      loyal: 'bg-blue-100 text-blue-700',
      regular: 'bg-green-100 text-green-700',
      new: 'bg-teal-100 text-teal-700',
      at_risk: 'bg-red-100 text-red-700',
    };
    return m[seg] || 'bg-gray-100 text-gray-600';
  }

  getSegmentBadge(seg: CustomerSegment): string {
    const m: Record<string, string> = {
      vip: 'bg-purple-100 text-purple-700',
      loyal: 'bg-blue-100 text-blue-700',
      regular: 'bg-green-100 text-green-700',
      new: 'bg-teal-100 text-teal-700',
      at_risk: 'bg-red-100 text-red-700',
    };
    return m[seg] || 'bg-gray-100 text-gray-600';
  }
}
