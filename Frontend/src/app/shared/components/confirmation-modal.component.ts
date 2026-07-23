import { Component, inject, signal, effect, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success' | 'question' | 'primary';

export interface ConfirmationConfig {
  title: string;
  description: string;
  type?: ConfirmationType;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  showIcon?: boolean;
  allowEscape?: boolean;
  allowOutsideClick?: boolean;
  
  // Custom checks / extra inputs
  requireText?: string; // User must type this word (e.g. "DELETE") to enable confirm
  requireCheckbox?: boolean; // User must check this box to confirm
  checkboxLabel?: string; // Label for checkbox
  
  showInput?: boolean; // Show general input (e.g. for prompt reasons)
  inputPlaceholder?: string;
  inputType?: string;
  inputRequired?: boolean;
  defaultValue?: string;

  // Custom height/width
  customWidthClass?: string; // Default: max-w-md

  // Async Confirmation
  onConfirm?: () => Promise<any> | Observable<any> | void;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  private activeConfirm = signal<{ config: ConfirmationConfig; resolve: (val: any) => void; reject: (err: any) => void } | null>(null);
  
  // Expose as readonly
  active = this.activeConfirm.asReadonly();

  confirm(config: ConfirmationConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      this.activeConfirm.set({
        config: {
          type: 'primary',
          primaryButtonText: 'Confirm',
          secondaryButtonText: 'Cancel',
          showIcon: true,
          allowEscape: true,
          allowOutsideClick: true,
          customWidthClass: 'max-w-md',
          ...config,
        },
        resolve,
        reject,
      });
    });
  }

  confirm$(config: ConfirmationConfig): Observable<any> {
    const subject = new Subject<any>();
    this.confirm(config).then(
      (res) => {
        subject.next(res);
        subject.complete();
      },
      (err) => {
        subject.error(err);
      }
    );
    return subject.asObservable();
  }

  resolve(value: any) {
    const current = this.activeConfirm();
    if (current) {
      current.resolve(value);
      this.activeConfirm.set(null);
    }
  }

  reject(error: any) {
    const current = this.activeConfirm();
    if (current) {
      current.reject(error);
      this.activeConfirm.set(null);
    }
  }

  updateLoading(isLoading: boolean) {
    const current = this.activeConfirm();
    if (current) {
      this.activeConfirm.set({
        ...current,
        config: {
          ...current.config,
          isLoading,
        } as ConfirmationConfig & { isLoading?: boolean },
      });
    }
  }
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="state"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
      [class.opacity-0]="!animateVisible"
      [class.opacity-100]="animateVisible"
      (click)="onBackdropClick()"
    >
      <!-- Modal Card -->
      <div
        #modalContainer
        (click)="$event.stopPropagation()"
        class="relative w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col items-center text-center transform transition-all duration-300"
        [class.scale-95]="!animateVisible"
        [class.scale-100]="animateVisible"
        [class.opacity-0]="!animateVisible"
        [class.opacity-100]="animateVisible"
        [ngClass]="state.config.customWidthClass || 'max-w-md'"
      >
        <!-- Icon Container -->
        <div
          *ngIf="state.config.showIcon"
          class="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-300"
          [ngClass]="getIconContainerClass(state.config.type)"
        >
          <!-- Dynamic Icons -->
          @switch (state.config.type) {
            @case ('danger') {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            @case ('warning') {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            @case ('success') {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            @case ('info') {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            @case ('question') {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            @default {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          }
        </div>

        <!-- Title -->
        <h2 class="text-xl font-bold text-slate-900 mb-2 leading-tight">
          {{ state.config.title }}
        </h2>

        <!-- Description -->
        <p class="text-sm text-slate-500 mb-6 leading-relaxed" [innerHTML]="state.config.description"></p>

        <!-- Optional Prompt Input -->
        <div *ngIf="state.config.showInput" class="w-full mb-5 text-left">
          <input
            #promptInput
            [type]="state.config.inputType || 'text'"
            [placeholder]="state.config.inputPlaceholder || 'Type reason/details...'"
            [(ngModel)]="inputValue"
            class="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            [disabled]="isLoading"
          />
        </div>

        <!-- Optional Checkbox Confirmation -->
        <div *ngIf="state.config.requireCheckbox" class="w-full mb-5 flex items-start gap-2.5 text-left">
          <input
            id="modal-checkbox"
            type="checkbox"
            [(ngModel)]="checkboxChecked"
            class="mt-0.5 w-4.5 h-4.5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            [disabled]="isLoading"
          />
          <label for="modal-checkbox" class="text-xs font-semibold text-slate-600 leading-normal select-none">
            {{ state.config.checkboxLabel || 'I understand this action cannot be undone.' }}
          </label>
        </div>

        <!-- Optional Text Confirmation -->
        <div *ngIf="state.config.requireText" class="w-full mb-5 text-left">
          <p class="text-xs text-slate-500 mb-2">
            Please type <span class="font-bold text-slate-800 select-none">"{{ state.config.requireText }}"</span> to confirm.
          </p>
          <input
            type="text"
            [(ngModel)]="textConfirmationValue"
            class="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Type verification word..."
            [disabled]="isLoading"
          />
        </div>

        <!-- Action Buttons -->
        <div class="w-full flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            (click)="cancel()"
            [disabled]="isLoading"
            class="w-full sm:flex-1 py-2.5 px-4 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 border border-slate-200"
          >
            {{ state.config.secondaryButtonText }}
          </button>
          
          <button
            type="button"
            (click)="confirm()"
            [disabled]="isConfirmDisabled()"
            [ngClass]="getConfirmButtonClass(state.config.type)"
            class="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            <!-- Loading Spinner -->
            <svg *ngIf="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ state.config.primaryButtonText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ConfirmationModalComponent {
  private service = inject(ConfirmationService);

  state: { config: ConfirmationConfig; resolve: (val: any) => void; reject: (err: any) => void } | null = null;

  animateVisible = false;
  isLoading = false;
  inputValue = '';
  checkboxChecked = false;
  textConfirmationValue = '';

  @ViewChild('promptInput') promptInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('modalContainer') modalContainerEl?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const active = this.service.active();
      if (active) {
        this.state = active as any;
        this.inputValue = active.config.defaultValue || '';
        this.checkboxChecked = false;
        this.textConfirmationValue = '';
        this.isLoading = (active.config as any).isLoading || false;
        
        // Trigger intro animation
        setTimeout(() => {
          this.animateVisible = true;
          // Autofocus prompt input if visible
          setTimeout(() => {
            if (this.promptInputEl?.nativeElement) {
              this.promptInputEl.nativeElement.focus();
            }
          }, 100);
        }, 50);
      } else {
        this.animateVisible = false;
        setTimeout(() => {
          this.state = null;
        }, 300);
      }
    });
  }

  getIconContainerClass(type?: ConfirmationType): string {
    switch (type) {
      case 'danger':
        return 'bg-red-50 text-red-600 border border-red-100';
      case 'warning':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'info':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'question':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      default:
        return 'bg-primary-50 text-primary-600 border border-primary-100';
    }
  }

  getConfirmButtonClass(type?: ConfirmationType): string {
    switch (type) {
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500';
      case 'success':
        return 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500';
      case 'info':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      case 'question':
        return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
      default:
        return 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500';
    }
  }

  isConfirmDisabled(): boolean {
    if (this.isLoading) return true;
    if (this.state?.config.requireCheckbox && !this.checkboxChecked) return true;
    if (this.state?.config.requireText && this.textConfirmationValue !== this.state.config.requireText) return true;
    if (this.state?.config.showInput && this.state.config.inputRequired && !this.inputValue.trim()) return true;
    return false;
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapePress(event: Event) {
    if (this.state?.config.allowEscape && !this.isLoading) {
      this.cancel();
    }
  }

  onBackdropClick() {
    if (this.state?.config.allowOutsideClick && !this.isLoading) {
      this.cancel();
    }
  }

  async confirm() {
    if (this.isConfirmDisabled()) return;

    const onConfirmCallback = this.state?.config.onConfirm;
    if (onConfirmCallback) {
      this.isLoading = true;
      this.service.updateLoading(true);
      try {
        const result = onConfirmCallback();
        if (result instanceof Promise) {
          await result;
        } else if (result && typeof (result as any).subscribe === 'function') {
          await new Promise<void>((res, rej) => {
            (result as any).subscribe({
              next: () => res(),
              error: (err: any) => rej(err),
            });
          });
        }
      } catch (error) {
        console.error('Async confirmation failed:', error);
        this.isLoading = false;
        this.service.updateLoading(false);
        return; // Don't close on error
      }
    }

    // Resolve with input value if input is shown, or true if regular confirmation
    const finalValue = this.state?.config.showInput ? this.inputValue : true;
    this.service.resolve(finalValue);
  }

  cancel() {
    if (this.isLoading) return;
    this.service.resolve(false);
  }
}
