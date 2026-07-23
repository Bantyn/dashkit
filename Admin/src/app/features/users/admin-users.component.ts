import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, AdminUser } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">All Users</h2>
            <p class="text-xs text-gray-500 mt-1">Manage all shop owners and users on the platform.</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 shadow-sm">
              Total: {{ users.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="w-full md:w-[70%] flex flex-col min-w-0 bg-gray-50 transition-all duration-300 border-r border-gray-200 overflow-hidden">
          
          <!-- Search & Filter Bar -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 flex gap-4">
            <div class="relative flex-1">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="search"
                (keyup.enter)="loadUsers()"
                placeholder="Search by name, email, mobile or shop ID…"
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            <button
              (click)="loadUsers()"
              class="bg-primary-700 text-white hover:bg-black transition-colors rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm shrink-0"
            >
              Search
            </button>
          </div>

          <!-- Table Panel -->
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
              @if (loading) {
                <div class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400 flex-1">
                  <div class="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                  <span class="text-sm">Loading users…</span>
                </div>
              } @else if (users.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1">
                  <i class="bi bi-people text-4xl text-gray-300"></i>
                  <p class="text-sm font-bold">No users found.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">User</th>
                        <th class="px-6 py-4">Contact</th>
                        <th class="px-6 py-4">Shop ID</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (user of users; track user.uid) {
                        <tr
                          (click)="selectedUser = user"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedUser?.uid === user.uid"
                        >
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-700)] flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {{ (user.displayName || user.name || 'U').charAt(0).toUpperCase() }}
                              </div>
                              <div>
                                <div class="font-bold text-gray-900 text-sm">{{ user.displayName || user.name }}</div>
                                <div class="text-[11px] text-gray-400">{{ user.email }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ user.mobile || '—' }}</td>
                          <td class="px-6 py-4">
                            <span class="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{{ user.shopId || '—' }}</span>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                              [class.bg-green-50]="user.isActive"
                              [class.text-green-700]="user.isActive"
                              [class.border-green-100]="user.isActive"
                              [class.bg-red-50]="!user.isActive"
                              [class.text-red-700]="!user.isActive"
                              [class.border-red-100]="!user.isActive"
                            >
                              {{ user.isActive ? 'Active' : 'Inactive' }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-gray-400 text-[11px]">{{ formatDate(user.createdAt) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel (Details) -->
        <div class="w-full md:w-[30%] flex flex-col bg-white overflow-hidden transition-all duration-300 transform translate-x-0">
          @if (selectedUser) {
            <!-- Header -->
            <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white z-10">
              <div>
                <h3 class="text-lg font-bold text-gray-900">User Details</h3>
                <p class="text-xs font-normal text-gray-500 tracking-wider mt-1">Profile and status information.</p>
              </div>
              <button (click)="selectedUser = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
              <div class="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                <div class="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm border border-indigo-200">
                  {{ (selectedUser.displayName || selectedUser.name || 'U').charAt(0).toUpperCase() }}
                </div>
                <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedUser.displayName || selectedUser.name }}</h4>
                <p class="text-xs text-gray-400 font-mono mt-1">UID: {{ selectedUser.uid.slice(0, 8) }}…</p>
                <div class="mt-3">
                  <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                    [class.bg-green-50]="selectedUser.isActive"
                    [class.text-green-700]="selectedUser.isActive"
                    [class.border-green-100]="selectedUser.isActive"
                    [class.bg-red-50]="!selectedUser.isActive"
                    [class.text-red-700]="!selectedUser.isActive"
                    [class.border-red-100]="!selectedUser.isActive"
                  >
                    {{ selectedUser.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>

              <!-- Details -->
              <div class="space-y-4">
                <div>
                  <span class="block text-[11px] font-normal tracking-wider text-gray-700 mb-1">Email Address</span>
                  <a href="mailto:{{ selectedUser.email }}" class="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">{{ selectedUser.email || '—' }}</a>
                </div>
                <div>
                  <span class="block text-[11px] font-normal tracking-wider text-gray-700 mb-1">Phone Number</span>
                  <span class="text-sm font-bold text-gray-900">{{ selectedUser.mobile || '—' }}</span>
                </div>
                <div>
                  <span class="block text-[11px] font-normal tracking-wider text-gray-700 mb-1">Associated Shop ID</span>
                  <span class="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 inline-block">{{ selectedUser.shopId || '—' }}</span>
                </div>
                <div>
                  <span class="block text-[11px] font-normal tracking-wider text-gray-700 mb-1">Joined Date</span>
                  <span class="text-sm font-bold text-gray-900">{{ formatDate(selectedUser.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="p-6 bg-white border-t border-gray-200 shrink-0 flex items-center justify-end gap-3 z-20">
              <button
                (click)="toggleBlock(selectedUser)"
                [disabled]="processingUid === selectedUser.uid"
                class="w-full px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border"
                [class.bg-white]="!selectedUser.isBlocked"
                [class.border-red-200]="!selectedUser.isBlocked"
                [class.text-red-600]="!selectedUser.isBlocked"
                [class.hover:bg-red-50]="!selectedUser.isBlocked"
                [class.bg-[var(--color-primary-600)]]="selectedUser.isBlocked"
                [class.border-transparent]="selectedUser.isBlocked"
                [class.text-white]="selectedUser.isBlocked"
                [class.hover:bg-[var(--color-primary-700)]]="selectedUser.isBlocked"
              >
                {{ selectedUser.isBlocked ? 'Unblock User' : 'Block User' }}
              </button>
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-gray-400 bg-gray-50/30">
              <div class="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <i class="bi bi-person-bounding-box text-2xl text-gray-300"></i>
              </div>
              <h3 class="text-sm font-bold text-gray-900 mb-1">No User Selected</h3>
              <p class="text-xs text-center">Select a user from the list to view their details.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  users: AdminUser[] = [];
  selectedUser: AdminUser | null = null;
  search = '';
  loading = false;
  processingUid: string | null = null;

  ngOnInit() { this.loadUsers(); }

  async loadUsers() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getUsers(this.search));
      this.users = res.data || [];
    } catch { } finally { this.loading = false; }
  }

  async toggleBlock(user: AdminUser) {
    // Placeholder - implement with API call if endpoint exists
    console.log('Toggle block for', user.uid);
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
