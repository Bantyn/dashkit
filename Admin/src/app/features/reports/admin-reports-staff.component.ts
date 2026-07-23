import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-reports-staff',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#f5f7fa]">
      <div class="px-6 pt-6 bg-white border-b border-gray-200 shrink-0">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">Platform Reports</h2>
        <p class="text-sm text-gray-500 mb-6">Analytics and reporting for the entire Clothify platform.</p>
        
      </div>

      <div class="flex-1 overflow-auto p-6 space-y-6">
        <!-- Chart Placeholder -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[400px] text-gray-400">
          <i class="bi bi-person-badge text-6xl mb-4 text-gray-200"></i>
          <p class="text-sm font-medium text-gray-600">Platform staff analytics will appear here.</p>
        </div>
      </div>
    </div>
  `
})
export class AdminReportsStaffComponent {}
