import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthCardComponent } from '../../shared/components/auth-card.component';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiButtonComponent } from '../../shared/components/ui-button.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox.component';
import { VerticalCutRevealComponent } from '../../shared/components/ui/vertical-cut-reveal.component';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    UiInputComponent,
    UiButtonComponent,
    CheckboxComponent,
    VerticalCutRevealComponent,
  ],
  styles: [`
    .page-enter {
      animation: pageFadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes pageFadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="min-h-screen grid grid-cols-1 md:grid-cols-2 page-enter selection:text-white selection:bg-primary-600">
      <!-- LEFT PANEL -->
      <div
        class="hidden md:flex flex-col justify-center items-center text-center px-12 
           bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] 
           from-[var(--color-primary-400)] via-[var(--color-primary-600)] to-[var(--color-primary-800)] 
           text-white font-['Outfit',sans-serif]"
      >
        <app-vertical-cut-reveal
          text="Welcome Back !"
          splitBy="characters"
          [staggerDuration]="0.04"
          staggerFrom="first"
          containerClassName="text-5xl font-normal uppercase mb-5 justify-center"
        ></app-vertical-cut-reveal>
        <app-vertical-cut-reveal
          text="Sign in to continue to your dashboard and enjoy seamless experience."
          splitBy="words"
          [staggerDuration]="0.05"
          staggerFrom="first"
          [delay]="0.35"
          containerClassName="text-lg text-white/85 max-w-md justify-center font-normal leading-relaxed tracking-wide"
        ></app-vertical-cut-reveal>

        <!-- Elegant SaaS Glassmorphic Graphic -->
        <div class="mt-12 relative w-full max-w-sm aspect-square flex items-center justify-center">
          <!-- Floating Glows -->
          <div class="absolute -top-4 -right-4 w-40 h-40 bg-gradient-to-tr from-amber-300/30 to-orange-400/30 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-8 -left-8 w-44 h-44 bg-blue-400/30 to-indigo-500/30 rounded-full blur-3xl"></div>
          
          <!-- Main Card -->
          <div class="absolute w-72 h-44 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex flex-col justify-between p-6">
            <div class="flex justify-between items-start">
              <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-[10px] bg-emerald-500/25 px-2.5 py-1 rounded-full text-emerald-300 font-semibold border border-emerald-500/20 uppercase tracking-widest">Active</span>
            </div>
            
            <div class="space-y-2 text-left">
              <div class="h-2 w-12 bg-white/20 rounded"></div>
              <div class="text-lg font-normal text-white tracking-wide">Clothify Store</div>
              <div class="h-1.5 w-24 bg-white/20 rounded"></div>
            </div>
          </div>
          
          <!-- Mini Float Badge -->
          <div class="absolute bottom-2 -right-4 bg-white/15 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 flex items-center gap-3">
            <div class="w-7 h-7 rounded-full bg-emerald-400/20 flex items-center justify-center border border-emerald-500/20">
              <span class="text-emerald-300 text-xs font-normal">✓</span>
            </div>
            <div class="text-left">
              <div class="text-[10px] text-white/60 font-medium">Sales Growth</div>
              <div class="text-xs font-normal text-white">+ 24.5%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="flex items-center justify-center min-h-screen bg-[var(--bg-card)] px-6">
        <div class="w-full max-w-md space-y-6">
          <h2 class="text-3xl font-semibold text-[var(--text-primary)]">Sign In</h2>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <!-- Email -->
            <app-ui-input
              label="Email"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              [error]="getError('email')"
            ></app-ui-input>

            <!-- Password -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--text-primary)]"> Password </label>
              <app-ui-input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                [error]="getError('password')"
              ></app-ui-input>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between mt-1">
              <div class="flex items-center gap-2">
                <app-checkbox
                  formControlName="rememberMe"
                  color="var(--color-primary-600)"
                ></app-checkbox>
                <span
                  class="text-sm font-medium text-[var(--text-secondary)] cursor-pointer select-none"
                  (click)="loginForm.get('rememberMe')?.setValue(!loginForm.get('rememberMe')?.value)"
                >
                  Remember Me
                </span>
              </div>
              <a
                routerLink="/forgot-password"
                class="text-sm text-[var(--color-primary-600)] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <!-- Error -->
            <div
              *ngIf="errorMessage && !inactiveShopId && !isLocked && !isSuspended"
              class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[var(--radius-md)]"
            >
              {{ errorMessage }}
            </div>

            <!-- Temporary Lockout Countdown UI -->
            <div
              *ngIf="isLocked"
              class="p-4 text-center bg-red-50 border border-red-200 rounded-[var(--radius-md)] space-y-2"
            >
              <p class="text-sm font-medium text-red-800">Too many failed login attempts.</p>
              <p class="text-xs text-red-600">Please try again in:</p>
              <div class="text-3xl font-mono font-bold text-red-700 tracking-wider">
                {{ formattedRemainingTime }}
              </div>
            </div>

            <!-- Suspended Account UI -->
            <div
              *ngIf="isSuspended"
              class="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-[var(--radius-md)] space-y-2"
            >
              <p class="font-semibold">Account Suspended</p>
              <p>Your shop has been temporarily suspended due to multiple unsuccessful login attempts. Please contact the DashKit Team to reactivate your account.</p>
            </div>

            <!-- Inactive Account Prompt -->
            <div
              *ngIf="inactiveShopId"
              class="p-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] flex flex-col gap-3"
            >
              <p>This account is deactivated from admin according to your request. If you want to reactivate your account, please press Confirm.</p>
              <app-ui-button type="button" (onClick)="requestReactivation()" [loading]="reactivating" loadingText="Requesting...">
                Confirm Reactivation
              </app-ui-button>
            </div>

            <!-- Primary Button -->
            <app-ui-button
              type="submit"
              [fullWidth]="true"
              [loading]="loading"
              [disabled]="isLocked || isSuspended"
              loadingText="Signing in..."
            >
              Sign In
            </app-ui-button>


            <!-- Divider -->
            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t border-[var(--border-color)]"></span>
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-[var(--bg-card)] px-2 text-[var(--text-muted)]">
                  Or continue with
                </span>
              </div>
            </div>

            <!-- Google Button -->
            <app-ui-button
              variant="outline"
              [fullWidth]="true"
              type="button"
              (onClick)="loginWithGoogle()"
            >
              Google
            </app-ui-button>
          </form>

          <p class="text-sm text-center text-[var(--text-secondary)]">
            Don't have an account?
            <a href="http://localhost:4202/pricing" class="text-[var(--color-primary-600)] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  reactivating = false;
  errorMessage = '';
  inactiveShopId: string | null = null;

  isLocked = false;
  isSuspended = false;
  remainingSeconds = 0;
  timerInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true],
    });
  }

  get formattedRemainingTime(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  startCountdown(seconds: number) {
    this.isLocked = true;
    this.remainingSeconds = seconds;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.isLocked = false;
        this.remainingSeconds = 0;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  getError(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required'])
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    if (control.errors['email']) return 'Invalid email address';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;

    return '';
  }

  async onSubmit() {
    this.submitted = true;
    this.loginForm.markAllAsTouched();
    this.errorMessage = '';
    this.isSuspended = false;

    if (this.loginForm.invalid || this.isLocked) {
      return;
    }

    this.loading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    const result = await this.authService.login(email, password, rememberMe);

    if (result.success) {
      // Router navigation handled in authService
    } else if (result.code === 'ACCOUNT_LOCKED') {
      this.startCountdown(result.remainingSeconds || 120);
      this.loading = false;
    } else if (result.code === 'ACCOUNT_SUSPENDED') {
      this.isSuspended = true;
      this.loading = false;
    } else if (result.inactive) {
      this.inactiveShopId = result.shopId || null;
      this.loading = false;
    } else {
      this.errorMessage = result.error || 'Login failed. Please try again.';
      this.loading = false;
    }
  }


  async requestReactivation() {
    if (!this.inactiveShopId) return;
    this.reactivating = true;
    try {
      const { environment } = await import('../../../environments/environment');
      const response = await fetch(`${environment.apiUrl}/shops/${this.inactiveShopId}/reactivate-request`, {
        method: 'POST'
      });
      if (response.ok) {
        this.inactiveShopId = null;
        this.errorMessage = "Reactivation request submitted successfully. We will notify you by email once approved.";
      } else {
        this.errorMessage = "Failed to submit reactivation request.";
      }
    } catch (e) {
      this.errorMessage = "An error occurred while requesting reactivation.";
    } finally {
      this.reactivating = false;
    }
  }

  async loginWithGoogle() {
    this.errorMessage = '';
    this.loading = true;
    
    const result = await this.authService.loginWithGoogleProvider();
    
    if (result.success) {
      if (result.isNewUser) {
        // If new user, they should sign up instead of logging in here
        this.errorMessage = 'Account not found. Please sign up first.';
      } else if (result.inactive) {
        this.inactiveShopId = result.shopId || null;
      } else {
        // Router navigation to dashboard is handled in AuthService (wait, actually it's not handled in loginWithGoogleProvider. Let's redirect manually)
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage = result.error || 'Google Sign-In failed.';
    }
    
    this.loading = false;
  }
}
