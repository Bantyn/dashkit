import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-card',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-4">
      <div class="w-full max-w-[400px]">
        <!-- Header -->
        <div class="text-center mb-6">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-primary-100 text-primary-600 mb-4"
          >
            <i class="bi bi-shop text-2xl"></i>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {{ title }}
          </h1>
          <p class="text-sm text-[var(--text-muted)] mt-2" *ngIf="description">
            {{ description }}
          </p>
        </div>

        <!-- Card -->
        <div
          class="bg-white rounded-[var(--radius-xl)] shadow-sm border border-[var(--border-color)] p-6"
        >
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6 text-sm text-[var(--text-muted)]">
          {{ footerText }}
          <a
            *ngIf="footerLink"
            [routerLink]="footerLink"
            class="font-medium text-primary-600 hover:text-primary-500 hover:underline transition-colors ml-1"
          >
            {{ footerLinkText }}
          </a>
        </div>
      </div>
    </div>
  `,
})
export class AuthCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() footerText = '';
  @Input() footerLink = '';
  @Input() footerLinkText = '';
}
