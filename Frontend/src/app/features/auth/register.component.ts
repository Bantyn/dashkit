import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { AuthCardComponent } from '../../shared/components/auth-card.component';
import { UiInputComponent } from '../../shared/components/ui-input.component';
import { UiButtonComponent } from '../../shared/components/ui-button.component';
import { VerticalCutRevealComponent } from '../../shared/components/ui/vertical-cut-reveal.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox.component';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    UiInputComponent,
    UiButtonComponent,
    VerticalCutRevealComponent,
    CheckboxComponent,
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
    <div class="min-h-screen grid grid-cols-1 md:grid-cols-2 page-enter">
      <!-- LEFT BRAND PANEL -->
      <div
        class="hidden md:flex flex-col justify-center items-center text-center px-12
           bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] 
           from-[var(--color-primary-400)] via-[var(--color-primary-600)] to-[var(--color-primary-800)] 
           text-white font-['Outfit',sans-serif]"
      >
        <app-vertical-cut-reveal
          text="Start Your Journey"
          splitBy="characters"
          [staggerDuration]="0.04"
          staggerFrom="first"
          containerClassName="text-5xl font-normal uppercase mb-5 justify-center tracking-tight"
        ></app-vertical-cut-reveal>

        <app-vertical-cut-reveal
          text="Create your Clothify account and manage your shop online with ease."
          splitBy="words"
          [staggerDuration]="0.05"
          staggerFrom="first"
          [delay]="0.35"
          containerClassName="text-lg text-white/85 max-w-md justify-center font-normal leading-relaxed tracking-wide"
        ></app-vertical-cut-reveal>

        <!-- Premium SaaS Dashboard Mockup -->
        <div class="mt-12 relative w-full max-w-sm aspect-video flex items-center justify-center font-sans perspective-1000">
          
          <!-- Abstract Background Glows -->
          <div class="absolute -top-6 -right-6 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-10 -left-6 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <!-- Main Floating Dashboard Card -->
          <div class="absolute z-10 w-80 h-52 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 transform hover:-translate-y-2 transition-transform duration-500 ease-out">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div class="text-left">
                  <div class="text-[10px] text-indigo-200 font-semibold tracking-wide uppercase">Today's Sales</div>
                  <div class="text-lg font-bold text-white tracking-tight">₹ 24,500</div>
                </div>
              </div>
              <span class="text-[10px] bg-emerald-500/20 px-2 py-1 rounded-full text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                +18.5%
              </span>
            </div>
            
            <!-- Minimal Chart -->
            <div class="h-16 w-full flex items-end gap-1.5 mt-2">
              <div class="w-full bg-white/20 rounded-t-sm h-[30%]"></div>
              <div class="w-full bg-white/20 rounded-t-sm h-[50%]"></div>
              <div class="w-full bg-white/20 rounded-t-sm h-[40%]"></div>
              <div class="w-full bg-white/20 rounded-t-sm h-[70%]"></div>
              <div class="w-full bg-white/30 rounded-t-sm h-[60%]"></div>
              <div class="w-full bg-white/40 rounded-t-sm h-[85%]"></div>
              <div class="w-full bg-gradient-to-t from-indigo-400 to-emerald-400 rounded-t-sm h-full shadow-[0_0_10px_rgba(52,211,153,0.5)] relative">
                <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>

            <!-- Footer Stats -->
            <div class="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div class="text-left">
                <div class="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Active Orders</div>
                <div class="text-sm font-semibold text-white">142</div>
              </div>
              <div class="text-left">
                <div class="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Total Customers</div>
                <div class="text-sm font-semibold text-white">8,904</div>
              </div>
            </div>
          </div>
          
          <!-- Floating Notification Badge -->
          <div class="absolute z-20 -bottom-10 -right-4 bg-white/10 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/20 flex items-center gap-3 animate-bounce" style="animation-duration: 3s;">
            <div class="relative">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--color-primary-600)]"></div>
            </div>
            <div class="text-left">
              <div class="text-[10px] font-semibold text-white">New Order #4092</div>
              <div class="text-[9px] text-white/70">Just now • ₹ 1,299</div>
            </div>
          </div>
          
        </div>
      </div>

      <!-- RIGHT FORM PANEL -->
      <div class="flex items-center justify-center min-h-screen bg-[var(--bg-card)] px-6 py-12 overflow-y-auto">
        <div class="w-full max-w-md space-y-6">
          <!-- Progress Bar -->
          <div class="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
            <div class="bg-[var(--color-primary-600)] h-1.5 rounded-full transition-all duration-500 ease-out" 
                 [style.width]="(currentStep / 3) * 100 + '%'"></div>
          </div>
          
          <div class="flex justify-between items-end">
            <h2 class="text-3xl font-semibold text-[var(--text-primary)]">
              {{ currentStep === 1 ? 'Account Setup' : (currentStep === 2 ? 'Shop Details' : (planCode !== 'free' && planCode !== 'custom' && planCode !== 'trial' ? 'Checkout' : 'Create Account')) }}
            </h2>
            <div class="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1">Step {{ currentStep }} of 3</div>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5 w-full overflow-hidden">
            
            <div class="flex transition-transform duration-500 ease-in-out w-[300%]" [style.transform]="'translateX(-' + ((currentStep - 1) * 33.333333) + '%)'">
              
              <!-- STEP 1: Account Security -->
              <div class="w-1/3 flex flex-col gap-5 px-1 shrink-0">
                <!-- Email & Verification Wrapper -->
                <div class="space-y-2">
                  <div class="flex items-end gap-2">
                    <div class="flex-1">
                      <app-ui-input
                        label="Email"
                        type="email"
                        formControlName="email"
                        placeholder="you@example.com"
                        [error]="getError('email')"
                      ></app-ui-input>
                    </div>
                    <div class="pb-1">
                      <button
                        *ngIf="!emailVerified"
                        type="button"
                        (click)="sendEmailOtp()"
                        [disabled]="sendingOtp || emailInvalid || emailVerified"
                        class="h-10 px-4 rounded-lg bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[100px]"
                      >
                        <span *ngIf="sendingOtp" class="animate-spin mr-1 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                        {{ sendingOtp ? 'Sending...' : 'Verify Email' }}
                      </button>
                      <span
                        *ngIf="emailVerified"
                        class="h-10 px-4 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold text-xs flex items-center justify-center gap-1 min-w-[100px]"
                      >
                        <i class="bi bi-patch-check-fill text-green-600"></i> Verified
                      </span>
                    </div>
                  </div>

                  <!-- OTP Input section -->
                  <div *ngIf="otpSent && !emailVerified" class="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                    <p class="text-xs text-gray-500">
                      Verification code has been sent to your email.
                    </p>
                    <div class="flex items-end gap-2">
                      <div class="flex-1">
                        <app-ui-input
                          label="Enter 6-Digit OTP"
                          type="text"
                          [(ngModel)]="otpCode"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="e.g. 123456"
                          maxlength="6"
                        ></app-ui-input>
                      </div>
                      <div class="pb-1">
                        <button
                          type="button"
                          (click)="verifyEmailOtp()"
                          [disabled]="verifyingOtp || otpCode.length !== 6"
                          class="h-10 px-4 rounded-lg bg-gray-900 hover:bg-black text-white font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[80px]"
                        >
                          <span *ngIf="verifyingOtp" class="animate-spin mr-1 h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                          Verify
                        </button>
                      </div>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-400">
                        Expires in: <strong class="text-gray-700 font-mono">{{ otpCountdown }}</strong>
                      </span>
                      <button
                        *ngIf="otpCountdownExpired"
                        type="button"
                        (click)="sendEmailOtp()"
                        [disabled]="sendingOtp"
                        class="text-[var(--color-primary-600)] hover:underline font-semibold bg-transparent border-0 cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Password -->
                <app-ui-input
                  label="Password"
                  type="password"
                  formControlName="password"
                  placeholder="••••••••"
                  [error]="getError('password')"
                ></app-ui-input>

                <!-- Confirm Password -->
                <app-ui-input
                  label="Confirm Password"
                  type="password"
                  formControlName="confirmPassword"
                  placeholder="••••••••"
                  [error]="getError('confirmPassword') || (passwordMismatchCheck() ? 'Passwords do not match' : '')"
                ></app-ui-input>
              </div>

              <!-- STEP 2: Shop Details -->
              <div class="w-1/3 flex flex-col gap-5 px-1 shrink-0">
                <!-- Shop Name -->
                <app-ui-input
                  label="Shop Name"
                  formControlName="shopName"
                  placeholder="My Awesome Shop"
                  [error]="getError('shopName')"
                ></app-ui-input>

                <!-- Owner Name -->
                <app-ui-input
                  label="Owner Name"
                  formControlName="ownerName"
                  placeholder="John Doe"
                  [error]="getError('ownerName')"
                ></app-ui-input>

                <!-- Mobile Number -->
                <app-ui-input
                  label="Mobile Number"
                  formControlName="mobile"
                  placeholder="e.g. 9876543210"
                  [error]="getError('mobile')"
                ></app-ui-input>

                <!-- GST IN -->
                <app-ui-input
                  label="GSTIN (Optional)"
                  formControlName="gstIn"
                  placeholder="22AAAAA0000A1Z5"
                ></app-ui-input>
              </div>

              <!-- STEP 3: Location & Terms -->
              <div class="w-1/3 flex flex-col gap-5 px-1 shrink-0">
                <!-- Pickup Address (Optional) -->
                <div formGroupName="pickupAddress" class="space-y-4">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Shop / Pickup Address <span class="font-normal normal-case">(optional)</span>
                  </p>
                  <app-ui-input
                    label="Street Address"
                    formControlName="address"
                    placeholder="e.g. 12, Main Road, Ring Road"
                  ></app-ui-input>
                  <div class="grid grid-cols-2 gap-4">
                    <app-ui-input
                      label="City"
                      formControlName="city"
                      placeholder="e.g. Surat"
                    ></app-ui-input>
                    <app-ui-input
                      label="State"
                      formControlName="state"
                      placeholder="e.g. Gujarat"
                    ></app-ui-input>
                  </div>
                  <app-ui-input
                    label="Pincode"
                    formControlName="pincode"
                    placeholder="e.g. 395007"
                  ></app-ui-input>
                </div>

                <!-- Terms -->
                <div class="flex items-center space-x-2 mt-2">
                  <app-checkbox
                    formControlName="acceptTerms"
                    [size]="22"
                    color="var(--color-primary-600)"
                  ></app-checkbox>
                  <label class="text-sm text-[var(--text-secondary)] leading-tight cursor-pointer" (click)="registerForm.get('acceptTerms')?.setValue(!registerForm.get('acceptTerms')?.value)">
                    I agree to the
                    <a href="#" class="font-medium text-[var(--color-primary-600)] hover:underline" (click)="$event.stopPropagation()">Terms of Service</a>
                    and
                    <a href="#" class="font-medium text-[var(--color-primary-600)] hover:underline" (click)="$event.stopPropagation()">Privacy Policy</a>
                  </label>
                </div>

                <p *ngIf="getError('acceptTerms')" class="text-xs font-medium text-[var(--color-danger)]">
                  You must accept the terms
                </p>
              </div>
            </div>

            <!-- Error & Success Messages -->
            <div *ngIf="errorMessage" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
              {{ errorMessage }}
            </div>
            <div *ngIf="successMessage" class="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-[var(--radius-md)]">
              {{ successMessage }}
            </div>

            <!-- Navigation Buttons -->
            <div class="flex w-full gap-3 mt-4 pt-2 relative z-30">
              <div class="flex-1" *ngIf="currentStep > 1 && !(currentStep === 2 && isGoogleAuth)">
                <button 
                  type="button" 
                  class="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium text-sm transition-colors cursor-pointer"
                  (click)="prevStep()"
                >
                  Back
                </button>
              </div>
              
              <div class="flex-1" *ngIf="currentStep < 3">
                <button 
                  type="button" 
                  [disabled]="currentStep === 1 && !emailVerified"
                  class="w-full h-11 rounded-lg bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] font-semibold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  (click)="nextStep()"
                >
                  <span>Next</span>
                  <i class="bi bi-arrow-right"></i>
                </button>
              </div>

              <div class="flex-1" *ngIf="currentStep === 3">
                <button 
                  type="submit" 
                  [disabled]="loading"
                  class="w-full h-11 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                >
                  <svg *ngIf="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ loading ? (planCode !== 'free' && planCode !== 'custom' && planCode !== 'trial' ? 'Initializing Payment...' : 'Creating account...') : (planCode !== 'free' && planCode !== 'custom' && planCode !== 'trial' ? 'Proceed to Payment' : 'Create Account') }}
                </button>
              </div>
            </div>

            <!-- Divider -->
            <div *ngIf="(planCode === 'free' || planCode === 'custom' || planCode === 'trial') && currentStep === 1" class="relative py-2">
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
              *ngIf="(planCode === 'free' || planCode === 'custom' || planCode === 'trial') && currentStep === 1"
              variant="outline"
              [fullWidth]="true"
              type="button"
              (onClick)="loginWithGoogle()"
            >
              Sign up with Google
            </app-ui-button>
          </form>

          <!-- Footer -->
          <p class="text-sm text-center text-[var(--text-secondary)]">
            Already have an account?
            <a routerLink="/login" class="text-[var(--color-primary-600)] hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  planCode = 'trial';
  billingCycle: 'monthly' | 'yearly' = 'monthly';
  branchCount: number = 1;
  includeDomain: boolean = false;
  reqId: string = '';
  token: string = '';
  currentStep = 1;
  isGoogleAuth = false;

  sendingOtp = false;
  verifyingOtp = false;
  otpSent = false;
  emailVerified = false;
  otpCode = '';
  otpCountdown = '05:00';
  otpCountdownExpired = false;
  private countdownTimer: any;

  get emailInvalid(): boolean {
    const control = this.registerForm.get('email');
    return !control || control.invalid;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      shopName: ['', Validators.required],
      ownerName: ['', Validators.required],
      mobile: ['', Validators.required],
      gstIn: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
      pickupAddress: this.fb.group({
        address: [''],
        city: [''],
        state: [''],
        pincode: [''],
      }),
    });
  }

  ngOnInit() {
    this.registerForm.get('email')?.valueChanges.subscribe(() => {
      if (this.emailVerified || this.otpSent) {
        this.emailVerified = false;
        this.otpSent = false;
        this.otpCode = '';
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
        }
        this.cdr.detectChanges();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['plan']) {
        this.planCode = params['plan'];
      }
      // 'period' is what checkout.component sends (number of months)
      if (params['period']) {
        this.billingCycle = Number(params['period']) >= 12 ? 'yearly' : 'monthly';
      } else if (params['billing']) {
        // fallback for direct links
        this.billingCycle = params['billing'] === 'yearly' ? 'yearly' : 'monthly';
      }
      if (params['branches']) {
        this.branchCount = parseInt(params['branches'], 10) || 1;
      }
      if (params['domain']) {
        this.includeDomain = params['domain'] === 'true';
      }
      // Custom plan registration token
      if (params['reqId']) {
        this.reqId = params['reqId'];
        this.planCode = 'custom';
      }
      if (params['token']) {
        this.token = params['token'];
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  get passwordMismatch(): boolean {
    return this.passwordMismatchCheck() && this.submitted;
  }

  passwordMismatchCheck(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return !!password && !!confirmPassword && password !== confirmPassword;
  }

  nextStep() {
    this.errorMessage = '';
    
    if (this.currentStep === 1) {
      const email = this.registerForm.get('email');
      const password = this.registerForm.get('password');
      const confirmPassword = this.registerForm.get('confirmPassword');
      
      email?.markAsTouched();
      password?.markAsTouched();
      confirmPassword?.markAsTouched();
      
      if (email?.invalid || password?.invalid || confirmPassword?.invalid || this.passwordMismatchCheck()) {
        this.errorMessage = 'Please fix the errors above before proceeding.';
        return;
      }

      if (!this.emailVerified) {
        this.errorMessage = 'Please verify your email address before proceeding.';
        return;
      }
    } else if (this.currentStep === 2) {
      const shopName = this.registerForm.get('shopName');
      const ownerName = this.registerForm.get('ownerName');
      const mobile = this.registerForm.get('mobile');
      shopName?.markAsTouched();
      ownerName?.markAsTouched();
      mobile?.markAsTouched();
      
      if (shopName?.invalid || ownerName?.invalid || mobile?.invalid) {
        this.errorMessage = 'Please enter valid shop, owner and mobile details.';
        return;
      }
    }
    
    this.currentStep++;
  }

  sendEmailOtp() {
    const emailControl = this.registerForm.get('email');
    if (!emailControl || emailControl.invalid) return;

    this.sendingOtp = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.sendRegistrationEmailOtp(emailControl.value).then(
      (res: any) => {
        this.sendingOtp = false;
        this.otpSent = true;
        this.otpCode = '';
        this.startOtpCountdown();
        this.successMessage = res.message || 'Verification code has been sent to your email.';
        this.cdr.detectChanges();
      },
      (err: any) => {
        this.sendingOtp = false;
        this.errorMessage = err.message || 'Failed to send verification code. Please try again.';
        this.cdr.detectChanges();
      }
    );
  }

  verifyEmailOtp() {
    const emailControl = this.registerForm.get('email');
    if (!emailControl || !this.otpCode || this.otpCode.length !== 6) return;

    this.verifyingOtp = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyRegistrationEmailOtp(emailControl.value, this.otpCode).then(
      (res: any) => {
        this.verifyingOtp = false;
        this.emailVerified = true;
        this.otpSent = false;
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
        }
        this.successMessage = res.message || 'Email verified successfully!';
        this.cdr.detectChanges();
      },
      (err: any) => {
        this.verifyingOtp = false;
        this.errorMessage = err.message || 'Incorrect verification code. Please try again.';
        this.cdr.detectChanges();
      }
    );
  }

  startOtpCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.otpCountdownExpired = false;
    let totalSeconds = 300; // 5 minutes
    
    const updateDisplay = () => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.otpCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    updateDisplay();

    this.countdownTimer = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        clearInterval(this.countdownTimer);
        this.otpCountdown = '00:00';
        this.otpCountdownExpired = true;
      } else {
        updateDisplay();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  prevStep() {
    this.errorMessage = '';
    if (this.currentStep === 2 && this.isGoogleAuth) {
      return;
    }
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  getError(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required'])
      return `${controlName === 'acceptTerms' ? 'Terms' : controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    if (control.errors['email']) return 'Invalid email address';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;

    return '';
  }

  async onSubmit() {
    this.submitted = true;
    this.registerForm.markAllAsTouched();
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid || this.passwordMismatch) {
      return;
    }

    this.loading = true;
    const { shopName, ownerName, mobile, gstIn, email, password, pickupAddress } = this.registerForm.value;

    // Direct registration in trial mode for the selected plan
    const result = await this.authService.register(
      email,
      this.isGoogleAuth ? null : password,
      shopName,
      'shop_owner',
      mobile,
      pickupAddress,
      this.branchCount,
      false, // don't skip redirect
      this.planCode,
      this.reqId || undefined,
      this.token || undefined,
      ownerName,
      gstIn
    );

    if (result.success) {
      this.successMessage = 'Account created successfully! Redirecting...';
    } else {
      this.errorMessage = result.error || 'Registration failed. Please try again.';
      this.loading = false;
    }
  }

  private async completeRegistration(
    email: string, password: string, shopName: string, ownerName: string, mobile: string, gstIn: string, pickupAddress: any,
    paymentId: string, orderId: string, signature: string
  ) {
    this.loading = true;
    this.successMessage = 'Payment successful! Creating your account...';
    
    const result = await this.authService.registerWithPayment(
      email,
      this.isGoogleAuth ? '' : password,
      shopName,
      'shop_owner',
      mobile,
      shopName,
      pickupAddress,
      {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        planCode: this.planCode,
        billingCycle: this.billingCycle,
        branchCount: this.branchCount
      },
      ownerName,
      gstIn
    );

    if (result.success) {
      this.successMessage = 'Account created successfully! Redirecting to dashboard...';
      setTimeout(() => this.router.navigate(['/dashboard']), 1000);
    } else {
      this.errorMessage = result.error || 'Account creation failed after payment. Please contact support.';
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.errorMessage = '';
    this.loading = true;
    
    const result = await this.authService.loginWithGoogleProvider();
    
    if (result.success) {
      if (result.isNewUser) {
        this.isGoogleAuth = true;
        this.registerForm.get('email')?.setValue(result.firebaseUser.email);
        
        // Remove password requirements since we use Google Auth
        this.registerForm.get('password')?.clearValidators();
        this.registerForm.get('password')?.updateValueAndValidity();
        this.registerForm.get('confirmPassword')?.clearValidators();
        this.registerForm.get('confirmPassword')?.updateValueAndValidity();

        this.currentStep = 2; // Jump to Shop Details
      } else {
        this.successMessage = 'Account already exists. Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      }
    } else {
      this.errorMessage = result.error || 'Google Sign-Up failed.';
    }
    
    this.loading = false;
    this.cdr.detectChanges(); // Ensure Angular updates the view after async Firebase call
  }
}
