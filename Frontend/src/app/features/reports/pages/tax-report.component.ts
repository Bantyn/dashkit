import { Component } from '@angular/core';
import { ReportViewComponent } from '../components/report-view.component';

@Component({
  selector: 'app-tax-report',
  standalone: true,
  imports: [ReportViewComponent],
  template: `<app-report-view reportKey="tax" />`,
})
export class TaxReportComponent {}
