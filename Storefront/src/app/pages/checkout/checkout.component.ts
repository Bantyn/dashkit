import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService, ShopConfig } from '../../core/services/shop-context.service';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { OptimizeImagePipe } from '../../shared/pipes/optimize-image.pipe';
import { CustomerCreditService } from '../../core/services/customer-credit.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, OptimizeImagePipe],
  template: `
    <div class="bg-[#fcfcfc] min-h-screen pt-12 pb-24 text-left">
      <div class="container mx-auto px-4 max-w-9xl animate-fade-in-up">
        <!-- Centered Serif Title -->
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 text-center tracking-tight uppercase mb-16 font-sans">
          Secure Checkout
        </h1>

        <div class="flex flex-col lg:flex-row gap-12 items-start">
          
          <!-- Left: Steps (Address & Payment) -->
          <div class="lg:w-[60%] w-full space-y-8">
            
            <!-- STEP 1: SHIPPING DETAILS -->
            <div 
              class="bg-white border border-gray-200/80 rounded-xl p-8 transition-all duration-300"
              [class.opacity-60]="currentStep !== 1"
            >
              <!-- Step Header -->
              <div class="flex items-center justify-between mb-8">
                <h2 class="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-4">
                  <span 
                    class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors"
                    [class.bg-black]="currentStep === 1 || currentStep > 1"
                    [class.text-white]="currentStep === 1 || currentStep > 1"
                    [class.border]="currentStep !== 1 && currentStep <= 1"
                    [class.border-gray-200]="currentStep !== 1 && currentStep <= 1"
                  >
                    <i class="bi bi-check-lg" *ngIf="currentStep > 1"></i>
                    <span *ngIf="currentStep === 1">1</span>
                  </span>
                  Shipping Details
                </h2>
                <button 
                  *ngIf="currentStep > 1"
                  (click)="currentStep = 1"
                  class="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors focus:outline-none"
                >
                  Edit
                </button>
              </div>

              
              <!-- Saved Addresses Selection -->
              <div *ngIf="currentStep === 1 && savedAddresses.length > 0" class="mb-8 animate-fade-in">
                <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Saved Addresses</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div *ngFor="let addr of savedAddresses; let i = index" 
                       (click)="selectSavedAddress(addr)"
                       class="border rounded-lg p-4 cursor-pointer hover:border-black transition-colors"
                       [class.border-black]="selectedAddressIndex === i"
                       [class.bg-gray-50]="selectedAddressIndex === i"
                       [class.border-gray-200]="selectedAddressIndex !== i">
                    <p class="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <i class="bi bi-geo-alt"></i> {{ addr.name }}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">{{ addr.addressLine1 }}<span *ngIf="addr.addressLine2">, {{ addr.addressLine2 }}</span></p>
                    <p class="text-xs text-gray-600">{{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p>
                    <p class="text-xs text-gray-600 font-medium mt-1"><i class="bi bi-telephone"></i> {{ addr.phone }}</p>
                  </div>
                  
                  <div (click)="selectNewAddress()"
                       class="border rounded-lg p-4 cursor-pointer hover:border-black transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-black"
                       [class.border-black]="selectedAddressIndex === -1"
                       [class.bg-gray-50]="selectedAddressIndex === -1"
                       [class.border-gray-200]="selectedAddressIndex !== -1">
                    <i class="bi bi-plus-circle text-xl mb-1"></i>
                    <p class="text-xs font-bold uppercase tracking-wider">Use New Address</p>
                  </div>
                </div>
              </div>

              <!-- Address Form (visible in Step 1) -->
              <form [formGroup]="addressForm" *ngIf="currentStep === 1 && selectedAddressIndex === -1" class="space-y-6 animate-fade-in border-t border-gray-100 pt-6 mt-6">

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <!-- Full Name -->
                  <div class="sm:col-span-2">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Full Name <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="name"
                      placeholder="John Doe"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- Email Address -->
                  <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Email Address <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      formControlName="email"
                      placeholder="john@example.com"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- Phone Number -->
                  <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Phone Number <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      formControlName="phone"
                      placeholder="+91 99999 99999"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- Street Address -->
                  <div class="sm:col-span-2">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Street Address <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="street"
                      placeholder="123 Main St, Apartment or Suite"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- City -->
                  <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      City <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="city"
                      placeholder="New Delhi"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- State -->
                  <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      State / Province <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="state"
                      placeholder="Delhi"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- Pincode -->
                  <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      ZIP / Postal Code <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="pincode"
                      placeholder="110001"
                      class="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-black font-semibold text-gray-900 transition-colors"
                    />
                  </div>

                  <!-- Country -->
                  <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Country <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      formControlName="country"
                      class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs focus:outline-none font-semibold text-gray-400 select-none"
                      readonly
                    />
                  </div>
                </div>

              </form>

              <!-- Continue CTA -->
              <div *ngIf="currentStep === 1" class="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  (click)="proceedToPayment()" 
                  class="bg-black text-white px-8 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:hover:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2 focus:outline-none"
                >
                  Continue to Payment <i class="bi bi-arrow-right"></i>
                </button>
              </div>

              <!-- Saved Address Summary (visible in Step 2) -->
              <div 
                *ngIf="currentStep > 1" 
                class="text-gray-600 text-xs ml-11 bg-[#fbfbfb] p-5 rounded-lg border border-gray-200/80 space-y-1 animate-fade-in"
              >
                <p class="font-bold text-gray-900 mb-1.5">{{ addressForm.get('name')?.value }}</p>
                <p>{{ addressForm.get('street')?.value }}</p>
                <p>{{ addressForm.get('city')?.value }}, {{ addressForm.get('state')?.value }} {{ addressForm.get('pincode')?.value }}</p>
                <div class="pt-2 flex flex-col gap-1 text-gray-400 font-medium">
                  <span><i class="bi bi-envelope mr-1.5"></i> {{ addressForm.get('email')?.value }}</span>
                  <span><i class="bi bi-telephone mr-1.5"></i> {{ addressForm.get('phone')?.value }}</span>
                </div>
              </div>
            </div>

            <!-- STEP 2: PAYMENT METHOD -->
            <div 
              class="bg-white border border-gray-200/80 rounded-xl p-8 transition-all duration-300 relative overflow-hidden"
              [class.opacity-60]="currentStep !== 2"
            >
              <!-- Inactive Click Overlay -->
              <div *ngIf="currentStep !== 2" class="absolute inset-0 z-10 cursor-not-allowed"></div>

              <h2 class="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-4 mb-8">
                <span 
                  class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                  [class.bg-black]="currentStep === 2"
                  [class.text-white]="currentStep === 2"
                  [class.border]="currentStep !== 2"
                  [class.border-gray-200]="currentStep !== 2"
                  [class.text-gray-400]="currentStep !== 2"
                >
                  2
                </span>
                Payment Method
              </h2>

              <div *ngIf="currentStep === 2" class="animate-fade-in">
                <!-- Paused Orders Notice -->
                <div 
                  *ngIf="shopConfig?.orderAcceptance === 'paused'" 
                  class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-left animate-fade-in"
                >
                  <div class="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <i class="bi bi-pause-fill text-lg"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-red-900 text-xs uppercase tracking-wider mb-1">Orders Temporarily Paused</h4>
                    <p class="text-red-700 text-xs leading-relaxed">This store is temporarily not accepting new orders. Please check back later or contact the shop directly.</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <!-- Pay Online Option -->
                  <label 
                    *ngIf="shopConfig?.paymentModes?.online !== false"
                    class="relative flex flex-col p-6 border rounded-xl cursor-pointer hover:bg-gray-50/50 transition-all text-left"
                    [class.border-black]="paymentMethod === 'online'"
                    [class.bg-[#fbfbfb]]="paymentMethod === 'online'"
                    [class.border-gray-200]="paymentMethod !== 'online'"
                  >
                    <div class="flex justify-between items-start mb-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="online"
                        [(ngModel)]="paymentMethod"
                        class="h-4 w-4 text-black focus:ring-black border-gray-300 pointer-events-none"
                      />
                      <i 
                        class="bi bi-credit-card-2-front text-xl"
                        [class.text-black]="paymentMethod === 'online'"
                        [class.text-gray-400]="paymentMethod !== 'online'"
                      ></i>
                    </div>
                    <div>
                      <span class="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Pay Online</span>
                      <span class="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Credit Card, UPI, Wallets</span>
                    </div>
                  </label>

                  <!-- COD Option -->
                  <label 
                    *ngIf="shopConfig?.paymentModes?.cod !== false"
                    class="relative flex flex-col p-6 border rounded-xl cursor-pointer hover:bg-gray-50/50 transition-all text-left"
                    [class.border-black]="paymentMethod === 'cod'"
                    [class.bg-[#fbfbfb]]="paymentMethod === 'cod'"
                    [class.border-gray-200]="paymentMethod !== 'cod'"
                  >
                    <div class="flex justify-between items-start mb-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cod"
                        [(ngModel)]="paymentMethod"
                        class="h-4 w-4 text-black focus:ring-black border-gray-300 pointer-events-none"
                      />
                      <i 
                        class="bi bi-cash-coin text-xl"
                        [class.text-black]="paymentMethod === 'cod'"
                        [class.text-gray-400]="paymentMethod !== 'cod'"
                      ></i>
                    </div>
                    <div>
                      <span class="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Cash on Delivery</span>
                      <span class="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pay when you receive</span>
                    </div>
                  </label>

                  <!-- Bank Transfer Option -->
                  <label 
                    *ngIf="shopConfig?.paymentModes?.bankTransfer"
                    class="relative flex flex-col p-6 border rounded-xl cursor-pointer hover:bg-gray-50/50 transition-all text-left"
                    [class.border-black]="paymentMethod === 'bankTransfer'"
                    [class.bg-[#fbfbfb]]="paymentMethod === 'bankTransfer'"
                    [class.border-gray-200]="paymentMethod !== 'bankTransfer'"
                  >
                    <div class="flex justify-between items-start mb-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="bankTransfer"
                        [(ngModel)]="paymentMethod"
                        class="h-4 w-4 text-black focus:ring-black border-gray-300 pointer-events-none"
                      />
                      <i 
                        class="bi bi-bank text-xl"
                        [class.text-black]="paymentMethod === 'bankTransfer'"
                        [class.text-gray-400]="paymentMethod !== 'bankTransfer'"
                      ></i>
                    </div>
                    <div>
                      <span class="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Bank Transfer</span>
                      <span class="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Direct manual transfer</span>
                    </div>
                  </label>
                </div>

                <!-- Payment details boxes -->
                <div 
                  class="p-5 bg-[#fbfbfb] rounded-xl border border-gray-200/80 mb-8 flex gap-4 text-xs font-medium text-gray-500"
                  *ngIf="paymentMethod === 'online'"
                >
                  <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm flex-shrink-0">
                    <i class="bi bi-lock-fill"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 mb-1 uppercase tracking-wider text-[10px]">Secure Online Payment</h4>
                    <p class="leading-relaxed">You will be redirected to our secure payment gateway to complete your transaction after clicking Place Order.</p>
                  </div>
                </div>

                <div 
                  class="p-5 bg-[#fbfbfb] rounded-xl border border-gray-200/80 mb-8 flex gap-4 text-xs font-medium text-gray-500"
                  *ngIf="paymentMethod === 'cod'"
                >
                  <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm flex-shrink-0">
                    <i class="bi bi-box-seam"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 mb-1 uppercase tracking-wider text-[10px]">Pay on Delivery</h4>
                    <p class="leading-relaxed">Please prepare exact change if possible. Our delivery representative will contact you prior to shipment delivery.</p>
                  </div>
                </div>

                <div 
                  class="p-5 bg-[#fbfbfb] rounded-xl border border-gray-200/80 mb-8 flex flex-col gap-4 text-xs font-medium text-gray-500 text-left animate-fade-in"
                  *ngIf="paymentMethod === 'bankTransfer'"
                >
                  <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm flex-shrink-0">
                      <i class="bi bi-bank2"></i>
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 mb-1 uppercase tracking-wider text-[10px]">Bank Transfer Details</h4>
                      <p class="leading-relaxed">Please transfer the total amount to the bank account below and place your order. Your order will be manually verified once the transfer is confirmed.</p>
                    </div>
                  </div>
                  
                  <div class="bg-white p-4 rounded-lg border border-gray-100 space-y-2 font-mono text-[11px] text-gray-800" *ngIf="shopConfig?.bankDetails">
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                      <span class="text-gray-400">Account Name:</span>
                      <span class="font-bold text-gray-900">{{ shopConfig?.bankDetails?.accountName }}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                      <span class="text-gray-400">Account Number:</span>
                      <span class="font-bold text-gray-900">{{ shopConfig?.bankDetails?.accountNumber }}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-100 pb-1">
                      <span class="text-gray-400">Bank Name:</span>
                      <span class="font-bold text-gray-900">{{ shopConfig?.bankDetails?.bankName }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">IFSC Code:</span>
                      <span class="font-bold text-gray-900">{{ shopConfig?.bankDetails?.ifscCode }}</span>
                    </div>
                  </div>
                  <div class="text-red-500 font-semibold" *ngIf="!shopConfig?.bankDetails">
                    <i class="bi bi-exclamation-triangle-fill"></i> Bank details are not configured by the merchant. Please choose another payment method.
                  </div>
                </div>

                <!-- Buttons -->
                <div class="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <button 
                    (click)="currentStep = 1"
                    class="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors focus:outline-none"
                  >
                    Back
                  </button>
                  
                  <button 
                    (click)="placeOrder()" 
                    [disabled]="loading || shopConfig?.orderAcceptance === 'paused' || (paymentMethod === 'bankTransfer' && !shopConfig?.bankDetails)"
                    class="bg-black text-white px-10 py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50 transition-opacity flex items-center gap-3 focus:outline-none"
                  >
                    <span 
                      *ngIf="loading" 
                      class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  <i class="bi bi-check2-circle text-sm" *ngIf="!loading"></i>
                  {{ loading ? 'Processing...' : 'Place Order' }}
                </button>
              </div>

              <!-- Error Message -->
              <p 
                *ngIf="error" 
                class="text-red-500 text-xs mt-6 bg-red-50 p-4 rounded-lg border border-red-100/50 flex gap-2 font-semibold"
              >
                <i class="bi bi-exclamation-triangle"></i>
                <span>{{ error }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Right: Summary -->
        <div class="lg:w-[40%] w-full space-y-6">
          <div class="border border-gray-200/80 rounded-xl p-8 bg-white shadow-sm sticky top-28">
            <h2 class="text-xs font-bold text-gray-900 text-center uppercase tracking-widest mb-8 pb-4 border-b border-gray-100">
              Order Summary
            </h2>

            <!-- Summary items scroll area -->
            <div class="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 divide-y divide-gray-100/50 text-left">
              <div *ngFor="let item of cartItems$ | async; let isFirst = first" class="flex gap-4 group" [class.pt-4]="!isFirst">
                <!-- Thumbnail -->
                <div class="w-16 h-22 bg-[#f8f9ff] rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden relative">
                  <img [src]="(item.product.images[0] | optimizeImage:'thumbnail') || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                  <span class="absolute -top-1.5 -right-1.5 bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-sm z-10">
                    {{ item.quantity }}
                  </span>
                </div>
                
                <!-- Details -->
                <div class="flex-grow flex flex-col justify-center text-left">
                  <p class="text-[11px] font-bold text-gray-900 leading-tight mb-1">
                    {{ item.product.name }}
                  </p>
                  <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5" *ngIf="item.variant">
                    <span *ngIf="item.variant.color">{{ item.variant.color }}</span>
                    <span *ngIf="item.variant.color && item.variant.size"> / </span>
                    <span *ngIf="item.variant.size">{{ item.variant.size }}</span>
                  </p>
                  <div class="text-[11px] font-bold text-gray-900">
                    {{ (item.variant?.price || item.product.variants[0]?.price) * item.quantity | currency: 'INR' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Pricing totals -->
            <div class="border-t border-gray-100 pt-6 space-y-4 text-xs font-semibold text-gray-500">
              <div class="flex justify-between items-center">
                <span>Subtotal</span>
                <span class="text-gray-900">{{ cartTotal$ | async | currency: 'INR' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Shipping</span>
                <span class="text-black uppercase tracking-widest text-[9px] font-bold">Complimentary</span>
              </div>
              
              <!-- Store Credit Applied -->
              <div *ngIf="creditBalance > 0 && creditApplied > 0" class="flex justify-between items-center text-violet-600 font-bold bg-violet-50 p-2 rounded">
                <span class="flex items-center gap-1.5"><i class="bi bi-wallet2"></i> Store Credit Applied</span>
                <span>-{{ creditApplied | currency: 'INR' }}</span>
              </div>
              <div *ngIf="creditBalance > 0" class="text-[10px] text-gray-400 font-medium text-right -mt-2">
                Remaining Balance: {{ (creditBalance - creditApplied) | currency: 'INR' }}
              </div>
              
              <!-- Divider total -->
              <div class="flex justify-between items-end pt-6 border-t border-gray-100 mt-2">
                <span class="font-bold text-gray-900">Total Due</span>
                <span class="font-black text-2xl text-gray-900 leading-none">
                  {{ finalTotalDue$ | async | currency: 'INR' }}
                </span>
              </div>
            </div>

            <!-- SSL security tag centered -->
            <div class="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 font-bold tracking-widest uppercase text-[9px]">
              <i class="bi bi-shield-lock-fill text-gray-900"></i>
              <span>256-Bit SSL Secured Connection</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  `,
})
export class CheckoutComponent implements OnInit {
  currentStep = 1;
  addressForm: FormGroup;
  paymentMethod: 'cod' | 'online' | 'bankTransfer' = 'cod';
  shopConfig: ShopConfig | null = null;

