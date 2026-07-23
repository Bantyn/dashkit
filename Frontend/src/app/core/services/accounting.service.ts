import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface LedgerEntry {
  id: string;
  date: string;
  narration: string;
  type: 'debit' | 'credit';
  source: string;
  sourceId: string;
  amount: number;
  balance?: number;
  paymentMethod: string;
  bankName?: string;
  referenceNo?: string;
  partyName?: string;
  partyId?: string;
}

export interface LedgerResult {
  entries: LedgerEntry[];
  totalIn?: number;
  totalOut?: number;
  totalCredit?: number;
  totalDebit?: number;
  closingBalance: number;
}

export interface ReceivableEntry {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  paymentStatus: string;
  agingDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface PayableEntry {
  purchaseOrderId: string;
  supplierName: string;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  agingDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface GSTReport {
  summary: {
    totalTaxableRevenue: number;
    totalOutputTax: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    effectiveTaxRate: string;
    taxableInvoiceCount: number;
  };
  rows: {
    taxBucket: string;
    taxableSales: number;
    taxAmount: number;
    effectiveRate: string;
  }[];
  period: string;
}

export interface DateRange {
  start: string;
  end: string;
}

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly base = `${environment.apiUrl}/accounting`;

  constructor(private http: HttpClient) {}

  private buildParams(range?: DateRange): HttpParams {
    let params = new HttpParams();
    if (range) {
      params = params.set('start', range.start).set('end', range.end);
    }
    return params;
  }

  getCashBook(shopId: string, range?: DateRange): Observable<ApiResponse<LedgerResult>> {
    return this.http.get<ApiResponse<LedgerResult>>(`${this.base}/${shopId}/cashbook`, {
      params: this.buildParams(range),
    });
  }

  getBankBook(shopId: string, range?: DateRange): Observable<ApiResponse<LedgerResult>> {
    return this.http.get<ApiResponse<LedgerResult>>(`${this.base}/${shopId}/bankbook`, {
      params: this.buildParams(range),
    });
  }

  getLedger(shopId: string, range?: DateRange): Observable<ApiResponse<LedgerResult>> {
    return this.http.get<ApiResponse<LedgerResult>>(`${this.base}/${shopId}/ledger`, {
      params: this.buildParams(range),
    });
  }

  getReceivables(shopId: string): Observable<ApiResponse<{ entries: ReceivableEntry[]; totalOutstanding: number; bucketSummary: any; count: number }>> {
    return this.http.get<any>(`${this.base}/${shopId}/receivables`);
  }

  getPayables(shopId: string): Observable<ApiResponse<{ entries: PayableEntry[]; totalOutstanding: number; bucketSummary: any; count: number }>> {
    return this.http.get<any>(`${this.base}/${shopId}/payables`);
  }

  getGSTReport(shopId: string, range?: DateRange): Observable<ApiResponse<GSTReport>> {
    return this.http.get<ApiResponse<GSTReport>>(`${this.base}/${shopId}/gst-report`, {
      params: this.buildParams(range),
    });
  }
}
