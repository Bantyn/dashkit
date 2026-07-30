import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice, InvoiceItem } from '../../core/models/invoice.model';
import { ShopService } from '../../core/services/shop.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentQrService, PaymentQrResult } from '../../core/services/payment-qr.service';
import { map, of, switchMap, BehaviorSubject, combineLatest, catchError } from 'rxjs';

@Component({
  selector: 'app-invoice-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-container bg-white text-black font-sans min-h-[285mm] flex flex-col justify-between w-full">
      <div *ngIf="shop$ | async as shop; else loadingShop" class="flex-1 flex flex-col justify-between w-full">
        
        <!-- 1. DEFAULT TEMPLATE (Traditional / Spiritual Layout - Full Width) -->
        <ng-container *ngIf="!shop.invoiceConfig || shop.invoiceConfig?.templateType !== 'custom'">
          <div class="w-full flex-1 flex flex-col justify-between min-h-[280mm]">
            <!-- Top Section (Header + Bill Info) -->
            <div class="w-full">
              <!-- Spiritual Header -->
              <div class="text-center text-xs font-bold mb-2">|| Shree Ganeshay Namah ||</div>

              <!-- Header Section -->
              <div class="border border-black p-2 mb-2 w-full">
                <div class="flex justify-between items-start w-full">
                  <!-- Shop Info (Left) -->
                  <div class="w-1/3 text-xs">
                    <div class="font-bold">{{ shop.displayName || 'Proprietor' }}</div>
                    <div>{{ shop.phone }}</div>
                    <div class="whitespace-pre-wrap">{{ shop.address }}</div>
                    <div *ngIf="shop.gstNumber">GST: {{ shop.gstNumber }}</div>
                  </div>

                  <!-- Brand (Center) -->
                  <div class="w-1/3 text-center">
                    <h1 class="text-3xl font-bold uppercase tracking-wide">{{ shop.shopName }}</h1>
                    <p class="text-[10px] mt-1">{{ shop.description || 'Exclusive Collection' }}</p>
                  </div>

                  <!-- Logo / Extra (Right) -->
                  <div class="w-1/3 text-right text-xs flex flex-col items-end">
                    <div
                      *ngIf="shop.invoiceConfig?.showLogo !== false"
                      class="w-14 h-14 border border-black rounded p-0.5 mb-1 bg-white flex items-center justify-center overflow-hidden"
                    >
                      <img *ngIf="shop.logo || shop.theme?.logo" [src]="shop.logo || shop.theme?.logo" alt="Logo" class="w-full h-full object-contain" />
                      <span *ngIf="!shop.logo && !shop.theme?.logo" class="text-[9px] font-bold text-gray-400">LOGO</span>
                    </div>
                    <div *ngIf="shop.socialLinks?.instagram">
                      <i class="bi bi-instagram"></i> {{ shop.socialLinks!.instagram }}
                    </div>
                    <div>{{ shop.email }}</div>
                  </div>
                </div>
              </div>

              <!-- Bill & Customer Info -->
              <div class="border border-black p-2 mb-2 flex justify-between text-xs w-full">
                <!-- Customer Info -->
                <div class="w-1/2 border-r border-black pr-2">
                  <div class="flex">
                    <span class="w-20 font-bold">M/s. Name:</span>
                    <span class="font-bold border-b border-black border-dotted flex-1">{{
                      invoice.customerName || 'Walk-in'
                    }}</span>
                  </div>
                  <div class="flex mt-1">
                    <span class="w-20 font-bold">Mobile:</span>
                    <span>{{ invoice.customerPhone }}</span>
                  </div>
                  <div class="flex mt-1" *ngIf="invoice.customerGst">
                    <span class="w-20 font-bold">GST No:</span>
                    <span>{{ invoice.customerGst }}</span>
                  </div>
                </div>

                <!-- Bill Details -->
                <div class="w-1/2 pl-2">
                  <div class="flex">
                    <span class="w-24 font-bold">Bill No:</span>
                    <span class="font-bold text-lg leading-none">{{ invoice.invoiceNumber }}</span>
                  </div>
                  <div class="flex mt-1">
                    <span class="w-24 font-bold">Date:</span>
                    <span>{{ invoice.invoiceDate | date: 'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="flex mt-1">
                    <span class="w-24 font-bold">Time:</span>
                    <span>{{ invoice.invoiceDate | date: 'shortTime' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Middle Section: Full-Height Stretched Table Grid -->
            <div class="flex-1 flex flex-col border border-black mb-2 min-h-[140mm] w-full">
              <table class="w-full border-collapse text-xs flex-1">
                <thead>
                  <tr class="border-b border-black">
                    <th class="border-r border-black w-10 py-1.5 px-1 text-center">Sr.</th>
                    <th class="border-r border-black py-1.5 px-2 text-left">Particulars</th>
                    <th class="border-r border-black w-24 py-1.5 px-1 text-left">Variant</th>
                    <th class="border-r border-black w-14 py-1.5 px-1 text-right">Qty</th>
                    <th class="border-r border-black w-16 py-1.5 px-1 text-right">Rate</th>
                    <th class="border-r border-black w-14 py-1.5 px-1 text-right">Dis.</th>
                    <th class="w-20 py-1.5 px-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="h-full">
                  <tr *ngFor="let item of invoice.items; let i = index" class="border-b border-gray-300">
                    <td class="border-r border-black py-1.5 px-1 text-center align-top">{{ i + 1 }}</td>
                    <td class="border-r border-black py-1.5 px-2 align-top">
                      <div class="font-bold">{{ item.productName }}</div>
                      <div class="text-[10px] text-gray-600" *ngIf="item.variantSku">
                        {{ item.variantSku }}
                      </div>
                    </td>
                    <td class="border-r border-black py-1.5 px-1 align-top text-[10px]">
                      <div *ngIf="item.variantDetails?.size">Size: {{ item.variantDetails?.size }}</div>
                      <div *ngIf="item.variantDetails?.color">Color: {{ item.variantDetails?.color }}</div>
                    </td>
                    <td class="border-r border-black py-1.5 px-1 text-right align-top">
                      {{ item.quantity }}
                    </td>
                    <td class="border-r border-black py-1.5 px-1 text-right align-top">
                      {{ item.unitPrice | number: '1.0-2' }}
                    </td>
                    <td class="border-r border-black py-1.5 px-1 text-right align-top">
                      {{ item.discount | number: '1.0-0' }}
                    </td>
                    <td class="py-1.5 px-1 text-right align-top font-bold">
                      {{ item.total | number: '1.2-2' }}
                    </td>
                  </tr>
                  <!-- Empty Spacer Row to extend vertical borders down to summary -->
                  <tr class="h-full">
                    <td class="border-r border-black"></td>
                    <td class="border-r border-black"></td>
                    <td class="border-r border-black"></td>
                    <td class="border-r border-black"></td>
                    <td class="border-r border-black"></td>
                    <td class="border-r border-black"></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Bottom Section: Summary & Fixed Full Width Footer -->
            <div class="mt-auto w-full">
              <!-- Summary Section -->
              <div class="border border-black p-2 mb-2 w-full">
                <div class="flex justify-between w-full">
                  <!-- Payment Details (Left) -->
                  <div class="w-1/2 pr-4 border-r border-black border-dotted text-left flex justify-between items-start">
                    <div class="flex-1">
                      <div class="font-bold underline mb-1">Payment Details:</div>
                      <div class="flex text-[10px] mt-1">
                        <span class="w-20 font-bold">Status:</span>
                        <span class="capitalize font-bold" [class.text-green-600]="invoice.paymentStatus === 'paid'" [class.text-amber-600]="invoice.paymentStatus === 'partial'">
                          {{ invoice.paymentStatus || 'Pending' }}
                        </span>
                      </div>
                      <div class="flex text-[10px] mt-0.5" *ngIf="invoice.paymentMethod">
                        <span class="w-20 font-bold">Method:</span>
                        <span class="capitalize">{{ invoice.paymentMethod }}</span>
                      </div>
                      <div class="flex text-[10px] mt-0.5" *ngIf="invoice.paidAmount !== undefined">
                        <span class="w-20 font-bold">Paid:</span>
                        <span>₹{{ invoice.paidAmount | number: '1.2-2' }}</span>
                      </div>
                      
                      <ng-container *ngIf="invoice.paymentDetails">
                        <div class="flex text-[9px] mt-1 text-gray-700" *ngIf="invoice.paymentDetails.razorpayPaymentId">
                          <span class="w-20 font-semibold">Payment ID:</span>
                          <span class="font-mono">{{ invoice.paymentDetails.razorpayPaymentId }}</span>
                        </div>
                        <div class="flex text-[9px] mt-0.5 text-gray-700" *ngIf="invoice.paymentDetails.razorpayOrderId">
                          <span class="w-20 font-semibold">Order ID:</span>
                          <span class="font-mono">{{ invoice.paymentDetails.razorpayOrderId }}</span>
                        </div>
                      </ng-container>
                      <div class="flex text-[9px] mt-1 text-gray-700" *ngIf="invoice.upiTransactionId">
                        <span class="w-20 font-semibold">UPI Ref No:</span>
                        <span class="font-mono">{{ invoice.upiTransactionId }}</span>
                      </div>
                    </div>

                    <!-- Dynamic Payment QR Code -->
                    <ng-container *ngIf="getQrDetails(shop, invoice.total) as qr">
                      <div *ngIf="qr.available" class="shrink-0 ml-2 text-center">
                        <div class="border border-black p-1 bg-white inline-block shadow-sm">
                          <img [src]="qr.qrDataUrl" class="w-16 h-16 object-contain" [alt]="qr.paymentDestination" />
                        </div>
                        <div class="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">Pay via {{ qr.sourceType }}</div>
                      </div>
                    </ng-container>
                  </div>

                  <!-- Totals (Right) -->
                  <div class="w-1/2 pl-4">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="font-bold">Total Qty:</span>
                      <span>{{ getTotalQty() }}</span>
                    </div>
                    <div class="flex justify-between text-xs mb-1 border-b border-dotted border-gray-400">
                      <span>Total Amount:</span>
                      <span>₹{{ invoice.subtotal | number: '1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between text-xs mb-1" *ngIf="shop.invoiceConfig?.showGstBreakdown !== false && invoice.taxAmount > 0">
                      <span>CGST / SGST:</span>
                      <span>₹{{ invoice.taxAmount | number: '1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between text-xs mb-1" *ngIf="invoice.discount > 0">
                      <span>Extra Discount:</span>
                      <span>-₹{{ invoice.discount | number: '1.2-2' }}</span>
                    </div>

                    <div class="flex justify-between items-center text-sm border border-black p-1 mt-2">
                      <span class="font-bold uppercase">Net Amount</span>
                      <span class="font-bold text-xl">₹{{ invoice.total | number: '1.2-2' }}</span>
                    </div>
                    <div class="text-[10px] text-right mt-1 italic">(E & O.E.)</div>
                  </div>
                </div>
              </div>

              <!-- Fixed Page Footer (Full Width Borders) -->
              <div class="border border-black p-2 flex justify-between items-end min-h-[100px] w-full">
                <div class="text-[10px] flex-1 pr-4">
                  <ng-container *ngIf="shop.invoiceConfig?.showTermsAndConditions !== false">
                    <div class="font-bold mb-1 underline">Terms & Conditions:</div>
                    <div class="whitespace-pre-line leading-relaxed">
                      {{ shop.invoiceConfig?.termsText || '1. Goods once sold will be replaced but not taken back.\n2. Warranty as per manufacturer norms.\n3. Subject to jurisdiction of New Delhi Courts.' }}
                    </div>
                  </ng-container>
                  <div class="mt-4 font-bold text-center border-t border-black pt-1 w-full">
                    {{ shop.invoiceConfig?.footerText || 'THANK YOU FOR SHOPPING WITH US!' }}
                  </div>
                </div>

                <div *ngIf="shop.invoiceConfig?.showSignatureLine !== false" class="text-center w-1/3 shrink-0">
                  <div class="h-12"></div>
                  <div class="font-bold border-t border-black pt-1">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- 2. CUSTOM TEMPLATE (Modern Clean Card Layout) -->
        <ng-container *ngIf="shop.invoiceConfig?.templateType === 'custom'">
          <div class="p-8 max-w-[210mm] w-full mx-auto rounded-3xl border border-gray-200 shadow-sm font-sans bg-white min-h-[280mm] flex flex-col justify-between">
            <div class="w-full">
              <!-- Top Header -->
              <div class="flex justify-between items-start w-full">
                <div>
                  <h3
                    class="text-xl font-bold uppercase tracking-wider"
                    [style.color]="shop.invoiceConfig?.accentColor || '#0f172a'"
                  >
                    TAX INVOICE
                  </h3>
                  <p class="text-sm font-medium text-gray-500 mt-1">
                    {{ shop.displayName || shop.shopName || 'Shop Name' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ shop.address || '123 Retail Market, City, State' }}
                  </p>
                  <p *ngIf="shop.gstNumber" class="text-xs font-mono text-gray-500 mt-0.5">
                    GSTIN: {{ shop.gstNumber }}
                  </p>
                </div>

                <div class="text-right flex flex-col items-end">
                  <div
                    *ngIf="shop.invoiceConfig?.showLogo !== false"
                    class="w-16 h-16 bg-slate-100/80 rounded-2xl mb-3 flex items-center justify-center text-slate-400 font-bold text-xs overflow-hidden"
                  >
                    <img *ngIf="shop.logo || shop.theme?.logo" [src]="shop.logo || shop.theme?.logo" alt="Logo" class="w-full h-full object-cover" />
                    <span *ngIf="!shop.logo && !shop.theme?.logo">LOGO</span>
                  </div>
                  <p class="font-bold text-sm text-gray-900">
                    {{ invoice.invoiceNumber }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    Date: {{ (invoice.invoiceDate | date: 'dd MMM yyyy') || '24 Oct 2024' }}
                  </p>
                </div>
              </div>

              <!-- Divider Line -->
              <div
                class="my-6 border-b w-full"
                [style.border-color]="shop.invoiceConfig?.accentColor || '#0f172a'"
              ></div>

              <!-- Billed To & Payment Details -->
              <div class="grid grid-cols-2 gap-4 text-xs mb-8 w-full">
                <div>
                  <p class="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-1">BILLED TO:</p>
                  <p class="font-bold text-sm text-gray-900">{{ invoice.customerName || 'Walk-in Customer' }}</p>
                  <p *ngIf="invoice.customerEmail" class="text-gray-400 mt-0.5">{{ invoice.customerEmail }}</p>
                  <p *ngIf="invoice.customerPhone" class="text-gray-400 mt-0.5">{{ invoice.customerPhone }}</p>
                  <p *ngIf="invoice.customerGst" class="text-gray-400 font-mono mt-0.5">GSTIN: {{ invoice.customerGst }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-1">PAYMENT DETAILS:</p>
                  <p class="text-gray-400">Method: <span class="text-gray-700 capitalize">{{ invoice.paymentMethod || 'Online UPI / Card' }}</span></p>
                  <p class="text-gray-400 mt-0.5">
                    Status: 
                    <span
                      class="font-bold uppercase tracking-wide"
                      [class.text-emerald-600]="invoice.paymentStatus === 'paid'"
                      [class.text-amber-600]="invoice.paymentStatus !== 'paid'"
                    >
                      {{ invoice.paymentStatus || 'PAID' }}
                    </span>
                  </p>
                  <p *ngIf="invoice.upiTransactionId" class="text-gray-400 font-mono mt-0.5">UPI Ref: {{ invoice.upiTransactionId }}</p>
                </div>
              </div>

              <!-- Line Items Table -->
              <div class="my-8 min-h-[100mm] w-full">
                <table class="w-full text-xs text-left">
                  <thead>
                    <tr class="border-b border-gray-200/80 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <th class="py-3 font-bold">ITEM</th>
                      <th class="py-3 text-right font-bold w-20">QTY</th>
                      <th class="py-3 text-right font-bold w-28">PRICE</th>
                      <th class="py-3 text-right font-bold w-28">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 text-sm">
                    <tr *ngFor="let item of invoice.items" class="hover:bg-gray-50/50 transition-colors">
                      <td class="py-3.5 font-medium text-gray-900">
                        <div>{{ item.productName }}</div>
                        <div *ngIf="item.variantDetails?.size || item.variantDetails?.color" class="text-xs text-gray-400 mt-0.5">
                          <span *ngIf="item.variantDetails?.size">Size: {{ item.variantDetails.size }}</span>
                          <span *ngIf="item.variantDetails?.color" class="ml-2">Color: {{ item.variantDetails.color }}</span>
                        </div>
                      </td>
                      <td class="py-3.5 text-right text-gray-700 tabular-nums">{{ item.quantity }}</td>
                      <td class="py-3.5 text-right text-gray-700 tabular-nums">₹{{ item.unitPrice | number: '1.0-2' }}</td>
                      <td class="py-3.5 text-right font-bold text-gray-900 tabular-nums">₹{{ item.total | number: '1.0-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom Section (Totals + Footer) -->
            <div class="mt-auto w-full">
              <!-- Totals & Payment QR Section -->
              <div class="mt-8 flex justify-between items-end w-full">
                <div class="w-1/2">
                  <!-- Dynamic Payment QR Box -->
                  <ng-container *ngIf="getQrDetails(shop, invoice.total) as qr">
                    <div
                      *ngIf="qr.available"
                      class="w-28 bg-white border border-gray-200/80 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm"
                    >
                      <img
                        [src]="qr.qrDataUrl"
                        [alt]="qr.paymentDestination"
                        class="w-20 h-20 object-contain rounded"
                      />
                      <p class="text-[9px] font-bold text-gray-500 mt-1.5 uppercase tracking-wider">
                        PAY VIA {{ qr.sourceType }}
                      </p>
                    </div>
                  </ng-container>
                </div>

                <div class="w-1/3 space-y-2">
                  <div class="flex justify-between text-xs text-gray-400">
                    <span>Subtotal:</span>
                    <span class="tabular-nums text-gray-700">₹{{ invoice.subtotal | number: '1.0-2' }}</span>
                  </div>
                  <div
                    *ngIf="shop.invoiceConfig?.showGstBreakdown !== false && invoice.taxAmount > 0"
                    class="flex justify-between text-xs text-gray-400"
                  >
                    <span>GST (18%):</span>
                    <span class="tabular-nums text-gray-700">₹{{ invoice.taxAmount | number: '1.0-2' }}</span>
                  </div>
                  <div *ngIf="invoice.discount > 0" class="flex justify-between text-xs text-gray-400 italic">
                    <span>Discount:</span>
                    <span class="tabular-nums text-gray-700">-₹{{ invoice.discount | number: '1.0-2' }}</span>
                  </div>
                  <div
                    class="flex justify-between font-bold text-base pt-2.5 border-t border-gray-200/80"
                    [style.color]="shop.invoiceConfig?.accentColor || '#0f172a'"
                  >
                    <span>Total:</span>
                    <span class="tabular-nums">₹{{ invoice.total | number: '1.0-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Footer Text & Terms Box -->
              <div class="mt-8 pt-6 border-t border-gray-100 text-center w-full">
                <p class="font-medium text-xs text-gray-600 mb-4">
                  {{ shop.invoiceConfig?.footerText || 'Thank you for your business!' }}
                </p>

                <div
                  *ngIf="shop.invoiceConfig?.showTermsAndConditions !== false"
                  class="text-[10px] text-gray-400 whitespace-pre-line text-left bg-slate-50/70 p-4 rounded-2xl border border-slate-100 leading-relaxed w-full"
                >
                  <p class="font-bold text-gray-500 mb-1">Terms & Conditions:</p>
                  {{ shop.invoiceConfig?.termsText || '1. Goods once sold will be replaced but not taken back.\n2. Warranty as per manufacturer norms.\n3. Subject to jurisdiction of New Delhi Courts.' }}
                </div>
              </div>
            </div>
          </div>
        </ng-container>

      </div>

      <ng-template #loadingShop>
        <div class="flex justify-center items-center h-64">
          <p class="text-gray-500 italic animate-pulse">Preparing your invoice...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .border-black {
      border-color: #000 !important;
    }
    @media print {
      .print-container {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 5mm !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: 100vh !important;
      }
    }
  `]
})
export class InvoicePrintComponent {
  private shopInput$ = new BehaviorSubject<any>(null);
  private invoiceInput$ = new BehaviorSubject<any>(null);

  @Input() set shop(value: any) {
    this.shopInput$.next(value);
  }
  get shop() {
    return this.shopInput$.getValue();
  }

  @Input() set invoice(value: any) {
    this.invoiceInput$.next(value);
  }
  get invoice() {
    return this.invoiceInput$.getValue();
  }

  private shopService = inject(ShopService);
  private authService = inject(AuthService);
  private qrService = inject(PaymentQrService);

  shop$ = combineLatest([this.shopInput$, this.invoiceInput$]).pipe(
    switchMap(([shop, invoice]) => {
      if (shop) return of(shop);

      if (invoice?.shopId) {
        return this.shopService.getShop(invoice.shopId).pipe(
          map((res) => res.data),
          catchError((err) => {
            console.error('Error fetching shop in print component:', err);
            return of(null);
          }),
        );
      }

      const user = this.authService.getCurrentUser();
      if (user?.shopId) {
        return this.shopService.getShop(user.shopId).pipe(
          map((res) => res.data),
          catchError((err) => {
            console.error('Error fetching fallback shop in print component:', err);
            return of(null);
          }),
        );
      }

      return of(null);
    }),
  );

  getQrDetails(shop: any, total: number): PaymentQrResult {
    if (!shop || shop.invoiceConfig?.showQrCode === false) {
      return { available: false, sourceType: 'none' };
    }
    return this.qrService.getPaymentQrDetails(shop, total || 0);
  }

  getTotalQty(): number {
    const inv = this.invoice;
    if (!inv?.items) return 0;
    return inv.items.reduce((sum: number, item: InvoiceItem) => sum + item.quantity, 0);
  }
}
