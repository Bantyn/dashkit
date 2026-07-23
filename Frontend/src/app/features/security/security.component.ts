import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <main class="p-8">
        <div class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
          <div class="text-center p-8 text-gray-500">Security settings coming soon.</div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .card {
        @apply bg-white rounded-2xl shadow-sm p-6 border border-gray-100;
      }
    `,
  ],
})
export class SecurityComponent {}
