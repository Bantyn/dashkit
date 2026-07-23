import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inventory } from '../models/inventory.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getInventory(shopId: string): Observable<ApiResponse<Inventory[]>> {
    return this.http.get<ApiResponse<Inventory[]>>(`${this.apiUrl}/${shopId}`);
  }

  updateStock(
    shopId: string,
    productId: string,
    newStock: number,
    changeType: 'add' | 'subtract' | 'set' = 'set',
    amount: number = 0,
    reason: string = 'Manual Update',
    variantSku?: string,
  ): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/update-stock`, {
      shopId,
      productId,
      newStock,
      changeType,
      amount,
      reason,
      variantSku,
    });
  }

  getLowStock(shopId: string): Observable<ApiResponse<Inventory[]>> {
    return this.http.get<ApiResponse<Inventory[]>>(`${this.apiUrl}/low-stock/${shopId}`);
  }

  getInventoryHistory(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/history/${shopId}`);
  }

  deleteInventory(id: string, shopId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}?shopId=${shopId}`);
  }
}
