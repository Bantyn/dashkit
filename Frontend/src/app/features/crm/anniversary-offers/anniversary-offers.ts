import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CRMService, AnniversaryEntry } from '../../../core/services/crm.service';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

@Component({
  selector: 'app-anniversary-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, UiLoadingComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <i class="bi bi-heart-fill text-rose-500"></i> Anniversary Offers
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">Celebrate customer anniversaries and send special offers</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="activeTab = 'today'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all" [ngClass]="activeTab === 'today' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
            <i class="bi bi-heart-fill mr-1"></i> Today ({{ todayAnniversaries.length }})
          </button>
          <button (click)="activeTab = 'upcoming'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all" [ngClass]="activeTab === 'upcoming' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
            <i class="bi bi-calendar3-range mr-1"></i> Upcoming 30 Days ({{ upcomingAnniversaries.length }})
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-6">
        @if (loading) {
          <div class="flex items-center justify-center h-48"><app-ui-loading size="md"></app-ui-loading></div>
        } @else {

          @if (activeTab === 'today') {
            @if (todayAnniversaries.length === 0) {
              <div class="flex flex-col items-center justify-center h-64 text-center">
                <div class="text-6xl mb-4">💍</div>
                <h3 class="text-gray-700 font-semibold">No anniversaries today!</h3>
                <p class="text-gray-400 text-sm mt-1">Check upcoming tab to prepare anniversary offers in advance.</p>
              </div>
            } @else {
              <div class="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
                <i class="bi bi-heart-fill text-rose-500 text-xl"></i>
                <div>
                  <div class="text-sm font-bold text-rose-700">{{ todayAnniversaries.length }} Anniversary Today! 💕</div>
                  <div class="text-xs text-rose-500">Send them a special anniversary offer!</div>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (a of todayAnniversaries; track a.customerId) {
                  <div class="bg-white rounded-xl border border-rose-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="relative">
                        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-black text-xl">
                          {{ a.customerName.charAt(0).toUpperCase() }}
                        </div>
                        <div class="absolute -top-1 -right-1 text-xl">💍</div>
                      </div>
                      <div>
                        <div class="text-sm font-bold text-gray-900">{{ a.customerName }}</div>
                        <div class="text-xs text-gray-400">{{ a.phoneNumber }}</div>
                        @if (a.yearsCompleted) {
                          <div class="text-xs text-rose-500 font-semibold mt-0.5">{{ a.yearsCompleted }} Year{{ a.yearsCompleted > 1 ? 's' : '' }} Anniversary! 🥂</div>
                        }
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-4 text-center">
                      <div class="bg-gray-50 rounded-lg p-2">
                        <div class="text-xs text-gray-400 mb-0.5">Total Spent</div>
                        <div class="text-sm font-bold text-gray-900">₹{{ a.totalSpent | number }}</div>
                      </div>
                      <div class="bg-gray-50 rounded-lg p-2">
                        <div class="text-xs text-gray-400 mb-0.5">Orders</div>
                        <div class="text-sm font-bold text-gray-900">{{ a.totalOrders }}</div>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <a [href]="'https://wa.me/91' + a.phoneNumber + '?text=' + getAnniversaryMsg(a.customerName)" target="_blank"
                         class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                        <i class="bi bi-whatsapp"></i> Send Offer
                      </a>
                      <a [href]="'tel:' + a.phoneNumber"
                         class="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                        <i class="bi bi-telephone-fill"></i>
                      </a>
                    </div>
                  </div>
                }
              </div>
            }
          }

          @if (activeTab === 'upcoming') {
            @if (upcomingAnniversaries.length === 0) {
              <div class="flex flex-col items-center justify-center h-64 text-center">
                <div class="text-6xl mb-4">📅</div>
                <h3 class="text-gray-700 font-semibold">No anniversaries in next 30 days</h3>
                <p class="text-gray-400 text-sm mt-1">Add anniversary dates when creating/editing customers.</p>
              </div>
            } @else {
              <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-gray-50">
                    <tr class="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th class="px-5 py-3">Customer</th>
                      <th class="px-5 py-3">Anniversary</th>
                      <th class="px-5 py-3 text-center">Years</th>
                      <th class="px-5 py-3 text-right">Spent</th>
                      <th class="px-5 py-3 text-center">Segment</th>
                      <th class="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    @for (a of upcomingAnniversaries; track a.customerId) {
                      <tr class="hover:bg-rose-50/30 transition-colors">
                        <td class="px-5 py-3">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">{{ a.customerName.charAt(0).toUpperCase() }}</div>
                            <div>
                              <div class="text-sm font-medium text-gray-900">{{ a.customerName }}</div>
                              <div class="text-xs text-gray-400">{{ a.phoneNumber }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-5 py-3 text-sm text-gray-700">{{ a.anniversaryDate | date:'d MMM' }}</td>
                        <td class="px-5 py-3 text-sm text-center text-gray-500">{{ a.yearsCompleted ? a.yearsCompleted + 1 : '?' }} yrs</td>
                        <td class="px-5 py-3 text-sm text-right text-gray-900 font-semibold">₹{{ a.totalSpent | number }}</td>
                        <td class="px-5 py-3 text-center">
                          <span class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize bg-rose-100 text-rose-700">{{ a.segment }}</span>
                        </td>
                        <td class="px-5 py-3">
                          <a [href]="'https://wa.me/91' + a.phoneNumber + '?text=' + getAnniversaryMsg(a.customerName)" target="_blank"
                             class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold">
                            <i class="bi bi-whatsapp mr-1"></i> Offer
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
})
export class AnniversaryOffers implements OnInit {
  todayAnniversaries: AnniversaryEntry[] = [];
  upcomingAnniversaries: AnniversaryEntry[] = [];
  loading = true;
  shopId: string | null = null;
  activeTab: 'today' | 'upcoming' = 'today';

  constructor(
    private crmService: CRMService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    const shopId = this.shopId;

    Promise.all([
      this.crmService.getTodaysAnniversaries(shopId).toPromise(),
      this.crmService.getUpcomingAnniversaries(shopId, 30).toPromise(),
    ]).then(([todayRes, upcomingRes]) => {
      this.todayAnniversaries = (todayRes as any)?.data || [];
      this.upcomingAnniversaries = (upcomingRes as any)?.data || [];
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  getAnniversaryMsg(name: string): string {
    return encodeURIComponent(`💍 Happy Anniversary ${name}! Wishing you a beautiful celebration! Visit us and get a special anniversary offer exclusive for you. 🌹 — Your Clothify Store`);
  }
}
