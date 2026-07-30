import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ImageGalleryService } from './image-gallery.service';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../core/models/shop.model';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ImageUploaderComponent } from '../../shared/components/image-uploader.component';

interface HomepageSettings {
  categoryBanners?: {
    newArrivals?: string;
    casualEdit?: string;
    bestSellers?: string;
  };
  editorials?: {
    smartChic?: string;
    readyToGo?: string;
  };
  instagramImages?: string[];
}

@Component({
  selector: 'app-website-images',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, ImageUploaderComponent],
  template: `
    <div class="flex flex-col lg:flex-row h-full overflow-hidden">
      <!-- Left Column: Settings -->
      <div class="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar space-y-8">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 pb-5">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Website Home Page Images</h2>
            <p class="text-sm text-gray-500 mt-1">Customize your e-commerce storefront banners and grids</p>
          </div>
          <button
            (click)="saveChanges()"
            [disabled]="saving || loading"
            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            @if (saving) {
              <i class="bi bi-arrow-repeat animate-spin"></i> Saving...
            } @else {
              <i class="bi bi-cloud-check-fill"></i> Save Changes
            }
          </button>
        </div>

        @if (loading) {
          <div class="flex justify-center py-24">
            <app-ui-loading size="lg"></app-ui-loading>
          </div>
        } @else if (error) {
          <div class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
            <i class="bi bi-exclamation-triangle mr-2"></i>{{ error }}
          </div>
        } @else {
          <!-- SECTION 1: Category Banners Grid (3 Items) -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-medium">1</div>
              <h3 class="font-bold text-gray-800">Main Category Banners (Grid of 3)</h3>
            </div>
            <p class="text-xs text-gray-400 pl-10 -mt-2">Aspect Ratio: 4:5 recommended. Top categories section on home page.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pl-10">
              <!-- New Arrivals Banner -->
              <div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <span class="text-xs font-normal tracking-wide text-gray-400">New Arrivals</span>
                <div class="aspect-[4/5] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative group">
                  <img [src]="settings.categoryBanners?.newArrivals || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                </div>
                <app-image-uploader
                  [shopId]="shopId"
                  [multiple]="false"
                  [images]="getCategoryBannerImages('newArrivals')"
                  label="Change Image"
                  (imagesChange)="updateCategoryBanner('newArrivals', $event)"
                ></app-image-uploader>
              </div>

              <!-- The Casual Edit Banner -->
              <div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <span class="text-xs font-normal tracking-wide text-gray-400">Casual Edit</span>
                <div class="aspect-[4/5] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative group">
                  <img [src]="settings.categoryBanners?.casualEdit || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                </div>
                <app-image-uploader
                  [shopId]="shopId"
                  [multiple]="false"
                  [images]="getCategoryBannerImages('casualEdit')"
                  label="Change Image"
                  (imagesChange)="updateCategoryBanner('casualEdit', $event)"
                ></app-image-uploader>
              </div>

              <!-- Best Sellers Banner -->
              <div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <span class="text-xs font-normal tracking-wide text-gray-400">Best-Sellers</span>
                <div class="aspect-[4/5] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative group">
                  <img [src]="settings.categoryBanners?.bestSellers || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                </div>
                <app-image-uploader
                  [shopId]="shopId"
                  [multiple]="false"
                  [images]="getCategoryBannerImages('bestSellers')"
                  label="Change Image"
                  (imagesChange)="updateCategoryBanner('bestSellers', $event)"
                ></app-image-uploader>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Editorials Grid (2 Items) -->
          <div class="space-y-4 pt-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-medium">2</div>
              <h3 class="font-bold text-gray-800">Featured Editorials (Grid of 2)</h3>
            </div>
            <p class="text-xs text-gray-400 pl-10 -mt-2">Aspect Ratio: 1:1 Square recommended.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
              <!-- The Smart Chic -->
              <div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <span class="text-xs font-normal tracking-wide text-gray-400">The Smart Chic</span>
                <div class="aspect-square bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative group">
                  <img [src]="settings.editorials?.smartChic || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                </div>
                <app-image-uploader
                  [shopId]="shopId"
                  [multiple]="false"
                  [images]="getEditorialImages('smartChic')"
                  label="Change Image"
                  (imagesChange)="updateEditorial('smartChic', $event)"
                ></app-image-uploader>
              </div>

              <!-- Ready To Go -->
              <div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <span class="text-xs font-normal tracking-wide text-gray-400">Ready To Go</span>
                <div class="aspect-square bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative group">
                  <img [src]="settings.editorials?.readyToGo || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                </div>
                <app-image-uploader
                  [shopId]="shopId"
                  [multiple]="false"
                  [images]="getEditorialImages('readyToGo')"
                  label="Change Image"
                  (imagesChange)="updateEditorial('readyToGo', $event)"
                ></app-image-uploader>
              </div>
            </div>
          </div>

          <!-- SECTION 3: Instagram Grid (4 Items) -->
          <div class="space-y-4 pt-4 pb-10">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-medium">3</div>
              <h3 class="font-bold text-gray-800">Instagram Feed Grid</h3>
            </div>
            <p class="text-xs text-gray-400 pl-10 -mt-2">Upload up to 4 square images.</p>
            
            <div class="pl-10 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <app-image-uploader
                [shopId]="shopId"
                [multiple]="true"
                [images]="settings.instagramImages || []"
                label="Select Images (Max 4)"
                (imagesChange)="updateInstagramImages($event)"
              ></app-image-uploader>
              
              <div class="grid grid-cols-4 gap-4 mt-6">
                @for (img of (settings.instagramImages || []).slice(0, 4); track img; let i = $index) {
                  <div class="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative group">
                    <img [src]="img" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span class="text-white text-xs font-normal">Slot {{ i + 1 }}</span>
                    </div>
                  </div>
                }
                @for (placeholder of [1,2,3,4].slice(0, 4 - (settings.instagramImages?.length || 0)); track placeholder) {
                  <div class="aspect-square rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <i class="bi bi-instagram text-xl mb-1 opacity-55"></i>
                    <span class="text-[10px]">Slot</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Right Column: Live Mockup -->
      <div class="overflow-hidden xl:flex flex-col w-[420px] bg-gray-100 border-l border-gray-200 items-center justify-center shrink-0 relative shadow-inner z-10">
        
        <div class="text-center mb-4">
          <h3 class="font-bold text-gray-900 text-sm">Storefront Preview</h3>
          <p class="text-xs text-gray-500">Live reflection of your website home page</p>
        </div>

        <!-- Phone Mockup container -->
        <div class="w-[280px] h-[600px] overflow-hidden max-h-[60vh] bg-white rounded-[2.5rem] border-[10px] border-gray-900  shadow-2xl relative flex-shrink-0">
          <!-- Notch -->
          <div class="absolute top-0 inset-x-0 h-5 flex justify-center z-50">
            <div class="w-32 h-5 bg-gray-900 rounded-b-2xl"></div>
          </div>

          <!-- Mockup Content -->
          <div class="pt-8 pb-6 flex flex-col w-full min-h-full">
            
            <!-- Navbar Mockup -->
            <div class="px-4 py-3 flex items-center justify-between border-b border-gray-100 shrink-0 sticky top-0 bg-white/80 backdrop-blur-md z-40">
              <i class="bi bi-list text-lg text-gray-600"></i>
              <span class="font-black tracking-widest text-[11px] uppercase">{{ shop?.shopName || 'Store Name' }}</span>
              <div class="flex items-center gap-2">
                <i class="bi bi-search text-xs text-gray-600"></i>
                <i class="bi bi-bag text-xs text-gray-600"></i>
              </div>
            </div>

            <!-- Hero Banner Mockup -->
            <div class="w-full bg-gray-100 aspect-video flex flex-col items-center justify-center relative">
              <div class="text-center relative z-10 px-4">
                <h1 class="text-xl font-bold text-gray-800 mb-1">New Collection</h1>
                <p class="text-[10px] text-gray-600 mb-3">Discover the latest trends.</p>
                <div class="bg-black text-white text-[9px] font-bold px-4 py-1.5 uppercase tracking-wide inline-block">Shop Now</div>
              </div>
            </div>

            <!-- Categories Banner Grid (3 Items) -->
            <div class="px-3 mt-6">
              <h2 class="text-center font-bold text-sm tracking-wide mb-4">SHOP BY CATEGORY</h2>
              
              <div class="grid grid-cols-2 gap-2 mb-2">
                <!-- 1: New Arrivals -->
                <div class="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                  <img [src]="settings.categoryBanners?.newArrivals || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                  <div class="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span class="bg-white/90 text-[9px] font-bold px-2 py-1 uppercase tracking-wide shadow-sm">New Arrivals</span>
                  </div>
                </div>
                <!-- 2: Casual Edit -->
                <div class="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                  <img [src]="settings.categoryBanners?.casualEdit || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                  <div class="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span class="bg-white/90 text-[9px] font-bold px-2 py-1 uppercase tracking-wide shadow-sm">Casual Edit</span>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-1">
                <!-- 3: Best Sellers -->
                <div class="aspect-video bg-gray-100 overflow-hidden relative">
                  <img [src]="settings.categoryBanners?.bestSellers || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                  <div class="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span class="bg-white/90 text-[9px] font-bold px-2 py-1 uppercase tracking-wide shadow-sm">Best Sellers</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Editorials Grid (2 Items) -->
            <div class="px-3 mt-8">
              <h2 class="text-center font-bold text-sm tracking-wide mb-4">THE EDITORIALS</h2>
              
              <div class="flex flex-col gap-3">
                <div class="aspect-square bg-gray-100 overflow-hidden relative">
                  <img [src]="settings.editorials?.smartChic || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <span class="text-white text-lg font-bold uppercase tracking-widest drop-shadow-md">Smart Chic</span>
                  </div>
                </div>
                
                <div class="aspect-square bg-gray-100 overflow-hidden relative">
                  <img [src]="settings.editorials?.readyToGo || '/Cloth_placeholder.png'" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <span class="text-white text-lg font-bold uppercase tracking-widest drop-shadow-md">Ready To Go</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Instagram Grid Mockup -->
            <div class="px-3 mt-8 mb-8">
              <h2 class="text-center font-bold text-xs tracking-wide mb-1 uppercase"><i class="bi bi-instagram mr-1"></i> @{{ shop?.shopName || 'StoreName' | lowercase | slice:0:10 }}</h2>
              <p class="text-center text-[10px] text-gray-500 mb-3">Tag us to get featured</p>
              
              <div class="grid grid-cols-2 gap-1">
                @for (img of (settings.instagramImages || []).slice(0, 4); track img) {
                  <div class="aspect-square bg-gray-200">
                    <img [src]="img" class="w-full h-full object-cover" />
                  </div>
                }
                <!-- Fill remaining slots with placeholder if < 4 images -->
                @for (placeholder of [1,2,3,4].slice(0, 4 - (settings.instagramImages?.length || 0)); track placeholder) {
                  <div class="aspect-square bg-gray-100 flex items-center justify-center text-gray-300">
                    <i class="bi bi-image text-xl"></i>
                  </div>
                }
              </div>
            </div>
            
            <div class="mt-auto pt-6 bg-gray-900 text-white text-center pb-8 px-4">
               <p class="text-[9px] uppercase tracking-wider mb-2 font-bold">{{ shop?.shopName || 'Store Name' }}</p>
               <p class="text-[8px] text-gray-400">© 2026 All rights reserved.</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Toast notifications -->
      @if (saveSuccess) {
        <div class="fixed bottom-6 right-6 bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50">
          <i class="bi bi-check-circle-fill"></i> Home page layout images saved!
        </div>
      }
    </div>
  `,
})
export class WebsiteImagesComponent implements OnInit {
  shopId = '';
  shop: Shop | null = null;
  loading = true;
  saving = false;
  saveSuccess = false;
  error = '';

