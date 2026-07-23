import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Added FormsModule
import { StaffService, Staff } from '../../core/services/staff.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';

@Component({
  selector: 'app-staff-commission',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex overflow-hidden">
      <!-- Left Panel: Commission List -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-gray-50 transition-all duration-300">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-gray-900">Commission Earnings</h2>
          <div class="flex items-center gap-2">
             <button class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all" title="Filter by Date">
               <i class="bi bi-calendar text-sm"></i>
             </button>
             <button class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:shadow-md transition-all" title="Download">
               <i class="bi bi-download text-sm"></i>
             </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="p-4 flex gap-4 bg-white shrink-0">
           <div class="relative flex-1">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search staff..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            />
          </div>
          <select
            [(ngModel)]="selectedMonth"
            class="px-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="all">Year to Date</option>
          </select>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto custom-scrollbar p-4">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Sales</div>
              <div class="text-xl font-bold text-gray-900 mt-1">₹{{ 1450000 | number }}</div>
            </div>
             <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Commission</div>
              <div class="text-xl font-bold text-primary-600 mt-1">₹{{ 43500 | number }}</div>
            </div>
             <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding</div>
              <div class="text-xl font-bold text-orange-600 mt-1">₹{{ 12000 | number }}</div>
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th class="px-6 py-3">Staff Member</th>
                  <th class="px-6 py-3 text-right">Sales</th>
                  <th class="px-6 py-3 text-right">Commission</th>
                  <th class="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading) {
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                      <app-ui-loading size="md"></app-ui-loading>
                    </td>
                  </tr>
                } @else {
                  @for (staff of filteredStaff; track staff.id) {
                    <tr 
                      (click)="selectStaff(staff)"
                      class="cursor-pointer transition-colors hover:bg-gray-50 group"
                      [class.bg-blue-50]="selectedStaff?.id === staff.id"
                    >
                      <td class="px-6 py-4">
                         <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {{ staff.fullName.charAt(0) }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ staff.fullName }}</div>
                            <div class="text-[10px] text-gray-500">{{ staff.role }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">₹{{ (staff.totalSales || 0) | number }}</td>
                      <td class="px-6 py-4 text-sm font-bold text-primary-600 text-right">₹{{ (staff.commissionEarned || 0) | number }}</td>
                      <td class="px-6 py-4 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Paid</span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Breakdown -->
      <div
        class="w-[30%] min-w-[350px] bg-white border-l border-gray-200 flex flex-col h-full sticky top-0"
        *ngIf="selectedStaff"
      >
        <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start shrink-0">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Breakdown</h3>
            <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">{{ selectedStaff.fullName }}</p>
          </div>
          <button class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <i class="bi bi-printer text-lg"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 text-center">
            <div class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Net Payable</div>
            <div class="text-3xl font-black text-blue-600 mt-1">₹{{ (selectedStaff.commissionEarned || 0) | number }}</div>
            <div class="text-[10px] text-blue-500 mt-2 italic">Based on {{ selectedStaff.commissionRate }}% of Total Sales</div>
          </div>

          <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Recent Sales</h4>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div>
                  <div class="text-sm font-bold text-gray-900">#ORD-5678</div>
                  <div class="text-[10px] text-gray-500 italic">Today, 02:30 PM</div>
               </div>
               <div class="text-right">
                  <div class="text-sm font-bold text-gray-900">₹4,500</div>
                  <div class="text-[10px] text-primary-600 font-bold">Comm: ₹135</div>
               </div>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div>
                  <div class="text-sm font-bold text-gray-900">#ORD-5675</div>
                  <div class="text-[10px] text-gray-500 italic">Yesterday, 11:20 AM</div>
               </div>
               <div class="text-right">
                  <div class="text-sm font-bold text-gray-900">₹12,400</div>
                  <div class="text-[10px] text-primary-600 font-bold">Comm: ₹372</div>
               </div>
            </div>
          </div>

          <button class="w-full mt-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary-100">
            Process Payment
          </button>
        </div>
      </div>

       <!-- Empty State -->
       <div
        *ngIf="!selectedStaff"
        class="hidden md:flex flex-col items-center justify-center w-[30%] min-w-[350px] bg-white border-l border-gray-200 text-center p-8 h-full sticky top-0"
      >
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <i class="bi bi-coin text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-gray-900 font-medium mb-1">No staff selected</h3>
        <p class="text-gray-500 text-sm">Select a member to see their earnings breakdown.</p>
      </div>
    </div>

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
export class StaffCommissionComponent implements OnInit {
  staffList: Staff[] = [];
  loading = true;
  shopId = '';
  searchQuery = '';
  selectedMonth = 'current';
  selectedStaff: Staff | null = null;

  constructor(
    private staffService: StaffService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId') || '';
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    this.staffService.getStaff(this.shopId).subscribe(res => {
      this.staffList = res.data;
      this.loading = false;
      if (this.staffList.length > 0 && window.innerWidth >= 768) {
        this.selectedStaff = this.staffList[0];
      }
    });
  }

  get filteredStaff() {
    if (!this.searchQuery) return this.staffList;
    const q = this.searchQuery.toLowerCase();
    return this.staffList.filter(s => s.fullName.toLowerCase().includes(q));
  }

  selectStaff(staff: Staff) {
    this.selectedStaff = staff;
  }
}
