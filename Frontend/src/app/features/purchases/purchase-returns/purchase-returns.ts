import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, PurchaseReturn, Supplier, PurchaseReturnItem } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiInputComponent } from '../../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ConfirmationService } from '../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-purchase-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent, UiDropdownComponent],
  templateUrl: './purchase-returns.html',
  styleUrl: './purchase-returns.css',
})
export class PurchaseReturns implements OnInit {
  returns: PurchaseReturn[] = [];
  suppliers: Supplier[] = [];
  products: any[] = [];
  shopId = '';
  isLoading = false;
  searchQuery = '';

  // Form State
  isModalOpen = false;
  selectedSupplierId = '';
  returnItems: PurchaseReturnItem[] = [];
  returnNotes = '';

  // Item Selector State
  selectedProductIndex: number = -1;
  selectedVariantIndex: number = -1;
  itemQty: number = 1;
  itemCost: number = 0;

  get supplierOptions() {
    return [
      { value: '', label: 'Choose supplier...' },
      ...this.suppliers.map(s => ({ value: s.id!, label: s.name }))
    ];
  }

  get productOptions() {
    return [
      { value: -1, label: 'Select product...' },
      ...this.products.map((p, idx) => ({ value: idx, label: p.name }))
    ];
  }

  get variantOptions() {
    const options: any[] = [{ value: -1, label: 'Choose variant...' }];
    if (this.selectedProductIndex !== -1 && this.products[this.selectedProductIndex]) {
      const variants = this.products[this.selectedProductIndex].variants || [];
      variants.forEach((v: any, vIdx: number) => {
        options.push({ value: vIdx, label: `${v.size || ''} ${v.color || ''} (SKU: ${v.sku})`.trim() });
      });
    }
    return options;
  }

  constructor(
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadReturns();
        this.loadSuppliers();
        this.loadProducts();
      }
    });
  }

  loadReturns() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.purchaseService.getPurchaseReturns(this.shopId).subscribe({
      next: (res) => {
        this.returns = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading purchase returns:', err);
        this.isLoading = false;
      },
    });
  }

  loadSuppliers() {
    if (!this.shopId) return;
    this.purchaseService.getSuppliers(this.shopId).subscribe({
      next: (res) => {
        this.suppliers = (res.data || []).filter((s) => s.isActive);
      },
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : (res.data || []);
      },
    });
  }

  get filteredReturns(): PurchaseReturn[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.returns;
    return this.returns.filter(
      (r) =>
        r.returnNumber.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
    );
  }

  openAddModal() {
    this.selectedSupplierId = '';
    this.returnItems = [];
    this.returnNotes = '';
    this.resetItemSelection();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  resetItemSelection() {
    this.selectedProductIndex = -1;
    this.selectedVariantIndex = -1;
    this.itemQty = 1;
    this.itemCost = 0;
  }

  onProductChange() {
    const prod = this.products[this.selectedProductIndex];
    if (prod && prod.variants && prod.variants.length > 0) {
      this.selectedVariantIndex = 0;
      this.itemCost = prod.variants[0].costPrice || prod.variants[0].price || 0;
    } else {
      this.selectedVariantIndex = -1;
      this.itemCost = 0;
    }
  }

  onVariantChange() {
    const prod = this.products[this.selectedProductIndex];
    if (prod && prod.variants) {
      const variant = prod.variants[this.selectedVariantIndex];
      this.itemCost = variant.costPrice || variant.price || 0;
    }
  }

  addItem() {
    if (this.selectedProductIndex === -1) return;
    const prod = this.products[this.selectedProductIndex];
    const variant = prod.variants ? prod.variants[this.selectedVariantIndex] : null;

    if (!prod) return;

    const variantSku = variant ? variant.sku : '';
    const variantName = variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : 'Standard';

    const existing = this.returnItems.find(
      (item) => item.productId === prod.id && item.variantSku === variantSku
    );

    if (existing) {
      existing.returnQty += this.itemQty;
      existing.amount = existing.returnQty * existing.costPrice;
    } else {
      this.returnItems.push({
        productId: prod.id,
        productName: prod.name,
        variantSku,
        variantName,
        returnQty: this.itemQty,
        costPrice: this.itemCost,
        amount: this.itemQty * this.itemCost,
      });
    }

    this.resetItemSelection();
  }

  removeItem(index: number) {
    this.returnItems.splice(index, 1);
  }

  get returnTotal(): number {
    return this.returnItems.reduce((acc, item) => acc + item.amount, 0);
  }

  async saveReturn() {
    if (!this.selectedSupplierId) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: 'Please select a supplier.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }
    if (this.returnItems.length === 0) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: 'Please add at least one item to return.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }

    const supplier = this.suppliers.find((s) => s.id === this.selectedSupplierId);
    if (!supplier) return;

    const payload = {
      shopId: this.shopId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: this.returnItems,
      totalAmount: this.returnTotal,
      returnDate: new Date().toISOString(),
      notes: this.returnNotes,
    };

    this.purchaseService.createPurchaseReturn(payload).subscribe({
      next: () => {
        this.loadReturns();
        this.closeModal();
      },
      error: (err) => console.error('Error creating purchase return:', err),
    });
  }
}
