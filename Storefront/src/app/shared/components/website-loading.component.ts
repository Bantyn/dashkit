import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-website-loading',
  standalone: true,
  imports: [CommonModule],
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
        <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="mt-4 text-center">
          <h3 class="text-sm font-medium text-gray-900 animate-pulse">
            {{ text || 'Loading...' }}
          </h3>
          <p class="mt-1 text-xs text-gray-500" *ngIf="subtext">{{ subtext }}</p>
        </div>
      </div>
    </div>
  `
})
export class WebsiteLoadingComponent {
  @Input() text: string = '';
  @Input() subtext: string = '';
  @Input() fullScreen: boolean = true;
}
