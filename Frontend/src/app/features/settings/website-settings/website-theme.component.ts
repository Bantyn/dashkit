import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Shop } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';
import { UiDropdownComponent } from '../../../shared/components/ui-dropdown.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader.component';

@Component({
  selector: 'app-website-theme',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiDropdownComponent, ImageUploaderComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-primary-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Theme & Appearance</h2>
            <p class="text-sm text-gray-500 mt-1">
              Customize colors, fonts, logo, and banner for your shop website.
            </p>
          </div>
          <button
            (click)="onSave()"
            [disabled]="saving || loading"
            class="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
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
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- Left Panel: Settings Form -->
            <div class="lg:col-span-7 space-y-6">
              <form [formGroup]="form" class="space-y-6">
                
                <!-- Master Website Enable -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <h3 class="font-bold text-gray-900 text-base">Enable Public Website</h3>
                    <p class="text-sm text-gray-500">Allow customers to visit your shop online.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" formControlName="websiteEnabled" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div formGroupName="theme" class="space-y-6">
                  
                  <!-- Color Palettes -->
                  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <i class="bi bi-magic text-purple-500"></i> Pre-defined Palettes
                    </h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      @for (palette of predefinedPalettes; track palette.name) {
                        <button 
                          type="button" 
                          (click)="applyPalette(palette)"
                          class="flex flex-col items-center p-3 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer"
                        >
                          <div class="flex w-full h-8 rounded-lg overflow-hidden mb-2 border border-gray-100">
                            <div class="flex-1" [style.backgroundColor]="palette.primaryColor"></div>
                            <div class="flex-1" [style.backgroundColor]="palette.secondaryColor"></div>
                          </div>
                          <span class="text-xs font-medium text-gray-700">{{ palette.name }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Colors & Font -->
                  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2">
                      <i class="bi bi-palette-fill text-blue-500"></i> Custom Colors & Typography
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <!-- Primary Color -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <div class="flex items-center gap-3">
                          <input
                            type="color"
                            formControlName="primaryColor"
                            class="h-10 w-10 border-0 p-0 rounded-lg cursor-pointer flex-shrink-0"
                          />
                          <input
                            type="text"
                            formControlName="primaryColor"
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      </div>
                      <!-- Secondary Color -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                        <div class="flex items-center gap-3">
                          <input
                            type="color"
                            formControlName="secondaryColor"
                            class="h-10 w-10 border-0 p-0 rounded-lg cursor-pointer flex-shrink-0"
                          />
                          <input
                            type="text"
                            formControlName="secondaryColor"
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      </div>
                      <!-- Font -->
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                        <app-ui-dropdown
                          formControlName="fontFamily"
                          [options]="fontOptions"
                          placeholder="Select Font"
                        ></app-ui-dropdown>
                      </div>
                    </div>
                  </div>

                  <!-- Logo & Banner -->
                  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2">
                      <i class="bi bi-image-fill text-green-500"></i> Logo & Banner
                    </h3>
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
                      <p class="text-xs text-gray-400 mt-2">Recommended size: 1200 × 400 px</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <!-- Right Panel: Live Mockup -->
            <div class="lg:col-span-5 relative">
              <div class="sticky top-6">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i class="bi bi-laptop text-gray-500"></i> Live Preview
                </h3>
                
                <div class="bg-white rounded-3xl border-4 border-gray-200 shadow-xl overflow-hidden" [style.fontFamily]="currentTheme.fontFamily">
                  
                  <!-- Browser Header -->
                  <div class="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
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
                  <div class="relative bg-primary-50 h-[500px] overflow-y-auto">
                    
                    <!-- Banner -->
                    <div class="h-32 w-full bg-gray-200 relative">
                      @if (currentTheme.banner) {
                        <img [src]="currentTheme.banner" class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-400">
                          <i class="bi bi-image text-3xl opacity-50"></i>
                        </div>
                      }
                      <div class="absolute inset-0 bg-black/20"></div>
                    </div>

                    <!-- Navbar / Logo Area (overlapping banner slightly) -->
                    <div class="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-md p-3 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-100 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center">
                          @if (currentTheme.logo) {
                            <img [src]="currentTheme.logo" class="w-full h-full object-cover" />
                          } @else {
                            <i class="bi bi-shop text-gray-400"></i>
                          }
                        </div>
                        <span class="font-bold text-gray-800 text-sm">Your Store</span>
                      </div>
                      <div class="flex gap-3 text-gray-600">
                        <i class="bi bi-search text-sm"></i>
                        <i class="bi bi-bag text-sm relative">
                          <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-white" [style.backgroundColor]="currentTheme.primaryColor">2</span>
                        </i>
                      </div>
                    </div>

                    <!-- Main Content Mockup -->
                    <div class="p-4 mt-2">
                      <div class="text-center mb-6">
                        <h1 class="text-xl font-bold text-gray-900 mb-2">Welcome to our store</h1>
                        <p class="text-xs text-gray-500">Discover our latest collection tailored for you.</p>
                        <button class="mt-4 px-6 py-2 rounded-full text-sm font-semibold text-white shadow-md transition-all hover:opacity-90" [style.backgroundColor]="currentTheme.primaryColor">
                          Shop Now
                        </button>
                      </div>

                      <div class="flex justify-between items-end mb-3">
                        <h2 class="font-bold text-gray-800 text-sm">Featured Products</h2>
                        <p class="text-[10px] cursor-pointer font-semibold" [style.color]="currentTheme.primaryColor">View All</p>
                      </div>

                      <div class="grid grid-cols-2 gap-3">
                        <!-- Product Card 1 -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div class="h-24 w-full" [style.backgroundColor]="currentTheme.secondaryColor"></div>
                          <div class="p-3">
                            <h3 class="text-xs font-bold text-gray-800">Classic T-Shirt</h3>
                            <p class="text-[10px] text-gray-500 mb-2">Cotton blend</p>
                            <div class="flex justify-between items-center">
                              <span class="text-xs font-bold text-gray-900">₹250.00</span>
                              <button class="w-6 h-6 rounded-full flex items-center justify-center text-white" [style.backgroundColor]="currentTheme.primaryColor">
                                <i class="bi bi-plus text-xs"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        <!-- Product Card 2 -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div class="h-24 w-full" [style.backgroundColor]="currentTheme.secondaryColor"></div>
                          <div class="p-3">
                            <h3 class="text-xs font-bold text-gray-800">Denim Jeans</h3>
                            <p class="text-[10px] text-gray-500 mb-2">Slim fit</p>
                            <div class="flex justify-between items-center">
                              <span class="text-xs font-bold text-gray-900">₹450.00</span>
                              <button class="w-6 h-6 rounded-full flex items-center justify-center text-white" [style.backgroundColor]="currentTheme.primaryColor">
                                <i class="bi bi-plus text-xs"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>

          </div>
        }
      </main>
    </div>
  `,
})
export class WebsiteThemeComponent implements OnInit {
  shopId: string | null = null;
  form: FormGroup;
  loading = true;
  saving = false;
  logoImages: string[] = [];
  bannerImages: string[] = [];

  predefinedPalettes = [
    { name: 'Default', primaryColor: '#000000', secondaryColor: '#ffffff' },
    { name: 'Ocean', primaryColor: '#0284c7', secondaryColor: '#e0f2fe' },
    { name: 'Forest', primaryColor: '#166534', secondaryColor: '#dcfce3' },
    { name: 'Berry', primaryColor: '#9d174d', secondaryColor: '#fce7f3' },
    { name: 'Sunset', primaryColor: '#c2410c', secondaryColor: '#ffedd5' },
    { name: 'Royal', primaryColor: '#4338ca', secondaryColor: '#e0e7ff' },
    { name: 'Midnight', primaryColor: '#1e1b4b', secondaryColor: '#f3f4f6' },
    { name: 'Earth', primaryColor: '#78350f', secondaryColor: '#fef3c7' },
  ];

  fontOptions = [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: "'Courier New', monospace", label: 'Courier New' },
  ];

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      websiteEnabled: [false],
      theme: this.fb.group({
        primaryColor: ['#000000'],
        secondaryColor: ['#ffffff'],
        fontFamily: ['Inter, sans-serif'],
        logo: [''],
        banner: [''],
      }),
    });
  }

  get currentTheme() {
    return this.form.get('theme')?.value || {};
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
        this.form.patchValue({ 
          websiteEnabled: shop.websiteEnabled || false,
          theme: shop.theme || {} 
        });
        this.logoImages = shop.theme?.logo ? [shop.theme.logo] : [];
        this.bannerImages = shop.theme?.banner ? [shop.theme.banner] : [];
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.showError(err?.error?.message || 'Failed to load theme.');
      },
    });
  }

  applyPalette(palette: any) {
    this.form.get('theme')?.patchValue({
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor
    });
  }

  clearImg(field: 'logo' | 'banner') {
    this.form.get(`theme.${field}`)?.setValue('');
  }

  onSave() {
    if (!this.shopId) return;
    this.saving = true;
    this.shopService.updateShop(this.shopId, this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.showSuccess('Theme saved successfully!');
      },
      error: (err: any) => {
        this.saving = false;
        this.toastService.showError(err?.error?.message || 'Failed to save theme.');
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
