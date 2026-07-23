import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Page Header -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Activity Logs</h2>
            <p class="text-xs text-gray-500 mt-1">Platform activity and security audit trail.</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
            Total Logs: {{ logs.length }}
          </span>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Search & Filters -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex flex-col md:flex-row gap-3">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filter()"
                placeholder="Search logs by email, action, module, or description…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <div class="flex gap-2">
              <select
                [(ngModel)]="selectedModule"
                (change)="filter()"
                class="px-3 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--color-primary-400)] rounded-lg text-sm outline-none font-medium text-gray-600"
              >
                <option value="all">All Modules</option>
                @for (mod of modules; track mod) {
                  <option [value]="mod">{{ mod }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Table & Pagination -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              
              <div class="overflow-x-auto flex-1">
                @if (loading) {
                  <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400 flex-1">
                    <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                    <span class="text-sm">Loading activity logs…</span>
                  </div>
                } @else if (paginatedLogs.length === 0) {
                  <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1">
                    <i class="bi bi-journal-text text-4xl text-gray-300"></i>
                    <p class="text-sm font-bold">No activity logs found.</p>
                  </div>
                } @else {
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500 sticky top-0 z-10">
                        <th class="px-6 py-4">User</th>
                        <th class="px-6 py-4">Module</th>
                        <th class="px-6 py-4">Action</th>
                        <th class="px-6 py-4">Description</th>
                        <th class="px-6 py-4">IP Address</th>
                        <th class="px-6 py-4">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (log of paginatedLogs; track log.id) {
                        <tr
                          (click)="selectedLog = log"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedLog?.id === log.id"
                        >
                          <td class="px-6 py-4 font-bold text-gray-900">
                            {{ log.email }}
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                              {{ log.module }}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {{ log.action }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" [title]="log.description">
                            {{ log.description }}
                          </td>
                          <td class="px-6 py-4 text-gray-500 font-mono text-xs">{{ log.ipAddress }}</td>
                          <td class="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                            {{ formatDate(log.timestamp) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>

              <!-- Pagination Footer -->
              @if (filtered.length > pageSize) {
                <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-white">
                  <div class="text-xs text-gray-500">
                    Showing {{ (page - 1) * pageSize + 1 }} to {{ Math.min(page * pageSize, filtered.length) }} of {{ filtered.length }} logs
                  </div>
                  <div class="flex gap-2">
                    <button
                      [disabled]="page === 1"
                      (click)="prevPage()"
                      class="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-xs font-medium"
                    >
                      Previous
                    </button>
                    <button
                      [disabled]="page * pageSize >= filtered.length"
                      (click)="nextPage()"
                      class="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-xs font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              }

            </div>
          </div>
        </div>

        <!-- Right Panel (Short Info) -->
        <div *ngIf="selectedLog" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Log Details</h3>
            <button (click)="selectedLog = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-xl mb-3 shadow-sm border border-indigo-100">
                <i class="bi bi-journal-text text-lg"></i>
              </div>
              <h4 class="font-bold text-gray-900 text-sm leading-tight break-all">{{ selectedLog.email }}</h4>
              <p class="text-xs text-gray-450 font-mono mt-1">IP: {{ selectedLog.ipAddress }}</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border bg-blue-50 text-blue-700 border-blue-100"
                >
                  {{ selectedLog.action }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Module</span>
                <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-gray-100 text-gray-700 border-gray-250">{{ selectedLog.module || '—' }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
                <div class="bg-white p-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {{ selectedLog.description || 'No description provided.' }}
                </div>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Device / User Agent</span>
                <div class="bg-white p-3 rounded-lg border border-gray-200 text-[11px] font-mono text-gray-500 break-words leading-normal">
                  {{ selectedLog.device || '—' }}
                </div>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date & Time</span>
                <span class="text-sm font-bold text-gray-950">{{ formatDate(selectedLog.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminActivityLogsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  logs: any[] = [];
  filtered: any[] = [];
  selectedLog: any | null = null;
  search = '';
  selectedModule = 'all';
  modules: string[] = [];
  loading = false;

  // Pagination
  page = 1;
  pageSize = 15;
  Math = Math;

  ngOnInit() { this.load(); }

  async load() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getActivityLogs(''));
      this.logs = res.data || [];
      
      // Extract unique modules
      const modSet = new Set<string>();
      this.logs.forEach(l => { if (l.module) modSet.add(l.module); });
      this.modules = Array.from(modSet).sort();

      this.filtered = [...this.logs];
    } catch { } finally { this.loading = false; }
  }

  filter() {
    this.page = 1;
    const q = this.search.toLowerCase();
    this.filtered = this.logs.filter(l => {
      const matchesSearch = !q ||
        l.email.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.module || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q);
      
      const matchesModule = this.selectedModule === 'all' || l.module === this.selectedModule;

      return matchesSearch && matchesModule;
    });
  }

  get paginatedLogs() {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page * this.pageSize < this.filtered.length) this.page++;
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
