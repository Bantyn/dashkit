import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-website-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-3xl">
        <h1 class="text-3xl font-black text-gray-900 mb-8 tracking-tight">Track Your Order</h1>

        <div *ngIf="loading" class="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
          <p class="text-sm font-semibold">Loading live order timeline...</p>
        </div>

        <div *ngIf="error" class="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 text-center font-semibold text-sm">
          {{ error }}
        </div>

        <div *ngIf="order && !loading" class="space-y-6">
          <!-- Summary Header -->
          <div class="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div>
              <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">Live Order Status</span>
              <h2 class="text-xl font-bold text-gray-900">Order #{{ order.id ? order.id.slice(-8).toUpperCase() : 'N/A' }}</h2>
              <p class="text-xs text-gray-500 mt-1">Placed on: {{ order.createdAt | date:'mediumDate' }}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-black text-gray-900">₹{{ order.totalAmount | number }}</div>
              <span class="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase mt-1">
                {{ order.orderStatus || 'Pending' }}
              </span>
            </div>
          </div>

          <!-- Step Timeline -->
          <div class="bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
            <h3 class="font-bold text-gray-900 text-base mb-6 border-b border-gray-100 pb-3">Delivery Progress Timeline</h3>

            <div class="relative pl-6 border-l-2 border-indigo-100 space-y-8">
              <div *ngFor="let step of timelineSteps" class="relative">
                <div
                  class="absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 bg-white"
                  [ngClass]="step.completed ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'"
                ></div>
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="text-sm font-bold" [ngClass]="step.completed ? 'text-gray-900' : 'text-gray-400'">{{ step.title }}</h4>
                    <p class="text-xs text-gray-500 mt-0.5">{{ step.description }}</p>
                  </div>
                  <span *ngIf="step.timestamp" class="text-[10px] font-semibold text-gray-400">
                    {{ step.timestamp | date:'shortTime' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Partner Details (if assigned) -->
          <div *ngIf="order.assignedDeliveryStaffName" class="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xl uppercase shadow-sm">
                {{ order.assignedDeliveryStaffName.charAt(0) }}
              </div>
              <div>
                <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">Assigned Delivery Partner</span>
                <div class="text-base font-bold text-gray-900">{{ order.assignedDeliveryStaffName }}</div>
              </div>
            </div>
            <a *ngIf="order.assignedDeliveryStaffPhone" [href]="'tel:' + order.assignedDeliveryStaffPhone" class="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition">
              Call Driver
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WebsiteOrderTrackingComponent implements OnInit {
  orderId = '';
  order: any = null;
  loading = true;
  error = '';

  allSteps = [
    { key: 'pending_shop_confirmation', title: 'Order Placed', description: 'Your order has been received by shop' },
    { key: 'ready_for_delivery_assignment', title: 'Shop Accepted', description: 'Order confirmed and ready for dispatch' },
    { key: 'waiting_for_delivery_acceptance', title: 'Delivery Partner Assigned', description: 'Assigned to nearest delivery staff' },
    { key: 'delivery_accepted', title: 'Delivery Accepted', description: 'Delivery partner accepted assignment' },
    { key: 'reached_store', title: 'Reached Store', description: 'Delivery partner at shop pickup' },
    { key: 'picked_up', title: 'Picked Up', description: 'Package collected from shop' },
    { key: 'out_for_delivery', title: 'Out For Delivery', description: 'On the way to your shipping address' },
    { key: 'reached_customer', title: 'Arrived at Destination', description: 'Delivery partner outside location' },
    { key: 'delivered', title: 'Delivered', description: 'Package successfully delivered' }
  ];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId = params['id'];
      if (this.orderId) this.fetchOrder();
    });
  }

  fetchOrder() {
    this.loading = true;
    this.http.get<any>(`${environment.publicApiUrl}/orders/track/${this.orderId}`).subscribe({
      next: (res) => {
        this.order = res.data || res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Order not found or error loading timeline';
        this.loading = false;
      }
    });
  }

  get timelineSteps() {
    if (!this.order) return [];
    const currentStatus = this.order.orderStatus || 'pending';
    const statusOrder = this.allSteps.map(s => s.key);
    const currentIndex = statusOrder.indexOf(currentStatus);

    return this.allSteps.map((step, idx) => {
      const isCompleted = idx <= (currentIndex >= 0 ? currentIndex : 0);
      const timelineEvent = (this.order.deliveryTimeline || []).find((t: any) => t.status === step.key);
      return {
        ...step,
        completed: isCompleted,
        timestamp: timelineEvent ? timelineEvent.timestamp : (idx === 0 ? this.order.createdAt : null)
      };
    });
  }
}
