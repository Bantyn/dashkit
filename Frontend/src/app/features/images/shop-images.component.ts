import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ImageGalleryService } from './image-gallery.service';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../core/models/shop.model';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ImageUploaderComponent } from '../../shared/components/image-uploader.component';

interface ShopImageCard {
  key: 'logo' | 'banner';
  label: string;
  subtitle: string;
  icon: string;
  accentBg: string;
  currentUrl: string | undefined;
}

@Component({
  selector: 'app-shop-images',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, ImageUploaderComponent],
  template: `
    <div class="p-6 max-w-full mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-800">Shop Images</h2>
        <p class="text-sm text-gray-500 mt-1">Apni shop ki logo aur banner images manage karein</p>
      </div>

      @if (loading) {
        <div class="flex justify-center py-24">
          <app-ui-loading size="lg"></app-ui-loading>
        </div>
      }

      @else if (error) {
        <div class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
          <i class="bi bi-exclamation-triangle mr-2"></i>{{ error }}
        </div>
      }

      @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          @for (card of imageCards; track card.key) {
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              <!-- Card Header -->
              <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3"
                   [style.background]="card.accentBg">
                <div class="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center text-xl">
                  <i [class]="'bi ' + card.icon"></i>
                </div>
                <div>
                  <div class="font-bold text-gray-800 text-sm">{{ card.label }}</div>
                  <div class="text-xs text-gray-500">{{ card.subtitle }}</div>
                </div>
              </div>

              <div class="p-5 space-y-4">

                <!-- Current Image Preview -->
                @if (card.currentUrl) {
                  <div class="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                       [class.aspect-square]="card.key === 'logo'"
                       [class.aspect-video]="card.key === 'banner'">
                    <img
                      [src]="card.currentUrl"
                      [alt]="card.label"
                      class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        (click)="copyUrl(card.currentUrl!)"
                        class="px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-gray-100 transition-colors"
                      >
                        <i class="bi bi-clipboard"></i> Copy URL
                      </button>
                      <a [href]="card.currentUrl" target="_blank"
                         class="px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-gray-100 transition-colors">
                        <i class="bi bi-box-arrow-up-right"></i> Open
                      </a>
                    </div>
                    <div class="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      Current
                    </div>
                  </div>
                } @else {
                  <div class="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200"
                       [class.aspect-square]="card.key === 'logo'"
                       [class.aspect-video]="card.key === 'banner'">
                    <i [class]="'bi ' + card.icon + ' text-4xl text-gray-300 mb-2'"></i>
                    <p class="text-xs text-gray-400">No {{ card.label }} uploaded yet</p>
                  </div>
                }

                <!-- Upload New -->
                <div>
                  <label class="block text-xs font-semibold tracking-widest text-gray-400 mb-2">
                    Upload New {{ card.label }}
                  </label>
                  <app-image-uploader
                    [shopId]="shopId"
                    [multiple]="false"
                    [images]="getUploadImages(card.key)"
                    [label]="'Choose ' + card.label"
                    (imagesChange)="onImageUploaded(card.key, $event)"
                  ></app-image-uploader>
                </div>

                <!-- Save Button -->
                @if (pendingUpdates[card.key]) {
                  <button
                    (click)="saveShopImage(card.key)"
                    [disabled]="saving[card.key]"
                    class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    @if (saving[card.key]) {
                      <i class="bi bi-arrow-repeat animate-spin"></i> Saving...
                    } @else {
                      <i class="bi bi-check2-circle"></i> Save {{ card.label }}
                    }
                  </button>
                }

                @if (saved[card.key]) {
                  <div class="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <i class="bi bi-check-circle-fill"></i> {{ card.label }} updated successfully!
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- Copy Toast -->
    @if (showCopied) {
      <div class="fixed bottom-6 right-6 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50">
        <i class="bi bi-check2-circle text-green-400"></i> URL copied!
      </div>
    }
  `,
})
export class ShopImagesComponent implements OnInit {
  shopId = '';
  shop: Shop | null = null;
  loading = true;
  error = '';
  showCopied = false;

  pendingUpdates: { logo?: string; banner?: string } = {};
  saving: { logo?: boolean; banner?: boolean } = {};
  saved: { logo?: boolean; banner?: boolean } = {};
  uploadBuffers: { logo: string[]; banner: string[] } = { logo: [], banner: [] };

  get imageCards(): ShopImageCard[] {
    return [
      {
        key: 'logo',
        label: 'Shop Logo',
        subtitle: 'Square image — best 500×500px',
        icon: 'bi-shop-window',
        accentBg: '#fff7ed',
        // Logo is stored inside theme.logo (as per backend shop.model.ts)
        currentUrl: this.shop?.theme?.logo || this.shop?.logo,
      },
      {
        key: 'banner',
        label: 'Shop Banner',
        subtitle: 'Wide image — best 1200×400px',
        icon: 'bi-image',
        accentBg: '#f0fdf4',
        // Banner is stored inside theme.banner (as per backend shop.model.ts)
        currentUrl: this.shop?.theme?.banner || this.shop?.banner,
      },
    ];
  }

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
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load shop data.';
        this.loading = false;
      },
    });
  }

  getUploadImages(key: 'logo' | 'banner'): string[] {
    return this.uploadBuffers[key];
  }

  onImageUploaded(key: 'logo' | 'banner', urls: string[]) {
    this.uploadBuffers[key] = urls;
    if (urls.length > 0) {
      this.pendingUpdates[key] = urls[0];
      this.saved[key] = false;
    }
  }

  saveShopImage(key: 'logo' | 'banner') {
    const url = this.pendingUpdates[key];
    if (!url) return;

    this.saving[key] = true;

    // Logo & Banner are stored inside theme object on the backend
    // We use dot notation to update only the specific field without overwriting the rest of the theme
    const payload = { [`theme.${key}`]: url };

    this.shopService.updateShop(this.shopId, payload).subscribe({
      next: () => {
        // Update local shop state
        if (this.shop) {
          if (!this.shop.theme) this.shop.theme = { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Inter' };
          (this.shop.theme as any)[key] = url;
        }
        this.saving[key] = false;
        this.saved[key] = true;
        delete this.pendingUpdates[key];
        this.uploadBuffers[key] = [];
        setTimeout(() => (this.saved[key] = false), 3000);
        // Invalidate shop cache
        this.shopService['shopCache'].delete(this.shopId);
      },
      error: () => {
        this.saving[key] = false;
        this.error = `Failed to save ${key}. Please try again.`;
      },
    });
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      this.showCopied = true;
      setTimeout(() => (this.showCopied = false), 2000);
    });
  }
}
