import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-feature-unavailable',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex-1 overflow-y-auto">
      <div class="min-h-[80vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-[#f5f7fa]">
        <div class="max-w-lg w-full text-center">
          <!-- Icon -->
          <div class="relative mb-8">
            <div
              class="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center border border-amber-200/50 shadow-sm"
              [ngClass]="{
                'from-red-50 to-red-100/50 border-red-200/50': featureState === 'deprecated',
                'from-gray-50 to-gray-100/50 border-gray-200/50': featureState === 'inactive'
              }"
            >
              <i class="bi text-4xl"
                [ngClass]="{
                  'bi-cone-striped text-amber-600': featureState === 'maintenance',
                  'bi-exclamation-triangle-fill text-red-600': featureState === 'deprecated',
                  'bi-slash-circle text-gray-500': featureState === 'inactive'
                }"
              ></i>
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
            Feature Temporarily Unavailable
          </h1>
          
          <!-- Message -->
          <p class="mt-4 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            This feature is currently unavailable.<br />
            Our team is working to improve or maintain this feature. Please try again later.
          </p>
          <p class="mt-2 text-xs text-gray-400 max-w-md mx-auto">
            If you believe this feature should be available for your account, please contact your administrator.
          </p>

          <!-- Feature Meta Card -->
          <div class="mt-8 bg-white rounded-2xl border border-gray-150 shadow-sm p-6 text-left">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                <i class="bi bi-info-circle text-gray-500 text-lg"></i>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">
                  Feature Lifecycle Info
                </h3>
                <p class="mt-1 text-xs text-gray-400">
                  Key: <span class="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-600">{{ featureKey || 'N/A' }}</span>
                </p>
                <p class="mt-1.5 text-xs text-gray-500">
                  Global State: 
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize"
                    [ngClass]="{
                      'bg-green-50 text-green-700 border-green-150': featureState === 'active',
                      'bg-amber-50 text-amber-700 border-amber-150': featureState === 'maintenance',
                      'bg-red-50 text-red-700 border-red-150': featureState === 'deprecated',
                      'bg-gray-50 text-gray-400 border-gray-250': featureState === 'inactive'
                    }"
                  >
                    {{ featureState || 'Inactive' }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              (click)="goBack()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 text-sm shadow-sm"
            >
              <i class="bi bi-arrow-left"></i>
              Go Back
            </button>
            <a
              [routerLink]="['/', shopId, 'dashboard']"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-sm shadow-sm"
            >
              <i class="bi bi-speedometer2"></i>
              Dashboard
            </a>
            <button
              (click)="refresh()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 text-sm shadow-sm"
            >
              <i class="bi bi-arrow-clockwise"></i>
              Refresh
            </button>
            <button
              (click)="contactSupport()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-500 font-medium rounded-xl border border-gray-200 text-sm cursor-not-allowed"
              title="Support Desk Integration coming soon"
            >
              <i class="bi bi-envelope"></i>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FeatureUnavailableComponent implements OnInit {
  shopId = '';
  featureKey = '';
  featureState = 'inactive';

  private route = inject(ActivatedRoute);
  private location = inject(Location);

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId') || '';
    });

    this.route.queryParamMap.subscribe((params) => {
      this.featureKey = params.get('featureKey') || '';
      this.featureState = params.get('state') || 'inactive';
    });
  }

  goBack() {
    this.location.back();
  }

  refresh() {
    window.location.reload();
  }

  contactSupport() {
    console.info('Contact Support desk invoked. Future-ready implementation.');
  }
}
