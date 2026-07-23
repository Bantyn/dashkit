import { Component, Input, OnInit, ElementRef, ViewChild, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-review-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full max-w-xs rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm flex flex-col items-center justify-center transition-all duration-500 ease-out mx-auto"
      [class.opacity-0]="!isVisible"
      [class.translate-y-4]="!isVisible"
      [class.opacity-100]="isVisible"
      [class.translate-y-0]="isVisible"
      [attr.aria-label]="'Rating: ' + rating + ' out of ' + maxRating + ' based on ' + reviewCount + ' reviews.'"
    >
      <!-- Star Rating Display -->
      <div class="flex items-center gap-1">
        <div
          *ngFor="let _ of [].constructor(maxRating); let i = index"
          class="transition-all duration-500 ease-out"
          [style.transitionDelay]="(200 + i * 100) + 'ms'"
          [class.opacity-0]="!isVisible"
          [class.scale-50]="!isVisible"
          [class.opacity-100]="isVisible"
          [class.scale-100]="isVisible"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6"
            [ngClass]="rating >= i + 1 ? 'text-yellow-400' : 'text-gray-200'"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
      </div>

      <!-- Animated Rating and Review Count -->
      <h2 class="mt-4 text-4xl font-bold tracking-tight text-gray-900">
        <span>{{ displayRating | number:'1.1-1' }}</span>
        <span class="text-3xl font-semibold text-gray-600">
          (<span #reviewCountEl>{{ displayReviewCount | number }}</span> Reviews)
        </span>
      </h2>

      <!-- Summary Text -->
      <p class="mt-2 text-sm text-gray-500">{{ summaryText }}</p>
    </div>
  `
})
export class ReviewSummaryCardComponent implements OnInit, OnDestroy {
  @Input() rating: number = 0;
  @Input() reviewCount: number = 0;
  @Input() maxRating: number = 5;
  @Input() summaryText: string = '';

  isVisible: boolean = false;
  displayRating: number = 0;
  displayReviewCount: number = 0;
  
  private animationFrameId: number | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      setTimeout(() => {
        this.isVisible = true;
        this.startAnimations();
      }, 50);
    } else {
      this.isVisible = true;
      this.displayRating = this.rating;
      this.displayReviewCount = this.reviewCount;
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startAnimations() {
    const duration = 1500; // 1.5 seconds
    const start = performance.now();
    const targetRating = this.rating;
    const targetCount = this.reviewCount;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);

      this.displayRating = targetRating * easedProgress;
      this.displayReviewCount = Math.round(targetCount * easedProgress);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.displayRating = targetRating;
        this.displayReviewCount = targetCount;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}
