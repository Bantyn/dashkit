import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { ImageGalleryService, GalleryImage, ImageCategory } from './image-gallery.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';

type FilterType = 'all' | ImageCategory;

@Component({
  selector: 'app-all-images',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, HasFeatureDirective],
  template: `
    <div class="p-6">

      <!-- ── Total Storage Hero Banner ── -->
      <div class="bg-primary-600 rounded-2xl p-5 mb-6 shadow-lg relative overflow-hidden">
        <!-- BG Pattern -->
        <div class="absolute inset-0 opacity-10"
             style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px); background-size: 30px 30px;">
        </div>
        <div class="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex items-center gap-4 flex-1">
            <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <i class="bi bi-database-fill text-white text-2xl"></i>
            </div>
            <div class="w-full max-w-full">
              <div class="text-white/80 text-xs font-medium tracking-wide mb-1">
                Storage Used
              </div>
              <div class="text-white text-2xl sm:text-3xl font-black tracking-tight flex items-baseline gap-2">
                @if (sizesLoading && totalKnownSize === 0) {
                  <span class="flex items-center gap-2">
                    <i class="bi bi-arrow-repeat animate-spin text-xl"></i>
                    <span class="text-lg font-normal opacity-70">Calculating...</span>
                  </span>
                } @else {
                  <span>{{ formatSize(totalKnownSize) }}</span>
                  <span class="text-base sm:text-xl font-medium text-white/80">/ {{ maxStorageFormatted }}</span>
                  <span class="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full text-white ml-2">
                    {{ storagePercentage }}% used
                  </span>
                }
              </div>

              <!-- Storage Progress Bar -->
              <div class="w-full bg-black/20 rounded-full h-2 mt-2 overflow-hidden border border-white/10">
                <div class="bg-white h-full rounded-full transition-all duration-500"
                     [style.width.%]="storagePercentage > 100 ? 100 : storagePercentage">
                </div>
              </div>
            </div>
          </div>
          <!-- Storage Breakdown Pills -->
          <div class="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
            <div class="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5" title="Allowed Plan + Add-on Limit">
              <i class="bi bi-hdd-stack text-white text-xs"></i>
              <span class="text-white text-xs font-normal">Plan Limit: {{ maxStorageFormatted }}</span>
            </div>
            <div class="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
              <i class="bi bi-images text-white text-xs"></i>
              <span class="text-white text-xs font-normal">{{ images.length }} total files</span>
            </div>
            <div class="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
              <i class="bi bi-check-circle text-white text-xs"></i>
              <span class="text-white text-xs font-normal">{{ images.length - unknownSizeCount }} sizes loaded</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        @for (stat of stats; track stat.label) {
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                 [style.background]="stat.bg" [style.color]="stat.color">
              <i [class]="'bi ' + stat.icon"></i>
            </div>
            <div>
              <div class="text-2xl font-normal text-gray-900">{{ stat.count }}</div>
              <div class="text-xs text-gray-500">{{ stat.label }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-3 mb-5">
        <!-- Search -->
        <div class="relative flex-1 min-w-[200px]">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
            placeholder="Search images..."
            class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
          />
        </div>
        <!-- Filter Pills -->
        <div class="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          @for (f of filterOptions; track f.id) {
            <button
              (click)="setFilter(f.id)"
              [class.bg-primary-600]="activeFilter === f.id"
              [class.text-white]="activeFilter === f.id"
              [class.text-gray-500]="activeFilter !== f.id"
              class="px-3 py-1.5 text-xs font-normal rounded-lg transition-all"
            >
              {{ f.label }}
            </button>
          }
        </div>
        <!-- BG Removal Toggle -->
        <div *appHasFeature="'web_ai_bg_removal'" class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors" (click)="toggleBgRemoval()" title="Toggle Background Removal">
          <div class="relative inline-block w-8 h-4 rounded-full transition-colors duration-300" [class.bg-primary-500]="bgRemovalEnabled" [class.bg-gray-300]="!bgRemovalEnabled">
            <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-300" [class.translate-x-4]="bgRemovalEnabled" [class.translate-x-0]="!bgRemovalEnabled"></div>
          </div>
          <span class="text-xs font-normal text-gray-700 whitespace-nowrap">Remove BG</span>
        </div>
        <!-- View Toggle -->
        <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button (click)="viewMode='grid'" [class.bg-gray-100]="viewMode==='grid'"
            class="p-2 rounded-lg transition-all" title="Grid View">
            <i class="bi bi-grid-3x3-gap text-gray-600"></i>
          </button>
          <button (click)="viewMode='list'" [class.bg-gray-100]="viewMode==='list'"
            class="p-2 rounded-lg transition-all" title="List View">
            <i class="bi bi-list-ul text-gray-600"></i>
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="flex flex-col items-center justify-center py-24 gap-4">
          <app-ui-loading size="lg"></app-ui-loading>
          <p class="text-gray-500 text-sm">Loading gallery...</p>
        </div>
      }

      <!-- Empty State -->
      @else if (!loading && filteredImages.length === 0) {
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <i class="bi bi-images text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-normal text-gray-700 mb-1">No images found</h3>
          <p class="text-sm text-gray-400 max-w-xs">
            {{ searchQuery ? 'Try a different search term.' : 'Upload product images or shop logo to see them here.' }}
          </p>
        </div>
      }

      <!-- ── Grid View ── -->
      @else if (viewMode === 'grid') {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          @for (img of filteredImages; track img.url) {
            <div
              class="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 cursor-pointer hover:shadow-md transition-all duration-200"
              (click)="openLightbox(img)"
            >
              <img
                [src]="getThumbnailUrl(img)"
                [alt]="img.label"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <!-- Category Badge -->
              <div class="absolute top-2 left-2">
                <span class="px-1.5 py-0.5 text-[10px] font-normal rounded-md tracking-wide"
                      [class]="getCategoryBadgeClass(img.category)">
                  {{ img.category }}
                </span>
              </div>

              <!-- Size Badge (bottom-left) -->
              <div class="absolute bottom-2 left-2">
                <span class="px-1.5 py-0.5 text-[10px] font-normal rounded-md bg-black/60 text-white backdrop-blur-sm">
                  @if (img.sizeBytes === undefined) {
                    <i class="bi bi-hourglass-split"></i>
                  } @else if (img.sizeBytes === null) {
                    –
                  } @else {
                    {{ formatSize(img.sizeBytes) }}
                  }
                </span>
              </div>

              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-2">
                <p class="text-white text-xs font-normal text-center truncate max-w-full">
                  {{ img.label }}
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <!-- Preview -->
                  <button
                    (click)="openLightbox(img); $event.stopPropagation()"
                    class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                    title="Preview"
                  >
                    <i class="bi bi-eye text-xs"></i>
                  </button>
                  <!-- Copy URL -->
                  <button
                    (click)="copyUrl(img.url); $event.stopPropagation()"
                    class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                    title="Copy URL"
                  >
                    <i class="bi bi-clipboard text-xs"></i>
                  </button>
                  <!-- Delete -->
                  <button
                    (click)="confirmDelete(img); $event.stopPropagation()"
                    class="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                    title="Delete"
                  >
                    <i class="bi bi-trash text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── List View ── -->
      @else {
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          @for (img of filteredImages; track img.url; let last = $last) {
            <div
              class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              [class.border-b]="!last"
            >
              <!-- Thumbnail -->
              <img [src]="getThumbnailUrl(img)" [alt]="img.label"
                   class="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0 cursor-pointer"
                   (click)="openLightbox(img)" />

              <!-- Info -->
              <div class="flex-1 min-w-0 cursor-pointer" (click)="openLightbox(img)">
                <div class="font-normal text-gray-800 text-sm truncate">{{ img.label }}</div>
                <div class="text-xs text-gray-400 truncate mt-0.5">{{ img.url }}</div>
              </div>

              <!-- Category -->
              <span class="px-2 py-0.5 text-[10px] font-normal rounded-md tracking-wide shrink-0"
                    [class]="getCategoryBadgeClass(img.category)">
                {{ img.category }}
              </span>

              <!-- Size -->
              <div class="text-xs font-normal text-gray-500 shrink-0 w-14 text-right">
                @if (img.sizeBytes === undefined) {
                  <i class="bi bi-hourglass-split text-gray-300 animate-pulse"></i>
                } @else if (img.sizeBytes === null) {
                  <span class="text-gray-300">—</span>
                } @else {
                  {{ formatSize(img.sizeBytes) }}
                }
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  (click)="copyUrl(img.url)"
                  class="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100"
                  title="Copy URL"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
                <button
                  (click)="confirmDelete(img)"
                  class="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- ── Lightbox Modal ── -->
    @if (lightboxImage) {
      <div
        class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        (click)="closeLightbox()"
      >
        <div class="relative max-w-3xl w-full" (click)="$event.stopPropagation()">

          <!-- Nav Arrows -->
          <button
            *ngIf="lightboxIndex > 0"
            (click)="navigateLightbox(-1)"
            class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10"
          >
            <i class="bi bi-chevron-left text-lg"></i>
          </button>
          <button
            *ngIf="lightboxIndex < filteredImages.length - 1"
            (click)="navigateLightbox(1)"
            class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors z-10"
          >
            <i class="bi bi-chevron-right text-lg"></i>
          </button>

          <!-- Image -->
          <img
            [src]="getThumbnailUrl(lightboxImage)"
            [alt]="lightboxImage.label"
            class="w-full max-h-[65vh] object-contain rounded-2xl"
          />

          <!-- Info Bar -->
          <div class="bg-white rounded-2xl mt-3 px-5 py-4 flex items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="font-normal text-gray-900 text-sm truncate">{{ lightboxImage.label }}</div>
              <div class="text-xs text-gray-400 truncate mt-0.5">{{ lightboxImage.url }}</div>
              <!-- Size in lightbox -->
              <div class="mt-1.5 flex items-center gap-2">
                <span class="text-xs font-normal text-gray-500">
                  <i class="bi bi-hdd mr-1"></i>
                  @if (lightboxImage.sizeBytes === undefined) {
                    Loading size...
                  } @else if (lightboxImage.sizeBytes === null) {
                    Size unavailable
                  } @else {
                    {{ formatSize(lightboxImage.sizeBytes) }}
                  }
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2 py-0.5 text-[10px] font-normal rounded-md tracking-wide"
                    [class]="getCategoryBadgeClass(lightboxImage.category)">
                {{ lightboxImage.category }}
              </span>
              <button
                (click)="copyUrl(lightboxImage.url)"
                class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-normal rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <i class="bi bi-clipboard"></i> Copy URL
              </button>
              <a [href]="lightboxImage.url" target="_blank"
                 class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-normal rounded-lg flex items-center gap-1.5 transition-colors">
                <i class="bi bi-box-arrow-up-right"></i> Open
              </a>
              <!-- Delete from lightbox -->
              <button
                (click)="confirmDelete(lightboxImage)"
                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-normal rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>

          <!-- Close -->
          <button
            (click)="closeLightbox()"
            class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <i class="bi bi-x-lg text-sm"></i>
          </button>

          <!-- Counter -->
          <div class="absolute top-3 left-3 bg-black/50 text-white text-xs font-normal px-2.5 py-1 rounded-full">
            {{ lightboxIndex + 1 }} / {{ filteredImages.length }}
          </div>
        </div>
      </div>
    }

    <!-- ── Delete Confirmation Modal ── -->
    @if (deleteTarget) {
      <div class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

          <!-- Modal Header -->
          <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <i class="bi bi-trash-fill text-red-600"></i>
            </div>
            <div>
              <h3 class="font-normal text-gray-900">Delete Image</h3>
              <p class="text-xs text-gray-500 mt-0.5">Yeh action undo nahi hogi</p>
            </div>
          </div>

          <!-- Preview -->
          <div class="px-6 py-4">
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <img [src]="getThumbnailUrl(deleteTarget)" [alt]="deleteTarget.label"
                   class="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0" />
              <div class="min-w-0">
                <div class="font-normal text-gray-800 text-sm">{{ deleteTarget.label }}</div>
                <span class="mt-1 inline-block px-1.5 py-0.5 text-[10px] font-normal rounded-md tracking-wide"
                      [class]="getCategoryBadgeClass(deleteTarget.category)">
                  {{ deleteTarget.category }}
                </span>
                @if (deleteTarget.sizeBytes) {
                  <div class="text-xs text-gray-400 mt-0.5">{{ formatSize(deleteTarget.sizeBytes) }}</div>
                }
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-4 leading-relaxed">
              Kya aap sure hain ki <strong>"{{ deleteTarget.label }}"</strong> image delete karna chahte hain?
              Yeh permanently remove ho jaayegi.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              (click)="cancelDelete()"
              [disabled]="deleting"
              class="px-5 py-2.5 text-sm font-normal text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              (click)="executeDelete()"
              [disabled]="deleting"
              class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-normal rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              @if (deleting) {
                <i class="bi bi-arrow-repeat animate-spin"></i> Deleting...
              } @else {
                <i class="bi bi-trash-fill"></i> Delete Image
              }
            </button>
          </div>

        </div>
      </div>
    }

    <!-- Toasts -->
    @if (showCopied) {
      <div class="fixed bottom-6 right-6 bg-gray-900 text-white text-sm font-normal px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-[70]">
        <i class="bi bi-check2-circle text-green-400"></i> URL copied!
      </div>
    }
    @if (deleteSuccess) {
      <div class="fixed bottom-6 right-6 bg-green-700 text-white text-sm font-normal px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-[70]">
        <i class="bi bi-check2-circle text-green-300"></i> Image deleted successfully!
      </div>
    }
    @if (deleteError) {
      <div class="fixed bottom-6 right-6 bg-red-700 text-white text-sm font-normal px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-[70]">
        <i class="bi bi-exclamation-circle text-red-300"></i> {{ deleteError }}
      </div>
    }
  `,
})
export class AllImagesComponent implements OnInit {
  shopId = '';
  images: GalleryImage[] = [];
  filteredImages: GalleryImage[] = [];
  loading = true;
  searchQuery = '';
  activeFilter: FilterType = 'all';
  viewMode: 'grid' | 'list' = 'grid';

