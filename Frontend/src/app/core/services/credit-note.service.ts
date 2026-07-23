import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface CreditNote {
  id: string;
  shopId: string;
  orderId?: string;
  invoiceId?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  convertedToCredit: boolean;
  creditTransactionId?: string;
  createdAt: any;
  updatedAt: any;
}

@Injectable({ providedIn: 'root' })
export class CreditNoteService {
  private apiUrl = `${environment.apiUrl}/credit-notes`;

  constructor(private http: HttpClient) {}

  createCreditNote(payload: Partial<CreditNote>): Observable<ApiResponse<CreditNote>> {
    return this.http.post<ApiResponse<CreditNote>>(this.apiUrl, payload);
  }

  getCreditNotesByShop(shopId: string): Observable<ApiResponse<CreditNote[]>> {
    return this.http.get<ApiResponse<CreditNote[]>>(`${this.apiUrl}/shop/${shopId}`);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}/status`, { status });
  }

  convertToCredit(id: string): Observable<ApiResponse<CreditNote>> {
    return this.http.post<ApiResponse<CreditNote>>(`${this.apiUrl}/${id}/convert`, {});
  }
}
