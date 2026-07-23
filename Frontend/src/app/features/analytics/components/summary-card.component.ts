import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { AnalyticsSummaryCard } from '../analytics.types';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div [class]="toneClass()">
          <i [class]="'bi ' + card().icon + ' text-lg'"></i>
        </div>
        <span class="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {{ card().tone }}
        </span>
      </div>
      <p class="mt-4 text-sm font-medium text-gray-500">{{ card().label }}</p>
      <p class="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">{{ card().value }}</p>
      <p class="mt-2 text-xs font-medium text-gray-400">{{ card().change }}</p>
    </article>
  `,
})
export class SummaryCardComponent {
  readonly card = input.required<AnalyticsSummaryCard>();

  toneClass() {
    const toneMap: Record<string, string> = {
      primary: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700',
      success: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700',
      warning: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700',
      neutral: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700',
    };

    return toneMap[this.card().tone] || toneMap['primary'];
  }
}
