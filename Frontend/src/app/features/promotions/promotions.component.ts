import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 h-full p-8">
      <div class="max-w-2xl mx-auto py-8">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 class="text-xl font-bold text-center text-slate-800 mb-8">Start a new campaign</h2>
          
          <div class="grid grid-cols-1 gap-4">
            <!-- Message Templates -->
            <div [routerLink]="['templates']" class="border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all bg-white group hover:bg-indigo-50/30">
              <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                <i class="bi bi-file-earmark-text text-xl"></i>
              </div>
              <div class="pt-0.5">
                <h3 class="text-sm font-bold text-slate-800 mb-1">Message Templates</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Create and manage reusable message templates for your shop.</p>
              </div>
            </div>

            <!-- WhatsApp -->
            <div [routerLink]="['whatsapp']" class="border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-green-500 hover:shadow-md cursor-pointer transition-all bg-white group hover:bg-green-50/30">
              <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                <i class="bi bi-whatsapp text-xl"></i>
              </div>
              <div class="pt-0.5">
                <h3 class="text-sm font-bold text-slate-800 mb-1">WhatsApp Campaigns</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Send approved templates to customers using WhatsApp provider.</p>
              </div>
            </div>

            <!-- SMS -->
            <div [routerLink]="['sms']" class="border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-white group hover:bg-blue-50/30">
              <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <i class="bi bi-chat-text text-xl"></i>
              </div>
              <div class="pt-0.5">
                <h3 class="text-sm font-bold text-slate-800 mb-1">SMS Marketing</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Boost sales by sending greeting SMS to your customers.</p>
              </div>
            </div>

            <!-- Festival -->
            <div [routerLink]="['festival']" class="border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-orange-500 hover:shadow-md cursor-pointer transition-all bg-white group hover:bg-orange-50/30">
              <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                <i class="bi bi-gift text-xl"></i>
              </div>
              <div class="pt-0.5">
                <h3 class="text-sm font-bold text-slate-800 mb-1">Festival Campaigns</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Run special campaigns during festivals like Diwali, Eid, or Christmas.</p>
              </div>
            </div>

            <!-- Loyalty -->
            <div [routerLink]="['loyalty']" class="border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-purple-500 hover:shadow-md cursor-pointer transition-all bg-white group hover:bg-purple-50/30">
              <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                <i class="bi bi-award text-xl"></i>
              </div>
              <div class="pt-0.5">
                <h3 class="text-sm font-bold text-slate-800 mb-1">Loyalty Programs</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Reward your repeat customers with points and special perks.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class PromotionsComponent implements OnInit {
  shopId: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.shopId = user?.shopId || null;
  }
}

