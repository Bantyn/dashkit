import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BranchSummary } from '../../../core/services/branch.service';

@Component({
  selector: 'app-branch-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      (click)="onClick.emit(branch.id)"
      class="group p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
    >
      <!-- Background Ornament -->
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

      <!-- Header -->
      <div class="flex justify-between items-start mb-6 relative z-10">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg group-hover:bg-primary-600 transition-colors">
            <i class="bi bi-shop text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors capitalize tracking-tight">{{ branch.name }}</h3>
            <div class="flex items-center gap-1.5 mt-0.5">
              <i class="bi bi-geo-alt text-[10px] text-gray-400"></i>
              <span class="text-[11px] font-bold text-gray-400 truncate max-w-[150px]">{{ branch.address }}</span>
            </div>
          </div>
        </div>
        <span 
          [class]="'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ' + 
          (branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')"
        >
          {{ branch.status }}
        </span>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-3 gap-2 relative z-10">
        <div class="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
          <div class="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Sales</div>
          <div class="text-sm font-black text-gray-900">₹{{ branch.metrics.sales | number }}</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-2xl group-hover:bg-purple-50 transition-colors">
          <div class="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Orders</div>
          <div class="text-sm font-black text-gray-900">{{ branch.metrics.orders | number }}</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-2xl group-hover:bg-green-50 transition-colors">
          <div class="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Revenue</div>
          <div class="text-sm font-black text-gray-900 font-mono">₹{{ branch.metrics.revenue | number }}</div>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between relative z-10">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">View Detailed Analytics</span>
        <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
          <i class="bi bi-arrow-right"></i>
        </div>
      </div>
    </div>
  `
})
export class BranchCardComponent {
  @Input({ required: true }) branch!: BranchSummary;
  @Output() onClick = new EventEmitter<string>();
}
