import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  template: `
    <div 
      class="select-none cursor-pointer inline-flex items-center justify-center transition-all duration-300" 
      (click)="toggle()"
      [attr.title]="checked ? 'Checked' : 'Unchecked'"
    >
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 40 40" fill="none">
        <path
          d="M 2.45 24.95 V 33.95 C 2.45 35.9382 4.0618 37.55 6.05 37.55 H 33.95 C 35.9382 37.55 37.55 35.9382 37.55 33.95 V 6.05 C 37.55 4.0618 35.9382 2.45 33.95 2.45 H 6.05 C 4.0618 2.45 2.45 4.0618 2.45 6.05 V 22.0617 C 2.45 23.0443 2.8516 23.9841 3.5616 24.6633 L 10.0451 30.8649 C 11.5404 32.2952 13.9308 32.1735 15.2731 30.5988 L 36.2 6.05"
          [attr.stroke]="checked ? color : '#D1D5DB'"
          stroke-linecap="round"
          stroke-width="3"
          class="transition-all duration-500 ease-in-out"
          [style.stroke-dasharray]="checked ? '150' : '132'"
          [style.stroke-dashoffset]="checked ? '-134' : '0'"
        />
      </svg>
    </div>
  `,
  styles: [`
    path {
      transition: stroke 0.3s ease, stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() size = 20;
  @Input() color = 'currentColor'; // Will inherit from text color or parent
  
  @Input() 
  set checked(val: boolean) {
    this._checked = val;
  }
  get checked(): boolean {
    return this._checked;
  }
  @Output() checkedChange = new EventEmitter<boolean>();

  private _checked = false;
  disabled = false;

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle() {
    if (this.disabled) return;
    this._checked = !this._checked;
    this.checkedChange.emit(this._checked);
    this.onChange(this._checked);
    this.onTouched();
  }

  // ControlValueAccessor methods
  writeValue(value: boolean): void {
    this._checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
