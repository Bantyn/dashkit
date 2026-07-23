import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PromotionService } from '../../core/services/promotion.service';
import { Promotion } from '../../core/models/promotion.model';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { getLocalISODate } from '../../core/utils/date.utils';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-loyalty-programs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Loyalty Programs</h2>
          <button (click)="openForm()" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm">
            <i class="bi bi-star"></i> Setup Program
          </button>
        </div>

        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search programs by name..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all" />
          </div>
        </div>

        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Program Name</th>
                  <th class="px-6 py-3">Reward Rate</th>
                  <th class="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr><td colspan="3" class="px-6 py-8 text-center text-gray-500"><div class="flex flex-col items-center justify-center gap-4"><app-ui-loading size="md"></app-ui-loading><span>Loading...</span></div></td></tr>
                } @else if (error) {
                  <tr><td colspan="3" class="p-6"><div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">{{ error }}</div></td></tr>
                } @else if (filteredItems.length === 0) {
                  <tr><td colspan="3" class="px-6 py-8 text-center text-gray-500">No programs found.</td></tr>
                } @else {
                  @for (item of filteredItems; track item.id) {
                    <tr (click)="selectItem(item)" class="cursor-pointer transition-colors hover:bg-gray-50 group" [class.bg-blue-50]="selectedItem?.id === item.id">
                      <td class="px-6 py-4 text-sm font-medium text-gray-900 group-hover:text-primary-600 truncate">{{ item.title }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ item.metadata?.rewardRate || '-' }}</td>
                      <td class="px-6 py-4">
                        <span [class]="item.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                          {{ item.isActive ? 'Active' : 'Inactive' }}
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

      <!-- ─── Right Panel: Detail ─── -->
      @if (selectedItem) {
        <div class="w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0 bg-gray-50">
            <div><h3 class="text-lg font-bold text-gray-900">Program Details</h3></div>
            <div class="flex items-center gap-1">
              <button (click)="onEdit(selectedItem)" class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><i class="bi bi-pencil-square"></i></button>
              <button (click)="onDelete(selectedItem.id!)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><i class="bi bi-trash"></i></button>
              <button (click)="selectedItem = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full md:hidden"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-lg font-bold text-gray-900">{{ selectedItem.title }}</h4>
                <span [class]="selectedItem.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{{ selectedItem.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
              @if (selectedItem.description) {
                <p class="text-sm text-gray-500 mt-2 leading-relaxed">{{ selectedItem.description }}</p>
              }
            </div>
            
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
               <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Reward Rate</span>
               <span class="text-sm font-medium text-gray-900">{{ selectedItem.metadata?.rewardRate || 'Not set' }}</span>
            </div>

            <div class="bg-indigo-50 text-indigo-900 rounded-xl p-4 border border-indigo-100 flex items-center justify-between mb-4">
               <div>
                  <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">Membership Level</span>
                  <span class="text-sm font-medium font-bold flex items-center gap-2">
                    <i class="bi bi-shield-check text-indigo-500"></i>
                    {{ selectedItem.metadata?.levelName || 'Standard' }}
                  </span>
               </div>
               <div class="text-right">
                  <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">Required Points</span>
                  <span class="text-sm font-medium">{{ selectedItem.metadata?.minPoints || 0 }} pts</span>
               </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Start Date</span>
                <span class="text-sm font-medium text-gray-900">{{ (selectedItem.startDate | date) || 'N/A' }}</span>
              </div>
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">End Date</span>
                <span class="text-sm font-medium text-gray-900">{{ (selectedItem.endDate | date) || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 text-center p-8 h-full sticky top-0">
          <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4"><i class="bi bi-award text-2xl text-primary-400"></i></div>
          <h3 class="text-gray-900 font-medium mb-1">No program selected</h3>
          <p class="text-gray-500 text-sm">Select a loyalty program from the list to view its details.</p>
        </div>
      }
    </div>

    <!-- Modal Form -->
    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-bold text-gray-900">{{ editingItem ? 'Edit Loyalty Program' : 'New Loyalty Program' }}</h3>
            <button (click)="closeForm()" class="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="p-6 overflow-y-auto">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Program Name <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="title" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g. VIP Rewards" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Reward Rate (e.g., 10 points per 100 Rs)</label>
                  <input type="text" formControlName="rewardRate" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" placeholder="10 / 100" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description / Rules</label>
                  <textarea formControlName="description" rows="2" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Internal notes..."></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Membership Level</label>
                    <input type="text" formControlName="levelName" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g. Gold Tier" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Min Points Required</label>
                    <input type="number" formControlName="minPoints" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g. 500" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" formControlName="startDate" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" formControlName="endDate" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                  </div>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isActive" formControlName="isActive" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <label for="isActive" class="text-sm text-gray-700 cursor-pointer">Active</label>
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" (click)="closeForm()" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" [disabled]="form.invalid || isSubmitting" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {{ isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class LoyaltyProgramsComponent implements OnInit {
  items: Promotion[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | undefined;

  searchQuery = '';
  selectedItem: Promotion | null = null;
  
  showForm = false;
  editingItem: Promotion | null = null;
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private service: PromotionService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      rewardRate: [''],
      description: [''],
      levelName: ['Standard'],
      minPoints: [0],
      startDate: [''],
      endDate: [''],
      isActive: [true],
    });
  }

  get filteredItems(): Promotion[] {
    const arr = this.items.filter(i => i.type === 'loyalty');
    if (!this.searchQuery.trim()) return arr;
    const q = this.searchQuery.toLowerCase();
    return arr.filter(c => c.title.toLowerCase().includes(q));
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: UserProfile | null) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadItems();
      }
    });
  }

  loadItems() {
    this.loading = true;
    if (!this.shopId) return;

    this.service.getPromotions(this.shopId).subscribe({
      next: (response: { success: boolean; data: Promotion[] }) => {
        this.items = response.data.filter((p: Promotion) => p.type === 'loyalty');
        this.loading = false;
        if (this.items.length > 0 && window.innerWidth >= 768 && !this.selectedItem) {
          this.selectedItem = this.items[0];
        } else if (this.items.length === 0) {
          this.selectedItem = null;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Failed to load campaigns.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectItem(item: Promotion) {
    this.selectedItem = item;
  }

  openForm() {
    this.editingItem = null;
    this.form.reset({ isActive: true });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingItem = null;
  }

  onEdit(item: Promotion) {
    this.editingItem = item;
    const rate = item.metadata?.rewardRate || '';
    this.form.patchValue({
      title: item.title,
      description: item.description,
      rewardRate: rate,
      levelName: item.metadata?.levelName || 'Standard',
      minPoints: item.metadata?.minPoints || 0,
      startDate: item.startDate ? getLocalISODate(item.startDate) : '',
      endDate: item.endDate ? getLocalISODate(item.endDate) : '',
      isActive: item.isActive,
    });
    this.showForm = true;
  }

  async onDelete(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Program?',
      description: 'Are you sure you want to delete this program?',
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      this.service.deletePromotion(id).subscribe({
        next: () => {
          if (this.selectedItem?.id === id) this.selectedItem = null;
          this.loadItems();
        },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid || !this.shopId) return;
    this.isSubmitting = true;

    const req: any = { 
      shopId: this.shopId, 
      type: 'loyalty', 
      title: this.form.value.title,
      description: this.form.value.description,
      startDate: this.form.value.startDate,
      endDate: this.form.value.endDate,
      isActive: this.form.value.isActive,
      metadata: { 
        rewardRate: this.form.value.rewardRate,
        levelName: this.form.value.levelName,
        minPoints: this.form.value.minPoints
      } 
    };
    if (!req.startDate) delete req.startDate;
    if (!req.endDate) delete req.endDate;

    const request$ = this.editingItem
      ? this.service.updatePromotion(this.editingItem.id!, req)
      : this.service.createPromotion(req);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeForm();
        this.loadItems();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.showError('Failed to save program');
      },
    });
  }
}
