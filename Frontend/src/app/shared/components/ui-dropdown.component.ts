import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate, state } from '@angular/animations';

export interface DropdownOption {
  value: any;
  label: string;
  icon?: string;
  color?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-ui-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDropdownComponent),
      multi: true,
    },
  ],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scaleY(0)' }),
        animate(
          '200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          style({ opacity: 1, transform: 'scaleY(1)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          style({ opacity: 0, transform: 'scaleY(0)' }),
        ),
      ]),
    ]),
  ],
  template: `
    <div class="w-full relative" #dropdownRef>
      <button
        type="button"
        (click)="toggleOpen()"
        [disabled]="disabled"
        class="w-full flex items-center justify-between h-10 px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out border rounded-lg bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1"
        [class.bg-gray-50]="isOpen"
        [class.text-gray-900]="isOpen"
        [class.border-gray-400]="isOpen"
        aria-expanded="isOpen"
        aria-haspopup="true"
      >
        <span class="flex items-center gap-2">
          <ng-container *ngIf="selectedOption as opt; else placeholderTemplate">
            <lucide-icon
              *ngIf="opt.icon"
              [name]="opt.icon"
              class="w-4 h-4"
              [style.color]="opt.color"
            ></lucide-icon>
            {{ opt.label }}
          </ng-container>
          <ng-template #placeholderTemplate>
            {{ placeholder }}
          </ng-template>
        </span>
        <lucide-icon
          name="chevron-down"
          class="w-4 h-4 transition-transform duration-200"
          [style.transform]="isOpen ? 'rotate(180deg)' : 'rotate(0)'"
        ></lucide-icon>
      </button>

      <div
        *ngIf="isOpen"
        [@dropdownAnimation]
        class="absolute left-0 right-0 z-50 p-1 rounded-lg border border-gray-200 bg-white shadow-xl shadow-black/5 overflow-y-auto custom-scrollbar max-h-60"
        [class.bottom-full]="openUpward"
        [class.mb-2]="openUpward"
        [class.top-full]="!openUpward"
        [class.mt-2]="!openUpward"
        [style.transformOrigin]="openUpward ? 'bottom' : 'top'"
      >
        <div class="py-1 relative">
          <!-- Hover Highlight -->
          <div
            *ngIf="hoveredIndex !== null"
            class="absolute inset-x-1 bg-gray-100 rounded-md transition-all duration-200 ease-out"
            [style.top.px]="hoveredIndex * 40 + 4"
            [style.height.px]="40"
          ></div>

          <button
            *ngFor="let option of options; let i = index; trackBy: trackByOption"
            type="button"
            (click)="selectOption(option)"
            (mouseenter)="hoveredIndex = i"
            (mouseleave)="hoveredIndex = null"
            class="relative flex w-full items-center px-4 py-2.5 text-sm rounded-md transition-colors duration-150 focus:outline-none z-10"
            [class.text-gray-900]="value === option.value || hoveredIndex === i"
            [class.text-gray-600]="value !== option.value && hoveredIndex !== i"
          >
            <lucide-icon
              *ngIf="option.icon"
              [name]="option.icon"
              class="w-4 h-4 mr-2"
              [style.color]="option.color"
            ></lucide-icon>
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
      }
    `,
  ],
})
export class UiDropdownComponent implements ControlValueAccessor {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = 'Select an option';
  @Input() disabled = false;
  @Input()
  set value(value: any) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  @Output() onSelect = new EventEmitter<any>();

  private _value: any = null;
  isOpen = false;
  hoveredIndex: number | null = null;
  openUpward = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(private elementRef: ElementRef) {}

  trackByOption(index: number, option: DropdownOption) {
    return option.value;
  }

  get selectedOption() {
    return this.options.find((o) => o.value === this.value);
  }

  toggleOpen() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        // Run check position
        const rect = this.elementRef.nativeElement.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If there's less than 200px space below, open upward
        this.openUpward = spaceBelow < 200 && rect.top > 200;
      }
    }
  }

  selectOption(option: DropdownOption) {
    this._value = option.value;
    this.onChange(this._value);
    this.onSelect.emit(this._value);
    this.isOpen = false;
    this.onTouched();
  }

  writeValue(value: any): void {
    this._value = value;
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

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('keydown.escape')
  onEscape() {
    this.isOpen = false;
  }
}
