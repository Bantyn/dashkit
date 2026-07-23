import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeasonalCollectionService, SeasonalCollection } from '../../core/services/seasonal-collection.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { ToastService } from '../../core/services/toast.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';
import { UiDropdownComponent, DropdownOption } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-seasonal-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UiLoadingComponent, UiDropdownComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: Collection Grid ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Seasonal Collections</h2>
            <p class="text-xs text-gray-400 mt-0.5">Organize products into seasons (Summer, Winter, Festive) for your storefront.</p>
          </div>
          <button
            (click)="openCreateForm()"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <i class="bi bi-folder-plus"></i>
            Create Collection
          </button>
        </div>

        <!-- Main Layout Grid -->
        <div class="flex-1 overflow-y-auto p-6">
          @if (loading) {
            <div class="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <app-ui-loading size="md"></app-ui-loading>
              <span class="text-xs font-semibold tracking-widest uppercase">Loading collections...</span>
            </div>
          } @else if (collections.length === 0) {
            <div class="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <i class="bi bi-tags-fill text-5xl text-slate-200"></i>
              <h3 class="font-semibold text-slate-700">No Seasonal Collections</h3>
              <p class="text-xs">Group products into custom collections for targeted seasonal marketing campaigns.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              @for (col of collections; track col.id) {
                <div 
                  (click)="openEditForm(col)"
                  class="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all flex flex-col overflow-hidden cursor-pointer group"
                  [class.ring-2]="editingColId === col.id"
                  [class.ring-primary-500]="editingColId === col.id"
                  [class.border-transparent]="editingColId === col.id"
                >
                  <!-- Card Header -->
                  <div class="p-5 border-b border-slate-50 flex justify-between items-start">
                    <div>
                      <h3 class="font-bold text-gray-900 text-base group-hover:text-primary-600 transition-colors">{{ col.name }}</h3>
                      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 mt-2 inline-block">
                        {{ col.season }}
                      </span>
                    </div>
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="col.active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-700 border border-gray-100'">
                      {{ col.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>

                  <!-- Card Body (Description & Product count) -->
                  <div class="p-5 flex-1 space-y-4">
                    @if (col.description) {
                      <p class="text-sm text-gray-500 line-clamp-2 leading-relaxed">{{ col.description }}</p>
                    }
                    <div class="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl text-sm">
                      <span class="text-gray-500 font-medium">Assigned Products</span>
                      <span class="font-bold text-gray-900">{{ (col.productIds || []).length || 0 }} items</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- ─── Right Panel: Create / Edit Form ─── -->
      @if (showForm) {
        <div class="w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 overflow-hidden shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
          <div class="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
            <h3 class="text-lg font-bold text-gray-900">{{ editingColId ? 'Edit Collection' : 'Create Collection' }}</h3>
            <div class="flex items-center gap-2">
              @if (editingColId) {
                <button (click)="deleteCollection(editingColId)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              }
              <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-200 rounded-lg transition-colors" title="Close">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-6">
            <form [formGroup]="colForm" (ngSubmit)="submitCollection()" class="space-y-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1">Collection Name</label>
                  <input type="text" formControlName="name" placeholder="e.g. Summer 2026" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none" />
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1">Season Type</label>
                  <app-ui-dropdown
                    formControlName="season"
                    [options]="seasonOptions"
                    placeholder="Select Season"
                  ></app-ui-dropdown>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea formControlName="description" rows="3" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none resize-none" placeholder="Brief info..."></textarea>
              </div>

              <label class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" formControlName="active" class="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span class="text-sm font-medium text-gray-900">Display collection on storefront website</span>
              </label>

              <!-- Product Picker -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-semibold text-gray-700">Select Products</label>
                  <span class="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ selectedProductIds.length }} selected</span>
                </div>
                <div class="border border-gray-200 rounded-xl bg-gray-50 p-2 max-h-60 overflow-y-auto space-y-1">
                  @if (productsList.length === 0) {
                    <div class="p-4 text-center text-sm text-gray-500">No products available.</div>
                  }
                  @for (p of productsList; track p.id) {
                    <label class="flex items-center gap-3 hover:bg-white hover:shadow-sm p-2 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-100">
                      <input
                        type="checkbox"
                        [checked]="isProductSelected(p.id)"
                        (change)="toggleProductSelection(p.id)"
                        class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{{ p.name }}</div>
                        <div class="text-xs text-gray-500 capitalize">{{ p.category }}</div>
                      </div>
                    </label>
                  }
                </div>
              </div>

            </form>
          </div>
          
          <div class="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-end gap-3">
            <button type="button" (click)="closeForm()" class="px-5 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors text-sm">Cancel</button>
            <button type="button" (click)="submitCollection()" [disabled]="colForm.invalid" class="px-5 py-2.5 rounded-lg font-medium bg-primary-600 hover:bg-primary-700 text-white text-sm disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
              <i class="bi bi-check2"></i>
              {{ editingColId ? 'Save Changes' : 'Create Collection' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      }
    `
  ]
})
export class SeasonalCollectionsComponent implements OnInit {
  private colService = inject(SeasonalCollectionService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private confirmationService = inject(ConfirmationService);

  shopId = '';
  collections: SeasonalCollection[] = [];
  productsList: Product[] = [];
  loading = false;

  showForm = false;
  editingColId: string | null = null;
  colForm!: FormGroup;
  selectedProductIds: string[] = [];

  seasonOptions: DropdownOption[] = [
    { value: 'summer', label: 'Summer' },
    { value: 'winter', label: 'Winter' },
    { value: 'festive', label: 'Festive' },
    { value: 'monsoon', label: 'Monsoon' },
    { value: 'spring', label: 'Spring' },
    { value: 'autumn', label: 'Autumn' },
    { value: 'other', label: 'Other' },
  ];

  ngOnInit() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const shopId = params.get('shopId');
      if (shopId) {
        this.shopId = shopId;
        this.loadCollections();
        this.loadProducts();
      }
    });

    this.initForm();
  }

  initForm() {
    this.colForm = this.fb.group({
      name: ['', Validators.required],
      season: ['summer', Validators.required],
      description: [''],
      active: [true],
    });
    this.selectedProductIds = [];
  }

  loadCollections() {
    this.loading = true;
    this.colService.listCollections(this.shopId).subscribe({
      next: (res) => {
        this.collections = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load seasonal collections');
        this.loading = false;
      }
    });
  }

  loadProducts() {
    this.productService.getProductsByShop(this.shopId).subscribe({
      next: (res) => {
        this.productsList = res.data || [];
      }
    });
  }

  openCreateForm() {
    this.editingColId = null;
    this.showForm = true;
    this.initForm();
  }

  openEditForm(col: SeasonalCollection) {
    this.editingColId = col.id;
    this.selectedProductIds = [...(col.productIds || [])];
    this.colForm.patchValue({
      name: col.name,
      season: col.season,
      description: col.description || '',
      active: col.active,
    });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingColId = null;
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds.includes(productId);
  }

  toggleProductSelection(productId: string) {
    const idx = this.selectedProductIds.indexOf(productId);
    if (idx > -1) {
      this.selectedProductIds.splice(idx, 1);
    } else {
      this.selectedProductIds.push(productId);
    }
  }

  submitCollection() {
    if (this.colForm.invalid) return;

    const payload = {
      ...this.colForm.value,
      shopId: this.shopId,
      productIds: this.selectedProductIds,
    };

    if (this.editingColId) {
      this.colService.updateCollection(this.editingColId, payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Collection updated successfully');
          this.loadCollections();
          this.closeForm();
        },
        error: () => this.toastService.showError('Failed to update collection')
      });
    } else {
      this.colService.createCollection(payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Collection created successfully');
          this.loadCollections();
          this.closeForm();
        },
        error: () => this.toastService.showError('Failed to create collection')
      });
    }
  }

  async deleteCollection(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Collection?',
      description: 'Are you sure you want to delete this collection?',
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.colService.deleteCollection(this.shopId, id).subscribe({
      next: () => {
        this.toastService.showSuccess('Collection deleted');
        this.loadCollections();
        this.closeForm();
      },
      error: () => this.toastService.showError('Failed to delete collection')
    });
  }
}
