import { Component } from '@angular/core';
import { AnalyticsViewComponent } from '../components/analytics-view.component';

@Component({
  selector: 'app-branch-performance-page',
  standalone: true,
  imports: [AnalyticsViewComponent],
  template: `<app-analytics-view pageKey="branches" />`,
})
export class BranchPerformanceComponent {}
