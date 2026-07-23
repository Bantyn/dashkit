import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiNumberInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex items-center w-full border border-gray-250 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all bg-white shadow-sm">
      <button 
        type="button" 
        (click)="decrement()"
        [disabled]="disabled || (min !== undefined && value <= min)"
        class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200 transition-colors focus:outline-none"
      >
        <i class="bi bi-dash text-lg"></i>
      </button>
      
      <input 
        type="number"
        [value]="value"
        (input)="onInputChange($event)"
        (blur)="onTouched()"
        [disabled]="disabled"
        [min]="min"
        [max]="max"
        class="flex-1 w-full h-10 text-center text-sm font-semibold text-gray-900 bg-transparent border-none focus:ring-0 px-2 outline-none appearance-none"
      />
      
      <button 
        type="button" 
        (click)="increment()"
        [disabled]="disabled || (max !== undefined && value >= max)"
        class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-200 transition-colors focus:outline-none"
      >
        <i class="bi bi-plus text-lg"></i>
      </button>
    </div>
  `,
  styles: [`
    /* Hide number input spinners */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
  `]
})
export class UiNumberInputComponent implements ControlValueAccessor {
  @Input() min?: number;
  @Input() max?: number;
  @Input() step: number = 1;

  value: number = 0;
  disabled: boolean = false;

  onChange = (val: number) => {};
  onTouched = () => {};

  writeValue(val: number): void {
    this.value = val !== undefined && val !== null ? val : (this.min !== undefined ? this.min : 0);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  increment() {
    if (this.disabled) return;
    const newVal = (this.value || 0) + this.step;
    if (this.max !== undefined && newVal > this.max) return;
    this.value = newVal;
    this.onChange(this.value);
  }

  decrement() {
    if (this.disabled) return;
    const newVal = (this.value || 0) - this.step;
    if (this.min !== undefined && newVal < this.min) return;
    this.value = newVal;
    this.onChange(this.value);
  }

  onInputChange(event: any) {
    let val = parseFloat(event.target.value);
    if (isNaN(val)) {
      val = this.min !== undefined ? this.min : 0;
    } else {
      if (this.min !== undefined && val < this.min) val = this.min;
      if (this.max !== undefined && val > this.max) val = this.max;
    }
    this.value = val;
    event.target.value = val;
    this.onChange(this.value);
  }
}
