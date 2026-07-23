import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-profile',
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div class="card">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
        <p class="text-gray-600">Customer profile page coming soon...</p>
      </div>
    </div>
  `,
})
export class CustomerProfileComponent {}
