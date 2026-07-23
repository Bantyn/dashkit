import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-1.5">
        <label class="block text-xs font-bold tracking-widest text-gray-400">{{ label }}</label>
        <span *ngIf="maxImages > 0" class="text-xs font-semibold" [class.text-amber-600]="images.length >= maxImages" [class.text-gray-500]="images.length < maxImages">
          {{ images.length }} / {{ maxImages }} max
        </span>
      </div>
      
      <!-- Drag & Drop Zone -->
      <div 
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.border-primary-500]="isDragging"
        [class.bg-primary-50]="isDragging"
        class="border border-dashed border-gray-200 hover:border-primary-400 hover:bg-gray-50/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[140px]"
        (click)="fileInput.click()"
      >
        <input 
          #fileInput 
          type="file" 
          (change)="onFileSelected($event)" 
          class="hidden" 
          [multiple]="multiple"
          accept="image/*"
        />
        
        <div class="w-12 h-12 bg-gray-50 text-gray-500 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
          <i class="bi bi-cloud-arrow-up text-2xl"></i>
        </div>
        
        <p class="text-sm font-medium text-gray-700">
          Drag and drop your images here, or <span class="text-primary-600 hover:underline font-semibold">browse</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Supports PNG, JPG, WEBP up to 10MB {{ maxImages > 0 ? '(Up to ' + maxImages + ' images)' : '' }}
        </p>
      </div>

      <!-- Uploading Progress -->
      <div *ngIf="uploadProgress > 0" class="relative pt-1">
        <div class="flex mb-2 items-center justify-between">
          <div>
            <span class="text-xs font-semibold inline-block py-1 px-2 rounded-full text-primary-600 bg-primary-200">
              Uploading
            </span>
          </div>
          <div class="text-right">
            <span class="text-xs font-semibold inline-block text-primary-600">
              {{ uploadProgress }}%
            </span>
          </div>
        </div>
        <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
          <div [style.width.%]="uploadProgress" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-200"></div>
        </div>
      </div>

      <div
  *ngIf="errorMessage"
  class="p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm"
>
  <div class="flex items-start gap-3">
    <i class="bi bi-exclamation-octagon-fill text-red-600 text-xl"></i>

    <div class="flex-1">
      <h4 class="text-sm font-semibold text-red-700">
        Image Upload Failed
      </h4>

      <p class="text-sm text-red-600 mt-1">
        We couldn't upload your image because the storage service is unavailable or not configured correctly.
      </p>

      <div class="mt-3 p-3 rounded-lg bg-white border border-red-100">
        <p class="text-xs font-semibold text-gray-700 mb-2">
          Possible reasons:
        </p>

        <ul class="text-xs text-gray-600 space-y-1 list-disc pl-4">
          <li>Cloudinary credentials are missing or incorrect.</li>
          <li>Cloudinary API is unavailable.</li>
          <li>Upload preset is invalid or disabled.</li>
          <li>Network connection was interrupted.</li>
        </ul>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          (click)="showCloudinaryModal = true"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
        >
          <i class="bi bi-cloud-arrow-up-fill mr-1"></i>
          Configure Cloudinary
        </button>

        <button
          type="button"
          (click)="errorMessage = ''"
          class="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
