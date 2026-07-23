import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TailorJobCardService, TailorJobCard } from '../../core/services/tailor-job-card.service';
import { StaffService, Staff } from '../../core/services/staff.service';
import { ToastService } from '../../core/services/toast.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-tailor-job-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f8fafc] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Tailor Job Cards</h2>
          <p class="text-xs text-slate-400 mt-0.5">Assign daily tailoring tasks and monitor workflow performance.</p>
        </div>
        <button
          (click)="openAssignModal()"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <i class="bi bi-file-earmark-plus"></i>
          Assign Job Card
        </button>
      </div>

      <!-- Filters -->
      <div class="px-6 py-4 bg-white border-b border-slate-100 flex gap-4 shrink-0 items-center">
        <div class="relative flex-1 max-w-md">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by tailor name..."
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
          />
        </div>
        <select
          [(ngModel)]="statusFilter"
          class="px-4 py-2 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all font-medium text-slate-600"
        >
          <option value="">All Statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <!-- Main Layout -->
      <div class="flex-1 overflow-y-auto p-6">
        @if (loading) {
          <div class="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <app-ui-loading size="md"></app-ui-loading>
            <span class="text-xs font-bold uppercase tracking-widest">Loading job cards...</span>
          </div>
        } @else if (filteredCards.length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <i class="bi bi-scissors text-5xl text-slate-200"></i>
            <h3 class="font-bold text-slate-700">No Job Cards Found</h3>
            <p class="text-xs">Create a new job card to assign tasks to your tailors.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (card of filteredCards; track card.id) {
              <div class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                <!-- Card Header -->
                <div class="p-5 border-b border-slate-50 flex justify-between items-start">
                  <div>
                    <h3 class="font-bold text-slate-800 text-base">{{ card.tailorName }}</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5">Assigned: {{ formatDate(card.assignedDate) }}</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide" [ngClass]="getStatusClasses(card.status)">
                    {{ card.status.replace('_', ' ') }}
                  </span>
                </div>

                <!-- Card Body (Items) -->
                <div class="p-5 flex-1 space-y-3">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Work</span>
                  <div class="space-y-2">
                    @for (w of card.assignedWork; track w.item) {
                      <div class="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl text-sm">
                        <span class="text-slate-600 font-medium">{{ w.item }}</span>
                        <span class="font-bold text-slate-800">{{ w.quantity }} qty</span>
                      </div>
                    }
                  </div>

                  @if (card.notes) {
                    <div class="mt-4 pt-3 border-t border-slate-50">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</span>
                      <p class="text-xs text-slate-500 italic">{{ card.notes }}</p>
                    </div>
                  }

                  @if (card.status === 'completed' && card.performanceRating) {
                    <div class="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</span>
                      <div class="flex gap-0.5 text-amber-400 text-sm">
                        @for (star of [1,2,3,4,5]; track star) {
                          <i class="bi" [class.bi-star-fill]="star <= card.performanceRating" [class.bi-star]="star > card.performanceRating"></i>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Card Footer (Actions) -->
                <div class="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-2">
                  @if (card.status === 'assigned') {
                    <button
                      (click)="updateStatus(card, 'in_progress')"
                      class="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors"
                    >
                      Start Work
                    </button>
                  } @else if (card.status === 'in_progress') {
                    <button
                      (click)="openCompleteModal(card)"
                      class="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors"
                    >
                      Mark Complete
                    </button>
                  }
                  <button
                    (click)="deleteCard(card.id)"
                    class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Assign Job Card Modal -->
      @if (showAssignModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fade-in-up">
            <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 class="text-base font-bold text-slate-800">Assign New Job Card</h3>
              <button (click)="closeAssignModal()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded-full transition-all">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <form [formGroup]="jobForm" (ngSubmit)="submitJobCard()" class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Select Tailor / Staff</label>
                <select formControlName="tailorId" (change)="onTailorSelect()" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-all outline-none font-medium">
                  <option value="">Choose Staff...</option>
                  @for (t of tailorsList; track t.id) {
                    <option [value]="t.id">{{ t.fullName }} ({{ t.role }})</option>
                  }
                </select>
              </div>

              <!-- Works Array -->
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Work Assignment</label>
                  <button type="button" (click)="addWorkItem()" class="text-xs text-indigo-600 font-bold hover:underline">+ Add Item</button>
                </div>
                <div formArrayName="assignedWork" class="space-y-2 max-h-48 overflow-y-auto pr-1">
                  @for (item of assignedWork.controls; track $index) {
                    <div [formGroupName]="$index" class="flex gap-2 items-center">
                      <input type="text" formControlName="item" placeholder="e.g. Shirts" class="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-xs transition-all outline-none" />
                      <input type="number" formControlName="quantity" placeholder="Qty" class="w-16 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-xs transition-all outline-none" />
                      <button type="button" (click)="removeWorkItem($index)" class="text-slate-400 hover:text-rose-500"><i class="bi bi-trash"></i></button>
                    </div>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Notes / Instructions</label>
                <textarea formControlName="notes" rows="2" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-all outline-none resize-none" placeholder="Details..."></textarea>
              </div>

              <div class="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" (click)="closeAssignModal()" class="px-5 py-2 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-all text-xs">Cancel</button>
                <button type="submit" [disabled]="jobForm.invalid" class="px-5 py-2 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white text-xs disabled:opacity-50 transition-all">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Complete Job Card / Rating Modal -->
      @if (showCompleteModal) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-fade-in-up">
            <div class="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 class="text-base font-bold text-slate-800">Complete Job Card</h3>
              <button (click)="closeCompleteModal()" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded-full transition-all">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="p-5 space-y-5">
              <div class="text-center">
                <p class="text-sm text-slate-600">Rate <strong>{{ activeCompletingCard?.tailorName }}</strong>'s performance on this card:</p>
                <div class="flex justify-center gap-2 mt-4 text-3xl text-amber-400">
                  @for (star of [1,2,3,4,5]; track star) {
                    <i (click)="completingRating = star" class="bi cursor-pointer hover:scale-110 transition-transform" [class.bi-star-fill]="star <= completingRating" [class.bi-star]="star > completingRating"></i>
                  }
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button (click)="closeCompleteModal()" class="px-5 py-2 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-all text-xs">Cancel</button>
                <button (click)="submitCompletion()" class="px-5 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white text-xs transition-all">Complete & Rate</button>
              </div>
            </div>
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
export class TailorJobCardsComponent implements OnInit {
  private cardService = inject(TailorJobCardService);
  private staffService = inject(StaffService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private confirmationService = inject(ConfirmationService);

  shopId = '';
  jobCards: TailorJobCard[] = [];
  tailorsList: Staff[] = [];
  loading = false;

  searchQuery = '';
  statusFilter = '';

  showAssignModal = false;
  showCompleteModal = false;
  jobForm!: FormGroup;

  activeCompletingCard: TailorJobCard | null = null;
  completingRating = 5;

  ngOnInit() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const shopId = params.get('shopId');
      if (shopId) {
        this.shopId = shopId;
        this.loadJobCards();
        this.loadTailors();
      }
    });

    this.initForm();
  }

  initForm() {
    this.jobForm = this.fb.group({
      tailorId: ['', Validators.required],
      tailorName: [''],
      assignedWork: this.fb.array([], Validators.required),
      notes: [''],
    });

    // Add first work item by default
    this.addWorkItem();
  }

  get assignedWork(): FormArray {
    return this.jobForm.get('assignedWork') as FormArray;
  }

  addWorkItem() {
    this.assignedWork.push(this.fb.group({
      item: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeWorkItem(index: number) {
    if (this.assignedWork.length > 1) {
      this.assignedWork.removeAt(index);
    }
  }

  onTailorSelect() {
    const selectedId = this.jobForm.get('tailorId')?.value;
    const tailor = this.tailorsList.find(t => t.id === selectedId);
    if (tailor) {
      this.jobForm.get('tailorName')?.setValue(tailor.fullName);
    }
  }

  loadJobCards() {
    this.loading = true;
    this.cardService.listJobCards(this.shopId).subscribe({
      next: (res) => {
        this.jobCards = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load job cards');
        this.loading = false;
      }
    });
  }

  loadTailors() {
    this.staffService.getStaff(this.shopId).subscribe({
      next: (res) => {
        this.tailorsList = res.data || [];
      }
    });
  }

  get filteredCards(): TailorJobCard[] {
    return this.jobCards.filter(card => {
      const matchesSearch = card.tailorName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = this.statusFilter ? card.status === this.statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusClasses(status: string) {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  }

  formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  openAssignModal() {
    this.showAssignModal = true;
    this.initForm();
  }

  closeAssignModal() {
    this.showAssignModal = false;
  }

  submitJobCard() {
    if (this.jobForm.invalid) return;
    const payload = {
      ...this.jobForm.value,
      shopId: this.shopId,
      status: 'assigned',
      assignedDate: new Date().toISOString()
    };

    this.cardService.createJobCard(payload).subscribe({
      next: () => {
        this.toastService.showSuccess('Job card assigned successfully');
        this.loadJobCards();
        this.closeAssignModal();
      },
      error: () => this.toastService.showError('Failed to assign job card')
    });
  }

  updateStatus(card: TailorJobCard, status: 'in_progress' | 'completed') {
    this.cardService.updateJobCard(card.id, { status, shopId: this.shopId }).subscribe({
      next: () => {
        this.toastService.showSuccess(`Job status updated to ${status.replace('_', ' ')}`);
        this.loadJobCards();
      },
      error: () => this.toastService.showError('Failed to update job status')
    });
  }

  openCompleteModal(card: TailorJobCard) {
    this.activeCompletingCard = card;
    this.completingRating = 5;
    this.showCompleteModal = true;
  }

  closeCompleteModal() {
    this.showCompleteModal = false;
    this.activeCompletingCard = null;
  }

  submitCompletion() {
    if (!this.activeCompletingCard) return;
    
    this.cardService.updateJobCard(this.activeCompletingCard.id, {
      status: 'completed',
      performanceRating: this.completingRating,
      shopId: this.shopId
    }).subscribe({
      next: () => {
        this.toastService.showSuccess('Job card completed!');
        this.loadJobCards();
        this.closeCompleteModal();
      },
      error: () => this.toastService.showError('Failed to complete job card')
    });
  }

  async deleteCard(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Job Card?',
      description: 'Are you sure you want to delete this job card?',
      type: 'danger',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel'
    });
    if (!confirmed) return;

    this.cardService.deleteJobCard(this.shopId, id).subscribe({
      next: () => {
        this.toastService.showSuccess('Job card deleted');
        this.loadJobCards();
      },
      error: () => this.toastService.showError('Failed to delete job card')
    });
  }
}
