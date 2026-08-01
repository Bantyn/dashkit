import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OfflinePosCounter {
  id: string;
  shopId: string;
  branchId?: string | null;
  branchName?: string;
  name: string;
  description?: string;
  counterId: string;
  apiKey: string;
  secretHash?: string;
  status: 'active' | 'disabled' | 'revoked';
  location?: string;
  appVersion?: string;
  os?: string;
  desktopName?: string;
  ipAddress?: string;
  lastConnectedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string;
  deviceStatus?: 'online' | 'offline';
}

export interface CounterCredentialsResult {
  counter: OfflinePosCounter;
  counterId: string;
  apiKey: string;
  secretKey: string;
  connectionUrl: string;
}

export interface OfflinePosLog {
  id: string;
  shopId: string;
  counterId: string;
  action: string;
  performedBy: string;
  details?: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflinePosService {
  private apiUrl = `${environment.apiUrl}/offline-pos`;

  constructor(private http: HttpClient) {}

  getCounters(shopId: string): Observable<{ success: boolean; data: OfflinePosCounter[] }> {
    return this.http.get<{ success: boolean; data: OfflinePosCounter[] }>(`${this.apiUrl}/counters?shopId=${shopId}`);
  }

  createCounter(data: { name: string; description?: string; branchId?: string; location?: string }): Observable<{ success: boolean; data: CounterCredentialsResult }> {
    return this.http.post<{ success: boolean; data: CounterCredentialsResult }>(`${this.apiUrl}/counters`, data);
  }

  updateCounter(id: string, data: Partial<OfflinePosCounter>): Observable<{ success: boolean; data: OfflinePosCounter }> {
    return this.http.put<{ success: boolean; data: OfflinePosCounter }>(`${this.apiUrl}/counters/${id}`, data);
  }

  deleteCounter(id: string, shopId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/counters/${id}?shopId=${shopId}`);
  }

  regenerateCredentials(id: string): Observable<{ success: boolean; data: { apiKey: string; secretKey: string } }> {
    return this.http.post<{ success: boolean; data: { apiKey: string; secretKey: string } }>(`${this.apiUrl}/counters/${id}/regenerate`, {});
  }

  getLogs(shopId: string): Observable<{ success: boolean; data: OfflinePosLog[] }> {
    return this.http.get<{ success: boolean; data: OfflinePosLog[] }>(`${this.apiUrl}/logs?shopId=${shopId}`);
  }
}
