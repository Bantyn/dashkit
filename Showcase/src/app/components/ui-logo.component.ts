import { Component, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-ui-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2371 2305"
      [style.width]="size"
      [style.height]="size"
      class="transition-colors duration-300 inline-block"
      [ngClass]="className"
    >
      <path
        fill-rule="evenodd"
        [attr.fill]="color || 'currentColor'"
        d="M1516.792,2304.820 L1512.287,2304.820 C1338.596,2304.820 1196.143,2171.148 1182.143,2001.069 C1171.643,2170.581 1030.864,2304.820 858.707,2304.820 L324.861,2304.820 C145.871,2304.820 0.771,2159.720 0.771,1980.730 L0.771,1476.590 C0.771,1297.600 145.871,1152.500 324.861,1152.500 C145.871,1152.500 0.771,1007.400 0.771,828.410 L0.771,324.270 C0.771,145.280 145.871,0.180 324.861,0.180 L858.707,0.180 C1031.220,0.180 1172.228,134.974 1182.210,304.982 C1196.567,135.260 1338.852,1.980 1512.287,1.980 L1516.792,1.980 C1988.132,1.980 2370.229,384.077 2370.229,855.417 L2370.229,1451.383 C2370.229,1922.723 1988.132,2304.820 1516.792,2304.820 ZM358.168,1152.500 C795.182,1152.500 1152.788,1492.447 1180.995,1922.325 L1180.995,382.675 C1152.788,812.553 795.182,1152.500 358.168,1152.500 Z"
      />
    </svg>
  `
})
export class UiLogoComponent implements OnChanges {
  @Input() size: string = '100%';
  @Input() color: string | null = null;
  @Input() className: string = '';
  @Input() updateFavicon: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color'] && this.updateFavicon && isPlatformBrowser(this.platformId)) {
      this.refreshFavicon(changes['color'].currentValue || '#6366f1');
    }
  }

  private refreshFavicon(themeColor: string): void {
    try {
      const link: HTMLLinkElement | null = document.querySelector("link#dynamic-favicon");
      if (link) {
        const pathData = "M1516.792,2304.820 L1512.287,2304.820 C1338.596,2304.820 1196.143,2171.148 1182.143,2001.069 C1171.643,2170.581 1030.864,2304.820 858.707,2304.820 L324.861,2304.820 C145.871,2304.820 0.771,2159.720 0.771,1980.730 L0.771,1476.590 C0.771,1297.600 145.871,1152.500 324.861,1152.500 C145.871,1152.500 0.771,1007.400 0.771,828.410 L0.771,324.270 C0.771,145.280 145.871,0.180 324.861,0.180 L858.707,0.180 C1031.220,0.180 1172.228,134.974 1182.210,304.982 C1196.567,135.260 1338.852,1.980 1512.287,1.980 L1516.792,1.980 C1988.132,1.980 2370.229,384.077 2370.229,855.417 L2370.229,1451.383 C2370.229,1922.723 1988.132,2304.820 1516.792,2304.820 ZM358.168,1152.500 C795.182,1152.500 1152.788,1492.447 1180.995,1922.325 L1180.995,382.675 C1152.788,812.553 795.182,1152.500 358.168,1152.500 Z";
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2371 2305"><path fill-rule="evenodd" fill="${encodeURIComponent(themeColor)}" d="${pathData}"/></svg>`;
        link.href = `data:image/svg+xml;charset=utf-8,${svgString}`;
      }
    } catch (e) {
      console.warn('Could not update dynamic favicon color', e);
    }
  }
}
