import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface Expense {
  id: string;
  shopId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNo?: string;
  createdBy?: string;
  transactionId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ExpenseCategory {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getExpenses(shopId: string): Observable<ApiResponse<Expense[]>> {
    return this.http.get<ApiResponse<Expense[]>>(`${this.apiUrl}/shop/${shopId}`);
  }

  createExpense(shopId: string, payload: Partial<Expense>): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.apiUrl}/shop/${shopId}`, payload);
  }

  updateExpense(id: string, payload: Partial<Expense>): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteExpense(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  getCategories(shopId: string): Observable<ApiResponse<ExpenseCategory[]>> {
    return this.http.get<ApiResponse<ExpenseCategory[]>>(`${this.apiUrl}/shop/${shopId}/categories`);
  }

  createCategory(shopId: string, name: string, description?: string): Observable<ApiResponse<ExpenseCategory>> {
    return this.http.post<ApiResponse<ExpenseCategory>>(`${this.apiUrl}/shop/${shopId}/categories`, { name, description });
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/categories/${id}`);
  }
}
