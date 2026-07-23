import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice, InvoiceItem } from '../../core/models/invoice.model';
import { ShopService } from '../../core/services/shop.service';
import { AuthService } from '../../core/services/auth.service';
import { map, of, switchMap, BehaviorSubject, combineLatest, catchError } from 'rxjs';

@Component({
  selector: 'app-invoice-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-container bg-white text-black" *ngIf="invoice">
      <div *ngIf="shop$ | async as shop; else loadingShop">
        <!-- DEFAULT TEMPLATE (Traditional) -->
        <ng-container *ngIf="!shop.invoiceConfig || shop.invoiceConfig.templateType !== 'custom'">
          <!-- Spiritual Header -->
          <div class="text-center text-xs font-bold mb-2">|| Shree Ganeshay Namah ||</div>

          <!-- Header Section -->
          <div class="border border-black p-2 mb-2">
            <div class="flex justify-between items-start">
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

              <!-- Social/Extra (Right) -->
              <div class="w-1/3 text-right text-xs">
                <div *ngIf="shop.socialLinks?.instagram">
                  <i class="bi bi-instagram"></i> {{ shop.socialLinks!.instagram }}
                </div>
                <div>{{ shop.email }}</div>
              </div>
            </div>
          </div>

          <!-- Bill & Customer Info -->
          <div class="border border-black p-2 mb-2 flex justify-between text-xs">
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

          <!-- Items Table -->
          <table class="w-full border-collapse border border-black mb-2 text-xs">
            <thead>
              <tr class="border-b border-black">
                <th class="border-r border-black w-10 py-1 px-1 text-center">Sr.</th>
                <th class="border-r border-black py-1 px-2 text-left">Particulars</th>
                <th class="border-r border-black w-24 py-1 px-1 text-left">Variant</th>
                <th class="border-r border-black w-14 py-1 px-1 text-right">Qty</th>
                <th class="border-r border-black w-16 py-1 px-1 text-right">Rate</th>
                <th class="border-r border-black w-14 py-1 px-1 text-right">Dis.</th>
                <th class="w-20 py-1 px-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of invoice.items; let i = index" class="border-b border-gray-400">
                <td class="border-r border-black py-1 px-1 text-center align-top">{{ i + 1 }}</td>
                <td class="border-r border-black py-1 px-2 align-top">
                  <div class="font-bold">{{ item.productName }}</div>
                  <div class="text-[10px] text-gray-600" *ngIf="item.variantSku">
                    {{ item.variantSku }}
                  </div>
                </td>
                <td class="border-r border-black py-1 px-1 align-top text-[10px]">
                  <div *ngIf="item.variantDetails?.size">Size: {{ item.variantDetails?.size }}</div>
                  <div *ngIf="item.variantDetails?.color">Color: {{ item.variantDetails?.color }}</div>
                </td>
                <td class="border-r border-black py-1 px-1 text-right align-top">
                  {{ item.quantity }}
                </td>
                <td class="border-r border-black py-1 px-1 text-right align-top">
                  {{ item.unitPrice | number: '1.0-2' }}
                </td>
                <td class="border-r border-black py-1 px-1 text-right align-top">
                  {{ item.discount | number: '1.0-0' }}
                </td>
                <td class="py-1 px-1 text-right align-top font-bold">
                  {{ item.total | number: '1.2-2' }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Summary Section -->
          <div class="border border-black p-2 mb-4">
            <div class="flex justify-between">
              <!-- Payment Details (Left) -->
              <div class="w-1/2 pr-4 border-r border-black border-dotted text-left">
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
                
                <!-- Proof details (Razorpay / UPI references) -->
                <ng-container *ngIf="invoice.paymentDetails">
                  <div class="flex text-[9px] mt-1 text-gray-700" *ngIf="invoice.paymentDetails.razorpayPaymentId">
                    <span class="w-20 font-semibold">Payment ID:</span>
                    <span class="font-mono">{{ invoice.paymentDetails.razorpayPaymentId }}</span>
                  </div>
                  <div class="flex text-[9px] mt-0.5 text-gray-700" *ngIf="invoice.paymentDetails.razorpayOrderId">
                    <span class="w-20 font-semibold">Order ID:</span>
                    <span class="font-mono">{{ invoice.paymentDetails.razorpayOrderId }}</span>
                  </div>
                  <div class="flex text-[9px] mt-0.5 text-gray-700" *ngIf="invoice.paymentDetails.paidAt">
                    <span class="w-20 font-semibold">Paid At:</span>
                    <span>{{ (invoice.paymentDetails.paidAt?._seconds ? (invoice.paymentDetails.paidAt._seconds * 1000) : invoice.paymentDetails.paidAt) | date: 'medium' }}</span>
                  </div>
                </ng-container>
                <div class="flex text-[9px] mt-1 text-gray-700" *ngIf="invoice.upiTransactionId">
                  <span class="w-20 font-semibold">UPI Ref No:</span>
                  <span class="font-mono">{{ invoice.upiTransactionId }}</span>
                </div>
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
                <div class="flex justify-between text-xs mb-1" *ngIf="invoice.taxAmount > 0">
                  <span>CGST / SGST:</span>
                  <span>₹{{ invoice.taxAmount | number: '1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-xs mb-1" *ngIf="invoice.discount > 0">
                  <span>Extra Discount:</span>
                  <span>-₹{{ invoice.discount | number: '1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-xs mb-1" *ngIf="invoice.appliedCredit > 0">
                  <span>Store Credit Applied:</span>
                  <span>-₹{{ invoice.appliedCredit | number: '1.2-2' }}</span>
                </div>

                <div class="flex justify-between items-center text-sm border border-black p-1 mt-2">
                  <span class="font-bold uppercase">Net Amount</span>
                  <span class="font-bold text-xl">₹{{ invoice.total | number: '1.2-2' }}</span>
                </div>
                <div class="text-[10px] text-right mt-1 italic">(E & O.E.)</div>
              </div>
            </div>
          </div>

          <!-- Traditional Template Payment Proof Screenshot -->
          <div *ngIf="invoice.paymentProof" class="mt-4 border border-black p-2 text-left" style="break-inside: avoid;">
            <div class="font-bold underline mb-2 text-xs">Payment Proof / Receipt:</div>
            <div class="flex justify-center bg-gray-50 p-2 border border-gray-200 rounded-lg">
              <img [src]="invoice.paymentProof" class="max-h-[300px] w-auto object-contain" alt="Payment Proof Screenshot" />
            </div>
          </div>

          <!-- Footer -->
          <div class="border border-black p-2 flex justify-between items-end min-h-[100px]">
            <div class="text-[10px] w-1/2">
              <div class="font-bold mb-1 underline">Terms & Conditions:</div>
              <ol class="list-decimal pl-4 space-y-0.5">
                <li>Goods once sold will not be taken back.</li>
                <li>NO EXCHANGE NO RETURN.</li>
                <li>Subject to local jurisdiction.</li>
              </ol>
              <div class="mt-4 font-bold text-center border-t border-black pt-1 w-3/4">
                THANK YOU FOR SHOPPING
              </div>
            </div>

            <div class="text-center w-1/3">
              <div class="h-12"></div>
              <!-- Space for signature -->
              <div class="font-bold border-t border-black pt-1">Authorized Signature</div>
            </div>
          </div>
        </ng-container>

        <!-- CUSTOM TEMPLATE (Modern) -->
        <ng-container *ngIf="shop.invoiceConfig?.templateType === 'custom'">
          <div class="flex flex-col min-h-[290mm]">
            <!-- Header -->
            <div class="flex justify-between items-start mb-8">
              <div>
                <img
                  *ngIf="shop.invoiceConfig?.showLogo && (shop.logo || shop.theme?.logo)"
                  [src]="shop.logo || shop.theme?.logo"
                  class="h-16 w-auto mb-4 object-contain"
                />
                <h1
                  class="text-2xl font-bold uppercase"
                  [style.color]="shop.invoiceConfig?.accentColor"
                >
                  {{ shop.shopName }}
                </h1>
                <p class="text-gray-600 text-sm whitespace-pre-wrap">{{ shop.address }}</p>
                <p class="text-gray-600 text-sm" *ngIf="shop.gstNumber">GST: {{ shop.gstNumber }}</p>
                <p class="text-gray-600 text-sm">{{ shop.phone }} | {{ shop.email }}</p>
              </div>
              <div class="text-right">
                <h2 class="text-4xl font-black text-gray-200 uppercase tracking-tighter">Invoice</h2>
                <div class="mt-4">
                  <p class="text-sm text-gray-400 uppercase font-bold">Invoice No</p>
                  <p class="font-bold text-lg leading-none">{{ invoice.invoiceNumber }}</p>
                </div>
                <div class="mt-2">
                  <p class="text-sm text-gray-400 uppercase font-bold">Date</p>
                  <p class="font-bold text-sm">{{ invoice.invoiceDate | date: 'MMMM dd, yyyy' }}</p>
                </div>
              </div>
            </div>

            <!-- Client Info & Payment Info -->
            <div class="grid grid-cols-2 gap-12 mb-10 py-6 border-y border-gray-100 text-left">
              <div>
                <p class="text-xs uppercase font-bold text-gray-400 mb-2">Bill To</p>
                <h3 class="font-bold text-lg text-gray-900">
                  {{ invoice.customerName || 'Walk-in Customer' }}
                </h3>
                <p class="text-gray-600" *ngIf="invoice.customerPhone">{{ invoice.customerPhone }}</p>
                <p class="text-gray-600" *ngIf="invoice.customerEmail">{{ invoice.customerEmail }}</p>
              </div>
              <div class="text-right flex flex-col items-end">
                <p class="text-xs uppercase font-bold text-gray-400 mb-2">Payment Info</p>
                <div class="space-y-1 text-sm text-gray-600">
                  <p>
                    <span class="font-semibold text-gray-900">Status:</span> 
                    <span class="capitalize ml-1 px-2 py-0.5 rounded text-xs font-bold" 
                      [class.bg-green-100]="invoice.paymentStatus === 'paid'" 
                      [class.text-green-800]="invoice.paymentStatus === 'paid'"
                      [class.bg-amber-100]="invoice.paymentStatus === 'partial' || invoice.paymentStatus === 'pending'" 
                      [class.text-amber-800]="invoice.paymentStatus === 'partial' || invoice.paymentStatus === 'pending'">
                      {{ invoice.paymentStatus || 'Pending' }}
                    </span>
                  </p>
                  <p *ngIf="invoice.paymentMethod"><span class="font-semibold text-gray-900">Method:</span> <span class="capitalize ml-1">{{ invoice.paymentMethod }}</span></p>
                  <p *ngIf="invoice.paidAmount !== undefined"><span class="font-semibold text-gray-900">Paid:</span> <span class="ml-1">₹{{ invoice.paidAmount | number: '1.2-2' }}</span></p>
                  
                  <ng-container *ngIf="invoice.paymentDetails">
                    <p *ngIf="invoice.paymentDetails.razorpayPaymentId"><span class="font-semibold text-gray-900">Payment ID:</span> <span class="ml-1 font-mono text-xs">{{ invoice.paymentDetails.razorpayPaymentId }}</span></p>
                    <p *ngIf="invoice.paymentDetails.razorpayOrderId"><span class="font-semibold text-gray-900">Order ID:</span> <span class="ml-1 font-mono text-xs">{{ invoice.paymentDetails.razorpayOrderId }}</span></p>
                    <p *ngIf="invoice.paymentDetails.paidAt"><span class="font-semibold text-gray-900">Paid At:</span> <span class="ml-1">{{ (invoice.paymentDetails.paidAt?._seconds ? (invoice.paymentDetails.paidAt._seconds * 1000) : invoice.paymentDetails.paidAt) | date: 'medium' }}</span></p>
                  </ng-container>
                  
                  <p *ngIf="invoice.upiTransactionId"><span class="font-semibold text-gray-900">UPI Ref:</span> <span class="ml-1 font-mono text-xs">{{ invoice.upiTransactionId }}</span></p>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <div class="flex-1">
              <table class="w-full text-left">
                <thead>
                  <tr
                    class="border-b-2 border-gray-900 text-xs uppercase font-bold text-gray-900"
                  >
                    <th class="py-3 px-2">Item Description</th>
                    <th class="py-3 text-right w-20">Qty</th>
                    <th class="py-3 text-right w-32">Price</th>
                    <th class="py-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody class="text-sm">
                  <tr
                    *ngFor="let item of invoice.items"
                    class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td class="py-4 px-2">
                      <div class="font-bold text-gray-900">{{ item.productName }}</div>
                      <div class="text-xs text-gray-500 mt-1">
                        <span *ngIf="item.variantDetails?.size">Size: {{ item.variantDetails.size }}</span>
                        <span *ngIf="item.variantDetails?.color" class="ml-2">Color: {{ item.variantDetails.color }}</span>
                      </div>
                    </td>
                    <td class="py-4 text-right tabular-nums">{{ item.quantity }}</td>
                    <td class="py-4 text-right tabular-nums">₹{{ item.unitPrice | number: '1.2-2' }}</td>
                    <td class="py-4 text-right font-bold text-gray-900 tabular-nums">
                      ₹{{ item.total | number: '1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div class="mt-12 flex justify-between items-start">
              <div class="w-1/2">
                <div *ngIf="shop.invoiceConfig?.showTermsAndConditions" class="bg-gray-50 p-4 rounded-xl">
                  <h4 class="text-xs font-bold text-gray-900 uppercase mb-2">Terms & Conditions</h4>
                  <p class="text-[10px] text-gray-500 whitespace-pre-line leading-relaxed">
                    {{ shop.invoiceConfig?.termsText }}
                  </p>
                </div>
              </div>
              <div class="w-1/3 space-y-3">
                <div class="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal:</span>
                  <span class="tabular-nums">₹{{ invoice.subtotal | number: '1.2-2' }}</span>
                </div>
                <div *ngIf="invoice.taxAmount > 0" class="flex justify-between text-gray-600 text-sm">
                  <span>Tax (GST):</span>
                  <span class="tabular-nums">₹{{ invoice.taxAmount | number: '1.2-2' }}</span>
                </div>
                <div *ngIf="invoice.discount > 0" class="flex justify-between text-gray-400 text-xs italic">
                  <span>Discount:</span>
                  <span class="tabular-nums">-₹{{ invoice.discount | number: '1.2-2' }}</span>
                </div>
                <div *ngIf="invoice.appliedCredit > 0" class="flex justify-between text-gray-600 text-sm font-medium">
                  <span>Store Credit Applied:</span>
                  <span class="tabular-nums text-green-600">-₹{{ invoice.appliedCredit | number: '1.2-2' }}</span>
                </div>
                <div
                  class="flex justify-between items-center pt-4 border-t-2 border-gray-900"
                  [style.color]="shop.invoiceConfig?.accentColor"
                >
                  <span class="text-lg font-black uppercase">Total:</span>
                  <span class="text-2xl font-black tabular-nums">
                    ₹{{ invoice.total | number: '1.2-2' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-20 pt-8 border-t border-gray-100 flex justify-between items-end">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ shop.invoiceConfig?.footerText }}</p>
                <div class="mt-4 flex gap-4">
                  <div *ngIf="shop.socialLinks?.instagram" class="text-xs text-gray-400">
                    <i class="bi bi-instagram mr-1"></i>/{{ shop.socialLinks.instagram }}
                  </div>
                  <div class="text-xs text-gray-400">
                    <i class="bi bi-globe mr-1"></i>{{ shop.subdomain }}.clothify.in
                  </div>
                </div>
              </div>
              <div *ngIf="shop.invoiceConfig?.showSignatureLine" class="text-center w-48">
                <div class="h-10 border-b border-gray-200 mb-2"></div>
                <p class="text-[10px] uppercase font-bold text-gray-300">Authorized Signatory</p>
              </div>
            </div>

            <!-- Modern Template Payment Proof Screenshot -->
            <div *ngIf="invoice.paymentProof" class="mt-8 text-left" style="break-inside: avoid;">
              <h4 class="text-xs font-bold text-gray-900 uppercase mb-3">Proof of Payment</h4>
              <div class="inline-block p-4 border border-gray-100 rounded-2xl bg-gray-50 shadow-sm max-w-full">
                <img [src]="invoice.paymentProof" class="max-h-[300px] w-auto rounded-xl object-contain border border-gray-200" alt="Payment Proof Screenshot" />
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

    <style>
      @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;700;900&display=swap');

      :host {
        display: block;
        background-color: white;
      }

      .print-container {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        padding: 10mm;
        box-sizing: border-box;
      }

      .border-black {
        border-color: #000 !important;
      }

      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        body {
          background: white;
          -webkit-print-color-adjust: exact;
        }
        .print-container {
          width: 100%;
          max-width: none;
          padding: 10mm;
          margin: 0;
          box-shadow: none;
        }
        * {
          border-color: inherit !important;
        }
        .border-black {
          border-color: #000 !important;
        }
      }
    </style>
  `,
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

  shop$ = combineLatest([this.shopInput$, this.invoiceInput$]).pipe(
    switchMap(([shop, invoice]) => {
      // Prioritize input shop
      if (shop) return of(shop);

      // Fetch by invoice shopId if available
      if (invoice?.shopId) {
        return this.shopService.getShop(invoice.shopId).pipe(
          map((res) => res.data),
          catchError((err) => {
            console.error('Error fetching shop in print component:', err);
            return of(null);
          })
        );
      }

      // Fallback to current user's shop if no invoice shopId (preview mode)
      const user = this.authService.getCurrentUser();
      if (user?.shopId) {
        return this.shopService.getShop(user.shopId).pipe(
          map((res) => res.data),
          catchError((err) => {
            console.error('Error fetching fallback shop in print component:', err);
            return of(null);
          })
        );
      }

      return of(null);
    })
  );

  getTotalQty(): number {
    const inv = this.invoice;
    if (!inv?.items) return 0;
    return inv.items.reduce((sum: number, item: InvoiceItem) => sum + item.quantity, 0);
  }
}
