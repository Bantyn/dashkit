import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface WordObject {
  characters: string[];
  needsSpace: boolean;
}

@Component({
  selector: 'app-vertical-cut-reveal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [class]="'flex flex-wrap whitespace-pre-wrap ' + containerClassName"
      [class.flex-col]="splitBy === 'lines'"
    >
      <span class="sr-only">{{ text }}</span>

      @for (wordObj of elements; track $index; let wordIndex = $index) {
        <span
          aria-hidden="true"
          [class]="'inline-flex overflow-hidden ' + wordLevelClassName"
          [style.margin-right]="wordObj.needsSpace ? '0.28em' : '0'"
        >@for (char of wordObj.characters; track $index; let charIndex = $index) {<span
              [class]="'relative ' + elementLevelClassName"
            ><span
                class="reveal-char"
                [class.reverse]="reverse"
                [class.animate]="isAnimating"
                [style.animation-delay]="getStaggerDelay(getPreviousCharsCount(wordIndex) + charIndex) + 's'"
                [style.animation-duration]="duration + 's'"
                [style.animation-timing-function]="timingFunction"
              >{{ char }}</span></span>}</span>
      }
    </span>
  `,
  styles: [`
    @keyframes verticalCutRevealUp {
      0% {
        transform: translateY(110%) rotate(3deg) scale(0.92);
        opacity: 0;
        filter: blur(2px);
      }
      65% {
        transform: translateY(-6%) rotate(-0.5deg) scale(1.01);
        opacity: 0.95;
        filter: blur(0);
      }
      100% {
        transform: translateY(0) rotate(0deg) scale(1);
        opacity: 1;
        filter: blur(0);
      }
    }

    @keyframes verticalCutRevealDown {
      0% {
        transform: translateY(-110%) rotate(-3deg) scale(0.92);
        opacity: 0;
        filter: blur(2px);
      }
      65% {
        transform: translateY(6%) rotate(0.5deg) scale(1.01);
        opacity: 0.95;
        filter: blur(0);
      }
      100% {
        transform: translateY(0) rotate(0deg) scale(1);
        opacity: 1;
        filter: blur(0);
      }
    }

    .reveal-char {
      display: inline-block;
      transform: translateY(110%) rotate(3deg) scale(0.92);
      opacity: 0;
      filter: blur(2px);
      animation-fill-mode: forwards;
      will-change: transform, opacity, filter;
    }

    .reveal-char.reverse {
      transform: translateY(-110%) rotate(-3deg) scale(0.92);
    }

    .reveal-char.animate {
      animation-name: verticalCutRevealUp;
    }

    .reveal-char.animate.reverse {
      animation-name: verticalCutRevealDown;
    }
  `]
})
export class VerticalCutRevealComponent implements OnInit, OnChanges {
  @Input() text: string = '';
  @Input() reverse: boolean = false;
  @Input() splitBy: 'words' | 'characters' | 'lines' | string = 'words';
  @Input() staggerDuration: number = 0.2;
  @Input() staggerFrom: 'first' | 'last' | 'center' | 'random' | number = 'first';
  @Input() delay: number = 0;
  @Input() duration: number = 0.6;
  @Input() timingFunction: string = 'cubic-bezier(0.175, 0.885, 0.32, 1.15)'; // spring curve
  @Input() containerClassName: string = '';
  @Input() wordLevelClassName: string = '';
  @Input() elementLevelClassName: string = '';
  @Input() autoStart: boolean = true;

  elements: WordObject[] = [];
  isAnimating: boolean = false;

  ngOnInit() {
    this.prepareElements();
    if (this.autoStart) {
      this.startAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['text'] && !changes['text'].firstChange) {
      this.prepareElements();
      if (this.autoStart) {
        this.startAnimation();
      }
    }
  }

  prepareElements() {
    const textStr = this.text || '';
    const words = textStr.split(' ');

    if (this.splitBy === 'characters') {
      this.elements = words.map((word: string, i: number) => ({
        characters: this.splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }));
    } else if (this.splitBy === 'words') {
      this.elements = words.map((word: string, i: number) => ({
        characters: [word],
        needsSpace: i !== words.length - 1
      }));
    } else if (this.splitBy === 'lines') {
      const lines = textStr.split('\n');
      this.elements = lines.map((line: string, i: number) => ({
        characters: [line],
        needsSpace: false
      }));
    } else {
      const parts = textStr.split(this.splitBy);
      this.elements = parts.map((part: string, i: number) => ({
        characters: [part],
        needsSpace: i !== parts.length - 1
      }));
    }
  }

  splitIntoCharacters(text: string): string[] {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), ({ segment }) => segment);
    }
    return Array.from(text);
  }

  getTotalElementsCount(): number {
    return this.elements.reduce((sum, el) => sum + el.characters.length, 0);
  }

  getPreviousCharsCount(wordIndex: number): number {
    return this.elements
      .slice(0, wordIndex)
      .reduce((sum, el) => sum + el.characters.length, 0);
  }

  getStaggerDelay(index: number): number {
    const total = this.getTotalElementsCount();
    let delayVal = 0;

    if (this.staggerFrom === 'first') {
      delayVal = index * this.staggerDuration;
    } else if (this.staggerFrom === 'last') {
      delayVal = (total - 1 - index) * this.staggerDuration;
    } else if (this.staggerFrom === 'center') {
      const center = Math.floor(total / 2);
      delayVal = Math.abs(center - index) * this.staggerDuration;
    } else if (this.staggerFrom === 'random') {
      const r = Math.sin(index + 1) * 10000;
      const randIndex = Math.floor((r - Math.floor(r)) * total);
      delayVal = Math.abs(randIndex - index) * this.staggerDuration;
    } else if (typeof this.staggerFrom === 'number') {
      delayVal = Math.abs(this.staggerFrom - index) * this.staggerDuration;
    }

    return this.delay + delayVal;
  }

  startAnimation() {
    this.isAnimating = false;
    // Trigger re-render to restart animation
    setTimeout(() => {
      this.isAnimating = true;
    }, 10);
  }

  reset() {
    this.isAnimating = false;
  }
}
