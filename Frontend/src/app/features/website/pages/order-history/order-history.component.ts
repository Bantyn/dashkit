import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../../../core/services/tenant.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="bg-gray-50/50 min-h-screen pt-12 pb-24">
      <div class="container mx-auto px-4 max-w-6xl animate-fade-in-up">
        <h1 class="text-4xl font-black text-gray-900 mb-2 tracking-tight">Order History</h1>
        <p class="text-gray-500 mb-10 font-medium font-sans">
          View and manage your recent purchases and their current statuses.
        </p>

        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="bg-gray-50/50">
                <tr>
                  <th
                    scope="col"
                    class="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Order Ref
                  </th>
                  <th
                    scope="col"
                    class="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    class="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-50">
                <tr
                  *ngFor="let order of orders$ | async"
                  class="hover:bg-gray-50/80 transition-colors group"
                >
                  <td class="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-900">
                    <span class="text-gray-400">#</span>{{ order.id | slice: 0 : 8 }}
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-sm font-medium text-gray-500">
                    {{ order.createdAt | date: 'mediumDate' }}
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap">
                    <span
                      class="px-4 py-1.5 inline-flex text-xs font-bold tracking-widest uppercase rounded-full border"
                      [ngClass]="{
                        'bg-green-50 text-green-700 border-green-200':
                          order.orderStatus === 'delivered',
                        'bg-amber-50 text-amber-700 border-amber-200':
                          order.orderStatus === 'pending' || order.orderStatus === 'confirmed',
                        'bg-blue-50 text-blue-700 border-blue-200': order.orderStatus === 'shipped',
                        'bg-red-50 text-red-700 border-red-200': order.orderStatus === 'cancelled',
                      }"
                    >
                      <i
                        class="bi bi-circle-fill text-[8px] mr-1.5 mt-0.5"
                        [ngClass]="{
                          'text-green-500': order.orderStatus === 'delivered',
                          'text-amber-500':
                            order.orderStatus === 'pending' || order.orderStatus === 'confirmed',
                          'text-blue-500': order.orderStatus === 'shipped',
                          'text-red-500': order.orderStatus === 'cancelled',
                        }"
                      ></i>
                      {{ order.orderStatus }}
                    </span>
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-sm font-black text-gray-900">
                    {{ order.totalAmount | currency: 'INR' }}
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-sm font-bold text-right space-x-4">
                    <a
                      [routerLink]="routePrefix.concat(['orders', order.id])"
                      class="text-gray-400 hover:text-primary-600 transition-colors"
                      >View Details</a
                    >
                    <a
                      [routerLink]="routePrefix.concat(['track', order.id])"
                      class="text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-4 py-2 rounded-lg"
                      >Track Order</a
                    >
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="(orders$ | async)?.length === 0" class="text-center py-24 bg-white">
              <div
                class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100"
              >
                <i class="bi bi-box-seam text-3xl text-gray-300"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
              <p class="text-gray-500 mb-8 max-w-sm mx-auto">
                Looks like you haven't made any purchases yet. Start exploring our collections.
              </p>
              <a
                [routerLink]="routePrefix.concat(['products'])"
                class="inline-block bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-black transition-all shadow-md"
              >
                Start Shopping
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OrderHistoryComponent implements OnInit {
  orders$: Observable<any[]>;

  constructor(private tenantService: TenantService) {
    // Mock data for now
    this.orders$ = of([
      {
        id: '12345678-abcd-9012',
        createdAt: new Date(),
        orderStatus: 'pending',
        totalAmount: 1499,
      },
      {
        id: '87654321-zyxw-9876',
        createdAt: new Date(Date.now() - 86400000 * 2),
        orderStatus: 'delivered',
        totalAmount: 2999,
      },
    ]);
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    // Call OrderService to get actual orders
  }
}
