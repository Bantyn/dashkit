import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class]="className">
      <div
        class="rounded-full border-2 border-gray-200 border-t-primary-700 animate-spin"
        [ngClass]="spinnerSizes[size]"
      ></div>
    </div>
  `,
})
export class UiLoadingComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() className: string = '';

  spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10 border-[3px]',
  };
}
