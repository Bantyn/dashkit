import { Component } from '@angular/core';
import { AnalyticsViewComponent } from '../components/analytics-view.component';

@Component({
  selector: 'app-customer-analytics-page',
  standalone: true,
  imports: [AnalyticsViewComponent],
  template: `<app-analytics-view pageKey="customers" />`,
})
export class CustomerAnalyticsComponent {}
