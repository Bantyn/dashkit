import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

function convertTimestamps(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
    return new Date(obj._seconds * 1000).toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    result[key] = convertTimestamps(obj[key]);
  }
  return result;
}

export interface Supplier {
  id?: string;
  shopId: string;
  name: string;
  email: string;
  phone: string;
  gstin?: string;
  address?: string;
  isActive: boolean;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  variantSku: string;
  variantName: string;
  quantity: number;
  costPrice: number;
  amount: number;
}

export interface PurchaseOrder {
  id?: string;
  shopId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'partially_received' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  orderDate: string;
}

export interface GoodsReceivedItem {
  productId: string;
  productName: string;
  variantSku: string;
  variantName: string;
  quantity?: number;
  orderedQty: number;
  receivedQty: number;
  [key: string]: any;
}

export interface PurchaseReturn {
  id?: string;
  shopId?: string;
  supplierId?: string;
  returnNumber: string;
  supplierName: string;
  items?: PurchaseReturnItem[];
  totalAmount: number;
  returnDate: string;
  notes?: string;
  [key: string]: any;
}

export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  variantSku: string;
  variantName: string;
  quantity?: number;
  returnQty: number;
  costPrice: number;
  amount: number;
  [key: string]: any;
}

export interface SupplierPayment {
  id?: string;
  shopId?: string;
  supplierId?: string;
  amount: number;
  paymentNumber: string;
  poNumber: string;
  supplierName: string;
  paymentMethod: string;
  paymentDate: string;
  referenceNo?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/purchases`;

  // Suppliers CRUD
  getSuppliers(shopId: string): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${this.apiUrl}/suppliers?shopId=${shopId}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.apiUrl}/suppliers`, supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/suppliers/${id}`);
  }

  // Purchase Orders CRUD
  getPurchaseOrders(shopId: string): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.get<ApiResponse<PurchaseOrder[]>>(`${this.apiUrl}/orders?shopId=${shopId}`).pipe(
      map(res => {
        res.data = convertTimestamps(res.data);
        return res;
      })
    );
  }

  getPurchaseOrder(id: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.get<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/orders/${id}`).pipe(
      map(res => {
        res.data = convertTimestamps(res.data);
        return res;
      })
    );
  }

  createPurchaseOrder(order: Partial<PurchaseOrder>): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/orders`, order);
  }

  updatePurchaseOrder(id: string, order: Partial<PurchaseOrder>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/orders/${id}`, order);
  }

  deletePurchaseOrder(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/orders/${id}`);
  }

  // Goods Received Note CRUD
  getGoodsReceived(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/received?shopId=${shopId}`).pipe(
      map(res => {
        res.data = convertTimestamps(res.data);
        return res;
      })
    );
  }

  createGoodsReceived(grn: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/received`, grn);
  }

  // Supplier Payments CRUD
  getSupplierPayments(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/payments?shopId=${shopId}`).pipe(
      map(res => {
        res.data = convertTimestamps(res.data);
        return res;
      })
    );
  }

  createSupplierPayment(payment: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/payments`, payment);
  }

  // Purchase Returns CRUD
  getPurchaseReturns(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/returns?shopId=${shopId}`).pipe(
      map(res => {
        res.data = convertTimestamps(res.data);
        return res;
      })
    );
  }

  createPurchaseReturn(ret: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/returns`, ret);
  }
}