  // Lightbox
  lightboxImage: GalleryImage | null = null;
  lightboxIndex = 0;

  // Delete
  deleteTarget: GalleryImage | null = null;
  deleting = false;
  deleteSuccess = false;
  deleteError = '';

  // Shop details (cached for storage calculation)
  shopData: any = null;
  shopTheme: any = {};

  // Toast
  showCopied = false;

  // Size loading
  sizesLoading = false;
  totalKnownSize = 0;
  unknownSizeCount = 0;

  // Background removal preference
  bgRemovalEnabled = true;

  filterOptions = [
    { id: 'all' as FilterType,      label: 'All'      },
    { id: 'shop' as FilterType,     label: 'Shop'     },
    { id: 'product' as FilterType,  label: 'Product'  },
    { id: 'profile' as FilterType,  label: 'Profile'  },
    { id: 'customer' as FilterType, label: 'Customer' },
    { id: 'invoice' as FilterType,  label: 'Invoices' },
  ];

  get stats() {
    return [
      { label: 'Total Files',    count: this.images.length,                                     icon: 'bi-files',         bg: '#eef2ff', color: '#4f46e5' },
      { label: 'Shop Images',    count: this.images.filter(i => i.category === 'shop').length,    icon: 'bi-shop',          bg: '#fef3c7', color: '#d97706' },
      { label: 'Product Images', count: this.images.filter(i => i.category === 'product').length, icon: 'bi-bag-fill',      bg: '#dcfce7', color: '#16a34a' },
      { label: 'Invoices',       count: this.images.filter(i => i.category === 'invoice').length, icon: 'bi-receipt',       bg: '#f3e8ff', color: '#9333ea' },
    ];
  }

