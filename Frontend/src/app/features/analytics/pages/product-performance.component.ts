import { Component } from '@angular/core';
import { AnalyticsViewComponent } from '../components/analytics-view.component';

@Component({
  selector: 'app-product-performance-page',
  standalone: true,
  imports: [AnalyticsViewComponent],
  template: `<app-analytics-view pageKey="products" />`,
})
export class ProductPerformanceComponent {}
