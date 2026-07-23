import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExpenseService, Expense, ExpenseCategory } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-expenses-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, UiDropdownComponent, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Expense Reports</h2>
          <p class="text-xs text-gray-500 mt-0.5">Track and analyse your business expenses</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
            title="Filter"
          >
            <i class="bi bi-funnel text-sm"></i>
          </button>
          <button
            (click)="router.navigate(['/' + shopId + '/expenses/add'])"
            class="px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <i class="bi bi-plus-lg"></i> Add Expense
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 shrink-0">
        <div class="w-40">
          <app-ui-dropdown
            [(ngModel)]="filterPeriod"
            [options]="periodOptions"
            placeholder="All Time"
            (onSelect)="filterPeriod = $event; applyFilters()"
          ></app-ui-dropdown>
        </div>
        <div class="w-44">
          <app-ui-dropdown
            [(ngModel)]="filterCategory"
            [options]="categoryOptions"
            placeholder="All Categories"
            (onSelect)="filterCategory = $event; applyFilters()"
          ></app-ui-dropdown>
        </div>
        <div class="w-48">
          <app-ui-dropdown
            [(ngModel)]="filterPayment"
            [options]="paymentOptions"
            placeholder="All Payment Methods"
            (onSelect)="filterPayment = $event; applyFilters()"
          ></app-ui-dropdown>
        </div>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="applyFilters()"
          placeholder="Search expenses..."
          class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
        />
        <span class="text-xs text-gray-500 font-medium whitespace-nowrap">
          {{ filtered.length }} records
        </span>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex gap-0">
        <!-- Left: List -->
        <div class="flex-1 overflow-y-auto bg-gray-50">
          @if (loading) {
            <div class="flex items-center justify-center h-40">
              <app-ui-loading size="md"></app-ui-loading>
            </div>
          } @else if (filtered.length === 0) {
            <div class="flex flex-col items-center justify-center h-40 text-center">
              <i class="bi bi-receipt text-4xl text-gray-200 mb-2"></i>
              <p class="text-sm text-gray-400">No expenses found</p>
            </div>
          } @else {
            <!-- Group by date -->
            @for (group of groupedExpenses; track group.date) {
              <div class="px-6 pt-4">
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">{{ group.date }}</span>
                  <div class="flex-1 h-px bg-gray-200"></div>
                  <span class="text-xs font-bold text-red-500">-₹{{ group.total | number:'1.0-0' }}</span>
                </div>
                <div class="space-y-2">
                  @for (exp of group.items; track exp.id) {
                    <div
                      class="bg-white rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-all border border-gray-50"
                      (click)="selectedExpense = selectedExpense?.id === exp.id ? null : exp"
                      [class.ring-2]="selectedExpense?.id === exp.id"
                      [class.ring-primary-200]="selectedExpense?.id === exp.id"
                    >
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        [class]="getCategoryColor(exp.category)"
                      >
                        <i class="bi bi-arrow-down-circle text-sm"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="text-sm font-semibold text-gray-800">{{ exp.category }}</p>
                          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            [class]="getPaymentBadge(exp.paymentMethod)"
                          >{{ exp.paymentMethod | uppercase }}</span>
                        </div>
                        <p class="text-xs text-gray-400 truncate">{{ exp.description || 'No description' }}</p>
                      </div>
                      <div class="text-right shrink-0">
                        <p class="text-sm font-bold text-red-600">-₹{{ exp.amount | number:'1.2-2' }}</p>
                        @if (exp.referenceNo) {
                          <p class="text-[10px] text-gray-400">Ref: {{ exp.referenceNo }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            <div class="h-6"></div>
          }
        </div>

        <!-- Right: Summary Panel -->
        <div class="w-72 bg-white border-l border-gray-200 flex flex-col overflow-y-auto shrink-0 p-5 space-y-5">
          <h3 class="text-sm font-bold text-gray-700">Summary</h3>

          <!-- Totals -->
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-xs text-gray-500">Total Expenses</span>
              <span class="text-sm font-bold text-red-600">-₹{{ totalAmount | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">Records</span>
              <span class="text-sm font-semibold text-gray-700">{{ filtered.length }}</span>
            </div>
          </div>

          <!-- By Category -->
          <div>
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">By Category</h4>
            <div class="space-y-2">
              @for (cat of categoryBreakdown; track cat.name) {
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-gray-600 truncate">{{ cat.name }}</span>
                    <span class="text-xs font-semibold text-gray-800">₹{{ cat.total | number:'1.0-0' }}</span>
                  </div>
                  <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-400 rounded-full transition-all"
                      [style.width.%]="cat.percentage"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- By Payment -->
          <div>
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">By Payment</h4>
            <div class="space-y-2">
              @for (pm of paymentBreakdown; track pm.method) {
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-600 capitalize">{{ pm.method }}</span>
                  <span class="text-xs font-semibold text-gray-800">₹{{ pm.total | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Selected Expense Detail -->
          @if (selectedExpense) {
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Selected</h4>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-500">Category</span>
                  <span class="font-semibold text-gray-800">{{ selectedExpense.category }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Amount</span>
                  <span class="font-bold text-red-600">₹{{ selectedExpense.amount | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Date</span>
                  <span class="font-semibold text-gray-800">{{ selectedExpense.date }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Payment</span>
                  <span class="font-semibold text-gray-800 capitalize">{{ selectedExpense.paymentMethod }}</span>
                </div>
                @if (selectedExpense.description) {
                  <div>
                    <span class="text-gray-500">Notes</span>
                    <p class="mt-1 text-gray-700">{{ selectedExpense.description }}</p>
                  </div>
                }
                @if (selectedExpense.referenceNo) {
                  <div class="flex justify-between">
                    <span class="text-gray-500">Ref No.</span>
                    <span class="font-semibold text-gray-800">{{ selectedExpense.referenceNo }}</span>
                  </div>
                }
                @if (selectedExpense.transactionId) {
                  <div class="flex justify-between">
                    <span class="text-gray-500">Txn Linked</span>
                    <span class="font-semibold text-green-600">✓ Yes</span>
                  </div>
                }
                <button
                  (click)="deleteExpense(selectedExpense!)"
                  class="w-full mt-2 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                >
                  <i class="bi bi-trash mr-1"></i> Delete Expense
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ExpensesReportsComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  router = inject(Router);
  private confirmationService = inject(ConfirmationService);

  shopId = '';
  loading = true;
  expenses: Expense[] = [];
  categories: ExpenseCategory[] = [];
  filtered: Expense[] = [];
  selectedExpense: Expense | null = null;

  filterPeriod = 'month';
  filterCategory = '';
  filterPayment = '';
  searchQuery = '';

  readonly periodOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
  ];

  readonly paymentOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ];

  get categoryOptions() {
    return [{ value: '', label: 'All Categories' }, ...this.categories.map(c => ({ value: c.name, label: c.name }))];
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
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.expenseService.getCategories(this.shopId).subscribe({
      next: (res) => { this.categories = res.data || []; }
    });
  }

  applyFilters() {
    let list = [...this.expenses];
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const monthStr = today.toISOString().substring(0, 7);

    if (this.filterPeriod === 'today') {
      list = list.filter(e => e.date === todayStr);
    } else if (this.filterPeriod === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(e => new Date(e.date) >= weekAgo);
    } else if (this.filterPeriod === 'month') {
      list = list.filter(e => e.date?.startsWith(monthStr));
    } else if (this.filterPeriod === 'last_month') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().substring(0, 7);
      list = list.filter(e => e.date?.startsWith(lastMonth));
    }
    if (this.filterCategory) list = list.filter(e => e.category === this.filterCategory);
    if (this.filterPayment) list = list.filter(e => e.paymentMethod === this.filterPayment);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e => e.category?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    this.filtered = list;
    this.selectedExpense = null;
  }

  get totalAmount() {
    return this.filtered.reduce((s, e) => s + (e.amount || 0), 0);
  }

  get groupedExpenses() {
    const map = new Map<string, { date: string; items: Expense[]; total: number }>();
    for (const e of this.filtered) {
      const key = e.date || 'Unknown';
      if (!map.has(key)) map.set(key, { date: key, items: [], total: 0 });
      const g = map.get(key)!;
      g.items.push(e);
      g.total += e.amount || 0;
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  get categoryBreakdown() {
    const map = new Map<string, number>();
    for (const e of this.filtered) {
      map.set(e.category, (map.get(e.category) || 0) + (e.amount || 0));
    }
    const total = this.totalAmount || 1;
    return Array.from(map.entries())
      .map(([name, t]) => ({ name, total: t, percentage: (t / total) * 100 }))
      .sort((a, b) => b.total - a.total);
  }

  get paymentBreakdown() {
    const map = new Map<string, number>();
    for (const e of this.filtered) {
      map.set(e.paymentMethod, (map.get(e.paymentMethod) || 0) + (e.amount || 0));
    }
    return Array.from(map.entries()).map(([method, total]) => ({ method, total })).sort((a, b) => b.total - a.total);
  }

  getCategoryColor(cat: string): string {
    const colors = ['bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-purple-50 text-purple-500',
      'bg-orange-50 text-orange-500', 'bg-pink-50 text-pink-500', 'bg-teal-50 text-teal-500'];
    const idx = (cat?.charCodeAt(0) || 0) % colors.length;
    return colors[idx];
  }

  getPaymentBadge(method: string): string {
    const badges: Record<string, string> = {
      cash: 'bg-green-50 text-green-600',
      upi: 'bg-blue-50 text-blue-600',
      card: 'bg-purple-50 text-purple-600',
      bank_transfer: 'bg-orange-50 text-orange-600',
      other: 'bg-gray-100 text-gray-500',
    };
    return badges[method] || 'bg-gray-100 text-gray-500';
  }

  async deleteExpense(exp: Expense) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Expense?',
      description: `Are you sure you want to delete this <strong>₹${exp.amount}</strong> expense?`,
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.expenseService.deleteExpense(exp.id).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== exp.id);
        this.applyFilters();
        this.toast.showSuccess('Expense deleted');
      },
      error: () => this.toast.showError('Failed to delete expense')
    });
  }
}
