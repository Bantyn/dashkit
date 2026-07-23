import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { AdminApiService } from '../../core/services/admin-api.service';
interface ExportHistoryRecord {
  id: string;
  name: string;
  module: string;
  format: string;
  requestedBy: string;
  requestedTime: string;
  completedTime?: string;
  duration?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileSize?: string;
  downloadCount: number;
}

@Component({
  selector: 'app-export-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 xl:p-10 max-w-full mx-auto space-y-8 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-gray-900 tracking-tight">Export History</h1>
          <p class="text-sm text-gray-500 mt-2">
            Track and download your recently generated exports and background jobs.
          </p>
        </div>
        <button (click)="refresh()" class="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors" title="Refresh">
          <i class="bi bi-arrow-clockwise text-xl" [class.animate-spin]="isRefreshing"></i>
        </button>
      </div>

      <!-- History Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold">
              <tr>
                <th class="px-6 py-4">Export Name</th>
                <th class="px-6 py-4">Module</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Requested</th>
                <th class="px-6 py-4">Duration</th>
                <th class="px-6 py-4">Size</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (record of history; track record.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                           [ngClass]="getFormatColor(record.format)">
                        <i class="bi font-bold" [ngClass]="getFormatIcon(record.format)"></i>
                      </div>
                      <div>
                        <p class="font-bold text-gray-900">{{ record.name }}</p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">{{ record.format }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 capitalize text-gray-700 font-medium">{{ record.module }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                          [ngClass]="getStatusColor(record.status)">
                      {{ record.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-gray-900">{{ record.requestedTime | date:'medium' }}</p>
                    <p class="text-xs text-gray-500">by {{ record.requestedBy }}</p>
                  </td>
                  <td class="px-6 py-4 text-gray-600">{{ record.duration || '-' }}</td>
                  <td class="px-6 py-4 text-gray-600 font-mono text-xs">{{ record.fileSize || '-' }}</td>
                  <td class="px-6 py-4 text-right">
                    @if (record.status === 'completed') {
                      <button (click)="download(record)" class="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors ml-auto">
                        <i class="bi bi-download"></i> Download
                      </button>
                    } @else if (record.status === 'processing' || record.status === 'pending') {
                      <button (click)="cancel(record)" class="text-red-600 hover:text-red-800 text-sm font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto">
                        <i class="bi bi-x-circle"></i> Cancel
                      </button>
                    }
                  </td>
                </tr>
              }
              
              @if (history.length === 0) {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    No export history found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ExportHistoryComponent implements OnInit {
  private toastService = inject(ToastService);
  private apiService = inject(AdminApiService);
  
  isRefreshing = false;
  history: ExportHistoryRecord[] = [];

  ngOnInit() {
    this.fetchHistory();
  }

  fetchHistory() {
    this.isRefreshing = true;
    this.apiService.getExportHistory().subscribe({
      next: (res) => {
        this.history = res.data || [];
        this.isRefreshing = false;
      },
      error: (err) => {
        console.error('Failed to fetch history', err);
        // Fallback to mock data for demonstration if backend route is not ready
        this.history = this.getMockHistory();
        this.isRefreshing = false;
      }
    });
  }

  getFormatColor(format: string): string {
    switch (format?.toLowerCase()) {
      case 'excel': return 'bg-green-100 text-green-700';
      case 'pdf': return 'bg-red-100 text-red-700';
      case 'csv': return 'bg-yellow-100 text-yellow-700';
      case 'json': return 'bg-blue-100 text-blue-700';
      case 'zip': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getFormatIcon(format: string): string {
    switch (format?.toLowerCase()) {
      case 'excel': return 'bi-file-earmark-excel';
      case 'pdf': return 'bi-file-earmark-pdf';
      case 'csv': return 'bi-filetype-csv';
      case 'json': return 'bi-filetype-json';
      case 'zip': return 'bi-file-earmark-zip';
      default: return 'bi-file-earmark';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  refresh() {
    this.fetchHistory();
    this.toastService.showSuccess('Export history refreshed.');
  }

  download(record: ExportHistoryRecord) {
    this.toastService.showSuccess(`Preparing download for ${record.name}...`);
    this.apiService.downloadExport(record.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = record.name;
        link.click();
        window.URL.revokeObjectURL(url);
        record.downloadCount++;
      },
      error: () => {
        this.toastService.showError('Failed to download file. It may have expired or is unavailable.');
      }
    });
  }

  cancel(record: ExportHistoryRecord) {
    if (confirm(`Are you sure you want to cancel the export for ${record.name}?`)) {
      this.apiService.cancelExport(record.id).subscribe({
        next: () => {
          record.status = 'failed';
          this.toastService.showSuccess('Export job cancelled.');
        },
        error: () => {
          this.toastService.showError('Failed to cancel export.');
        }
      });
    }
  }

  private getMockHistory(): ExportHistoryRecord[] {
    return [
      {
        id: '1',
        name: 'shops_2026-07.xlsx',
        module: 'shops',
        format: 'excel',
        requestedBy: 'Super Admin',
        requestedTime: new Date(Date.now() - 3600000).toISOString(),
        completedTime: new Date(Date.now() - 3550000).toISOString(),
        duration: '50s',
        status: 'completed',
        fileSize: '4.2 MB',
        downloadCount: 1
      },
      {
        id: '2',
        name: 'revenue_july_2026.pdf',
        module: 'financial',
        format: 'pdf',
        requestedBy: 'Super Admin',
        requestedTime: new Date(Date.now() - 500000).toISOString(),
        status: 'processing',
        downloadCount: 0
      },
      {
        id: '3',
        name: 'activity_logs_2026-07.csv',
        module: 'logs',
        format: 'csv',
        requestedBy: 'System',
        requestedTime: new Date(Date.now() - 86400000).toISOString(),
        completedTime: new Date(Date.now() - 86390000).toISOString(),
        duration: '10s',
        status: 'failed',
        downloadCount: 0
      }
    ];
  }
}
