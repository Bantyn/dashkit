import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto  p-8">
      <div class="card">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
        <p class="text-gray-600">Super admin dashboard coming soon...</p>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {}
