import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Shop } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader.component';
import { FeatureGuardService } from '../../../core/services/feature-guard.service';

@Component({
  selector: 'app-website-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiDropdownComponent, ImageUploaderComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 h-full">
      <main class="p-8">
        <div class="mx-auto max-w-full">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Website Settings</h2>
              <p class="text-sm text-gray-500">Manage your public shop website configuration.</p>
            </div>
            <button
              (click)="onSubmit()"
              [disabled]="form.invalid || saving || loading"
              class="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          } @else {
            <div class="space-y-6">
              <!-- Visibility & Subdomain -->
              <div class="card p-8">
                <form [formGroup]="form" class="space-y-6">
                  <!-- Enabled Toggle -->
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p class="font-bold text-gray-900">Enable Public Website</p>
                      <p class="text-sm text-gray-500">
                        Allow customers to visit your shop online.
                      </p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        formControlName="websiteEnabled"
                        class="sr-only peer"
                      />
                      <div
                        class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                      ></div>
                    </label>
                  </div>

                  <!-- Debug: Swap Plan -->
                  <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
                    <p class="font-bold text-yellow-800 mb-2">Dev: Swap Plan</p>
                    <app-ui-dropdown
                      formControlName="subscriptionPlan"
                      [options]="planOptions"
                    ></app-ui-dropdown>
                  </div>

                  <!-- Subdomain -->
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Subdomain</label>
                    <div class="flex items-center">
                      <input
                        type="text"
                        formControlName="subdomain"
                        class="flex-1 px-4 py-2 border border-r-0 border-gray-200 rounded-l-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="your-shop-name"
                      />
                      <span
                        class="px-4 py-2 bg-gray-100 border border-gray-200 rounded-r-lg text-gray-500"
                        >.clothify.com</span
                      >
                    </div>
                    <p *ngIf="subdomainError" class="text-red-500 text-sm mt-1">
                      {{ subdomainError }}
                    </p>
                    <p
                      *ngIf="subdomainAvailable && !subdomainError"
                      class="text-green-500 text-sm mt-1"
                    >
                      Subdomain is available!
                    </p>
                  </div>

                  <!-- Pages -->
                  <div formGroupName="pages">
                    <h4 class="font-bold text-gray-900 mb-4">Enabled Pages</h4>
                    <div class="space-y-3">
                      <label class="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          formControlName="home"
                          class="form-checkbox h-5 w-5 text-primary-600"
                        />
                        <span>Home Page</span>
                      </label>
                      @if (hasFeature('inv_product_listing')) {
                        <label class="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            formControlName="products"
                            class="form-checkbox h-5 w-5 text-primary-600"
                          />
                          <span>Products Page</span>
                        </label>
                      }
                      @if (hasFeature('sell_offers_discounts')) {
                        <label class="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            formControlName="offers"
                            class="form-checkbox h-5 w-5 text-primary-600"
                          />
                          <span>Offers Page</span>
                        </label>
                      }
                      <label class="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          formControlName="contact"
                          class="form-checkbox h-5 w-5 text-primary-600"
                        />
                        <span>Contact Page</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Theme Customizer -->
              @if (hasFeature('web_theme')) {
                <div class="card p-8" [formGroup]="form">
                  <div formGroupName="theme">
                    <h3 class="text-lg font-bold text-gray-900 mb-6">Theme Customization</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2"
                          >Primary Color</label
                        >
                        <div class="flex items-center gap-3">
                          <input
                            type="color"
                            formControlName="primaryColor"
                            class="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            formControlName="primaryColor"
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-lg uppercase"
                          />
                        </div>
                      </div>
                      <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2"
                          >Secondary Color</label
                        >
                        <div class="flex items-center gap-3">
                          <input
                            type="color"
                            formControlName="secondaryColor"
                            class="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            formControlName="secondaryColor"
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-lg uppercase"
                          />
                        </div>
                      </div>
                      <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2"
                          >Font Family</label
                        >
                        <app-ui-dropdown
                          formControlName="fontFamily"
                          [options]="fontOptions"
                        ></app-ui-dropdown>
                      </div>
                    </div>

                    <div class="mt-6">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <app-image-uploader
                            [images]="logoImages"
                            (imagesChange)="onLogoImagesChanged($event)"
                            [shopId]="shopId || ''"
                            [multiple]="false"
                            label="Logo Image"
                          ></app-image-uploader>
                        </div>
                        <div>
                          <app-image-uploader
                            [images]="bannerImages"
                            (imagesChange)="onBannerImagesChanged($event)"
                            [shopId]="shopId || ''"
                            [multiple]="false"
                            label="Banner Image"
                          ></app-image-uploader>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class WebsiteSettingsComponent implements OnInit {
  private featureService = inject(FeatureGuardService);

  hasFeature(key: string): boolean {
    return this.featureService.hasFeatureSync(this.shop, key);
  }

  shopId: string | null = null;
  shop: Shop | null = null;
  form: FormGroup;
  loading = true;
  saving = false;
  subdomainError: string | null = null;
  subdomainAvailable = false;
  logoImages: string[] = [];
  bannerImages: string[] = [];

  planOptions = [
    { value: 'free', label: 'Free', icon: 'layers', color: '#6B7280' },
    { value: 'plus', label: 'Plus (Path-based)', icon: 'layers', color: '#10B981' },
    { value: 'pro', label: 'Pro (Subdomain)', icon: 'layers', color: '#3B82F6' },
    { value: 'custom', label: 'Custom (Enterprise)', icon: 'layers', color: '#F59E0B' },
  ];

  fontOptions = [
    { value: 'Inter, sans-serif', label: 'Inter', icon: 'layers', color: '#6B7280' },
    { value: 'Roboto, sans-serif', label: 'Roboto', icon: 'layers', color: '#10B981' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans', icon: 'layers', color: '#3B82F6' },
    { value: "'Courier New', monospace", label: 'Courier New', icon: 'layers', color: '#EF4444' },
  ];

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      websiteEnabled: [false],
      subscriptionPlan: ['free'], // Added for dev testing
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      pages: this.fb.group({
        home: [true],
        products: [true],
        offers: [true],
        contact: [true],
      }),
      theme: this.fb.group({
        primaryColor: ['#000000'],
        secondaryColor: ['#ffffff'],
        fontFamily: ['Inter, sans-serif'],
        banner: [''],
        logo: [''],
      }),
    });

    // Subdomain availability check
    this.form
      .get('subdomain')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        if (value && this.form.get('subdomain')?.valid && value !== this.shop?.slug) {
          this.checkSubdomain(value);
        } else {
          this.subdomainAvailable = false;
          this.subdomainError = null;
        }
      });
  }

  ngOnInit() {
    // Get shopId from parent route if possible, or current route
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) {
        this.loadShopSettings();
      }
    });
  }

  loadShopSettings() {
    if (!this.shopId) return;
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res) => {
        this.shop = res.data;
        if (this.shop) {
          this.form.patchValue({
            websiteEnabled: this.shop.websiteEnabled,
            subscriptionPlan: this.shop.subscriptionPlan || 'free',
            subdomain: this.shop.slug, // Mapped to slug
            pages: this.shop.pages || { home: true, products: true, offers: true, contact: true },
            theme: this.shop.theme || { primaryColor: '#000000', secondaryColor: '#ffffff' },
          });
          this.logoImages = this.shop.theme?.logo ? [this.shop.theme.logo] : [];
          this.bannerImages = this.shop.theme?.banner ? [this.shop.theme.banner] : [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading shop settings:', err);
        this.loading = false;
        this.toastService.showError(err?.error?.message || 'Failed to load shop website settings.');
      },
    });
  }

  checkSubdomain(subdomain: string) {
    this.http.post(`${environment.apiUrl}/shops/check-subdomain`, { subdomain }).subscribe({
      next: () => {
        this.subdomainAvailable = true;
        this.subdomainError = null;
      },
      error: () => {
        this.subdomainAvailable = false;
        this.subdomainError = 'Subdomain is not available.';
        this.form.get('subdomain')?.setErrors({ unavailable: true });
      },
    });
  }

  onSubmit() {
    if (this.form.invalid || !this.shopId) return;

    this.saving = true;
    this.shopService.updateShop(this.shopId, this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.showSuccess('Website settings saved!');
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.toastService.showError('Failed to save settings.');
      },
    });
  }

  onLogoImagesChanged(urls: string[]) {
    this.logoImages = urls;
    this.form.get('theme.logo')?.setValue(urls[0] || '');
  }

  onBannerImagesChanged(urls: string[]) {
    this.bannerImages = urls;
    this.form.get('theme.banner')?.setValue(urls[0] || '');
  }
}
