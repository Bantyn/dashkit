import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { UiDropdownComponent, DropdownOption } from '../../shared/components/ui-dropdown.component';
import { UiNumberInputComponent } from '../../shared/components/ui-number-input.component';
import { BranchService, Branch } from '../../core/services/branch.service';
import { ProductService } from '../../core/services/product.service';
import { StockTransferService, StockTransfer, StockTransferItem } from '../../core/services/stock-transfer.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, UiDropdownComponent, UiNumberInputComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- ─── Unified Header Row ─── -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Main Panel Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-normal text-gray-900">Stock Transfers</h2>
            <p class="text-xs text-gray-400 mt-0.5">Manage inventory transfers between branches or warehouses</p>
          </div>
          <button
            (click)="openNewTransfer()"
            *ngIf="!showTransferForm"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-normal rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <i class="bi bi-arrow-left-right"></i> New Transfer
          </button>
        </div>

        <!-- Detail Panel Header (if selected or form open) -->
        <div 
          *ngIf="showTransferForm || selectedTransfer"
          class="w-[450px] shrink-0 px-6 py-5 border-l border-gray-200 flex justify-between items-center shrink-0 bg-white"
        >
          <div>
            <h3 class="text-lg font-normal text-gray-900">
              {{ showTransferForm ? 'New Stock Transfer' : 'Transfer Details' }}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5 font-medium truncate max-w-[320px]">
              {{ showTransferForm ? 'Create a stock movement' : 'Transfer ID: #' + selectedTransfer?.id }}
            </p>
          </div>
          <button 
            (click)="closeRightPanel()" 
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
          <div class="flex-1 overflow-auto p-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 sticky top-0 z-10">
                  <tr class="text-xs font-normal text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th class="px-6 py-4">Transfer ID</th>
                    <th class="px-6 py-4">Date</th>
                    <th class="px-6 py-4">Source Branch</th>
                    <th class="px-6 py-4">Destination Branch</th>
                    <th class="px-6 py-4">Items</th>
                    <th class="px-6 py-4">Status</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @if (loading) {
                    <tr>
                      <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center gap-4">
                          <app-ui-loading size="md"></app-ui-loading>
                          <span class="text-sm font-medium">Loading transfers...</span>
                        </div>
                      </td>
                    </tr>
                  } @else if (transfers.length === 0) {
                    <tr>
                      <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center gap-3">
                          <i class="bi bi-arrow-left-right text-4xl text-gray-300"></i>
                          <p class="text-sm font-medium">No stock transfers found.</p>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    @for (transfer of transfers; track transfer.id) {
                      <tr 
                        (click)="selectTransfer(transfer)"
                        class="hover:bg-gray-50 transition-colors cursor-pointer"
                        [class.bg-blue-50]="selectedTransfer?.id === transfer.id"
                      >
                        <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                          #{{ transfer.id | slice:-6 }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          {{ transfer.createdAt | date:'shortDate' }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                          {{ transfer.sourceBranchName || '—' }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                          {{ transfer.destinationBranchName || '—' }}
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">
                          {{ transfer.items.length || 0 }} items
                        </td>
                        <td class="px-6 py-4">
                          <span class="px-2.5 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                            {{ transfer.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                          <button class="text-primary-600 hover:text-primary-700 font-medium text-sm border-0 bg-transparent">
                            View
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
        
        <!-- Right Panel Content: Form or Details -->
        <div 
          *ngIf="showTransferForm || selectedTransfer"
          class="w-[450px] shrink-0 bg-white flex flex-col border-l border-gray-200 transition-all duration-300 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          <!-- ─── OPTION A: New Transfer Form ─── -->
          <ng-container *ngIf="showTransferForm">
            <!-- Step 1: Branch Selection -->
            <div class="space-y-4">
              <h4 class="text-sm font-normal text-gray-900 flex items-center gap-2">
                <i class="bi bi-geo-alt text-primary-500"></i>
                Select Branches
              </h4>
              <div class="bg-gray-50 border border-gray-150 rounded-xl p-5 space-y-4">
                <div>
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2">Source Branch</label>
                  <app-ui-dropdown
                    [options]="sourceBranchOptions"
                    [(ngModel)]="sourceBranchId"
                    (onSelect)="onSourceBranchSelect($event)"
                    placeholder="Select Source Branch"
                  ></app-ui-dropdown>
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2">Destination Branch</label>
                  <app-ui-dropdown
                    [options]="destBranchOptions"
                    [(ngModel)]="destinationBranchId"
                    placeholder="Select Destination Branch"
                  ></app-ui-dropdown>
                </div>
              </div>
            </div>

            <!-- Step 2: Add Items -->
            <div class="space-y-4" *ngIf="sourceBranchId && destinationBranchId">
              <h4 class="text-sm font-normal text-gray-900 flex items-center gap-2">
                <i class="bi bi-box-seam text-primary-500"></i>
                Add Products
              </h4>
              <div class="bg-gray-50 border border-gray-150 rounded-xl p-5 space-y-4">
                <div>
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2">Product</label>
                  <app-ui-dropdown
                    [options]="productOptions"
                    [(ngModel)]="selectedProductId"
                    (onSelect)="onProductSelect($event)"
                    placeholder="Select Product"
                  ></app-ui-dropdown>
                </div>
                <div *ngIf="selectedProductId">
                  <label class="text-xs text-gray-500 font-normal tracking-wider block mb-2">Variant / SKU</label>
                  <app-ui-dropdown
                    [options]="variantOptions"
                    [(ngModel)]="selectedVariantSku"
                    (onSelect)="onVariantSelect($event)"
                    placeholder="Select Variant"
                  ></app-ui-dropdown>
                </div>
                <div *ngIf="selectedVariantSku">
                  <div class="flex justify-between items-center mb-1">
                    <label class="text-xs text-gray-500 font-normal tracking-wider">Quantity to Transfer</label>
                    <span class="text-xs text-gray-400 font-normal">Available: {{ maxAvailableStock }}</span>
                  </div>
                  <app-ui-number-input
                    [(ngModel)]="transferQty"
                    [min]="1"
                    [max]="maxAvailableStock"
                  ></app-ui-number-input>
                </div>
                <button
                  type="button"
                  (click)="addItemToTransfer()"
                  [disabled]="!selectedVariantSku || transferQty <= 0 || transferQty > maxAvailableStock"
                  class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-normal rounded-lg text-sm transition-all border-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
              </div>
            </div>

            <!-- Step 3: Items Summary & Submit -->
            <div class="space-y-4" *ngIf="transferItems.length > 0">
              <h4 class="text-sm font-normal text-gray-900 flex items-center gap-2">
                <i class="bi bi-list-check text-primary-500"></i>
                Transfer List
              </h4>
              <div class="bg-white border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100">
                <div *ngFor="let item of transferItems; let idx = index" class="p-4 flex justify-between items-center">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.productName }}</p>
                    <p class="text-xs text-gray-500">SKU: {{ item.variantSku }} • Qty: {{ item.quantity }}</p>
                  </div>
                  <button 
                    type="button" 
                    (click)="removeItem(idx)"
                    class="p-1 text-red-500 hover:bg-red-50 rounded-md border-0 bg-transparent"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              
              <button
                type="button"
                (click)="submitTransfer()"
                [disabled]="isSubmitting"
                class="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-normal rounded-lg text-sm transition-all border-0 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span *ngIf="isSubmitting" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                Complete Stock Transfer
              </button>
            </div>
          </ng-container>

          <!-- ─── OPTION B: View Transfer Details ─── -->
          <ng-container *ngIf="selectedTransfer">
            <div class="space-y-6">
              <!-- Route Indicator -->
              <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-150 rounded-xl">
                <div class="text-center flex-1">
                  <p class="text-xs text-gray-400 font-normal">Source</p>
                  <p class="text-sm font-medium text-gray-900">{{ selectedTransfer.sourceBranchName }}</p>
                </div>
                <div class="px-2">
                  <i class="bi bi-arrow-right text-xl text-primary-500"></i>
                </div>
                <div class="text-center flex-1">
                  <p class="text-xs text-gray-400 font-normal">Destination</p>
                  <p class="text-sm font-medium text-gray-900">{{ selectedTransfer.destinationBranchName }}</p>
                </div>
              </div>

              <!-- Metadata -->
              <div class="grid grid-cols-2 gap-4 text-sm bg-white border border-gray-150 rounded-xl p-5">
                <div>
                  <span class="text-xs text-gray-400 block font-normal">Transfer Date</span>
                  <span class="text-gray-700 font-normal">{{ selectedTransfer.createdAt | date:'mediumDate' }}</span>
                </div>
                <div>
                  <span class="text-xs text-gray-400 block font-normal">Status</span>
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ selectedTransfer.status }}
                  </span>
                </div>
              </div>

              <!-- Transferred Items List -->
              <div class="space-y-3">
                <h4 class="text-xs font-normal text-gray-400 uppercase tracking-wider">Transferred Items</h4>
                <div class="bg-white border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100">
                  <div *ngFor="let item of selectedTransfer.items" class="p-4 flex justify-between items-center">
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ item.productName }}</p>
                      <p class="text-xs text-gray-500 font-mono">SKU: {{ item.variantSku }}</p>
                    </div>
                    <span class="text-sm font-bold text-gray-900">{{ item.quantity }} units</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
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
export class StockTransferComponent implements OnInit {
  transfers: StockTransfer[] = [];
  branches: Branch[] = [];
  allProducts: any[] = [];
  
