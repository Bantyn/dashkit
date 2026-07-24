import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiLoadingComponent } from '../shared/components/ui-loading.component';

@Component({
  selector: 'app-website-loading',
  standalone: true,
  imports: [CommonModule, UiLoadingComponent],
  template: `
    <div
      [class]="
        fullScreen
          ? 'fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm'
          : 'relative w-full h-full min-h-[200px]'
      "
      class="flex flex-col items-center justify-center transition-opacity duration-300"
    >
      <div class="relative flex flex-col items-center">
        <!-- Loader -->
        <app-ui-loading size="lg"></app-ui-loading>

        <!-- Text -->
        <div class="mt-6 text-center">
          <h3 class="text-lg font-medium text-gray-900 animate-pulse">
            {{ text || 'Loading...' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500" *ngIf="subtext">{{ subtext }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class WebsiteLoadingComponent {
  @Input() text: string = '';
  @Input() subtext: string = '';
  @Input() fullScreen: boolean = true;
}
