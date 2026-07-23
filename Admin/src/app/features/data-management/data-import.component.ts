import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';

@Component({
  selector: 'app-data-import',
  standalone: true,
  imports: [CommonModule, FormsModule, UiDropdownComponent],
  template: `
    <div class="p-6 xl:p-10 max-w-full mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">Data Import Center</h1>
        <p class="text-sm text-gray-500 mt-1">Upload CSV or JSON files to bulk import data into the platform.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        
        <!-- Entity Selection & Template -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-100">
          <div class="flex-1 max-w-md space-y-4">
            <h3 class="text-lg font-bold text-gray-900">1. Select Target Entity</h3>
            <app-ui-dropdown
              label="Import Data Into"
              [options]="entityOptions"
              [(ngModel)]="selectedEntity"
            ></app-ui-dropdown>
          </div>
          <div class="flex-shrink-0">
            <button (click)="downloadTemplate()" class="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2">
              <i class="bi bi-file-earmark-spreadsheet"></i>
              Download CSV Template
            </button>
          </div>
        </div>

        <!-- File Upload -->
        <div class="text-center space-y-4 pt-4">
          <h3 class="text-lg font-bold text-gray-900">2. Upload Data File</h3>
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
            <i class="bi bi-cloud-upload text-3xl"></i>
          </div>
          <p class="text-sm text-gray-500 max-w-md mx-auto">
            Drag and drop your .csv or .json file here, or click the button below to browse your files.
          </p>
          
          <div class="pt-4 pb-4">
            <input type="file" #fileInput class="hidden" accept=".csv,.json" (change)="onFileSelected($event)">
            <button (click)="fileInput.click()" class="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-sm transition-colors">
              Select File to Import
            </button>
          </div>
        </div>
        
        <div class="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div>
            <h4 class="text-sm font-bold text-gray-900 mb-2">Selected Entity Validation</h4>
            <p class="text-xs text-gray-500">
              Ensure your headers match the template exactly. Duplicate keys will be updated or rejected based on entity rules.
            </p>
          </div>
          <div>
            <h4 class="text-sm font-bold text-gray-900 mb-2">Supported Formats</h4>
            <ul class="text-xs text-gray-500 space-y-1">
              <li><i class="bi bi-check text-green-500 mr-1"></i> CSV (Comma Separated)</li>
              <li><i class="bi bi-check text-green-500 mr-1"></i> JSON (Array of Objects)</li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-bold text-gray-900 mb-2">Platform Limits</h4>
            <ul class="text-xs text-gray-500 space-y-1">
              <li><i class="bi bi-info-circle mr-1"></i> Max file size: 50MB</li>
              <li><i class="bi bi-info-circle mr-1"></i> Max rows per file: 10,000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DataManagementImportComponent {
  selectedEntity = 'features';
  
  entityOptions = [
    { label: 'Platform Features', value: 'features' },
    { label: 'Subscription Plans', value: 'plans' },
    { label: 'Themes & Templates', value: 'themes' },
    { label: 'Platform Settings', value: 'settings' },
    { label: 'Admins & Staff Users', value: 'admins' },
    { label: 'Shops Data', value: 'shops' }
  ];

  private toastService = inject(ToastService);

  downloadTemplate() {
    this.toastService.showSuccess(`Template for ${this.selectedEntity} is being generated for download.`);
    
    // Define headers based on entity
    let headers: string[] = [];
    switch (this.selectedEntity) {
      case 'features':
        headers = ['feature_id', 'name', 'description', 'is_active', 'module'];
        break;
      case 'plans':
        headers = ['plan_id', 'name', 'price', 'billing_cycle', 'max_shops', 'features_included'];
        break;
      case 'themes':
        headers = ['theme_id', 'name', 'primary_color', 'secondary_color', 'font_family', 'is_premium'];
        break;
      case 'settings':
        headers = ['setting_key', 'setting_value', 'category', 'is_public'];
        break;
      case 'admins':
        headers = ['email', 'first_name', 'last_name', 'role', 'phone_number'];
        break;
      case 'shops':
        headers = ['shop_name', 'owner_email', 'plan_id', 'contact_number', 'address', 'city', 'state'];
        break;
      default:
        headers = ['column1', 'column2', 'column3'];
    }

    // Create CSV content (headers only)
    const csvContent = headers.join(',') + '\n';
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${this.selectedEntity}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.toastService.showSuccess(`File ${file.name} selected for ${this.selectedEntity}. Preparing for validation...`);
      // Mock validation flow
    }
  }
}
