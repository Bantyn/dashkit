import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
      (click)="close()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl border border-slate-100 p-8 flex flex-col items-center transform transition-all duration-300"
      >
        <!-- Close Button -->
        <button
          type="button"
          (click)="close()"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Icon / Header -->
        <div class="flex justify-center mb-6">
          <div *ngIf="state !== 'success'" class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <i class="bi bi-envelope-open text-primary-600 text-2xl"></i>
          </div>
          <div *ngIf="state === 'success'" class="w-16 h-16 bg-green-500 text-white flex items-center justify-center rounded-full animate-pop-in shadow-lg shadow-green-200">
            <i class="bi bi-check-lg text-3xl"></i>
          </div>
        </div>

        <!-- Title -->
        <h2 class="text-2xl font-bold text-slate-900 mb-2 text-center">
          {{ state === 'success' ? 'Verification Successful!' : 'Enter Verification Code' }}
        </h2>

        <!-- Description -->
        <p *ngIf="state !== 'success'" class="text-sm text-slate-500 text-center mb-8 max-w-xs leading-relaxed">
          We've sent a 6-digit verification code to <span class="font-semibold text-slate-700">{{ email }}</span>.
        </p>
        <p *ngIf="state === 'success'" class="text-sm text-green-600 text-center mb-8 font-semibold animate-pop-in">
          OTP Verified!
        </p>

        <!-- OTP Input Area -->
        <div *ngIf="state !== 'success'" class="w-full space-y-4">
          <div class="flex items-center justify-center gap-2 md:gap-3" [class.animate-shake]="state === 'error'">
            <div *ngFor="let idx of [0,1,2,3,4,5]" 
                 class="w-12 h-14 rounded-xl ring-2 transition-all duration-300 overflow-hidden shadow-sm"
                 [ngClass]="{
                   'ring-red-400 bg-red-50': state === 'error',
                   'ring-slate-300 focus-within:ring-primary-600 focus-within:border-transparent focus-within:ring-2': state !== 'error'
                 }">
              <input
                [id]="'otp-input-' + idx"
                type="text"
                inputMode="numeric"
                maxLength="1"
                class="w-full h-full text-center text-2xl font-extrabold outline-none bg-slate-50 focus:bg-white text-slate-800 transition-colors"
                (input)="onInput($event, idx)"
                (keydown)="onKeyDown($event, idx)"
                (paste)="onPaste($event, idx)"
                [disabled]="verifying"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="text-xs text-red-500 text-center font-semibold bg-red-50 py-2 px-4 rounded-lg border border-red-100">
            {{ errorMessage }}
          </div>
          <!-- Success Alert -->
          <div *ngIf="successMessage" class="text-xs text-green-600 text-center font-semibold bg-green-50 py-2 px-4 rounded-lg border border-green-100">
            {{ successMessage }}
          </div>

          <!-- Resend Section -->
          <div class="pt-4 text-center text-sm">
            <span class="text-slate-500">Didn't get a code? </span>
            <span *ngIf="isResendDisabled" class="text-slate-700 font-semibold">
              Resend in {{ otpCountdown }}
            </span>
            <button
              *ngIf="!isResendDisabled"
              type="button"
              (click)="handleResend()"
              [disabled]="sendingResend"
              class="font-bold text-primary-600 hover:text-primary-700 hover:underline bg-transparent border-0 cursor-pointer"
            >
              {{ sendingResend ? 'Sending...' : 'Click to resend' }}
            </button>
          </div>
        </div>

        <!-- Success Animation Placeholder -->
        <div *ngIf="state === 'success'" class="h-28 flex items-center justify-center">
          <div class="text-slate-400 text-xs italic">Returning to setup...</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-shake {
      animation: shake 0.3s ease-in-out;
    }
    @keyframes pop-in {
      0% { transform: scale(0.5); opacity: 0; }
      70% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-pop-in {
      animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `]
})
export class OtpModalComponent implements OnInit, OnDestroy {
  @Input() email = '';
  @Input() isOpen = false;
  @Output() onVerified = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  state: 'idle' | 'success' | 'error' = 'idle';
  verifying = false;
  errorMessage = '';
  successMessage = '';

  countdown = 300;
  isResendDisabled = true;
  countdownTimer: any;
  otpCountdown = '05:00';
  sendingResend = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.isOpen) {
      this.initModal();
    }
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.initModal();
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  initModal() {
    this.state = 'idle';
    this.errorMessage = '';
    this.successMessage = '';
    this.startCountdown();
    // Auto focus first element
    setTimeout(() => {
      const firstInput = document.getElementById('otp-input-0') as HTMLInputElement;
      firstInput?.focus();
    }, 100);
  }

  clearTimer() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  startCountdown() {
    this.clearTimer();
    this.countdown = 300;
    this.isResendDisabled = true;
    
    const updateDisplay = () => {
      const minutes = Math.floor(this.countdown / 60);
      const seconds = this.countdown % 60;
      this.otpCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    updateDisplay();

    this.countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearTimer();
        this.otpCountdown = '00:00';
        this.isResendDisabled = false;
      } else {
        updateDisplay();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val.match(/^[0-9]$/)) {
      if (index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else {
      input.value = '';
    }
    this.checkAndVerify();
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  onPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').trim().slice(0, 6 - index) || '';
    const digits = pastedData.split('').filter(char => /^[0-9]$/.test(char));
    
    digits.forEach((digit, i) => {
      const targetIndex = index + i;
      const input = document.getElementById(`otp-input-${targetIndex}`) as HTMLInputElement;
      if (input) {
        input.value = digit;
      }
    });

    const nextFocusIndex = Math.min(index + digits.length, 5);
    const nextInput = document.getElementById(`otp-input-${nextFocusIndex}`) as HTMLInputElement;
    nextInput?.focus();

    setTimeout(() => this.checkAndVerify(), 0);
  }

  checkAndVerify() {
    let code = '';
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`otp-input-${i}`) as HTMLInputElement;
      if (input) {
        code += input.value;
      }
    }
    if (code.length < 6) {
      this.state = 'idle';
      return;
    }

    this.verifyOTP(code);
  }

  async verifyOTP(code: string) {
    this.verifying = true;
    this.state = 'idle';
    this.errorMessage = '';
    this.cdr.detectChanges();
    try {
      await this.authService.verifyRegistrationEmailOtp(this.email, code);
      this.state = 'success';
      this.verifying = false;
      this.clearTimer();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.onVerified.emit();
      }, 1500);
    } catch (err: any) {
      this.verifying = false;
      this.state = 'error';
      this.errorMessage = err.message || 'Incorrect verification code. Please try again.';
      this.cdr.detectChanges();
      
      // Reset state and clear inputs after a short delay
      setTimeout(() => {
        this.state = 'idle';
        for (let i = 0; i < 6; i++) {
          const input = document.getElementById(`otp-input-${i}`) as HTMLInputElement;
          if (input) {
            input.value = '';
          }
        }
        const firstInput = document.getElementById('otp-input-0') as HTMLInputElement;
        firstInput?.focus();
        this.cdr.detectChanges();
      }, 1500);
    }
  }

  async handleResend() {
    if (this.isResendDisabled || this.sendingResend) return;
    this.sendingResend = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
    try {
      const res = await this.authService.sendRegistrationEmailOtp(this.email);
      this.startCountdown();
      if (res?.data?.otp) {
        console.log(`[Dev OTP] Verification code: ${res.data.otp}`);
      }
      this.successMessage = 'Verification code has been resent to your email.';
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 4000);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to resend verification code.';
      this.cdr.detectChanges();
    } finally {
      this.sendingResend = false;
      this.cdr.detectChanges();
    }
  }

  close() {
    if (this.state === 'success') return;
    this.clearTimer();
    this.onClose.emit();
  }
}
