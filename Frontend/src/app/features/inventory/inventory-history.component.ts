import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-inventory-history',
  imports: [CommonModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Main Panel ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Inventory Audit Log</h2>
            <p class="text-xs text-gray-400 mt-0.5">Track all stock movements and adjustments</p>
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Date</th>
                  <th class="px-6 py-3">Product</th>
                  <th class="px-6 py-3">SKU</th>
                  <th class="px-6 py-3">Type</th>
                  <th class="px-6 py-3">Change</th>
                  <th class="px-6 py-3">New Stock</th>
                  <th class="px-6 py-3">Reason / Source</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading audit log...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (history.length === 0) {
                  <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500 italic">
                      No history records found.
                    </td>
                  </tr>
                } @else {
                  @for (record of history; track record.id) {
                    <tr class="transition-colors hover:bg-gray-50 group">
                      <td class="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                        {{ toDate(record.createdAt) | date: 'short' }}
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {{ record.productName || (record.productId | slice: -8) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 font-mono text-xs text-gray-500">
                        {{ record.variantSku || '—' }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                          [ngClass]="getTypeBadgeClass(record.changeType)"
                        >
                          {{ record.changeType }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm font-bold" [ngClass]="getChangeClass(record.changeType)">
                        {{ record.changeType === 'add' ? '+' : '-' }}{{ record.amount }}
                      </td>
                      <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                        {{ record.newStock }}
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-500 font-medium max-w-xs truncate" [title]="record.reason">
                        {{ record.reason }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InventoryHistoryComponent implements OnInit {
  history: any[] = [];
  loading = true;
  shopId: string | null = null;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadHistory();
      }
    });
  }

  loadHistory() {
    if (!this.shopId) return;
    this.loading = true;
    this.inventoryService.getInventoryHistory(this.shopId).subscribe({
      next: (res) => {
        this.history = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'add':
        return 'bg-green-100 text-green-700';
      case 'subtract':
        return 'bg-orange-100 text-orange-700';
      case 'sale':
        return 'bg-red-100 text-red-700';
      case 'set':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getChangeClass(type: string): string {
    switch (type) {
      case 'add':
        return 'text-green-600';
      case 'subtract':
      case 'sale':
        return 'text-red-600';
      case 'set':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate();
    }
    if (typeof value === 'object') {
      if ('seconds' in value) return new Date(value.seconds * 1000);
      if ('_seconds' in value) return new Date(value._seconds * 1000);
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
}
