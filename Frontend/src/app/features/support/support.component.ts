import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-[var(--bg-page)]">
      <main class="p-8">
        <div
          class="bg-white rounded-[var(--radius-xl)] shadow-lg p-8 border border-[var(--border-color)] mb-8"
        >
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-6">Help & Support</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Contact Support -->
            <div class="bg-blue-50 p-6 rounded-[var(--radius-lg)] border border-blue-100">
              <h3 class="text-lg font-bold text-blue-900 mb-2">Contact Support</h3>
              <p class="text-blue-700 mb-4">
                Need help with your shop? Our team is here to assist you.
              </p>
              <ul class="space-y-2 text-blue-800">
                <li class="flex items-center gap-2">
                  <i class="bi bi-envelope"></i>
                  <span>support@clothify.com</span>
                </li>
                <li class="flex items-center gap-2">
                  <i class="bi bi-telephone"></i>
                  <span>+1 (800) 123-4567</span>
                </li>
              </ul>
            </div>

            <!-- Documentation -->
            <div class="bg-purple-50 p-6 rounded-[var(--radius-lg)] border border-purple-100">
              <h3 class="text-lg font-bold text-purple-900 mb-2">Documentation</h3>
              <p class="text-purple-700 mb-4">
                Check our guides and tutorials to make the most of Clothify.
              </p>
              <button
                class="px-4 py-2 bg-purple-600 text-white rounded-[var(--radius-md)] hover:bg-purple-700 transition-colors"
              >
                View Guides
              </button>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-[var(--radius-xl)] shadow-lg p-8 border border-[var(--border-color)]"
        >
          <h3 class="text-xl font-bold text-[var(--text-primary)] mb-4">
            Frequently Asked Questions
          </h3>
          <div class="space-y-4">
            <details
              class="group bg-[var(--bg-page)] rounded-[var(--radius-md)] p-4 cursor-pointer"
            >
              <summary
                class="font-medium text-[var(--text-primary)] list-none flex justify-between items-center"
              >
                <span>How do I add a new product?</span>
                <span class="transition-transform group-open:rotate-180">
                  <i class="bi bi-chevron-down"></i>
                </span>
              </summary>
              <p class="text-[var(--text-secondary)] mt-2">
                Go to the Products page and click the "Add Product" button in the top right corner.
              </p>
            </details>
            <details
              class="group bg-[var(--bg-page)] rounded-[var(--radius-md)] p-4 cursor-pointer"
            >
              <summary
                class="font-medium text-[var(--text-primary)] list-none flex justify-between items-center"
              >
                <span>How do I manage my subscription?</span>
                <span class="transition-transform group-open:rotate-180">
                  <i class="bi bi-chevron-down"></i>
                </span>
              </summary>
              <p class="text-[var(--text-secondary)] mt-2">
                Visit the Settings page and select the Subscription tab to view and manage your
                plan.
              </p>
            </details>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class SupportComponent {}
