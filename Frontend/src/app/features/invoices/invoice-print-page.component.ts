import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { OrderService } from '../../core/services/order.service';
import { Invoice } from '../../core/models/invoice.model';
import { InvoicePrintComponent } from '../../shared/components/invoice-print.component';
import { ShopService } from '../../core/services/shop.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { switchMap, map, catchError, first, of, filter } from 'rxjs';

@Component({
  selector: 'app-invoice-print-page',
  standalone: true,
  imports: [CommonModule, InvoicePrintComponent],
  template: `
    <div *ngIf="invoice">
      <app-invoice-print [invoice]="invoice" [shop]="shop"></app-invoice-print>
    </div>
    <div *ngIf="loading" class="flex flex-col justify-center items-center h-screen gap-4">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-500 font-medium">Loading invoice data...</p>
    </div>
    <div *ngIf="error" class="flex justify-center items-center h-screen text-red-600 bg-red-50 p-6">
      <div class="text-center">
        <i class="bi bi-exclamation-triangle-fill text-4xl mb-4 block"></i>
        <p class="text-lg font-bold">{{ error }}</p>
        <button (click)="window.close()" class="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg">Close Window</button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: white;
        min-height: 100vh;
      }
    `,
  ],
})
export class InvoicePrintPageComponent implements OnInit {
  invoice: Invoice | null = null;
  shop: any | null = null;
  loading = true;
  error: string | null = null;
  window = window;

  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private orderService = inject(OrderService);
  private shopService = inject(ShopService);
  private shopContext = inject(ShopContextService);
  
  ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId') || this.route.snapshot.paramMap.get('id');
    let shopId: string | null = this.route.snapshot.paramMap.get('shopId');
    
    // Check parent route if shopId not found (common in nested routing)
    if (!shopId) {
      shopId = this.route.parent?.snapshot.paramMap.get('shopId') || null;
    }

    const startProcessing = (finalShopId: string) => {
      if (!invoiceId) {
        this.error = 'Invalid invoice or order ID.';
        this.loading = false;
        return;
      }

      const fetchObs = this.invoiceService.getPublicInvoice(invoiceId).pipe(
        catchError(() => {
          // Fallback to checking if it's an order (website invoice)
          return this.orderService.getOrder(invoiceId).pipe(
            catchError(() => {
              // Guest checkout tracking print fallback
              return this.orderService.trackOrder(invoiceId);
            }),
            map((res) => {
              const o = res.data as any;
              const orderDate = o.createdAt?._seconds 
                ? new Date(o.createdAt._seconds * 1000) 
                : o.createdAt ? new Date(o.createdAt) : new Date();
              return {
                success: true,
                data: {
                  id: o.id,
                  shopId: o.shopId,
                  customerId: o.customerId,
                  customerName: o.customerName || o.shippingAddress?.name || 'Online Customer',
                  customerPhone: o.customerPhone || o.shippingAddress?.phone || 'N/A',
                  invoiceNumber: `INV-${o.id.slice(-8).toUpperCase()}`,
                  invoiceDate: orderDate,
                  date: orderDate,
                  items: (o.products || []).map((p: any) => ({
                    productId: p.productId,
                    productName: p.productName || 'Product',
                    quantity: p.quantity,
                    unitPrice: p.price,
                    total: p.price * p.quantity,
                    variantDetails: p.variant ? {
                      size: p.variant.size,
                      color: p.variant.color
                    } : undefined
                  })),
                  subtotal: o.totalAmount,
                  taxRate: 0,
                  taxAmount: 0,
                  discount: 0,
                  total: o.totalAmount,
                  paymentMethod: o.paymentMethod || 'online',
                  paymentStatus: o.paymentStatus || 'pending',
                  paidAmount: o.paymentStatus === 'paid' ? o.totalAmount : 0,
                  status: o.paymentStatus === 'paid' ? 'paid' : 'sent',
                  createdAt: orderDate,
                  updatedAt: o.updatedAt?._seconds 
                    ? new Date(o.updatedAt._seconds * 1000) 
                    : o.updatedAt ? new Date(o.updatedAt) : new Date(),
                  employeeName: 'Website',
                  employeeRole: 'Online Store',
                  sentVia: [],
                  paymentDetails: o.paymentDetails || null,
                  paymentProof: o.paymentProof || o.proofOfPayment || o.paymentScreenshot || null,
                  upiTransactionId: o.upiTransactionId || null
                }
              };
            })
          );
        })
      );

      fetchObs
        .pipe(
          switchMap((invoiceRes: any) => {
            const rawInv = invoiceRes.data;
            this.invoice = {
              ...rawInv,
              invoiceDate: rawInv?.invoiceDate?._seconds 
                ? new Date(rawInv.invoiceDate._seconds * 1000) 
                : new Date(rawInv?.invoiceDate)
            };
            // Fetch shop details. Catch error for guest users and load from shopContext instead.
            return this.shopService.getPublicShop(finalShopId).pipe(
              map(res => res.data),
              catchError(() => {
                return this.shopContext.shopConfig$.pipe(
                  filter((config) => !!config),
                  first()
                );
              })
            );
          }),
        )
        .subscribe({
          next: (shopData) => {
            this.shop = shopData;
            this.loading = false;
            
            // Wait for DOM to update and images (like logo) to potentially load
            setTimeout(() => {
              window.print();
            }, 1000);
          },
          error: (err) => {
            console.error('Error loading print data:', err);
            this.error = 'Failed to load invoice or shop details.';
            this.loading = false;
          },
        });
    };

    if (shopId) {
      startProcessing(shopId);
    } else {
      // Fallback for public website: resolve shopId from the subdomain shop context
      this.shopContext.shopConfig$.pipe(
        filter((config) => !!config),
        first()
      ).subscribe({
        next: (config) => {
          if (config?.id) {
            startProcessing(config.id);
          } else {
            this.error = 'Could not resolve shop details.';
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Failed to load shop configuration context:', err);
          this.error = 'Could not resolve shop details.';
          this.loading = false;
        }
      });
    }
  }
}
