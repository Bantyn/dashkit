import { Component } from '@angular/core';
import { ReportViewComponent } from '../components/report-view.component';

@Component({
  selector: 'app-profit-loss-report',
  standalone: true,
  imports: [ReportViewComponent],
  template: `<app-report-view reportKey="profit-loss" />`,
})
export class ProfitLossReportComponent {}
