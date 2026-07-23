import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics-loading-skeleton',
  standalone: true,
  template: `
    <div class="space-y-6 p-6 xl:p-8 animate-pulse">
      <div class="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div class="h-6 w-40 rounded-full bg-gray-100"></div>
        <div class="mt-4 h-10 w-72 rounded-2xl bg-gray-100"></div>
        <div class="mt-3 h-4 w-full max-w-2xl rounded-full bg-gray-100"></div>
        <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:max-w-[360px]">
          <div class="h-16 rounded-2xl bg-gray-100"></div>
          <div class="h-16 rounded-2xl bg-gray-100"></div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="h-36 rounded-[1.75rem] bg-white border border-gray-100 shadow-sm"></div>
        <div class="h-36 rounded-[1.75rem] bg-white border border-gray-100 shadow-sm"></div>
        <div class="h-36 rounded-[1.75rem] bg-white border border-gray-100 shadow-sm"></div>
      </div>

      <div class="grid gap-6 2xl:grid-cols-[1.45fr_0.8fr]">
        <div class="h-[420px] rounded-[2rem] bg-white border border-gray-100 shadow-sm"></div>
        <div class="h-[420px] rounded-[2rem] bg-white border border-gray-100 shadow-sm"></div>
      </div>
    </div>
  `,
})
export class AnalyticsLoadingSkeletonComponent {}