  cartItems$: Observable<any>;
  cartTotal$: Observable<number>;

  loading = false;
  error = '';
  shopId: string | null = null;
  currentUserId: string | null = null;

  creditBalance = 0;

  creditApplied = 0;
  savedAddresses: any[] = [];
  selectedAddressIndex: number = -1;


  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private customerService: CustomerService,
    private authService: AuthService,
    private customerCreditService: CustomerCreditService,
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService,
    private shopContextService: ShopContextService,
  ) {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartService.cartTotal$;

    this.addressForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', Validators.required],
      country: ['India', Validators.required],
    });
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    // Check if cart is empty
    if (this.cartService.getCurrentItems().length === 0) {
      this.router.navigate([...this.routePrefix, 'cart']);
    }

    // Subscribe to Shop Config to get accurate Shop ID
    this.shopContextService.shopConfig$.subscribe((config: ShopConfig | null) => {
      this.shopConfig = config;
      if (config && config.id) {
        this.shopId = config.id;
        this.initializePaymentMethod(config);
        console.log('Checkout context resolved to Shop ID:', this.shopId);
      } else {
        console.warn('Shop context not resolved. Checkout might fail or fallback.');
      }
    });

    let user: any;
    this.authService.currentUser$.subscribe(u => user = u).unsubscribe();
    this.currentUserId = user?.uid || null;

    if (this.currentUserId) {
      const authUser = this.authService.currentUserValue;
      if (authUser?.addresses && authUser.addresses.length > 0) {
        this.savedAddresses = authUser.addresses;
        // Auto-select default if exists
        const defaultIndex = this.savedAddresses.findIndex(a => a.isDefault);
        if (defaultIndex !== -1) {
          this.selectSavedAddress(this.savedAddresses[defaultIndex]);
        }
      } else {
        this.addressForm.patchValue({
          name: user?.displayName,
          email: user?.email,
          phone: user?.mobile,
        });
      }
    }
  }

  initializePaymentMethod(config: ShopConfig) {
    if (config.paymentModes) {
      if (config.paymentModes.cod) {
        this.paymentMethod = 'cod';
      } else if (config.paymentModes.online) {
        this.paymentMethod = 'online';
      } else if (config.paymentModes.bankTransfer) {
        this.paymentMethod = 'bankTransfer';
      }
    }
  }


  selectSavedAddress(addr: any) {
    this.selectedAddressIndex = this.savedAddresses.indexOf(addr);
    const user = this.authService.currentUserValue;
    this.addressForm.patchValue({
      name: addr.name,
      email: user?.email || '',
      phone: addr.phone,
      street: addr.addressLine1 + (addr.addressLine2 ? ', ' + addr.addressLine2 : ''),
      city: addr.city,
      state: addr.state,
      pincode: addr.postalCode,
      country: addr.country || 'India'
    });
  }

  selectNewAddress() {
    this.selectedAddressIndex = -1;
    const user = this.authService.currentUserValue;
    this.addressForm.reset({
      name: user?.['displayName'] || '',
      email: user?.email || '',
      phone: user?.mobile || '',
      country: 'India'
    });
  }

  proceedToPayment() {
    if (this.addressForm.valid) {
      this.currentStep = 2;
      this.fetchCustomerCredit();
    } else {
      this.addressForm.markAllAsTouched();
      this.selectedAddressIndex = -1; // Expand the form so they can see validation errors
    }
  }

  fetchCustomerCredit() {
    if (!this.shopId) return;
    const formValues = this.addressForm.value;
    this.customerService.findCustomer(this.shopId, formValues.phone, formValues.email, this.currentUserId || undefined).subscribe({
      next: (res) => {
        if (res.data) {
          this.customerCreditService.getCustomerCredit(this.shopId!, res.data.id!).subscribe({
            next: (ccRes) => {
              if (ccRes.data) {
                this.creditBalance = ccRes.data.balance || 0;
                this.calculateCreditApplied();
              }
            }
          });
        }
      }
    });
  }

  calculateCreditApplied() {
    this.cartTotal$.subscribe(total => {
      this.creditApplied = Math.min(total, this.creditBalance);
    });
  }

  get finalTotalDue$(): Observable<number> {
    return this.cartTotal$.pipe(
      map(total => {
        const applied = Math.min(total, this.creditBalance);
        return total - applied;
      })
    );
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async placeOrder() {
    if (this.shopConfig?.orderAcceptance === 'paused') {
      this.error = 'Orders are temporarily paused for this shop.';
      return;
    }
    if (this.paymentMethod === 'bankTransfer' && !this.shopConfig?.bankDetails) {
      this.error = 'Bank details are not configured by the merchant. Please select another payment method.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValues = this.addressForm.value;
      const cartItems = this.cartService.getCurrentItems();
      const totalAmount = await firstValueFrom(this.cartTotal$);

      // 1. Resolve Shop ID (Crucial step)
      let finalShopId = this.shopId || 'shop_default';

      // 2. Customer Deduplication Logic
      let customerId: string;

      // Check if customer exists by phone
      try {
        const existingCustomerRes = await firstValueFrom(
          this.customerService.findCustomer(finalShopId, formValues.phone, formValues.email, this.currentUserId || undefined),
        );

        if (existingCustomerRes.data) {
          customerId = existingCustomerRes.data.id!;
          console.log('Found existing customer:', customerId);
        } else {
          throw new Error('Customer not found (null data)');
        }
      } catch (err: any) {
        if (err.status === 404 || err.message === 'Customer not found (null data)') {
          console.log('Customer not found, creating new customer...');
          const newCustomer = await firstValueFrom(
            this.customerService.createCustomer({
              shopId: finalShopId,
              name: formValues.name,
              phoneNumber: formValues.phone,
              email: formValues.email,
              source: 'online',
              userId: this.currentUserId || undefined,
              totalOrders: 0,
              totalSpent: 0,
              lastPurchase: new Date(),
            }),
          );
          customerId = newCustomer.data.id!;
        } else {
          console.error('Error verifying customer:', err);
          throw new Error('Could not verify customer details. Please try again.');
        }
      }

      // 3. Create Order
      const orderData: any = {
        shopId: finalShopId,
        customerId: customerId,
        products: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.variant?.price || item.product.variants[0]?.price,
          imageUrl: item.product.images?.[0] || '',
          variant: item.variant
            ? {
                size: item.variant.size,
                color: item.variant.color,
              }
            : undefined,
        })),
        totalAmount: totalAmount,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        paymentMethod: this.paymentMethod,
        shippingAddress: formValues,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdOrder = await firstValueFrom(this.orderService.createOrder(orderData));

      if (createdOrder.success && createdOrder.data) {
        const orderId = createdOrder.data.id;
        const razorpayOrderId = (createdOrder.data as any).razorpayOrderId;
        const keyId = this.shopConfig?.razorpay?.keyId;

        // If the order was completely paid by credit, totalAmount is 0 and method is 'credit'
        if (createdOrder.data.paymentStatus === 'paid' && (createdOrder.data.paymentMethod as string) === 'credit') {
          setTimeout(() => {
            this.cartService.clearCart();
            this.router.navigate([...this.routePrefix, 'track', orderId]);
          }, 800);
          return;
        }

        if (this.paymentMethod === 'online' && razorpayOrderId && keyId) {
          const scriptLoaded = await this.loadRazorpayScript();
          if (!scriptLoaded) {
            this.error = 'Failed to load payment gateway. Please try again.';
            this.loading = false;
            return;
          }

          const options = {
            key: keyId,
            amount: Math.round(createdOrder.data.totalAmount * 100),
            currency: 'INR',
            name: this.shopConfig?.displayName || this.shopConfig?.shopName || 'Clothify Store',
            description: `Order Payment #${orderId.slice(-8).toUpperCase()}`,
            order_id: razorpayOrderId,
            handler: async (response: any) => {
              this.loading = true;
              this.error = '';
              try {
                const verifyRes = await firstValueFrom(
                  this.orderService.verifyPayment(orderId, {
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                  })
                );

                if ((verifyRes as any).success) {
                  this.cartService.clearCart();
                  this.router.navigate([...this.routePrefix, 'track', orderId]);
                } else {
                  throw new Error((verifyRes as any).message || 'Payment verification failed');
                }
              } catch (err: any) {
                this.error = err.message || 'Payment verification failed. Please contact support.';
                this.loading = false;
              }
            },
            prefill: {
              name: formValues.name,
              email: formValues.email,
              contact: formValues.phone,
            },
            theme: {
              color: this.shopConfig?.theme?.primaryColor || '#000000',
            },
            modal: {
              ondismiss: () => {
                this.error = 'Payment was cancelled. You can try placing the order again.';
                this.loading = false;
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // COD or Bank Transfer
          setTimeout(() => {
            this.cartService.clearCart();
            this.router.navigate([...this.routePrefix, 'track', orderId]);
          }, 800);
        }
      } else {
        throw new Error((createdOrder as any).message || 'Failed to create order');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      this.error = err.message || 'An unexpected error occurred during checkout.';
      this.loading = false;
    }
  }
}
