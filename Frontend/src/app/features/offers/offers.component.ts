import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Offer } from '../../core/models/offer.model';
import { OfferService } from '../../core/services/offer.service';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ToastService } from '../../core/services/toast.service';
import { getLocalISODate } from '../../core/utils/date.utils';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { UiDatePickerComponent } from '../../shared/components/ui-date-picker.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox.component';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    UiLoadingComponent,
    UiDatePickerComponent,
    CheckboxComponent,
  ],
  template: `
    <div class="flex-1 overflow-y-auto bg-[#f5f7fa] h-full text-left">
      <main class="p-8 max-w-full mx-auto space-y-6">
        
        <!-- Page Header -->
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shrink-0">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Offers & Discounts</h1>
            <p class="text-sm text-gray-500 mt-1">
              Manage sales, coupons, and promotional campaigns
            </p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative flex-grow sm:flex-grow-0 sm:w-64">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search offers..."
                class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all"
              />
              <i class="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
            <button
              *ngIf="activeTab !== 'create_offer'"
              (click)="activeTab = 'create_offer'"
              class="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap shadow-sm flex items-center gap-2"
            >
              <i class="bi bi-plus-lg"></i> Create Offer
            </button>
          </div>
        </header>

        <!-- Tabs -->
        <div class="bg-white px-6 py-1 rounded-2xl border border-gray-100 shadow-sm shrink-0">
          <nav class="flex gap-6">
            <button
              *ngFor="let tab of tabs"
              (click)="activeTab = tab.id"
              [class.text-primary-600]="activeTab === tab.id"
              [class.border-primary-600]="activeTab === tab.id"
              [class.font-semibold]="activeTab === tab.id"
              [class.text-gray-500]="activeTab !== tab.id"
              [class.border-transparent]="activeTab !== tab.id"
              class="py-3.5 text-sm font-medium border-b-2 transition-all -mb-px focus:outline-none"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Content Area -->
        <div [ngSwitch]="activeTab" class="space-y-6">
          <!-- 1. All Offers & Coupons Lists -->
          <div *ngSwitchCase="'all_offers'">
            <ng-container *ngTemplateOutlet="offersList; context: { type: null }"></ng-container>
          </div>
          <div *ngSwitchCase="'coupons'">
            <ng-container
              *ngTemplateOutlet="offersList; context: { type: 'coupon' }"
            ></ng-container>
          </div>

          <!-- 2. Create Offer -->
          <div *ngSwitchCase="'create_offer'">
            <div class="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 max-w-full mx-auto shadow-sm">
              <h3 class="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Create New Offer
              </h3>

              <form [formGroup]="offerForm" (ngSubmit)="onSubmit()" class="space-y-6">
                <!-- Offer Type Selection -->
                <div>
                  <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Offer Type
                  </label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      *ngFor="let type of offerTypes"
                      (click)="setOfferType(type.id)"
                      [class.border-primary-500]="offerForm.get('type')?.value === type.id"
                      [class.bg-primary-50/20]="offerForm.get('type')?.value === type.id"
                      [class.border-gray-200]="offerForm.get('type')?.value !== type.id"
                      class="border p-4 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-gray-50/50 transition-all text-left"
                    >
                      <div class="text-sm font-bold text-gray-900 mb-1">{{ type.label }}</div>
                      <div class="text-xs text-gray-500 leading-relaxed">{{ type.description }}</div>
                    </div>
                  </div>
                </div>

                <!-- Offer Title -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-2">Offer Title</label>
                  <input
                    type="text"
                    formControlName="title"
                    class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                    placeholder="e.g. Summer Sale 2026"
                  />
                  <div
                    *ngIf="offerForm.get('title')?.touched && offerForm.get('title')?.invalid"
                    class="text-red-500 text-xs font-semibold mt-1.5"
                  >
                    Title is required
                  </div>
                </div>

                <!-- Dynamic Value / Min Order fields -->
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  *ngIf="
                    offerForm.get('type')?.value === 'percentage' ||
                    offerForm.get('type')?.value === 'flat'
                  "
                >
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2">
                      {{
                        offerForm.get('type')?.value === 'percentage'
                          ? 'Percentage (%)'
                          : 'Amount (₹)'
                      }}
                    </label>
                    <input
                      type="number"
                      formControlName="value"
                      class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2">Min Order Value</label>
                    <input
                      type="number"
                      formControlName="minCalculatedAmount"
                      class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <!-- Buy X Get Y fields -->
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  *ngIf="offerForm.get('type')?.value === 'buy_x_get_y'"
                >
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2">Buy Quantity (X)</label>
                    <input
                      type="number"
                      formControlName="buyX"
                      class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2">Get Free (Y)</label>
                    <input
                      type="number"
                      formControlName="getY"
                      class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                    />
                  </div>
                </div>

                <!-- Free Shipping field -->
                <div *ngIf="offerForm.get('type')?.value === 'free_shipping'">
                  <label class="block text-xs font-semibold text-gray-700 mb-2">Min Order Value for Free Shipping</label>
                  <input
                    type="number"
                    formControlName="minCalculatedAmount"
                    class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                  />
                </div>

                <!-- Coupon Code -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-2">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    formControlName="code"
                    class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 uppercase transition-colors"
                    placeholder="e.g. SUMMER26"
                  />
                  <p class="text-xs text-gray-400 mt-1.5 font-medium">Leave empty for automatic discount rules applied at checkout.</p>
                </div>

                <!-- Dates and limits -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <app-ui-date-picker
                      formControlName="startDate"
                      label="Start Date"
                    ></app-ui-date-picker>
                  </div>
                  <div>
                    <app-ui-date-picker
                      formControlName="endDate"
                      label="End Date"
                    ></app-ui-date-picker>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    formControlName="usageLimit"
                    class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium text-gray-900 transition-colors"
                    placeholder="Optional limit per customer"
                  />
                </div>

                <!-- Website Visibility Checkbox -->
                <div class="mt-8 flex items-center gap-3">
                  <app-checkbox formControlName="showOnWebsite" [size]="18" class="text-primary-600 mt-0.5"></app-checkbox>
                  <div>
                    <label class="text-sm font-bold text-gray-900">
                      Website Visibility (Marquee)
                    </label>
                    <p class="text-xs text-gray-500 mt-0.5">Check this to display the offer prominently on the announcement bar of your website.</p>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    (click)="activeTab = 'all_offers'"
                    class="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="offerForm.invalid || isSubmitting"
                    class="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm focus:outline-none"
                  >
                    {{ isSubmitting ? 'Creating...' : 'Create Offer' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- 4. Analytics -->
          <div *ngSwitchCase="'analytics'">
            <div class="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400">
              <i class="bi bi-bar-chart text-4xl mb-3 block text-gray-300"></i>
              <span class="text-sm font-bold uppercase tracking-widest">Analytics coming soon</span>
            </div>
          </div>
    <!-- Reusable List Template -->
    <ng-template #offersList let-type="type">
      <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div
          class="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
          *ngIf="type === 'coupon'"
        >
          <h3 class="text-sm font-bold text-gray-900">Active Coupons</h3>
          <p class="text-xs text-gray-400">Share these codes with your customers.</p>
        </div>

        <!-- Loading state -->
        <div
          *ngIf="isLoading"
          class="p-16 flex flex-col items-center justify-center gap-3 text-gray-400"
        >
          <app-ui-loading size="md"></app-ui-loading>
          <span class="text-xs font-semibold text-gray-400 animate-pulse">Loading offers...</span>
        </div>

        <!-- Empty state -->
        <div *ngIf="!isLoading && getFilteredOffers(type).length === 0" class="p-16 text-center flex flex-col items-center">
          <div
            class="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-4"
          >
            <i class="bi bi-tag text-2xl text-gray-400"></i>
          </div>
          <h3 class="text-gray-900 text-sm font-bold mb-1">No offers found</h3>
          <p class="text-gray-400 text-xs font-medium">Create a new offer or coupon code to get started.</p>
        </div>

        <!-- Table/Row List -->
        <div
          class="divide-y divide-gray-100"
          *ngIf="!isLoading && getFilteredOffers(type).length > 0"
        >
          <div
            *ngFor="let offer of getFilteredOffers(type)"
            class="p-6 hover:bg-gray-50/30 transition-colors"
          >
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div class="text-left">
                <div class="flex flex-wrap items-center gap-3.5 mb-2">
                  <!-- Badges -->
                  <span
                    *ngIf="offer.code"
                    class="font-mono px-2.5 py-0.5 border border-primary-600 text-primary-600 text-[10px] font-bold tracking-wider rounded-lg bg-primary-50/30 uppercase"
                  >
                    {{ offer.code }}
                  </span>
                  <span
                    *ngIf="!offer.code"
                    class="px-2.5 py-0.5 border border-gray-200 text-gray-500 text-[10px] font-bold tracking-wider rounded-lg bg-gray-50 uppercase"
                  >
                    Auto Apply
                  </span>
                  <h3 class="text-sm font-bold text-gray-800">{{ offer.title }}</h3>
                </div>
                
                <div class="text-xs font-semibold text-gray-500 space-x-2">
                  <span *ngIf="offer.type === 'percentage'" class="text-primary-600 bg-primary-50/20 px-2 py-0.5 rounded">{{ offer.value }}% OFF</span>
                  <span *ngIf="offer.type === 'flat'" class="text-primary-600 bg-primary-50/20 px-2 py-0.5 rounded">₹{{ offer.value }} OFF</span>
                  <span *ngIf="offer.type === 'buy_x_get_y'" class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Buy {{ offer.buyX }} Get {{ offer.getY }} Free</span>
                  <span *ngIf="offer.type === 'free_shipping'" class="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Free Shipping</span>
                  <span *ngIf="offer.minCalculatedAmount" class="text-gray-300">•</span>
                  <span *ngIf="offer.minCalculatedAmount">Min Order: ₹{{ offer.minCalculatedAmount }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <i class="bi bi-calendar-event text-xs"></i>
                  <span>{{ offer.startDate | date }} - {{ offer.endDate | date }}</span>
                </div>
              </div>

              <!-- Right-aligned Actions -->
              <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <!-- Usage Count -->
                <div class="text-right">
                  <div class="text-lg font-bold text-gray-900 leading-none mb-1">{{ offer.usedCount }}</div>
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Redemptions</div>
                </div>

                <!-- Toggle active status -->
                <button
                  (click)="toggleStatus(offer)"
                  class="text-xs font-semibold px-4 py-1.5 rounded-full border transition-all focus:outline-none"
                  [class.bg-primary-600]="offer.isActive"
                  [class.text-white]="offer.isActive"
                  [class.border-primary-600]="offer.isActive"
                  [class.bg-white]="!offer.isActive"
                  [class.text-gray-400]="!offer.isActive"
                  [class.border-gray-200]="!offer.isActive"
                >
                  {{ offer.isActive ? 'Active' : 'Inactive' }}
                </button>

                <!-- Delete button -->
                <button
                  (click)="deleteOffer(offer)"
                  class="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors focus:outline-none"
                  title="Delete Offer"
                >
                  <i class="bi bi-trash text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class OffersComponent implements OnInit {
  activeTab = 'all_offers';
  offers: Offer[] = [];
  isLoading = false;
  isSubmitting = false;
  shopId: string | undefined;
  searchQuery = '';

  tabs = [
    { id: 'all_offers', label: 'All Offers' },
    { id: 'create_offer', label: 'Create Offer' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'analytics', label: 'Analytics' },
  ];

  offerTypes = [
    { id: 'percentage', label: 'Percentage', description: 'e.g. 20% Off' },
    { id: 'flat', label: 'Flat Amount', description: 'e.g. ₹500 Off' },
    { id: 'buy_x_get_y', label: 'Buy X Get Y', description: 'e.g. Buy 2 Get 1' },
    { id: 'free_shipping', label: 'Free Shipping', description: 'Free delivery' },
  ];

  offerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private offerService: OfferService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.offerForm = this.fb.group({
      title: ['', Validators.required],
      type: ['percentage', Validators.required],
      value: [null],
      buyX: [null],
      getY: [null],
      minCalculatedAmount: [null],
      code: [null],
      startDate: [getLocalISODate(), Validators.required],
      endDate: [getLocalISODate(), Validators.required],
      usageLimit: [null],
      showOnWebsite: [true],
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadOffers();
      }
    });

    // Dynamic Validation based on type
    this.offerForm.get('type')?.valueChanges.subscribe((type) => {
      const valueControl = this.offerForm.get('value');
      const buyXControl = this.offerForm.get('buyX');
      const getYControl = this.offerForm.get('getY');

      valueControl?.clearValidators();
      buyXControl?.clearValidators();
      getYControl?.clearValidators();

      if (type === 'percentage' || type === 'flat') {
        valueControl?.setValidators([Validators.required, Validators.min(1)]);
      } else if (type === 'buy_x_get_y') {
        buyXControl?.setValidators([Validators.required, Validators.min(1)]);
        getYControl?.setValidators([Validators.required, Validators.min(1)]);
      }

      valueControl?.updateValueAndValidity();
      buyXControl?.updateValueAndValidity();
      getYControl?.updateValueAndValidity();
    });
  }

  loadOffers() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.offerService.getOffers(this.shopId).subscribe({
      next: (res) => {
        this.offers = res.data;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  getFilteredOffers(type: 'coupon' | null): Offer[] {
    if (type === 'coupon') {
      return this.offers.filter((o) => !!o.code);
    }
    return this.offers;
  }

  setOfferType(typeId: string) {
    this.offerForm.patchValue({ type: typeId });
  }

  onSubmit() {
    if (this.offerForm.invalid || !this.shopId) {
      this.offerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.offerForm.value;

    // Transform code to uppercase if present
    if (formVal.code) {
      formVal.code = formVal.code.toUpperCase();
    }

    const offerData: Partial<Offer> = {
      ...formVal,
      shopId: this.shopId,
    };

    this.offerService.createOffer(offerData).subscribe({
      next: (res) => {
        this.offers.unshift(res.data);
        this.isSubmitting = false;
        this.activeTab = 'all_offers';
        this.offerForm.reset({
          type: 'percentage',
          startDate: getLocalISODate(),
          endDate: getLocalISODate(),
          showOnWebsite: true,
        });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.toastService.showError('Failed to create offer');
      },
    });
  }

  toggleStatus(offer: Offer) {
    if (!offer.id) return;
    const newStatus = !offer.isActive;
    // Optimistic update
    offer.isActive = newStatus;

    this.offerService.updateOffer(offer.id, { isActive: newStatus }).subscribe({
      error: (err) => {
        console.error('Error updating status:', err);
        this.toastService.showError('Failed to update status');
        offer.isActive = !newStatus; // Revert on error
      },
    });
  }

  async deleteOffer(offer: Offer) {
    if (!offer.id) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Offer?',
      description: `Are you sure you want to delete the offer "<strong>${offer.title}</strong>"?`,
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.offerService.deleteOffer(offer.id).subscribe({
      next: () => this.loadOffers(),
      error: () => this.toastService.showError('Failed to delete offer'),
    });
  }
}
