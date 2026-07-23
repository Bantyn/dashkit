import { Component, Input, OnChanges, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Pure SVG sparkline with draw-in animation (matches the React StatsWidget behaviour) */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + svgWidth + ' ' + svgHeight"
      [attr.width]="svgWidth"
      [attr.height]="svgHeight"
      style="display:block;"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient [id]="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.28" />
          <stop offset="100%" [attr.stop-color]="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- filled area -->
      <path #areaEl [attr.d]="areaPath" [attr.fill]="'url(#' + gradId + ')'" style="opacity:0" />

      <!-- line -->
      <path
        #lineEl
        [attr.d]="linePath"
        fill="none"
        [attr.stroke]="color"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class SparklineChartComponent implements OnChanges, AfterViewInit {
  @Input() data: number[] = [];
  @Input() color: string = '#22C55E';
  @Input() width: number = 150;
  @Input() height: number = 60;

  @ViewChild('lineEl') lineEl!: ElementRef<SVGPathElement>;
  @ViewChild('areaEl') areaEl!: ElementRef<SVGPathElement>;

  svgWidth = 150;
  svgHeight = 60;
  linePath = '';
  areaPath = '';
  gradId = `sg-${Math.random().toString(36).slice(2, 8)}`;

  private viewReady = false;

  ngAfterViewInit() {
    this.viewReady = true;
    this.buildAndAnimate();
  }

  ngOnChanges() {
    this.svgWidth = this.width;
    this.svgHeight = this.height;
    this.buildPaths();
    if (this.viewReady) {
      this.buildAndAnimate();
    }
  }

  private buildAndAnimate() {
    this.buildPaths();
    // wait for Angular CD to render paths into the DOM
    setTimeout(() => this.animate(), 0);
  }

  private buildPaths() {
    const vals = this.data?.length >= 2 ? this.data : [0, 0, 0, 0, 0];
    const maxV = Math.max(...vals, 1);
    const W = this.svgWidth;
    const H = this.svgHeight;
    const xStep = W / (vals.length - 1);

    const pts = vals.map((v, i) => ({
      x: i * xStep,
      y: H - (v / maxV) * (H * 0.8) - H * 0.1,
    }));

    // smooth bezier
    let line = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      line += ` C ${midX},${pts[i].y} ${midX},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    this.linePath = line;
    this.areaPath = `${line} L ${W} ${H} L 0 ${H} Z`;
  }

  private animate() {
    const lineEl = this.lineEl?.nativeElement;
    const areaEl = this.areaEl?.nativeElement;
    if (!lineEl || !areaEl) return;

    const len = lineEl.getTotalLength();
    // reset
    lineEl.style.transition = 'none';
    lineEl.style.strokeDasharray = `${len} ${len}`;
    lineEl.style.strokeDashoffset = `${len}`;
    areaEl.style.transition = 'none';
    areaEl.style.opacity = '0';

    // force reflow
    void lineEl.getBoundingClientRect();

    // animate
    lineEl.style.transition = 'stroke-dashoffset 0.85s ease-in-out';
    lineEl.style.strokeDashoffset = '0';
    areaEl.style.transition = 'opacity 0.85s ease-in-out 0.2s';
    areaEl.style.opacity = '1';
  }
}
