import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  FormControl,
} from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { OfferService } from '../../core/services/offer.service';
import { Product } from '../../core/models/product.model';
import { Offer } from '../../core/models/offer.model';
import { Shop } from '../../core/models/shop.model';
import { ShopService } from '../../core/services/shop.service';
import { CustomerCreditService } from '../../core/services/customer-credit.service';
import { getLocalISODate } from '../../core/utils/date.utils';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiDatePickerComponent } from '../../shared/components/ui-date-picker.component';
import { FeatureGuardService } from '../../core/services/feature-guard.service';

@Component({
  selector: 'app-create-invoice',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    UiDropdownComponent,
    UiInputComponent,
    UiDatePickerComponent,
  ],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Create New Invoice</h2>
            <p class="text-sm text-gray-500">Enter invoice details below</p>
          </div>
          <button
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 overflow-y-auto flex-1">
          <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
            <!-- Customer Details -->
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-800">Customer Details</h3>
              <button
                type="button"
                (click)="openCreditSearchModal()"
                class="text-sm px-3 py-1.5 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 font-medium flex items-center gap-1 transition-colors border border-primary-200"
              >
                <i class="bi bi-wallet2"></i>
                Fetch Customer & Apply Credit
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  formControlName="customerName"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
                <div
                  *ngIf="
                    invoiceForm.get('customerName')?.touched &&
                    invoiceForm.get('customerName')?.invalid
                  "
                  class="text-red-500 text-xs mt-1"
                >
                  Customer name is required.
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                <input
                  type="text"
                  formControlName="customerPhone"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="e.g. 9876543210"
                />
                <div
                  *ngIf="
                    invoiceForm.get('customerPhone')?.touched &&
                    invoiceForm.get('customerPhone')?.invalid
                  "
                  class="text-red-500 text-xs mt-1"
                >
                  Customer number is required.
                </div>
              </div>
              <div>
                <app-ui-date-picker
                  formControlName="invoiceDate"
                  label="Invoice Date"
                ></app-ui-date-picker>
              </div>
              <div *ngIf="shopData?.taxConfig?.gstEnabled">
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer State (Place of Supply)</label>
                <select
                  formControlName="customerState"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Select State</option>
                  <option *ngFor="let state of states" [value]="state">{{ state }}</option>
                </select>
              </div>
              @if (hasWholesaleSupport()) {
                <div class="col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Billing Mode</h4>
                    <p class="text-[11px] text-slate-400 mt-0.5">Toggle between Retail (B2C) and Wholesale (B2B) pricing.</p>
                  </div>
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input type="radio" formControlName="invoiceType" value="retail" (change)="onInvoiceTypeChange()" class="text-indigo-600 focus:ring-indigo-500" />
                      Retail (B2C)
                    </label>
                    <label class="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input type="radio" formControlName="invoiceType" value="wholesale" (change)="onInvoiceTypeChange()" class="text-indigo-600 focus:ring-indigo-500" />
                      Wholesale (B2B)
                    </label>
                  </div>
                </div>
              }
            </div>

            <!-- Items Section -->
            <div class="mb-8">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Items</h3>
                <button
                  type="button"
                  (click)="addItem()"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Item
                </button>
              </div>

              <div formArrayName="items" class="space-y-4">
                <div
                  *ngFor="let item of items.controls; let i = index"
                  [formGroupName]="i"
                  class="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group"
                >
                  <!-- Product Select (Top Row) -->
                  <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      Select Product
                    </label>
                    <app-ui-dropdown
                      formControlName="productId"
                      [options]="productOptions"
                      placeholder="Select Product"
                      (onSelect)="onProductSelect(i, $event)"
                    ></app-ui-dropdown>
                  </div>

                  <!-- Second Row -->
                  <div class="grid grid-cols-4 gap-4 items-start">
                    <!-- Variant -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Variant</label>
                      <app-ui-dropdown
                        formControlName="variantSku"
                        [options]="variantOptionsArray[i]"
                        placeholder="Variant"
                        (onSelect)="onVariantSelect(i, $event)"
                      ></app-ui-dropdown>
                    </div>

                    <!-- Qty -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                      <app-ui-input
                        type="number"
                        formControlName="quantity"
                        [error]="getQuantityError(i)"
                      ></app-ui-input>
                    </div>

                    <!-- Price -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Price</label>
                      <app-ui-input type="number" formControlName="unitPrice"></app-ui-input>
                    </div>

                    <!-- Total -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Total</label>
                      <div
                        class="px-3 py-2 bg-gray-100 rounded-md text-gray-700 font-medium text-right"
                      >
                        {{ getItemTotal(i) | currency: 'INR' }}
                      </div>
                    </div>
                  </div>

                  <!-- Remove Button -->
                  <button
                    type="button"
                    (click)="removeItem(i)"
                    class="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 p-1 rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Summary & Payment -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">
              <!-- Left Column: Payment Details -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
                <div class="space-y-4">
                  <!-- Coupon Section -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        [formControl]="couponControl"
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                        placeholder="Enter Coupon"
                      />
                      <button
                        type="button"
                        (click)="applyCoupon()"
                        [disabled]="isApplyingCoupon || !couponControl.value"
                        class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {{ isApplyingCoupon ? '...' : 'Apply' }}
                      </button>
                    </div>
                    <div
                      *ngIf="appliedOffer"
                      class="text-green-600 text-xs mt-1 flex justify-between items-center"
                    >
                      <span>Applied: {{ appliedOffer.code }}</span>
                      <button
                        type="button"
                        (click)="removeCoupon()"
                        class="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div *ngIf="couponError" class="text-red-500 text-xs mt-1">
                      {{ couponError }}
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Payment Status</label
                    >
                    <app-ui-dropdown
                      formControlName="paymentStatus"
                      [options]="paymentStatusOptions"
                    ></app-ui-dropdown>
                  </div>

                  <div *ngIf="invoiceForm.get('paymentStatus')?.value !== 'pending'">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                    <app-ui-input type="number" formControlName="paidAmount"></app-ui-input>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Payment Method</label
                    >
                    <app-ui-dropdown
                      formControlName="paymentMethod"
                      [options]="paymentMethodOptions"
                    ></app-ui-dropdown>
                  </div>
                </div>
              </div>

              <!-- Right Column: Summary -->
              <div class="bg-gray-50 p-6 rounded-xl space-y-3 h-fit">
                <div class="flex justify-between text-gray-600">
                  <span>Subtotal (Excl. Tax)</span>
                  <span>{{ subtotalExclTax | currency: 'INR' }}</span>
                </div>

                <!-- GST Breakdown Group -->
                <ng-container *ngIf="shopData?.taxConfig?.gstEnabled">
                  <div *ngIf="!isInterstate" class="space-y-1 border-t border-gray-100 py-2">
                    <div class="flex justify-between text-xs text-gray-500">
                      <span>CGST ({{ (shopData?.taxConfig?.gstRate || 0) / 2 }}%)</span>
                      <span>{{ cgstAmount | currency: 'INR' }}</span>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500">
                      <span>SGST ({{ (shopData?.taxConfig?.gstRate || 0) / 2 }}%)</span>
                      <span>{{ sgstAmount | currency: 'INR' }}</span>
                    </div>
                  </div>
                  <div
                    *ngIf="isInterstate"
                    class="flex justify-between text-xs text-secondary-500 border-t border-gray-100 py-2"
                  >
                    <span>IGST ({{ shopData?.taxConfig?.gstRate || 0 }}%)</span>
                    <span>{{ igstAmount | currency: 'INR' }}</span>
                  </div>
                </ng-container>

                <div class="flex justify-between text-gray-600 border-t border-gray-100 pt-2">
                  <span>Total Tax</span>
                  <span>{{ totalTaxAmount | currency: 'INR' }}</span>
                </div>

                <div class="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span [class.text-green-600]="discountAmount > 0"
                    >-{{ discountAmount | currency: 'INR' }}</span
                  >
                </div>
                
                <div *ngIf="appliedCredit > 0" class="flex justify-between text-gray-600">
                  <span>Store Credit Applied</span>
                  <div class="flex items-center gap-2">
                    <span class="text-green-600 font-medium">-{{ appliedCredit | currency: 'INR' }}</span>
                    <button type="button" (click)="removeCredit()" class="text-red-500 hover:text-red-700 text-xs">
                      Remove
                    </button>
                  </div>
                </div>

                <div class="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span class="text-lg font-bold text-gray-900">Total</span>
                  <span class="text-2xl font-bold text-primary-600">{{
                    total | currency: 'INR'
                  }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            (click)="close.emit()"
            class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="invoiceForm.invalid || isSubmitting"
            class="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span
              *ngIf="isSubmitting"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
            {{ isSubmitting ? 'Creating...' : 'Create Invoice' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Credit Search Modal -->
    <div *ngIf="showCreditSearch" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-900">Apply Store Credit</h3>
          <button (click)="showCreditSearch = false" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-5">
          <label class="block text-sm font-medium text-gray-700 mb-2">Customer Mobile Number</label>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="creditSearchPhone" placeholder="Enter phone number" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            <button (click)="searchCustomerCredit()" [disabled]="isSearchingCredit || !creditSearchPhone" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium">
              {{ isSearchingCredit ? '...' : 'Search' }}
            </button>
          </div>
          <div *ngIf="creditSearchResult" class="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <p class="text-sm font-medium text-green-800">Found: {{ creditSearchResult.customerName }}</p>
            <p class="text-xs text-green-600 mt-1">Available Credit: <strong>{{ creditSearchResult.balance | currency:'INR' }}</strong></p>
            <button (click)="applyCreditToInvoice()" [disabled]="creditSearchResult.balance <= 0" class="w-full mt-3 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Apply up to {{ maxApplicableCredit | currency:'INR' }}
            </button>
          </div>
          <div *ngIf="creditSearchError" class="mt-3 text-sm text-red-500 font-medium">
            {{ creditSearchError }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CreateInvoiceComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() invoiceCreated = new EventEmitter<void>();

  invoiceForm: FormGroup;
  isSubmitting = false;
  products: Product[] = [];
  productOptions: any[] = [];
  userShopId: string | undefined;
  shopData: Shop | undefined;
  currentUser: any;

  states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
    'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 
    'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  paymentStatusOptions = [
    { value: 'pending', label: 'Pending', icon: 'layers', color: '#F59E0B' },
    { value: 'paid', label: 'Paid', icon: 'layers', color: '#10B981' },
    { value: 'partial', label: 'Partial', icon: 'layers', color: '#3B82F6' },
  ];

  paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: 'layers', color: '#6B7280' },
    { value: 'card', label: 'Card', icon: 'layers', color: '#8B5CF6' },
    { value: 'upi', label: 'UPI', icon: 'smartphone', color: '#2563EB' },
    { value: 'credit', label: 'Credit/Later', icon: 'layers', color: '#EF4444' },
  ];

  // Coupon Logic
  couponControl = new FormControl('');
  appliedOffer: Offer | null = null;
  isApplyingCoupon = false;
  couponError = '';

  // Credit Logic
  showCreditSearch = false;
  creditSearchPhone = '';
  isSearchingCredit = false;
  creditSearchError = '';
  creditSearchResult: any = null;
  appliedCredit = 0;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private productService: ProductService,
    private offerService: OfferService,
    private shopService: ShopService,
    private customerCreditService: CustomerCreditService,
    private featureService: FeatureGuardService,
  ) {
    this.invoiceForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      customerState: [''],
      invoiceDate: [getLocalISODate(), Validators.required],
      invoiceType: ['retail', Validators.required],
      items: this.fb.array([]),
      paymentStatus: ['pending'],
      paidAmount: [0],
      paymentMethod: ['cash'],
    });

    // Add initial item
    this.addItem();
  }

  applyCoupon() {
    const code = this.couponControl.value;
    if (!code || !this.userShopId) return;

    this.isApplyingCoupon = true;
    this.couponError = '';

    this.offerService.validateCoupon(code.toUpperCase(), this.userShopId, this.subtotal).subscribe({
      next: (res) => {
        this.appliedOffer = res.data;
        this.isApplyingCoupon = false;
        this.couponControl.disable();
        this.updatePaidAmountIfPaid();
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        this.couponError = err.error?.message || 'Invalid Coupon Code';
        this.appliedOffer = null;
      },
    });
  }

  removeCoupon() {
    this.appliedOffer = null;
    this.couponControl.reset();
    this.couponControl.enable();
    this.couponError = '';
    this.updatePaidAmountIfPaid();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user?.shopId) {
        this.userShopId = user.shopId;
        this.loadProducts();
        this.loadShopData();
      }
    });

    // Auto-update paid amount based on payment status
    this.invoiceForm.get('paymentStatus')?.valueChanges.subscribe(status => {
      if (status === 'paid') {
        this.invoiceForm.patchValue({ paidAmount: this.total }, { emitEvent: false });
      } else if (status === 'partial' || status === 'pending') {
        this.invoiceForm.patchValue({ paidAmount: 0 }, { emitEvent: false });
      }
    });

    // When form values change (like quantity or price), update paidAmount if status is 'paid'
    this.invoiceForm.valueChanges.subscribe(() => {
      if (this.invoiceForm.get('paymentStatus')?.value === 'paid') {
        const currentPaidAmount = this.invoiceForm.get('paidAmount')?.value;
        const currentTotal = this.total;
        if (currentPaidAmount !== currentTotal) {
          this.invoiceForm.patchValue({ paidAmount: currentTotal }, { emitEvent: false });
        }
      }
    });
  }

  hasWholesaleSupport(): boolean {
    return !!this.shopData && this.featureService.hasFeatureSync(this.shopData, 'wholesale_system');
  }

  onInvoiceTypeChange() {
    // Re-verify all item prices and limits based on new billing type
    for (let i = 0; i < this.items.length; i++) {
      const sku = this.items.at(i).get('variantSku')?.value;
      if (sku) {
        this.onVariantSelect(i, sku);
      }
    }
  }

  loadShopData() {
    if (!this.userShopId) return;
    this.shopService.getShop(this.userShopId).subscribe(res => {
      this.shopData = res.data;
      if (this.shopData?.pickupAddress?.state) {
        this.invoiceForm.patchValue({ customerState: this.shopData.pickupAddress.state });
      }
    });
  }

  loadProducts() {
    if (!this.userShopId) return;
    this.productService.getProductsByShop(this.userShopId).subscribe({
      next: (res) => {
        this.products = res.data;
        this.productOptions = this.products.map((p) => ({
          value: p.id || (p as any)._id,
          label: p.name,
          icon: 'briefcase',
          color: '#6366F1',
        }));
      },
      error: (err) => console.error('Error loading products:', err),
    });
  }

  get items() {
    return this.invoiceForm.get('items') as FormArray;
  }

  availableVariantsArray: any[][] = [];
  variantOptionsArray: any[][] = [];

  addItem() {
    const itemGroup = this.fb.group({
      productId: ['', Validators.required],
      variantSku: ['', Validators.required],
      productName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      taxRate: [0],
      discount: [0],
    });
    this.items.push(itemGroup);
    this.availableVariantsArray.push([]);
    this.variantOptionsArray.push([]);
  }

  onProductSelect(index: number, productId: any) {
    const product = this.products.find((p) => p.id === productId || (p as any)._id === productId);

    if (product) {
      this.availableVariantsArray[index] = product.variants || [];
      const isWholesale = this.invoiceForm.get('invoiceType')?.value === 'wholesale';
      this.variantOptionsArray[index] = (product.variants || []).map((v: any) => {
        const pStr = isWholesale && v.wholesalePrice ? `₹${v.wholesalePrice} Wholesale` : `₹${v.price}`;
        const minStr = isWholesale && v.wholesaleMinQty ? ` (Min ${v.wholesaleMinQty} Qty)` : '';
        return {
          value: v.sku,
          label: `${v.size || ''} ${v.color || ''} (${pStr})${minStr}`,
          icon: 'layers',
          color: '#10B981',
        };
      });

      const patchData: any = {
        productName: product.name,
        productId: product.id || (product as any)._id,
        variantSku: '', // Reset variant
        unitPrice: 0, // Reset price
      };

      const quantityControl = this.items.at(index).get('quantity');
      // Reset validators initially
      quantityControl?.clearValidators();
      quantityControl?.setValidators([Validators.required, Validators.min(1)]);
      quantityControl?.updateValueAndValidity();

      // Auto-select if only one variant
      if (product.variants.length === 1) {
        const variant = product.variants[0];
        const isWholesale = this.invoiceForm.get('invoiceType')?.value === 'wholesale';
        patchData.unitPrice = isWholesale && variant.wholesalePrice ? variant.wholesalePrice : variant.price;
        patchData.variantSku = variant.sku;

        const minVal = isWholesale && variant.wholesaleMinQty ? variant.wholesaleMinQty : 1;

        // Set max validator based on stock
        quantityControl?.setValidators([
          Validators.required,
          Validators.min(minVal),
          Validators.max(variant.stock),
        ]);
        quantityControl?.setValue(Math.max(quantityControl?.value || 1, minVal));
        quantityControl?.updateValueAndValidity();
      }

      this.items.at(index).patchValue(patchData);
    }
  }

  onVariantSelect(index: number, sku: any) {
    const variants = this.availableVariantsArray[index];
    const variant = variants?.find((v) => v.sku === sku);

    if (variant) {
      const isWholesale = this.invoiceForm.get('invoiceType')?.value === 'wholesale';
      const priceToUse = isWholesale && (variant as any).wholesalePrice ? (variant as any).wholesalePrice : variant.price;
      const minVal = isWholesale && (variant as any).wholesaleMinQty ? (variant as any).wholesaleMinQty : 1;

      this.items.at(index).patchValue({
        unitPrice: priceToUse,
        variantSku: variant.sku,
      });

      const quantityControl = this.items.at(index).get('quantity');
      quantityControl?.setValidators([
        Validators.required,
        Validators.min(minVal),
        Validators.max(variant.stock),
      ]);
      quantityControl?.setValue(Math.max(quantityControl?.value || 1, minVal));
      quantityControl?.updateValueAndValidity();
    }
  }

  getQuantityError(index: number): string {
    const control = this.items.at(index).get('quantity');
    if (control && control.invalid) {
      if (control.errors?.['max']) {
        return `Max ${control.errors['max'].max} avail.`;
      }
      if (control.errors?.['min']) {
        return `Min ${control.errors['min'].min} required`;
      }
      if (control.dirty || control.touched) {
        if (control.errors?.['required']) {
          return 'Required';
        }
      }
    }
    return '';
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.availableVariantsArray.splice(index, 1);
    this.variantOptionsArray.splice(index, 1);
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index).value;
    return (item.quantity || 0) * (item.unitPrice || 0);
  }

  get subtotal(): number {
    return this.items.controls.reduce((sum, control) => {
      const val = control.value;
      return sum + (val.quantity || 0) * (val.unitPrice || 0);
    }, 0);
  }

  get discountAmount(): number {
    if (!this.appliedOffer) return 0;

    if (this.appliedOffer.type === 'percentage') {
      return (this.subtotal * (this.appliedOffer.value || 0)) / 100;
    } else if (this.appliedOffer.type === 'flat') {
      // Ensure discount doesn't exceed subtotal
      return Math.min(this.appliedOffer.value || 0, this.subtotal);
    }
    // TODO: Implement Buy X Get Y logic if needed for invoice
    return 0;
  }

  get total(): number {
    const calc = this.subtotalExclTax + this.totalTaxAmount - this.discountAmount - this.appliedCredit;
    return calc > 0 ? calc : 0;
  }

  // Credit logic
  openCreditSearchModal() {
    this.creditSearchPhone = this.invoiceForm.get('customerPhone')?.value || '';
    this.creditSearchResult = null;
    this.creditSearchError = '';
    this.showCreditSearch = true;
  }

  searchCustomerCredit() {
    if (!this.userShopId || !this.creditSearchPhone) return;
    this.isSearchingCredit = true;
    this.creditSearchError = '';
    this.creditSearchResult = null;

    this.customerCreditService.getCreditsByShop(this.userShopId).subscribe({
      next: (res) => {
        const found = res.data.find((c) => c.customerPhone === this.creditSearchPhone);
        if (found) {
          this.creditSearchResult = found;
        } else {
          this.creditSearchError = 'No credit record found for this number.';
        }
        this.isSearchingCredit = false;
      },
      error: () => {
        this.creditSearchError = 'Failed to fetch credit records.';
        this.isSearchingCredit = false;
      }
    });
  }

  get maxApplicableCredit(): number {
    if (!this.creditSearchResult) return 0;
    // Calculate total without credit applied yet
    const currentTotal = this.subtotalExclTax + this.totalTaxAmount - this.discountAmount;
    // We can only apply up to the current total or whatever balance they have
    return Math.min(this.creditSearchResult.balance, currentTotal);
  }

  applyCreditToInvoice() {
    if (!this.creditSearchResult || this.maxApplicableCredit <= 0) return;
    
    // Auto fill details
    this.invoiceForm.patchValue({
      customerName: this.creditSearchResult.customerName,
      customerPhone: this.creditSearchResult.customerPhone || this.creditSearchPhone,
    });

    this.appliedCredit = this.maxApplicableCredit;
    this.showCreditSearch = false;
    this.updatePaidAmountIfPaid();
  }

  removeCredit() {
    this.appliedCredit = 0;
    this.creditSearchResult = null;
    this.updatePaidAmountIfPaid();
  }

  private updatePaidAmountIfPaid() {
    if (this.invoiceForm.get('paymentStatus')?.value === 'paid') {
      this.invoiceForm.patchValue({ paidAmount: this.total }, { emitEvent: false });
    }
  }

  get isInterstate(): boolean {
    if (!this.shopData?.pickupAddress?.state || !this.invoiceForm.get('customerState')?.value) return false;
    return this.shopData.pickupAddress.state.toLowerCase().trim() !== 
           this.invoiceForm.get('customerState')?.value.toLowerCase().trim();
  }

  get subtotalExclTax(): number {
    const config = this.shopData?.taxConfig;
    const rawSubtotal = this.subtotal;
    if (config?.gstEnabled && config?.gstType === 'inclusive') {
      return rawSubtotal / (1 + (config.gstRate / 100));
    }
    return rawSubtotal;
  }

  get totalTaxAmount(): number {
    const config = this.shopData?.taxConfig;
    if (!config?.gstEnabled) return 0;
    
    if (config.gstType === 'inclusive') {
      return this.subtotal - this.subtotalExclTax;
    } else {
      return this.subtotal * (config.gstRate / 100);
    }
  }

  get cgstAmount(): number {
    return this.isInterstate ? 0 : this.totalTaxAmount / 2;
  }

  get sgstAmount(): number {
    return this.isInterstate ? 0 : this.totalTaxAmount / 2;
  }

  get igstAmount(): number {
    return this.isInterstate ? this.totalTaxAmount : 0;
  }

  onSubmit() {
    if (this.invoiceForm.invalid || !this.userShopId) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.invoiceForm.getRawValue();

    const invoiceData: any = {
      shopId: this.userShopId,
      customerName: formVal.customerName,
      customerPhone: formVal.customerPhone,
      employeeId: this.currentUser?.role === 'staff' ? this.currentUser.uid : null,
      employeeName: this.currentUser?.displayName || 'Admin',
      employeeRole: this.currentUser?.role === 'staff' ? 'Sales Staff' : 'Admin',
      createdBy: {
        id: this.currentUser?.uid || 'unknown',
        name: this.currentUser?.displayName || 'Admin',
        role: this.currentUser?.role === 'staff' ? 'Sales Staff' : 'Admin'
      },
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date(formVal.invoiceDate + 'T00:00:00'),
      invoiceType: formVal.invoiceType || 'retail',
      items: formVal.items.map((item: any) => {
        // Find product and variant to get details
        const product = this.products.find(
          (p) => p.id === item.productId || (p as any)._id === item.productId,
        );
        const variant = product?.variants.find((v) => v.sku === item.variantSku);

        return {
          ...item,
          total: item.quantity * item.unitPrice,
          variantDetails: variant
            ? {
                size: variant.size,
                color: variant.color,
              }
            : null,
        };
      }),
      subtotal: this.subtotal,
      taxRate: 0,
      taxAmount: 0,
      discount: this.discountAmount,
      appliedCredit: this.appliedCredit,
      total: this.total,
      paymentMethod: formVal.paymentMethod,
      paymentStatus: formVal.paymentStatus,
      paidAmount: formVal.paymentStatus === 'paid' ? this.total : formVal.paidAmount || 0,
      status: 'paid',
      sentVia: [],
      appliedOfferId: this.appliedOffer?.id,
    };

    this.invoiceService.createInvoice(invoiceData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.invoiceCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creating invoice:', err);
        this.isSubmitting = false;
      },
    });
  }
}
