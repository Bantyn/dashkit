import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shop-management',
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto  p-8">
      <div class="card">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Shop Management</h2>
        <p class="text-gray-600">Manage all shops coming soon...</p>
      </div>
    </div>
  `,
})
export class ShopManagementComponent {}
