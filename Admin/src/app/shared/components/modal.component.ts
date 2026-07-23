import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" 
         class="fixed inset-0 z-[100] overflow-y-auto" 
         role="dialog" 
         aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm transition-opacity" 
           (click)="closeOnBackdrop($event)"></div>

      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-lg transition-all sm:my-8 sm:w-full sm:max-w-lg duration-300 scale-100"
             [ngClass]="{'scale-95 opacity-0': !isOpen, 'scale-100 opacity-100': isOpen}">
          
          <!-- Header -->
          <div class="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button (click)="close()" class="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="bg-white px-6 py-5">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          <div *ngIf="showFooter" class="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
            <button type="button" 
                    [disabled]="confirmDisabled"
                    [class]="'inline-flex justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ' + confirmBtnClass"
                    (click)="confirm()">
              {{ confirmLabel }}
            </button>
            <button type="button" 
                    class="inline-flex justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-200"
                    (click)="close()">
              {{ cancelLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Modal Title';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmBtnClass = 'bg-primary-600 hover:bg-primary-700';
  @Input() showFooter = true;
  @Input() closeOnBackdropClick = true;
  @Input() confirmDisabled = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  close() {
    this.isOpen = false;
    this.closed.emit();
  }

  confirm() {
    this.confirmed.emit();
  }

  closeOnBackdrop(event: MouseEvent) {
    if (this.closeOnBackdropClick) {
      this.close();
    }
  }
}
