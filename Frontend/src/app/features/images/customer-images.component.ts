import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-images',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-full mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-800">Customer Images</h2>
        <p class="text-sm text-gray-500 mt-1">Online customers ki profile photos</p>
      </div>

      <!-- Info Banner -->
      <div class="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-xl mb-6">
        <i class="bi bi-info-circle-fill text-primary-500 mt-0.5"></i>
        <div>
          <div class="text-sm font-normal text-primary-800">Customer Images — Coming Soon</div>
          <p class="text-xs text-primary-700 mt-1 leading-relaxed">
            Customer profile images view is being implemented. Customers ke avatar aur photos yahan dikhenge.
            For now, customer management ke liye Customers section use karein.
          </p>
        </div>
      </div>

      <!-- Placeholder Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        @for (i of placeholders; track i) {
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 opacity-40 pointer-events-none">
            <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <i class="bi bi-person-fill text-2xl text-gray-400"></i>
            </div>
            <div class="h-2.5 bg-gray-200 rounded w-20"></div>
            <div class="h-2 bg-gray-100 rounded w-14"></div>
          </div>
        }
      </div>

    </div>
  `,
})
export class CustomerImagesComponent implements OnInit {
  shopId = '';
  placeholders = Array.from({ length: 10 }, (_, i) => i);

  constructor(
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) this.shopId = user.shopId;
    });
  }
}
