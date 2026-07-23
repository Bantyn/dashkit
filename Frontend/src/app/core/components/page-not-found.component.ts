import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen  flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 ">
      <div class="max-w-md w-full text-center">
        <div class="relative mb-8">
          <div class="absolute inset-0 flex items-center justify-center opacity-10 select-none">
            <span class="text-9xl font-extrabold text-primary-600">404</span>
          </div>
          <div class="relative z-10">
            <h1 class="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
              Page not found
            </h1>
            <p class="mt-4 text-base text-gray-500">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>
        </div>

        <div class="mt-6">
          <button
            (click)="goBack()"
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Go back
          </button>
        </div>

        <div class="mt-12 text-center text-sm text-gray-400">
          <p>
            If you think this is a mistake, please
            <a href="#" class="font-medium text-primary-600 hover:text-primary-500"
              >contact support</a
            >.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PageNotFoundComponent {
  constructor(private location: Location) {}
  
  goBack() {
    this.location.back();
  }
}

