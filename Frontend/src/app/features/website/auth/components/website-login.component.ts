import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { ConfirmationResult } from 'firebase/auth';

type LoginTab = 'email-otp' | 'password' | 'phone';

@Component({
  selector: 'app-website-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <!-- Heading -->
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Welcome Back</h1>
          <p class="mt-2 text-sm text-gray-500">Sign in to continue to your account</p>
        </div>

        <!-- Tab Switcher -->
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
          <button
            (click)="switchTab('email-otp')"
            [class]="
              activeTab === 'email-otp'
                ? 'bg-white shadow text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            "
            class="flex-1 py-2 text-sm rounded-lg transition-all duration-200"
          >
            <i class="bi bi-envelope-check mr-1"></i> Email OTP
          </button>
          <button
            (click)="switchTab('password')"
            [class]="
              activeTab === 'password'
                ? 'bg-white shadow text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            "
            class="flex-1 py-2 text-sm rounded-lg transition-all duration-200"
          >
            <i class="bi bi-lock mr-1"></i> Password
          </button>
        </div>

        <div class="space-y-5">
          <!-- ===== EMAIL OTP TAB ===== -->
          <ng-container *ngIf="activeTab === 'email-otp'">
            <!-- Step 1: Enter Email -->
            <div *ngIf="otpStep === 'input'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                [(ngModel)]="otpEmail"
                (keyup.enter)="requestEmailOtp()"
                placeholder="Enter your email address"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <button
                (click)="requestEmailOtp()"
                [disabled]="loading || !otpEmail.trim()"
                class="mt-4 w-full py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                <span *ngIf="loading">Sending OTP...</span>
                <span *ngIf="!loading">Send OTP</span>
              </button>
            </div>

            <!-- Step 2: Enter 4-digit OTP -->
            <div *ngIf="otpStep === 'verify'">
              <!-- Success banner -->
              <div class="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
                <i class="bi bi-check-circle-fill text-green-500 text-lg mt-0.5 flex-shrink-0"></i>
                <div>
                  <p class="text-sm font-semibold text-green-800">OTP Sent!</p>
                  <p class="text-xs text-green-600 mt-0.5">
                    A 4-digit code was sent to <strong>{{ otpEmail }}</strong>
                  </p>
                  <!-- Dev mode: show OTP directly -->
                  <p *ngIf="devOtp" class="text-xs mt-1 text-green-700">
                    <span class="font-semibold">Dev mode OTP:</span>
                    <span
                      class="ml-1 font-mono bg-green-100 px-2 py-0.5 rounded tracking-widest text-base font-bold"
                      >{{ devOtp }}</span
                    >
                  </p>
                </div>
              </div>

              <!-- 4-digit OTP Input -->
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Enter 4-Digit Code
              </label>
              <div class="flex justify-center gap-3 mb-5">
                <input
                  *ngFor="let i of [0, 1, 2, 3]; let idx = index"
                  type="tel"
                  maxlength="1"
                  [(ngModel)]="otpDigits[idx]"
                  (input)="onOtpDigitInput($event, idx)"
                  (keydown)="onOtpKeydown($event, idx)"
                  (paste)="onOtpPaste($event)"
                  [id]="'otp-digit-' + idx"
                  class="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  [class.border-primary-500]="otpDigits[idx]"
                />
              </div>

              <button
                (click)="submitEmailOtp()"
                [disabled]="loading || otpDigits.join('').length < 4"
                class="w-full py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                <span *ngIf="loading">Verifying...</span>
                <span *ngIf="!loading">Verify & Sign In</span>
              </button>

              <!-- Resend & Change -->
              <div class="mt-4 flex justify-between text-xs text-gray-500">
                <button (click)="otpStep = 'input'; error = ''" class="hover:text-gray-800">
                  ← Change email
                </button>
                <button
                  *ngIf="otpResendCooldown === 0"
                  (click)="requestEmailOtp()"
                  class="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Resend OTP
                </button>
                <span *ngIf="otpResendCooldown > 0" class="text-gray-400">
                  Resend in {{ otpResendCooldown }}s
                </span>
              </div>
            </div>
          </ng-container>

          <!-- ===== PASSWORD TAB ===== -->
          <ng-container *ngIf="activeTab === 'password'">
            <!-- Step 1: Identifier input -->
            <div *ngIf="pwStep === 'input'">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number or Email
              </label>
              <input
                type="text"
                [(ngModel)]="identifier"
                (keyup.enter)="checkUser()"
                placeholder="Enter mobile number or email"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <p *ngIf="looksLikePhone(identifier)" class="mt-2 text-xs text-gray-400">
                We'll send a verification OTP to this number.
              </p>
              <button
                (click)="checkUser()"
                [disabled]="loading || !identifier.trim()"
                class="mt-4 w-full py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                <span *ngIf="loading">Checking...</span>
                <span *ngIf="!loading">Continue</span>
              </button>
            </div>

            <!-- Step 2: Password -->
            <div *ngIf="pwStep === 'password'">
              <div class="flex justify-between items-center mb-3">
                <span class="text-sm text-gray-600">{{ identifier }}</span>
                <button
                  (click)="pwStep = 'input'; error = ''"
                  class="text-xs text-primary-600 hover:text-primary-500"
                >
                  Change
                </button>
              </div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div class="relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  (keyup.enter)="loginWithPassword()"
                  placeholder="Enter your password"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm pr-11"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <i [class]="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <button
                (click)="loginWithPassword()"
                [disabled]="loading"
                class="mt-4 w-full py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                <span *ngIf="loading">Signing in...</span>
                <span *ngIf="!loading">Sign In</span>
              </button>
            </div>

            <!-- Step 3: Phone OTP (6-digit SMS) -->
            <div *ngIf="pwStep === 'otp'">
              <div class="flex justify-between items-center mb-3">
                <p class="text-sm text-gray-600">
                  OTP sent to <strong>{{ formattedPhone }}</strong>
                </p>
                <button (click)="goBackToInput()" class="text-xs text-primary-600">Change</button>
              </div>
              <input
                type="tel"
                maxlength="6"
                [(ngModel)]="otp"
                (keyup.enter)="verifyPhoneOtp()"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg tracking-[0.5em] font-semibold focus:ring-2 focus:ring-primary-500"
                placeholder="● ● ● ● ● ●"
              />
              <button
                (click)="verifyPhoneOtp()"
                [disabled]="loading || otp.length < 6"
                class="mt-4 w-full py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                <span *ngIf="loading">Verifying...</span>
                <span *ngIf="!loading">Verify OTP</span>
              </button>
              <div class="mt-3 text-center text-xs">
                <button *ngIf="resendCooldown > 0" disabled class="text-gray-400">
                  Resend in {{ resendCooldown }}s
                </button>
                <button
                  *ngIf="resendCooldown === 0"
                  (click)="resendPhoneOtp()"
                  class="text-primary-600 font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </ng-container>

          <!-- ERROR -->
          <div
            *ngIf="error"
            class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700"
          >
            <i class="bi bi-exclamation-triangle-fill mt-0.5 flex-shrink-0"></i>
            <span>{{ error }}</span>
          </div>

          <!-- SUCCESS -->
          <div
            *ngIf="successMsg"
            class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center"
          >
            <i class="bi bi-check-circle-fill mr-1"></i> {{ successMsg }}
          </div>

          <!-- Hidden reCAPTCHA container (for phone tab) -->
          <div
            id="recaptcha-container"
            class="w-full h-20 flex items-center justify-center mx-auto"
          ></div>

          <!-- Sign up link -->
          <div class="text-center text-sm text-gray-500 mt-4">
            Don't have an account?
            <a routerLink="../register" class="text-primary-600 hover:text-primary-500 font-medium"
              >Sign up</a
            >
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WebsiteLoginComponent implements OnInit, OnDestroy {
  // ─── Tab ──────────────────────────────────────────────────────────────────
  activeTab: LoginTab = 'email-otp';

  // ─── Email OTP flow ────────────────────────────────────────────────────────
  otpEmail = '';
  otpStep: 'input' | 'verify' = 'input';
  otpDigits: string[] = ['', '', '', ''];
  devOtp = ''; // shown in dev mode
  otpResendCooldown = 0;
  private otpResendTimer: any = null;

  // ─── Password / Phone flow ─────────────────────────────────────────────────
  identifier = '';
  password = '';
  otp = '';
  pwStep: 'input' | 'password' | 'otp' = 'input';
  formattedPhone = '';
  resendCooldown = 0;
  showPassword = false;
  recaptchaExpired = false;
  private cooldownTimer: any = null;
  private recaptchaVerifier: any = null;
  private confirmationResult: ConfirmationResult | null = null;

  // ─── Common ────────────────────────────────────────────────────────────────
  loading = false;
  error = '';
  successMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private tenantService: TenantService,
  ) {}

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.initRecaptcha();
  }

  ngOnDestroy() {
    this.destroyRecaptcha();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    if (this.otpResendTimer) clearInterval(this.otpResendTimer);
  }

  switchTab(tab: LoginTab) {
    this.activeTab = tab;
    this.error = '';
    this.successMsg = '';
  }

  // ─── EMAIL OTP METHODS ─────────────────────────────────────────────────────

  async requestEmailOtp() {
    const email = this.otpEmail.trim();
    if (!email || !email.includes('@')) {
      this.error = 'Please enter a valid email address.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.devOtp = '';

    try {
      const result = await this.authService.sendEmailOtp(email);
      this.devOtp = result.devOtp || '';
      this.otpStep = 'verify';
      this.otpDigits = ['', '', '', ''];
      this.startOtpResendCooldown();
      // Focus first OTP box
      setTimeout(() => document.getElementById('otp-digit-0')?.focus(), 100);
    } catch (e: any) {
      this.error = e.message || 'Failed to send OTP. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onOtpDigitInput(event: Event, idx: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, ''); // digits only
    this.otpDigits[idx] = val.slice(-1); // keep only last char
    input.value = this.otpDigits[idx];
    // Auto-advance
    if (this.otpDigits[idx] && idx < 3) {
      setTimeout(() => document.getElementById(`otp-digit-${idx + 1}`)?.focus(), 0);
    }
    // Auto-submit when all 4 filled
    if (this.otpDigits.join('').length === 4) {
      setTimeout(() => this.submitEmailOtp(), 100);
    }
  }

  onOtpKeydown(event: KeyboardEvent, idx: number) {
    if (event.key === 'Backspace' && !this.otpDigits[idx] && idx > 0) {
      this.otpDigits[idx - 1] = '';
      setTimeout(() => document.getElementById(`otp-digit-${idx - 1}`)?.focus(), 0);
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 4);
    digits.split('').forEach((d, i) => {
      this.otpDigits[i] = d;
    });
    if (digits.length === 4) {
      setTimeout(() => this.submitEmailOtp(), 100);
    } else {
      document.getElementById(`otp-digit-${digits.length}`)?.focus();
    }
  }

  async submitEmailOtp() {
    const code = this.otpDigits.join('');
    if (code.length < 4) return;
    this.loading = true;
    this.error = '';
    this.successMsg = '';

    const result = await this.authService.verifyEmailOtp(this.otpEmail.trim(), code);
    this.loading = false;

    if (!result.success) {
      this.error = result.error || 'Verification failed. Please try again.';
      // Clear OTP boxes on failure
      this.otpDigits = ['', '', '', ''];
      setTimeout(() => document.getElementById('otp-digit-0')?.focus(), 100);
    } else {
      this.successMsg = 'Verified! Signing you in...';
      this.router.navigate(this.routePrefix);
    }
  }

  private startOtpResendCooldown(seconds = 30) {
    this.otpResendCooldown = seconds;
    if (this.otpResendTimer) clearInterval(this.otpResendTimer);
    this.otpResendTimer = setInterval(() => {
      this.otpResendCooldown--;
      if (this.otpResendCooldown <= 0) {
        clearInterval(this.otpResendTimer);
        this.otpResendTimer = null;
      }
    }, 1000);
  }

  // ─── PASSWORD / PHONE METHODS ──────────────────────────────────────────────

  looksLikePhone(value: string): boolean {
    return /^[\d\s\+\-\(\)]{7,}$/.test(value) && !value.includes('@');
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) return '+' + digits;
    if (digits.startsWith('91') && digits.length === 12) return '+' + digits;
    if (digits.startsWith('0') && digits.length === 11) return '+91' + digits.slice(1);
    if (digits.length === 10) return '+91' + digits;
    return '+' + digits;
  }

  private initRecaptcha() {
    try {
      this.destroyRecaptcha();
      const el = document.getElementById('recaptcha-container');
      if (el) el.innerHTML = '';
      this.recaptchaVerifier = this.authService.setupRecaptcha('recaptcha-container', () => {
        this.recaptchaExpired = true;
        this.error = 'reCAPTCHA expired. Please solve it again.';
      });
      this.recaptchaExpired = false;
    } catch (e) {
      console.warn('reCAPTCHA init failed:', e);
    }
  }

  private destroyRecaptcha() {
    try {
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
    } catch (e) {}
  }

  goBackToInput() {
    this.pwStep = 'input';
    this.error = '';
    this.otp = '';
    setTimeout(() => this.initRecaptcha(), 100);
  }

  async checkUser() {
    const trimmed = this.identifier.trim();
    if (!trimmed) return;
    this.loading = true;
    this.error = '';

    try {
      const { exists, method } = await this.authService.checkUserExists(trimmed);
      if (!exists) {
        this.error = 'No account found. Please Sign Up first.';
        this.loading = false;
        return;
      }
      await this.proceedToLogin(method);
    } catch (e: any) {
      if (
        e.message?.includes('Missing or insufficient permissions') ||
        e.code === 'permission-denied'
      ) {
        await this.proceedToLogin(trimmed.includes('@') ? 'email' : 'phone');
      } else {
        this.error = 'Error checking account: ' + (e.message || 'Please try again.');
        this.loading = false;
      }
    }
  }

  private async proceedToLogin(method: 'email' | 'phone' | 'unknown') {
    const trimmed = this.identifier.trim();
    if ((method === 'email' || method === 'unknown') && trimmed.includes('@')) {
      this.pwStep = 'password';
      this.loading = false;
      return;
    }

    try {
      const e164 = this.normalizePhone(trimmed);
      this.formattedPhone = e164;

      if (!this.recaptchaVerifier || this.recaptchaExpired) {
        this.initRecaptcha();
        await new Promise((r) => setTimeout(r, 800));
      }

      this.confirmationResult = await this.authService.sendPhoneOtp(e164, this.recaptchaVerifier);
      this.pwStep = 'otp';
      this.recaptchaExpired = false;
      this.startResendCooldown();
    } catch (e: any) {
      const code: string = e?.code || '';
      if (code === 'auth/invalid-phone-number') {
        this.error = 'Invalid phone number. Please enter a valid 10-digit number.';
      } else if (code === 'auth/too-many-requests') {
        this.error = 'Too many OTP requests. Please try again after a few minutes.';
      } else if (code === 'auth/network-request-failed') {
        this.error = 'Firebase Phone Auth failed. Use the "Email OTP" tab instead.';
      } else {
        this.error = e?.message || 'Failed to send OTP. Try Email OTP instead.';
      }
      setTimeout(() => this.initRecaptcha(), 500);
    } finally {
      this.loading = false;
    }
  }

  async resendPhoneOtp() {
    this.error = '';
    this.otp = '';
    this.loading = true;
    this.resendCooldown = 0;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.authService.resetRecaptcha(this.recaptchaVerifier);
    await new Promise((r) => setTimeout(r, 500));
    await this.proceedToLogin('phone');
  }

  private startResendCooldown(seconds = 30) {
    this.resendCooldown = seconds;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }

  async loginWithPassword() {
    if (!this.password) {
      this.error = 'Please enter your password.';
      return;
    }
    this.loading = true;
    this.error = '';
    const res = await this.authService.login(this.identifier.trim(), this.password);
    this.loading = false;
    if (!res.success) {
      this.error = res.error || 'Sign in failed. Please try again.';
    } else {
      this.router.navigate(this.routePrefix);
    }
  }

  async verifyPhoneOtp() {
    if (!this.confirmationResult || this.otp.length < 6) return;
    this.loading = true;
    this.error = '';
    try {
      const result = await this.confirmationResult.confirm(this.otp);
      const user = result.user;
      if (user) {
        const profile = await this.authService.getUserProfile(user.uid);
        if (profile) {
          this.router.navigate(this.routePrefix);
        } else {
          this.router.navigate(['../register'], {
            queryParams: { mobile: this.identifier.trim() },
          });
        }
      }
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/invalid-verification-code') {
        this.error = 'Incorrect OTP. Please check and try again.';
      } else if (code === 'auth/code-expired') {
        this.error = 'OTP has expired. Please request a new one.';
        this.pwStep = 'input';
        setTimeout(() => this.initRecaptcha(), 100);
      } else {
        this.error = 'OTP verification failed. Please try again.';
      }
      this.loading = false;
    }
  }
}