  loading = false;
  isSubmitting = false;
  showTransferForm = false;
  selectedTransfer: StockTransfer | null = null;
  shopId: string | null = null;

  // Form selections
  sourceBranchId = '';
  destinationBranchId = '';
  selectedProductId = '';
  selectedVariantSku = '';
  transferQty = 1;
  maxAvailableStock = 0;
  
  transferItems: StockTransferItem[] = [];

  constructor(
    private branchService: BranchService,
    private productService: ProductService,
    private stockTransferService: StockTransferService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadInitialData();
      }
    });
  }

  loadInitialData() {
    if (!this.shopId) return;
    this.loading = true;
    
    // Load transfers, branches and all products
    this.stockTransferService.getTransfers(this.shopId).subscribe({
      next: (res) => {
        this.transfers = res.data || [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    this.branchService.getBranches(this.shopId).subscribe({
      next: (res) => {
        this.branches = res.data || [];
      },
    });

    this.productService.getProductsByShop(this.shopId).subscribe({
      next: (res) => {
        this.allProducts = res.data || [];
      },
    });
  }

  get sourceBranchOptions(): DropdownOption[] {
    return this.branches
      .filter((b) => b.status === 'Active')
      .map((b) => ({ value: b.id, label: b.name }));
  }

  get destBranchOptions(): DropdownOption[] {
    return this.branches
      .filter((b) => b.status === 'Active' && b.id !== this.sourceBranchId)
      .map((b) => ({ value: b.id, label: b.name }));
  }

  get productOptions(): DropdownOption[] {
    if (!this.sourceBranchId) return [];
    return this.allProducts
      .filter((p) => p.branchId === this.sourceBranchId && p.isActive)
      .map((p) => ({ value: p.id, label: p.name }));
  }

  get variantOptions(): DropdownOption[] {
    if (!this.selectedProductId) return [];
    const prod = this.allProducts.find((p) => p.id === this.selectedProductId);
    if (!prod || !prod.variants) return [];

    return prod.variants.map((v: any) => ({
      value: v.sku,
      label: `${v.size || ''} ${v.color || ''} - SKU: ${v.sku} (Stock: ${v.stock || 0})`,
      stock: v.stock || 0
    }));
  }

  onSourceBranchSelect(val: any) {
    // Reset product selection when source branch changes
    this.selectedProductId = '';
    this.selectedVariantSku = '';
    this.transferQty = 1;
    this.maxAvailableStock = 0;
    this.transferItems = [];
  }

  onProductSelect(val: any) {
    this.selectedVariantSku = '';
    this.transferQty = 1;
    this.maxAvailableStock = 0;
  }

  onVariantSelect(sku: any) {
    const opt = this.variantOptions.find((o) => o.value === sku) as any;
    if (opt) {
      this.maxAvailableStock = opt.stock;
      this.transferQty = 1;
    }
  }

  addItemToTransfer() {
    if (!this.selectedProductId || !this.selectedVariantSku || this.transferQty <= 0) return;
    
    const product = this.allProducts.find((p) => p.id === this.selectedProductId);
    if (!product) return;

    // Check if item already exists in transfer list
    const existing = this.transferItems.find(
      (item) => item.productId === this.selectedProductId && item.variantSku === this.selectedVariantSku
    );

    if (existing) {
      existing.quantity = Math.min(this.maxAvailableStock, existing.quantity + this.transferQty);
    } else {
      this.transferItems.push({
        productId: this.selectedProductId,
        variantSku: this.selectedVariantSku,
        quantity: this.transferQty,
        productName: product.name,
      });
    }

    // Reset selection
    this.selectedProductId = '';
    this.selectedVariantSku = '';
    this.transferQty = 1;
    this.maxAvailableStock = 0;
  }

  removeItem(index: number) {
    this.transferItems.splice(index, 1);
  }

  openNewTransfer() {
    this.selectedTransfer = null;
    this.showTransferForm = true;
    // reset selection
    this.sourceBranchId = '';
    this.destinationBranchId = '';
    this.selectedProductId = '';
    this.selectedVariantSku = '';
    this.transferQty = 1;
    this.transferItems = [];
  }

  selectTransfer(transfer: StockTransfer) {
    this.showTransferForm = false;
    this.selectedTransfer = transfer;
  }

  closeRightPanel() {
    this.showTransferForm = false;
    this.selectedTransfer = null;
  }

  submitTransfer() {
    if (!this.shopId || !this.sourceBranchId || !this.destinationBranchId || this.transferItems.length === 0) return;
    
    const srcBranch = this.branches.find((b) => b.id === this.sourceBranchId);
    const destBranch = this.branches.find((b) => b.id === this.destinationBranchId);

    if (!srcBranch || !destBranch) return;

    this.isSubmitting = true;
    this.stockTransferService.createTransfer({
      shopId: this.shopId,
      sourceBranchId: this.sourceBranchId,
      sourceBranchName: srcBranch.name,
      destinationBranchId: this.destinationBranchId,
      destinationBranchName: destBranch.name,
      items: this.transferItems,
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Stock transfer completed successfully');
        
        // Add to list and close panel
        if (res.data) {
          this.transfers.unshift(res.data);
        }
        this.closeRightPanel();
        
        // Reload products cache to sync stock levels
        this.productService.getProductsByShop(this.shopId!).subscribe({
          next: (res) => {
            this.allProducts = res.data || [];
          }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastService.showError(err?.error?.error || 'Failed to complete stock transfer');
      }
    });
  }
}
