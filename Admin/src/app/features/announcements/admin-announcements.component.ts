import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    UiDropdownComponent
  ],
  template: `
    <div class="p-6 xl:p-10 max-w-full mx-auto space-y-8 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">Announcement Center</h1>
          <p class="text-sm text-gray-500 mt-1">Manage platform notifications, emails, and pushes.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            routerLink="new"
            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
          >
            <i class="bi bi-plus-lg mr-1.5"></i>
            New Announcement
          </button>
        </div>
      </div>

      <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-100 shrink-0 flex gap-4 flex-col md:flex-row items-center justify-between bg-gray-50">
          <div class="flex items-center gap-2">
            <app-ui-dropdown
              [options]="statusOptions"
              [(ngModel)]="selectedStatus"
              (ngModelChange)="loadAnnouncements()"
              placeholder="Filter by Status"
              class="w-48"
            ></app-ui-dropdown>
            <app-ui-dropdown
              [options]="typeOptions"
              [(ngModel)]="selectedType"
              (ngModelChange)="loadAnnouncements()"
              placeholder="Filter by Type"
              class="w-48"
            ></app-ui-dropdown>
          </div>
          <button (click)="loadAnnouncements()" class="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition">
            <i class="bi bi-arrow-clockwise" [class.animate-spin]="loading"></i>
            <span>Refresh</span>
          </button>
        </div>

        <div *ngIf="loading" class="py-20 flex justify-center">
          <app-loading-spinner size="lg"></app-loading-spinner>
        </div>

        <div *ngIf="!loading && announcements.length === 0" class="py-20 text-center flex flex-col items-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <i class="bi bi-inbox text-2xl"></i>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1">No announcements found</h3>
          <p class="text-sm text-gray-500">Create a new announcement to notify your users.</p>
        </div>

        <div class="overflow-x-auto custom-scrollbar" *ngIf="!loading && announcements.length > 0">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <th class="px-5 py-3">Title</th>
                <th class="px-5 py-3">Type</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3">Target</th>
                <th class="px-5 py-3">Methods</th>
                <th class="px-5 py-3">Created</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 font-sans text-xs text-gray-700">
              <tr *ngFor="let item of announcements" class="hover:bg-gray-50/60 transition-colors">
                <td class="px-5 py-3.5 font-semibold text-gray-900">{{ item.title }}</td>
                <td class="px-5 py-3.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-gray-100 text-gray-600">
                    {{ item.type }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span [class]="'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ' + getStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5 capitalize">{{ item.target?.type }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex gap-1">
                    <span *ngFor="let method of item.deliveryMethods" class="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] uppercase font-bold">{{ method }}</span>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-gray-500">{{ item.createdAt | date:'mediumDate' }}</td>
                <td class="px-5 py-3.5 text-right">
                  <button [routerLink]="[item.id]" class="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button (click)="deleteAnnouncement(item.id)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 ml-1">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminAnnouncementsComponent implements OnInit {
  announcements: any[] = [];
  loading = false;
  selectedStatus = '';
  selectedType = '';

  statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' },
    { label: 'Expired', value: 'expired' },
    { label: 'Archived', value: 'archived' }
  ];

  typeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Information', value: 'information' },
    { label: 'Warning', value: 'warning' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Critical', value: 'critical' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Feature Release', value: 'feature_release' }
  ];

  private apiService = inject(AdminApiService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.loading = true;
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedType) filters.type = this.selectedType;

    this.apiService.getAnnouncements(filters).subscribe({
      next: (res) => {
        this.announcements = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load announcements');
        this.loading = false;
      }
    });
  }

  deleteAnnouncement(id: string) {
    if (confirm('Are you sure you want to delete this announcement?')) {
      this.apiService.deleteAnnouncement(id).subscribe({
        next: () => {
          this.toastService.showSuccess('Announcement deleted');
          this.loadAnnouncements();
        },
        error: () => this.toastService.showError('Failed to delete announcement')
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'published': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'expired': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'archived': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
