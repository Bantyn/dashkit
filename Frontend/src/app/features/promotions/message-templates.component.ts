import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PromotionService } from '../../core/services/promotion.service';
import { Promotion } from '../../core/models/promotion.model';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-message-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- ─── Left Panel: List ─── -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50">
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <i class="bi bi-file-earmark-text text-xl"></i>
             </div>
             <div>
                <h2 class="text-xl font-bold text-gray-900">Message Templates</h2>
                <p class="text-xs text-gray-500 font-medium">Create reusable messages for your customers</p>
             </div>
          </div>
          <button (click)="openForm()" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md">
            <i class="bi bi-plus-lg"></i> Create Template
          </button>
        </div>

        <div class="p-4 bg-white shrink-0 border-b border-gray-100">
          <div class="relative">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search templates by name..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-lg text-sm transition-all" />
          </div>
        </div>

        <div class="flex-1 overflow-auto p-4 custom-scrollbar">
          @if (loading) {
            <div class="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
               <app-ui-loading size="md"></app-ui-loading>
               <span class="animate-pulse font-medium">Loading templates...</span>
            </div>
          } @else if (error) {
            <div class="p-8"><div class="p-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center shadow-sm">
               <i class="bi bi-exclamation-circle text-2xl mb-2 block"></i>
               {{ error }}
            </div></div>
          } @else if (filteredItems.length === 0) {
            <div class="h-full flex flex-col items-center justify-center text-center p-8">
               <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <i class="bi bi-folder-x text-3xl"></i>
               </div>
               <h3 class="text-gray-900 font-bold text-lg mb-1">No templates found</h3>
               <p class="text-gray-500 text-sm max-w-xs mx-auto">Start by creating your first message template for your shop.</p>
               <button (click)="openForm()" class="mt-4 text-indigo-600 text-sm font-bold hover:underline">Create Now</button>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               @for (item of filteredItems; track item.id) {
                 <div (click)="selectItem(item)" 
                      class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                      [class.border-indigo-500]="selectedItem?.id === item.id"
                      [class.ring-2]="selectedItem?.id === item.id"
                      [class.ring-indigo-100]="selectedItem?.id === item.id">
                    
                    <div class="flex justify-between items-start mb-3">
                       <h3 class="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate pr-8">{{ item.title }}</h3>
                       <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                          {{ item.metadata?.category || 'General' }}
                       </span>
                    </div>
                    
                    <p class="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-4 min-h-[4.5rem]">
                       {{ item.metadata?.content || 'No content' }}
                    </p>
                    
                    <div class="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                       <span class="text-[11px] text-gray-400 font-medium">Created {{ item.createdAt | date:'shortDate' }}</span>
                       <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button (click)="$event.stopPropagation(); onEdit(item)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><i class="bi bi-pencil-square"></i></button>
                          <button (click)="$event.stopPropagation(); onDelete(item.id!)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><i class="bi bi-trash"></i></button>
                       </div>
                    </div>
                 </div>
               }
            </div>
          }
        </div>
      </div>

      <!-- ─── Right Panel: Detail ─── -->
      @if (selectedItem) {
        <div class="w-[35%] min-w-[360px] max-w-[480px] bg-white border-l border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-300">
          <div class="px-6 py-6 border-b border-gray-200 flex justify-between items-center shrink-0 bg-gray-50/50">
            <div>
               <h3 class="text-lg font-bold text-gray-900">Preview Template</h3>
               <p class="text-[11px] text-gray-500 font-bold uppercase tracking-widest">How it looks</p>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="onEdit(selectedItem)" class="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                 <i class="bi bi-pencil"></i> Edit
              </button>
              <button (click)="selectedItem = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <!-- Mock Phone Preview -->
            <div class="max-w-[280px] mx-auto bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800">
               <div class="bg-white rounded-[2rem] h-[450px] overflow-hidden flex flex-col">
                  <!-- App Header -->
                  <div class="bg-indigo-600 p-4 text-white flex items-center gap-3 shrink-0">
                     <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><i class="bi bi-person"></i></div>
                     <div>
                        <div class="text-[10px] font-bold leading-none">Customer Chat</div>
                        <div class="text-[8px] opacity-70">Online</div>
                     </div>
                  </div>
                  <!-- Chat Area -->
                  <div class="flex-1 bg-indigo-50/30 p-4 overflow-y-auto">
                     <div class="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm text-xs text-gray-800 animate-in zoom-in duration-300">
                        {{ selectedItem.metadata?.content }}
                        <div class="text-[8px] text-gray-400 text-right mt-1">10:45 AM</div>
                     </div>
                  </div>
                  <!-- Input area -->
                  <div class="p-3 border-t border-gray-100 flex items-center gap-2">
                     <div class="flex-1 h-6 bg-gray-100 rounded-full"></div>
                     <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px]"><i class="bi bi-send-fill"></i></div>
                  </div>
               </div>
            </div>

            <div class="space-y-4">
               <div>
                  <h4 class="text-sm font-bold text-gray-900 mb-2">Technical Details</h4>
                  <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                     <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Name</span>
                        <span class="font-bold text-gray-900">{{ selectedItem.title }}</span>
                     </div>
                     <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Category</span>
                        <span class="px-2 py-0.5 bg-white border border-gray-200 rounded-full font-bold text-indigo-600">{{ selectedItem.metadata?.category || 'General' }}</span>
                     </div>
                     <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Last Updated</span>
                        <span class="font-medium text-gray-700">{{ selectedItem.updatedAt | date:'medium' }}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="hidden lg:flex flex-col items-center justify-center w-[35%] min-w-[360px] max-w-[480px] bg-white border-l border-gray-200 text-center p-12">
          <div class="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6 rotate-3">
             <i class="bi bi-chat-quote text-4xl text-indigo-500"></i>
          </div>
          <h3 class="text-gray-900 font-bold text-xl mb-2">Template Preview</h3>
          <p class="text-gray-500 text-sm leading-relaxed">Select a message template from the list to see how it will appear to your customers.</p>
        </div>
      }
    </div>

    <!-- Modal Form -->
    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <div>
               <h3 class="text-xl font-bold text-gray-900">{{ editingItem ? 'Modify Template' : 'New Template' }}</h3>
               <p class="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{{ editingItem ? 'Save your changes' : 'Create something reusable' }}</p>
            </div>
            <button (click)="closeForm()" class="text-gray-400 hover:bg-gray-200 p-2 rounded-xl transition-all"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="p-8 overflow-y-auto custom-scrollbar">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="space-y-6">
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Template Name <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="title" class="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm transition-all outline-none" placeholder="e.g. Order Confirmation" />
                </div>
                
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select formControlName="category" class="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm transition-all outline-none">
                     <option value="General">General Message</option>
                     <option value="Order">Order Related</option>
                     <option value="Payment">Payment & Billing</option>
                     <option value="Festival">Festival Greetings</option>
                     <option value="Offer">Special Offers</option>
                     <option value="Support">Customer Support</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Message Content <span class="text-red-500">*</span></label>
                  <div class="relative">
                     <textarea formControlName="content" rows="6" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm transition-all outline-none resize-none" placeholder="Write your message here... You can use variables like {name} or {order_id} if supported by your providers."></textarea>
                     <div class="absolute bottom-4 right-4 text-[10px] font-bold text-gray-400">
                        {{ form.get('content')?.value?.length || 0 }} chars
                     </div>
                  </div>
                </div>

                <div class="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                   <div class="flex gap-3">
                      <i class="bi bi-info-circle text-indigo-600 pt-0.5"></i>
                      <p class="text-[11px] text-indigo-700 leading-relaxed font-medium">Use these templates to quickly send SMS or WhatsApp messages to your customers from the campaign modules.</p>
                   </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-10">
                <button type="button" (click)="closeForm()" class="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" [disabled]="form.invalid || isSubmitting" class="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                  {{ isSubmitting ? 'Saving...' : (editingItem ? 'Update Template' : 'Create Template') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class MessageTemplatesComponent implements OnInit {
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
      content: ['', Validators.required],
      category: ['General', Validators.required]
    });
  }

  get filteredItems(): Promotion[] {
    const arr = this.items.filter(i => i.type === 'template');
    if (!this.searchQuery.trim()) return arr;
    const q = this.searchQuery.toLowerCase();
    return arr.filter(c => c.title.toLowerCase().includes(q) || c.metadata?.content?.toLowerCase().includes(q));
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
      next: (response: { success: boolean, data: Promotion[] }) => {
        this.items = response.data.filter((p: Promotion) => p.type === 'template');
        this.loading = false;
        if (this.items.length > 0 && window.innerWidth >= 1024 && !this.selectedItem) {
          this.selectedItem = this.items[0];
        } else if (this.items.length === 0) {
          this.selectedItem = null;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'Failed to load templates. Please try again later.';
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
    this.form.reset({ category: 'General' });
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingItem = null;
  }

  onEdit(item: Promotion) {
    this.editingItem = item;
    this.form.patchValue({
      title: item.title,
      content: item.metadata?.content || '',
      category: item.metadata?.category || 'General'
    });
    this.showForm = true;
  }

  async onDelete(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Template?',
      description: 'Are you sure you want to delete this template? It cannot be undone.',
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

    const data = this.form.value;
    const req: any = { 
      shopId: this.shopId, 
      type: 'template', 
      title: data.title,
      isActive: true,
      metadata: { 
        content: data.content,
        category: data.category
      }
    };

    const request$ = this.editingItem
      ? this.service.updatePromotion(this.editingItem.id!, req)
      : this.service.createPromotion(req);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeForm();
        this.loadItems();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.showError('Error: ' + (err.error?.message || 'Failed to save template'));
      },
    });
  }
}
