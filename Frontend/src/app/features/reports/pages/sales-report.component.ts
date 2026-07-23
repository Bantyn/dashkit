import { Component } from '@angular/core';
import { ReportViewComponent } from '../components/report-view.component';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [ReportViewComponent],
  template: `<app-report-view reportKey="sales" />`,
})
export class SalesReportComponent {}
