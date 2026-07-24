import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-website-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
  <div class="w-full max-w-md">

    <!-- Brand Header -->
    <div class="text-center mb-8" *ngIf="shopConfig$ | async as config">
      <a [routerLink]="routePrefix" class="inline-block mb-6">
        <img *ngIf="config.theme?.logo" [src]="config.theme?.logo" [alt]="config.displayName" class="h-10 mx-auto object-contain" />
        <span *ngIf="!config.theme?.logo" class="text-xl font-bold text-gray-900 tracking-tight">{{ config.displayName || config.shopName }}</span>
      </a>
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Sign in to your account</h1>
      <p class="mt-2 text-sm text-gray-500">Welcome back</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      <!-- Auth Mode Tabs -->
      <div class="flex border border-gray-200 rounded-xl p-1 mb-6 bg-gray-50">
        <button (click)="authMode='email'" [class.bg-white]="authMode==='email'" [class.shadow-sm]="authMode==='email'"
          class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-gray-600">
          Email / Phone
        </button>
        <button (click)="authMode='emailOtp'; initEmailOtpMode()" [class.bg-white]="authMode==='emailOtp'" [class.shadow-sm]="authMode==='emailOtp'"
          class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-gray-600">
          Email OTP
        </button>
      </div>

      <!-- Email/Phone+Password flow -->
      <div *ngIf="authMode==='email'">
        <!-- Step 1: Enter identifier -->
        <div *ngIf="pwStep==='input'" class="space-y-4">
          <input
            type="text" [(ngModel)]="identifier" name="identifier"
            placeholder="Email or Phone Number"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
          />
          <div id="recaptcha-container"></div>
          <button (click)="checkUser()" [disabled]="loading || !identifier.trim()"
            class="w-full py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {{ loading ? 'Checking...' : 'Continue' }}
          </button>
          <button (click)="loginWithGoogle()" [disabled]="loading"
            class="w-full py-3 text-sm font-semibold border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        <!-- Step 2: Password -->
        <div *ngIf="pwStep==='password'" class="space-y-4">
          <p class="text-sm text-gray-600">Signing in as <strong>{{ identifier }}</strong></p>
          <input type="password" [(ngModel)]="password" name="password" placeholder="Password"
            (keyup.enter)="loginWithPassword()"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
          <button (click)="loginWithPassword()" [disabled]="loading || !password"
            class="w-full py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
          <button (click)="pwStep='input'; password=''" class="w-full text-xs text-gray-500 hover:text-gray-800 transition-colors">← Back</button>
        </div>

        <!-- Step 3: Phone OTP -->
        <div *ngIf="pwStep==='otp'" class="space-y-4">
          <p class="text-sm text-gray-600">Enter OTP sent to <strong>{{ formattedPhone }}</strong></p>
          <input type="text" [(ngModel)]="otp" name="otp" maxlength="6" placeholder="6-digit OTP"
            (keyup.enter)="verifyPhoneOtp()"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center tracking-widest focus:outline-none focus:border-gray-900 transition-colors" />
          <button (click)="verifyPhoneOtp()" [disabled]="loading || otp.length < 6"
            class="w-full py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {{ loading ? 'Verifying...' : 'Verify OTP' }}
          </button>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <button (click)="goBackToInput()" class="hover:text-gray-800 transition-colors">← Back</button>
            <button *ngIf="resendCooldown <= 0" (click)="resendPhoneOtp()" class="text-gray-900 font-semibold hover:underline">Resend OTP</button>
            <span *ngIf="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
          </div>
        </div>
      </div>

      <!-- Email OTP flow -->
      <div *ngIf="authMode==='emailOtp'">
        <div *ngIf="otpStep==='input'" class="space-y-4">
          <input type="email" [(ngModel)]="otpEmail" name="otpEmail" placeholder="Your email address"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
          <button (click)="sendEmailOtp()" [disabled]="loading || !otpEmail.trim()"
            class="w-full py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {{ loading ? 'Sending...' : 'Send OTP' }}
          </button>
          <p *ngIf="successMsg" class="text-sm text-green-600 text-center">{{ successMsg }}</p>
        </div>

        <div *ngIf="otpStep==='verify'" class="space-y-4">
          <p class="text-sm text-gray-600">Enter OTP sent to <strong>{{ otpEmail }}</strong></p>
          <div class="flex gap-2 justify-center">
            <input *ngFor="let d of otpDigits; let i = index"
              [id]="'otp-digit-' + i"
              type="text" maxlength="1"
              [(ngModel)]="otpDigits[i]"
              (input)="onOtpInput($event, i)"
              (keydown)="onOtpKeydown($event, i)"
              class="w-12 h-12 text-center border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-gray-900 transition-colors" />
          </div>
          <button (click)="submitEmailOtp()" [disabled]="loading || otpDigits.join('').length < 4"
            class="w-full py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <button (click)="otpStep='input'; otpDigits=['','','','']" class="hover:text-gray-800">← Back</button>
            <button *ngIf="otpResendCooldown <= 0" (click)="sendEmailOtp()" class="text-gray-900 font-semibold hover:underline">Resend</button>
            <span *ngIf="otpResendCooldown > 0">Resend in {{ otpResendCooldown }}s</span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 text-center">{{ error }}</div>
    </div>

    <!-- Sign up link -->
    <p class="text-center text-sm text-gray-500 mt-6">
      Don't have an account?
      <a [routerLink]="[...routePrefix, 'auth', 'register']" class="text-gray-900 font-semibold hover:underline">Sign Up</a>
    </p>

  </div>
