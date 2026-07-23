import { Component } from '@angular/core';
import { ReportViewComponent } from '../components/report-view.component';

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [ReportViewComponent],
  template: `<app-report-view reportKey="inventory" />`,
})
export class InventoryReportComponent {}
