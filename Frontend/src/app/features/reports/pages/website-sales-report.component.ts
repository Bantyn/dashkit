import { Component } from '@angular/core';
import { ReportViewComponent } from '../components/report-view.component';

@Component({
  selector: 'app-website-sales-report',
  standalone: true,
  imports: [ReportViewComponent],
  template: `<app-report-view reportKey="website-sales" />`,
})
export class WebsiteSalesReportComponent {}