</div>

      <!-- Thumbnails Grid -->
      <div *ngIf="images && images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div 
          *ngFor="let img of images; let idx = index" 
          class="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 shadow-sm transition-all duration-200"
        >
          <img [src]="img" class="w-full h-full object-cover" alt="Uploaded asset" />
          
          <!-- Image overlay controls -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <!-- Move Left -->
            <button 
              *ngIf="multiple && idx > 0"
              type="button"
              (click)="moveImage(idx, -1); $event.stopPropagation()"
              class="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center transition-colors shadow-sm"
              title="Move Left"
            >
              <i class="bi bi-arrow-left-short text-lg"></i>
            </button>
            
            <!-- Delete -->
            <button 
              type="button"
              (click)="removeImage(idx); $event.stopPropagation()"
              class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm"
              title="Delete"
            >
              <i class="bi bi-trash text-sm"></i>
            </button>

            <!-- Move Right -->
            <button 
              *ngIf="multiple && idx < images.length - 1"
              type="button"
              (click)="moveImage(idx, 1); $event.stopPropagation()"
              class="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center transition-colors shadow-sm"
              title="Move Right"
            >
              <i class="bi bi-arrow-right-short text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cloudinary Config Modal -->
    <div *ngIf="showCloudinaryModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shadow-sm">
              <i class="bi bi-cloud-check-fill text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Configure Cloudinary Storage</h3>
              <p class="text-xs text-gray-500">Fix image upload errors by connecting a fast CDN.</p>
            </div>
          </div>
          <button (click)="showCloudinaryModal = false" class="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-colors">
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div class="space-y-6">
            <!-- Step 1 -->
            <div class="flex gap-4">
              <div class="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">1</div>
              <div>
                <h4 class="font-bold text-gray-900 mb-1">Create a Free Cloudinary Account</h4>
                <p class="text-sm text-gray-600 mb-3">Go to <a href="https://cloudinary.com/users/register/free" target="_blank" class="text-primary-600 hover:underline font-medium">cloudinary.com</a> and sign up for a free account. The free tier gives you 25 monthly credits (plenty for most shops).</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4">
              <div class="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">2</div>
              <div>
                <h4 class="font-bold text-gray-900 mb-1">Find your API Credentials</h4>
                <p class="text-sm text-gray-600 mb-3">Once logged in, go to your <strong>Dashboard</strong>. At the top, you will see your <strong>Product Environment Credentials</strong>.</p>
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-mono text-gray-700 space-y-2">
                  <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span class="text-gray-500 font-sans text-xs tracking-wider">Cloud Name</span>
                    <span class="bg-white px-2 py-1 rounded border border-gray-200">my-shop-cloud</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span class="text-gray-500 font-sans text-xs tracking-wider">API Key</span>
                    <span class="bg-white px-2 py-1 rounded border border-gray-200">123456789012345</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-500 font-sans text-xs tracking-wider">API Secret</span>
                    <span class="bg-white px-2 py-1 rounded border border-gray-200">********************</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-4">
              <div class="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">3</div>
              <div>
                <h4 class="font-bold text-gray-900 mb-1">Connect to Your Shop</h4>
                <p class="text-sm text-gray-600">Go to your shop's <strong>Settings &gt; Integrations</strong> page. Find the Cloudinary section, paste your credentials, and click Connect.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button (click)="showCloudinaryModal = false" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <a href="/shop_{{shopId}}/settings/integrations" (click)="showCloudinaryModal = false" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200 flex items-center">
            Go to Integrations <i class="bi bi-arrow-right ml-2"></i>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ImageUploaderComponent {
  @Input() images: string[] = [];
  @Input() multiple: boolean = false;
  @Input() maxImages: number = 0;
  showCloudinaryModal = false;
  @Input() label: string = 'Upload Images';
  @Input() shopId: string = '';

  @Output() imagesChange = new EventEmitter<string[]>();

  isDragging = false;
  uploadProgress = 0;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.uploadFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files) {
      this.uploadFiles(event.target.files);
    }
  }

  private uploadFiles(files: FileList) {
    if (!this.shopId) {
      this.errorMessage = 'Shop context is not loaded yet.';
      return;
    }

    this.errorMessage = '';
    let filesToUpload = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (filesToUpload.length === 0) {
      this.errorMessage = 'Please select valid image files.';
      return;
    }

    if (this.maxImages > 0 && this.images.length >= this.maxImages) {
      this.errorMessage = `Maximum limit of ${this.maxImages} images reached. Delete an existing image to upload a new one.`;
      return;
    }

    if (this.maxImages > 0 && (this.images.length + filesToUpload.length > this.maxImages)) {
      const remainingSlots = this.maxImages - this.images.length;
      filesToUpload = filesToUpload.slice(0, remainingSlots);
      this.errorMessage = `Only ${remainingSlots} more image(s) could be added due to the max ${this.maxImages} limit.`;
    }

    if (!this.multiple) {
      // In single upload mode, only upload the first file
      this.uploadSingleFile(filesToUpload[0]);
    } else {
      // Upload multiple files sequentially
      this.uploadMultipleFiles(filesToUpload);
    }
  }

  private uploadSingleFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    this.uploadProgress = 1;
    this.http.post<{ data: { url: string } }>(
      `${environment.apiUrl}/shops/${this.shopId}/media/upload`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response && event.body) {
          this.images = [event.body.data.url];
          this.imagesChange.emit(this.images);
          this.uploadProgress = 0;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error?.message || err.error?.message || err.message || 'Failed to upload image. Please try again.';
        this.uploadProgress = 0;
      }
    });
  }

  private async uploadMultipleFiles(files: File[]) {
    this.uploadProgress = 1;
    const totalFiles = files.length;
    let completed = 0;
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await firstValueFrom(
          this.http.post<{ data: { url: string } }>(
            `${environment.apiUrl}/shops/${this.shopId}/media/upload`,
            formData
          )
        );

        if (response?.data?.url) {
          newUrls.push(response.data.url);
        }
        completed++;
        this.uploadProgress = Math.round((100 * completed) / totalFiles);
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        this.errorMessage = err.error?.error?.message || err.error?.message || err.message || `Failed to upload some images.`;
      }
    }

    if (newUrls.length > 0) {
      this.images = [...this.images, ...newUrls];
      this.imagesChange.emit(this.images);
    }
    this.uploadProgress = 0;
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
    this.imagesChange.emit(this.images);
  }

  moveImage(index: number, direction: number) {
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < this.images.length) {
      const temp = this.images[index];
      this.images[index] = this.images[targetIndex];
      this.images[targetIndex] = temp;
      this.imagesChange.emit(this.images);
    }
  }
}
