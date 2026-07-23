import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ImageGalleryService, ProductImageGroup } from './image-gallery.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ImageUploaderComponent } from '../../shared/components/image-uploader.component';

@Component({
  selector: 'app-product-images',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent, ImageUploaderComponent],
  template: `
    <div class="p-6 max-w-full mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-800">Product Images</h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ productGroups.length }} products with images
          </p>
        </div>
        <!-- Search -->
        <div class="relative w-64">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search products..."
            class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
          />
        </div>
      </div>

      @if (loading) {
        <div class="flex justify-center py-24">
          <app-ui-loading size="lg"></app-ui-loading>
        </div>
      }

      @else if (filteredGroups.length === 0) {
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <i class="bi bi-bag text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-bold text-gray-700 mb-1">No products found</h3>
          <p class="text-sm text-gray-400">Add products with images to manage them here.</p>
        </div>
      }

      @else {
        <div class="space-y-4">
          @for (group of filteredGroups; track group.productId) {
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              <!-- Product Header -->
              <button
                (click)="toggleExpand(group.productId)"
                class="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <!-- Cover Image -->
                <div class="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                  <img [src]="group.coverImage" [alt]="group.productName" class="w-full h-full object-cover" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="font-bold text-gray-900">{{ group.productName }}</div>
                  <div class="text-sm text-gray-500 mt-0.5">
                    <span class="inline-flex items-center gap-1">
                      <i class="bi bi-images text-xs"></i>
                      {{ group.images.length }} image{{ group.images.length !== 1 ? 's' : '' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-xs text-gray-400 font-medium">
                    {{ isExpanded(group.productId) ? 'Collapse' : 'Manage' }}
                  </span>
                  <i
                    class="bi bi-chevron-down text-gray-400 transition-transform duration-200"
                    [class.rotate-180]="isExpanded(group.productId)"
                  ></i>
                </div>
              </button>

              <!-- Expanded Panel -->
              @if (isExpanded(group.productId)) {
                <div class="border-t border-gray-100 px-5 py-5 space-y-5">

                  <!-- Images Grid -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-normal tracking-wide text-gray-400">Current Images</span>
                      <span class="text-xs text-gray-400">First image = cover</span>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      @for (img of (pendingImages[group.productId] || []); track img; let idx = $index) {
                        <div class="group relative aspect-square rounded-xl overflow-hidden border bg-gray-50 shadow-sm transition-all hover:shadow-md"
                             [class.border-primary-400]="idx === 0"
                             [class.border-gray-200]="idx !== 0">
                          <img [src]="img" [alt]="group.productName + ' image ' + (idx+1)"
                               class="w-full h-full object-cover" loading="lazy"/>

                          <!-- Cover Badge -->
                          @if (idx === 0) {
                            <div class="absolute top-1 left-1 bg-primary-600 text-white text-[9px] font-normal px-1.5 py-0.5 rounded-md">
                              Cover
                            </div>
                          }

                          <!-- Hover Actions -->
                          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">

                            <!-- Set as Cover -->
                            @if (idx !== 0) {
                              <button
                                (click)="setCover(group, idx); $event.stopPropagation()"
                                class="px-2 py-1 bg-white text-gray-800 text-[10px] font-normal rounded-lg hover:bg-gray-100 transition-colors"
                                title="Set as Cover"
                              >
                                <i class="bi bi-star-fill text-amber-500 mr-1"></i>Cover
                              </button>
                            }

                            <!-- Delete -->
                            <button
                              (click)="deleteImage(group, idx); $event.stopPropagation()"
                              class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-normal rounded-lg transition-colors"
                              title="Delete Image"
                            >
                              <i class="bi bi-trash mr-1"></i>Delete
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Upload More Images -->
                  <div>
                    <label class="block text-xs font-normal tracking-wide text-gray-400 mb-2">
                      Add More Images
                    </label>
                    <app-image-uploader
                      [shopId]="shopId"
                      [multiple]="true"
                      [images]="uploadBuffer[group.productId] || []"
                      label="Upload product images"
                      (imagesChange)="onProductImagesUploaded(group.productId, $event)"
                    ></app-image-uploader>
                  </div>

                  <!-- Save / Status -->
                  <div class="flex items-center gap-3">
                    @if (hasChanges(group.productId)) {
                      <button
                        (click)="saveProductImages(group)"
                        [disabled]="savingProduct[group.productId]"
                        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                      >
                        @if (savingProduct[group.productId]) {
                          <i class="bi bi-arrow-repeat animate-spin"></i> Saving...
                        } @else {
                          <i class="bi bi-floppy"></i> Save Changes
                        }
                      </button>
                    }

                    @if (savedProduct[group.productId]) {
                      <div class="flex items-center gap-2 text-green-600 text-sm font-normal">
                        <i class="bi bi-check-circle-fill"></i> Saved successfully!
                      </div>
                    }

                    @if (errorProduct[group.productId]) {
                      <div class="flex items-center gap-2 text-red-600 text-sm">
                        <i class="bi bi-exclamation-triangle"></i> {{ errorProduct[group.productId] }}
                      </div>
                    }
                  </div>

                </div>
              }
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class ProductImagesComponent implements OnInit {
  shopId = '';
  productGroups: ProductImageGroup[] = [];
  loading = true;
  searchQuery = '';

  expandedIds = new Set<string>();
  uploadBuffer: Record<string, string[]> = {};
  pendingImages: Record<string, string[]> = {};
  savingProduct: Record<string, boolean> = {};
  savedProduct: Record<string, boolean> = {};
  errorProduct: Record<string, string> = {};

  get filteredGroups(): ProductImageGroup[] {
    if (!this.searchQuery.trim()) return this.productGroups;
    const q = this.searchQuery.toLowerCase();
    return this.productGroups.filter(g => g.productName.toLowerCase().includes(q));
  }

  constructor(
    private galleryService: ImageGalleryService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadProductImages();
      }
    });
  }

  private loadProductImages() {
    this.loading = true;
    this.galleryService.getProductImageGroups(this.shopId).subscribe({
      next: (groups) => {
        this.productGroups = groups;
        // initialize pending images as copies
        groups.forEach(g => {
          this.pendingImages[g.productId] = [...g.images];
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  isExpanded(id: string) { return this.expandedIds.has(id); }

  toggleExpand(id: string) {
    this.expandedIds.has(id) ? this.expandedIds.delete(id) : this.expandedIds.add(id);
  }

  hasChanges(productId: string): boolean {
    const group = this.productGroups.find(g => g.productId === productId);
    if (!group) return false;
    const pending = this.pendingImages[productId] || [];
    return JSON.stringify(group.images) !== JSON.stringify(pending);
  }

  setCover(group: ProductImageGroup, idx: number) {
    const images = [...this.pendingImages[group.productId]];
    const [img] = images.splice(idx, 1);
    images.unshift(img);
    this.pendingImages[group.productId] = images;
  }

  deleteImage(group: ProductImageGroup, idx: number) {
    const images = [...this.pendingImages[group.productId]];
    images.splice(idx, 1);
    this.pendingImages[group.productId] = images;
  }

  onProductImagesUploaded(productId: string, urls: string[]) {
    this.uploadBuffer[productId] = urls;
    const existing = this.pendingImages[productId] || [];
    // merge: new uploads come from upload buffer (those not already in existing)
    const newUrls = urls.filter(u => !existing.includes(u));
    this.pendingImages[productId] = [...existing, ...newUrls];
  }

  saveProductImages(group: ProductImageGroup) {
    const images = this.pendingImages[group.productId];
    this.savingProduct[group.productId] = true;
    this.errorProduct[group.productId] = '';

    this.galleryService.updateProductImages(group.productId, images).subscribe({
      next: () => {
        this.savingProduct[group.productId] = false;
        this.savedProduct[group.productId] = true;
        group.images = [...images];
        group.coverImage = images[0] || '';
        this.uploadBuffer[group.productId] = [];
        setTimeout(() => (this.savedProduct[group.productId] = false), 3000);
      },
      error: (err) => {
        this.savingProduct[group.productId] = false;
        this.errorProduct[group.productId] = err?.error?.message || 'Failed to save. Try again.';
      },
    });
  }
}
