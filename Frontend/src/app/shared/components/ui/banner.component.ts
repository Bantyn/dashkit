import { Component, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [id]="id"
      class="sticky top-0 z-50 w-full flex flex-row items-center justify-center transition-all duration-300 overflow-hidden"
      [ngClass]="{
        'bg-secondary': variant !== 'rainbow',
        'hidden': !open
      }"
      [style.height]="open ? height : '0'"
      [class]="customClass"
    >
      <!-- Rainbow Animation Background -->
      <ng-container *ngIf="variant === 'rainbow'">
        <div class="absolute inset-0 z-0 pointer-events-none opacity-90">
          <div class="absolute inset-0 rainbow-banner-gradient-1"></div>
          <div class="absolute inset-0 rainbow-banner-gradient-2 mix-blend-color-dodge"></div>
        </div>
      </ng-container>

      <span class="relative z-10  py-1 px-10 rounded-2xl selection:text-white selection:bg-primary-400 font-normal text-sm tracking-wide flex items-center gap-2"
            [ngClass]="{'text-black': variant === 'rainbow'}">
         <ng-content></ng-content>
         {{ message }}
      </span>

      <button
        *ngIf="id"
        type="button"
        aria-label="Close Announcement"
        (click)="closeBanner()"
        class="absolute end-4 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer z-10"
        [ngClass]="{
          'text-primary-700 bg-black/5 hover:text-primary-500 hover:bg-black/20': variant === 'rainbow',
          'text-muted-foreground hover:bg-black/5': variant !== 'rainbow'
        }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `
})
export class BannerComponent implements OnInit {
  @Input() id: string = '';
  @Input() variant: 'rainbow' | 'normal' = 'rainbow';
  @Input() message: string = '';
  @Input() height: string = '3.5rem';
  @Input('class') customClass: string = '';
  
  open = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  get globalKey(): string {
    return this.id ? `banner-${this.id}` : '';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && this.globalKey) {
      this.open = localStorage.getItem(this.globalKey) !== 'true';
    }
  }

  closeBanner() {
    this.open = false;
    if (isPlatformBrowser(this.platformId) && this.globalKey) {
      localStorage.setItem(this.globalKey, 'true');
    }
  }
}
