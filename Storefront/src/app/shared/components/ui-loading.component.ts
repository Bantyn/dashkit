import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="sizeClass" class="border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
  `
})
export class UiLoadingComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get sizeClass(): string {
    switch (this.size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-10 h-10';
      case 'md':
      default: return 'w-6 h-6';
    }
  }
}
