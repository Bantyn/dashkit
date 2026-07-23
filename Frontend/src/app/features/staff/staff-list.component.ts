import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { StaffService, Staff } from '../../core/services/staff.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { StaffProfileComponent } from './staff-profile.component';
import { StaffFormComponent } from './staff-form.component';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiLoadingComponent, StaffProfileComponent, StaffFormComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Staff List -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300 no-print">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Staff Management</h2>
          <div class="flex items-center gap-3">
            <button class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all" title="Filter">
              <i class="bi bi-funnel text-sm"></i>
            </button>
            <button
              (click)="showAddModal = true"
              class="px-4 py-2 bg-primary-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-gray-200"
            >
              <i class="bi bi-person-plus text-lg"></i>
              Add Member
            </button>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="p-4 flex gap-4 bg-white shrink-0">
          <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by name, email or phone..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all"
            />
          </div>
          <select
            [(ngModel)]="selectedRole"
            class="px-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm outline-none transition-all font-medium text-gray-600"
          >
            <option value="">All Roles</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
            <option value="Sales Staff">Sales Staff</option>
            <option value="Inventory Staff">Inventory Staff</option>
          </select>
          <button
            class="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-100 rounded-xl transition-colors bg-white shadow-sm"
          >
            <i class="bi bi-download"></i>
          </button>
        </div>

        <!-- Table List -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th class="px-6 py-4">Staff Member</th>
                  <th class="px-6 py-4 text-center">Contact</th>
                  <th class="px-6 py-4 text-center">Status</th>
                  <th class="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @if (loading) {
                  <tr>
                    <td colspan="4" class="px-6 py-20 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-4">
                        <app-ui-loading size="md"></app-ui-loading>
                        <span class="text-xs font-bold uppercase tracking-widest text-gray-400">Syncing with server...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (filteredStaff.length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-20 text-center">
                       <div class="flex flex-col items-center gap-2">
                          <i class="bi bi-people text-4xl text-gray-200"></i>
                          <p class="text-gray-400 font-medium">No results found for your search.</p>
                       </div>
                    </td>
                  </tr>
                } @else {
                  @for (staff of filteredStaff; track staff.id) {
                    <tr
                      (click)="selectStaff(staff)"
                      class="cursor-pointer transition-all hover:bg-blue-50/30 group border-l-4 border-transparent"
                      [class.bg-blue-50]="selectedStaff?.id === staff.id"
                      [class.border-l-primary-500]="selectedStaff?.id === staff.id"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary-600 font-bold text-sm border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                            {{ staff.fullName.charAt(0) }}
                          </div>
                          <div>
                            <div class="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                              {{ staff.fullName }}
                            </div>
                            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">ID: #ST{{ staff.id.slice(-4) }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="text-[11px] text-gray-800 font-bold">{{ staff.phoneNumber }}</div>
                        <div class="text-[10px] text-gray-400 font-medium lowercase">{{ staff.email }}</div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span [class]="'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ' + (staff.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')">
                          {{ staff.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                         <div class="text-xs font-bold text-gray-700">{{ staff.role }}</div>
                         <div class="text-[10px] font-medium text-gray-400">{{ staff.branch }}</div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Staff Profile -->
      <div
        class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0 overflow-hidden"
        *ngIf="selectedStaff"
      >
        <app-staff-profile 
            [staffId]="selectedStaff.id" 
            (onEdit)="onEditStaff($event)"
            (onDeleted)="onStaffDeleted()"
        ></app-staff-profile>
      </div>

      <!-- Empty State for Detail View -->
      <div
        *ngIf="!selectedStaff && !loading"
        class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8 no-print h-full sticky top-0"
      >
        <div class="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100">
          <i class="bi bi-fingerprint text-3xl text-gray-300"></i>
        </div>
        <h3 class="text-gray-900 font-bold mb-2">Member Details</h3>
        <p class="text-gray-400 text-sm max-w-[200px]">Select a staff member to view full profile, access rights, and activity history.</p>
      </div>
    </div>

    <!-- Modals -->
    <app-staff-form
      *ngIf="showAddModal"
      (close)="showAddModal = false"
      (onSaved)="loadStaff()"
    ></app-staff-form>

    <app-staff-form
      *ngIf="showEditModal"
      [staffId]="editStaffId"
      (close)="showEditModal = false; editStaffId = ''"
      (onSaved)="loadStaff()"
    ></app-staff-form>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 3px;
      }
    </style>
  `
})
export class StaffListComponent implements OnInit {
  staffList: Staff[] = [];
  loading = true;
  searchQuery = '';
  selectedRole = '';
  shopId = '';
  selectedStaff: Staff | null = null;
  showAddModal = false;
  showEditModal = false;
  editStaffId = '';
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private staffService: StaffService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const shopId = params.get('shopId') || '';
      if (!shopId || shopId === this.shopId) {
        return;
      }

      this.shopId = shopId;
      this.loadStaff();
    });
  }

  loadStaff() {
    if (!this.shopId) return;
    this.loading = true;
    this.staffService.getStaff(this.shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.ngZone.run(() => {
        this.staffList = res.data || [];
        this.loading = false;
        if (this.staffList.length > 0 && !this.selectedStaff && window.innerWidth >= 768) {
          this.selectedStaff = this.staffList[0];
        } else if (this.selectedStaff) {
           const updated = this.staffList.find(s => s.id === this.selectedStaff?.id);
           if (updated) this.selectedStaff = updated;
        }
        this.cdr.detectChanges();
      });
    });
  }

  get filteredStaff() {
    let list = this.staffList;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s => 
        s.fullName.toLowerCase().includes(q) || 
        s.email.toLowerCase().includes(q) || 
        s.phoneNumber.includes(q)
      );
    }
    if (this.selectedRole) {
      list = list.filter(s => s.role === this.selectedRole);
    }
    return list;
  }

  selectStaff(staff: Staff) {
    this.selectedStaff = staff;
  }

  onEditStaff(id: string) {
     this.editStaffId = id;
     this.showEditModal = true;
  }

  onStaffDeleted() {
     this.selectedStaff = null;
     this.loadStaff();
  }
}
