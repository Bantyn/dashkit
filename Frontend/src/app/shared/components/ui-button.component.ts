import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [ngClass]="getButtonClasses()"
      (click)="onClick.emit($event)"
    >
      <ng-container *ngIf="loading">
        <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>{{ loadingText }}</span>
      </ng-container>
      <ng-container *ngIf="!loading">
        <ng-content></ng-content>
      </ng-container>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      :host.full-width {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class UiButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingText = 'Please wait';
  @Input() fullWidth = false;

  @Output() onClick = new EventEmitter<Event>();

  @HostBinding('class.full-width') get isFullWidth() {
    return this.fullWidth;
  }

  getButtonClasses(): string {
    const baseClasses =
      'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white';

    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus-visible:ring-primary-600',
      secondary:
        'bg-[var(--color-gray-100)] text-[var(--text-primary)] hover:bg-[var(--color-gray-200)] focus-visible:ring-[var(--color-gray-400)]',
      outline:
        'border border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)]',
      ghost:
        'hover:bg-[var(--bg-hover)] text-[var(--text-primary)] hover:text-[var(--text-primary)]',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-[44px] px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${variants[this.variant]} ${sizes[this.size]} ${widthClass}`;
  }
}
