import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandService, Brand } from '../../core/services/brand.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-brand-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: Brand List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Brands</h2>
            <p class="text-xs text-gray-500 mt-1">Manage your product brands</p>
          </div>
          <button (click)="openCreatePanel()" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm">
            <i class="bi bi-plus-lg"></i> Add Brand
          </button>
        </div>

        <!-- Search -->
        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search brands by name..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all" />
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Brand Name</th>
                  <th class="px-6 py-3">Description</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (brand of filteredBrands; track brand.id) {
                  <tr (click)="selectBrand(brand)" class="cursor-pointer hover:bg-gray-50 transition-colors group" [class.bg-blue-50]="selectedBrand?.id === brand.id">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        @if (brand.logo) {
                          <img [src]="brand.logo" class="w-8 h-8 rounded-full border border-gray-200 object-contain" alt="" />
                        } @else {
                          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs capitalize">
                            {{ brand.name.charAt(0) }}
                          </div>
                        }
                        <div class="text-sm font-semibold text-gray-900">{{ brand.name }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-xs text-gray-500 line-clamp-1">{{ brand.description || 'No description' }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="brand.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-700 border border-gray-100'" 
                            class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                        {{ brand.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button (click)="$event.stopPropagation(); deleteBrand(brand)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                       <div class="flex flex-col items-center justify-center gap-2">
                          <i class="bi bi-tags text-3xl text-gray-300"></i>
                          <span>No brands found. Add your first brand!</span>
                       </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── Right Panel: Brand Editor ─── -->
      @if (selectedBrand) {
        <div class="w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col overflow-y-auto shadow-xl transition-all duration-300">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ isEditingNew ? 'Create Brand' : 'Edit Brand' }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">Manage brand identification and status</p>
            </div>
            <button (click)="closePanel()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="flex-1 p-6 space-y-6">
            <!-- Brand Name -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Brand Name</label>
              <input type="text" [(ngModel)]="tempBrand.name" placeholder="e.g. Nike, Adidas, Zara" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all" />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Description</label>
              <textarea [(ngModel)]="tempBrand.description" rows="4" placeholder="Brief description of the brand..." class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all resize-none"></textarea>
            </div>

            <!-- Status -->
            <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
               <div>
                  <h4 class="text-sm font-semibold text-gray-900">Active Status</h4>
                  <p class="text-xs text-gray-500 mt-0.5">Visible in product selection</p>
               </div>
               <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="tempBrand.isActive" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
               </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
             <button (click)="closePanel()" class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
             </button>
             <button (click)="saveBrand()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                Save Brand
             </button>
          </div>
        </div>
      }
    </div>
  `
})
export class BrandListComponent implements OnInit {
  searchQuery = '';
  brands: Brand[] = [];
  userShopId: string | undefined;

  selectedBrand: Brand | null = null;
  tempBrand: Brand = this.getEmptyBrand();
  isEditingNew = false;
  isLoading = false;

  constructor(
    private brandService: BrandService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.userShopId = user.shopId;
        this.loadBrands();
      }
    });
  }

  loadBrands() {
    if (!this.userShopId) return;
    this.isLoading = true;
    this.brandService.getBrandsByShop(this.userShopId).subscribe({
      next: (res) => {
        this.brands = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading brands', err);
        this.isLoading = false;
      }
    });
  }

  get filteredBrands() {
    if (!this.searchQuery.trim()) return this.brands;
    const q = this.searchQuery.toLowerCase();
    return this.brands.filter(b => b.name.toLowerCase().includes(q));
  }

  getEmptyBrand(): Brand {
     return { shopId: this.userShopId || '', name: '', isActive: true };
  }

  openCreatePanel() {
     this.isEditingNew = true;
     this.selectedBrand = this.getEmptyBrand();
     this.tempBrand = JSON.parse(JSON.stringify(this.selectedBrand));
  }

  selectBrand(brand: Brand) {
     this.isEditingNew = false;
     this.selectedBrand = brand;
     this.tempBrand = JSON.parse(JSON.stringify(brand));
  }

  closePanel() {
     this.selectedBrand = null;
     this.isEditingNew = false;
  }

  saveBrand() {
     if (!this.tempBrand.name.trim() || !this.userShopId) return;

     this.tempBrand.shopId = this.userShopId;

     if (this.isEditingNew) {
        this.brandService.createBrand(this.tempBrand).subscribe({
          next: () => {
            this.loadBrands();
            this.closePanel();
          },
          error: (err) => console.error('Error creating brand', err)
        });
     } else {
        if (!this.tempBrand.id) return;
        this.brandService.updateBrand(this.tempBrand.id, this.tempBrand).subscribe({
          next: () => {
            this.loadBrands();
            this.closePanel();
          },
          error: (err) => console.error('Error updating brand', err)
        });
     }
  }

  async deleteBrand(brand: Brand) {
     if (!brand.id) return;

     const confirmed = await this.confirmationService.confirm({
       title: 'Delete Brand?',
       description: `Are you sure you want to delete the "<strong>${brand.name}</strong>" brand?`,
       type: 'danger',
       primaryButtonText: 'Delete',
       secondaryButtonText: 'Cancel'
     });

     if (confirmed) {
        this.brandService.deleteBrand(brand.id).subscribe({
          next: () => {
            this.loadBrands();
            if (this.selectedBrand?.id === brand.id) {
               this.closePanel();
            }
          },
          error: (err) => console.error('Error deleting brand', err)
        });
     }
  }
}