</div>
  `,
})
export class WebsiteLoginComponent implements OnInit, OnDestroy {
  shopConfig$;
  authMode: 'email' | 'emailOtp' = 'email';
  pwStep: 'input' | 'password' | 'otp' = 'input';
  otpStep: 'input' | 'verify' = 'input';

  identifier = '';
  password = '';
  otp = '';
  formattedPhone = '';
  otpEmail = '';
  otpDigits = ['', '', '', ''];

  loading = false;
  error = '';
  successMsg = '';
  resendCooldown = 0;
  otpResendCooldown = 0;

  private cooldownTimer: any = null;
  private otpResendTimer: any = null;
  private confirmationResult: any = null;
  private recaptchaVerifier: any = null;
  private recaptchaExpired = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService,
    private shopContext: ShopContextService,
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(this.routePrefix);
    }
    setTimeout(() => this.initRecaptcha(), 200);
  }

  ngOnDestroy() {
    this.destroyRecaptcha();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    if (this.otpResendTimer) clearInterval(this.otpResendTimer);
  }

  initEmailOtpMode() {
    this.error = '';
    this.successMsg = '';
  }

  // ── EMAIL OTP ───────────────────────────────────────────────────────────────

  async sendEmailOtp() {
    if (!this.otpEmail.trim()) return;
    this.loading = true;
    this.error = '';
    this.successMsg = '';
    const res = await this.authService.sendEmailOtp(this.otpEmail.trim());
    this.loading = false;
    if (!res.success) {
      this.error = res.error || 'Failed to send OTP.';
    } else {
      this.successMsg = 'OTP sent! Check your inbox.';
      this.otpStep = 'verify';
      this.otpDigits = ['', '', '', ''];
      this.startOtpResendCooldown(30);
    }
  }

  onOtpInput(event: Event, idx: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    this.otpDigits[idx] = val.slice(-1);
    input.value = this.otpDigits[idx];
    if (this.otpDigits[idx] && idx < 3) {
      setTimeout(() => (document.getElementById(`otp-digit-${idx + 1}`) as HTMLInputElement)?.focus(), 0);
    }
    if (this.otpDigits.join('').length === 4) {
      setTimeout(() => this.submitEmailOtp(), 100);
    }
  }

  onOtpKeydown(event: KeyboardEvent, idx: number) {
    if (event.key === 'Backspace' && !this.otpDigits[idx] && idx > 0) {
      this.otpDigits[idx - 1] = '';
      setTimeout(() => (document.getElementById(`otp-digit-${idx - 1}`) as HTMLInputElement)?.focus(), 0);
    }
  }

  async submitEmailOtp() {
    const code = this.otpDigits.join('');
    if (code.length < 4) return;
    this.loading = true;
    this.error = '';
    const result = await this.authService.verifyEmailOtp(this.otpEmail.trim(), code);
    this.loading = false;
    if (!result.success) {
      this.error = result.error || 'Verification failed.';
      this.otpDigits = ['', '', '', ''];
    } else {
      this.router.navigate(this.routePrefix);
    }
  }

  private startOtpResendCooldown(seconds = 30) {
    this.otpResendCooldown = seconds;
    if (this.otpResendTimer) clearInterval(this.otpResendTimer);
    this.otpResendTimer = setInterval(() => {
      this.otpResendCooldown--;
      if (this.otpResendCooldown <= 0) clearInterval(this.otpResendTimer);
    }, 1000);
  }

  // ── PASSWORD / PHONE ────────────────────────────────────────────────────────

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
        this.error = 'reCAPTCHA expired. Please try again.';
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
        this.error = 'No account found. Please sign up first.';
        this.loading = false;
        return;
      }
      await this.proceedToLogin(method);
    } catch (e: any) {
      if (e.message?.includes('Missing or insufficient permissions') || e.code === 'permission-denied') {
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
      if (code === 'auth/invalid-phone-number') this.error = 'Invalid phone number.';
      else if (code === 'auth/too-many-requests') this.error = 'Too many OTP requests. Try again later.';
      else this.error = e?.message || 'Failed to send OTP.';
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
    if (!this.password) { this.error = 'Please enter your password.'; return; }
    this.loading = true;
    this.error = '';
    const res = await this.authService.login(this.identifier.trim(), this.password);
    this.loading = false;
    if (!res.success) {
      this.error = res.error || 'Sign in failed.';
    } else {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      this.router.navigate(returnUrl ? [returnUrl] : this.routePrefix);
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
          this.authService.updateProfile(profile);
          this.router.navigate(this.routePrefix);
        } else {
          this.router.navigate([...this.routePrefix, 'auth', 'register'], {
            queryParams: { mobile: this.identifier.trim() },
          });
        }
      }
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/invalid-verification-code') this.error = 'Incorrect OTP.';
      else if (code === 'auth/code-expired') { this.error = 'OTP expired.'; this.pwStep = 'input'; }
      else this.error = 'OTP verification failed.';
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.loading = true;
    this.error = '';
    const res = await this.authService.loginWithGoogle();
    this.loading = false;
    if (!res.success) {
      this.error = res.error || 'Google sign-in failed.';
    } else {
      this.router.navigate(this.routePrefix);
    }
  }
}
