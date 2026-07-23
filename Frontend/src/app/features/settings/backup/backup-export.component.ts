import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-backup-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 lg:p-10 max-w-full mx-auto">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Backup & Export</h1>
          <p class="text-gray-500 mt-1">Download your data for offline use or migration.</p>
        </div>

        <div class="space-y-6">
          <!-- Export Data Section -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-gray-50">
              <h2 class="font-bold text-gray-900">Export Your Data</h2>
              <p class="text-xs text-gray-500">Download CSV/JSON files of your shop's records.</p>
            </div>
            <div class="divide-y divide-gray-50">
              <div class="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"
                  >
                    <i class="bi bi-box-seam text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-sm text-gray-900">Products Catalog</p>
                    <p class="text-xs text-gray-400">
                      All products, variants, and stock info (CSV/JSON)
                    </p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    (click)="exportData('products', 'csv')"
                    class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    CSV
                  </button>
                  <button
                    (click)="exportData('products', 'json')"
                    class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    JSON
                  </button>
                </div>
              </div>

              <div class="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"
                  >
                    <i class="bi bi-people text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-sm text-gray-900">Customers List</p>
                    <p class="text-xs text-gray-400">Contact info and purchase history (CSV)</p>
                  </div>
                </div>
                <button
                  (click)="exportData('customers', 'csv')"
                  class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  CSV
                </button>
              </div>

              <div class="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"
                  >
                    <i class="bi bi-receipt text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-sm text-gray-900">Orders & Invoices</p>
                    <p class="text-xs text-gray-400">
                      Complete transaction history and tax records
                    </p>
                  </div>
                </div>
                <button
                  (click)="exportData('orders', 'csv')"
                  class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          <!-- Import Section -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 class="font-bold text-gray-900 mb-1">Import Products</h2>
            <p class="text-xs text-gray-500 mb-6">Bulk upload products via CSV file.</p>

            <div
              class="border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer group"
            >
              <input
                type="file"
                id="csv-upload"
                class="hidden"
                accept=".csv"
                (change)="onFileSelect($event)"
              />
              <label for="csv-upload" class="cursor-pointer">
                <i
                  class="bi bi-cloud-arrow-up text-4xl text-gray-300 group-hover:text-primary-500 transition-colors"
                ></i>
                <p class="mt-4 text-sm font-bold text-gray-700">Click to upload CSV file</p>
                <p class="text-xs text-gray-400 mt-1">Maximum file size 5MB</p>
              </label>
            </div>
            <div class="mt-4 flex justify-between items-center bg-gray-50 rounded-xl p-4">
              <div class="flex items-center gap-2">
                <i class="bi bi-file-earmark-spreadsheet text-gray-400"></i>
                <span class="text-xs font-medium text-gray-600">Sample Template</span>
              </div>
              <button class="text-primary-600 text-xs font-bold hover:underline">
                Download Template
              </button>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-50 rounded-2xl border border-red-100 p-6">
            <h2 class="font-bold text-red-900 mb-1">Danger Zone</h2>
            <p class="text-xs text-red-700 mb-6">
              Irreversible actions that affect your entire shop.
            </p>

            <button
              (click)="confirmDelete()"
              class="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Permanently Delete All Shop Data
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class BackupExportComponent implements OnInit {
  shopId: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = params.get('shopId');
      if (id) {
        this.shopId = id;
      }
    });
  }

  exportData(type: string, format: string) {
    if (!this.shopId) return;
    window.open(
      `${environment.apiUrl}/shops/${this.shopId}/export?type=${type}&format=${format}`,
      '_blank',
    );
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file || !this.shopId) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.apiUrl}/shops/${this.shopId}/import`, formData).subscribe({
      next: () => this.toastService.showSuccess('Import successful!'),
      error: (err) => this.toastService.showError('Import failed: ' + err.error.message),
    });
  }

  async confirmDelete() {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete All Data?',
      description: 'Are you absolutely sure you want to delete all data? This CANNOT be undone.',
      type: 'danger',
      primaryButtonText: 'Delete All Data',
      secondaryButtonText: 'Cancel',
      requireText: 'DELETE'
    });

    if (confirmed) {
      if (!this.shopId) return;

      this.http.delete(`${environment.apiUrl}/shops/${this.shopId}/purge`).subscribe(() => {
        this.toastService.showSuccess('All data has been deleted.');
      });
    }
  }
}
