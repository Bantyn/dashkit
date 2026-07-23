import { Component, input } from '@angular/core';

@Component({
  selector: 'app-analytics-empty-state',
  standalone: true,
  template: `
    <section class="rounded-[2rem] border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-50 text-primary-700">
        <i class="bi bi-clipboard-data text-2xl"></i>
      </div>
      <h2 class="mt-5 text-xl font-semibold text-[var(--text-primary)]">{{ title() }}</h2>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ description() }}</p>
    </section>
  `,
})
export class AnalyticsEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
