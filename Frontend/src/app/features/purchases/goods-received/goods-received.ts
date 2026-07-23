import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, PurchaseOrder, GoodsReceivedItem } from '../../../core/services/purchase.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ConfirmationService } from '../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-goods-received',
  standalone: true,
  imports: [CommonModule, FormsModule, UiDropdownComponent],
  templateUrl: './goods-received.html',
  styleUrl: './goods-received.css',
})
export class GoodsReceived implements OnInit {
  grns: any[] = [];
  pendingOrders: PurchaseOrder[] = [];
  shopId = '';
  isLoading = false;
  searchQuery = '';

  // Form State
  isModalOpen = false;
  selectedOrderId = '';
  selectedOrderDetails: PurchaseOrder | null = null;
  receivedItems: GoodsReceivedItem[] = [];
  grnNotes = '';

  get pendingOrderOptions() {
    return [
      { value: '', label: 'Choose a pending order...' },
      ...this.pendingOrders.map(order => ({ value: order.id!, label: `${order.poNumber} (${order.supplierName})` }))
    ];
  }

  constructor(
    private purchaseService: PurchaseService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadGRNs();
        this.loadPendingOrders();
      }
    });
  }

  loadGRNs() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.purchaseService.getGoodsReceived(this.shopId).subscribe({
      next: (res) => {
        this.grns = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading goods received notes:', err);
        this.isLoading = false;
      },
    });
  }

  loadPendingOrders() {
    if (!this.shopId) return;
    this.purchaseService.getPurchaseOrders(this.shopId).subscribe({
      next: (res) => {
        // filter POs that are ordered or partially_received
        this.pendingOrders = (res.data || []).filter(
          (o) => o.status === 'ordered' || o.status === 'partially_received'
        );
      },
      error: (err) => console.error('Error loading pending orders:', err),
    });
  }

  get filteredGrns() {
    if (!this.searchQuery.trim()) return this.grns;
    const q = this.searchQuery.toLowerCase();
    return this.grns.filter(
      (g) =>
        g.poNumber.toLowerCase().includes(q) ||
        g.supplierName.toLowerCase().includes(q)
    );
  }

  openAddModal() {
    this.selectedOrderId = '';
    this.selectedOrderDetails = null;
    this.receivedItems = [];
    this.grnNotes = '';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onOrderChange() {
    this.purchaseService.getPurchaseOrder(this.selectedOrderId).subscribe({
      next: (res) => {
        this.selectedOrderDetails = res.data;
        if (this.selectedOrderDetails) {
          this.receivedItems = this.selectedOrderDetails.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            variantSku: item.variantSku || '',
            variantName: item.variantName,
            orderedQty: item.quantity,
            receivedQty: item.quantity, // default to receiving everything
          }));
        }
      },
    });
  }

  async saveGRN() {
    if (!this.selectedOrderId || !this.selectedOrderDetails) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: 'Please select a purchase order.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }

    const payload = {
      shopId: this.shopId,
      purchaseOrderId: this.selectedOrderDetails.id,
      poNumber: this.selectedOrderDetails.poNumber,
      supplierId: this.selectedOrderDetails.supplierId,
      supplierName: this.selectedOrderDetails.supplierName,
      receivedDate: new Date().toISOString(),
      items: this.receivedItems,
      notes: this.grnNotes,
    };

    this.purchaseService.createGoodsReceived(payload).subscribe({
      next: () => {
        this.loadGRNs();
        this.loadPendingOrders();
        this.closeModal();
      },
      error: (err) => console.error('Error recording goods received:', err),
    });
  }
}
