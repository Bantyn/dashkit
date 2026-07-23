import { Component, Injectable, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../core/models/invoice.model';
import { InvoicePrintComponent } from './invoice-print.component';

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  activeInvoice = signal<Invoice | null>(null);
  isOpen = signal<boolean>(false);

  openPreview(invoice: Invoice) {
    this.activeInvoice.set(invoice);
    this.isOpen.set(true);
  }

  closePreview() {
    this.activeInvoice.set(null);
    this.isOpen.set(false);
  }
}

@Component({
  selector: 'app-print-preview-modal',
  standalone: true,
  imports: [CommonModule, InvoicePrintComponent],
  template: `
    <div 
      *ngIf="isOpen()" 
      class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
      (click)="onBackdropClick()"
    >
      <div 
        class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-150 bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i class="bi bi-printer-fill text-primary-600"></i>
              Invoice Print Preview
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">Review the invoice layout before sending to the printer</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="print()"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm border-0"
            >
              <i class="bi bi-printer"></i> Print Invoice
            </button>
            <button 
              (click)="close()" 
              class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-all border-0"
            >
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>

        <!-- Preview Body Container -->
        <div class="flex-1 overflow-auto bg-slate-500/10 p-6 flex justify-center print-preview-container custom-scrollbar">
          <div class="bg-white border border-gray-300 shadow-xl p-8 w-full max-w-[210mm] min-h-[297mm] my-auto">
            <app-invoice-print [invoice]="invoice()"></app-invoice-print>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-150 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            (click)="close()"
            class="px-4 py-2 bg-white text-gray-700 border border-gray-250 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            (click)="print()"
            class="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm border-0"
          >
            <i class="bi bi-printer-fill"></i> Print
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class PrintPreviewModalComponent {
  private printService = inject(PrintService);

  isOpen = this.printService.isOpen;
  invoice = this.printService.activeInvoice;

  close() {
    this.printService.closePreview();
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapePress(event: Event) {
    if (this.isOpen()) {
      this.close();
    }
  }

  onBackdropClick() {
    this.close();
  }

  print() {
    const printEl = document.querySelector('.print-preview-container app-invoice-print');
    if (!printEl) return;

    const content = printEl.innerHTML;

    // Find or create hidden iframe
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Get all style sheets from parent document
    let stylesHtml = '';
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules;
        stylesHtml += `<style>`;
        for (let j = 0; j < rules.length; j++) {
          stylesHtml += rules[j].cssText;
        }
        stylesHtml += `</style>`;
      } catch (e) {
        if (styleSheets[i].href) {
          stylesHtml += `<link rel="stylesheet" href="${styleSheets[i].href}">`;
        }
      }
    }

    // Write content
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          ${stylesHtml}
          <style>
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print-container {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 5mm !important;
              width: 100% !important;
              max-width: none !important;
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();

    // Close preview modal after starting print
    this.close();
  }
}
