import { Component, Input, forwardRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-ui-date-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDatePickerComponent),
      multi: true,
    },
    DatePipe,
  ],
  template: `
    <div class="space-y-2 relative" #container>
      <label *ngIf="label" class="text-sm font-medium leading-none text-[var(--text-primary)]">
        {{ label }}
      </label>

      <button
        type="button"
        (click)="togglePopover()"
        [disabled]="disabled"
        class="relative flex items-center h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border-color)] bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
        [class.border-red-500]="error"
        [class.opacity-50]="disabled"
        [class.cursor-not-allowed]="disabled"
      >
        <lucide-icon name="calendar" class="mr-2 h-4 w-4 text-gray-500 flex-shrink-0"></lucide-icon>
        <span
          class="flex-1 truncate text-left font-normal"
          [ngClass]="value ? 'text-gray-900' : 'text-gray-400'"
        >
          {{ displayValue || placeholder }}
        </span>
      </button>

      <!-- Calendar Popover -->
      <div
        *ngIf="isOpen"
        class="absolute top-[calc(100%+8px)] left-0 z-[100] w-[280px] rounded-md border border-[var(--border-color)] bg-white p-3 text-[var(--text-primary)] shadow-md outline-none"
      >
        <div class="flex justify-between items-center space-y-4 pt-1 relative mb-4 mt-2 px-1">
          <button
            type="button"
            (click)="changeMonth(-1)"
            class="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-200 rounded-md flex items-center justify-center cursor-pointer disabled:opacity-30"
          >
            <lucide-icon name="chevron-left" class="h-4 w-4"></lucide-icon>
          </button>
          <div class="text-sm font-medium">{{ currentMonthName }} {{ currentYear }}</div>
          <button
            type="button"
            (click)="changeMonth(1)"
            class="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-200 rounded-md flex items-center justify-center cursor-pointer disabled:opacity-30"
          >
            <lucide-icon name="chevron-right" class="h-4 w-4"></lucide-icon>
          </button>
        </div>

        <table class="w-full border-collapse space-y-1">
          <thead class="flex w-full">
            <tr class="flex w-full">
              <th
                *ngFor="let day of weekDays"
                class="text-gray-400 rounded-md w-9 font-normal text-[0.8rem] text-center p-0 flex-1"
              >
                {{ day }}
              </th>
            </tr>
          </thead>
          <tbody class="flex w-full mt-2 flex-col space-y-1">
            <tr *ngFor="let week of calendarDays" class="flex w-full justify-between items-center">
              <td
                *ngFor="let day of week"
                class="p-0 relative text-center text-sm focus-within:relative focus-within:z-20 h-9 w-9 flex items-center justify-center"
              >
                <button
                  type="button"
                  *ngIf="day"
                  (click)="selectDate(day)"
                  class="h-9 w-9 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none hover:bg-gray-100 hover:text-gray-900"
                  [ngClass]="{
                    'bg-primary-600 text-white hover:bg-primary-600 hover:text-white':
                      isSelected(day),
                    'text-gray-900': !isSelected(day),
                  }"
                >
                  {{ day }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p *ngIf="error" class="text-xs font-medium text-[var(--color-danger)]">
        {{ error }}
      </p>
    </div>
  `,
})
export class UiDatePickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Pick a date';
  @Input() error = '';

  value = '';
  disabled = false;
  isOpen = false;

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(
    private datePipe: DatePipe,
    private eRef: ElementRef,
  ) {}

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        this.isOpen = false;
        this.onTouched();
      }
    }
  }

  get displayValue(): string {
    if (!this.value) return '';
    const dateObj = new Date(this.value);
    if (isNaN(dateObj.getTime())) return '';
    return this.datePipe.transform(dateObj, 'mediumDate') || '';
  }

  get currentMonthName(): string {
    const d = new Date(this.currentYear, this.currentMonth, 1);
    return this.datePipe.transform(d, 'MMMM') || '';
  }

  get calendarDays(): (number | null)[][] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    let days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const weeks: (number | null)[][] = [];
    while (days.length > 0) {
      let week = days.splice(0, 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return weeks;
  }

  togglePopover() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen && this.value) {
        let d = new Date(this.value);
        if (!isNaN(d.getTime())) {
          this.currentMonth = d.getMonth();
          this.currentYear = d.getFullYear();
        }
      } else if (this.isOpen && !this.value) {
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
      }
    }
  }

  changeMonth(delta: number) {
    this.currentMonth += delta;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
  }

  selectDate(day: number) {
    let d = new Date(this.currentYear, this.currentMonth, day);
    const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
    this.value = isoStr;
    this.onChange(isoStr);
    this.isOpen = false;
  }

  isSelected(day: number): boolean {
    if (!this.value) return false;
    let d = new Date(this.value);
    if (isNaN(d.getTime())) return false;
    return (
      d.getFullYear() === this.currentYear &&
      d.getMonth() === this.currentMonth &&
      d.getDate() === day
    );
  }

  writeValue(value: string): void {
    if (value) {
      this.value = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
    } else {
      this.value = '';
    }
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
}
