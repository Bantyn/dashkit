import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface StockTransferItem {
  productId: string;
  variantSku: string;
  quantity: number;
  productName: string;
}

export interface StockTransfer {
  id: string;
  shopId: string;
  sourceBranchId: string;
  sourceBranchName?: string;
  destinationBranchId: string;
  destinationBranchName?: string;
  items: StockTransferItem[];
  status: 'pending' | 'completed' | 'cancelled';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class StockTransferService {
  private apiUrl = `${environment.apiUrl}/stock-transfers`;

  constructor(private http: HttpClient) {}

  getTransfers(shopId: string): Observable<ApiResponse<StockTransfer[]>> {
    return this.http.get<ApiResponse<StockTransfer[]>>(`${this.apiUrl}/${shopId}`);
  }

  createTransfer(payload: {
    shopId: string;
    sourceBranchId: string;
    sourceBranchName: string;
    destinationBranchId: string;
    destinationBranchName: string;
    items: StockTransferItem[];
  }): Observable<ApiResponse<StockTransfer>> {
    return this.http.post<ApiResponse<StockTransfer>>(`${this.apiUrl}`, payload);
  }
}
