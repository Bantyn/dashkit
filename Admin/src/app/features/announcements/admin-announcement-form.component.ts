import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-admin-announcement-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, UiInputComponent, UiDropdownComponent],
  template: `
    <div class="p-6 xl:p-10 max-w-full mx-auto space-y-8 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button routerLink="/announcements" class="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
          <i class="bi bi-arrow-left"></i>
        </button>
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">{{ isEditing ? 'Edit Announcement' : 'New Announcement' }}</h1>
          <p class="text-sm text-gray-500 mt-1">Configure your platform notification and delivery rules.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <div class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 xl:p-8 space-y-6">
          <div class="space-y-4">
            <app-ui-input
              label="Title"
              placeholder="e.g., Scheduled Maintenance"
              formControlName="title"
              [error]="form.get('title')?.touched && form.get('title')?.invalid ? 'Title is required' : ''"
            ></app-ui-input>
            
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-700 mb-1">Message</label>
              <textarea
                formControlName="message"
                rows="4"
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                placeholder="Detailed announcement message..."
              ></textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <app-ui-dropdown
                label="Announcement Type"
                [options]="typeOptions"
                formControlName="type"
              ></app-ui-dropdown>
              <app-ui-dropdown
                label="Target Audience"
                [options]="targetOptions"
                formControlName="targetType"
              ></app-ui-dropdown>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 xl:p-8 space-y-6">
          <h3 class="text-lg font-bold text-gray-900">Delivery & Schedule</h3>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-xs font-bold text-gray-700">Delivery Methods</label>
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="deliveryInApp" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                  <span class="text-sm text-gray-700">In-App</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="deliveryEmail" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                  <span class="text-sm text-gray-700">Email</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="deliveryPush" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                  <span class="text-sm text-gray-700">Push Notification</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <app-ui-dropdown
                label="Status"
                [options]="statusOptions"
                formControlName="status"
              ></app-ui-dropdown>
              
              <app-ui-input
                *ngIf="form.get('status')?.value === 'scheduled'"
                type="datetime-local"
                label="Scheduled At"
                formControlName="scheduledAt"
              ></app-ui-input>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button type="button" routerLink="/announcements" class="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" [disabled]="loading || form.invalid" class="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            <i class="bi bi-save" *ngIf="!loading"></i>
            <i class="bi bi-arrow-clockwise animate-spin" *ngIf="loading"></i>
            {{ isEditing ? 'Update' : 'Publish' }} Announcement
          </button>
        </div>
      </form>
    </div>
  `
})
export class AdminAnnouncementFormComponent implements OnInit {
  form: FormGroup;
  isEditing = false;
  loading = false;
  id: string | null = null;

  typeOptions = [
    { label: 'Information', value: 'information' },
    { label: 'Warning', value: 'warning' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Critical', value: 'critical' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Feature Release', value: 'feature_release' }
  ];

  targetOptions = [
    { label: 'Entire Platform', value: 'platform' },
    { label: 'Specific Plan', value: 'plan' },
    { label: 'Specific Shop', value: 'shop' },
    { label: 'Specific Branch', value: 'branch' }
  ];

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Publish Now', value: 'published' },
    { label: 'Schedule Later', value: 'scheduled' }
  ];

  private fb = inject(FormBuilder);
  private apiService = inject(AdminApiService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      message: ['', Validators.required],
      type: ['information', Validators.required],
      targetType: ['platform', Validators.required],
      deliveryInApp: [true],
      deliveryEmail: [false],
      deliveryPush: [false],
      status: ['published', Validators.required],
      scheduledAt: ['']
    });
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id && this.id !== 'new') {
      this.isEditing = true;
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    this.apiService.getAnnouncementById(this.id!).subscribe({
      next: (res) => {
        const data = res.data;
        this.form.patchValue({
          title: data.title,
          message: data.message,
          type: data.type,
          targetType: data.target?.type || 'platform',
          deliveryInApp: data.deliveryMethods?.includes('in-app'),
          deliveryEmail: data.deliveryMethods?.includes('email'),
          deliveryPush: data.deliveryMethods?.includes('push'),
          status: data.status,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : ''
        });
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load announcement details');
        this.router.navigate(['/announcements']);
      }
    });
  }

  save() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const deliveryMethods = [];
    if (val.deliveryInApp) deliveryMethods.push('in-app');
    if (val.deliveryEmail) deliveryMethods.push('email');
    if (val.deliveryPush) deliveryMethods.push('push');

    const payload = {
      title: val.title,
      message: val.message,
      type: val.type,
      target: { type: val.targetType },
      deliveryMethods,
      status: val.status,
      scheduledAt: val.status === 'scheduled' ? new Date(val.scheduledAt).toISOString() : undefined
    };

    this.loading = true;
    const request$ = this.isEditing 
      ? this.apiService.updateAnnouncement(this.id!, payload)
      : this.apiService.createAnnouncement(payload);

    request$.subscribe({
      next: () => {
        this.toastService.showSuccess(`Announcement ${this.isEditing ? 'updated' : 'created'} successfully`);
        this.router.navigate(['/announcements']);
      },
      error: () => {
        this.toastService.showError(`Failed to ${this.isEditing ? 'update' : 'create'} announcement`);
        this.loading = false;
      }
    });
  }
}
