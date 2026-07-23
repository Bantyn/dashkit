import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngStyle]="getContainerStyle()">
      <span [ngStyle]="getCounterStyle()">
        @for (place of placesList; track $index) {
          @if (isNaNPlace(place)) {
            <span [ngStyle]="getDecimalStyle()">{{ place }}</span>
          } @else {
            <span [ngStyle]="getDigitStyle()">
              @for (num of [0,1,2,3,4,5,6,7,8,9]; track num) {
                <span [ngStyle]="getNumberStyle(num, place)">{{ num }}</span>
              }
            </span>
          }
        }
      </span>
      <span [ngStyle]="getGradientContainerStyle()">
        <span [ngStyle]="getTopGradientStyle()"></span>
        <span [ngStyle]="getBottomGradientStyle()"></span>
      </span>
    </span>
  `
})
export class UiCounterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() value!: number;
  @Input() fontSize = 100;
  @Input() padding = 0;
  @Input() places?: (number | string)[];
  @Input() gap = 8;
  @Input() borderRadius = 4;
  @Input() horizontalPadding = 8;
  @Input() textColor = 'white';
  @Input() fontWeight: string | number = 'bold';
  @Input() containerStyle: Record<string, any> = {};
  @Input() counterStyle: Record<string, any> = {};
  @Input() digitStyle: Record<string, any> = {};
  @Input() gradientHeight = 16;
  @Input() gradientFrom = 'black';
  @Input() gradientTo = 'transparent';
  @Input() topGradientStyle?: Record<string, any>;
  @Input() bottomGradientStyle?: Record<string, any>;
  @Input() animationDelay = 0;

  placesList: (number | string)[] = [];
  animatedValues: Record<string, number> = {};
  targetValues: Record<string, number> = {};

  private animationFrameId?: number;
  private isDestroyed = false;
  private observer?: IntersectionObserver;
  private hasAnimated = false;

  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private el: ElementRef
  ) {}

  ngOnInit() {
    this.updatePlaces();
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.hasAnimated) {
          this.hasAnimated = true;
          this.ngZone.run(() => {
            this.initializeValues();
            if (this.animationDelay > 0) {
              setTimeout(() => {
                if (!this.isDestroyed) this.startAnimationLoop();
              }, this.animationDelay);
            } else {
              this.startAnimationLoop();
            }
          });
          this.observer?.disconnect();
        }
      }, { threshold: 0.1 });
      this.observer.observe(this.el.nativeElement);
    } else {
      this.hasAnimated = true;
      this.initializeValues();
      this.startAnimationLoop();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange) {
      this.updatePlaces();
      if (this.hasAnimated) {
        this.updateTargets();
      }
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  isNaNPlace(place: any): boolean {
    return typeof place === 'string';
  }

  private updatePlaces() {
    if (this.places) {
      this.placesList = this.places;
      return;
    }

    if (this.value === undefined || this.value === null) {
      this.placesList = [];
      return;
    }

    const numStr = this.value.toString();
    const dotIdx = numStr.indexOf('.');
    const decimalPlaces = dotIdx === -1 ? 0 : numStr.length - dotIdx - 1;

    const formatted = this.value.toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });

    const digitsOnly = formatted.replace(/[^0-9]/g, '');
    const dotIndexInDigits = dotIdx === -1 ? digitsOnly.length : dotIdx;

    let digitCount = 0;
    this.placesList = [...formatted].map((ch) => {
      if (ch === '.' || ch === ',') {
        return ch;
      }
      if (isNaN(Number(ch))) {
        return ch;
      }
      const idx = digitCount++;
      const power = dotIndexInDigits - idx - 1;
      return Math.pow(10, power);
    });
  }

  private initializeValues() {
    this.placesList.forEach((place) => {
      if (!this.isNaNPlace(place)) {
        const key = place.toString();
        this.animatedValues[key] = 0; // Always start at 0 for initial load animation
        this.targetValues[key] = this.getValueRoundedToPlace(this.value, place as number);
      }
    });
  }

  private updateTargets() {
    this.placesList.forEach((place) => {
      if (!this.isNaNPlace(place)) {
        const key = place.toString();
        const val = this.getValueRoundedToPlace(this.value, place as number);
        this.targetValues[key] = val;
        if (this.animatedValues[key] === undefined) {
          this.animatedValues[key] = 0;
        }
      }
    });
  }

  private getValueRoundedToPlace(value: number, place: number): number {
    const scaled = value / place;
    const nearest = Math.round(scaled);
    const tolerance = 1e-9 * Math.max(1, Math.abs(scaled));
    const normalized = Math.abs(scaled - nearest) < tolerance ? nearest : scaled;
    return Math.floor(normalized) % 10;
  }

  private startAnimationLoop() {
    this.ngZone.runOutsideAngular(() => {
      const tick = () => {
        if (this.isDestroyed) return;

        let needsUpdate = false;
        const keys = Object.keys(this.targetValues);
        
        for (const key of keys) {
          const target = this.targetValues[key];
          const current = this.animatedValues[key];
          const diff = target - current;

          if (Math.abs(diff) > 0.001) {
            this.animatedValues[key] = current + diff * 0.03;
            needsUpdate = true;
          } else if (current !== target) {
            this.animatedValues[key] = target;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          this.cdr.detectChanges();
        }

        this.animationFrameId = requestAnimationFrame(tick);
      };
      this.animationFrameId = requestAnimationFrame(tick);
    });
  }

  get height(): number {
    return this.fontSize + this.padding;
  }

  getContainerStyle(): Record<string, any> {
    return {
      position: 'relative',
      display: 'inline-block',
      lineHeight: '1',
      ...this.containerStyle
    };
  }

  getCounterStyle(): Record<string, any> {
    return {
      fontSize: `${this.fontSize}px`,
      display: 'flex',
      gap: `${this.gap}px`,
      overflow: 'hidden',
      borderRadius: `${this.borderRadius}px`,
      paddingLeft: `${this.horizontalPadding}px`,
      paddingRight: `${this.horizontalPadding}px`,
      lineHeight: '1',
      color: this.textColor,
      fontWeight: this.fontWeight,
      direction: 'ltr',
      ...this.counterStyle
    };
  }

  getDecimalStyle(): Record<string, any> {
    return {
      height: `${this.height}px`,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 'fit-content',
      ...this.digitStyle
    };
  }

  getDigitStyle(): Record<string, any> {
    return {
      height: `${this.height}px`,
      position: 'relative',
      width: '1ch',
      fontVariantNumeric: 'tabular-nums',
      display: 'inline-flex',
      overflow: 'hidden',
      ...this.digitStyle
    };
  }

  getNumberStyle(num: number, place: any): Record<string, any> {
    const key = place.toString();
    const animatedValue = this.animatedValues[key] !== undefined ? this.animatedValues[key] : 0;
    
    const placeValue = animatedValue;
    const offset = (10 + num - placeValue) % 10;
    let memo = offset * this.height;
    if (offset > 5) {
      memo -= 10 * this.height;
    }

    return {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `translateY(${memo}px)`,
      pointerEvents: 'none'
    };
  }

  getGradientContainerStyle(): Record<string, any> {
    return {
      pointerEvents: 'none',
      position: 'absolute',
      inset: '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    };
  }

  getTopGradientStyle(): Record<string, any> {
    return this.topGradientStyle ?? {
      height: `${this.gradientHeight}px`,
      background: `linear-gradient(to bottom, ${this.gradientFrom}, ${this.gradientTo})`
    };
  }

  getBottomGradientStyle(): Record<string, any> {
    return this.bottomGradientStyle ?? {
      height: `${this.gradientHeight}px`,
      background: `linear-gradient(to top, ${this.gradientFrom}, ${this.gradientTo})`
    };
  }
}
