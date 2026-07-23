import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, SupplierPayment, PurchaseOrder } from '../../../core/services/purchase.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiInputComponent } from '../../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ConfirmationService } from '../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-supplier-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent, UiDropdownComponent],
  templateUrl: './supplier-payments.html',
  styleUrl: './supplier-payments.css',
})
export class SupplierPayments implements OnInit {
  payments: SupplierPayment[] = [];
  unpaidOrders: PurchaseOrder[] = [];
  shopId = '';
  isLoading = false;
  searchQuery = '';

  // Form State
  isModalOpen = false;
  selectedOrderId = '';
  selectedOrderDetails: PurchaseOrder | null = null;
  paymentAmount = 0;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'online' = 'cash';
  referenceNo = '';

  get unpaidOrderOptions() {
    return [
      { value: '', label: 'Choose PO with outstanding dues...' },
      ...this.unpaidOrders.map(order => ({
        value: order.id!,
        label: `${order.poNumber} — Out: INR ${(order.totalAmount - order.paidAmount).toFixed(2)} (${order.supplierName})`
      }))
    ];
  }

  readonly paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Debit/Credit Card' },
    { value: 'online', label: 'Online Payment' },
  ];

  constructor(
    private purchaseService: PurchaseService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadPayments();
        this.loadUnpaidOrders();
      }
    });
  }

  loadPayments() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.purchaseService.getSupplierPayments(this.shopId).subscribe({
      next: (res) => {
        this.payments = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.isLoading = false;
      },
    });
  }

  loadUnpaidOrders() {
    if (!this.shopId) return;
    this.purchaseService.getPurchaseOrders(this.shopId).subscribe({
      next: (res) => {
        // filter orders that have outstanding dues
        const orders = res.data || [];
        this.unpaidOrders = orders.filter(
          (o) => o.status !== 'draft' && o.status !== 'cancelled' && o.totalAmount > o.paidAmount
        );
      },
      error: (err) => console.error('Error loading unpaid orders:', err),
    });
  }

  get filteredPayments(): SupplierPayment[] {
    if (!this.searchQuery.trim()) return this.payments;
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(
      (p) =>
        p.poNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.paymentMethod.toLowerCase().includes(q)
    );
  }

  openAddModal() {
    this.selectedOrderId = '';
    this.selectedOrderDetails = null;
    this.paymentAmount = 0;
    this.paymentMethod = 'cash';
    this.referenceNo = '';
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
          // Default payment amount to outstanding balance
          this.paymentAmount = this.selectedOrderDetails.totalAmount - this.selectedOrderDetails.paidAmount;
        }
      },
    });
  }

  async savePayment() {
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
    if (this.paymentAmount <= 0) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: 'Payment amount must be greater than zero.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }

    const maxAmount = this.selectedOrderDetails.totalAmount - this.selectedOrderDetails.paidAmount;
    if (this.paymentAmount > maxAmount) {
      await this.confirmationService.confirm({
        title: 'Validation Error',
        description: `Payment amount cannot exceed outstanding balance of INR ${maxAmount}`,
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
      amount: this.paymentAmount,
      paymentDate: new Date().toISOString(),
      paymentMethod: this.paymentMethod,
      referenceNo: this.referenceNo,
    };

    this.purchaseService.createSupplierPayment(payload).subscribe({
      next: () => {
        this.loadPayments();
        this.loadUnpaidOrders();
        this.closeModal();
      },
      error: (err) => console.error('Error saving supplier payment:', err),
    });
  }
}
