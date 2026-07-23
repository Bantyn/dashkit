import { Component, OnInit, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../../core/services/product.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { PrintService } from '../../shared/components/print-preview-modal.component';
import { Product, ProductVariant } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { Invoice, InvoiceItem } from '../../core/models/invoice.model';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { OfflineSyncService } from '../../core/services/offline-sync.service';

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  total: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="flex flex-col h-full bg-white overflow-hidden">
      <!-- Offline Banner -->
      <div
        *ngIf="!(isOnline$ | async)"
        class="bg-yellow-50 text-yellow-800 p-2 text-center text-sm font-bold border-b border-yellow-200 flex items-center justify-center gap-2 shrink-0"
      >
        <i class="bi bi-wifi-off"></i> You are currently offline. Bills will be saved locally and
        synced later.
      </div>

      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header (65%) -->
        <div
          class="w-[65%] px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0"
        >
          <h2 class="text-xl font-bold text-gray-900">Point of Sale</h2>
          <div class="flex items-center gap-2">
            <button
              class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
              title="Filter"
            >
              <i class="bi bi-funnel text-sm"></i>
            </button>
            <button
              class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
              title="Sort"
            >
              <i class="bi bi-clock-history text-sm"></i>
            </button>
            <span
              class="text-xs text-gray-500 font-medium px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm"
            >
              {{ filteredProducts.length }} products
            </span>
          </div>
        </div>

        <!-- Right Header (35%) -->
        <div class="w-[35%] px-6 py-5 flex justify-between items-center min-w-0 bg-white">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold text-gray-900">Current Sale</h2>
            <span
              *ngIf="pendingSyncCount$ | async as count"
              class="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold border border-yellow-200"
              title="Invoices waiting for internet connection"
            >
              {{ count }} pending
            </span>
          </div>
          <div class="flex gap-3 text-gray-400">
            <button
              (click)="clearCart()"
              class="hover:text-red-500 transition-colors"
              title="Clear Sale"
            >
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- LEFT PANEL: Products & Search (65%) -->
        <div class="w-[65%] flex flex-col border-r border-gray-200 bg-white">
          <!-- Top Bar: Search & Scanner -->
          <div class="p-4 border-b border-gray-200 flex items-center gap-4 bg-white z-10">
            <div class="flex-1 relative">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchQueryChange($event)"
                placeholder="Search products or scan barcode..."
                class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm transition-all"
                #searchInput
                autofocus
              />
            </div>
            <button
              class="w-11 h-11 rounded-lg bg-white border border-gray-200 text-gray-500 flex items-center justify-center hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <i class="bi bi-upc-scan text-lg"></i>
            </button>
          </div>

          <!-- Categories -->
          <div
            class="max-w-5xl px-4 py-3 border-b border-gray-100 overflow-x-auto whitespace-nowrap hide-scrollbar flex bg-gray-50"
          >
            <button
              (click)="selectCategory('')"
              [ngClass]="
                !selectedCategory
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              "
              class="px-5 py-1.5 rounded-lg text-sm font-medium mr-2 transition-all"
            >
              All
            </button>
            <button
              *ngFor="let cat of categories"
              (click)="selectCategory(cat.name.toLowerCase())"
              [ngClass]="
                selectedCategory === cat.name.toLowerCase()
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              "
              class="px-5 py-1.5 rounded-lg text-sm font-medium mr-2 transition-all"
            >
              {{ cat.name }}
            </button>
          </div>

          <!-- Product Grid -->
          <div class="flex-1 overflow-y-auto p-4 bg-[#f5f7fa]">
            <app-ui-loading *ngIf="loading"></app-ui-loading>

            <div
              *ngIf="!loading && filteredProducts.length === 0"
              class="flex flex-col items-center justify-center h-full text-gray-400"
            >
              <i class="bi bi-box-seam text-4xl mb-3 text-gray-300"></i>
              <p class="font-medium text-gray-600">No products found</p>
              <p class="text-sm mt-1">Try searching something else</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" *ngIf="!loading">
              <div
                *ngFor="let product of filteredProducts"
                (click)="addToCart(product)"
                class="bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-primary-400 hover:shadow-md transition-all group flex flex-col h-full relative overflow-hidden"
              >
                <!-- Stock Indicator -->
                <div
                  *ngIf="getProductStock(product) <= 5"
                  class="absolute top-2 right-2 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg z-10"
                >
                  Only {{ getProductStock(product) }} left
                </div>

                <div
                  class="w-full aspect-square rounded-lg bg-gray-50 mb-3 overflow-hidden flex items-center justify-center relative border border-gray-100"
                >
                  <img
                    *ngIf="product.images && product.images.length > 0"
                    [src]="product.images[0]"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <i
                    *ngIf="!product.images || product.images.length === 0"
                    class="bi bi-image text-2xl text-gray-300"
                  ></i>
                  <div
                    class="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  ></div>
                </div>

                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      class="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors"
                    >
                      {{ product.name }}
                    </h3>
                    <p class="text-[11px] text-gray-500">
                      {{ getProductBarcode(product) || getProductSku(product) }}
                    </p>
                  </div>
                  <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <p class="font-bold text-primary-600">₹{{ getProductPrice(product) }}</p>
                    <button
                      class="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:border-primary-600 group-hover:text-white transition-all shadow-sm"
                    >
                      <i class="bi bi-plus text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Current Sale (Cart) (35%) -->
        <div
          class="w-[35%] bg-white flex flex-col relative shadow-sm z-20 border-l border-gray-200"
        >
          <!-- Customer Select -->
          <div class="p-4 border-b border-gray-100 bg-gray-50/50">
            <div class="flex gap-3">
              <span class="text-sm text-primary-900 pt-2">Phone</span>
              <input
                type="text"
                [(ngModel)]="customerPhone"
                placeholder="Phone"
                class="text-sm border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white px-3 py-2 border transition-all"
              />
              <input
                type="text"
                [(ngModel)]="customerName"
                placeholder="Customer Name (Optional)"
                class="flex-1 text-sm border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white px-3 py-2 border transition-all"
              />
            </div>
          </div>

          <!-- Cart Items list -->
          <div class="flex-1 overflow-y-auto p-3 bg-[#f5f7fa]">
            <div
              *ngIf="cartItems.length === 0"
              class="h-full flex flex-col items-center justify-center text-gray-400"
            >
              <div
                class="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4"
              >
                <i class="bi bi-cart-x text-3xl text-gray-300"></i>
              </div>
              <p class="font-medium text-gray-600">Cart is empty</p>
              <p class="text-xs text-center mt-2 px-8 text-gray-500">
                Scan a barcode or click a product on the left to add items.
              </p>
            </div>

            <div class="space-y-3">
              <div
                *ngFor="let item of cartItems; let i = index"
                class="bg-white p-3 rounded-xl border border-gray-200 flex gap-3 group hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div
                  class="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100"
                >
                  <img
                    *ngIf="item.product.images && item.product.images.length > 0"
                    [src]="item.product.images[0]"
                    class="w-full h-full object-cover"
                  />
                  <div
                    *ngIf="!item.product.images || item.product.images.length === 0"
                    class="w-full h-full flex items-center justify-center"
                  >
                    <i class="bi bi-image text-gray-300 text-lg"></i>
                  </div>
                </div>

                <div class="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 class="font-bold text-sm text-gray-900 truncate mb-0.5">
                    {{ item.product.name }}
                  </h4>
                  <div *ngIf="item.variant" class="flex gap-1 mb-1">
                    <span
                      *ngIf="item.variant.size"
                      class="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"
                      >Size: {{ item.variant.size }}</span
                    >
                    <span
                      *ngIf="item.variant.color"
                      class="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"
                      >Color: {{ item.variant.color }}</span
                    >
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="font-bold text-primary-600 text-sm">₹{{ item.price }}</p>
                    <p class="text-xs font-medium text-gray-500">
                      x{{ item.quantity }} =
                      <span class="text-gray-900 font-bold">₹{{ item.total }}</span>
                    </p>
                  </div>
                </div>

                <div
                  class="flex flex-col items-center justify-between shrink-0 border-l border-gray-100 pl-3 ml-1"
                >
                  <button
                    (click)="increaseQuantity(i)"
                    class="w-6 h-6 rounded bg-gray-50 border border-gray-200 hover:bg-[var(--color-primary-50)] hover:text-primary-600 hover:border-primary-200 flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <i class="bi bi-plus"></i>
                  </button>
                  <span class="text-sm font-bold w-6 text-center my-1 text-gray-900">{{
                    item.quantity
                  }}</span>
                  <button
                    (click)="decreaseQuantity(i)"
                    class="w-6 h-6 rounded bg-gray-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <i class="bi bi-dash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Totals & Payment -->
          <div class="p-5 bg-white border-t border-gray-200">
            <div class="space-y-3 mb-5 text-sm">
              <div class="flex justify-between text-gray-600 font-medium">
                <span>Subtotal</span>
                <span class="text-gray-900 font-bold">₹{{ subTotal | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-gray-600 font-medium items-center">
                <span>Discount</span>
                <div class="flex items-center gap-1 w-24">
                  <span class="text-xs text-gray-400">₹</span>
                  <input
                    type="number"
                    [(ngModel)]="discountAmount"
                    class="w-full text-right py-1 px-2 border-gray-200 rounded-md text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div class="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span class="text-base font-bold text-gray-900">Total Amount</span>
                <span class="text-2xl font-black text-primary-600"
                  >₹{{ finalTotal | number: '1.2-2' }}</span
                >
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                (click)="checkout('draft')"
                [disabled]="cartItems.length === 0 || processing"
                class="py-3 px-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <i class="bi bi-journal-text text-gray-500"></i> Save Draft
              </button>
              <button
                (click)="checkout('paid')"
                [disabled]="cartItems.length === 0 || processing"
                class="py-3 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-[var(--color-primary-200)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <i class="bi bi-cash-stack"></i> Pay & Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Variant Selection Modal -->
      <div
        *ngIf="selectedProductForVariants"
        class="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center animate-in fade-in duration-200"
      >
        <div
          class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div
            class="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0"
          >
            <div>
              <h3 class="text-lg font-bold text-gray-900">Select Variant</h3>
              <p class="text-sm text-gray-500 mt-1">{{ selectedProductForVariants.name }}</p>
            </div>
            <button
              (click)="closeVariantModal()"
              class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="p-5 overflow-y-auto flex-1">
            <div class="space-y-3">
              <div
                *ngFor="let variant of selectedProductForVariants.variants"
                (click)="addVariantToCart(selectedProductForVariants, variant)"
                class="p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-primary-500 hover:shadow-sm"
                [ngClass]="
                  variant.stock <= 0
                    ? 'opacity-50 border-gray-200 bg-gray-50 pointer-events-none'
                    : 'border-gray-200 bg-white'
                "
              >
                <div class="flex gap-4 items-center">
                  <div
                    *ngIf="variant.images && variant.images.length > 0"
                    class="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0"
                  >
                    <img [src]="variant.images[0]" class="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900 text-sm flex flex-wrap gap-2">
                      <span
                        *ngIf="variant.size"
                        class="px-2 py-0.5 bg-gray-100 rounded text-gray-700"
                        >Size: {{ variant.size }}</span
                      >
                      <span
                        *ngIf="variant.color"
                        class="px-2 py-0.5 bg-gray-100 rounded text-gray-700"
                        >Color: {{ variant.color }}</span
                      >
                      <span
                        *ngIf="!variant.size && !variant.color"
                        class="px-2 py-0.5 bg-gray-100 rounded text-gray-700"
                        >Default</span
                      >
                    </h4>
                    <p class="text-xs text-gray-500 mt-1">SKU: {{ variant.sku }}</p>
                  </div>
                </div>

                <div class="text-right flex flex-col items-end">
                  <span class="font-bold text-primary-600"
                    >₹{{ variant.discountedPrice || variant.price }}</span
                  >
                  <span
                    *ngIf="variant.stock > 0 && variant.stock <= 5"
                    class="text-[10px] font-bold text-red-500 mt-1"
                    >Only {{ variant.stock }} left</span
                  >
                  <span *ngIf="variant.stock <= 0" class="text-[10px] font-bold text-red-500 mt-1"
                    >Out of Stock</span
                  >
                  <span
                    *ngIf="variant.stock > 5"
                    class="text-[10px] font-medium text-green-600 mt-1"
                    >In Stock</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class POSComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  cartItems: CartItem[] = [];

  searchQuery = '';
  selectedCategory = '';
  selectedProductForVariants: Product | null = null;

  customerName = '';
  customerPhone = '';
  discountAmount = 0;

  loading = true;
  processing = false;
  currentShopId: string | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef;

  private searchSubject = new Subject<string>();
  destroyRef = inject(DestroyRef);
  offlineSyncService = inject(OfflineSyncService);

  isOnline$: Observable<boolean> = this.offlineSyncService.isOnline$;
  pendingSyncCount$: Observable<number> = this.offlineSyncService.pendingCountObs$;

  focusSearchInput() {
    setTimeout(() => {
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.focus();
        this.searchInput.nativeElement.select();
      }
    }, 100);
  }

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private printService: PrintService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user?.shopId) {
        this.currentShopId = user.shopId;
        this.loadInitialData();
      }
    });

    this.searchSubject
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.filterProducts();
      });
  }

  loadInitialData() {
    if (!this.currentShopId) return;
    this.loading = true;

    // Load Categories
    this.categoryService.getCategories(this.currentShopId).subscribe({
      next: (res) => {
        if (res.data) this.categories = res.data;
      },
    });

    // Load Products
    this.productService.getProductsByShop(this.currentShopId).subscribe({
      next: (res) => {
        if (res.data) {
          this.products = res.data.filter((p) => p.isActive !== false);
          this.filteredProducts = [...this.products];
        }
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load products');
        this.loading = false;
      },
    });
  }

  getProductStock(product: Product): number {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }

  getProductPrice(product: Product): number {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants[0].price || 0;
  }

  getProductBarcode(product: Product): string {
    if (!product.variants || product.variants.length === 0) return '';
    return product.variants[0].sku || '';
  }

  getProductSku(product: Product): string {
    if (!product.variants || product.variants.length === 0) return '';
    return product.variants[0].sku || '';
  }

  onSearchQueryChange(query: string) {
    this.searchSubject.next(query);

    // Quick barcode scan simulation
    if (query.length > 5) {
      const exactMatch = this.products.find(
        (p) => this.getProductBarcode(p) === query || this.getProductSku(p) === query,
      );
      if (exactMatch) {
        this.addToCart(exactMatch);
        this.searchQuery = '';
        this.searchSubject.next('');
      }
    }
  }

  filterProducts() {
    let filtered = this.products;

    if (this.selectedCategory) {
      filtered = filtered.filter((p) => p.category === this.selectedCategory);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          this.getProductBarcode(p).toLowerCase().includes(q) ||
          this.getProductSku(p).toLowerCase().includes(q),
      );
    }

    this.filteredProducts = filtered;
  }

  selectCategory(id: string) {
    this.selectedCategory = id;
    this.filterProducts();
  }

  addToCart(product: Product) {
    if (product.variants && product.variants.length > 1) {
      this.selectedProductForVariants = product;
      return;
    }

    const variant =
      product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    this.addVariantToCart(product, variant);
  }

  addVariantToCart(product: Product, variant?: ProductVariant) {
    const stock = variant ? variant.stock : this.getProductStock(product);
    if (stock <= 0) {
      this.toastService.showWarning('Product is out of stock!');
      return;
    }

    const price = variant
      ? variant.discountedPrice || variant.price
      : this.getProductPrice(product);

    const existingItem = this.cartItems.find(
      (item) =>
        item.product.id === product.id && (variant ? item.variant?.sku === variant.sku : true),
    );

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        this.toastService.showWarning('Not enough stock available!');
        return;
      }
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      this.cartItems.push({
        product: product,
        variant: variant,
        quantity: 1,
        price: price,
        total: price,
      });
    }
    this.closeVariantModal();
  }

  closeVariantModal() {
    this.selectedProductForVariants = null;
  }

  increaseQuantity(index: number) {
    const item = this.cartItems[index];
    const stock = item.variant ? item.variant.stock : this.getProductStock(item.product);
    if (item.quantity >= stock) {
      this.toastService.showWarning('Not enough stock available!');
      return;
    }
    item.quantity += 1;
    item.total = item.quantity * item.price;
  }

  decreaseQuantity(index: number) {
    const item = this.cartItems[index];
    if (item.quantity > 1) {
      item.quantity -= 1;
      item.total = item.quantity * item.price;
    } else {
      this.cartItems.splice(index, 1);
    }
  }

  async clearCart() {
    const confirmed = await this.confirmationService.confirm({
      title: 'Clear Cart?',
      description: 'Are you sure you want to clear the cart?',
      type: 'warning',
      primaryButtonText: 'Clear',
      secondaryButtonText: 'Cancel',
    });

    if (confirmed) {
      this.cartItems = [];
      this.customerName = '';
      this.customerPhone = '';
      this.discountAmount = 0;
    }
  }

  get subTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.total, 0);
  }

  get finalTotal(): number {
    return Math.max(0, this.subTotal - (this.discountAmount || 0));
  }

  checkout(status: 'paid' | 'draft') {
    if (this.cartItems.length === 0 || !this.currentShopId) return;

    this.processing = true;

    const payload: Partial<Invoice> = {
      shopId: this.currentShopId,
      invoiceNumber: `INV-${Date.now()}`,
      customerName: this.customerName || 'Walk-in Customer',
      customerPhone: this.customerPhone || 'N/A',
      invoiceDate: new Date(),
      invoiceType: 'retail',
      items: this.cartItems.map((item) => ({
        productId: item.product.id,
        variantId: item.variant?.sku,
        variantSku: item.variant?.sku,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: 0,
        taxRate: 0,
        totalPrice: item.total,
        status: 'paid',
        total: item.total,
      })) as InvoiceItem[],
      subtotal: this.subTotal,
      discount: this.discountAmount,
      taxAmount: 0,
      taxRate: 0,
      total: this.finalTotal,
      status: status,
      paymentMethod: 'cash',
      paymentStatus: status === 'paid' ? 'paid' : 'pending',
      paidAmount: status === 'paid' ? this.finalTotal : 0,
    };

    const handleOfflineSave = () => {
      this.offlineSyncService.saveInvoiceOffline(payload);
      this.toastService.showSuccess('Invoice saved locally. It will sync when online.');
      this.processing = false;
      this.cartItems = [];
      this.customerName = '';
      this.customerPhone = '';
      this.discountAmount = 0;
    };

    if (!this.offlineSyncService.isOnline) {
      handleOfflineSave();
      return;
    }

    this.invoiceService.createInvoice(payload).subscribe({
      next: (res) => {
        this.toastService.showSuccess(
          'Invoice ' + (status === 'paid' ? 'generated' : 'saved as draft') + ' successfully!',
        );
        this.processing = false;

        if (status === 'paid' && res.data) {
          this.printService.openPreview(res.data);
        }

        // Reset POS
        this.cartItems = [];
        this.customerName = '';
        this.customerPhone = '';
        this.discountAmount = 0;
      },
      error: (err) => {
        if (err.status === 0 || err.status === 503 || err.status === 504) {
          // Network error or Gateway timeout, fallback to offline sync
          handleOfflineSave();
        } else {
          this.toastService.showError('Failed to process sale');
          this.processing = false;
          console.error(err);
        }
      },
    });
  }
}
