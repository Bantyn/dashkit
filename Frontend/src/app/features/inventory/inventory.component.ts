import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { Inventory } from '../../core/models/inventory.model';
import { Product } from '../../core/models/product.model';
import { FormsModule } from '@angular/forms';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { CreateProductComponent } from '../products/create-product.component';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';
import { FeatureGuardService } from '../../core/services/feature-guard.service';

interface InventoryUI extends Inventory {
  isEditing?: boolean;
  newStock?: number;
}

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule, UiLoadingComponent, CreateProductComponent, HasFeatureDirective],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: Inventory List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-bold text-gray-900">Inventory</h2>
            <div class="flex items-center bg-gray-100 rounded-lg p-1 pl-3 border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
               <i class="bi bi-upc-scan text-gray-400 mr-2"></i>
               <input 
                 #barcodeInput
                 type="text" 
                 [(ngModel)]="searchBarcode"
                 (keyup.enter)="onBarcodeScan()"
                 placeholder="Scan Barcode..."
                 class="bg-transparent border-none outline-none text-sm w-48 py-1.5 focus:ring-0"
               />
               <button (click)="onBarcodeScan()" class="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-md shadow-sm hover:bg-gray-50 uppercase">Scan</button>
            </div>
          </div>
          <div class="flex items-center gap-2" *appHasFeature="'inv_stock_in_out'">
            <button
              (click)="focusAdjustment()"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <i class="bi bi-plus-lg"></i> Adjust Stock
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search products by name or sku..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-4">Product Details</th>
                  <th class="px-6 py-4">Variant SKU</th>
                  <th class="px-6 py-4">Stock Level</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4">Last Updated</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span class="text-sm font-medium">Loading inventory...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error) {
                  <tr>
                    <td colspan="6" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">
                        {{ error }}
                      </div>
                    </td>
                  </tr>
                } @else if (filteredItems.length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500 text-sm">
                      @if (inventoryItems.length === 0) {
                        No inventory data found.
                      } @else {
                        No items match your search.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (item of filteredItems; track item.id) {
                    <tr 
                      (click)="selectItem(item)"
                      class="transition-colors hover:bg-gray-50/50 cursor-pointer group"
                      [class.bg-black/5]="selectedItem?.id === item.id"
                    >
                      <td class="px-6 py-4">
                        <div class="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {{ item.productName || item.productId }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-mono text-gray-500">
                        {{ item.variantSku || '-' }}
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-bold text-gray-900">{{ item.currentStock }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [class]="getStockStatusClass(item)"
                          class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        >
                          {{ getStockStatusLabel(item) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-500">
                        {{ toDate(item.updatedAt) | date: 'medium' }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <button class="ml-auto px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-600 border border-gray-200 hover:border-primary-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                          Manage <i class="bi bi-chevron-right text-[10px]"></i>
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

      <!-- ─── Right Panel: Detail & Adjustment ─── -->
      <div *ngIf="selectedItem" class="w-[450px] shrink-0 bg-white flex flex-col border-l border-gray-200 shadow-xl transition-all duration-300">
        <!-- Panel Header -->
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Stock Management</h3>
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

        <!-- Panel Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <!-- Section 1: Current Status Card -->
          <div class="bg-gray-50 border border-gray-150 rounded-xl p-5 space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Stock</span>
                <div class="text-3xl font-black text-gray-900 mt-1">
                  {{ selectedItem.currentStock }} <span class="text-sm font-medium text-gray-400">units</span>
                </div>
              </div>
              <span 
                [class]="getStockStatusClass(selectedItem)"
                class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              >
                {{ getStockStatusLabel(selectedItem) }}
              </span>
            </div>

            <div class="h-px bg-gray-200"></div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-xs text-gray-400 block font-medium">SKU</span>
                <span class="font-mono text-gray-700 font-bold block truncate" [title]="selectedItem.variantSku">{{ selectedItem.variantSku || '—' }}</span>
              </div>
              <div *appHasFeature="'inv_low_stock_alerts'">
                <span class="text-xs text-gray-400 block font-medium">Low Stock Warning</span>
                <span class="text-gray-700 font-bold">{{ selectedItem.lowStockThreshold }} units</span>
              </div>
            </div>
            <div *ngIf="selectedItem.productName === 'Unknown Product'" class="pt-2">
              <button 
                (click)="deleteOrphanedStock(selectedItem)"
                class="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm border-0 cursor-pointer"
              >
                <i class="bi bi-trash"></i> Delete Orphaned Stock Record
              </button>
            </div>
          </div>

          <!-- Section 2: Stock Adjustment Form -->
          <div class="space-y-4" *appHasFeature="'inv_stock_in_out'">
            <h4 class="text-sm font-bold text-gray-900 flex items-center gap-2">
              <i class="bi bi-pencil-square text-primary-500"></i>
              Record Stock Adjustment
            </h4>

            <div class="bg-white border border-gray-150 rounded-xl p-5 space-y-4">
              <!-- Adjustment Type Toggle Buttons -->
              <div>
                <label class="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2 font-semibold">Adjustment Mode</label>
                <div class="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
                  <button 
                    type="button"
                    (click)="adjustType = 'add'"
                    class="py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 border-0"
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
                    class="py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 border-0"
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
                    class="py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 border-0"
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
                <label class="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2 font-semibold">Quantity</label>
                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="adjustQty = adjustQty > 1 ? adjustQty - 1 : 1"
                    class="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 rounded-lg transition-all"
                  >
                    <i class="bi bi-dash"></i>
                  </button>
                  <input 
                    id="adjustQtyInput"
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

              <!-- Reason Selection -->
              <div>
                <label class="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2 font-semibold">Reason for Adjustment</label>
                <select 
                  [(ngModel)]="adjustReason"
                  class="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="New Shipment">New Shipment</option>
                  <option value="Stock Count/Audit">Stock Count/Audit</option>
                  <option value="Damaged/Shrinkage">Damaged/Shrinkage</option>
                  <option value="Return to Supplier">Return to Supplier</option>
                  <option value="Other">Other (Specify Below)</option>
                </select>
              </div>

              <!-- Custom Reason -->
              <div *ngIf="adjustReason === 'Other'">
                <input 
                  type="text" 
                  [(ngModel)]="customReason" 
                  placeholder="Enter custom reason..."
                  class="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              <!-- Submit Button -->
              <button 
                type="button"
                (click)="submitAdjustment()"
                [disabled]="isSubmittingAdjustment || adjustQty <= 0"
                class="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed border-0 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span *ngIf="isSubmittingAdjustment" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                {{ isSubmittingAdjustment ? 'Updating Stock...' : 'Save Stock Adjustment' }}
              </button>
            </div>
          </div>

          <!-- Section 3: Stock History Log -->
          <div class="space-y-4">
            <h4 class="text-sm font-bold text-gray-900 flex items-center gap-2">
              <i class="bi bi-clock-history text-primary-500"></i>
              Adjustment History
            </h4>

            <div class="space-y-3">
              @if (loadingHistory) {
                <div class="flex items-center justify-center py-6 gap-2 text-gray-400 text-xs font-semibold">
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
                          <span class="font-bold text-gray-900">
                            {{ log.changeType === 'add' ? '+' : log.changeType === 'subtract' ? '-' : log.changeType === 'sale' ? '-' : '' }}{{ log.amount }} Units
                          </span>
                          <span class="text-gray-400 font-medium">
                            {{ toDate(log.createdAt) | date: 'shortDate' }}
                          </span>
                        </div>
                        <p class="text-gray-600 font-medium">
                          {{ log.reason || 'Manual Update' }}
                        </p>
                        <div class="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                          <span class="px-1.5 py-0.5 rounded bg-gray-100 uppercase tracking-widest text-[9px] font-black" [ngClass]="getTypeBadgeClass(log.changeType)">
                            {{ log.changeType }}
                          </span>
                          <span>•</span>
                          <span>New Stock: {{ log.newStock }}</span>
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

      <!-- Add Stock Modal -->
      @if (showCreateProductModal) {
         <app-create-product
            [product]="preFilledProduct"
            (close)="showCreateProductModal = false"
            (productCreated)="onProductCreated()"
         ></app-create-product>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
  `]
})
export class InventoryComponent implements OnInit {
  inventoryItems: InventoryUI[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  showCreateProductModal = false;
  searchQuery = '';
  searchBarcode = '';
  preFilledProduct: any = null;

  selectedItem: InventoryUI | null = null;
  adjustType: 'add' | 'subtract' | 'set' = 'add';
  adjustQty: number = 1;
  adjustReason: string = 'New Shipment';
  customReason: string = '';
  isSubmittingAdjustment = false;
  loadingHistory = false;
  historyLogs: any[] = [];

  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private featureService: FeatureGuardService
  ) {}

  get filteredItems(): InventoryUI[] {
    if (!this.searchQuery.trim()) {
      return this.inventoryItems;
    }
    const query = this.searchQuery.toLowerCase();
    return this.inventoryItems.filter((item) => {
      const productName = item.productName?.toLowerCase() || '';
      const sku = item.variantSku?.toLowerCase() || '';
      return productName.includes(query) || sku.includes(query);
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) {
        this.loadInventory();
        this.loadHistory();
      }
    });
  }

  onBarcodeScan() {
    if (!this.searchBarcode.trim() || !this.shopId) return;

    // Check if already in our loaded array first
    const item = this.inventoryItems.find(i => i.variantSku === this.searchBarcode);
    if (item) {
      this.selectItem(item);
      this.searchBarcode = '';
      return;
    }

    this.loading = true;
    this.productService.getProductByBarcode(this.shopId, this.searchBarcode).subscribe({
      next: (res) => {
        this.loading = false;
        this.searchQuery = this.searchBarcode;
        this.searchBarcode = '';
        setTimeout(() => {
          if (this.filteredItems.length > 0) {
            this.selectItem(this.filteredItems[0]);
          }
        }, 100);
      },
      error: async (err) => {
        this.loading = false;
        const currentBarcode = this.searchBarcode;
        this.searchBarcode = '';
        const confirmed = await this.confirmationService.confirm({
          title: 'Product Not Found',
          description: `Product not found for barcode: <strong>${currentBarcode}</strong><br><br>Would you like to create it?`,
          type: 'warning',
          primaryButtonText: 'Create Product',
          secondaryButtonText: 'Cancel'
        });
        if (confirmed) {
          this.openCreateProductForm(currentBarcode);
        }
      }
    });
  }

  openCreateProductForm(barcode: string) {
    this.preFilledProduct = {
      name: '',
      brand: 'CROME ART', // Suggested default from planning
      category: 'men',
      subcategory: '', // planning called it "Style"
      variants: [{
        sku: barcode,
        size: 'M',
        price: 0,
        stock: 1
      }]
    };
    this.showCreateProductModal = true;
  }

  onProductCreated() {
    this.showCreateProductModal = false;
    this.loadInventory();
  }

  loadInventory() {
    this.loading = true;
    if (!this.shopId) return;

    this.inventoryService.getInventory(this.shopId).subscribe({
      next: (response) => {
        this.inventoryItems = response.data || [];
        this.loading = false;
        // Auto-select first item on desktop
        if (this.inventoryItems.length > 0 && window.innerWidth >= 768 && !this.selectedItem) {
          this.selectItem(this.inventoryItems[0]);
        }
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.error = 'Failed to load inventory.';
        this.loading = false;
      },
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

  async deleteOrphanedStock(item: any) {
    if (!this.shopId) return;
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Stock Record?',
      description: 'Are you sure you want to delete this orphaned stock record? This action cannot be undone.',
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      this.inventoryService.deleteInventory(item.id, this.shopId).subscribe({
        next: () => {
          this.toastService.showSuccess('Stock record deleted successfully');
          this.closeDetail();
          this.loadInventory();
        },
        error: (err) => {
          console.error('Error deleting stock record:', err);
          this.toastService.showError('Failed to delete stock record');
        }
      });
    }
  }

  focusAdjustment() {
    if (!this.selectedItem && this.filteredItems.length > 0) {
      this.selectItem(this.filteredItems[0]);
    }
    setTimeout(() => {
      const el = document.getElementById('adjustQtyInput');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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
        // Update local item
        item.currentStock = newStock;
        
        // Find inside inventoryItems array to keep it in sync
        const mainItem = this.inventoryItems.find(i => i.id === item.id);
        if (mainItem) {
          mainItem.currentStock = newStock;
        }

        this.toastService.showSuccess('Stock adjusted successfully');
        
        // Reset form
        this.adjustQty = 1;
        this.customReason = '';
        
        // Reload history log to show the adjustment immediately
        this.loadHistory();
      },
      error: (err) => {
        this.isSubmittingAdjustment = false;
        console.error('Error adjusting stock:', err);
        this.toastService.showError('Failed to adjust stock');
      }
    });
  }

  get selectedItemHistory(): any[] {
    if (!this.selectedItem) return [];
    return this.historyLogs.filter(
      (log) => log.productId === this.selectedItem?.productId && log.variantSku === this.selectedItem?.variantSku
    ).sort((a, b) => {
      const d1 = this.toDate(a.createdAt);
      const d2 = this.toDate(b.createdAt);
      if (!d1) return 1;
      if (!d2) return -1;
      return d2.getTime() - d1.getTime(); // Newest first
    });
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'add':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'subtract':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'sale':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'set':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  getStockStatusClass(item: InventoryUI): string {
    if (item.currentStock <= 0) return 'bg-red-50 text-red-600 border border-red-100';
    const hasLowStockFeature = this.featureService.hasFeatureSync(null, 'inv_low_stock_alerts');
    if (hasLowStockFeature && item.currentStock <= item.lowStockThreshold)
      return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
    return 'bg-green-50 text-green-600 border border-green-100';
  }

  getStockStatusLabel(item: InventoryUI): string {
    if (item.currentStock <= 0) return 'Out of Stock';
    const hasLowStockFeature = this.featureService.hasFeatureSync(null, 'inv_low_stock_alerts');
    if (hasLowStockFeature && item.currentStock <= item.lowStockThreshold) return 'Low Stock';
    return 'Good';
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
