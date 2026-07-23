import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: Category List ─── -->
      <div
        class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900">Categories</h2>
          <button
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
            (click)="openForm()"
          >
            <i class="bi bi-plus-lg"></i> Add Category
          </button>
        </div>

        <!-- Search -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search categories by name or slug..."
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
                  <th class="px-6 py-3">Name</th>
                  <th class="px-6 py-3">Slug</th>
                  <th class="px-6 py-3">Description</th>
                  <th class="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span>Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (error) {
                  <tr>
                    <td colspan="4" class="p-6">
                      <div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                        {{ error }}
                      </div>
                    </td>
                  </tr>
                } @else if (filteredCategories.length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                      @if (categories.length === 0) {
                        No categories found. Add your first category!
                      } @else {
                        No categories match your search.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (category of filteredCategories; track category.id) {
                    <tr
                      (click)="selectCategory(category)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedCategory?.id === category.id"
                    >
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          {{ category.name }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600 font-mono">
                        {{ category.slug }}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                        {{ category.description || '-' }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [class]="
                            category.isActive
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-gray-50 text-gray-500 border border-gray-100'
                          "
                          class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        >
                          {{ category.isActive ? 'Active' : 'Inactive' }}
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

      <!-- ─── Right Panel: Category Detail ─── -->
      @if (selectedCategory) {
        <div
          class="w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 overflow-hidden"
        >
          <!-- Detail Header -->
          <div
            class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50"
          >
            <div>
              <h3 class="text-lg font-bold text-gray-900">Category Details</h3>
            </div>
            <div class="flex items-center gap-1">
              <button
                (click)="onEdit(selectedCategory)"
                class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit"
              >
                <i class="bi bi-pencil-square"></i>
              </button>
              <button
                (click)="onDelete(selectedCategory.id!)"
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
            <!-- Name & Status -->
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-lg font-bold text-gray-900">{{ selectedCategory.name }}</h4>
                <span
                  [class]="
                    selectedCategory.isActive
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-gray-50 text-gray-500 border border-gray-100'
                  "
                  class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                >
                  {{ selectedCategory.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              @if (selectedCategory.description) {
                <p class="text-sm text-gray-500 mt-2 leading-relaxed">
                  {{ selectedCategory.description }}
                </p>
              }
            </div>

            <!-- Slug -->
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
               <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">URL Slug</span>
               <span class="text-sm font-mono text-gray-700">{{ selectedCategory.slug }}</span>
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div
          class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 text-center p-8 h-full sticky top-0"
        >
          <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <i class="bi bi-folder text-2xl text-primary-400"></i>
          </div>
          <h3 class="text-gray-900 font-medium mb-1">No category selected</h3>
          <p class="text-gray-500 text-sm">Select a category from the list to view its details.</p>
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-bold text-gray-900">
              {{ editingCategory ? 'Edit Category' : 'New Category' }}
            </h3>
            <button
              (click)="closeForm()"
              class="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="p-6 overflow-y-auto">
            <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    formControlName="name"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="e.g. Summer Collection"
                  />
                  @if (categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched) {
                    <p class="text-xs text-red-500 mt-1">Name is required</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    formControlName="slug"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm font-mono"
                    placeholder="e.g. summer-collection"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Unique identifier for URL (auto-generated if empty)
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    formControlName="description"
                    rows="3"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                    placeholder="Category description..."
                  ></textarea>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    formControlName="isActive"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label for="isActive" class="text-sm text-gray-700 cursor-pointer">Active Category</label>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  (click)="closeForm()"
                  class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="categoryForm.invalid || isSubmitting"
                  class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  @if (isSubmitting) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  } @else {
                    {{ editingCategory ? 'Update' : 'Create' }}
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | undefined;

  searchQuery = '';
  selectedCategory: Category | null = null;
  
  showForm = false;
  editingCategory: Category | null = null;
  categoryForm: FormGroup;
  isSubmitting = false;

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      description: [''],
      isActive: [true],
    });
  }

  get filteredCategories(): Category[] {
    if (!this.searchQuery.trim()) return this.categories;
    const q = this.searchQuery.toLowerCase();
    return this.categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.slug && c.slug.toLowerCase().includes(q)),
    );
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadCategories();
      }
    });

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe((name) => {
      if (!this.editingCategory) {
        // Only auto-gen for new categories
        const slug = name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        this.categoryForm.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  loadCategories() {
    this.loading = true;
    if (!this.shopId) return;

    this.categoryService.getCategories(this.shopId).subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectCategory(category: Category) {
    this.selectedCategory = category;
  }

  closeDetail() {
    this.selectedCategory = null;
  }

  openForm() {
    this.editingCategory = null;
    this.categoryForm.reset({ isActive: true });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingCategory = null;
  }

  onEdit(category: Category) {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    this.showForm = true;
  }

  async onDelete(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Category?',
      description: 'Are you sure you want to delete this category?',
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          if (this.selectedCategory?.id === id) {
             this.selectedCategory = null;
          }
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          this.toastService.showError('Failed to delete category');
        },
      });
    }
  }

  onSubmit() {
    if (this.categoryForm.invalid || !this.shopId) return;

    this.isSubmitting = true;
    const formVal = this.categoryForm.value;

    // Ensure slug is present
    if (!formVal.slug) {
      formVal.slug = formVal.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    const categoryData: any = {
      shopId: this.shopId,
      ...formVal,
    };

    const request$: Observable<any> = this.editingCategory
      ? this.categoryService.updateCategory(this.editingCategory.id!, categoryData)
      : this.categoryService.createCategory(categoryData);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        
        // Ensure the updated category is selected if we edited it
        if (this.editingCategory && this.selectedCategory?.id === this.editingCategory.id) {
            // Update selected locally or let loadCategories handle it 
            // We can just rely on loadCategories to refresh the list and re-find it if needed,
            // or we will just refresh list and keep selectedCategory id.
        }

        this.closeForm();
        this.loadCategories();
      },
      error: (err: any) => {
        console.error('Error saving category:', err);
        this.isSubmitting = false;
        this.toastService.showError('Failed to save category');
      },
    });
  }
}

