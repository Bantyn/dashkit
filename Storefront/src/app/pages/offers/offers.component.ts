import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WebsiteService } from '../../core/services/website.service';
import { TenantService } from '../../core/services/tenant.service';
import { Offer } from '../../core/models/offer.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-website-offers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-5xl">
        <h1 class="text-3xl font-black text-gray-900 mb-8 tracking-tight">Active Offers & Promotions</h1>

        <div *ngIf="offers$ | async as offers; else loading">
          <div *ngIf="offers.length > 0; else noOffers" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngFor="let offer of offers" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 rounded-full inline-block mb-3">
                  {{ offer.type === 'percentage' ? offer.value + '% OFF' : 'SPECIAL DEAL' }}
                </span>
                <h3 class="text-xl font-bold text-gray-900 mb-2">{{ offer.title }}</h3>
                <p class="text-xs text-gray-500 mb-4 font-mono" *ngIf="offer.code">Code: <span class="bg-gray-100 px-2 py-1 rounded text-black font-bold">{{ offer.code }}</span></p>
              </div>

              <div class="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                <span class="text-[11px] text-gray-400">Valid until {{ offer.endDate | date:'mediumDate' }}</span>
                <a [routerLink]="routePrefix.concat(['products'])" class="text-xs font-bold text-black hover:underline">Shop Now →</a>
              </div>
            </div>
          </div>

          <ng-template #noOffers>
            <div class="bg-white p-12 text-center rounded-3xl border border-gray-100 max-w-md mx-auto">
              <i class="bi bi-tag text-5xl text-gray-300 mb-4 inline-block"></i>
              <h3 class="text-lg font-bold text-gray-900 mb-1">No Active Offers Right Now</h3>
              <p class="text-xs text-gray-500">Check back soon for new promotions and seasonal discounts.</p>
            </div>
          </ng-template>
        </div>

        <ng-template #loading>
          <div class="flex justify-center py-20">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class WebsiteOffersComponent implements OnInit {
  offers$: Observable<Offer[]>;

  constructor(
    private websiteService: WebsiteService,
    private tenantService: TenantService
  ) {
    this.offers$ = this.websiteService.getOffers();
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {}
}
