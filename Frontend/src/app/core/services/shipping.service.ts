import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShiprocketStatus {
  connected: boolean;
  status: 'connected' | 'not_connected' | 'token_expired';
  email: string | null;
  defaultPickupLocation: string | null;
  tokenExpiry: string | null;
}

export interface PickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
}

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private get base() {
    return environment.apiUrl;
  }

  constructor(private http: HttpClient) {}

  /** Connect a Shiprocket account for a shop */
  connectShiprocket(shopId: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/shops/${shopId}/shiprocket/connect`, {
      email,
      password,
    });
  }

  /** Get current Shiprocket connection status */
  getStatus(shopId: string): Observable<{ data: ShiprocketStatus }> {
    return this.http.get<{ data: ShiprocketStatus }>(
      `${this.base}/shops/${shopId}/shiprocket/status`,
    );
  }

  /** Fetch fresh pickup locations using stored token */
  getPickupLocations(shopId: string): Observable<{ data: { pickupLocations: PickupLocation[] } }> {
    return this.http.get<{ data: { pickupLocations: PickupLocation[] } }>(
      `${this.base}/shops/${shopId}/shiprocket/pickup-locations`,
    );
  }

  /** Test active connection */
  testConnection(shopId: string): Observable<any> {
    return this.http.post(`${this.base}/shops/${shopId}/shiprocket/test`, {});
  }

  /** Save the default pickup location */
  setDefaultPickupLocation(shopId: string, pickupLocationName: string): Observable<any> {
    return this.http.put(`${this.base}/shops/${shopId}/shiprocket/pickup-location`, {
      pickupLocationName,
    });
  }

  /** Disconnect Shiprocket */
  disconnect(shopId: string): Observable<any> {
    return this.http.post(`${this.base}/shops/${shopId}/shiprocket/disconnect`, {});
  }
}
