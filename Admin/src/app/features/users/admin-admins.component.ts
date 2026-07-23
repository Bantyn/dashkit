import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, AdminUser } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Page Header -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Admins</h2>
            <p class="text-xs text-gray-500 mt-1">Platform administrators and their access levels.</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
            <i class="bi bi-shield-lock"></i> {{ admins.length }} Admins
          </span>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          
          <!-- Search -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0">
            <div class="relative">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (input)="filter()"
                placeholder="Search admin by name or email…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (loading) {
                <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400 flex-1">
                  <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span class="text-sm">Loading admins…</span>
                </div>
              } @else if (filtered.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1">
                  <i class="bi bi-shield-lock text-4xl text-gray-300"></i>
                  <p class="text-sm font-bold">No admins found.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Admin</th>
                        <th class="px-6 py-4">Email</th>
                        <th class="px-6 py-4">Role</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Last Login</th>
                        <th class="px-6 py-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (admin of filtered; track admin.uid) {
                        <tr
                          (click)="selectedAdmin = admin"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedAdmin?.uid === admin.uid"
                        >
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {{ (admin.displayName || admin.name || 'A').charAt(0).toUpperCase() }}
                              </div>
                              <div class="font-bold text-gray-900 text-sm">{{ admin.displayName || admin.name }}</div>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ admin.email }}</td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-red-50 text-red-700 border border-red-100">Platform Admin</span>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                              [class.bg-green-50]="admin.isActive"
                              [class.text-green-700]="admin.isActive"
                              [class.border-green-100]="admin.isActive"
                              [class.bg-gray-100]="!admin.isActive"
                              [class.text-gray-600]="!admin.isActive"
                              [class.border-gray-250]="!admin.isActive"
                            >
                              {{ admin.isActive ? 'Active' : 'Inactive' }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-gray-500 text-xs">{{ formatDate(admin.lastLogin) }}</td>
                          <td class="px-6 py-4 text-gray-400 text-xs">{{ formatDate(admin.createdAt) }}</td>
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
        <div *ngIf="selectedAdmin" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Admin Details</h3>
            <button (click)="selectedAdmin = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-16 h-16 rounded-3xl bg-red-50 text-red-700 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm border border-red-200">
                {{ (selectedAdmin.displayName || selectedAdmin.name || 'A').charAt(0).toUpperCase() }}
              </div>
              <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedAdmin.displayName || selectedAdmin.name }}</h4>
              <p class="text-xs text-gray-450 font-mono mt-1">UID: {{ selectedAdmin.uid.slice(0, 8) }}…</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                  [class.bg-green-50]="selectedAdmin.isActive"
                  [class.text-green-700]="selectedAdmin.isActive"
                  [class.border-green-100]="selectedAdmin.isActive"
                  [class.bg-gray-100]="!selectedAdmin.isActive"
                  [class.text-gray-600]="!selectedAdmin.isActive"
                  [class.border-gray-250]="!selectedAdmin.isActive"
                >
                  {{ selectedAdmin.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</span>
                <a href="mailto:{{ selectedAdmin.email }}" class="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">{{ selectedAdmin.email || '—' }}</a>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</span>
                <span class="inline-flex text-xs font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">
                  Platform Admin
                </span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Login</span>
                <span class="text-sm font-bold text-gray-800">{{ formatDate(selectedAdmin.lastLogin) }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Joined Date</span>
                <span class="text-sm font-bold text-gray-800">{{ formatDate(selectedAdmin.createdAt) }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Permissions</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  @if (selectedAdmin.permissions && selectedAdmin.permissions.length > 0) {
                    @for (perm of selectedAdmin.permissions; track perm) {
                      <span class="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600">{{ perm }}</span>
                    }
                  } @else {
                    <span class="text-xs text-gray-500 font-medium">Full Administrator Access</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            <button
              class="w-full px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-100/50 transition-all text-xs uppercase tracking-wider text-center"
            >
              Revoke Access
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminAdminsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  admins: AdminUser[] = [];
  filtered: AdminUser[] = [];
  selectedAdmin: AdminUser | null = null;
  search = '';
  loading = false;

  ngOnInit() { this.load(); }

  async load() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getAdmins(''));
      this.admins = res.data || [];
      this.filtered = [...this.admins];
    } catch { } finally { this.loading = false; }
  }


  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.admins.filter(a =>
      (a.displayName || a.name || '').toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
