import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExpenseService, Expense, ExpenseCategory } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { getLocalISODate } from '../../core/utils/date.utils';
import { UiDropdownComponent, DropdownOption } from '../../shared/components/ui-dropdown.component';
import { UiDatePickerComponent } from '../../shared/components/ui-date-picker.component';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-expenses-add',
  standalone: true,
  imports: [CommonModule, FormsModule, UiDropdownComponent, UiDatePickerComponent, UiInputComponent, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] overflow-y-auto">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Add Expense</h2>
          <p class="text-xs text-gray-500 mt-0.5">Record a new business expense</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="router.navigate(['/' + shopId + '/expenses/reports'])"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <i class="bi bi-bar-chart"></i> View Reports
          </button>
          <button
            (click)="router.navigate(['/' + shopId + '/expenses/categories'])"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <i class="bi bi-tags"></i> Categories
          </button>
        </div>
      </div>

      <div class="max-w-full mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Recent Expenses Summary -->
        <div class="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p class="text-xs text-gray-500 font-medium">Today</p>
            <p class="text-xl font-bold text-gray-900 mt-1">₹{{ todayTotal | number:'1.0-0' }}</p>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p class="text-xs text-gray-500 font-medium">This Week</p>
            <p class="text-xl font-bold text-gray-900 mt-1">₹{{ weekTotal | number:'1.0-0' }}</p>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p class="text-xs text-gray-500 font-medium">This Month</p>
            <p class="text-xl font-bold text-gray-900 mt-1">₹{{ monthTotal | number:'1.0-0' }}</p>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p class="text-xs text-gray-500 font-medium">Total Expenses</p>
            <p class="text-xl font-bold text-gray-900 mt-1">{{ expenses.length }}</p>
          </div>
        </div>

        <!-- Add Expense Form -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <i class="bi bi-plus-circle-fill text-primary-500"></i> New Expense
          </h3>

          <form (ngSubmit)="submitExpense()" #f="ngForm" class="space-y-4">
            <!-- Category -->
            <div>
              <app-ui-dropdown
                [(ngModel)]="form.category"
                name="category"
                [options]="categoryOptions"
                placeholder="Select category"
                (onSelect)="form.category = $event"
              ></app-ui-dropdown>
            </div>

            <!-- Amount -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Amount (₹) *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                <input
                  type="number"
                  [(ngModel)]="form.amount"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-50 outline-none transition-all"
                />
              </div>
            </div>

            <!-- Date -->
            <app-ui-date-picker
              [(ngModel)]="form.date"
              name="date"
              label="Date *"
              placeholder="Pick a date"
            ></app-ui-date-picker>

            <!-- Payment Method -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Payment Method *</label>
              <div class="grid grid-cols-3 gap-2">
                @for (method of paymentMethods; track method.value) {
                  <button
                    type="button"
                    (click)="form.paymentMethod = method.value"
                    class="py-2 px-3 rounded-xl text-xs font-medium border transition-all"
                    [class]="form.paymentMethod === method.value
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'"
                  >
                    <i [class]="'bi ' + method.icon + ' mr-1'"></i>
                    {{ method.label }}
                  </button>
                }
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <textarea
                [(ngModel)]="form.description"
                name="description"
                rows="2"
                placeholder="Optional notes..."
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-50 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <!-- Reference -->
            <app-ui-input
              [(ngModel)]="form.referenceNo"
              name="referenceNo"
              label="Reference No. (optional)"
              placeholder="e.g. Bill No, Receipt No"
            ></app-ui-input>

            <button
              type="submit"
              [disabled]="saving || !form.category || !form.amount"
              class="w-full py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
            >
              @if (saving) {
                <i class="bi bi-hourglass-split animate-spin"></i> Saving...
              } @else {
                <i class="bi bi-check2-circle"></i> Save Expense
              }
            </button>
          </form>
        </div>

        <!-- Recent Expenses List -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="bi bi-clock-history text-gray-400"></i> Recent Expenses
          </h3>

          @if (loading) {
            <div class="flex-1 flex items-center justify-center py-8">
              <app-ui-loading size="md"></app-ui-loading>
            </div>
          } @else if (expenses.length === 0) {
            <div class="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <i class="bi bi-receipt text-3xl text-gray-200 mb-2"></i>
              <p class="text-sm text-gray-400">No expenses yet</p>
            </div>
          } @else {
            <div class="space-y-3 overflow-y-auto max-h-[450px]">
              @for (exp of expenses.slice(0, 15); track exp.id) {
                <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 group transition-colors">
                  <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <i class="bi bi-arrow-down-circle text-red-500"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ exp.category }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ exp.description || 'No description' }} · {{ exp.date }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-bold text-red-600">-₹{{ exp.amount | number:'1.0-0' }}</p>
                    <p class="text-[10px] text-gray-400 capitalize">{{ exp.paymentMethod }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class ExpensesAddComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  router = inject(Router);

  shopId = '';
  loading = true;
  saving = false;
  expenses: Expense[] = [];
  categories: ExpenseCategory[] = [];

  form = {
    category: '',
    amount: null as number | null,
    date: getLocalISODate(),
    paymentMethod: 'cash' as Expense['paymentMethod'],
    description: '',
    referenceNo: '',
  };

  paymentMethods: { value: Expense['paymentMethod']; label: string; icon: string }[] = [
    { value: 'cash', label: 'Cash', icon: 'bi-cash' },
    { value: 'upi', label: 'UPI', icon: 'bi-phone' },
    { value: 'card', label: 'Card', icon: 'bi-credit-card' },
    { value: 'bank_transfer', label: 'Bank', icon: 'bi-bank' },
    { value: 'other', label: 'Other', icon: 'bi-three-dots' },
  ];

  get categoryOptions() {
    return this.categories.map(cat => ({ value: cat.name, label: cat.name }));
  }

  get todayTotal() {
    const today = getLocalISODate();
    return this.expenses.filter(e => e.date === today).reduce((s, e) => s + (e.amount || 0), 0);
  }

  get weekTotal() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.expenses.filter(e => new Date(e.date) >= weekAgo).reduce((s, e) => s + (e.amount || 0), 0);
  }

  get monthTotal() {
    const month = new Date().toISOString().substring(0, 7);
    return this.expenses.filter(e => e.date?.startsWith(month)).reduce((s, e) => s + (e.amount || 0), 0);
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.shopId = user?.shopId || '';
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.expenseService.getExpenses(this.shopId).subscribe({
      next: (res) => {
        this.expenses = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.expenseService.getCategories(this.shopId).subscribe({
      next: (res) => { this.categories = res.data || []; }
    });
  }

  submitExpense() {
    if (!this.form.category || !this.form.amount) return;
    this.saving = true;

    const payload: Partial<Expense> = {
      category: this.form.category,
      amount: this.form.amount,
      date: this.form.date,
      paymentMethod: this.form.paymentMethod,
      description: this.form.description,
      referenceNo: this.form.referenceNo || undefined,
    };

    this.expenseService.createExpense(this.shopId, payload).subscribe({
      next: (res) => {
        this.toast.showSuccess(`Expense of ₹${this.form.amount} saved successfully!`);
        this.expenses.unshift(res.data);
        // Reset form
        this.form = {
          category: '',
          amount: null,
          date: getLocalISODate(),
          paymentMethod: 'cash',
          description: '',
          referenceNo: '',
        };
        this.saving = false;
      },
      error: () => {
        this.toast.showError('Failed to save expense');
        this.saving = false;
      }
    });
  }
}
