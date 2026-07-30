import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OrderService } from '../../core/services/order.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/order.model';
import { Invoice } from '../../core/models/invoice.model';
import { PrintService } from '../../shared/components/print-preview-modal.component';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin, map } from 'rxjs';

import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

import { StaffService, Staff } from '../../core/services/staff.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiLoadingComponent, UiDropdownComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Dashboard / List Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <h2 class="text-xl font-bold text-gray-900">Orders</h2>
          <div class="flex items-center gap-2">
             <button
               class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
               title="Filter"
             >
               <i class="bi bi-funnel text-sm"></i>
             </button>
             <button
                 class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
               title="Sort by Date"
             >
                 <i class="bi bi-clock-history text-sm"></i>
             </button>
             <span class="text-xs text-gray-500 font-medium px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
               {{ filteredOrders.length }} total
             </span>
          </div>
        </div>

        <!-- Detail Header (if selected) -->
        <div 
          *ngIf="selectedOrder"
          class="w-[30%] min-w-[350px] px-6 py-5 border-l border-gray-200 flex justify-between items-start shrink-0 bg-white"
        >
          <div>
            <h3 class="text-lg font-bold text-gray-900">
              Order #{{ selectedOrder.displayId }}
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              {{ toDate(selectedOrder.date) | date: 'EEEE, MMMM d, y h:mm a' }}
            </p>
          </div>
          <div class="flex items-center gap-1">
             <button
              (click)="printOrder(selectedOrder)"
              class="p-2 text-gray-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors"
              title="Print Order"
            >
              <i class="bi bi-printer text-lg"></i>
            </button>
            <button
               (click)="sendWhatsApp()"
              class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Send via WhatsApp"
            >
              <i class="bi bi-whatsapp text-lg"></i>
            </button>
            <button
              (click)="closeDetail()"
              class="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          <!-- Search & Filter -->
          <div class="p-4 flex gap-4 bg-white border-b border-gray-100 shrink-0">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by status or order ID..."
                class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
              />
            </div>
            <div class="relative w-40 z-20">
              <app-ui-dropdown
                [options]="timeFilterOptions"
                [(ngModel)]="selectedTimeFilter"
                placeholder="Select Time"
              ></app-ui-dropdown>
            </div>
            <button
              class="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors bg-white"
            >
              <i class="bi bi-download"></i>
            </button>
          </div>

          <!-- Table Content -->
          <div class="flex-1 overflow-auto custom-scrollbar p-4">
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 sticky top-0 z-10">
                  <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th class="px-6 py-3">Order #</th>
                    <th class="px-6 py-3">Customer</th>
                    <th class="px-6 py-3">Total</th>
                    <th class="px-6 py-3">Payment</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @if (loading) {
                    <tr>
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center gap-4">
                          <app-ui-loading size="md"></app-ui-loading>
                          <span>Loading orders...</span>
                        </div>
                      </td>
                    </tr>
                  } @else if (error) {
                    <tr>
                      <td colspan="6" class="p-6">
                        <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                          {{ error }}
                        </div>
                      </td>
                    </tr>
                  } @else if (filteredOrders.length === 0) {
                    <tr>
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        No orders found.
                      </td>
                    </tr>
                  } @else {
                    @for (order of filteredOrders; track order.id) {
                      <tr
                        (click)="selectOrder(order)"
                        class="cursor-pointer transition-colors hover:bg-gray-50 group"
                        [class.bg-blue-50]="selectedOrder?.id === order.id"
                      >
                        <td class="px-6 py-4">
                          <div class="text-sm font-medium text-[#2563eb] group-hover:underline">
                            #{{ order.displayId }}
                          </div>
                          <div class="text-[10px] text-gray-400 capitalize mt-0.5">
                            {{ order.paymentMethod }}
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 uppercase">
                               {{ order.customerName?.charAt(0) || 'C' }}
                            </div>
                            <span class="text-sm text-gray-900">{{
                              order.customerName || (order.customerId | slice: -8)
                            }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">
                          ₹{{ order.totalAmount | number }}
                        </td>
                        <td class="px-6 py-4">
                          <span
                            [class]="getPaymentStatusClass(order.paymentStatus)"
                            class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          >
                            {{ order.paymentStatus }}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <span
                            [class]="getOrderStatusClass(order.orderStatus)"
                            class="px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {{ order.orderStatus | titlecase }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          {{ toDate(order.date) | date: 'd MMM \\'yy' }}
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Panel Content -->
        <div
          class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
          *ngIf="selectedOrder"
        >
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <!-- Customer Section -->
            <div class="flex items-center gap-4 mb-8">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl uppercase shadow-sm">
                 {{ selectedOrder.customerName?.charAt(0) || 'C' }}
              </div>
              <div>
                <div class="text-base font-bold text-gray-900">
                  {{ selectedOrder.customerName || 'Customer' }}
                </div>
                <div class="text-sm text-gray-500 flex items-center gap-1">
                  <i class="bi bi-hash"></i> {{ selectedOrder.customerId | slice:-8 }}
                </div>
              </div>
            </div>

            <!-- Status Cards -->
            <div class="grid grid-cols-2 gap-4 mb-8">
               <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order Status</div>
                  <span [class]="getOrderStatusClass(selectedOrder.orderStatus)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                     {{ selectedOrder.orderStatus }}
                  </span>
               </div>
               <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Status</div>
                  <span [class]="getPaymentStatusClass(selectedOrder.paymentStatus)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                     {{ selectedOrder.paymentStatus }}
                  </span>
               </div>
            </div>

            <!-- Shop Delivery Decision Actions -->
            <div class="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100" *ngIf="!selectedOrder.isInvoice">
              <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Delivery Workflow Action</h4>
              
              <div class="flex gap-2 mb-3">
                <button
                  (click)="openShopAcceptModal(selectedOrder)"
                  [disabled]="selectedOrder.orderStatus !== 'pending_shop_confirmation' && selectedOrder.orderStatus !== 'pending'"
                  class="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition disabled:opacity-40"
                >
                  <i class="bi bi-check-circle mr-1"></i> Accept Order
                </button>
                <button
                  (click)="openShopRejectModal(selectedOrder)"
                  [disabled]="selectedOrder.orderStatus !== 'pending_shop_confirmation' && selectedOrder.orderStatus !== 'pending'"
                  class="flex-1 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition disabled:opacity-40"
                >
                  <i class="bi bi-x-circle mr-1"></i> Reject Order
                </button>
              </div>

              <button
                (click)="openAssignDeliveryModal(selectedOrder)"
                [disabled]="selectedOrder.orderStatus === 'cancelled' || selectedOrder.orderStatus === 'delivered' || selectedOrder.orderStatus === 'rejected_by_shop'"
                class="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition disabled:opacity-40 shadow-sm"
              >
                <i class="bi bi-person-badge mr-1"></i> Assign Delivery Partner
              </button>
              
              <div *ngIf="selectedOrder.assignedDeliveryStaffName" class="mt-3 p-2 bg-white rounded-lg border border-indigo-100 text-xs text-indigo-800">
                <i class="bi bi-truck mr-1 text-blue-600"></i> Assigned to: <strong>{{ selectedOrder.assignedDeliveryStaffName }}</strong>
              </div>
            </div>

            <!-- Items Ordered -->
            <div class="mb-8">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Items Ordered</h4>
              <div class="space-y-4">
                @if (!selectedOrder.isInvoice) {
                  @for (product of selectedOrder.products; track product.productId) {
                     <div class="flex justify-between items-start group">
                        <div class="flex gap-3">
                           <div class="w-1 h-full min-h-[2rem] rounded-full bg-blue-500"></div>
                           <div>
                              <div class="text-sm font-medium text-gray-900">{{ product.productName || 'Product' }}</div>
                              <div class="text-[10px] text-gray-400">
                                 {{ product.variant?.color }} / {{ product.variant?.size }} | Qty: {{ product.quantity }}
                              </div>
                           </div>
                        </div>
                        <div class="text-sm font-medium text-gray-900">₹{{ product.price * product.quantity | number }}</div>
                     </div>
                  }
                }
                @if (selectedOrder.isInvoice) {
                  @for (item of selectedOrder.items; track $index) {
                     <div class="flex justify-between items-start group">
                        <div class="flex gap-3">
                           <div class="w-1 h-full min-h-[2rem] rounded-full bg-indigo-500"></div>
                           <div>
                              <div class="text-sm font-medium text-gray-900">{{ item.productName || item.name }}</div>
                              <div class="text-[10px] text-gray-400">
                                 {{ item.variantDetails?.color }} / {{ item.variantDetails?.size }} | Qty: {{ item.quantity }}
                              </div>
                           </div>
                        </div>
                        <div class="text-sm font-medium text-gray-900">₹{{ (item.unitPrice * item.quantity) | number }}</div>
                     </div>
                  }
                }
              </div>
            </div>

            <div class="h-px bg-gray-100 my-6"></div>

            <div class="space-y-3 mb-6">
               <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Payment Method</span>
                  <span class="font-medium text-gray-900 uppercase text-xs">{{ selectedOrder.paymentMethod }}</span>
               </div>
               <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Date</span>
                  <span class="font-medium text-gray-900">{{ toDate(selectedOrder.date) | date: 'mediumDate' }}</span>
               </div>
            </div>

            <div class="bg-blue-50 p-5 rounded-xl border border-blue-100">
               <div class="flex justify-between items-baseline mb-1">
                  <span class="text-sm font-medium text-blue-900">Total amount</span>
                  <span class="text-2xl font-bold text-[#2563eb]">₹{{ selectedOrder.totalAmount | number }}</span>
               </div>
               <div class="text-[10px] text-blue-600 font-bold uppercase text-right">
                  {{ selectedOrder.isInvoice ? 'Store Invoice' : 'Online Store Order' }}
               </div>
               
               <div class="mt-8 pt-8 border-t border-gray-100" *ngIf="!selectedOrder.isInvoice">
              <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Manage Order Status</h4>
              <div class="grid grid-cols-2 gap-2">
                @for (status of orderStatuses; track status) {
                   <button
                      (click)="updateStatus(status)"
                      [disabled]="selectedOrder.orderStatus === status"
                      class="flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg border transition-all disabled:opacity-50"
                      [ngClass]="status === selectedOrder.orderStatus ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'"
                   >
                      {{ status }}
                   </button>
                }
              </div>
            </div>
            </div>
          </div>
        </div>

        <!-- Empty State Content -->
        <div
          *ngIf="!selectedOrder"
          class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8 h-full"
        >
          <h3 class="text-sm font-semibold text-gray-900 mb-1">No order selected</h3>
          <p class="text-xs text-gray-500">Select an order from the list to view its complete details</p>
        </div>
    <!-- Assign Delivery Partner Modal -->
    <div *ngIf="showAssignModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
        <div class="flex justify-between items-center border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <i class="bi bi-truck text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Assign Delivery Partner</h3>
              <p class="text-xs text-gray-400">Select a delivery staff member for order #{{ selectedOrder?.displayId }}</p>
            </div>
          </div>
          <button (click)="showAssignModal = false" class="text-gray-400 hover:text-gray-600 text-lg">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div *ngIf="loadingStaff" class="py-8 text-center text-gray-400 text-xs">
          <i class="bi bi-arrow-repeat animate-spin text-xl block mb-2 text-blue-500"></i>
          Loading delivery staff...
        </div>

        <div *ngIf="!loadingStaff && deliveryStaffList.length === 0" class="py-8 text-center text-gray-400 text-xs">
          <i class="bi bi-person-x text-2xl block mb-2"></i>
          No active staff members found. Please add staff in Staff Management.
        </div>

        <div *ngIf="!loadingStaff && deliveryStaffList.length > 0" class="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Staff Members</label>
          <div *ngFor="let member of deliveryStaffList" 
               (click)="selectedStaffForAssign = member"
               [class.bg-blue-50]="selectedStaffForAssign?.id === member.id"
               [class.border-blue-500]="selectedStaffForAssign?.id === member.id"
               [class.border-gray-200]="selectedStaffForAssign?.id !== member.id"
               class="p-3 rounded-xl border cursor-pointer hover:border-blue-300 transition flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {{ member.fullName ? member.fullName.charAt(0).toUpperCase() : 'S' }}
              </div>
              <div>
                <div class="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {{ member.fullName }}
                  <span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] uppercase font-bold border border-blue-100">
                    {{ member.role }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 font-mono mt-0.5">
                  {{ member.phoneNumber || member.phone || 'No Phone' }}
                </div>
              </div>
            </div>
            <input type="radio" [checked]="selectedStaffForAssign?.id === member.id" class="text-blue-600 focus:ring-blue-500">
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button (click)="showAssignModal = false" class="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold transition">
            Cancel
          </button>
          <button (click)="confirmAssignDelivery()" [disabled]="!selectedStaffForAssign" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
            <i class="bi bi-check2-circle"></i> Confirm Assignment
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Order Modal -->
    <div *ngIf="showRejectModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        <div class="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 class="text-base font-bold text-gray-900">Reject Order</h3>
          <button (click)="showRejectModal = false" class="text-gray-400 hover:text-gray-600 text-lg">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rejection Reason</label>
          <textarea [(ngModel)]="rejectReason" rows="3" class="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-rose-500" placeholder="e.g. Out of stock, item unavailable"></textarea>
        </div>
        <div class="flex gap-3">
          <button (click)="showRejectModal = false" class="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold transition">
            Cancel
          </button>
          <button (click)="confirmShopReject()" [disabled]="!rejectReason.trim()" class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition">
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d1d5db;
      }
    </style>
  `,
})
export class OrderListComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  searchQuery = '';
  selectedOrder: any | null = null;
  currentUser: any = null;

  orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  timeFilterOptions = [
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'This Year', value: 'year' },
  ];
  selectedTimeFilter = '30';

  rejectReason = '';
  showRejectModal = false;
  showAssignModal = false;
  loadingStaff = false;
  selectedStaffForAssign: any = null;
  deliveryStaffList: any[] = [];

  constructor(
    private orderService: OrderService,
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private staffService: StaffService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private printService: PrintService,
    private toastService: ToastService,
    private http: HttpClient
  ) {}

  get filteredOrders(): any[] {
    if (!this.searchQuery.trim()) return this.orders;
    const query = this.searchQuery.toLowerCase();
    return this.orders.filter(
      (order) =>
        order.displayId?.toLowerCase().includes(query) ||
        order.paymentStatus?.toLowerCase().includes(query) ||
        order.orderStatus?.toLowerCase().includes(query),
    );
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.loadOrders();
    });
  }

  loadOrders() {
    this.loading = true;
    if (!this.shopId) return;

    forkJoin({
      orders: this.orderService.getOrdersByShop(this.shopId),
      invoices: this.invoiceService.getInvoicesByShop(this.shopId)
    }).pipe(
      map(({ orders, invoices }) => {
        const normalizedOrders = (orders.data || []).map((o: any) => ({
          ...o,
          isInvoice: false,
          displayId: o.id.slice(-8).toUpperCase(),
          totalAmount: o.totalAmount,
          customerName: o.customerName || (o.shippingAddress && o.shippingAddress.name) || 'Online Customer',
          date: this.toDate(o.createdAt)
        }));

        const normalizedInvoices = (invoices.data || []).map((i: any) => ({
          ...i,
          isInvoice: true,
          displayId: i.invoiceNumber,
          totalAmount: i.total,
          orderStatus: (i.paymentStatus || i.status) === 'paid' ? 'delivered' : 'pending',
          paymentStatus: i.paymentStatus || i.status,
          paymentMethod: i.paymentMethod || 'cash',
          date: this.toDate(i.createdAt || i.invoiceDate || i.date)
        }));

        let combined = [...normalizedOrders, ...normalizedInvoices];

        if (this.currentUser?.role === 'staff') {
          combined = combined.filter(item => 
            !item.isInvoice || item.employeeId === this.currentUser.uid
          );
        }

        return combined.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
      })
    ).subscribe({
      next: (combined) => {
        this.orders = combined;
        this.loading = false;
        if (this.orders.length > 0 && window.innerWidth >= 768) {
          this.selectOrder(this.orders[0]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading combined orders:', err);
        this.error = 'Failed to load orders.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectOrder(order: any) {
    this.selectedOrder = order;
  }

  closeDetail() {
    this.selectedOrder = null;
  }

  updateStatus(status: string) {
    if (!this.selectedOrder || !this.shopId) return;
    this.orderService.updateStatus(this.selectedOrder.id, status).subscribe({
      next: () => {
        this.selectedOrder!.orderStatus = status as any;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to update status:', err),
    });
  }

  openShopAcceptModal(order: any) {
    if (!order) return;
    this.orderService.shopDecision(order.id, 'accept').subscribe({
      next: () => {
        order.orderStatus = 'ready_for_delivery_assignment';
        this.toastService.showSuccess('Order accepted! Ready for delivery assignment.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toastService.showError('Failed to accept order')
    });
  }

  openShopRejectModal(order: any) {
    this.selectedOrder = order;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  confirmShopReject() {
    if (!this.selectedOrder || !this.rejectReason.trim()) return;
    this.orderService.shopDecision(this.selectedOrder.id, 'reject', this.rejectReason).subscribe({
      next: () => {
        this.selectedOrder.orderStatus = 'rejected_by_shop';
        this.showRejectModal = false;
        this.toastService.showSuccess('Order rejected.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toastService.showError('Failed to reject order')
    });
  }

  openAssignDeliveryModal(order: any) {
    this.selectedOrder = order;
    this.showAssignModal = true;
    this.loadingStaff = true;
    this.selectedStaffForAssign = null;
    if (!this.shopId) return;

    this.staffService.getStaff(this.shopId).subscribe({
      next: (res) => {
        const staff = res.data || [];
        const isDeliveryRole = (role: string) => {
          const r = (role || '').toLowerCase();
          return r.includes('delivery') || r.includes('driver') || r.includes('rider') || r.includes('courier') || r.includes('logistics');
        };

        const activeStaff = staff.filter((s: any) => s.status === 'Active' || s.status === 'active' || (s as any).isActive !== false);
        const deliverySpecific = activeStaff.filter((s: any) => isDeliveryRole(s.role));
        
        if (deliverySpecific.length > 0) {
          const others = activeStaff.filter((s: any) => !isDeliveryRole(s.role));
          this.deliveryStaffList = [...deliverySpecific, ...others];
        } else {
          this.deliveryStaffList = activeStaff;
        }

        if (this.deliveryStaffList.length > 0) {
          this.selectedStaffForAssign = this.deliveryStaffList[0];
        }

        this.loadingStaff = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingStaff = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmAssignDelivery() {
    if (!this.selectedOrder || !this.selectedStaffForAssign) return;
    this.orderService.assignDeliveryStaff(
      this.selectedOrder.id,
      this.selectedStaffForAssign.id,
      this.selectedStaffForAssign.fullName,
      this.selectedStaffForAssign.phoneNumber
    ).subscribe({
      next: () => {
        this.selectedOrder.orderStatus = 'waiting_for_delivery_acceptance';
        this.selectedOrder.assignedDeliveryStaffName = this.selectedStaffForAssign?.fullName;
        this.showAssignModal = false;
        this.toastService.showSuccess(`Delivery assigned to ${this.selectedStaffForAssign?.fullName}!`);
        this.cdr.detectChanges();
      },
      error: (err) => this.toastService.showError('Failed to assign delivery partner')
    });
  }

  updatePaymentStatus(status: string) {
    if (!this.selectedOrder || !this.shopId) return;
    this.orderService.updatePaymentStatus(this.selectedOrder.id, status).subscribe({
      next: () => {
        this.selectedOrder!.paymentStatus = status;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to update payment status:', err),
    });
  }

  sendWhatsApp() {
    if (!this.selectedOrder) return;

    const rawPhone = 
      this.selectedOrder.shippingAddress?.phone || 
      this.selectedOrder.customerDetails?.phone || 
      this.selectedOrder.customerPhone ||
      (this.selectedOrder as any).customerPhone;

    const phone = rawPhone?.replace(/\D/g, '');
    if (!phone) {
      this.toastService.showWarning('No phone number available for this customer.');
      return;
    }

    this.toastService.showSuccess('Sending WhatsApp message...');
    
    const isInvoice = this.selectedOrder.isInvoice;
    const endpoint = isInvoice 
      ? `${environment.apiUrl}/invoices/${this.selectedOrder.id}/send-whatsapp`
      : `${environment.apiUrl}/orders/${this.selectedOrder.id}/send-whatsapp`;

    this.http.post<any>(endpoint, {}).subscribe({
      next: () => {
        this.toastService.showSuccess('WhatsApp message sent successfully!');
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to send WhatsApp message. Please check your wallet credits.';
        this.toastService.showError(msg);
      }
    });
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && ('seconds' in value || '_seconds' in value)) {
      return new Date((value.seconds || value._seconds) * 1000);
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  normalizeOrderToInvoice(order: any): Invoice {
    const orderDate = this.toDate(order.createdAt) || new Date();
    const addr = order.shippingAddress || {};
    return {
      id: order.id,
      shopId: order.shopId,
      customerId: order.customerId,
      customerName: addr.name || addr.fullName || order.customerName || 'Online Customer',
      customerPhone: addr.phone || addr.phoneNumber || order.customerPhone || 'N/A',
      customerEmail: addr.email || order.customerEmail || '',
      invoiceNumber: `WEB-${order.id.slice(-8).toUpperCase()}`,
      invoiceDate: orderDate,
      date: orderDate,
      items: (order.products || order.items || []).map((p: any) => ({
        productId: p.productId,
        productName: p.productName || 'Product',
        quantity: p.quantity,
        unitPrice: p.price,
        total: (p.total != null ? p.total : p.price * p.quantity),
        variantDetails: p.variant ? { size: p.variant.size, color: p.variant.color } : undefined
      })),
      subtotal: order.totalAmount,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod || 'online',
      paymentStatus: order.paymentStatus || 'pending',
      orderStatus: order.orderStatus || 'pending',
      paidAmount: order.paymentStatus === 'paid' ? order.totalAmount : 0,
      status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
      createdAt: orderDate,
      updatedAt: this.toDate(order.updatedAt) || new Date(),
      employeeName: 'Website',
      employeeRole: 'Online Store',
      sentVia: [],
      shippingAddress: addr,
      paymentDetails: (order as any).paymentDetails
    } as any;
  }

  printOrder(order: any) {
    if (!order) return;
    const normalized = this.normalizeOrderToInvoice(order);
    this.printService.openPreview(normalized);
  }
}
