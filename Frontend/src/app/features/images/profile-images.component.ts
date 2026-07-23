import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ImageUploaderComponent } from '../../shared/components/image-uploader.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-images',
  standalone: true,
  imports: [CommonModule, UiLoadingComponent, ImageUploaderComponent],
  template: `
    <div class="p-6 max-w-full mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-800">Profile Image</h2>
        <p class="text-sm text-gray-500 mt-1">Apni profile photo manage karein</p>
      </div>

      @if (!user) {
        <div class="flex justify-center py-24">
          <app-ui-loading size="lg"></app-ui-loading>
        </div>
      }

      @else {
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <!-- Profile Hero -->
          <div class="bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-8 flex flex-col items-center text-center">
            <div class="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl overflow-hidden bg-primary-500 flex items-center justify-center mb-4">
              @if (profileImageUrl) {
                <img [src]="profileImageUrl" [alt]="user.displayName" class="w-full h-full object-cover" />
              } @else {
                <span class="text-5xl font-bold text-white">{{ user.displayName.charAt(0).toUpperCase() }}</span>
              }
            </div>
            <h3 class="text-xl font-bold text-white">{{ user.displayName }}</h3>
            <p class="text-primary-200 text-sm mt-0.5">{{ user.email }}</p>
            <span class="mt-2 px-3 py-1 bg-white/20 text-white text-xs font-normal rounded-full uppercase tracking-wider">
              {{ user.role.replace('_', ' ') }}
            </span>
          </div>

          <div class="p-6 space-y-5">

            <!-- Current Photo Info -->
            @if (profileImageUrl) {
              <div class="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div class="w-12 h-12 rounded-xl overflow-hidden border-2 border-green-300 shrink-0">
                  <img [src]="profileImageUrl" [alt]="user.displayName" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-normal text-green-800">Profile photo is set</div>
                  <div class="text-xs text-green-600 truncate mt-0.5">{{ profileImageUrl }}</div>
                </div>
                <button
                  (click)="copyUrl(profileImageUrl)"
                  class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <i class="bi bi-clipboard"></i>
                </button>
              </div>
            } @else {
              <div class="flex items-center gap-4 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                <div class="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
                  {{ user.displayName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="text-sm font-normal text-gray-700">No profile photo</div>
                  <div class="text-xs text-gray-500 mt-0.5">Upload a photo to personalize your account</div>
                </div>
              </div>
            }

            <!-- Upload New Photo -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Upload Profile Photo
              </label>
              <app-image-uploader
                [shopId]="shopId"
                [multiple]="false"
                [images]="uploadBuffer"
                label="Choose profile photo"
                (imagesChange)="onImageUploaded($event)"
              ></app-image-uploader>
            </div>

            <!-- Save Changes Button -->
            @if (hasNewImage) {
              <button
                (click)="saveProfileImage()"
                [disabled]="saving"
                class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                @if (saving) {
                  <i class="bi bi-arrow-repeat animate-spin"></i> Saving...
                } @else {
                  <i class="bi bi-check2-circle"></i> Save Profile Photo
                }
              </button>
            }

            <!-- Info Note -->
            <div class="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <i class="bi bi-info-circle-fill text-primary-500 mt-0.5"></i>
              <div>
                <div class="text-sm font-normal text-primary-800">Profile Settings</div>
                <p class="text-xs text-primary-600 mt-1 leading-relaxed">
                  Apne personal details change karne ke liye settings page pe jaa sakte hain.
                </p>
                <button
                  (click)="goToProfile()"
                  class="mt-2 text-xs font-bold text-primary-700 underline hover:text-primary-900 transition-colors"
                >
                  Go to Profile Settings →
                </button>
              </div>
            </div>

            @if (showCopied) {
              <div class="flex items-center gap-2 text-green-600 text-sm font-normal bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <i class="bi bi-check-circle-fill"></i> URL copied to clipboard!
              </div>
            }

            @if (saveSuccess) {
              <div class="flex items-center gap-2 text-green-600 text-sm font-normal bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <i class="bi bi-check-circle-fill"></i> Profile photo saved successfully!
              </div>
            }

            @if (saveError) {
              <div class="flex items-center gap-2 text-red-600 text-sm font-normal bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <i class="bi bi-exclamation-triangle"></i> {{ saveError }}
              </div>
            }

          </div>
        </div>
      }

    </div>
  `,
})
export class ProfileImagesComponent implements OnInit {
  user: UserProfile | null = null;
  shopId = '';
  profileImageUrl = '';
  uploadBuffer: string[] = [];
  showCopied = false;
  saving = false;
  saveSuccess = false;
  saveError = '';
  hasNewImage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.shopId = user.shopId || '';
        this.profileImageUrl = (user as any).photoURL || '';
      }
    });
  }

  onImageUploaded(urls: string[]) {
    this.uploadBuffer = urls;
    if (urls.length > 0) {
      this.profileImageUrl = urls[0];
      this.hasNewImage = true;
      this.saveSuccess = false;
      this.saveError = '';
    }
  }

  async saveProfileImage() {
    if (!this.user || !this.profileImageUrl) return;
    this.saving = true;
    this.saveError = '';

    try {
      const success = await this.authService.updateUserProfile(this.user.uid, {
        photoURL: this.profileImageUrl
      } as any);

      if (success) {
        this.saveSuccess = true;
        this.hasNewImage = false;
        this.uploadBuffer = [];
        setTimeout(() => (this.saveSuccess = false), 3000);
      } else {
        this.saveError = 'Failed to save profile photo.';
      }
    } catch (err: any) {
      this.saveError = err?.message || 'Failed to save profile photo.';
    } finally {
      this.saving = false;
    }
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      this.showCopied = true;
      setTimeout(() => (this.showCopied = false), 2500);
    });
  }

  goToProfile() {
    this.router.navigate(['/', this.shopId, 'profile']);
  }
}
