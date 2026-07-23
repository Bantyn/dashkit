import { Component } from '@angular/core';
import { AnalyticsViewComponent } from '../components/analytics-view.component';

@Component({
  selector: 'app-sales-analytics-page',
  standalone: true,
  imports: [AnalyticsViewComponent],
  template: `<app-analytics-view pageKey="sales" />`,
})
export class SalesAnalyticsComponent {}
