import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, PurchaseOrder, Supplier, PurchaseOrderItem } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiInputComponent } from '../../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ConfirmationService } from '../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent, UiDropdownComponent],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css',
})
export class PurchaseOrders implements OnInit {
  orders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  products: any[] = [];
  
  shopId = '';
  isLoading = false;
  searchQuery = '';

  // Form Modal State
  isModalOpen = false;
  selectedSupplier: string = '';
  poItems: PurchaseOrderItem[] = [];
  
  // Auxiliary select state
  selectedProductIndex: number = -1;
  selectedVariantIndex: number = -1;
  itemQty: number = 1;
  itemCost: number = 0;

  get supplierOptions() {
    return [
      { value: '', label: 'Choose a supplier...' },
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
        this.loadOrders();
        this.loadSuppliers();
        this.loadProducts();
      }
    });
  }

  loadOrders() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.purchaseService.getPurchaseOrders(this.shopId).subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading purchase orders:', err);
        this.isLoading = false;
      },
    });
  }

  loadSuppliers() {
    this.purchaseService.getSuppliers(this.shopId).subscribe({
      next: (res) => {
        this.suppliers = (res.data || []).filter((s) => s.isActive);
      },
    });
  }

  loadProducts() {
    this.productService.getProductsByShop(this.shopId).subscribe({
      next: (res) => {
        this.products = res.data || [];
      },
    });
  }

  get filteredOrders(): PurchaseOrder[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.orders;
    return this.orders.filter(
      (o) =>
        o.poNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.paymentStatus.toLowerCase().includes(q)
    );
  }

  openAddModal() {
    this.selectedSupplier = '';
    this.poItems = [];
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
    if (!prod) return;
    const variant = prod.variants ? prod.variants[this.selectedVariantIndex] : null;

    const variantSku = variant ? variant.sku : '';
    const variantName = variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : 'Standard';

    // Check if already in list
    const existing = this.poItems.find(
      (item) => item.productId === prod.id && item.variantSku === variantSku
    );

    if (existing) {
      existing.quantity += this.itemQty;
      existing.amount = existing.quantity * existing.costPrice;
    } else {
      this.poItems.push({
        productId: prod.id!,
        productName: prod.name,
        variantSku,
        variantName,
        quantity: this.itemQty,
        costPrice: this.itemCost,
        amount: this.itemQty * this.itemCost,
      });
    }

    this.resetItemSelection();
  }

  removeItem(index: number) {
    this.poItems.splice(index, 1);
  }

  get poTotal(): number {
    return this.poItems.reduce((acc, item) => acc + item.amount, 0);
  }

  async saveOrder() {
    if (!this.selectedSupplier) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: 'Please select a supplier.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }
    if (this.poItems.length === 0) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: 'Please add at least one item.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }

    const supplier = this.suppliers.find((s) => s.id === this.selectedSupplier);
    if (!supplier) return;

    const payload: Partial<PurchaseOrder> = {
      shopId: this.shopId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: this.poItems,
      totalAmount: this.poTotal,
      paidAmount: 0,
      status: 'ordered',
      paymentStatus: 'unpaid',
      orderDate: new Date().toISOString(),
    };

    this.purchaseService.createPurchaseOrder(payload).subscribe({
      next: () => {
        this.loadOrders();
        this.closeModal();
      },
      error: (err) => console.error('Error creating purchase order:', err),
    });
  }

  async deleteOrder(order: PurchaseOrder) {
    if (!order.id) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Purchase Order?',
      description: `Are you sure you want to delete PO "<strong>${order.poNumber}</strong>"?`,
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      this.purchaseService.deletePurchaseOrder(order.id).subscribe({
        next: () => this.loadOrders(),
        error: (err) => console.error('Error deleting purchase order:', err),
      });
    }
  }
}
