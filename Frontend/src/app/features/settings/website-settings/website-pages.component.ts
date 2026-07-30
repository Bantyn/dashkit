import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Shop } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';

interface PageConfig {
  key: 'home' | 'products' | 'offers' | 'contact' | 'shippingPolicy' | 'returnPolicy' | 'termsAndConditions' | 'privacyPolicy';
  label: string;
  desc: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'app-website-pages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-primary-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Pages</h2>
            <p class="text-sm text-gray-500 mt-1">
              Choose which pages are visible on your public website.
            </p>
          </div>
          <button
            (click)="onSave()"
            [disabled]="saving || loading"
            class="px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
          >
            @if (saving) {
              <div
                class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"
              ></div>
            }
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

        @if (loading) {
          <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        } @else {
          <form [formGroup]="form">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <!-- Left Panel: Form -->
              <div class="lg:col-span-7" formGroupName="pages">
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                  @for (page of pages; track page.key) {
                    <div class="flex flex-col p-5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                          <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center ' + page.iconBg">
                            <i [class]="'bi ' + page.icon + ' text-lg ' + page.iconColor"></i>
                          </div>
                          <div>
                            <p class="font-semibold text-sm text-gray-900">{{ page.label }}</p>
                            <p class="text-xs text-gray-400">{{ page.desc }}</p>
                          </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" [formControlName]="page.key" class="sr-only peer" />
                          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <!-- Expandable content editor for policy pages -->
                      @if (isPolicyPage(page.key) && form.get('pages.' + page.key)?.value) {
                        <div class="mt-4 pl-14">
                          <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Custom Page Content (Raw Text)</label>
                          <textarea 
                            [formControlName]="page.key + 'Content'" 
                            rows="6" 
                            placeholder="Enter your custom policy content here... Leave empty to display default {{ shopName }} premium template." 
                            class="w-full text-xs text-gray-700 bg-primary-50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-primary-400 focus:bg-white transition-all resize-y"
                          ></textarea>
                          <p class="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                            <i class="bi bi-info-circle"></i> Supports paragraph text. If left blank, it will reset back to the default beautiful template design.
                          </p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Right Panel: Live Mockup -->
              <div class="lg:col-span-5 relative">
                <div class="sticky top-6">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="bi bi-laptop text-gray-500"></i> Live Preview
                  </h3>
                  
                  <div class="bg-white rounded-3xl border-4 border-gray-200 shadow-xl overflow-hidden flex flex-col h-[500px]">
                    
                    <!-- Browser Header -->
                    <div class="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200 shrink-0">
                      <div class="flex gap-1.5">
                        <div class="w-3 h-3 rounded-full bg-red-400"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div class="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div class="mx-auto bg-white px-6 py-1 rounded-full text-[10px] text-gray-400 font-mono flex items-center gap-2 shadow-sm border border-gray-200">
                        <i class="bi bi-lock-fill text-gray-300"></i> yourshop.clothify.com
                      </div>
                    </div>

                    <!-- Mockup Content -->
                    <div class="flex-1 bg-primary-50 flex flex-col justify-between overflow-y-auto relative">
                      
                      <!-- Header/Nav Mockup -->
                      <div class="bg-white border-b border-gray-100 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 shrink-0">
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <i class="bi bi-shop text-[10px] text-gray-400"></i>
                          </div>
                          <div class="h-2 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                        <div class="flex gap-3 text-[9px] font-bold text-gray-500">
                          <!-- Main Nav Links based on state -->
                          @if (form.get('pages.home')?.value) { <span class="text-primary-600">Home</span> }
                          @if (form.get('pages.products')?.value) { <span>Products</span> }
                          @if (form.get('pages.offers')?.value) { <span>Offers</span> }
                          @if (form.get('pages.contact')?.value) { <span>Contact</span> }
                        </div>
                      </div>

                      <!-- Main Body Mockup -->
                      <div class="p-6 text-center space-y-4">
                        <div class="w-3/4 mx-auto h-4 bg-gray-200 rounded-full mb-6"></div>
                        
                        <!-- Grid representing products or main content -->
                        <div class="grid grid-cols-2 gap-3">
                          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 h-24"></div>
                          <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 h-24"></div>
                        </div>
                      </div>

                      <!-- Footer Mockup -->
                      <div class="bg-gray-900 p-6 shrink-0 mt-auto">
                        <div class="h-2 w-20 bg-gray-700 rounded-full mb-4"></div>
                        
                        <div class="flex flex-col gap-2 mb-6 text-[9px] text-gray-400">
                          @if (form.get('pages.shippingPolicy')?.value) { <span>Shipping Policy</span> }
                          @if (form.get('pages.returnPolicy')?.value) { <span>Return Policy</span> }
                          @if (form.get('pages.termsAndConditions')?.value) { <span>Terms & Conditions</span> }
                          @if (form.get('pages.privacyPolicy')?.value) { <span>Privacy Policy</span> }
                        </div>
                        <div class="h-1 w-full bg-gray-800 rounded-full mb-2"></div>
                        <div class="h-1 w-1/3 bg-gray-800 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </form>
        }
      </main>
    </div>
  `,
})
export class WebsitePagesComponent implements OnInit {
  shopId: string | null = null;
  form: FormGroup;
  loading = true;
  saving = false;

  pages: PageConfig[] = [
    {
      key: 'home',
      label: 'Home',
      desc: 'Landing page with banner, featured products and announcements',
      icon: 'bi-house-door-fill',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      key: 'products',
      label: 'Products',
      desc: 'Browse and search your product catalog',
      icon: 'bi-bag-fill',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      key: 'offers',
      label: 'Offers',
      desc: 'Promotions, discounts and coupon codes',
      icon: 'bi-tag-fill',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      key: 'contact',
      label: 'Contact',
      desc: 'Store address, phone number, hours and location map',
      icon: 'bi-telephone-fill',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      key: 'shippingPolicy',
      label: 'Shipping Policy',
      desc: 'Delivery timelines, shipping partners and fee structure',
      icon: 'bi-truck',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      key: 'returnPolicy',
      label: 'Return & Exchange Policy',
      desc: 'Return window, exchange process and refund terms',
      icon: 'bi-arrow-counterclockwise',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      key: 'termsAndConditions',
      label: 'Terms & Conditions',
      desc: 'Legal terms governing store usage and sales',
      icon: 'bi-file-text',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      key: 'privacyPolicy',
      label: 'Privacy Policy',
      desc: 'How you handle customer data and privacy',
      icon: 'bi-shield-lock',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      pages: this.fb.group({
        home: [false],
        products: [false],
        offers: [false],
        contact: [false],
        shippingPolicy: [false],
        returnPolicy: [false],
        termsAndConditions: [false],
        privacyPolicy: [false],
        shippingPolicyContent: [''],
        returnPolicyContent: [''],
        termsAndConditionsContent: [''],
        privacyPolicyContent: [''],
      }),
    });
  }

  shopName = '';

  isPolicyPage(key: string): boolean {
    return ['shippingPolicy', 'returnPolicy', 'termsAndConditions', 'privacyPolicy'].includes(key);
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res: any) => {
        const shop: Shop = res.data;
        this.shopName = shop.displayName || shop.shopName || 'Shop';
        this.form.patchValue({ pages: shop.pages || {} });
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.showError(err?.error?.message || 'Failed to load website pages settings.');
      },
    });
  }

  onSave() {
    if (!this.shopId) return;
    this.saving = true;
    this.shopService.updateShop(this.shopId, this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.showSuccess('Website pages updated successfully!');
      },
      error: (err: any) => {
        this.saving = false;
        this.toastService.showError(err?.error?.message || 'Failed to update website pages.');
      },
    });
  }
}
