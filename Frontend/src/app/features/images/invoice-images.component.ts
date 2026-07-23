import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ImageGalleryService } from './image-gallery.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  total?: number;
  paymentStatus?: string;
  pdfUrl?: string;
  createdAt?: string | Date;
  sizeBytes?: number | null;
}

@Component({
  selector: 'app-invoice-images',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="p-6 max-w-full mx-auto">

      <!-- Header & Stats -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Invoice PDFs</h2>
          <p class="text-sm text-gray-500 mt-0.5">Apni shop ke saare generated invoices dekhein aur manage karein</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
              <i class="bi bi-file-earmark-pdf"></i>
            </div>
            <div>
              <div class="text-xs text-purple-600 font-medium">Total Invoices</div>
              <div class="text-lg font-bold text-purple-900 leading-none mt-0.5">{{ invoices.length }}</div>
            </div>
          </div>

          <div class="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <i class="bi bi-database"></i>
            </div>
            <div>
              <div class="text-xs text-indigo-600 font-medium">PDF Storage</div>
              <div class="text-lg font-bold text-indigo-900 leading-none mt-0.5">{{ formatSize(totalPdfSize) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls & Search -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <!-- Search -->
        <div class="relative flex-1 min-w-[240px]">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
            placeholder="Search invoice number, customer name..."
            class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
          />
        </div>

        <!-- View Mode Toggle -->
        <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button (click)="viewMode='grid'" [class.bg-gray-100]="viewMode==='grid'"
            class="p-2 rounded-lg transition-all" title="Grid View">
            <i class="bi bi-grid-3x3-gap text-gray-600"></i>
          </button>
          <button (click)="viewMode='list'" [class.bg-gray-100]="viewMode==='list'"
            class="p-2 rounded-lg transition-all" title="List View">
            <i class="bi bi-list-ul text-gray-600"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="flex flex-col items-center justify-center py-24 gap-3">
          <app-ui-loading size="lg"></app-ui-loading>
          <p class="text-xs text-gray-400">Loading invoice PDFs...</p>
        </div>
      }

      <!-- Empty State -->
      @else if (filteredInvoices.length === 0) {
        <div class="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-3">
            <i class="bi bi-file-earmark-pdf"></i>
          </div>
          <h3 class="text-base font-bold text-gray-800">No Invoices Found</h3>
          <p class="text-xs text-gray-400 max-w-sm mt-1">
            {{ searchQuery ? 'No invoice matches your search criteria.' : 'Create sales or orders to generate invoice PDFs automatically.' }}
          </p>
        </div>
      }

      <!-- Grid View -->
      @else if (viewMode === 'grid') {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (inv of filteredInvoices; track inv.id) {
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">

              <!-- Thumbnail Preview (Cloudinary JPG representation of 1st page) -->
              <div class="relative aspect-[3/4] bg-gray-100 border-b border-gray-100 overflow-hidden cursor-pointer" (click)="openPdf(inv.pdfUrl)">
                @if (inv.pdfUrl) {
                  <img
                    [src]="getThumbnailUrl(inv.pdfUrl)"
                    [alt]="inv.invoiceNumber"
                    class="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                } @else {
                  <div class="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-purple-50/50">
                    <i class="bi bi-file-earmark-pdf text-4xl text-purple-400 mb-1"></i>
                    <span class="text-xs font-medium text-purple-600">PDF Document</span>
                  </div>
                }

                <!-- Status Badge -->
                <div class="absolute top-2 right-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-md tracking-wide shadow-sm"
                        [class]="getStatusBadgeClass(inv.paymentStatus)">
                    {{ inv.paymentStatus || 'Generated' }}
                  </span>
                </div>

                <!-- Size Badge -->
                @if (inv.sizeBytes) {
                  <div class="absolute bottom-2 left-2">
                    <span class="px-2 py-0.5 text-[10px] font-medium rounded-md bg-black/60 text-white backdrop-blur-sm">
                      {{ formatSize(inv.sizeBytes) }}
                    </span>
                  </div>
                }

                <!-- Hover Actions Overlay -->
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <a
                    [href]="inv.pdfUrl"
                    target="_blank"
                    (click)="$event.stopPropagation()"
                    class="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <i class="bi bi-box-arrow-up-right"></i> Open PDF
                  </a>

                  <div class="flex items-center gap-2 mt-1">
                    <button
                      (click)="copyUrl(inv.pdfUrl); $event.stopPropagation()"
                      class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                      title="Copy Link"
                    >
                      <i class="bi bi-clipboard text-xs"></i>
                    </button>
                    <button
                      (click)="confirmDelete(inv); $event.stopPropagation()"
                      class="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                      title="Delete Invoice PDF"
                    >
                      <i class="bi bi-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Card Content -->
              <div class="p-4">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <div class="font-bold text-gray-900 text-sm truncate">{{ inv.invoiceNumber }}</div>
                  <div class="font-bold text-primary-600 text-sm shrink-0">
                    ₹{{ inv.total?.toLocaleString() || 0 }}
                  </div>
                </div>

                <div class="text-xs text-gray-500 truncate mb-2">
                  <i class="bi bi-person mr-1 text-gray-400"></i>{{ inv.customerName || 'Walk-in Customer' }}
                </div>

                <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                  <span>{{ formatDate(inv.createdAt) }}</span>
                  @if (inv.pdfUrl) {
                    <span class="text-purple-600 font-medium">Cloudinary PDF</span>
                  }
                </div>
              </div>

            </div>
          }
        </div>
      }

      <!-- List View -->
      @else {
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          @for (inv of filteredInvoices; track inv.id; let last = $last) {
            <div class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors" [class.border-b]="!last">
              
              <!-- Icon/Thumbnail -->
              <div class="w-12 h-14 rounded-xl border border-purple-100 bg-purple-50 shrink-0 overflow-hidden cursor-pointer" (click)="openPdf(inv.pdfUrl)">
                @if (inv.pdfUrl) {
                  <img [src]="getThumbnailUrl(inv.pdfUrl)" class="w-full h-full object-cover object-top" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-purple-600">
                    <i class="bi bi-file-earmark-pdf text-xl"></i>
                  </div>
                }
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900 text-sm truncate">{{ inv.invoiceNumber }}</span>
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-md" [class]="getStatusBadgeClass(inv.paymentStatus)">
                    {{ inv.paymentStatus || 'Generated' }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                  <span><i class="bi bi-person mr-1 text-gray-400"></i>{{ inv.customerName || 'Customer' }}</span>
                  <span><i class="bi bi-calendar3 mr-1 text-gray-400"></i>{{ formatDate(inv.createdAt) }}</span>
                </div>
              </div>

              <!-- Amount & Size -->
              <div class="text-right shrink-0">
                <div class="font-bold text-gray-900 text-sm">₹{{ inv.total?.toLocaleString() || 0 }}</div>
                <div class="text-xs text-gray-400 mt-0.5">{{ formatSize(inv.sizeBytes) }}</div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0 ml-2">
                <a
                  [href]="inv.pdfUrl"
                  target="_blank"
                  class="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Open PDF"
                >
                  <i class="bi bi-box-arrow-up-right"></i>
                </a>
                <button
                  (click)="copyUrl(inv.pdfUrl)"
                  class="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copy URL"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
                <button
                  (click)="confirmDelete(inv)"
                  class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete PDF"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>

            </div>
          }
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteTarget) {
        <div class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-red-50/50">
              <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <i class="bi bi-trash-fill text-red-600"></i>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-sm">Delete Invoice PDF</h3>
                <p class="text-xs text-gray-500 mt-0.5">Cloudinary storage se permanent remove ho jayegi</p>
              </div>
            </div>

            <div class="px-6 py-4">
              <p class="text-sm text-gray-600 leading-relaxed">
                Kya aap <strong>"{{ deleteTarget.invoiceNumber }}"</strong> ko permanently delete karna chahte hain?
                Isse Cloudinary se PDF destroy ho jayegi aur aapka shop storage usage kam ho jayega.
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                (click)="cancelDelete()"
                [disabled]="deleting"
                class="px-5 py-2.5 text-sm font-normal text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                (click)="executeDelete()"
                [disabled]="deleting"
                class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                @if (deleting) {
                  <i class="bi bi-arrow-repeat animate-spin"></i> Deleting...
                } @else {
                  <i class="bi bi-trash-fill"></i> Delete PDF
                }
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Toast notifications -->
      @if (showCopied) {
        <div class="fixed bottom-6 right-6 bg-gray-900 text-white text-sm font-normal px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-[70]">
          <i class="bi bi-check2-circle text-green-400"></i> PDF Link Copied!
        </div>
      }

    </div>
  `,
})
export class InvoiceImagesComponent implements OnInit {
  shopId = '';
  invoices: InvoiceItem[] = [];
  filteredInvoices: InvoiceItem[] = [];
  loading = true;
  searchQuery = '';
  viewMode: 'grid' | 'list' = 'grid';

  deleteTarget: InvoiceItem | null = null;
  deleting = false;
  showCopied = false;

  constructor(
    private galleryService: ImageGalleryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadInvoices();
      }
    });
  }

  loadInvoices() {
    this.loading = true;
    this.galleryService.getInvoices(this.shopId).subscribe({
      next: (res: any) => {
        const rawList = res?.data || [];
        this.invoices = rawList.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || 'INV-000',
          customerName: inv.customerName || 'Customer',
          customerPhone: inv.customerPhone,
          total: inv.total || 0,
          paymentStatus: inv.paymentStatus || 'Paid',
          pdfUrl: inv.pdfUrl || '',
          createdAt: inv.createdAt,
        }));
        this.applyFilters();
        this.loading = false;
        this.loadPdfSizes();
      },
      error: (err) => {
        console.error('Failed to load invoices:', err);
        this.loading = false;
      },
    });
  }

  private async loadPdfSizes() {
    for (const inv of this.invoices) {
      if (inv.pdfUrl) {
        try {
          const res = await fetch(inv.pdfUrl, { method: 'HEAD' });
          const cl = res.headers.get('content-length');
          inv.sizeBytes = cl ? parseInt(cl, 10) : null;
        } catch {
          inv.sizeBytes = null;
        }
      }
    }
    this.cdr.detectChanges();
  }

  applyFilters() {
    if (!this.searchQuery.trim()) {
      this.filteredInvoices = [...this.invoices];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredInvoices = this.invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)),
    );
  }

  get totalPdfSize(): number {
    return this.invoices.reduce((acc, inv) => acc + (inv.sizeBytes || 0), 0);
  }

  getThumbnailUrl(pdfUrl?: string): string {
    if (!pdfUrl) return '';
    let thumb = pdfUrl;
    if (thumb.includes('f_auto')) {
      thumb = thumb.replace('f_auto', 'f_jpg');
    }
    if (thumb.toLowerCase().includes('.pdf')) {
      thumb = thumb.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
    }
    return thumb;
  }

  getStatusBadgeClass(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'bg-green-100 text-green-700';
    if (s === 'pending') return 'bg-amber-100 text-amber-700';
    if (s === 'overdue') return 'bg-red-100 text-red-700';
    return 'bg-purple-100 text-purple-700';
  }

  formatDate(date?: string | Date): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  }

  formatSize(bytes?: number | null): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  openPdf(url?: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  copyUrl(url?: string) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.showCopied = true;
      setTimeout(() => (this.showCopied = false), 2000);
    });
  }

  confirmDelete(inv: InvoiceItem) {
    this.deleteTarget = inv;
  }

  cancelDelete() {
    this.deleteTarget = null;
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    const inv = this.deleteTarget;
    this.deleting = true;

    // First call deleteMedia to destroy PDF from Cloudinary & reduce shop storage limit
    if (inv.pdfUrl) {
      this.galleryService.deleteMedia(this.shopId, inv.pdfUrl).subscribe();
    }

    // Call deleteInvoice
    this.galleryService.deleteInvoice(inv.id).subscribe({
      next: () => {
        this.invoices = this.invoices.filter((i) => i.id !== inv.id);
        this.applyFilters();
        this.deleting = false;
        this.deleteTarget = null;
      },
      error: (err) => {
        console.error('Failed to delete invoice:', err);
        this.invoices = this.invoices.filter((i) => i.id !== inv.id);
        this.applyFilters();
        this.deleting = false;
        this.deleteTarget = null;
      },
    });
  }
}
