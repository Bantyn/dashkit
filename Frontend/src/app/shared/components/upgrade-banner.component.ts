import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upgrade-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto w-full flex items-center justify-center absolute" [ngClass]="className">
      <div 
        class="relative transform transition-all duration-500 ease-out"
        [class.opacity-0]="!isVisible"
        [class.-translate-y-4]="!isVisible"
        [class.opacity-100]="isVisible"
        [class.translate-y-0]="isVisible"
      >
        <!-- Gear 1 -->
        <div 
          class="pointer-events-none absolute left-[4px] top-[2px] transition-all duration-300 z-10"
          [class.opacity-0]="!isHovered"
          [class.-translate-x-3]="isHovered"
          [class.-translate-y-3]="isHovered"
          [class.opacity-100]="isHovered"
          [class.translate-x-0]="!isHovered"
          [class.rotate-180]="isHovered"
        >
          <svg class="text-[#2563EB]" height="20" stroke-linejoin="round" viewBox="0 0 16 16" width="20">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.49999 0H6.49999L6.22628 1.45975C6.1916 1.64472 6.05544 1.79299 5.87755 1.85441C5.6298 1.93996 5.38883 2.04007 5.15568 2.15371C4.98644 2.2362 4.78522 2.22767 4.62984 2.12136L3.40379 1.28249L1.28247 3.40381L2.12135 4.62986C2.22766 4.78524 2.23619 4.98646 2.1537 5.15569C2.04005 5.38885 1.93995 5.62981 1.8544 5.87756C1.79297 6.05545 1.6447 6.19162 1.45973 6.2263L0 6.5V9.5L1.45973 9.7737C1.6447 9.80838 1.79297 9.94455 1.8544 10.1224C1.93995 10.3702 2.04006 10.6112 2.1537 10.8443C2.23619 11.0136 2.22767 11.2148 2.12136 11.3702L1.28249 12.5962L3.40381 14.7175L4.62985 13.8786C4.78523 13.7723 4.98645 13.7638 5.15569 13.8463C5.38884 13.9599 5.6298 14.06 5.87755 14.1456C6.05544 14.207 6.1916 14.3553 6.22628 14.5403L6.49999 16H9.49999L9.77369 14.5403C9.80837 14.3553 9.94454 14.207 10.1224 14.1456C10.3702 14.06 10.6111 13.9599 10.8443 13.8463C11.0135 13.7638 11.2147 13.7723 11.3701 13.8786L12.5962 14.7175L14.7175 12.5962L13.8786 11.3701C13.7723 11.2148 13.7638 11.0135 13.8463 10.8443C13.9599 10.6112 14.06 10.3702 14.1456 10.1224C14.207 9.94455 14.3553 9.80839 14.5402 9.7737L16 9.5V6.5L14.5402 6.2263C14.3553 6.19161 14.207 6.05545 14.1456 5.87756C14.06 5.62981 13.9599 5.38885 13.8463 5.1557C13.7638 4.98647 13.7723 4.78525 13.8786 4.62987L14.7175 3.40381L12.5962 1.28249L11.3701 2.12137C11.2148 2.22768 11.0135 2.2362 10.8443 2.15371C10.6111 2.04007 10.3702 1.93996 10.1224 1.85441C9.94454 1.79299 9.80837 1.64472 9.77369 1.45974L9.49999 0ZM8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z" fill="currentColor"></path>
          </svg>
        </div>
        <!-- Gear 2 -->
        <div 
          class="pointer-events-none absolute bottom-[2px] right-[20px] transition-all duration-300 z-10"
          [class.opacity-0]="!isHovered"
          [class.translate-x-3]="isHovered"
          [class.translate-y-3]="isHovered"
          [class.opacity-100]="isHovered"
          [class.translate-x-0]="!isHovered"
          [class.-rotate-180]="isHovered"
        >
          <svg class="text-[#2563EB]" height="20" stroke-linejoin="round" viewBox="0 0 16 16" width="20">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.49999 0H6.49999L6.22628 1.45975C6.1916 1.64472 6.05544 1.79299 5.87755 1.85441C5.6298 1.93996 5.38883 2.04007 5.15568 2.15371C4.98644 2.2362 4.78522 2.22767 4.62984 2.12136L3.40379 1.28249L1.28247 3.40381L2.12135 4.62986C2.22766 4.78524 2.23619 4.98646 2.1537 5.15569C2.04005 5.38885 1.93995 5.62981 1.8544 5.87756C1.79297 6.05545 1.6447 6.19162 1.45973 6.2263L0 6.5V9.5L1.45973 9.7737C1.6447 9.80838 1.79297 9.94455 1.8544 10.1224C1.93995 10.3702 2.04006 10.6112 2.1537 10.8443C2.23619 11.0136 2.22767 11.2148 2.12136 11.3702L1.28249 12.5962L3.40381 14.7175L4.62985 13.8786C4.78523 13.7723 4.98645 13.7638 5.15569 13.8463C5.38884 13.9599 5.6298 14.06 5.87755 14.1456C6.05544 14.207 6.1916 14.3553 6.22628 14.5403L6.49999 16H9.49999L9.77369 14.5403C9.80837 14.3553 9.94454 14.207 10.1224 14.1456C10.3702 14.06 10.6111 13.9599 10.8443 13.8463C11.0135 13.7638 11.2147 13.7723 11.3701 13.8786L12.5962 14.7175L14.7175 12.5962L13.8786 11.3701C13.7723 11.2148 13.7638 11.0135 13.8463 10.8443C13.9599 10.6112 14.06 10.3702 14.1456 10.1224C14.207 9.94455 14.3553 9.80839 14.5402 9.7737L16 9.5V6.5L14.5402 6.2263C14.3553 6.19161 14.207 6.05545 14.1456 5.87756C14.06 5.62981 13.9599 5.38885 13.8463 5.1557C13.7638 4.98647 13.7723 4.78525 13.8786 4.62987L14.7175 3.40381L12.5962 1.28249L11.3701 2.12137C11.2148 2.22768 11.0135 2.2362 10.8443 2.15371C10.6111 2.04007 10.3702 1.93996 10.1224 1.85441C9.94454 1.79299 9.80837 1.64472 9.77369 1.45974L9.49999 0ZM8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z" fill="currentColor"></path>
          </svg>
        </div>
        <div class="relative z-20 flex h-[54px] items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-6 py-1 shadow-sm">
          <button
            class="cursor-pointer bg-transparent border-none px-0 py-1 text-[15px] font-semibold text-blue-700 underline underline-offset-4 decoration-blue-200 transition-colors hover:text-blue-800 hover:decoration-blue-500 focus:outline-none"
            (mouseenter)="isHovered = true"
            (mouseleave)="isHovered = false"
            (click)="actionClicked.emit()"
          >
            {{ buttonText }}
          </button>
          <span class="text-[15px] font-medium text-blue-600">
            {{ description }}
          </span>
          <button 
            *ngIf="showClose"
            (click)="closeClicked.emit()"
            class="ml-1 flex h-6 w-6 items-center justify-center rounded-md bg-transparent text-blue-600 transition-colors hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin-slow 3s linear infinite;
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class UpgradeBannerComponent implements OnInit {
  @Input() buttonText: string = 'Upgrade to Pro';
  @Input() description: string = 'for 2x more CPUs and faster builds';
  @Input() className: string = '';
  @Input() showClose: boolean = false;
  
  @Output() actionClicked = new EventEmitter<void>();
  @Output() closeClicked = new EventEmitter<void>();

  isHovered = false;
  isVisible = false;

  ngOnInit() {
    setTimeout(() => {
      this.isVisible = true;
    }, 50);
  }
}
