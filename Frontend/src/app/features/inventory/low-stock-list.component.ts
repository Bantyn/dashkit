import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { Inventory } from '../../core/models/inventory.model';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ToastService } from '../../core/services/toast.service';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';
import { FeatureGuardService } from '../../core/services/feature-guard.service';

interface InventoryUI extends Inventory {
  isEditing?: boolean;
}

@Component({
  selector: 'app-low-stock-list',
  imports: [CommonModule, FormsModule, UiLoadingComponent, HasFeatureDirective],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- ─── Unified Header Row ─── -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Main Panel Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-normal text-red-600">Low Stock Alerts</h2>
            <p class="text-xs text-gray-400 mt-0.5">Items that are below their minimum threshold</p>
          </div>
          <span class="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-normal tracking-wider">
            {{ items.length }} Alerts
          </span>
        </div>

        <!-- Detail Panel Header (if selected) -->
        <div 
          *ngIf="selectedItem"
          class="w-[400px] shrink-0 px-6 py-5 border-l border-gray-200 flex justify-between items-center shrink-0 bg-white"
        >
          <div>
            <h3 class="text-lg font-normal text-gray-900">Stock Management</h3>
            <p class="text-xs text-gray-400 mt-0.5 font-medium truncate max-w-[320px]">
              {{ selectedItem.productName }}
            </p>
          </div>
          <button 
            (click)="closeDetail()" 
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-all"
          >
            <i class="bi bi-x-lg text-lg"></i>
          </button>
        </div>
      </div>

      <!-- ─── Content Area ─── -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Main Panel Content -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          <!-- Table -->
          <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg  border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-normal text-gray-500 tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Product</th>
                  <th class="px-6 py-3">SKU</th>
                  <th class="px-6 py-3">Current Stock</th>
                  <th class="px-6 py-3">Threshold</th>
                  <th class="px-6 py-3">Last Updated</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Checking stock levels...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (items.length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                      <div class="flex flex-col items-center gap-2">
                        <i class="bi bi-check-circle text-4xl text-green-500"></i>
                        <p class="text-gray-500 font-medium">All stock levels are healthy!</p>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (item of items; track item.id) {
                    <tr 
                      (click)="selectItem(item)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedItem?.id === item.id"
                    >
                      <td class="px-6 py-4">
                        <div class="text-sm font-normal text-gray-900 group-hover:text-primary-600 transition-colors">
                          {{ item.productName || item.productId }}
                        </div>
                      </td>
                      <td class="px-6 py-4 font-mono text-xs text-gray-500">
                        {{ item.variantSku || '—' }}
                      </td>
                      <td class="px-6 py-4 text-sm font-normal text-red-600">
                        {{ item.currentStock }}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500 font-medium italic">
                        {{ item.lowStockThreshold }}
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-500">
                        {{ toDate(item.updatedAt) | date: 'medium' }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <button
                          class="px-4 py-1.5 bg-red-600 text-white text-xs font-normal rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── Right Panel: Detail & Adjustment Content ─── -->
      @if (selectedItem) {
        <div class="w-[400px] shrink-0 bg-white flex flex-col border-l border-gray-200 transition-all duration-300">
          <!-- Panel Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <!-- Section 1: Current Status Card -->
            <div class="bg-gray-50 border border-gray-150 rounded-xl p-5 space-y-4">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs text-gray-500 font-normal tracking-wider">Current Stock</span>
                  <div class="text-3xl font-black text-gray-900 mt-1">
                    {{ selectedItem.currentStock }} <span class="text-sm font-medium text-gray-400">units</span>
                  </div>
                </div>
                <span 
                  [class]="getStockStatusClass(selectedItem)"
                  class="px-3 py-1 rounded-full text-xs font-normal tracking-widest"
                >
                  {{ getStockStatusLabel(selectedItem) }}
                </span>
              </div>

              <div class="h-px bg-gray-200"></div>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-xs text-gray-400 block font-medium">SKU</span>
                  <span class="font-mono text-gray-700 font-normal block truncate" [title]="selectedItem.variantSku">{{ selectedItem.variantSku || '—' }}</span>
                </div>
                <div *appHasFeature="'inv_low_stock_alerts'">
                  <span class="text-xs text-gray-400 block font-medium">Low Stock Warning</span>
                  <span class="text-gray-700 font-normal">{{ selectedItem.lowStockThreshold }} units</span>
                </div>
              </div>
            </div>

            <!-- Section 2: Stock Adjustment Form -->
            <div class="space-y-4" *appHasFeature="'inv_stock_in_out'">
              <h4 class="text-sm font-normal text-gray-900 flex items-center gap-2">
                <i class="bi bi-pencil-square text-primary-500"></i>
                Record Stock Adjustment
              </h4>

              <div class="bg-white border border-gray-150 rounded-xl p-5 space-y-4">
                <!-- Adjustment Type Toggle Buttons -->
                <div>
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2 font-normal">Adjustment Mode</label>
                  <div class="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
                    <button 
                      type="button"
                      (click)="adjustType = 'add'"
                      class="py-1.5 text-xs font-normal rounded-md transition-all flex items-center justify-center gap-1 border-0"
                      [class.bg-white]="adjustType === 'add'"
                      [class.text-green-600]="adjustType === 'add'"
                      [class.shadow-sm]="adjustType === 'add'"
                      [class.text-gray-500]="adjustType !== 'add'"
                    >
                      <i class="bi bi-plus-circle-fill"></i> Add
                    </button>
                    <button 
                      type="button"
                      (click)="adjustType = 'subtract'"
                      class="py-1.5 text-xs font-normal rounded-md transition-all flex items-center justify-center gap-1 border-0"
                      [class.bg-white]="adjustType === 'subtract'"
                      [class.text-red-600]="adjustType === 'subtract'"
                      [class.shadow-sm]="adjustType === 'subtract'"
                      [class.text-gray-500]="adjustType !== 'subtract'"
                    >
                      <i class="bi bi-dash-circle-fill"></i> Reduce
                    </button>
                    <button 
                      type="button"
                      (click)="adjustType = 'set'"
                      class="py-1.5 text-xs font-normal rounded-md transition-all flex items-center justify-center gap-1 border-0"
                      [class.bg-white]="adjustType === 'set'"
                      [class.text-primary-600]="adjustType === 'set'"
                      [class.shadow-sm]="adjustType === 'set'"
                      [class.text-gray-500]="adjustType !== 'set'"
                    >
                      <i class="bi bi-pin-angle-fill"></i> Set
                    </button>
                  </div>
                </div>

                <!-- Quantity Input -->
                <div>
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2 font-normal">Quantity to Adjust</label>
                  <div class="flex items-center gap-2">
                    <button 
                      type="button"
                      (click)="adjustQty = adjustQty > 1 ? adjustQty - 1 : 1"
                      class="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 rounded-lg transition-all"
                    >
                      <i class="bi bi-dash"></i>
                    </button>
                    <input 
                      type="number" 
                      [(ngModel)]="adjustQty" 
                      min="1"
                      class="flex-1 text-center h-10 border border-gray-200 rounded-lg text-sm font-bold focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                    <button 
                      type="button"
                      (click)="adjustQty = adjustQty + 1"
                      class="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 rounded-lg transition-all"
                    >
                      <i class="bi bi-plus"></i>
                    </button>
                  </div>
                </div>

                <!-- Reason Dropdown -->
                <div>
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2 font-normal">Reason for Adjustment</label>
                  <select 
                    [(ngModel)]="adjustReason"
                    class="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  >
                    <option value="New Shipment">New Shipment Received</option>
                    <option value="Stock Audit / Count">Stock Audit / Count</option>
                    <option value="Damaged Item">Damaged Item</option>
                    <option value="Return / Exchange">Customer Return / Exchange</option>
                    <option value="Correction">Data Correction</option>
                    <option value="Other">Other Reason...</option>
                  </select>
                </div>

                <!-- Custom Reason Notes -->
                <div *ngIf="adjustReason === 'Other'">
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2 font-normal">Custom Reason Note</label>
                  <textarea 
                    [(ngModel)]="customReason"
                    rows="2"
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-lg text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
                    placeholder="Describe the reason for adjustment..."
                  ></textarea>
                </div>

                <!-- Submit button -->
                <button 
                  type="button"
                  (click)="submitAdjustment()"
                  [disabled]="isSubmittingAdjustment || adjustQty <= 0"
                  class="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-normal hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed border-0 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span *ngIf="isSubmittingAdjustment" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  {{ isSubmittingAdjustment ? 'Updating Stock...' : 'Save Stock Adjustment' }}
                </button>
              </div>
            </div>

            <!-- Section 3: Stock History Log -->
            <div class="space-y-4">
              <h4 class="text-sm font-normal text-gray-900 flex items-center gap-2">
                <i class="bi bi-clock-history text-primary-500"></i>
                Adjustment History
              </h4>

              <div class="space-y-3">
                @if (loadingHistory) {
                  <div class="flex items-center justify-center py-6 gap-2 text-gray-400 text-xs font-normal">
                    <app-ui-loading size="sm"></app-ui-loading>
                    <span>Loading timeline...</span>
                  </div>
                } @else if (selectedItemHistory.length === 0) {
                  <div class="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    No adjustments recorded for this SKU.
                  </div>
                } @else {
                  <div class="relative border-l-2 border-gray-150 pl-4 ml-3 space-y-4 py-1">
                    @for (log of selectedItemHistory; track log.id) {
                      <div class="relative">
                        <!-- Timeline Node Dot -->
                        <div 
                          class="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white"
                          [ngClass]="{
                            'bg-green-500': log.changeType === 'add',
                            'bg-red-500': log.changeType === 'subtract' || log.changeType === 'sale',
                            'bg-blue-500': log.changeType === 'set'
                          }"
                        ></div>
                        
                        <div class="text-xs space-y-1">
                          <div class="flex items-center justify-between">
                            <span class="font-normal text-gray-900">
                              {{ log.changeType === 'add' ? '+' : log.changeType === 'subtract' ? '-' : log.changeType === 'sale' ? '-' : '' }}{{ log.amount }} Units
                            </span>
                            <span class="text-gray-400 font-medium">
                              {{ toDate(log.createdAt) | date: 'shortDate' }}
                            </span>
                          </div>
                          
                          <div class="text-gray-600 font-medium flex items-center justify-between">
                            <span>{{ log.reason || 'Manual Update' }}</span>
                            <span class="text-[10px] text-gray-400">Total: {{ log.newStock }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }
  `]
})
export class LowStockListComponent implements OnInit {
  items: InventoryUI[] = [];
  loading = true;
  shopId: string | null = null;
  
  selectedItem: InventoryUI | null = null;
  
  // Stock Adjustment State
  adjustType: 'add' | 'subtract' | 'set' = 'add';
  adjustQty: number = 1;
  adjustReason: string = 'New Shipment';
  customReason: string = '';
  isSubmittingAdjustment: boolean = false;

  // History State
  historyLogs: any[] = [];
  loadingHistory: boolean = false;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private toastService: ToastService,
    private featureService: FeatureGuardService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadLowStock();
      }
    });
  }

  loadLowStock() {
    if (!this.shopId) return;
    this.loading = true;
    this.inventoryService.getLowStock(this.shopId).subscribe({
      next: (res) => {
        this.items = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadHistory() {
    if (!this.shopId) return;
    this.loadingHistory = true;
    this.inventoryService.getInventoryHistory(this.shopId).subscribe({
      next: (res) => {
        this.historyLogs = res.data || [];
        this.loadingHistory = false;
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.loadingHistory = false;
      }
    });
  }

  selectItem(item: InventoryUI) {
    this.selectedItem = item;
    // reset form
    this.adjustType = 'add';
    this.adjustQty = 1;
    this.adjustReason = 'New Shipment';
    this.customReason = '';
    // Load history
    this.loadHistory();
  }

  closeDetail() {
    this.selectedItem = null;
  }

  get selectedItemHistory() {
    if (!this.selectedItem) return [];
    return this.historyLogs
      .filter(log => log.variantSku === this.selectedItem!.variantSku && log.productId === this.selectedItem!.productId)
      .sort((a, b) => this.toDate(b.createdAt)!.getTime() - this.toDate(a.createdAt)!.getTime());
  }

  getStockStatusClass(item: InventoryUI): string {
    if (item.currentStock <= 0) return 'bg-red-50 text-red-700 border border-red-200';
    const hasLowStockFeature = this.featureService.hasFeatureSync(null, 'inv_low_stock_alerts');
    if (hasLowStockFeature && item.currentStock <= (item.lowStockThreshold || 5)) return 'bg-orange-50 text-orange-700 border border-orange-200';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }

  getStockStatusLabel(item: InventoryUI): string {
    if (item.currentStock <= 0) return 'Out of Stock';
    const hasLowStockFeature = this.featureService.hasFeatureSync(null, 'inv_low_stock_alerts');
    if (hasLowStockFeature && item.currentStock <= (item.lowStockThreshold || 5)) return 'Low Stock';
    return 'In Stock';
  }

  submitAdjustment() {
    if (!this.selectedItem || !this.shopId || this.adjustQty <= 0) return;
    this.isSubmittingAdjustment = true;

    const item = this.selectedItem;
    let newStock = item.currentStock;
    let amount = this.adjustQty;

    if (this.adjustType === 'add') {
      newStock = item.currentStock + this.adjustQty;
    } else if (this.adjustType === 'subtract') {
      newStock = Math.max(0, item.currentStock - this.adjustQty);
    } else if (this.adjustType === 'set') {
      newStock = this.adjustQty;
      amount = Math.abs(newStock - item.currentStock);
    }

    const reason = this.adjustReason === 'Other' ? this.customReason : this.adjustReason;

    this.inventoryService.updateStock(
      this.shopId,
      item.productId,
      newStock,
      this.adjustType,
      amount,
      reason || 'Manual Update',
      item.variantSku
    ).subscribe({
      next: () => {
        this.isSubmittingAdjustment = false;
        this.toastService.showSuccess(`Stock updated successfully`);
        
        // Update local item
        if (this.selectedItem) {
          this.selectedItem.currentStock = newStock;
        }
        
        // Find index in items array and remove if it is no longer low stock
        const idx = this.items.findIndex(i => i.id === item.id);
        if (idx > -1 && newStock > (item.lowStockThreshold || 5)) {
           this.items.splice(idx, 1);
           // Close detail if the item is removed from the low stock list
           this.closeDetail();
        }

        // reload history
        this.loadHistory();
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        this.toastService.showError(err?.error?.error || 'Failed to update stock');
        this.isSubmittingAdjustment = false;
      }
    });
  }

  toDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    // Firestore Timestamp object
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // Firestore plain object format
    if (typeof value === 'object') {
      if ('seconds' in value) {
        return new Date(value.seconds * 1000);
      }

      if ('_seconds' in value) {
        return new Date(value._seconds * 1000);
      }
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
}
