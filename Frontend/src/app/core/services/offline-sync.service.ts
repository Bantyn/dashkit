import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { InvoiceService } from './invoice.service';
import { Invoice } from '../models/invoice.model';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'clothify_offline_invoices';

export interface OfflineInvoice {
  localId: string;
  payload: Partial<Invoice>;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private invoiceService = inject(InvoiceService);
  private toastService = inject(ToastService);

  private onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);
  private pendingCount$ = new BehaviorSubject<number>(this.getPendingQueue().length);
  
  isOnline$ = this.onlineStatus$.asObservable();
  pendingCountObs$ = this.pendingCount$.asObservable();

  constructor() {
    this.initNetworkListeners();
    // Try syncing on initialization if online
    if (navigator.onLine) {
      this.syncPendingInvoices();
    }
  }

  get isOnline(): boolean {
    return this.onlineStatus$.value;
  }

  get pendingCount(): number {
    return this.pendingCount$.value;
  }

  private initNetworkListeners() {
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.onlineStatus$.next(isOnline);
      if (isOnline) {
        this.syncPendingInvoices();
      }
    });
  }

  private getPendingQueue(): OfflineInvoice[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private savePendingQueue(queue: OfflineInvoice[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    this.pendingCount$.next(queue.length);
  }

  saveInvoiceOffline(payload: Partial<Invoice>): string {
    const queue = this.getPendingQueue();
    const localId = 'OFFLINE-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    queue.push({
      localId,
      payload,
      timestamp: Date.now()
    });
    
    this.savePendingQueue(queue);
    return localId;
  }

  private async syncPendingInvoices() {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    this.toastService.showSuccess(`Syncing ${queue.length} offline invoices...`);
    
    let successCount = 0;
    const remainingQueue: OfflineInvoice[] = [];

    for (const item of queue) {
      try {
        // Await the API call to complete
        await new Promise<void>((resolve, reject) => {
          this.invoiceService.createInvoice(item.payload).subscribe({
            next: () => {
              successCount++;
              resolve();
            },
            error: (err) => {
              console.error('Failed to sync offline invoice:', err);
              // Keep it in the queue for the next retry
              remainingQueue.push(item);
              resolve(); // Resolve anyway to continue loop
            }
          });
        });
      } catch (error) {
        remainingQueue.push(item);
      }
    }

    this.savePendingQueue(remainingQueue);

    if (successCount > 0) {
      this.toastService.showSuccess(`Successfully synced ${successCount} invoices to the server!`);
    }
    if (remainingQueue.length > 0) {
      this.toastService.showWarning(`${remainingQueue.length} invoices failed to sync. Will retry later.`);
    }
  }
}
