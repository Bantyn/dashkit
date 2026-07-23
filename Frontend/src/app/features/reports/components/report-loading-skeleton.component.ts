import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-pulse">
      <div class="rounded-[2rem] border border-gray-100 bg-white p-6">
        <div class="h-6 w-44 rounded-full bg-gray-100"></div>
        <div class="mt-3 h-4 w-80 max-w-full rounded-full bg-gray-100"></div>
        <div class="mt-6 grid gap-3 md:grid-cols-4">
          @for (card of [1, 2, 3, 4]; track card) {
            <div class="rounded-2xl border border-gray-100 bg-[var(--bg-page)] p-4">
              <div class="h-10 w-10 rounded-xl bg-gray-100"></div>
              <div class="mt-4 h-4 w-24 rounded-full bg-gray-100"></div>
              <div class="mt-2 h-7 w-28 rounded-full bg-gray-100"></div>
              <div class="mt-3 h-3 w-32 rounded-full bg-gray-100"></div>
            </div>
          }
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div class="rounded-[2rem] border border-gray-100 bg-white p-6">
          <div class="h-5 w-32 rounded-full bg-gray-100"></div>
          <div class="mt-2 h-4 w-56 rounded-full bg-gray-100"></div>
          <div class="mt-6 h-72 rounded-[1.5rem] bg-gray-100"></div>
        </div>

        <div class="rounded-[2rem] border border-gray-100 bg-white p-6">
          <div class="h-5 w-28 rounded-full bg-gray-100"></div>
          <div class="mt-5 space-y-4">
            @for (line of [1, 2, 3]; track line) {
              <div class="h-16 rounded-2xl bg-gray-100"></div>
            }
          </div>
        </div>
      </div>

      <div class="rounded-[2rem] border border-gray-100 bg-white p-6">
        <div class="h-5 w-36 rounded-full bg-gray-100"></div>
        <div class="mt-6 space-y-3">
          @for (row of rows; track row) {
            <div class="grid grid-cols-5 gap-3">
              <ng-container *ngFor="let cell of cells">
                <div class="h-11 rounded-xl bg-gray-100"></div>
              </ng-container>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ReportLoadingSkeletonComponent {
  readonly rows = [1, 2, 3, 4, 5];
  readonly cells = [1, 2, 3, 4, 5];
}
