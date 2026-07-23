import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExpenseService, ExpenseCategory } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-expenses-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] overflow-y-auto">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Expense Categories</h2>
          <p class="text-xs text-gray-500 mt-0.5">Manage your expense category list</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="router.navigate(['/' + shopId + '/expenses/add'])"
            class="px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <i class="bi bi-plus-lg"></i> Add Expense
          </button>
        </div>
      </div>

      <div class="max-w-full mx-auto px-6 py-8 space-y-6">
        <!-- Add Category Form -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-bold text-gray-700 mb-4">Add New Category</h3>
          <div class="flex gap-3">
            <input
              type="text"
              [(ngModel)]="newCategoryName"
              placeholder="e.g. Staff Lunch, Office Supplies"
              class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-50 outline-none transition-all"
              (keydown.enter)="addCategory()"
            />
            <input
              type="text"
              [(ngModel)]="newCategoryDesc"
              placeholder="Description (optional)"
              class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-50 outline-none transition-all"
            />
            <button
              (click)="addCategory()"
              [disabled]="!newCategoryName.trim() || saving"
              class="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <i class="bi bi-plus-lg"></i> Add
            </button>
          </div>
        </div>

        <!-- Category List -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-700">All Categories</h3>
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{{ categories.length }} categories</span>
          </div>

          @if (loading) {
            <div class="flex items-center justify-center py-12">
              <div class="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (categories.length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center px-6">
              <i class="bi bi-tags text-3xl text-gray-200 mb-2"></i>
              <p class="text-sm text-gray-400">No categories yet. Add one above.</p>
            </div>
          } @else {
            <div class="divide-y divide-gray-50">
              @for (cat of categories; track cat.id) {
                <div class="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 group transition-colors">
                  <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <i class="bi bi-tag-fill text-primary-500 text-sm"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800">{{ cat.name }}</p>
                    <p class="text-xs text-gray-400">{{ cat.description || 'No description' }}</p>
                  </div>
                  <button
                    (click)="deleteCategory(cat)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <i class="bi bi-trash text-sm"></i>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ExpensesCategoriesComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  router = inject(Router);
  private confirmationService = inject(ConfirmationService);

  shopId = '';
  loading = true;
  saving = false;
  categories: ExpenseCategory[] = [];
  newCategoryName = '';
  newCategoryDesc = '';

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.shopId = user?.shopId || '';
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.expenseService.getCategories(this.shopId).subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  addCategory() {
    const name = this.newCategoryName.trim();
    if (!name || this.saving) return;
    this.saving = true;
    this.expenseService.createCategory(this.shopId, name, this.newCategoryDesc.trim() || undefined).subscribe({
      next: (res) => {
        this.categories.push(res.data);
        this.newCategoryName = '';
        this.newCategoryDesc = '';
        this.saving = false;
        this.toast.showSuccess('Category added');
      },
      error: () => {
        this.toast.showError('Failed to add category');
        this.saving = false;
      }
    });
  }

  async deleteCategory(cat: ExpenseCategory) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Category?',
      description: `Are you sure you want to delete category "<strong>${cat.name}</strong>"?`,
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.expenseService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
        this.toast.showSuccess('Category deleted');
      },
      error: () => this.toast.showError('Failed to delete category')
    });
  }
}
