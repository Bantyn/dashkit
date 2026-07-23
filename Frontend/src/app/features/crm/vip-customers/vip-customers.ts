import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CRMService, CRMCustomer } from '../../../core/services/crm.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

@Component({
  selector: 'app-vip-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">

      <!-- Left: VIP List -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200">

        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <i class="bi bi-crown-fill text-yellow-500"></i> VIP Customers
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">Your top customers by revenue and order count</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-center bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
              <div class="text-xs text-yellow-600 font-semibold uppercase tracking-wider">Total Revenue</div>
              <div class="text-lg font-black text-yellow-700">₹{{ totalRevenue | number }}</div>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="px-4 py-3 bg-white shrink-0 border-b border-gray-100 flex items-center gap-3">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search VIP customer..." class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 rounded-lg text-sm" />
          </div>
          <span class="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full font-semibold">{{ filteredCustomers.length }} VIP</span>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-auto p-4">
          @if (loading) {
            <div class="flex items-center justify-center h-48"><app-ui-loading size="md"></app-ui-loading></div>
          } @else if (error) {
            <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">{{ error }}</div>
          } @else if (filteredCustomers.length === 0) {
            <div class="flex flex-col items-center justify-center h-48 text-center">
              <i class="bi bi-crown text-5xl text-gray-200 mb-3"></i>
              <p class="text-gray-400 text-sm">No VIP customers yet. Keep selling!</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (c of filteredCustomers; let i = $index; track c.id) {
                <div
                  (click)="selected = c"
                  class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all"
                  [class.border-yellow-400]="selected?.id === c.id"
                  [class.bg-yellow-50]="selected?.id === c.id"
                >
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-black text-lg">
                        {{ c.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {{ i + 1 }}
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-bold text-gray-900">{{ c.name }}</div>
                      <div class="text-xs text-gray-400">{{ c.phoneNumber }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-black text-yellow-600">₹{{ c.totalSpent | number }}</div>
                      <div class="text-xs text-gray-400">{{ c.totalOrders }} orders</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Right: Detail Panel -->
      @if (selected) {
        <div class="w-[38%] min-w-[320px] max-w-[460px] bg-white flex flex-col overflow-hidden border-l border-gray-200">
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start bg-gradient-to-r from-yellow-50 to-orange-50">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <i class="bi bi-crown-fill text-yellow-500 text-lg"></i>
                <span class="text-xs font-bold text-yellow-600 uppercase tracking-wider">VIP Customer</span>
              </div>
              <h3 class="text-lg font-bold text-gray-900">{{ selected.name }}</h3>
            </div>
            <button (click)="selected = null" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                <div class="text-xs text-yellow-600 uppercase tracking-wider font-semibold mb-1">Total Spent</div>
                <div class="text-xl font-black text-yellow-700">₹{{ selected.totalSpent | number }}</div>
              </div>
              <div class="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                <div class="text-xs text-orange-600 uppercase tracking-wider font-semibold mb-1">Orders</div>
                <div class="text-xl font-black text-orange-700">{{ selected.totalOrders }}</div>
              </div>
            </div>
            <!-- Info -->
            <div class="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100">
              <div class="px-4 py-3 flex justify-between">
                <span class="text-sm text-gray-500">Phone</span>
                <span class="text-sm font-medium text-gray-900">{{ selected.phoneNumber }}</span>
              </div>
              @if (selected.email) {
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Email</span>
                  <span class="text-sm font-medium text-gray-900">{{ selected.email }}</span>
                </div>
              }
              @if (selected.dateOfBirth) {
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-500">Birthday</span>
                  <span class="text-sm font-medium text-gray-900">{{ selected.dateOfBirth | date:'d MMM' }}</span>
                </div>
              }
              <div class="px-4 py-3 flex justify-between">
                <span class="text-sm text-gray-500">Avg Order Value</span>
                <span class="text-sm font-bold text-gray-900">₹{{ (selected.totalOrders > 0 ? selected.totalSpent / selected.totalOrders : 0) | number:'1.0-0' }}</span>
              </div>
            </div>
            <!-- Special Actions -->
            <div class="space-y-2">
              <a [href]="'tel:' + selected.phoneNumber" class="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                <i class="bi bi-telephone-fill text-green-600"></i>
                <span class="text-sm font-semibold text-green-700">Call Customer</span>
              </a>
              <a [href]="'https://wa.me/91' + selected.phoneNumber" target="_blank" class="flex items-center gap-3 p-3 bg-teal-50 border border-teal-100 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer">
                <i class="bi bi-whatsapp text-teal-600"></i>
                <span class="text-sm font-semibold text-teal-700">WhatsApp Message</span>
              </a>
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[38%] bg-white border-l border-gray-200 text-center p-8">
          <i class="bi bi-crown text-5xl text-yellow-200 mb-3"></i>
          <h3 class="text-gray-900 font-medium mb-1">Select a VIP Customer</h3>
          <p class="text-gray-400 text-sm">Click any customer to view their details</p>
        </div>
      }
    </div>
  `,
})
export class VipCustomers implements OnInit {
  customers: CRMCustomer[] = [];
  totalRevenue = 0;
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  selected: CRMCustomer | null = null;

  constructor(
    private crmService: CRMService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredCustomers(): CRMCustomer[] {
    if (!this.searchQuery.trim()) return this.customers;
    const q = this.searchQuery.toLowerCase();
    return this.customers.filter(c => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q));
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    this.crmService.getVIPCustomers(this.shopId).subscribe({
      next: res => {
        this.customers = res.data.customers;
        this.totalRevenue = res.data.totalRevenue;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Failed to load VIP customers.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }
}
