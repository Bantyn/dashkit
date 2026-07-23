import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-staffs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Page Header -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Staff Management</h2>
            <p class="text-xs text-gray-500 mt-1">Manage all shop staff members across the platform.</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 shadow-sm">
            Total: {{ staffList.length }} Staff
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
                placeholder="Search staff by name, email, department or role…"
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
                  <span class="text-sm">Loading staff…</span>
                </div>
              } @else if (filtered.length === 0) {
                <div class="p-12 flex flex-col items-center justify-center gap-2 text-gray-400 flex-1">
                  <i class="bi bi-people text-4xl text-gray-300"></i>
                  <p class="text-sm font-bold">No staff members found.</p>
                </div>
              } @else {
                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th class="px-6 py-4">Staff Name</th>
                        <th class="px-6 py-4">Email</th>
                        <th class="px-6 py-4">Department</th>
                        <th class="px-6 py-4">Role</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Last Login</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                      @for (staff of filtered; track staff.id) {
                        <tr
                          (click)="selectedStaff = staff"
                          class="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          [class.bg-[var(--color-gray-50)]]="selectedStaff?.id === staff.id"
                        >
                          <td class="px-6 py-4 font-semibold text-gray-900">
                            <div class="flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {{ staff.fullName.charAt(0).toUpperCase() }}
                              </div>
                              <div>
                                <div class="font-bold text-gray-900 text-sm">{{ staff.fullName }}</div>
                                <div class="text-[10px] text-gray-400">Shop: {{ staff.shopId || '—' }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ staff.email }}</td>
                          <td class="px-6 py-4 text-gray-500 font-medium">{{ staff.department }}</td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 border border-blue-100">{{ staff.role }}</span>
                          </td>
                          <td class="px-6 py-4">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                              [class.bg-green-50]="staff.status === 'Active'"
                              [class.text-green-700]="staff.status === 'Active'"
                              [class.border-green-100]="staff.status === 'Active'"
                              [class.bg-gray-100]="staff.status !== 'Active'"
                              [class.text-gray-600]="staff.status !== 'Active'"
                              [class.border-gray-250]="staff.status !== 'Active'"
                            >
                              {{ staff.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-gray-500 text-xs">{{ formatDate(staff.lastLogin) }}</td>
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
        <div *ngIf="selectedStaff" class="w-[30%] xl:w-[420px] min-w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20  overflow-hidden">
          <!-- Header -->
          <div class="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Staff Details</h3>
            <button (click)="selectedStaff = null" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div class="w-16 h-16 rounded-3xl bg-blue-50 text-blue-700 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-sm border border-blue-200">
                {{ staffInitials }}
              </div>
              <h4 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedStaff.fullName }}</h4>
              <p class="text-xs text-gray-400 font-mono mt-1">Shop ID: {{ selectedStaff.shopId || '—' }}</p>
              <div class="mt-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border"
                  [class.bg-green-50]="selectedStaff.status === 'Active'"
                  [class.text-green-700]="selectedStaff.status === 'Active'"
                  [class.border-green-100]="selectedStaff.status === 'Active'"
                  [class.bg-gray-100]="selectedStaff.status !== 'Active'"
                  [class.text-gray-600]="selectedStaff.status !== 'Active'"
                  [class.border-gray-250]="selectedStaff.status !== 'Active'"
                >
                  {{ selectedStaff.status }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-4">
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</span>
                <a href="mailto:{{ selectedStaff.email }}" class="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors">{{ selectedStaff.email || '—' }}</a>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</span>
                <span class="text-sm font-bold text-gray-950">{{ selectedStaff.department || '—' }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</span>
                <span class="inline-flex text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                  {{ selectedStaff.role }}
                </span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Login</span>
                <span class="text-sm font-bold text-gray-800">{{ formatDate(selectedStaff.lastLogin) }}</span>
              </div>
              <div>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Modules</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  @if (selectedStaff.assignedModules && selectedStaff.assignedModules.length > 0) {
                    @for (mod of selectedStaff.assignedModules; track mod) {
                      <span class="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600">{{ mod }}</span>
                    }
                  } @else {
                    <span class="text-xs text-gray-500 font-medium">None</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            <button
              class="w-full px-4 py-2.5 bg-primary-700 text-white font-bold rounded-xl hover:bg-black transition-all text-xs uppercase tracking-wider text-center"
            >
              View Activity Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminStaffsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  staffList: any[] = [];
  filtered: any[] = [];
  selectedStaff: any | null = null;
  search = '';
  loading = false;

  get staffInitials() {
    if (!this.selectedStaff) return 'S';
    return (this.selectedStaff.fullName || 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit() { this.load(); }

  async load() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getStaff(''));
      this.staffList = res.data || [];
      this.filtered = [...this.staffList];
    } catch { } finally { this.loading = false; }
  }

  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.staffList.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
