import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(50px) scale(0.95)', opacity: 0 }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div 
      class="fixed bottom-4 right-4 z-[9999] flex flex-col justify-end pointer-events-none max-w-sm w-full"
      style="height: 400px;"
    >
      <div 
        class="relative w-full pointer-events-auto"
        (mouseenter)="isHovered = true"
        (mouseleave)="isHovered = false"
      >
        @for (toast of toasts; track toast.id; let i = $index) {
          <div
            class="absolute bottom-0 right-0 w-full transition-all duration-300 ease-out"
            [style.z-index]="getToastZIndex(toasts.length - 1 - i)"
            [style.opacity]="getToastOpacity(toasts.length - 1 - i)"
            [style.transform]="getToastTransform(toasts.length - 1 - i)"
            [style.pointer-events]="getToastOpacity(toasts.length - 1 - i) === 0 ? 'none' : 'auto'"
          >
            <div 
              @toastAnimation
              class="flex items-center justify-between w-full p-4 rounded-xl border bg-white shadow-md transition-all duration-300"
          [ngClass]="getToastBorderClass(toast.type)"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="shrink-0 mt-0.5" [ngClass]="getIconColorClass(toast.type)">
              @switch (toast.type) {
                @case ('success') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                }
                @case ('error') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                }
                @case ('warning') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                }
                @default {
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                }
              }
            </div>
            
            <div class="space-y-1">
              @if (toast.title) {
                <h3 
                  class="text-xs font-bold leading-none"
                  [ngClass]="toast.highlightTitle ? 'text-green-600' : getTitleColorClass(toast.type)"
                >
                  {{ toast.title }}
                </h3>
              }
              <p class="text-xs font-medium text-slate-500 leading-normal">{{ toast.message }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4 shrink-0">
            <!-- Action Button -->
            @if (toast.actions) {
              <button
                (click)="toast.actions.onClick(); remove(toast.id)"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap"
                [ngClass]="getActionButtonClass(toast.type, toast.actions.variant)"
              >
                {{ toast.actions.label }}
              </button>
            }

            <!-- Close Button -->
            <button
              (click)="remove(toast.id)"
              class="rounded-full p-1 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Dismiss notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 hover:text-slate-600"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
        </div>
      }
      </div>
    </div>
  `
})
export class ToastComponent {
  toasts: Toast[] = [];
  isHovered = false;

  constructor(public toastService: ToastService) {
    effect(() => {
      this.toasts = this.toastService.toasts();
    });
  }

  remove(id: string) {
    this.toastService.remove(id);
  }

  getToastZIndex(reverseIndex: number): number {
    return 100 - reverseIndex;
  }

  getToastOpacity(reverseIndex: number): number {
    if (this.isHovered) return 1;
    if (reverseIndex === 0) return 1;
    if (reverseIndex === 1) return 0.95;
    if (reverseIndex === 2) return 0.9;
    return 0; // Hide others if not hovered
  }

  getToastTransform(reverseIndex: number): string {
    if (this.isHovered) {
      // Expanded state (assume ~70px gap per toast)
      return `translateY(-${reverseIndex * 70}px) scale(1)`;
    } else {
      // Stacked state
      const yOffset = reverseIndex * -14;
      const scale = 1 - (reverseIndex * 0.05);
      return `translateY(${yOffset}px) scale(${scale})`;
    }
  }

  getToastBorderClass(type: string): string {
    switch (type) {
      case 'success':
        return 'border-green-150 bg-white/95';
      case 'error':
        return 'border-red-150 bg-white/95';
      case 'warning':
        return 'border-amber-150 bg-white/95';
      case 'info':
      case 'default':
      default:
        return 'border-slate-200 bg-white/95';
    }
  }

  getIconColorClass(type: string): string {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'info':
      case 'default':
      default: return 'text-slate-400';
    }
  }

  getTitleColorClass(type: string): string {
    switch (type) {
      case 'success': return 'text-green-700';
      case 'error': return 'text-red-700';
      case 'warning': return 'text-amber-700';
      case 'info':
      case 'default':
      default: return 'text-slate-800';
    }
  }

  getActionButtonClass(type: string, variant?: string): string {
    let base = '';
    if (type === 'success') {
      base = 'text-green-600 border-green-200 hover:bg-green-50';
    } else if (type === 'error') {
      base = 'text-red-600 border-red-200 hover:bg-red-50';
    } else if (type === 'warning') {
      base = 'text-amber-600 border-amber-200 hover:bg-amber-50';
    } else {
      base = 'text-slate-700 border-slate-200 hover:bg-slate-50';
    }
    return base;
  }
}
