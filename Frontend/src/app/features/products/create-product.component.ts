import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  HostListener,
} from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models/product.model';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { VariantService, Variant } from '../../core/services/variant.service';
import { BrandService, Brand } from '../../core/services/brand.service';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';
import { Shop } from '../../core/models/shop.model';
import { Router } from '@angular/router';
import { ImageUploaderComponent } from '../../shared/components/image-uploader.component';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';

@Component({
  selector: 'app-create-product',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiDropdownComponent, ImageUploaderComponent, HasFeatureDirective],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 class="text-xl font-bold text-gray-900">
              {{ product ? 'Edit Product' : 'Add New Product' }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ product ? 'Update product details below' : 'Enter product details below' }}
            </p>
          </div>
          <button
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 overflow-y-auto flex-1">
          <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
            <!-- Basic Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="e.g. Cotton T-Shirt"
                />
              </div>
              <div *appHasFeature="'inv_brands'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <app-ui-dropdown
                  formControlName="brand"
                  [options]="brandOptions"
                  placeholder="Select Brand"
                ></app-ui-dropdown>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div *appHasFeature="'inv_categories'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <app-ui-dropdown
                  formControlName="category"
                  [options]="categoryOptions"
                  placeholder="Select Category"
                ></app-ui-dropdown>
              </div>
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">Subcategory / Style</label>
                <div class="relative">
                  <input
                    type="text"
                    formControlName="subcategory"
                    (focus)="showSubcategorySuggestions = true"
                    (input)="onSubcategoryInput($event)"
                    (blur)="onSubcategoryBlur()"
                    class="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm pr-10"
                    placeholder="e.g. Pant, jackets, bras"
                  />
                  <button
                    type="button"
                    (click)="toggleSubcategorySuggestions()"
                    class="absolute right-0 top-0 bottom-0 px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <i class="bi bi-chevron-down text-xs transition-transform duration-200" [class.rotate-180]="showSubcategorySuggestions"></i>
                  </button>
                </div>
                <!-- Custom Dropdown Panel -->
                <div
                  *ngIf="showSubcategorySuggestions && filteredSubcategories.length > 0"
                  class="absolute left-0 right-0 top-full mt-2 z-50 p-1 rounded-lg border border-gray-200 bg-white shadow-xl max-h-60 overflow-y-auto"
                >
                  <button
                    *ngFor="let sub of filteredSubcategories"
                    type="button"
                    (click)="selectSubcategorySuggestion(sub)"
                    class="w-full text-left px-4 py-2.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium"
                  >
                    {{ sub | titlecase }}
                  </button>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                formControlName="description"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="Product description..."
              ></textarea>
            </div>

            <!-- Product Images -->
            <div class="mb-6">
              <app-image-uploader
                [images]="productImages"
                (imagesChange)="onProductImagesChanged($event)"
                [shopId]="userShopId || ''"
                [multiple]="true"
                [maxImages]="5"
                label="Product Images"
              ></app-image-uploader>
            </div>

            <!-- Variants Section -->
            <div class="mb-8" *appHasFeature="'inv_variants'">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">Variants (Sizes/Colors)</h3>
                <button
                  type="button"
                  (click)="addVariant()"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Variant
                </button>
              </div>

              <div formArrayName="variants" class="space-y-4">
                <div
                  *ngFor="let variant of variants.controls; let i = index"
                  [formGroupName]="i"
                  class="flex flex-wrap gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-100 relative group"
                >
                  <div class="w-32">
                    <div class="flex items-center justify-between mb-1">
                      <label class="block text-xs font-medium text-gray-500">Size</label>
                      <button
                        *ngIf="sizeOptions.length > 0"
                        type="button"
                        (click)="goToVariants()"
                        class="text-[10px] text-primary-600 hover:text-primary-800"
                        title="Manage Sizes"
                      >
                        <i class="bi bi-plus-lg"></i>
                      </button>
                    </div>
                    <app-ui-dropdown
                      *ngIf="sizeOptions.length > 0"
                      formControlName="size"
                      [options]="sizeOptions"
                      placeholder="Size"
                    ></app-ui-dropdown>
                    <input
                      *ngIf="sizeOptions.length === 0"
                      type="text"
                      formControlName="size"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none bg-white text-sm"
                      placeholder="e.g. M"
                    />
                  </div>
                  <div class="w-32">
                    <div class="flex items-center justify-between mb-1">
                      <label class="block text-xs font-medium text-gray-500">Color</label>
                      <button
                        *ngIf="colorOptions.length > 0"
                        type="button"
                        (click)="goToVariants()"
                        class="text-[10px] text-primary-600 hover:text-primary-800"
                        title="Manage Colors"
                      >
                        <i class="bi bi-plus-lg"></i>
                      </button>
                    </div>
                    <app-ui-dropdown
                      *ngIf="colorOptions.length > 0"
                      formControlName="color"
                      [options]="colorOptions"
                      placeholder="Color"
                    ></app-ui-dropdown>
                    <input
                      *ngIf="colorOptions.length === 0"
                      type="text"
                      formControlName="color"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none bg-white text-sm"
                      placeholder="e.g. Red"
                    />
                  </div>
                  <div class="w-32">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Price</label>
                    <input
                      type="number"
                      formControlName="price"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                    />
                  </div>
                  <div class="w-32">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                    <input
                      type="number"
                      formControlName="stock"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                    />
                  </div>
                  <div class="w-40">
                    <label class="block text-xs font-medium text-gray-500 mb-1"
                      >Barcode / SKU</label
                    >
                    <div class="relative">
                      <input
                        type="text"
                        formControlName="sku"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none bg-white font-mono"
                        placeholder="Scan or Auto-generated"
                      />
                      <button
                        type="button"
                        (click)="regenerateSku(i)"
                        class="absolute right-7 top-1.5 text-gray-400 hover:text-primary-600"
                        title="Regenerate Barcode"
                      >
                        <i class="bi bi-arrow-clockwise text-xs"></i>
                      </button>
                      <button
                        type="button"
                        (click)="printBarcode(i)"
                        class="absolute right-2 top-1.5 text-gray-400 hover:text-green-600 border-l border-gray-200 pl-2"
                        title="Print Label"
                      >
                        <i class="bi bi-printer text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Variant Images -->
                  <div class="w-full mt-2 pt-3 border-t border-gray-100">
                    <label class="block text-xs font-medium text-gray-500 mb-2">Specific Images for this Color/Variant (Optional)</label>
                    <app-image-uploader
                      [images]="variant.get('images')?.value || []"
                      (imagesChange)="onVariantImagesChanged(i, $event)"
                      [shopId]="userShopId || ''"
                      [multiple]="true"
                      [maxImages]="5"
                      label="Variant Images"
                    ></app-image-uploader>
                  </div>

                  <button
                    type="button"
                    (click)="removeVariant(i)"
                    class="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 p-1 rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Variant"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                formControlName="isActive"
                id="isActive"
                class="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <label for="isActive" class="text-sm font-medium text-gray-700"
                >Active (Visible)</label
              >
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            (click)="close.emit()"
            class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="productForm.invalid || isSubmitting"
            class="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span
              *ngIf="isSubmitting"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
            {{
              isSubmitting
                ? product
                  ? 'Updating...'
                  : 'Creating...'
                : product
                  ? 'Update Product'
                  : 'Add Product'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Add Category Modal -->
    <div *ngIf="showQuickCategoryModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in border border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Add New Category</h3>
        <form [formGroup]="quickCategoryForm" (ngSubmit)="submitQuickCategory()">
          <div class="mb-5">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              formControlName="name"
              class="w-full h-11 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
              placeholder="e.g. Shirts, Shoes"
              required
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="closeQuickCategoryModal()"
              class="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="quickCategoryForm.invalid"
              class="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quick Add Brand Modal -->
    <div *ngIf="showQuickBrandModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in border border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Add New Brand</h3>
        <form [formGroup]="quickBrandForm" (ngSubmit)="submitQuickBrand()">
          <div class="mb-5">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Brand Name</label>
            <input
              type="text"
              formControlName="name"
              class="w-full h-11 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
              placeholder="e.g. Nike, Zara"
              required
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="closeQuickBrandModal()"
              class="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="quickBrandForm.invalid"
              class="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Brand
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CreateProductComponent implements OnInit, OnChanges {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() productCreated = new EventEmitter<void>();

  productForm: FormGroup;
  isSubmitting = false;
  userShopId: string | undefined;
  productImages: string[] = [];
  categories: Category[] = [];
  existingSubcategories: string[] = [];
  filteredSubcategories: string[] = [];
  showSubcategorySuggestions = false;
  showQuickCategoryModal = false;
  showQuickBrandModal = false;
  quickCategoryForm!: FormGroup;
  quickBrandForm!: FormGroup;

  get categoryOptions() {
    const options: any[] = this.categories.map((cat) => ({
      value: cat.slug,
      label: cat.name,
      icon: 'layers', // Default icon for categories
      color: '#4B5563',
    }));
    options.push({
      value: 'ADD_NEW',
      label: '+ Add New Category',
      icon: 'plus',
      color: '#2563EB',
    });
    return options;
  }

  brands: Brand[] = [];
  get brandOptions() {
    const options: any[] = this.brands.map((b) => ({
      value: b.name,
      label: b.name,
      color: '#4B5563',
    }));
    // Always include "Other" as default
    if (!options.find((o) => o.value === 'Other')) {
      options.unshift({ value: 'Other', label: 'Other', color: '#9CA3AF' });
    }
    options.push({
      value: 'ADD_NEW',
      label: '+ Add New Brand',
      icon: 'plus',
      color: '#2563EB',
    });
    return options;
  }

  // Real global variant values
  sizeOptions: any[] = [];
  colorOptions: any[] = [];

  globalSizeVariant: Variant | null = null;
  globalColorVariant: Variant | null = null;
  shopDetails: Shop | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private variantService: VariantService,
    private brandService: BrandService,
    private shopService: ShopService,
    private toastService: ToastService,
    private router: Router,
    private elRef: ElementRef,
    private featureGuard: FeatureGuardService,
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: [''],
      subcategory: [''],
      brand: ['Other'],
      isActive: [true],
      variants: this.fb.array([]),
    });

    this.quickCategoryForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.quickBrandForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.userShopId = user.shopId;
        this.loadCategories();
        this.loadGlobalVariants();
        this.loadBrands();
        this.loadShopDetails();
        this.loadExistingSubcategories();
      }
    });

    if (!this.product) {
      this.addVariant();
      this.productImages = [];
    }

    this.productForm.get('category')?.valueChanges.subscribe((value) => {
      if (value === 'ADD_NEW') {
        this.openQuickCategoryModal();
      }
    });

    this.productForm.get('brand')?.valueChanges.subscribe((value) => {
      if (value === 'ADD_NEW') {
        this.openQuickBrandModal();
      }
    });
  }

  goToVariants() {
    this.close.emit();
    this.router.navigate(['/', this.userShopId, 'products', 'variants']);
  }

  loadGlobalVariants() {
    if (!this.userShopId || !this.featureGuard.hasFeatureSync(null, 'inv_variants')) return;
    this.variantService.getVariantsByShop(this.userShopId).subscribe({
      next: (response) => {
        if (response.data) {
          const rawVariants = response.data;

          const sizeVar = rawVariants.find((v) => v.name.toLowerCase() === 'size');
          if (sizeVar) {
            this.globalSizeVariant = sizeVar;
            this.sizeOptions = sizeVar.values.map((val) => ({ value: val, label: val }));
          }

          const colorVar = rawVariants.find((v) => v.name.toLowerCase() === 'color');
          if (colorVar) {
            this.globalColorVariant = colorVar;
            this.colorOptions = colorVar.values.map((val) => ({ value: val, label: val }));
          }
        }
      },
      error: (err) => console.error('Error loading variants:', err),
    });
  }

  loadCategories() {
    if (!this.userShopId || !this.featureGuard.hasFeatureSync(null, 'inv_categories')) return;
    this.categoryService.getCategories(this.userShopId).subscribe({
      next: (response) => {
        this.categories = response.data;
        // Set default category if not set and categories exist
        if (this.categories.length > 0 && !this.productForm.get('category')?.value) {
          this.productForm.patchValue({ category: this.categories[0].slug });
        }
      },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  loadBrands() {
    if (!this.userShopId || !this.featureGuard.hasFeatureSync(null, 'inv_brands')) return;
     this.brandService.getBrandsByShop(this.userShopId).subscribe({
      next: (response) => {
        this.brands = response.data || [];
      },
      error: (err) => console.error('Error loading brands:', err),
    });
  }

  loadShopDetails() {
    if (!this.userShopId) return;
    this.shopService.getShop(this.userShopId).subscribe({
      next: (res: any) => {
        if (res.data) this.shopDetails = res.data;
      },
      error: (err: any) => console.error('Error loading shop details:', err)
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && this.product) {
      this.patchForm(this.product);
    }
  }

  patchForm(product: Product) {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand || 'Other',
      isActive: product.isActive,
    });

    this.productImages = [...(product.images || [])];

    // Clear existing variants
    const variantsArray = this.productForm.get('variants') as FormArray;
    variantsArray.clear();

    // Add variants from product
    product.variants.forEach((variant) => {
      variantsArray.push(
        this.fb.group({
          size: [variant.size || ''],
          color: [variant.color || ''],
          price: [variant.price, [Validators.required, Validators.min(0)]],
          stock: [variant.stock, [Validators.required, Validators.min(0)]],
          sku: [variant.sku],
          images: [variant.images || []],
        }),
      );
    });
  }

  get variants() {
    return this.productForm.get('variants') as FormArray;
  }

  addVariant() {
    const variantGroup = this.fb.group({
      size: [''],
      color: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [this.generateBarcode()],
      images: [[]],
    });
    this.variants.push(variantGroup);
  }

  generateBarcode(): string {
    // Generate a 12-digit numeric barcode starting with 25 (Internal use)
    const timestamp = Date.now().toString().slice(-7);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return '25' + timestamp + random;
  }

  regenerateSku(index: number) {
    const variants = this.productForm.get('variants') as FormArray;
    variants.at(index).patchValue({ sku: this.generateBarcode() });
  }

  printBarcode(index: number) {
    const variant = this.variants.at(index).value;
    const productName = this.productForm.get('name')?.value || 'Product';
    const brand = this.productForm.get('brand')?.value || '';

    // Use loaded shop details for the name
    const shopName = this.shopDetails?.shopName || 'CLOTHIFY RETAIL';

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      this.toastService.showWarning('Please allow popups to print labels');
      return;
    }

    // Creating labels based on actual Stock count
    const labelCount = Math.max(variant.stock || 1, 1); 
    const labelsHtml = Array(labelCount)
      .fill(0)
      .map(
        () => `
      <div class="label">
        <div class="shop-name">${shopName}</div>
        <div class="prod-name">${brand} ${productName}</div>
        <div class="variant-info">${variant.size} | ${variant.color || 'ST'}</div>
        <div class="price">₹${variant.price}</div>
        <div class="barcode-container">
          <img class="barcode-img" src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${variant.sku}&scale=1&rotate=N&includetext=false">
          <div class="sku-text">${variant.sku}</div>
        </div>
      </div>
    `,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Labels (${labelCount}) - ${variant.sku}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 0; 
              background: #f0f0f0; 
              font-family: 'Inter', sans-serif;
            }
            .a4-page {
              width: 210mm;
              margin: 10mm auto;
              background: white;
              padding: 10mm 5mm;
              display: grid;
              grid-template-columns: repeat(4, 48.5mm);
              grid-auto-rows: 25.4mm; /* Auto-height grid for multi-page */
              gap: 2mm 3mm;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              justify-content: center;
            }
            .label {
              width: 48.5mm;
              height: 25.4mm;
              border: 0.1mm solid #eee;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              padding: 2mm;
              overflow: hidden;
              text-align: center;
              page-break-inside: avoid;
            }
            .shop-name { font-size: 6px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; margin-bottom: 1px; }
            .prod-name { font-size: 8px; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
            .variant-info { font-size: 6px; color: #666; font-weight: 500; }
            .price { font-size: 9px; font-weight: 800; color: #000; margin: 1px 0; }
            .barcode-container { width: 100%; display: flex; flex-direction: column; align-items: center; }
            .barcode-img { height: 7mm; width: 90%; object-fit: contain; }
            .sku-text { font-size: 6px; font-family: monospace; letter-spacing: 1px; margin-top: 1px; }

            @media print {
              body { background: none; margin: 0; }
              .a4-page { margin: 0; box-shadow: none; padding: 10mm 5mm; width: 100%; }
              .label { border: none; }
              @page { size: A4; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="a4-page">
            ${labelsHtml}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // window.close(); // Keep open to verify on screen if needed
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  onSubmit() {
    if (this.productForm.invalid || !this.userShopId) return;

    this.isSubmitting = true;
    const formVal = this.productForm.value;

    const productData: any = {
      shopId: this.userShopId,
      name: formVal.name,
      description: formVal.description,
      category: formVal.category,
      subcategory: formVal.subcategory || '',
      brand: formVal.brand,
      isActive: formVal.isActive,
      images: this.productImages,
      tags: this.product?.tags || [],
      seo: {
        metaTitle: formVal.name,
        metaDescription: formVal.description,
        slug: formVal.name.toLowerCase().replace(/\s+/g, '-'),
      },
      variants: formVal.variants,
    };

    const request$: Observable<any> = this.product
      ? this.productService.updateProduct(this.product.id, productData as Partial<Product>)
      : this.productService.createProduct(productData as Partial<Product>);

    request$.subscribe({
      next: () => {
        this.saveNewVariantsGlobally(formVal.variants);
        this.isSubmitting = false;
        this.productCreated.emit();
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Error saving product:', err);
        this.isSubmitting = false;
      },
    });
  }

  private saveNewVariantsGlobally(variants: any[]) {
    if (!this.userShopId) return;

    // Check if we need to learn new Sizes
    if (this.sizeOptions.length === 0) {
      const newSizes = Array.from(new Set(variants.map((v) => v.size?.trim()).filter(Boolean)));
      if (newSizes.length > 0) {
        this.variantService
          .createVariant({
            shopId: this.userShopId,
            name: 'Size',
            values: newSizes,
            isActive: true,
          })
          .subscribe();
      }
    }

    // Check if we need to learn new Colors
    if (this.colorOptions.length === 0) {
      const newColors = Array.from(new Set(variants.map((v) => v.color?.trim()).filter(Boolean)));
      if (newColors.length > 0) {
        this.variantService
          .createVariant({
            shopId: this.userShopId,
            name: 'Color',
            values: newColors,
            isActive: true,
          })
          .subscribe();
      }
    }
  }

  onProductImagesChanged(urls: string[]) {
    this.productImages = urls;
  }

  onVariantImagesChanged(index: number, urls: string[]) {
    const variantControl = this.variants.at(index);
    if (variantControl) {
      variantControl.patchValue({ images: urls });
    }
  }

  loadExistingSubcategories() {
    if (!this.userShopId) return;
    this.productService.getProductsByShop(this.userShopId).subscribe({
      next: (response) => {
        if (response.data) {
          const unique = new Set(
            response.data
              .map((p) => p.subcategory?.trim())
              .filter(Boolean)
          );
          this.existingSubcategories = Array.from(unique).sort() as string[];
          this.filteredSubcategories = [...this.existingSubcategories];
        }
      },
      error: (err) => {
        console.error('Error loading subcategories:', err);
      }
    });
  }

  onSubcategoryInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.filterSubcategories(val);
    this.showSubcategorySuggestions = true;
  }

  onSubcategoryBlur() {
    // Delay hiding to allow click events on suggestions to fire first
    setTimeout(() => {
      this.showSubcategorySuggestions = false;
    }, 200);
  }

  filterSubcategories(query: string) {
    if (!query) {
      this.filteredSubcategories = [...this.existingSubcategories];
    } else {
      const q = query.toLowerCase();
      this.filteredSubcategories = this.existingSubcategories.filter((sub) =>
        sub.toLowerCase().includes(q)
      );
    }
  }

  toggleSubcategorySuggestions() {
    this.showSubcategorySuggestions = !this.showSubcategorySuggestions;
    if (this.showSubcategorySuggestions) {
      const currentVal = this.productForm.get('subcategory')?.value || '';
      this.filterSubcategories(currentVal);
    }
  }

  selectSubcategorySuggestion(sub: string) {
    this.productForm.patchValue({ subcategory: sub });
    this.showSubcategorySuggestions = false;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showSubcategorySuggestions && !this.elRef.nativeElement.contains(event.target)) {
      this.showSubcategorySuggestions = false;
    }
  }

  openQuickCategoryModal() {
    this.quickCategoryForm.reset();
    this.showQuickCategoryModal = true;
  }

  closeQuickCategoryModal() {
    this.showQuickCategoryModal = false;
    this.productForm.patchValue({ category: '' }, { emitEvent: false });
  }

  submitQuickCategory() {
    if (this.quickCategoryForm.invalid || !this.userShopId) return;
    const formVal = this.quickCategoryForm.value;
    const slug = formVal.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    this.categoryService.createCategory({
      shopId: this.userShopId,
      name: formVal.name,
      slug,
      description: '',
      isActive: true
    }).subscribe({
      next: () => {
        this.loadCategories();
        this.productForm.patchValue({ category: slug });
        this.showQuickCategoryModal = false;
      },
      error: (err) => {
        console.error('Error creating category:', err);
        this.toastService.showError('Failed to create category');
      }
    });
  }

  openQuickBrandModal() {
    this.quickBrandForm.reset();
    this.showQuickBrandModal = true;
  }

  closeQuickBrandModal() {
    this.showQuickBrandModal = false;
    this.productForm.patchValue({ brand: 'Other' }, { emitEvent: false });
  }

  submitQuickBrand() {
    if (this.quickBrandForm.invalid || !this.userShopId) return;
    const formVal = this.quickBrandForm.value;

    this.brandService.createBrand({
      shopId: this.userShopId,
      name: formVal.name,
      isActive: true
    }).subscribe({
      next: () => {
        this.loadBrands();
        this.productForm.patchValue({ brand: formVal.name });
        this.showQuickBrandModal = false;
      },
      error: (err) => {
        console.error('Error creating brand:', err);
        this.toastService.showError('Failed to create brand');
      }
    });
  }
}
