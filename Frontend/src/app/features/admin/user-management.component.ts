import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto p-8">
      <div class="card">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
        <p class="text-gray-600">Manage all users coming soon...</p>
      </div>
    </div>
  `,
})
export class UserManagementComponent {}