  settings: HomepageSettings = {
    categoryBanners: {},
    editorials: {},
    instagramImages: [],
  };

  constructor(
    private galleryService: ImageGalleryService,
    private shopService: ShopService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadShop();
      }
    });
  }

  private loadShop() {
    this.loading = true;
    this.galleryService.getShop(this.shopId).subscribe({
      next: (res: any) => {
        this.shop = res?.data || null;
        if (this.shop) {
          const theme: any = this.shop.theme || {};
          const hp = theme.homepageSettings || {};
          this.settings = {
            categoryBanners: hp.categoryBanners || {},
            editorials: hp.editorials || {},
            instagramImages: hp.instagramImages || [],
          };
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load website settings.';
        this.loading = false;
      },
    });
  }

  getCategoryBannerImages(field: 'newArrivals' | 'casualEdit' | 'bestSellers'): string[] {
    const url = this.settings.categoryBanners?.[field];
    return url ? [url] : [];
  }

  getEditorialImages(field: 'smartChic' | 'readyToGo'): string[] {
    const url = this.settings.editorials?.[field];
    return url ? [url] : [];
  }

  updateCategoryBanner(field: 'newArrivals' | 'casualEdit' | 'bestSellers', urls: string[]) {
    if (!this.settings.categoryBanners) this.settings.categoryBanners = {};
    this.settings.categoryBanners[field] = urls[0] || '';
  }

  updateEditorial(field: 'smartChic' | 'readyToGo', urls: string[]) {
    if (!this.settings.editorials) this.settings.editorials = {};
    this.settings.editorials[field] = urls[0] || '';
  }

  updateInstagramImages(urls: string[]) {
    this.settings.instagramImages = urls;
  }

  saveChanges() {
    if (!this.shop) return;
    this.saving = true;
    
    const existingTheme = this.shop.theme || { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Inter' };
    const updatedTheme = {
      ...existingTheme,
      homepageSettings: this.settings,
    };

    const payload = { theme: updatedTheme };

    this.shopService.updateShop(this.shopId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        if (this.shop) {
          this.shop.theme = updatedTheme;
        }
        setTimeout(() => (this.saveSuccess = false), 3000);
        this.shopService['shopCache'].delete(this.shopId);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save home page images.';
      },
    });
  }
}
