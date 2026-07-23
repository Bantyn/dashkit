import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SaleReturn } from '../models/sales-return.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
  private apiUrl = `${environment.apiUrl}/returns`;

  constructor(private http: HttpClient) {}

  getReturnsByShop(shopId: string): Observable<ApiResponse<SaleReturn[]>> {
    return this.http.get<ApiResponse<SaleReturn[]>>(`${this.apiUrl}/shop/${shopId}`);
  }

  getReturn(id: string): Observable<ApiResponse<SaleReturn>> {
    return this.http.get<ApiResponse<SaleReturn>>(`${this.apiUrl}/${id}`);
  }

  createReturn(returnData: Partial<SaleReturn>): Observable<ApiResponse<SaleReturn>> {
    return this.http.post<ApiResponse<SaleReturn>>(this.apiUrl, returnData);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}/status`, { status });
  }
}
