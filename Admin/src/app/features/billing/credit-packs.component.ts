import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-credit-packs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Credit Packs Management</h2>
        <button (click)="openForm()" class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          <i class="bi bi-plus-lg mr-2"></i> Add Credit Pack
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (₹)</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (loading) {
              <tr><td colspan="6" class="p-6 text-center text-gray-500">Loading packs...</td></tr>
            } @else if (packs.length === 0) {
              <tr><td colspan="6" class="p-6 text-center text-gray-500">No credit packs found.</td></tr>
            } @else {
              @for (pack of packs; track pack.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <span [class]="pack.type === 'sms' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'" class="px-2 py-1 rounded-full text-xs font-medium uppercase">
                      {{ pack.type }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium text-gray-900">{{ pack.name }}</td>
                  <td class="px-6 py-4 text-gray-600">{{ pack.credits }}</td>
                  <td class="px-6 py-4 font-medium text-primary-600">₹{{ pack.price }}</td>
                  <td class="px-6 py-4">
                    <span [class]="pack.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 py-1 rounded-full text-xs font-medium">
                      {{ pack.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="editPack(pack)" class="text-indigo-600 hover:text-indigo-900 mr-3"><i class="bi bi-pencil-square"></i></button>
                    <button (click)="deletePack(pack.id)" class="text-red-600 hover:text-red-900"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Form Modal -->
      @if (showForm) {
        <div class="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 class="font-bold text-gray-900">{{ editingId ? 'Edit Credit Pack' : 'New Credit Pack' }}</h3>
              <button (click)="showForm = false" class="text-gray-400 hover:text-gray-600"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="p-6">
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pack Type</label>
                    <select formControlName="type" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pack Name</label>
                    <input type="text" formControlName="name" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Starter Pack">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Credits Amount</label>
                    <input type="number" formControlName="credits" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 1000">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input type="number" formControlName="price" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 500">
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="checkbox" formControlName="isActive" id="isActive" class="rounded border-gray-300 text-primary-600">
                    <label for="isActive" class="text-sm text-gray-700">Active</label>
                  </div>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                  <button type="button" (click)="showForm = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" [disabled]="form.invalid || submitting" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {{ submitting ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CreditPacksComponent implements OnInit {
  packs: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  submitting = false;
  form: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      type: ['sms', Validators.required],
      name: ['', Validators.required],
      credits: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadPacks();
  }

  loadPacks() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/wallet/packs`).subscribe({
      next: (res) => {
        this.packs = res.data;
        this.loading = false;
      },
      error: () => {
        this.toast.showError('Failed to load credit packs');
        this.loading = false;
      }
    });
  }

  openForm() {
    this.editingId = null;
    this.form.reset({ type: 'sms', isActive: true });
    this.showForm = true;
  }

  editPack(pack: any) {
    this.editingId = pack.id;
    this.form.patchValue({
      type: pack.type,
      name: pack.name,
      credits: pack.credits,
      price: pack.price,
      isActive: pack.isActive
    });
    this.showForm = true;
  }

  deletePack(id: string) {
    if (!confirm('Are you sure you want to delete this credit pack?')) return;
    this.http.delete(`${environment.apiUrl}/wallet/packs/${id}`).subscribe({
      next: () => {
        this.toast.showSuccess('Pack deleted');
        this.loadPacks();
      },
      error: () => this.toast.showError('Failed to delete pack')
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;

    const request$ = this.editingId
      ? this.http.put(`${environment.apiUrl}/wallet/packs/${this.editingId}`, this.form.value)
      : this.http.post(`${environment.apiUrl}/wallet/packs`, this.form.value);

    request$.subscribe({
      next: () => {
        this.toast.showSuccess('Pack saved successfully');
        this.showForm = false;
        this.submitting = false;
        this.loadPacks();
      },
      error: () => {
        this.toast.showError('Failed to save pack');
        this.submitting = false;
      }
    });
  }
}
