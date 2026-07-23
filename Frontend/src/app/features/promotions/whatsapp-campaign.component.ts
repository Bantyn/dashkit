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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreditWalletModalComponent } from '../../shared/components/credit-wallet-modal.component';

@Component({
  selector: 'app-whatsapp-campaign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiLoadingComponent, CreditWalletModalComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden relative">
      <app-credit-wallet-modal [isOpen]="showWallet" (closed)="showWallet = false"></app-credit-wallet-modal>
      <!-- ─── Left Panel: List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">WhatsApp Campaigns</h2>
          <div class="flex gap-2">
            <button (click)="showWallet = true" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
              <i class="bi bi-wallet2 text-primary-600"></i> Wallet
            </button>
            <button (click)="openForm()" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm">
              <i class="bi bi-whatsapp"></i> New
            </button>
          </div>
        </div>

        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search campaigns by title..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg text-sm transition-all" />
          </div>
        </div>

        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Title</th>
                  <th class="px-6 py-3">Template</th>
                  <th class="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr><td colspan="3" class="px-6 py-8 text-center text-gray-500"><div class="flex flex-col items-center justify-center gap-4"><app-ui-loading size="md"></app-ui-loading><span>Loading...</span></div></td></tr>
                } @else if (error) {
                  <tr><td colspan="3" class="p-6"><div class="p-4 bg-red-50 text-red-600 rounded-lg text-center">{{ error }}</div></td></tr>
                } @else if (filteredItems.length === 0) {
                  <tr><td colspan="3" class="px-6 py-8 text-center text-gray-500">No campaigns found.</td></tr>
                } @else {
                  @for (item of filteredItems; track item.id) {
                    <tr (click)="selectItem(item)" class="cursor-pointer transition-colors hover:bg-gray-50 group" [class.bg-green-50]="selectedItem?.id === item.id">
                      <td class="px-6 py-4 text-sm font-medium text-gray-900 group-hover:text-green-600 truncate">{{ item.title }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ item.metadata?.template || '-' }}</td>
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
            <div><h3 class="text-lg font-bold text-gray-900">Campaign Details</h3></div>
            <div class="flex items-center gap-1">
              @if (selectedItem.status !== 'running') {
                <button (click)="activateCampaign(selectedItem)" class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors title='Send Now'"><i class="bi bi-send-fill"></i></button>
              }
              <button (click)="loadAnalytics(selectedItem.id!)" class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><i class="bi bi-bar-chart"></i></button>
              <button (click)="onEdit(selectedItem)" class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><i class="bi bi-pencil-square"></i></button>
              <button (click)="onDelete(selectedItem.id!)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><i class="bi bi-trash"></i></button>
              <button (click)="selectedItem = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full md:hidden"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-lg font-bold text-gray-900">{{ selectedItem.title }}</h4>
                <span [class]="selectedItem.status === 'running' ? 'bg-blue-50 text-blue-700' : selectedItem.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{{ selectedItem.status === 'running' ? 'Running' : (selectedItem.isActive ? 'Active' : 'Inactive') }}</span>
              </div>
              @if (selectedItem.description) {
                <p class="text-sm text-gray-500 mt-2 leading-relaxed">{{ selectedItem.description }}</p>
              }
            </div>
            
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
               <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">WhatsApp Template</span>
               <span class="text-sm font-medium text-gray-900">{{ selectedItem.metadata?.template || 'None selected' }}</span>
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

            <!-- Analytics Display -->
            @if (analytics) {
              <div class="bg-gray-900 text-white rounded-xl p-5 mt-4">
                <h5 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Delivery Analytics</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="text-center">
                    <span class="block text-2xl font-bold">{{ analytics.total }}</span>
                    <span class="text-[10px] uppercase tracking-wider text-gray-400">Total</span>
                  </div>
                  <div class="text-center">
                    <span class="block text-2xl font-bold text-green-400">{{ analytics.delivered }}</span>
                    <span class="text-[10px] uppercase tracking-wider text-gray-400">Delivered</span>
                  </div>
                  <div class="text-center">
                    <span class="block text-2xl font-bold text-red-400">{{ analytics.failed }}</span>
                    <span class="text-[10px] uppercase tracking-wider text-gray-400">Failed</span>
                  </div>
                </div>
              </div>
            }

          </div>
        </div>
      } @else {
        <div class="hidden md:flex flex-col items-center justify-center w-[40%] min-w-[360px] max-w-[520px] bg-white border-l border-gray-200 text-center p-8 h-full sticky top-0">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4"><i class="bi bi-whatsapp text-2xl text-green-500"></i></div>
          <h3 class="text-gray-900 font-medium mb-1">No campaign selected</h3>
          <p class="text-gray-500 text-sm">Select a WhatsApp campaign from the list to view its details.</p>
        </div>
      }
    </div>

    <!-- Modal Form -->
    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-bold text-gray-900">{{ editingItem ? 'Edit WhatsApp Campaign' : 'New WhatsApp Campaign' }}</h3>
            <button (click)="closeForm()" class="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="p-6 overflow-y-auto">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Campaign Title <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="title" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" placeholder="e.g. Welcome Message" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Approved Template</label>
                  <select formControlName="template" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white">
                    <option value="">Select a template...</option>
                    <option value="welcome_new_user">Welcome New User</option>
                    <option value="abandoned_cart">Abandoned Cart</option>
                    <option value="order_confirmed">Order Confirmed</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Notes / Description</label>
                  <textarea formControlName="description" rows="2" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" placeholder="Internal notes..."></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" formControlName="startDate" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" formControlName="endDate" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isActive" formControlName="isActive" class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <label for="isActive" class="text-sm text-gray-700 cursor-pointer">Active</label>
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" (click)="closeForm()" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" [disabled]="form.invalid || isSubmitting" class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
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
export class WhatsappCampaignComponent implements OnInit {
  items: Promotion[] = [];
  loading = true;
  error: string | null = null;
  shopId: string | undefined;

  searchQuery = '';
  selectedItem: Promotion | null = null;
  
  showForm = false;
  showWallet = false;
  editingItem: Promotion | null = null;
  form: FormGroup;
  isSubmitting = false;
  analytics: any = null;

  constructor(
    private service: PromotionService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      template: [''],
      description: [''],
      startDate: [''],
      endDate: [''],
      isActive: [true],
    });
  }

  get filteredItems(): Promotion[] {
    const arr = this.items.filter(i => i.type === 'whatsapp');
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
        this.items = response.data.filter((p: Promotion) => p.type === 'whatsapp');
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
    this.analytics = null;
    if (item.status === 'running') {
      this.loadAnalytics(item.id!);
    }
  }

  loadAnalytics(id: string) {
    this.http.get<any>(`${environment.apiUrl}/api/v1/admin/promotions/${id}/analytics`).subscribe({
      next: (res) => {
        this.analytics = res.data;
        this.cdr.detectChanges();
      },
      error: () => this.toastService.showError("Failed to load analytics")
    });
  }

  async activateCampaign(item: Promotion) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Send WhatsApp Campaign?',
      description: 'Are you sure you want to send this WhatsApp campaign to your customers?',
      primaryButtonText: 'Send Now',
      secondaryButtonText: 'Cancel'
    });

    if (confirmed) {
      // Mocking audience
      const mockAudience = ["+919999999999"];
      
      this.http.post<any>(`${environment.apiUrl}/api/v1/admin/promotions/${item.id}/activate`, {
        audience: mockAudience
      }).subscribe({
        next: (res) => {
          this.toastService.showSuccess("WhatsApp Campaign activated and queued!");
          this.loadItems();
        },
        error: (err) => this.toastService.showError(err.error?.message || "Failed to activate campaign")
      });
    }
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
    const tpl = item.metadata?.template || '';
    this.form.patchValue({
      title: item.title,
      description: item.description,
      template: tpl,
      startDate: item.startDate ? getLocalISODate(item.startDate) : '',
      endDate: item.endDate ? getLocalISODate(item.endDate) : '',
      isActive: item.isActive,
    });
    this.showForm = true;
  }

  async onDelete(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Campaign?',
      description: 'Are you sure you want to delete this campaign?',
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

    const req: any = { shopId: this.shopId, type: 'whatsapp', metadata: { template: this.form.value.template }, ...this.form.value };
    delete req.template;
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
        this.toastService.showError('Failed to save campaign');
      },
    });
  }
}
