import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full">
      <select
        [ngModel]="value"
        (ngModelChange)="onSelect($event)"
        class="w-full bg-white border border-gray-200 text-gray-900 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-black appearance-none cursor-pointer pr-8"
      >
        <option *ngFor="let opt of options" [value]="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <i class="bi bi-chevron-down text-[10px] text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
    </div>
  `
})
export class UiDropdownComponent implements ControlValueAccessor {
  @Input() options: { value: string; label: string }[] = [];
  @Input() placeholder = 'Select';

  value: any = '';
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onSelect(val: any) {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
}
