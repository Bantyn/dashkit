import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, Supplier } from '../../../core/services/purchase.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiInputComponent } from '../../../shared/components/ui-input.component';
import { ConfirmationService } from '../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css',
})
export class Suppliers implements OnInit {
  suppliers: Supplier[] = [];
  searchQuery = '';
  shopId = '';
  isLoading = false;

  // Editor Modal State
  isModalOpen = false;
  isEditing = false;
  currentSupplier: Partial<Supplier> = {};

  constructor(
    private purchaseService: PurchaseService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadSuppliers();
      }
    });
  }

  loadSuppliers() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.purchaseService.getSuppliers(this.shopId).subscribe({
      next: (res) => {
        this.suppliers = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.isLoading = false;
      },
    });
  }

  get filteredSuppliers(): Supplier[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.suppliers;
    return this.suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.gstin && s.gstin.toLowerCase().includes(q))
    );
  }

  openAddModal() {
    this.isEditing = false;
    this.currentSupplier = {
      shopId: this.shopId,
      name: '',
      email: '',
      phone: '',
      gstin: '',
      address: '',
      isActive: true,
    };
    this.isModalOpen = true;
  }

  openEditModal(supplier: Supplier) {
    this.isEditing = true;
    this.currentSupplier = { ...supplier };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveSupplier() {
    if (!this.currentSupplier.name || !this.currentSupplier.email || !this.currentSupplier.phone) {
      await this.confirmationService.confirm({
        title: 'Required Fields',
        description: 'Name, Email and Phone are required.',
        type: 'warning',
        primaryButtonText: 'OK',
        showIcon: true
      });
      return;
    }

    if (this.isEditing && this.currentSupplier.id) {
      this.purchaseService.updateSupplier(this.currentSupplier.id, this.currentSupplier).subscribe({
        next: () => {
          this.loadSuppliers();
          this.closeModal();
        },
        error: (err) => console.error('Error updating supplier:', err),
      });
    } else {
      this.purchaseService.createSupplier(this.currentSupplier).subscribe({
        next: () => {
          this.loadSuppliers();
          this.closeModal();
        },
        error: (err) => console.error('Error creating supplier:', err),
      });
    }
  }

  async deleteSupplier(supplier: Supplier) {
    if (!supplier.id) return;
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Supplier?',
      description: `Are you sure you want to delete supplier "<strong>${supplier.name}</strong>"?`,
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      this.purchaseService.deleteSupplier(supplier.id).subscribe({
        next: () => this.loadSuppliers(),
        error: (err) => console.error('Error deleting supplier:', err),
      });
    }
  }
}
