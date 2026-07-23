import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { CreateProductComponent } from './create-product.component';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { ToastService } from '../../core/services/toast.service';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../core/models/shop.model';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule, CreateProductComponent, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: Product List ─── -->
      <div
        class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900">Products</h2>
          <div class="flex gap-3">
            @if (products.length > 0) {
              <button
                class="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm"
                (click)="deleteAllProducts()"
                [disabled]="isDeletingAll"
              >
                @if (isDeletingAll) {
                  <i class="bi bi-arrow-repeat animate-spin"></i> Deleting...
                } @else {
                  <i class="bi bi-trash"></i> Delete All
                }
              </button>
            }
            <button
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
              (click)="openCreateModal()"
            >
              <i class="bi bi-plus-lg"></i> Add Product
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search products by name or category..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  <th class="px-6 py-3">Product</th>
                  <th class="px-6 py-3">Category</th>
                  <th class="px-6 py-3">Price</th>
                  <th class="px-6 py-3">Stock</th>
                  <th class="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading products...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error) {
                  <tr>
                    <td colspan="5" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                        {{ error }}
                      </div>
                    </td>
                  </tr>
                } @else if (filteredProducts.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      @if (products.length === 0) {
                        No products found. Add your first product!
                      } @else {
                        No products match your search.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (product of filteredProducts; track product.id) {
                    <tr
                      (click)="selectProduct(product)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedProduct?.id === product.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          @if (product.images && product.images.length > 0) {
                            <img
                              [src]="product.images[0]"
                              class="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                              alt=""
                            />
                          } @else {
                            <div
                              class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
                            >
                              <i class="bi bi-image text-gray-400"></i>
                            </div>
                          }
                          <div
                            class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors"
                          >
                            {{ product.name }}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600 capitalize">
                        {{ product.category }}
                      </td>
                      <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                        {{
                          product.variants && product.variants.length > 0
                            ? '₹' + product.variants[0].price
                            : 'N/A'
                        }}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ getTotalStock(product) }}</td>
                      <td class="px-6 py-4">
                        <span
                          [class]="
                            product.isActive
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-gray-50 text-gray-700 border border-gray-100'
                          "
                          class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        >
                          {{ product.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── Right Panel: Product Detail ─── -->
      @if (selectedProduct) {
        <div
          class="w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 overflow-hidden"
        >
          <!-- Detail Header -->
          <div
            class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50"
          >
            <div>
              <h3 class="text-lg font-bold text-gray-900">Product Details</h3>
              <p class="text-xs text-gray-400 mt-0.5 capitalize">
                {{ selectedProduct.category
                }}{{ selectedProduct.subcategory ? ' › ' + selectedProduct.subcategory : '' }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button
                (click)="onEdit(selectedProduct)"
                class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit"
              >
                <i class="bi bi-pencil-square"></i>
              </button>
              <button
                (click)="onDelete(selectedProduct.id)"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <i class="bi bi-trash"></i>
              </button>
              <button
                (click)="closeDetail()"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors md:hidden"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Image Gallery -->
            @if (selectedProduct.images && selectedProduct.images.length > 0) {
              <div class="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 p-2">
                <img
                  [src]="activeImageUrl"
                  class="w-full h-56 object-contain rounded-lg bg-white"
                  alt="{{ selectedProduct.name }}"
                />
                @if (selectedProduct.images.length > 1) {
                  <div class="flex gap-2 p-2 mt-2 overflow-x-auto custom-scrollbar">
                    @for (img of selectedProduct.images; track $index) {
                      <img
                        [src]="img"
                        (click)="selectedImageIndex = $index"
                        class="w-14 h-14 rounded-lg object-cover border-2 cursor-pointer shrink-0 transition-all"
                        [class.border-primary-500]="selectedImageIndex === $index"
                        [class.ring-2]="selectedImageIndex === $index"
                        [class.ring-primary-200]="selectedImageIndex === $index"
                        [class.border-transparent]="selectedImageIndex !== $index"
                        alt=""
                      />
                    }
                  </div>
                }
              </div>
            } @else {
              <div
                class="h-40 rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-200"
              >
                <div class="text-center">
                  <i class="bi bi-image text-3xl text-gray-300"></i>
                  <p class="text-xs text-gray-400 mt-1">No images</p>
                </div>
              </div>
            }

            <!-- Name & Description -->
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-lg font-bold text-gray-900">{{ selectedProduct.name }}</h4>
                <span
                  [class]="
                    selectedProduct.isActive
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-gray-50 text-gray-500 border border-gray-100'
                  "
                  class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                >
                  {{ selectedProduct.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              @if (selectedProduct.description) {
                <p class="text-sm text-gray-500 mt-2 leading-relaxed">
                  {{ selectedProduct.description }}
                </p>
              }
              @if (selectedProduct.brand) {
                <p class="text-xs text-gray-400 mt-1">
                  <span class="font-medium">Brand:</span> {{ selectedProduct.brand }}
                </p>
              }
            </div>

            <!-- Variants -->
            @if (selectedProduct.variants && selectedProduct.variants.length > 0) {
              <div class="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Variants</h4>
                  <span class="text-xs text-gray-400"
                    >{{ selectedProduct.variants.length }} variants</span
                  >
                </div>
                <div class="divide-y divide-gray-50">
                  @for (variant of selectedProduct.variants; track variant.sku) {
                    <div class="px-4 py-3 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        @if (variant.color) {
                          <span
                            class="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                            [style.background]="variant.color"
                          ></span>
                        }
                        <div>
                          <div class="text-sm font-medium text-gray-800">
                            {{ variant.size ? variant.size : ''
                            }}{{ variant.size && variant.color ? ' · ' : ''
                            }}{{ variant.color ? variant.color : '' }}
                          </div>
                          <div class="text-xs text-gray-400 font-mono">{{ variant.sku }}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-bold text-gray-900">
                          ₹{{ variant.price | number }}
                        </div>
                        @if (variant.discountedPrice) {
                          <div class="text-xs text-red-500 font-semibold">
                            Sale ₹{{ variant.discountedPrice | number }}
                          </div>
                        }
                        <div
                          class="text-xs mt-0.5"
                          [class]="
                            variant.stock < 5 ? 'text-red-500 font-semibold' : 'text-gray-400'
                          "
                        >
                          {{ variant.stock }} in stock
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Summary Row -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-primary-50 rounded-xl p-3 text-center">
                <div class="text-lg font-black text-primary-700">
                  {{ getTotalStock(selectedProduct) }}
                </div>
                <div
                  class="text-[10px] text-primary-500 uppercase tracking-wider font-semibold mt-0.5"
                >
                  Total Stock
                </div>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 text-center">
                <div class="text-lg font-black text-gray-800">
                  {{ selectedProduct.variants.length || 0 }}
                </div>
                <div
                  class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5"
                >
                  Variants
                </div>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 text-center">
                <div class="text-lg font-black text-gray-800">
                  {{ selectedProduct.images?.length || 0 }}
                </div>
                <div
                  class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5"
                >
                  Images
                </div>
              </div>
            </div>

            <!-- Tags -->
            @if (selectedProduct.tags && selectedProduct.tags.length > 0) {
              <div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                <div class="flex flex-wrap gap-1.5">
                  @for (tag of selectedProduct.tags; track tag) {
                    <span class="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{{
                      tag
                    }}</span>
                  }
                </div>
              </div>
            }

            <!-- SEO -->
            @if (selectedProduct.seo && hasFeature('web_seo')) {
              <!-- SEO Details -->
              <div class="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div class="px-4 py-3 border-b border-gray-100">
                  <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">SEO</h4>
                </div>
                <div class="px-4 py-3 space-y-2">
                  <p class="text-sm font-medium text-blue-600">
                    {{ selectedProduct.seo.metaTitle }}
                  </p>
                  <p class="text-xs text-gray-500">{{ selectedProduct.seo.metaDescription }}</p>
                  <p class="text-xs font-mono text-gray-400">/{{ selectedProduct.seo.slug }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div
          class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 text-center p-8 h-full sticky top-0"
        >
          <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-box-seam text-2xl text-primary-400"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No product selected</h3>
          <p class="text-gray-500 text-sm">Select a product from the list to view its details.</p>
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    <app-create-product
      *ngIf="showCreateModal"
      [product]="editingProduct"
      (close)="showCreateModal = false; editingProduct = null"
      (productCreated)="onProductCreated()"
    ></app-create-product>
  `,
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | null = null;
  showCreateModal = false;
  selectedProduct: Product | null = null;
  selectedImageIndex = 0;
  editingProduct: Product | null = null;
  searchQuery = '';
  isDeletingAll = false;

  get activeImageUrl(): string {
    if (!this.selectedProduct?.images || this.selectedProduct.images.length === 0) return '';
    return this.selectedProduct.images[this.selectedImageIndex] || this.selectedProduct.images[0];
  }

  constructor(
    private productService: ProductService,
    private shopService: ShopService,
    private featureService: FeatureGuardService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  get filteredProducts(): Product[] {
    if (!this.searchQuery.trim()) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) {
        this.loadProducts();
        this.loadShop();
      }
    });
  }

  currentShop: Shop | null = null;
  loadShop() {
    if (!this.shopId) return;
    this.shopService.getShop(this.shopId).subscribe(res => {
      this.currentShop = res.data;
      this.cdr.detectChanges();
    });
  }

  hasFeature(key: string): boolean {
    return this.featureService.hasFeatureSync(this.currentShop, key);
  }

  loadProducts() {
    this.loading = true;
    if (!this.shopId) return;
    this.productService.getProductsByShop(this.shopId).subscribe({
      next: (response) => {
        this.products = response.data;
        this.loading = false;
        if (this.products.length > 0 && window.innerWidth >= 768) {
          this.selectedProduct = this.products[0];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error = 'Failed to load products.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async deleteAllProducts() {
    if (!this.shopId) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete ALL Products?',
      description: 'Are you sure you want to delete ALL products?<br><br>This action cannot be undone.',
      type: 'danger',
      primaryButtonText: 'Delete All',
      secondaryButtonText: 'Cancel'
    });
    
    if (confirmed) {
      this.isDeletingAll = true;
      this.productService.deleteAllProducts(this.shopId).subscribe({
        next: (res) => {
          this.isDeletingAll = false;
          if (res.success) {
            this.toastService.showSuccess(`Successfully deleted ${res.data.deletedCount} products.`);
            this.products = [];
            this.selectedProduct = null;
            this.cdr.detectChanges();
            this.shopService.getShopFresh(this.shopId!).subscribe();
          } else {
            this.toastService.showError(res.message || 'Failed to delete products');
          }
        },
        error: (err) => {
          this.isDeletingAll = false;
          this.toastService.showError('An error occurred while deleting products');
          console.error(err);
        }
      });
    }
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
    this.selectedImageIndex = 0;
  }

  closeDetail() {
    this.selectedProduct = null;
  }

  openCreateModal() {
    this.editingProduct = null;
    this.showCreateModal = true;
  }

  onEdit(product: Product) {
    this.editingProduct = product;
    this.showCreateModal = true;
  }

  async onDelete(productId: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Product?',
      description: 'Are you sure you want to delete this product?',
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        if (this.selectedProduct?.id === productId) this.selectedProduct = null;
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.toastService.showError('Failed to delete product');
      },
    });
  }

  onProductCreated() {
    this.showCreateModal = false;
    this.editingProduct = null;
    this.loadProducts();
  }

  getTotalStock(product: Product): number {
    return product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
  }
}
