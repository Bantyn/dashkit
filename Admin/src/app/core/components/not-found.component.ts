import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-8 animate-bounce">
          <i class="bi bi-exclamation-triangle-fill text-5xl text-red-600"></i>
        </div>
        
        <h1 class="text-9xl font-extrabold text-gray-900 tracking-tight mb-2">404</h1>
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        
        <p class="text-lg text-gray-500 mb-8 max-w-sm mx-auto">
          The page you are looking for doesn't exist or has been moved. 
          Please check the URL or return to the dashboard.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/dashboard" 
             class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all duration-200">
            <i class="bi bi-speedometer2 mr-2"></i>
            Go to Dashboard
          </a>
          <button (click)="goBack()" 
                  class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200">
            <i class="bi bi-arrow-left mr-2"></i>
            Go Back
          </button>
        </div>
      </div>
      
      <div class="mt-12 text-center text-gray-400 text-sm">
        &copy; 2026 Clothify Admin Console. All rights reserved.
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-bounce {
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
      50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    }
  `]
})
export class NotFoundComponent {
  goBack() {
    window.history.back();
  }
}
