import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { WebsiteService } from '../../services/website.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  template: `
    <div class="bg-gray-50/50 min-h-screen pt-12 pb-24">
      <div class="container mx-auto px-4 max-w-6xl animate-fade-in-up">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p class="text-sm text-gray-500 font-semibold">Retrieving tracking details...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <i class="bi bi-exclamation-triangle text-3xl"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Failed to load tracking info</h2>
          <p class="text-sm text-gray-500 mb-6 max-w-md font-medium">{{ error }}</p>
          <a [routerLink]="routePrefix" class="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">Back to Shop</a>
        </div>

        <!-- Main Tracking View -->
        <div *ngIf="!loading && !error" class="animate-fade-in">
          <!-- Header -->
          <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 class="text-3xl font-black text-gray-900 tracking-tight">Order Tracking</h1>
              <p class="text-sm text-gray-500 mt-1 font-medium font-sans">Track your order status in real time</p>
            </div>
            <a [routerLink]="routePrefix" class="self-start sm:self-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-2">
              <i class="bi bi-arrow-left"></i> Continue Shopping
            </a>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <!-- Left Column: Order Details -->
            <div class="lg:col-span-3 space-y-5">
              <!-- Order Summary Card -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
                  <div>
                    <h2 class="text-lg font-black text-gray-900 font-sans">Order #{{ orderId }}</h2>
                    <p class="text-xs text-gray-400 font-medium mt-1">Placed on {{ orderDate | date: 'MMMM d, y' }} at {{ orderDate | date: 'h:mm a' }}</p>
                  </div>
                  <!-- Download Invoice Button -->
                  <button
                    *ngIf="showInvoiceButton"
                    (click)="downloadInvoice()"
                    class="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                  >
                    <i class="bi bi-download"></i> Download Invoice
                  </button>
                </div>

                <!-- Delivery Status Badge -->
                <div class="mt-3 mb-6">
                  <span
                    class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                    [ngClass]="{
                      'bg-green-50 text-green-700': currentStatus === 'Delivered',
                      'bg-blue-50 text-blue-700': currentStatus === 'Shipped' || currentStatus === 'Out for Delivery',
                      'bg-orange-50 text-orange-700': currentStatus === 'Processing' || currentStatus === 'pending',
                      'bg-gray-50 text-gray-700': currentStatus === 'Order Placed'
                    }"
                  >
                    <ng-container *ngIf="currentStatus === 'Delivered'">
                      Delivered on {{ deliveredDate | date: 'MMMM d, y' }} at {{ deliveredDate | date: 'h:mm a' }}
                    </ng-container>
                    <ng-container *ngIf="currentStatus !== 'Delivered'">
                      Status: {{ currentStatus }}
                    </ng-container>
                  </span>
                </div>

                <!-- Product Line Items -->
                <div class="border-t border-gray-100 pt-6 mt-6 space-y-4">
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Items in Order</p>
                  <div *ngFor="let item of orderItems; let i = index" class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        <img [src]="productImages[i] || 'https://placehold.co/100x120?text=No+Image'" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100x120?text=No+Image'" />
                      </div>
                      <div class="text-left">
                        <h4 class="text-xs font-bold text-gray-900 leading-tight">{{ item.productName || 'Product' }}</h4>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1" *ngIf="item.variant">
                          <span *ngIf="item.variant.color">{{ item.variant.color }}</span>
                          <span *ngIf="item.variant.color && item.variant.size"> / </span>
                          <span *ngIf="item.variant.size">{{ item.variant.size }}</span>
                        </p>
                        <p class="text-[10px] text-gray-500 mt-0.5 font-medium">Qty: {{ item.quantity }} • ₹{{ item.price | number }}</p>
                        <!-- Write a Review Button -->
                        <a *ngIf="currentStatus === 'Delivered'" [routerLink]="routePrefix.concat(['products', item.productId])" fragment="reviews" class="inline-block mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">
                          Write a Review
                        </a>
                      </div>
                    </div>
                    <span class="text-xs font-black text-gray-900">₹{{ item.price * item.quantity | number }}</span>
                  </div>
                </div>

                <!-- Items & Total -->
                <div class="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                  <span class="text-xs text-gray-400 font-bold uppercase tracking-widest">{{ itemCount }} Items</span>
                  <span class="text-lg font-black text-gray-900">₹{{ orderTotal | number }}</span>
                </div>
              </div>

              <!-- Shipping Details Card -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Shipping Details</h3>
                <div class="space-y-4">
                  <div class="flex items-start">
                    <span class="text-xs text-gray-400 font-bold uppercase tracking-wider w-40 flex-shrink-0 pt-0.5">Carrier</span>
                    <span class="text-sm font-semibold text-gray-900">{{ carrier }}</span>
                  </div>
                  <div class="flex items-start" *ngIf="trackingNumber && trackingNumber !== 'N/A'">
                    <span class="text-xs text-gray-400 font-bold uppercase tracking-wider w-40 flex-shrink-0 pt-0.5">Tracking Number</span>
                    <span class="text-sm font-semibold text-gray-900 font-mono">{{ trackingNumber }}</span>
                  </div>
                  <div class="flex items-start">
                    <span class="text-xs text-gray-400 font-bold uppercase tracking-wider w-40 flex-shrink-0 pt-0.5">Shipping Address</span>
                    <div class="text-sm font-semibold text-gray-900 leading-relaxed text-left">
                      <span *ngFor="let line of addressLines" class="block">{{ line }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Need Help Card -->
              <a href="mailto:support@clothify.app" class="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-gray-900 transition-colors">
                      <i class="bi bi-headset text-lg"></i>
                    </div>
                    <div class="text-left">
                      <p class="text-sm font-bold text-gray-900">Need Help?</p>
                      <p class="text-xs text-gray-500 mt-0.5">Contact support regarding this order</p>
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-gray-400 group-hover:text-gray-900 transition-colors"></i>
                </div>
              </a>
            </div>

            <!-- Right Column: Timeline -->
            <div class="lg:col-span-2">
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 lg:sticky lg:top-28">
                <div class="relative">
                  <!-- Vertical connector line -->
                  <div class="absolute left-[15px] top-6 bottom-6 w-px bg-gray-200"></div>
                  <!-- Active progress line -->
                  <div
                    class="absolute left-[15px] top-6 w-px bg-green-500 transition-all duration-700 ease-out"
                    [style.height]="progressHeight"
                  ></div>

                  <div class="space-y-8">
                    <div
                      *ngFor="let step of steps; let i = index"
                      class="relative flex items-start gap-4 text-left"
                    >
                      <!-- Step Indicator -->
                      <div class="relative z-10 flex-shrink-0 mt-0.5">
                        <!-- Completed: green circle with checkmark -->
                        <div
                          *ngIf="step.completed"
                          class="w-[30px] h-[30px] rounded-full bg-green-500 flex items-center justify-center shadow-sm"
                        >
                          <i class="bi bi-check text-white text-lg leading-none"></i>
                        </div>
                        <!-- Current (not completed but next): icon circle -->
                        <div
                          *ngIf="!step.completed && i === currentStepIndex + 1"
                          class="w-[30px] h-[30px] rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center animate-pulse"
                        >
                          <i [class]="step.icon + ' text-gray-500 text-xs'"></i>
                        </div>
                        <!-- Future: gray circle with icon -->
                        <div
                          *ngIf="!step.completed && i !== currentStepIndex + 1"
                          class="w-[30px] h-[30px] rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center"
                        >
                          <i [class]="step.icon + ' text-gray-400 text-xs'"></i>
                        </div>
                      </div>

                      <!-- Step Content -->
                      <div class="pt-0.5">
                        <h4
                          class="text-sm font-bold"
                          [ngClass]="{
                            'text-gray-900': step.completed,
                            'text-gray-400': !step.completed
                          }"
                        >
                          {{ step.label }}
                        </h4>
                        <p
                          *ngIf="step.date"
                          class="text-[11px] mt-0.5 font-medium"
                          [ngClass]="{
                            'text-gray-500': step.completed,
                            'text-gray-400': !step.completed
                          }"
                        >
                          {{ step.date | date: 'MMMM d, y' }} at {{ step.date | date: 'h:mm a' }}
                        </p>
                        <p
                          *ngIf="!step.date"
                          class="text-[11px] text-gray-300 mt-0.5 font-medium"
                        >
                          Pending
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Go back to shopping button -->
                <div class="mt-8 pt-6 border-t border-gray-100">
                  <a [routerLink]="routePrefix" class="block w-full py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">
                    Go Back To Store
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class OrderTrackingComponent implements OnInit {
  order: any = null;
  orderId: string = '';
  orderDate = new Date();
  deliveredDate: Date | null = null;
  itemCount = 0;
  orderTotal = 0;
  orderItems: any[] = [];
  productImages: string[] = [];
  loading = true;
  error = '';

  carrier = 'Standard Shipping';
  trackingNumber = 'N/A';
  addressLines: string[] = [];

  get showInvoiceButton(): boolean {
    if (!this.order) return false;
    const paymentMethod = this.order.paymentMethod;
    const paymentStatus = this.order.paymentStatus;
    const orderStatus = this.order.orderStatus;
    
    if (paymentMethod === 'online') {
      return paymentStatus === 'paid';
    } else {
      return orderStatus === 'delivered';
    }
  }

  downloadInvoice() {
    const url = window.location.pathname + '/print';
    window.open(url, '_blank');
  }

  steps = [
    {
      label: 'Order Placed',
      description: 'We have received your order and payment.',
      icon: 'bi bi-bag-check',
      completed: true,
      date: null as Date | null,
    },
    {
      label: 'Processing',
      description: 'Your order is being prepared.',
      icon: 'bi bi-gear',
      completed: false,
      date: null as Date | null,
    },
    {
      label: 'Shipped',
      description: 'Your order has been dispatched.',
      icon: 'bi bi-truck',
      completed: false,
      date: null as Date | null,
    },
    {
      label: 'Out for Delivery',
      description: 'Package is on its way to you.',
      icon: 'bi bi-box-seam',
      completed: false,
      date: null as Date | null,
    },
    {
      label: 'Delivered',
      description: 'Package successfully delivered.',
      icon: 'bi bi-check-circle',
      completed: false,
      date: null as Date | null,
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private websiteService: WebsiteService,
    private tenantService: TenantService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId = id;
      this.loadOrder(id);
    } else {
      this.error = 'No order ID provided in URL';
      this.loading = false;
    }
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  loadOrder(id: string) {
    this.loading = true;
    this.error = '';

    this.orderService.trackOrder(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const order = res.data;
          this.order = order;
          this.orderTotal = order.totalAmount;
          this.orderItems = order.products || [];
          this.itemCount = this.orderItems.reduce((acc, item) => acc + item.quantity, 0);
          
          this.orderDate = this.parseDate(order.createdAt) || new Date();
          
          // Shipping address
          const addr = order.shippingAddress || {};
          this.addressLines = [
            addr.name || '',
            addr.street || '',
            `${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`,
            addr.country || 'India'
          ].filter(line => line.trim().length > 0);

          this.carrier = order.carrier || order.shippingDetails?.carrier || 'Standard Shipping';
          this.trackingNumber = order.trackingNumber || order.shippingDetails?.trackingNumber || 'N/A';

          this.updateTimeline(order);
          this.fetchProductImages(this.orderItems);
        } else {
          this.error = res.message || 'Order details not found';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching order tracking info:', err);
        this.error = 'Order not found. Please verify the URL or contact support.';
        this.loading = false;
      }
    });
  }

  private parseDate(val: any): Date | null {
    if (!val) return null;
    if (val.seconds) return new Date(val.seconds * 1000);
    if (val._seconds) return new Date(val._seconds * 1000);
    return new Date(val);
  }

  private updateTimeline(order: any) {
    const status = order.orderStatus || 'pending';
    const createdAt = this.parseDate(order.createdAt);
    const updatedAt = this.parseDate(order.updatedAt);

    this.steps[0].completed = true;
    this.steps[0].date = createdAt;

    this.steps[1].completed = ['confirmed', 'shipped', 'delivered'].includes(status);
    this.steps[1].date = this.steps[1].completed ? updatedAt : null;

    this.steps[2].completed = ['shipped', 'delivered'].includes(status);
    this.steps[2].date = this.steps[2].completed ? updatedAt : null;

    this.steps[3].completed = status === 'delivered';
    this.steps[3].date = this.steps[3].completed ? updatedAt : null;

    this.steps[4].completed = status === 'delivered';
    this.steps[4].date = this.steps[4].completed ? updatedAt : null;

    if (status === 'delivered') {
      this.deliveredDate = updatedAt;
    }
  }

  private fetchProductImages(items: any[]) {
    if (items.length === 0) {
      this.loading = false;
      return;
    }

    const requests = items.map(item =>
      this.websiteService.getProduct(item.productId).pipe(
        map(product => product.images?.[0] || '/Cloth_placeholder.png'),
        catchError(() => of('/Cloth_placeholder.png'))
      )
    );

    forkJoin(requests).subscribe({
      next: (images) => {
        this.productImages = images;
        this.loading = false;
      },
      error: () => {
        this.productImages = items.map(() => '/Cloth_placeholder.png');
        this.loading = false;
      }
    });
  }

  get currentStatus(): string {
    for (let i = this.steps.length - 1; i >= 0; i--) {
      if (this.steps[i].completed) {
        return this.steps[i].label;
      }
    }
    return 'Order Placed';
  }

  get currentStepIndex(): number {
    let lastCompletedIndex = -1;
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i].completed) {
        lastCompletedIndex = i;
      } else {
        break;
      }
    }
    return lastCompletedIndex;
  }

  get progressHeight(): string {
    const completedCount = this.steps.filter((s) => s.completed).length;
    if (completedCount <= 1) return '0%';
    return (completedCount - 1) * 25 + '%';
  }
}
