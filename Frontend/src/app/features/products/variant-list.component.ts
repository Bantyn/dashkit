import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VariantService, Variant } from '../../core/services/variant.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-variant-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: Variant List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Variants</h2>
            <p class="text-xs text-gray-500 mt-1">Manage global product variants (Size, Color, etc.)</p>
          </div>
          <button (click)="openCreatePanel()" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm">
            <i class="bi bi-plus-lg"></i> Add Variant Type
          </button>
        </div>

        <!-- Search -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search variants..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all" />
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Variant Name</th>
                  <th class="px-6 py-3">Values</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (variant of filteredVariants; track variant.id) {
                  <tr (click)="selectVariant(variant)" class="cursor-pointer hover:bg-gray-50 transition-colors group" [class.bg-blue-50]="selectedVariant?.id === variant.id">
                    <td class="px-6 py-4">
                      <div class="text-sm font-semibold text-gray-900">{{ variant.name }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-wrap gap-1.5">
                        @for (val of variant.values; track val) {
                          <span class="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded-md">
                            {{ val }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="variant.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-700 border border-gray-100'" 
                            class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                        {{ variant.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button (click)="$event.stopPropagation(); deleteVariant(variant)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                       <div class="flex flex-col items-center justify-center gap-2">
                          <i class="bi bi-layers text-3xl text-gray-300"></i>
                          <span>No variants found. Add your first variant type!</span>
                       </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── Right Panel: Variant Editor ─── -->
      @if (selectedVariant) {
        <div class="w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col overflow-y-auto shadow-xl">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ isEditingNew ? 'Create Variant' : 'Edit Variant' }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">Customize variant type and its values</p>
            </div>
            <button (click)="closePanel()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="flex-1 p-6 space-y-6">
            <!-- Variant Name -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Variant Name</label>
              <input type="text" [(ngModel)]="tempVariant.name" placeholder="e.g. Size, Color, Material" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all" />
            </div>

            <!-- Status -->
            <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
               <div>
                  <h4 class="text-sm font-semibold text-gray-900">Active Status</h4>
                  <p class="text-xs text-gray-500 mt-0.5">Allow this variant to be used in products</p>
               </div>
               <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="tempVariant.isActive" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
               </label>
            </div>

            <!-- Values -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Variant Values</label>
              <div class="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-4">
                  
                  <div class="flex flex-wrap gap-2">
                     @for (val of tempVariant.values; track val; let i = $index) {
                        <div class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg">
                           <span class="text-sm font-medium text-gray-700">{{ val }}</span>
                           <button (click)="removeValue(i)" class="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-colors leading-none">
                              <i class="bi bi-x-lg text-xs"></i>
                           </button>
                        </div>
                     }
                  </div>

                  <div class="relative">
                     <input type="text" [(ngModel)]="newValue" (keydown.enter)="addValue()" placeholder="Type a value and press Enter..." class="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all" />
                     <button (click)="addValue()" class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                        <i class="bi bi-plus-lg"></i>
                     </button>
                  </div>
                  <p class="text-xs text-gray-400">Press enter to add values. e.g. "S", "M", "L", or "Red", "Blue"</p>

              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
             <button (click)="closePanel()" class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
             </button>
             <button (click)="saveVariant()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                Save Variant
             </button>
          </div>
        </div>
      }
    </div>
  `
})
export class VariantListComponent implements OnInit {
  searchQuery = '';
  variants: Variant[] = [];
  userShopId: string | undefined;

  selectedVariant: Variant | null = null;
  tempVariant: Variant = this.getEmptyVariant();
  isEditingNew = false;
  newValue = '';
  isLoading = false;

  constructor(
    private variantService: VariantService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.userShopId = user.shopId;
        this.loadVariants();
      }
    });
  }

  loadVariants() {
    if (!this.userShopId) return;
    this.isLoading = true;
    this.variantService.getVariantsByShop(this.userShopId).subscribe({
      next: (res) => {
        this.variants = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading variants', err);
        this.isLoading = false;
      }
    });
  }

  get filteredVariants(): Variant[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.variants;
    return this.variants.filter((v) => v.name.toLowerCase().includes(q));
  }

  getEmptyVariant(): Variant {
     return { shopId: this.userShopId || '', name: '', values: [], isActive: true };
  }

  openCreatePanel() {
     this.isEditingNew = true;
     this.tempVariant = this.getEmptyVariant();
     this.selectedVariant = null;
     this.newValue = '';
  }

  selectVariant(variant: Variant) {
     this.isEditingNew = false;
     this.selectedVariant = variant;
     this.tempVariant = { ...variant, values: [...variant.values] };
     this.newValue = '';
  }

  closePanel() {
     this.selectedVariant = null;
     this.isEditingNew = false;
     this.newValue = '';
  }

  addValue() {
     const val = this.newValue.trim();
     if (val && !this.tempVariant.values.includes(val)) {
        this.tempVariant.values.push(val);
     }
     this.newValue = '';
  }

  removeValue(index: number) {
     this.tempVariant.values.splice(index, 1);
  }

  saveVariant() {
     if (!this.tempVariant.name.trim() || !this.userShopId) return; // Simple validation

     this.tempVariant.shopId = this.userShopId;

     if (this.isEditingNew) {
        this.variantService.createVariant(this.tempVariant).subscribe({
          next: () => {
            this.loadVariants();
            this.closePanel();
          },
          error: (err) => console.error('Error creating variant', err)
        });
     } else {
        if (!this.tempVariant.id) return;
        this.variantService.updateVariant(this.tempVariant.id, this.tempVariant).subscribe({
          next: () => {
            this.loadVariants();
            this.closePanel();
          },
          error: (err) => console.error('Error updating variant', err)
        });
     }
  }

  async deleteVariant(variant: Variant) {
     if (!variant.id) return;

     const confirmed = await this.confirmationService.confirm({
       title: 'Delete Variant Type?',
       description: `Are you sure you want to delete the "<strong>${variant.name}</strong>" variant type?`,
       type: 'danger',
       primaryButtonText: 'Delete',
       secondaryButtonText: 'Cancel'
     });

     if (confirmed) {
        this.variantService.deleteVariant(variant.id).subscribe({
          next: () => {
            this.loadVariants();
            if (this.selectedVariant?.id === variant.id) {
               this.closePanel();
            }
          },
          error: (err) => console.error('Error deleting variant', err)
        });
     }
  }
}
