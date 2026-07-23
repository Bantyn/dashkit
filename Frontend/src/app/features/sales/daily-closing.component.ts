import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import { getLocalISODate } from '../../core/utils/date.utils';
import { UiNumberInputComponent } from '../../shared/components/ui-number-input.component';

interface ClosingStockEntry {
  productId: string;
  productName: string;
  openingStock: number;
  purchases: number;
  sales: number;
  returns: number;
  adjustments: number;
  systemStock: number;
  physicalCount: number;
  variance: number;
  sku?: string;
}

@Component({
  selector: 'app-daily-closing',
  standalone: true,
  imports: [CommonModule, FormsModule, UiNumberInputComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Daily Closing Stock</h2>
          <p class="text-xs text-gray-500 mt-0.5">End-of-day physical stock count verification</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
            <i class="bi bi-sunset text-orange-500 text-sm"></i>
            <span class="text-sm font-semibold text-orange-700">{{ today }}</span>
          </div>
          @if (existingRecord) {
            <span class="px-3 py-1.5 bg-green-50 rounded-xl border border-green-100 text-xs font-semibold text-green-700 flex items-center gap-1">
              <i class="bi bi-check-circle-fill"></i> Closed
            </span>
          }
        </div>
      </div>

      <!-- Already Submitted -->
      @if (existingRecord && !editMode) {
        <div class="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <i class="bi bi-check-circle-fill text-amber-500"></i>
            <span class="text-sm text-amber-700 font-medium">Closing stock for today has been submitted.</span>
          </div>
          <button
            (click)="editMode = true"
            class="px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
          >
            <i class="bi bi-pencil mr-1"></i> Edit
          </button>
        </div>
      }

      <!-- Summary Stats -->
      <div class="bg-white border-b border-gray-100 px-6 py-3 grid grid-cols-4 gap-4 shrink-0">
        <div class="text-center">
          <p class="text-xs text-gray-500">Total Products</p>
          <p class="text-lg font-bold text-gray-800">{{ entries.length }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Matched</p>
          <p class="text-lg font-bold text-green-600">{{ matchedCount }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Short</p>
          <p class="text-lg font-bold text-red-500">{{ shortCount }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Excess</p>
          <p class="text-lg font-bold text-blue-500">{{ excessCount }}</p>
        </div>
      </div>

      <!-- Controls -->
      <div class="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 shrink-0">
        <div class="relative flex-1 max-w-sm">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search products..."
            class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary-400 transition-all"
          />
        </div>
        <select
          [(ngModel)]="filterVariance"
          class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
        >
          <option value="">All Products</option>
          <option value="match">Matched Only</option>
          <option value="short">Short Only</option>
          <option value="excess">Excess Only</option>
        </select>
        <div class="ml-auto flex items-center gap-3">
          <span class="text-xs text-gray-500">
            <span class="font-semibold text-gray-700">{{ filledCount }}</span>/{{ entries.length }} filled
          </span>
          @if (!existingRecord || editMode) {
            <button
              (click)="submitClosingStock()"
              [disabled]="saving || filledCount === 0"
              class="px-5 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm shadow-orange-200"
            >
              @if (saving) {
                <i class="bi bi-hourglass-split animate-spin"></i> Closing...
              } @else {
                <i class="bi bi-door-closed-fill"></i> Submit Closing Stock
              }
            </button>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-y-auto">
        @if (loading) {
          <div class="flex items-center justify-center h-40">
            <div class="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else {
          <!-- Table Header -->
          <div class="sticky top-0 bg-gray-100 px-6 py-3 grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 z-10">
            <div class="col-span-1">#</div>
            <div class="col-span-3">Product</div>
            <div class="col-span-1 text-right">Opening</div>
            <div class="col-span-1 text-right">Purchase</div>
            <div class="col-span-1 text-right">Sales</div>
            <div class="col-span-1 text-right">Returns</div>
            <div class="col-span-1 text-right">Adjust</div>
            <div class="col-span-1 text-right">Expected</div>
            <div class="col-span-1 text-right">Physical</div>
            <div class="col-span-1 text-right">Variance</div>
          </div>

          @for (entry of filteredEntries; track entry.productId; let i = $index) {
            <div
              class="px-6 py-3 grid grid-cols-12 gap-2 items-center border-b border-gray-50 hover:bg-white transition-colors"
              [class.bg-red-50]="entry.variance < 0 && !isReadonly"
              [class.bg-green-50]="entry.variance > 0 && !isReadonly"
            >
              <div class="col-span-1">
                <span class="text-xs text-gray-400">{{ i + 1 }}</span>
              </div>
              <div class="col-span-3">
                <p class="text-xs font-semibold text-gray-800 truncate">{{ entry.productName }}</p>
                @if (entry.sku) {
                  <p class="text-[10px] text-gray-400">{{ entry.sku }}</p>
                }
              </div>
              <div class="col-span-1 text-right">
                <span class="text-xs text-gray-500">{{ entry.openingStock }}</span>
              </div>
              <div class="col-span-1 text-right">
                <span class="text-xs text-gray-500">{{ entry.purchases }}</span>
              </div>
              <div class="col-span-1 text-right">
                <span class="text-xs text-gray-500">{{ entry.sales }}</span>
              </div>
              <div class="col-span-1 text-right">
                <span class="text-xs text-gray-500">{{ entry.returns }}</span>
              </div>
              <div class="col-span-1 text-right">
                <span class="text-xs text-gray-500">{{ entry.adjustments }}</span>
              </div>
              <div class="col-span-1 text-right">
                <span class="text-xs font-semibold text-blue-600">{{ entry.systemStock }}</span>
              </div>
              <div class="col-span-1 text-right">
                @if (isReadonly) {
                  <span class="text-xs font-semibold text-gray-700">{{ entry.physicalCount }}</span>
                } @else {
                  <div class="w-full">
                    <app-ui-number-input
                      [(ngModel)]="entry.physicalCount"
                      (ngModelChange)="updateVariance(entry)"
                      [min]="0"
                    ></app-ui-number-input>
                  </div>
                }
              </div>
              <div class="col-span-1 text-right">
                <span
                  class="text-xs font-bold"
                  [class.text-gray-400]="entry.variance === 0"
                  [class.text-red-500]="entry.variance < 0"
                  [class.text-green-500]="entry.variance > 0"
                >
                  {{ entry.variance === 0 ? '✓' : (entry.variance > 0 ? '+' : '') + entry.variance }}
                </span>
              </div>
            </div>
          }
        }
      </div>

      <!-- Notes & Actions Bar -->
      @if (!isReadonly) {
        <div class="bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0">
          <i class="bi bi-chat-left-text text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="notes"
            placeholder="Add closing notes (optional)..."
            class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-orange-400 transition-all"
          />
          @if (hasVariances) {
            <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input type="checkbox" [(ngModel)]="autoAdjust" class="w-4 h-4 rounded accent-orange-500" />
              Auto-adjust system stock to physical count
            </label>
          }
        </div>
      }
    </div>
  `,
})
export class DailyClosingComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  router = inject(Router);

  shopId = '';
  loading = true;
  saving = false;
  editMode = false;
  autoAdjust = false;
  today = getLocalISODate();
  notes = '';
  searchQuery = '';
  filterVariance = '';
  entries: ClosingStockEntry[] = [];
  existingRecord: any = null;

  get isReadonly() { return !!this.existingRecord && !this.editMode; }
  get filledCount() { return this.entries.filter(e => e.physicalCount !== null && e.physicalCount >= 0).length; }
  get matchedCount() { return this.entries.filter(e => e.variance === 0).length; }
  get shortCount() { return this.entries.filter(e => e.variance < 0).length; }
  get excessCount() { return this.entries.filter(e => e.variance > 0).length; }
  get hasVariances() { return this.entries.some(e => e.variance !== 0); }

  get filteredEntries() {
    let list = this.entries;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e => e.productName?.toLowerCase().includes(q) || e.sku?.toLowerCase().includes(q));
    }
    if (this.filterVariance === 'match') list = list.filter(e => e.variance === 0);
    else if (this.filterVariance === 'short') list = list.filter(e => e.variance < 0);
    else if (this.filterVariance === 'excess') list = list.filter(e => e.variance > 0);
    return list;
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.shopId = user?.shopId || '';
    this.loadData();
  }

  updateVariance(entry: ClosingStockEntry) {
    entry.variance = (entry.physicalCount || 0) - entry.systemStock;
  }

  loadData() {
    this.loading = true;
    // Check existing closing record today
    this.http.get<any>(`${environment.apiUrl}/daily-stock/shop/${this.shopId}/today?type=closing&date=${this.today}`).subscribe({
      next: (res) => {
        if (res?.data) this.existingRecord = res.data;
        this.loadInventoryAndVariance();
      },
      error: () => this.loadInventoryAndVariance()
    });
  }

  loadInventoryAndVariance() {
    // 1. Load actual current inventory
    this.inventoryService.getInventory(this.shopId).subscribe({
      next: (res) => {
        const inv = res.data || [];

        // 2. Load today's variance calculations from the backend
        this.http.get<any>(`${environment.apiUrl}/daily-stock/shop/${this.shopId}/variance?date=${this.today}`).subscribe({
          next: (vRes) => {
            const varianceData = vRes?.data || [];
            const varianceMap = new Map<string, any>();
            varianceData.forEach((vd: any) => {
              varianceMap.set(`${vd.productId}_${vd.variantSku || ''}`, vd);
            });

            // Build entries list
            const entryMap = new Map<string, ClosingStockEntry>();
            inv.forEach(i => {
              const key = `${i.productId}_${i.variantSku || ''}`;
              const vd = varianceMap.get(key);

              if (vd) {
                entryMap.set(i.productId, {
                  productId: i.productId,
                  productName: i.productName || 'Unknown',
                  openingStock: vd.opening || 0,
                  purchases: vd.purchases || 0,
                  sales: vd.sales || 0,
                  returns: (vd.salesReturns || 0) - (vd.purchaseReturns || 0),
                  adjustments: vd.adjustments || 0,
                  systemStock: vd.expectedClosing ?? i.currentStock,
                  physicalCount: vd.expectedClosing ?? i.currentStock,
                  variance: 0,
                  sku: i.variantSku,
                });
              } else {
                // If no movements today, current stock is also opening and expected stock
                entryMap.set(i.productId, {
                  productId: i.productId,
                  productName: i.productName || 'Unknown',
                  openingStock: i.currentStock,
                  purchases: 0,
                  sales: 0,
                  returns: 0,
                  adjustments: 0,
                  systemStock: i.currentStock,
                  physicalCount: i.currentStock,
                  variance: 0,
                  sku: i.variantSku,
                });
              }
            });

            // Overlay existing record values if already closed today
            if (this.existingRecord?.entries) {
              this.existingRecord.entries.forEach((e: any) => {
                const entry = entryMap.get(e.productId);
                if (entry) {
                  entry.physicalCount = e.physicalCount;
                  entry.openingStock = e.openingStock ?? entry.openingStock;
                  this.updateVariance(entry);
                }
              });
            }

            this.entries = Array.from(entryMap.values());
            this.loading = false;
          },
          error: () => {
            // Fallback if variance endpoint fails — load list without variance detail
            const entryMap = new Map<string, ClosingStockEntry>();
            inv.forEach(i => {
              entryMap.set(i.productId, {
                productId: i.productId,
                productName: i.productName || 'Unknown',
                openingStock: i.currentStock,
                purchases: 0,
                sales: 0,
                returns: 0,
                adjustments: 0,
                systemStock: i.currentStock,
                physicalCount: i.currentStock,
                variance: 0,
                sku: i.variantSku,
              });
            });
            this.entries = Array.from(entryMap.values());
            this.loading = false;
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  submitClosingStock() {
    if (this.saving) return;
    this.saving = true;

    const payload = {
      shopId: this.shopId,
      date: this.today,
      type: 'closing',
      entries: this.entries.map(e => ({
        productId: e.productId,
        productName: e.productName,
        openingStock: e.openingStock,
        systemStock: e.systemStock,
        physicalCount: e.physicalCount,
        variance: e.variance,
        sku: e.sku,
      })),
      autoAdjust: this.autoAdjust,
      notes: this.notes,
    };

    const req$ = this.existingRecord
      ? this.http.put(`${environment.apiUrl}/daily-stock/${this.existingRecord.id}`, payload)
      : this.http.post(`${environment.apiUrl}/daily-stock`, payload);

    req$.subscribe({
      next: (res: any) => {
        this.existingRecord = res.data || payload as any;
        this.editMode = false;
        this.saving = false;
        this.toast.showSuccess('Closing stock submitted!');
      },
      error: () => {
        this.toast.showError('Failed to submit closing stock');
        this.saving = false;
      }
    });
  }
}

