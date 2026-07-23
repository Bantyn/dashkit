import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Page Header -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Customer Management</h2>
            <p class="text-xs text-gray-500 mt-1">Manage all shop customers registered on the platform.</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 shadow-sm">
            Total: {{ customers.length }} Customers
          </span>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Search -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0">
            <div class="relative">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filter()"
                placeholder="Search customers by name, email, phone or shop ID…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (loading) {
                <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400 flex-1">
                  <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span class="text-sm">Loading customers…</span>
                </div>
              } @else if (filtered.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1">
                  <i class="bi bi-people text-4xl text-gray-300"></i>
                  <p class="text-sm font-bold">No customers found.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Customer Name</th>
                        <th class="px-6 py-4">Email</th>
                        <th class="px-6 py-4">Phone</th>
                        <th class="px-6 py-4">Registration Date</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Total Orders</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (c of filtered; track c.id) {
                        <tr
                          (click)="selectedCustomer = c"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedCustomer?.id === c.id"
                        >
                          <td class="px-6 py-4 font-semibold text-gray-900">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {{ c.name.charAt(0).toUpperCase() }}
                              </div>
                              <div>
                                <div class="font-bold text-gray-900 text-sm">{{ c.name }}</div>
                                <div class="text-[10px] text-gray-400">Shop: {{ c.shopId || '—' }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ c.email || '—' }}</td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ c.phoneNumber || '—' }}</td>
                          <td class="px-6 py-4 text-gray-400 text-xs">{{ formatDate(c.createdAt) }}</td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                              [class.bg-green-50]="c.status === 'Active'"
                              [class.text-green-700]="c.status === 'Active'"
                              [class.border-green-100]="c.status === 'Active'"
                              [class.bg-gray-100]="c.status !== 'Active'"
                              [class.text-gray-600]="c.status !== 'Active'"
                              [class.border-gray-250]="c.status !== 'Active'"
                            >
                              {{ c.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ c.totalOrders }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Short Info) -->
        <div *ngIf="selectedCustomer" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer Details</h3>
            <button (click)="selectedCustomer = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-16 h-16 rounded-3xl bg-green-50 text-green-700 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm border border-green-200">
                {{ custInitials }}
              </div>
              <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedCustomer.name }}</h4>
              <p class="text-xs text-gray-400 font-mono mt-1">Shop ID: {{ selectedCustomer.shopId || '—' }}</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                  [class.bg-green-50]="selectedCustomer.status === 'Active'"
                  [class.text-green-700]="selectedCustomer.status === 'Active'"
                  [class.border-green-100]="selectedCustomer.status === 'Active'"
                  [class.bg-gray-100]="selectedCustomer.status !== 'Active'"
                  [class.text-gray-600]="selectedCustomer.status !== 'Active'"
                  [class.border-gray-200]="selectedCustomer.status !== 'Active'"
                >
                  {{ selectedCustomer.status }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</span>
                <a href="mailto:{{ selectedCustomer.email }}" class="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">{{ selectedCustomer.email || '—' }}</a>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</span>
                <span class="text-sm font-bold text-gray-900">{{ selectedCustomer.phoneNumber || '—' }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders Placed</span>
                <span class="font-bold text-sm text-gray-800 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg inline-block">{{ selectedCustomer.totalOrders || 0 }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered On</span>
                <span class="text-sm font-bold text-gray-900">{{ formatDate(selectedCustomer.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            <button
              class="w-full px-4 py-2.5 bg-primary-700 text-white font-bold rounded-xl hover:bg-black transition-all text-xs uppercase tracking-wider text-center"
            >
              Action Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminCustomersComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  customers: any[] = [];
  filtered: any[] = [];
  selectedCustomer: any | null = null;
  search = '';
  loading = false;

  get custInitials() {
    if (!this.selectedCustomer) return 'C';
    return (this.selectedCustomer.name || 'C').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit() { this.load(); }

  async load() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getPlatformCustomers(''));
      this.customers = res.data || [];
      this.filtered = [...this.customers];
    } catch { } finally { this.loading = false; }
  }

  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').toLowerCase().includes(q) ||
      (c.shopId || '').toLowerCase().includes(q)
    );
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
