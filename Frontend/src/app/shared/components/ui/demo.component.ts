import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxComponent } from './checkbox.component';

@Component({
  selector: 'app-checkbox-preview',
  standalone: true,
  imports: [CommonModule, CheckboxComponent],
  template: `
    <div class="flex flex-col gap-4 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h3 class="text-sm font-bold text-gray-900 mb-2">Animated Checkbox Preview</h3>
      <div class="flex gap-6 items-end">
        <app-checkbox [(checked)]="states[0]" [size]="20" class="text-green-500"></app-checkbox>
        <app-checkbox
          [(checked)]="states[1]"
          [size]="24"
          color="#3b82f6"
        ></app-checkbox>
        <app-checkbox
          [(checked)]="states[2]"
          [size]="28"
          color="#facc15"
        ></app-checkbox>
        <app-checkbox
          [(checked)]="states[3]"
          [size]="32"
          color="#ef4444"
        ></app-checkbox>
      </div>
      <div class="mt-4 text-xs text-gray-500 font-medium">
        Current States: {{ states | json }}
      </div>
    </div>
  `
})
export class CheckBoxPreviewComponent {
  states = [false, false, false, false];
}
