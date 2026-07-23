import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-auto">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Bulk Import Products</h2>
          <p class="text-xs text-gray-500 mt-1">Import multiple products at once using a CSV file.</p>
        </div>

        <div class="max-w-full mx-auto w-full p-6">
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
            
            <div class="flex justify-center mb-6">
               <div class="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center">
                  <i class="bi bi-cloud-arrow-up text-4xl text-primary-500"></i>
               </div>
            </div>

            <h3 class="text-lg font-semibold text-gray-900 mb-2">Upload your CSV</h3>
            <p class="text-sm text-gray-500 mb-6">Select a CSV file with columns: product_name, description, category, brand, style, barcode, size, color, price, discounted_price, stock, wholesale_price, wholesale_min_qty</p>

            <div 
              class="border-2 border-dashed border-gray-300 rounded-xl p-10 bg-gray-50 hover:bg-gray-100 hover:border-primary-300 transition-all cursor-pointer relative"
              [class.opacity-50]="isUploading"
            >
              <input 
                type="file" 
                id="file-upload" 
                class="hidden" 
                accept=".csv" 
                (change)="onFileSelected($event)"
                [disabled]="isUploading"
              />
              <label for="file-upload" class="cursor-pointer">
                <span class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm inline-block">
                  {{ isUploading ? 'Processing...' : 'Browse CSV' }}
                </span>
              </label>
              <p class="text-xs text-gray-400 mt-4">Max file size 10MB</p>
            </div>

            @if (message) {
              <div [class]="'mt-6 p-4 rounded-lg text-sm ' + (isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600')">
                {{ message }}
              </div>
            }

            <div class="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-left">
              <div>
                 <h4 class="text-sm font-semibold text-gray-700">Need a template?</h4>
                 <p class="text-xs text-gray-500 mt-1">Use this format: product_name, description, category, brand, style, barcode, size, color, price, discounted_price, stock, wholesale_price, wholesale_min_qty</p>
              </div>
              <button (click)="downloadTemplate()" class="px-4 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2 shadow-sm border border-transparent">
                <i class="bi bi-download"></i> Get Template
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  `
})
export class BulkImportComponent implements OnInit {
  isUploading = false;
  message = '';
  isError = false;
  shopId = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.shopId = user?.shopId || '';
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      this.showStatus('Please upload a valid CSV file', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      this.processCSV(text);
    };
    reader.readAsText(file);
  }

  cleanBarcode(value: string): string {
    return value ? value.trim() : '';
  }

  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  processCSV(text: string) {
    this.isUploading = true;
    this.message = 'Parsing CSV...';
    
    try {
      const lines = text.split('\n');
      if (lines.length === 0 || !lines[0].trim()) {
        throw new Error('CSV file is empty.');
      }
      
      const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = this.parseCSVLine(lines[i]);
        const entry: any = {};
        
        headers.forEach((header, index) => {
          if (index >= values.length) return;
          const val = values[index];
          // Map CSV headers to backend expected names
          if (header === 'product_name') entry.name = val;
          else if (header === 'style') entry.subcategory = val;
          else if (header === 'discounted_price') entry.discountedPrice = val;
          else if (header === 'wholesale_price') entry.wholesalePrice = val;
          else if (header === 'wholesale_min_qty') entry.wholesaleMinQty = val;
          else if (header === 'barcode') entry.barcode = val ? val.trim() : '';
          else entry[header] = val;
        });

        if (entry.name && entry.barcode) {
          products.push(entry);
        }
      }

      if (products.length === 0) {
        throw new Error('No valid product data found in CSV.');
      }

      this.message = `Uploading ${products.length} items...`;
      this.productService.bulkImport(this.shopId, products).subscribe({
        next: (res) => {
          this.isUploading = false;
          this.showStatus(`Successfully imported ${res.data.count} products!`, false);
        },
        error: (err) => {
          this.isUploading = false;
          this.showStatus('Import failed. Please check your data format.', true);
          console.error(err);
        }
      });

    } catch (err: any) {
      this.isUploading = false;
      this.showStatus(err.message || 'Error processing CSV', true);
    }
  }

  showStatus(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
  }

  downloadTemplate() {
    const csvContent = "data:text/csv;charset=utf-8,product_name,description,category,brand,style,barcode,size,color,price,discounted_price,stock,wholesale_price,wholesale_min_qty\nShirt,Cotton casual shirt,men,CROME ART,4B895,250002321,M,White,1900,1500,12,1200,10";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clothify_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