  constructor(
    private galleryService: ImageGalleryService,
    private authService: AuthService,
    private shopService: ShopService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        const profilePhoto = (user as any).photoURL || '';
        this.loadImages(profilePhoto);
      }
    });
  }

  toggleBgRemoval() {
    this.bgRemovalEnabled = !this.bgRemovalEnabled;
    this.shopTheme.removeBgEnabled = this.bgRemovalEnabled;
    
    // Save preference to the shop database so storefront can apply it globally
    // We use dot notation to prevent overwriting the rest of the theme object
    const payload = { "theme.removeBgEnabled": this.bgRemovalEnabled } as any;
    
    this.shopService.updateShop(this.shopId, payload).subscribe({
      next: () => {
        window.location.reload();
      },
      error: (err) => {
        console.error('Failed to save background removal preference', err);
        // Fallback to local storage if API fails
        localStorage.setItem('bg_removal_enabled', this.bgRemovalEnabled.toString());
        window.location.reload();
      }
    });
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────

  private loadImages(profilePhoto: string) {
    this.loading = true;
    // Load shop data (for storage limit and theme/delete merge) and images in parallel
    this.galleryService.getShop(this.shopId).subscribe({
      next: (res: any) => {
        this.shopData = res?.data || {};
        this.shopTheme = res?.data?.theme || {};
        // Initialize local state from the database
        if (this.shopTheme.removeBgEnabled !== undefined) {
          this.bgRemovalEnabled = this.shopTheme.removeBgEnabled;
        } else {
          this.bgRemovalEnabled = localStorage.getItem('bg_removal_enabled') !== 'false';
        }
      },
    });

    this.galleryService.getAllGalleryImages(this.shopId, profilePhoto).subscribe({
      next: (imgs) => {
        this.images = imgs;
        this.applyFilters();
        this.loading = false;
        // Kick off lazy size loading after initial render
        setTimeout(() => this.loadImageSizes(), 300);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ─── Image Size (lazy HEAD requests) ─────────────────────────────────────

  private async loadImageSizes() {
    this.sizesLoading = true;
    const batchSize = 6;

    for (let i = 0; i < this.images.length; i += batchSize) {
      const batch = this.images.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (img) => {
          try {
            const res = await fetch(img.url, { method: 'HEAD' });
            const cl = res.headers.get('content-length');
            img.sizeBytes = cl ? parseInt(cl, 10) : null;
          } catch {
            img.sizeBytes = null;
          }
        }),
      );
      this.updateStorageTotals();
      this.cdr.detectChanges();
    }

    this.sizesLoading = false;
    this.cdr.detectChanges();
  }

  private updateStorageTotals() {
    this.totalKnownSize = this.images.reduce((acc, img) => acc + (img.sizeBytes || 0), 0);
    this.unknownSizeCount = this.images.filter(img => img.sizeBytes === null || img.sizeBytes === undefined).length;
  }

  // ─── Filters ──────────────────────────────────────────────────────────────

  applyFilters() {
    let result = this.images;
    if (this.activeFilter !== 'all') {
      result = result.filter(i => i.category === this.activeFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(i => i.label.toLowerCase().includes(q) || i.url.toLowerCase().includes(q));
    }
    this.filteredImages = result;
  }

  setFilter(f: FilterType) {
    this.activeFilter = f;
    this.applyFilters();
  }

  // ─── Lightbox ─────────────────────────────────────────────────────────────

  openLightbox(img: GalleryImage) {
    this.lightboxImage = img;
    this.lightboxIndex = this.filteredImages.indexOf(img);
  }

  closeLightbox() {
    this.lightboxImage = null;
  }

  navigateLightbox(dir: number) {
    const newIdx = this.lightboxIndex + dir;
    if (newIdx >= 0 && newIdx < this.filteredImages.length) {
      this.lightboxIndex = newIdx;
      this.lightboxImage = this.filteredImages[newIdx];
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  confirmDelete(img: GalleryImage) {
    this.deleteTarget = img;
    this.deleteError = '';
  }

  cancelDelete() {
    this.deleteTarget = null;
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    const img = this.deleteTarget;
    this.deleting = true;
    this.deleteError = '';

    // First delete from Cloudinary & reduce storage usage
    this.galleryService.deleteMedia(this.shopId, img.url).subscribe({
      next: () => {
        // Next, clean up parent model reference if needed
        if (img.category === 'shop' && img.fieldKey) {
          this.galleryService.deleteShopImage(this.shopId, img.fieldKey, this.shopTheme).subscribe();
        } else if (img.category === 'product' && img.productId) {
          const allProductUrls = this.images
            .filter(i => i.productId === img.productId)
            .map(i => i.url);
          this.galleryService.deleteProductImage(img.productId, img.url, allProductUrls).subscribe();
        } else if (img.category === 'invoice' && img.invoiceId) {
          this.galleryService.deleteInvoice(img.invoiceId).subscribe();
        }

        this.removeFromLocalList(img);
        this.deleting = false;
        this.deleteTarget = null;
        if (this.lightboxImage?.url === img.url) {
          this.closeLightbox();
        }
        this.showDeleteSuccess();
      },
      error: (err: any) => {
        console.warn("Delete media error:", err);
        // Fallback to local cleanup if backend media record was not found
        this.removeFromLocalList(img);
        this.deleting = false;
        this.deleteTarget = null;
        if (this.lightboxImage?.url === img.url) {
          this.closeLightbox();
        }
        this.showDeleteSuccess();
      }
    });
  }

  private removeFromLocalList(img: GalleryImage) {
    this.images = this.images.filter(i => i.url !== img.url);
    this.applyFilters();
    this.updateStorageTotals();
  }

  private showDeleteSuccess() {
    this.deleteSuccess = true;
    setTimeout(() => (this.deleteSuccess = false), 3000);
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  getCategoryBadgeClass(category: ImageCategory): string {
    const map: Record<ImageCategory, string> = {
      shop:     'bg-amber-100 text-amber-700',
      product:  'bg-green-100 text-green-700',
      profile:  'bg-pink-100 text-pink-700',
      customer: 'bg-blue-100 text-blue-700',
      invoice:  'bg-purple-100 text-purple-700',
    };
    return map[category] || 'bg-gray-100 text-gray-600';
  }

  getThumbnailUrl(img: GalleryImage): string {
    if (img.category === 'invoice') {
      let thumbUrl = img.url;
      // Change f_auto to f_jpg if it exists
      if (thumbUrl.includes('f_auto')) {
        thumbUrl = thumbUrl.replace('f_auto', 'f_jpg');
      }
      // Ensure the extension is .jpg for the thumbnail
      if (thumbUrl.toLowerCase().includes('.pdf')) {
        thumbUrl = thumbUrl.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
      }
      return thumbUrl;
    }
    return img.url;
  }

  get totalLimitBytes(): number {
    if (!this.shopData) return 500 * 1024 * 1024; // Default fallback 500 MB
    let includedMB = this.shopData.includedStorageMB ?? 500;
    let includedBytes = (this.shopData.includedStorageBytes ?? (includedMB * 1024 * 1024));

    let addonBytes = 0;
    if (this.shopData.storageAddonEnabled && this.shopData.storageAddonPlan) {
      const planStr = String(this.shopData.storageAddonPlan);
      if (planStr.includes("1 GB") || planStr.includes("1GB")) addonBytes = 1024 * 1024 * 1024;
      else if (planStr.includes("2 GB") || planStr.includes("2GB")) addonBytes = 2048 * 1024 * 1024;
      else if (planStr.includes("5 GB") || planStr.includes("5GB")) addonBytes = 5120 * 1024 * 1024;
    }

    return includedBytes + addonBytes;
  }

  get maxStorageFormatted(): string {
    return this.formatSize(this.totalLimitBytes);
  }

  get storagePercentage(): number {
    if (!this.totalLimitBytes || this.totalLimitBytes === 0) return 0;
    const pct = (this.totalKnownSize / this.totalLimitBytes) * 100;
    return Number(pct.toFixed(1));
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      this.showCopied = true;
      setTimeout(() => (this.showCopied = false), 2000);
    });
  }
}
