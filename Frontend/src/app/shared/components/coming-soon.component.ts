import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div
        class="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ title }}</h2>
      <p class="text-gray-500 max-w-md">
        This feature is currently under development. Check back soon for updates!
      </p>
    </div>
  `,
})
export class ComingSoonComponent {
  title = 'Coming Soon';

  constructor(private route: ActivatedRoute) {
    // Try to derive a title from the route path if possible
    this.route.url.subscribe((segments) => {
      if (segments.length > 0) {
        const path = segments[segments.length - 1].path;
        this.title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      }
    });
  }
}
