import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-data-export',
  standalone: true,
  imports: [CommonModule, FormsModule, UiDropdownComponent],
  template: `
    <div class="p-6 xl:p-10 max-w-full mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">Data Export Center</h1>
        <p class="text-sm text-gray-500 mt-1">Export platform, shop, and user data to CSV, Excel, or JSON.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-8 space-y-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Export Configuration</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <app-ui-dropdown
              label="Entity Type"
              [options]="entityOptions"
              [(ngModel)]="selectedEntity"
            ></app-ui-dropdown>
            
            <app-ui-dropdown
              label="Export Format"
              [options]="formatOptions"
              [(ngModel)]="selectedFormat"
            ></app-ui-dropdown>
          </div>
          
          <div class="space-y-4">
            <app-ui-dropdown
              label="Date Range"
              [options]="dateOptions"
              [(ngModel)]="selectedDateRange"
            ></app-ui-dropdown>
            
            <div class="space-y-2">
              <label class="block text-xs font-bold text-gray-700">Include Associated Data</label>
              <div class="space-y-2 pt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="includeMetadata" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                  <span class="text-sm text-gray-700">Include Metadata Fields</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="includeDeleted" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                  <span class="text-sm text-gray-700">Include Soft-Deleted Records</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-gray-100 flex justify-end">
          <button (click)="startExport()" [disabled]="loading" class="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            <i class="bi bi-cloud-download" *ngIf="!loading"></i>
            <i class="bi bi-arrow-clockwise animate-spin" *ngIf="loading"></i>
            {{ loading ? 'Exporting...' : 'Generate Export' }}
          </button>
        </div>
      </div>
      
      <!-- Recent Exports -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Exports</h3>
          <span class="text-xs font-bold bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full">{{ recentExports.length }}</span>
        </div>
        
        <div *ngIf="recentExports.length === 0" class="p-8 text-center text-gray-500 text-sm">
          No recent exports found. Generated exports will appear here for 7 days.
        </div>

        <div *ngIf="recentExports.length > 0" class="divide-y divide-gray-100">
          <div *ngFor="let item of recentExports" class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   [ngClass]="item.format === 'csv' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'">
                <i class="bi" [ngClass]="item.format === 'csv' ? 'bi-filetype-csv' : 'bi-filetype-json'"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm">{{ item.filename }}</h4>
                <p class="text-xs text-gray-500 capitalize">{{ item.entity }} Data • {{ item.date | date:'short' }}</p>
              </div>
            </div>
            <button (click)="downloadRecentExport(item)" class="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
              <i class="bi bi-download"></i> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DataManagementExportComponent {
  loading = false;
  
  selectedEntity = 'shops';
  selectedFormat = 'csv';
  selectedDateRange = 'all';
  includeMetadata = false;
  includeDeleted = false;

  recentExports: any[] = [];

  entityOptions = [
    { label: 'Shops & Organizations', value: 'shops' },
    { label: 'User Accounts', value: 'users' },
    { label: 'Subscriptions & Billing', value: 'subscriptions' },
    { label: 'Products & Inventory', value: 'products' },
    { label: 'Orders & Invoices', value: 'orders' }
  ];

  formatOptions = [
    { label: 'CSV (Comma Separated Values)', value: 'csv' },
    { label: 'Excel (.xlsx)', value: 'excel' },
    { label: 'JSON (Raw Data)', value: 'json' }
  ];

  dateOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' }
  ];

  private toastService = inject(ToastService);
  private apiService = inject(AdminApiService);

  async startExport() {
    this.loading = true;
    
    try {
      let data: any[] = [];
      if (this.selectedEntity === 'shops') {
        const res = await firstValueFrom(this.apiService.getShops());
        data = res.data || [];
      } else if (this.selectedEntity === 'users') {
        const res = await firstValueFrom(this.apiService.getUsers());
        data = res.data || [];
      } else if (this.selectedEntity === 'subscriptions') {
        const res = await firstValueFrom(this.apiService.getPlans());
        data = res.data || [];
      } else {
        this.toastService.showError(`Export for ${this.selectedEntity} is not supported yet.`);
        this.loading = false;
        return;
      }

      if (data.length === 0) {
        this.toastService.showError('No data found to export.');
        this.loading = false;
        return;
      }

      let content = '';
      let filename = `${this.selectedEntity}_export_${new Date().getTime()}`;
      let type = '';

      if (this.selectedFormat === 'json') {
        content = JSON.stringify(data, null, 2);
        filename += '.json';
        type = 'application/json';
      } else {
        // Dynamic CSV generation
        const headers = Object.keys(data[0]);
        const rows = data.map(item => {
          return headers.map(header => {
            let val = item[header];
            if (typeof val === 'object' && val !== null) {
              val = JSON.stringify(val);
            }
            let valStr = String(val ?? '');
            // Escape for CSV
            if (valStr.includes(',') || valStr.includes('\\n') || valStr.includes('"')) {
              valStr = `"${valStr.replace(/"/g, '""')}"`;
            }
            return valStr;
          }).join(',');
        });
        content = [headers.join(','), ...rows].join('\n');
        filename += '.csv';
        type = 'text/csv;charset=utf-8;';
      }

      // Add to recent exports
      this.recentExports.unshift({
        entity: this.selectedEntity,
        format: this.selectedFormat === 'excel' ? 'csv' : this.selectedFormat,
        date: new Date().toISOString(),
        filename: filename,
        content: content,
        type: type
      });

      // Keep only last 5 exports
      if (this.recentExports.length > 5) {
        this.recentExports.pop();
      }

      // Trigger download immediately
      this.triggerDownload(content, type, filename);
      this.toastService.showSuccess(`Export for ${this.selectedEntity} generated successfully.`);

    } catch (error) {
      console.error('Export failed:', error);
      this.toastService.showError('Failed to generate export data.');
    } finally {
      this.loading = false;
    }
  }

  downloadRecentExport(item: any) {
    this.triggerDownload(item.content, item.type, item.filename);
  }

  private triggerDownload(content: string, type: string, filename: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
