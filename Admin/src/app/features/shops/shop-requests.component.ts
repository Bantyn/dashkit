import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-shop-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Shop Requests</h2>
            <p class="text-xs text-gray-500 mt-1">Manage deactivation and reactivation requests from shop owners.</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="loadRequests()"
              class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Table Panel -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (loading) {
                <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span class="text-sm">Loading requests…</span>
                </div>
              } @else if (error) {
                <div class="p-12 text-center text-red-600 flex flex-col items-center justify-center">
                  <p class="text-sm font-medium">{{ error }}</p>
                  <button (click)="loadRequests()" class="mt-4 text-xs font-bold uppercase tracking-wider underline hover:text-red-800 transition-colors">Try Again</button>
                </div>
              } @else if (requests.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <i class="bi bi-inbox text-4xl mb-2 text-gray-300"></i>
                  <p class="text-sm">No pending requests at the moment.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Shop Details</th>
                        <th class="px-6 py-4">Type</th>
                        <th class="px-6 py-4">Reason</th>
                        <th class="px-6 py-4">Requested On</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (req of requests; track req.id) {
                        <tr
                          (click)="selectedRequest = req"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedRequest?.id === req.id"
                        >
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                                {{ (req.shopName || 'S').charAt(0).toUpperCase() }}
                              </div>
                              <div>
                                <div class="font-bold text-gray-900 text-sm">{{ req.shopName }}</div>
                                <div class="text-[10px] text-gray-400 font-mono mt-0.5">{{ req.shopId }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border"
                                  [ngClass]="req.type === 'reactivation' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'">
                              {{ req.type === 'reactivation' ? 'Reactivation' : 'Deactivation' }}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="max-w-xs truncate text-gray-600 text-xs" [title]="req.reason">{{ req.reason }}</div>
                          </td>
                          <td class="px-6 py-4 text-gray-400 text-[11px]">{{ formatDate(req.createdAt) }}</td>
                          <td class="px-6 py-4 text-right space-x-2">
                            <button
                              (click)="$event.stopPropagation(); processRequest(req.id, 'reject')"
                              [disabled]="processingId === req.id"
                              class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 bg-white"
                            >
                              Reject
                            </button>
                            <button
                              (click)="$event.stopPropagation(); processRequest(req.id, 'approve')"
                              [disabled]="processingId === req.id"
                              class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white border border-transparent rounded-lg transition-colors disabled:opacity-50 shadow-sm inline-flex items-center"
                              [ngClass]="req.type === 'reactivation' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'"
                            >
                              @if (processingId === req.id && currentAction === 'approve') {
                                <i class="bi bi-hourglass-split animate-spin mr-1.5"></i>
                              }
                              Approve
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Short Info) -->
        <div *ngIf="selectedRequest" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Request Details</h3>
            <button (click)="selectedRequest = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-16 h-16 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm text-gray-700">
                {{ (selectedRequest.shopName || 'S').charAt(0).toUpperCase() }}
              </div>
              <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedRequest.shopName }}</h4>
              <p class="text-xs text-gray-400 font-mono mt-1">Shop ID: {{ selectedRequest.shopId }}</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border"
                      [ngClass]="selectedRequest.type === 'reactivation' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'">
                  {{ selectedRequest.type === 'reactivation' ? 'Reactivation Request' : 'Deactivation Request' }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Requested On</span>
                <span class="text-sm font-bold text-gray-900">{{ formatDate(selectedRequest.createdAt) }}</span>
              </div>

              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason</span>
                <div class="bg-white p-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {{ selectedRequest.reason || 'No reason provided.' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            <button
              (click)="processRequest(selectedRequest.id, 'reject')"
              [disabled]="processingId === selectedRequest.id"
              class="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-xs uppercase tracking-wider text-center disabled:opacity-50"
            >
              Reject
            </button>
            <button
              (click)="processRequest(selectedRequest.id, 'approve')"
              [disabled]="processingId === selectedRequest.id"
              class="flex-1 px-4 py-2.5 text-white font-bold rounded-xl hover:opacity-90 transition-all text-xs uppercase tracking-wider text-center disabled:opacity-50"
              [ngClass]="selectedRequest.type === 'reactivation' ? 'bg-green-600' : 'bg-red-600'"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ShopRequestsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toastService = inject(ToastService);
  requests: any[] = [];
  selectedRequest: any | null = null;
  loading = true;
  error = '';
  processingId: string | null = null;
  currentAction: 'approve' | 'reject' | null = null;

  ngOnInit() { this.loadRequests(); }

  async loadRequests() {
    this.loading = true;
    this.error = '';
    try {
      const res = await firstValueFrom(this.adminApi.getShopRequests());
      this.requests = res.data || [];
    } catch (e: any) {
      this.error = e.error?.message || 'Failed to load requests';
    } finally {
      this.loading = false;
    }
  }

  async processRequest(id: string, action: 'approve' | 'reject') {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    this.processingId = id;
    this.currentAction = action;
    try {
      await firstValueFrom(this.adminApi.processShopRequest(id, action));
      this.toastService.showSuccess(`Request ${action}d successfully`);
      await this.loadRequests();
    } catch (e: any) {
      this.toastService.showError(e.error?.message || `Failed to ${action} request`);
    } finally {
      this.processingId = null;
      this.currentAction = null;
    }
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
