import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <!-- LEFT PANEL -->
      <div
        class="hidden md:flex flex-col justify-center items-center text-center px-12
           bg-gradient-to-br from-[var(--color-gray-500)]
           to-[var(--color-primary-700)] text-white"
      >
        <h1 class="text-4xl font-bold mb-4">Welcome Back!</h1>
        <p class="text-lg text-white/90 max-w-md">
          Sign in to the Admin Control Panel and manage your entire platform seamlessly.
        </p>

        <div class="mt-10 opacity-80">
          <div class="w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="flex items-center justify-center min-h-screen bg-[var(--bg-card)] px-6">
        <div class="w-full max-w-md space-y-6">
          <h2 class="text-3xl font-semibold text-[var(--text-primary)]">Admin Sign In</h2>

          <form (ngSubmit)="submit()" class="flex flex-col gap-5">
            <!-- Email -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--text-primary)]">Email</label>
              <input
                [(ngModel)]="email"
                name="email"
                type="email"
                required
                placeholder="admin&#64;example.com"
                class="w-full px-4 py-3 border border-[var(--border-color)] rounded-[var(--radius-md)] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--text-primary)]">Password</label>
              <input
                [(ngModel)]="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-3 border border-[var(--border-color)] rounded-[var(--radius-md)] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <!-- Error -->
            <div
              *ngIf="error"
              class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[var(--radius-md)]"
            >
              {{ error }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading"
              class="w-full px-5 py-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-semibold rounded-[var(--radius-md)] transition-colors disabled:opacity-60 shadow-sm"
            >
              {{ loading ? 'Signing In...' : 'Enter Admin Panel' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  error = '';
  loading = false;

  async submit() {
    this.loading = true;
    this.error = '';

    try {
      await this.authService.login(this.email, this.password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
      await this.router.navigateByUrl(returnUrl);
    } catch (error: any) {
      this.error = error?.message || 'Failed to sign in.';
    } finally {
      this.loading = false;
    }
  }
}
