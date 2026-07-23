import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Inventory } from '../../core/models/inventory.model';
import { environment } from '../../../environments/environment';
import { getLocalISODate } from '../../core/utils/date.utils';
import { UiNumberInputComponent } from '../../shared/components/ui-number-input.component';

interface StockEntry {
  productId: string;
  productName: string;
  systemStock: number;
  openingCount: number;
  sku?: string;
}

interface DailyStockRecord {
  id: string;
  shopId: string;
  date: string;
  type: 'opening' | 'closing';
  entries: StockEntry[];
  submittedBy?: string;
  notes?: string;
  createdAt: any;
}

@Component({
  selector: 'app-daily-opening-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, UiNumberInputComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Daily Opening Stock</h2>
          <p class="text-xs text-gray-500 mt-0.5">Record today's opening stock count for all products</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
            <i class="bi bi-calendar-check text-blue-500 text-sm"></i>
            <span class="text-sm font-semibold text-blue-700">{{ today }}</span>
          </div>
          @if (existingRecord) {
            <span class="px-3 py-1.5 bg-green-50 rounded-xl border border-green-100 text-xs font-semibold text-green-700 flex items-center gap-1">
              <i class="bi bi-check-circle-fill"></i> Already Submitted
            </span>
          }
        </div>
      </div>

      <!-- Already submitted banner -->
      @if (existingRecord && !editMode) {
        <div class="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <i class="bi bi-check-circle-fill text-green-500"></i>
            <span class="text-sm text-green-700 font-medium">Opening stock for today has been submitted.</span>
            <span class="text-xs text-green-500">{{ existingRecord.entries.length }} products recorded</span>
          </div>
          <button
            (click)="editMode = true"
            class="px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
          >
            <i class="bi bi-pencil mr-1"></i> Edit
          </button>
        </div>
      }

      <!-- Search + Filter -->
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
        <div class="flex items-center gap-3 ml-auto">
          <span class="text-xs text-gray-500">
            <span class="font-semibold text-gray-700">{{ filledCount }}</span> / {{ entries.length }} filled
          </span>
          @if (!existingRecord || editMode) {
            <button
              (click)="submitOpeningStock()"
              [disabled]="saving || filledCount === 0"
              class="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm shadow-primary-200"
            >
              @if (saving) {
                <i class="bi bi-hourglass-split animate-spin"></i> Saving...
              } @else {
                <i class="bi bi-check2-all"></i> Submit Opening Stock
              }
            </button>
          }
        </div>
      </div>

      <!-- Stats -->
      <div class="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-blue-400"></div>
          <span class="text-xs text-gray-500">Total Products: <strong class="text-gray-700">{{ entries.length }}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-400"></div>
          <span class="text-xs text-gray-500">Total System Stock: <strong class="text-gray-700">{{ totalSystemStock }}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-orange-400"></div>
          <span class="text-xs text-gray-500">Total Opening Count: <strong class="text-gray-700">{{ totalOpeningCount }}</strong></span>
        </div>
        @if (variance !== 0) {
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-400"></div>
            <span class="text-xs text-gray-500">Variance: <strong class="text-red-600">{{ variance > 0 ? '+' : '' }}{{ variance }}</strong></span>
          </div>
        }
      </div>

      <!-- Product List -->
      <div class="flex-1 overflow-y-auto">
        @if (loading) {
          <div class="flex items-center justify-center h-40">
            <div class="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (filteredEntries.length === 0) {
          <div class="flex flex-col items-center justify-center h-40 text-center">
            <i class="bi bi-box-seam text-4xl text-gray-200 mb-2"></i>
            <p class="text-sm text-gray-400">No products found</p>
          </div>
        } @else {
          <!-- Table Header -->
          <div class="sticky top-0 bg-gray-100 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 z-10">
            <div class="col-span-1">#</div>
            <div class="col-span-5">Product</div>
            <div class="col-span-2 text-right">System Stock</div>
            <div class="col-span-2 text-right">Opening Count</div>
            <div class="col-span-2 text-right">Variance</div>
          </div>

          @for (entry of filteredEntries; track entry.productId; let i = $index) {
            <div
              class="px-6 py-3 grid grid-cols-12 gap-4 items-center border-b border-gray-50 hover:bg-white transition-colors"
              [class.bg-yellow-50]="entry.openingCount !== entry.systemStock && entry.openingCount !== null && !isReadonly"
            >
              <div class="col-span-1">
                <span class="text-xs text-gray-400">{{ i + 1 }}</span>
              </div>
              <div class="col-span-5">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ entry.productName }}</p>
                @if (entry.sku) {
                  <p class="text-xs text-gray-400">{{ entry.sku }}</p>
                }
              </div>
              <div class="col-span-2 text-right">
                <span class="text-sm font-semibold text-blue-600">{{ entry.systemStock }}</span>
              </div>
              <div class="col-span-2 text-right">
                @if (isReadonly) {
                  <span class="text-sm font-semibold text-gray-700">{{ entry.openingCount }}</span>
                } @else {
                  <div class="w-32 ml-auto">
                    <app-ui-number-input
                      [(ngModel)]="entry.openingCount"
                      [min]="0"
                    ></app-ui-number-input>
                  </div>
                }
              </div>
              <div class="col-span-2 text-right">
                @if (entry.openingCount !== null) {
                  <span
                    class="text-sm font-bold"
                    [class.text-gray-400]="entry.openingCount === entry.systemStock"
                    [class.text-red-500]="entry.openingCount < entry.systemStock"
                    [class.text-green-500]="entry.openingCount > entry.systemStock"
                  >
                    {{ entry.openingCount === entry.systemStock ? '—' : (entry.openingCount - entry.systemStock > 0 ? '+' : '') + (entry.openingCount - entry.systemStock) }}
                  </span>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Notes Bar -->
      @if (!isReadonly) {
        <div class="bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0">
          <i class="bi bi-chat-left-text text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="notes"
            placeholder="Add notes (optional)..."
            class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary-400 transition-all"
          />
        </div>
      }
    </div>
  `,
})
export class DailyOpeningStockComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  router = inject(Router);

  shopId = '';
  loading = true;
  saving = false;
  editMode = false;
  today = getLocalISODate();
  notes = '';
  searchQuery = '';
  entries: StockEntry[] = [];
  existingRecord: DailyStockRecord | null = null;

  get isReadonly() { return !!this.existingRecord && !this.editMode; }
  get filledCount() { return this.entries.filter(e => e.openingCount !== null && e.openingCount >= 0).length; }
  get totalSystemStock() { return this.entries.reduce((s, e) => s + Number(e.systemStock || 0), 0); }
  get totalOpeningCount() { return this.entries.reduce((s, e) => s + Number(e.openingCount || 0), 0); }
  get variance() { return this.totalOpeningCount - this.totalSystemStock; }
  get filteredEntries() {
    if (!this.searchQuery) return this.entries;
    const q = this.searchQuery.toLowerCase();
    return this.entries.filter(e => e.productName?.toLowerCase().includes(q) || e.sku?.toLowerCase().includes(q));
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.shopId = user?.shopId || '';
    this.loadData();
  }

  loadData() {
    this.loading = true;
    // Check for existing record today
    this.http.get<any>(`${environment.apiUrl}/daily-stock/shop/${this.shopId}/today?type=opening&date=${this.today}`).subscribe({
      next: (res) => {
        if (res?.data) {
          this.existingRecord = res.data;
          // Load entries from existing record
          this.loadInventory(() => {
            if (this.existingRecord?.entries) {
              this.existingRecord.entries.forEach(saved => {
                const entry = this.entries.find(e => e.productId === saved.productId);
                if (entry) entry.openingCount = saved.openingCount;
              });
            }
          });
        } else {
          this.loadInventory();
        }
      },
      error: () => this.loadInventory()
    });
  }

  loadInventory(callback?: () => void) {
    this.inventoryService.getInventory(this.shopId).subscribe({
      next: (res) => {
        const inventoryList: Inventory[] = res.data || [];
        this.entries = inventoryList.map(inv => ({
          productId: inv.productId,
          productName: inv.productName || 'Unknown Product',
          systemStock: inv.currentStock,
          openingCount: inv.currentStock, // pre-fill with system stock
          sku: inv.variantSku,
        }));
        this.loading = false;
        if (callback) callback();
      },
      error: () => { this.loading = false; }
    });
  }

  submitOpeningStock() {
    if (this.saving) return;
    this.saving = true;

    const payload = {
      shopId: this.shopId,
      date: this.today,
      type: 'opening',
      entries: this.entries.map(e => ({
        productId: e.productId,
        productName: e.productName,
        systemStock: e.systemStock,
        openingCount: e.openingCount,
        sku: e.sku,
      })),
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
        this.toast.showSuccess('Opening stock submitted successfully!');
      },
      error: () => {
        this.toast.showError('Failed to submit opening stock');
        this.saving = false;
      }
    });
  }
}
