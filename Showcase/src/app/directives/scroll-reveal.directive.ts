import { Directive, ElementRef, AfterViewInit, Input, OnDestroy, inject, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private ngZone = inject(NgZone);

  @Input('appScrollReveal') animationType: 'chars' | 'words' | 'element' | 'children' = 'element';
  @Input() revealDelay: number = 30; // stagger delay in ms
  @Input() revealDuration: number = 0.8; // duration in seconds
  @Input() revealEase: string = 'power3.out';
  @Input() revealFromY: number = 40; // start y displacement
  @Input() revealThreshold: number = 0.1; // intersection threshold equivalent

  private ctx?: gsap.Context;

  ngAfterViewInit() {
    // Run outside Angular zone to prevent unnecessary change detection cycles during GSAP animations
    this.ngZone.runOutsideAngular(() => {
      this.initAnimation();
    });
  }

  private initAnimation() {
    const element = this.el.nativeElement as HTMLElement;
    if (!element) return;

    this.ctx = gsap.context(() => {
      let targets: any = element;
      
      // Text splitting setup
      if (this.animationType === 'chars') {
        targets = this.splitTextChars(element);
      } else if (this.animationType === 'words') {
        targets = this.splitTextWords(element);
      } else if (this.animationType === 'children') {
        targets = Array.from(element.children);
      }

      // Calculate ScrollTrigger start threshold
      const startPct = (1 - this.revealThreshold) * 100;
      const start = `top ${startPct}%`;

      // Set initial state to avoid flash of content
      gsap.set(targets, { opacity: 0, y: this.revealFromY });

      // Animate
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: this.revealDuration,
        ease: this.revealEase,
        stagger: this.revealDelay / 1000,
        scrollTrigger: {
          trigger: element,
          start: start,
          once: true,
          fastScrollEnd: true
        },
        willChange: 'transform, opacity',
        force3D: true
      });
    }, element);
  }

  private splitTextChars(element: HTMLElement): HTMLElement[] {
    const text = element.textContent || '';
    element.innerHTML = '';
    
    const chars: HTMLElement[] = [];
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.style.display = char === ' ' ? 'inline' : 'inline-block';
      span.style.willChange = 'transform, opacity';
      span.innerHTML = char === ' ' ? '&nbsp;' : char;
      element.appendChild(span);
      chars.push(span);
    });
    return chars;
  }

  private splitTextWords(element: HTMLElement): HTMLElement[] {
    const text = element.textContent || '';
    element.innerHTML = '';
    
    const words: HTMLElement[] = [];
    text.split(' ').forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';
      span.innerHTML = word;
      element.appendChild(span);
      words.push(span);
      
      if (i < arr.length - 1) {
        const space = document.createTextNode(' ');
        element.appendChild(space);
      }
    });
    return words;
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
