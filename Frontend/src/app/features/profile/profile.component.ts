import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-8 mx-auto">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-12 text-white">
          <h1 class="text-3xl font-bold">My Profile</h1>
          <p class="mt-2 opacity-90">Manage your personal information and account settings</p>
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="p-8 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Display Name</label>
              <input
                type="text"
                formControlName="displayName"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Mobile Number</label>
              <input
                type="tel"
                formControlName="mobile"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                formControlName="email"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
                readonly
              />
              <p class="text-xs text-gray-500 italic">Email cannot be changed</p>
            </div>
          </div>

          <div class="pt-6 border-t border-gray-100 flex justify-end gap-4">
            <button
              type="button"
              (click)="resetForm()"
              class="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="profileForm.invalid || loading"
              class="px-8 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Account Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div
            class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 class="font-bold text-gray-900">Role</h3>
          <p class="text-sm text-gray-500 mt-1 capitalize">
            {{ (user$ | async)?.role?.replace('_', ' ') }}
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div
            class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4v4m0 0l-4-4m4 4l4-4"
              />
            </svg>
          </div>
          <h3 class="font-bold text-gray-900">Joined</h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ ((joinedDate$ | async) ? ((joinedDate$ | async) | date: 'longDate') : 'Not available') }}
          </p>
        </div>

        <div
          class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-primary-200 group cursor-pointer"
          (click)="goToSubscription()"
        >
          <div
            class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-100 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h3 class="font-bold text-gray-900">Plan</h3>
          <p class="text-sm text-gray-500 mt-1">Manage Subscription →</p>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);

  user$ = this.authService.currentUser$;
  joinedDate$ = this.user$.pipe(
    map((user) => {
      const createdAt = user?.createdAt;
      if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
        return null;
      }

      return createdAt;
    }),
  );
  loading = false;
  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    mobile: ['', [Validators.pattern('^[0-9]{10}$')]],
    email: [{ value: '', disabled: true }],
    address: [''],
  });

  constructor() {
    this.user$.subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
          mobile: user.mobile || '',
          email: user.email,
          address: user.address || '',
        });
      }
    });
  }

  resetForm() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName,
        mobile: user.mobile || '',
        email: user.email,
        address: user.address || '',
      });
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid) return;

    this.loading = true;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      const { displayName, mobile, address } = this.profileForm.getRawValue();
      const updates: any = {};
      if (displayName) updates.displayName = displayName;
      if (mobile) updates.mobile = mobile;
      if (address) updates.address = address;

      if (Object.keys(updates).length > 0) {
        await this.authService.updateUserProfile(user.uid, updates);
        this.toastService.showSuccess('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.toastService.showError('Failed to update profile.');
    } finally {
      this.loading = false;
    }
  }

  goToSubscription() {
    const user = this.authService.getCurrentUser();
    if (user?.shopId) {
      this.router.navigate(['/', user.shopId, 'subscription']);
    } else {
      this.router.navigate(['/subscription']);
    }
  }
}
