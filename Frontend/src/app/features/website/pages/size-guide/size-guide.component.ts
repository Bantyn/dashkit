import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type SizeTab = 'men' | 'women' | 'kids' | 'shoes' | 'accessories';

@Component({
  selector: 'app-website-size-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white min-h-screen font-sans pb-24">
      <div class="container mx-auto px-6 max-w-[1400px] pt-12 md:pt-16">
        <div class="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">
          
          <!-- LEFT SIDEBAR: HELP & SUPPORT -->
          <div class="w-full lg:w-64 shrink-0 hidden lg:block sticky top-28">
            <h4 class="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-8">Help & Support</h4>
            <nav class="space-y-2 text-[13px] font-semibold text-gray-500">
              <a [routerLink]="['/shipping-policy']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-box-seam text-lg"></i> Shipping Policy
              </a>
              <a [routerLink]="['/return-policy']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-arrow-repeat text-lg"></i> Returns & Exchanges
              </a>
              <a href="#" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-credit-card text-lg"></i> Payments & Promotions
              </a>
              <a [routerLink]="['/size-guide']" class="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 transition-colors">
                <i class="bi bi-rulers text-lg"></i> Size Guide
              </a>
              <a [routerLink]="['/contact']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-envelope text-lg"></i> Contact Us
              </a>
              <a [routerLink]="['/terms-and-conditions']" class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <i class="bi bi-file-earmark-text text-lg"></i> Terms & Conditions
              </a>
            </nav>
          </div>

          <!-- MAIN CONTENT -->
          <div class="flex-1 w-full max-w-5xl">
            
            <!-- Hero Banner -->
            <div class="relative bg-[#f8f6f4] rounded-2xl overflow-hidden min-h-[300px] flex items-center mb-10">
              <div class="px-10 py-12 md:px-16 w-full md:w-3/5 z-10">
                <h1 class="text-4xl md:text-[44px] font-medium text-gray-900 leading-tight mb-4">
                  Size Guide
                </h1>
                <p class="text-[14px] text-gray-700 leading-relaxed max-w-md">
                  Measurements are body measurements, not garment measurements.
                </p>
              </div>
              <div class="absolute inset-y-0 right-0 w-full md:w-2/5 hidden md:block">
                <img src="/size.jpg" alt="Size Guide" class="w-full h-full object-contain object-left mix-blend-multiply" onerror="this.src='https://placehold.co/600x400/f8f6f4/e2e8f0?text=Size+Guide+Image'"/>
              </div>
            </div>

            <!-- Tab Buttons -->
            <div class="flex border-b border-gray-150 mb-10 overflow-x-auto scrollbar-none whitespace-nowrap">
              <button 
                *ngFor="let tab of tabs" 
                (click)="setActiveTab(tab.id)"
                [class.border-black]="activeTab === tab.id"
                [class.text-black]="activeTab === tab.id"
                [class.border-transparent]="activeTab !== tab.id"
                [class.text-gray-400]="activeTab !== tab.id"
                class="flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-bold transition-all focus:outline-none"
              >
                <i [class]="tab.icon" class="text-base"></i>
                {{ tab.label }}
              </button>
            </div>

            <!-- Unit Selector (for tabs that support it) -->
            <div class="flex justify-between items-center mb-6" *ngIf="activeTab !== 'shoes'">
              <h2 class="text-lg font-bold text-gray-900 capitalize">
                {{ activeTab }} - Clothing
              </h2>
              <div class="flex bg-gray-100 p-1 rounded-lg text-xs font-bold">
                <button 
                  (click)="setUnit('inches')" 
                  [class.bg-white]="unit === 'inches'" 
                  [class.shadow-sm]="unit === 'inches'"
                  [class.text-black]="unit === 'inches'"
                  [class.text-gray-500]="unit !== 'inches'"
                  class="px-3.5 py-1.5 rounded-md transition-all focus:outline-none uppercase"
                >
                  INCHES
                </button>
                <button 
                  (click)="setUnit('cm')" 
                  [class.bg-white]="unit === 'cm'" 
                  [class.shadow-sm]="unit === 'cm'"
                  [class.text-black]="unit === 'cm'"
                  [class.text-gray-500]="unit !== 'cm'"
                  class="px-3.5 py-1.5 rounded-md transition-all focus:outline-none uppercase"
                >
                  CM
                </button>
              </div>
            </div>

            <!-- TABLE: Men Clothing -->
            <div *ngIf="activeTab === 'men'" class="border border-gray-150 rounded-xl overflow-hidden mb-14">
              <table class="w-full text-left text-[13px]">
                <thead class="bg-[#f8f6f4] text-gray-900 border-b border-gray-150 font-bold">
                  <tr>
                    <th class="px-5 py-4 w-[160px]">Size</th>
                    <th *ngFor="let s of menSizes" class="px-5 py-4">{{ s }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150 text-gray-700">
                  <tr *ngFor="let row of menClothingData" class="hover:bg-gray-50 transition-colors">
                    <td class="px-5 py-4 font-bold text-gray-900">{{ row.label }}</td>
                    <td *ngFor="let val of row.values[unit]" class="px-5 py-4">{{ val }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TABLE: Women Clothing -->
            <div *ngIf="activeTab === 'women'" class="border border-gray-150 rounded-xl overflow-hidden mb-14">
              <table class="w-full text-left text-[13px]">
                <thead class="bg-[#f8f6f4] text-gray-900 border-b border-gray-150 font-bold">
                  <tr>
                    <th class="px-5 py-4 w-[160px]">Size</th>
                    <th *ngFor="let s of womenSizes" class="px-5 py-4">{{ s }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150 text-gray-700">
                  <tr *ngFor="let row of womenClothingData" class="hover:bg-gray-50 transition-colors">
                    <td class="px-5 py-4 font-bold text-gray-900">{{ row.label }}</td>
                    <td *ngFor="let val of row.values[unit]" class="px-5 py-4">{{ val }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TABLE: Kids Clothing -->
            <div *ngIf="activeTab === 'kids'" class="border border-gray-150 rounded-xl overflow-hidden mb-14">
              <table class="w-full text-left text-[13px]">
                <thead class="bg-[#f8f6f4] text-gray-900 border-b border-gray-150 font-bold">
                  <tr>
                    <th class="px-5 py-4 w-[160px]">Age / Size</th>
                    <th *ngFor="let s of kidsSizes" class="px-5 py-4">{{ s }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150 text-gray-700">
                  <tr *ngFor="let row of kidsClothingData" class="hover:bg-gray-50 transition-colors">
                    <td class="px-5 py-4 font-bold text-gray-900">{{ row.label }}</td>
                    <td *ngFor="let val of row.values[unit]" class="px-5 py-4">{{ val }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TABLE: Shoes Mapping -->
            <div *ngIf="activeTab === 'shoes'">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-bold text-gray-900">Men - Shoes</h2>
              </div>
              <div class="border border-gray-150 rounded-xl overflow-hidden mb-8">
                <table class="w-full text-left text-[13px]">
                  <thead class="bg-[#f8f6f4] text-gray-900 border-b border-gray-150 font-bold">
                    <tr>
                      <th class="px-5 py-4 w-[160px]">US</th>
                      <th *ngFor="let size of shoesUS" class="px-5 py-4">{{ size }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-150 text-gray-700">
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-4 font-bold text-gray-900">UK</td>
                      <td *ngFor="let uk of shoesUK" class="px-5 py-4">{{ uk }}</td>
                    </tr>
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-4 font-bold text-gray-900">EU</td>
                      <td *ngFor="let eu of shoesEU" class="px-5 py-4">{{ eu }}</td>
                    </tr>
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-4 font-bold text-gray-900">Foot Length (cm)</td>
                      <td *ngFor="let len of shoesLength" class="px-5 py-4">{{ len }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-[12px] text-gray-500 mb-14 italic">
                Note: Foot length is measured from heel to toe.
              </p>
            </div>

            <!-- TABLE: Accessories -->
            <div *ngIf="activeTab === 'accessories'">
              <div class="border border-gray-150 rounded-xl overflow-hidden mb-14">
                <table class="w-full text-left text-[13px]">
                  <thead class="bg-[#f8f6f4] text-gray-900 border-b border-gray-150 font-bold">
                    <tr>
                      <th class="px-5 py-4 w-[280px]">Item</th>
                      <th class="px-5 py-4">S</th>
                      <th class="px-5 py-4">M</th>
                      <th class="px-5 py-4">L</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-150 text-gray-700">
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-4 font-bold text-gray-900">Belts (waist size, {{unit}})</td>
                      <td class="px-5 py-4">{{ unit === 'inches' ? '30 - 32' : '76 - 81' }}</td>
                      <td class="px-5 py-4">{{ unit === 'inches' ? '34 - 36' : '86 - 91' }}</td>
                      <td class="px-5 py-4">{{ unit === 'inches' ? '38 - 40' : '96 - 101' }}</td>
                    </tr>
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-4 font-bold text-gray-900">Hats (circumference, cm)</td>
                      <td class="px-5 py-4">54 - 55</td>
                      <td class="px-5 py-4">56 - 57</td>
                      <td class="px-5 py-4">58 - 59</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- HOW TO MEASURE GUIDE -->
            <div class="mb-14">
              <h2 class="text-xl font-medium text-gray-900 mb-2">How to Measure</h2>
              <p class="text-[13px] text-gray-500 mb-10">
                To choose the correct size for you, measure your body as follows:
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
                <!-- Chest -->
                <div class="flex flex-col items-center text-center p-4">
                  <div class="w-24 h-24 mb-6 text-gray-400 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" class="w-full h-full">
                      <!-- Chest SVG Guide -->
                      <path d="M30 20 C35 22, 65 22, 70 20 M30 20 L26 30 C26 30, 20 40, 22 55 L25 80 L35 80 L32 55" />
                      <path d="M70 20 L74 30 C74 30, 80 40, 78 55 L75 80 L65 80 L68 55" />
                      <path d="M32 55 C35 60, 65 60, 68 55" />
                      <path d="M22 45 C35 48, 65 48, 78 45" stroke-dasharray="3,3" stroke-width="1.5" stroke="black"/>
                      <circle cx="22" cy="45" r="3" fill="black" stroke="none"/>
                      <circle cx="78" cy="45" r="3" fill="black" stroke="none"/>
                    </svg>
                  </div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Chest</h4>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Measure around the fullest part of your chest, keeping the tape horizontal.
                  </p>
                </div>

                <!-- Waist -->
                <div class="flex flex-col items-center text-center p-4">
                  <div class="w-24 h-24 mb-6 text-gray-400 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" class="w-full h-full">
                      <!-- Waist SVG Guide -->
                      <path d="M26 20 C26 20, 20 40, 25 60 L32 90 L68 90 L75 60 C80 40, 74 20, 74 20" />
                      <path d="M24 50 C35 53, 65 53, 76 50" stroke-dasharray="3,3" stroke-width="1.5" stroke="black"/>
                      <circle cx="24" cy="50" r="3" fill="black" stroke="none"/>
                      <circle cx="76" cy="50" r="3" fill="black" stroke="none"/>
                    </svg>
                  </div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Waist</h4>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Measure around the narrowest part of your waistline.
                  </p>
                </div>

                <!-- Hip -->
                <div class="flex flex-col items-center text-center p-4">
                  <div class="w-24 h-24 mb-6 text-gray-400 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" class="w-full h-full">
                      <!-- Hip SVG Guide -->
                      <path d="M30 15 L25 40 C20 60, 25 80, 28 95 L72 95 C75 80, 80 60, 75 40 L70 15" />
                      <path d="M22 68 C35 72, 65 72, 78 68" stroke-dasharray="3,3" stroke-width="1.5" stroke="black"/>
                      <circle cx="22" cy="68" r="3" fill="black" stroke="none"/>
                      <circle cx="78" cy="68" r="3" fill="black" stroke="none"/>
                    </svg>
                  </div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Hip</h4>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Measure around the fullest part of your hips, keeping the tape horizontal.
                  </p>
                </div>

                <!-- Shoulder -->
                <div class="flex flex-col items-center text-center p-4">
                  <div class="w-24 h-24 mb-6 text-gray-400 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" class="w-full h-full">
                      <!-- Shoulder SVG Guide -->
                      <path d="M20 35 L30 25 L70 25 L80 35 L76 50 L24 50 Z" />
                      <path d="M30 25 C30 25, 50 35, 70 25" />
                      <path d="M20 35 C40 33, 60 33, 80 35" stroke-dasharray="3,3" stroke-width="1.5" stroke="black"/>
                      <circle cx="20" cy="35" r="3" fill="black" stroke="none"/>
                      <circle cx="80" cy="35" r="3" fill="black" stroke="none"/>
                    </svg>
                  </div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-2">Shoulder</h4>
                  <p class="text-[12px] text-gray-500 leading-relaxed">
                    Measure from the edge of one shoulder to the other across the back.
                  </p>
                </div>
              </div>

              <!-- Recommendation Box -->
              <div class="bg-[#faf9f8] border border-gray-150 rounded-2xl p-6 flex items-center gap-5">
                <div class="w-10 h-10 shrink-0 text-gray-900 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
                  <i class="bi bi-info-circle text-lg"></i>
                </div>
                <div>
                  <h4 class="text-[13px] font-bold text-gray-900 mb-1">Between sizes?</h4>
                  <p class="text-[12px] text-gray-500">
                    We recommend sizing up for a more relaxed fit and sizing down for a slimmer fit.
                  </p>
                </div>
              </div>
            </div>

            <!-- Help Block -->
            <div class="bg-[#f8f6f4] rounded-2xl p-6 md:px-10 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div class="flex items-center gap-5">
                <div class="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-900 bg-white shadow-sm">
                  <i class="bi bi-headset text-xl"></i>
                </div>
                <div>
                  <h3 class="text-[15px] font-bold text-gray-900 mb-1">Still unsure about your size?</h3>
                  <p class="text-[13px] text-gray-600">Our customer support team is here to help you find the perfect fit.</p>
                </div>
              </div>
              <button [routerLink]="['/contact']" class="bg-black text-white px-8 py-3 rounded-lg text-[13px] font-bold hover:bg-gray-800 transition-colors w-full md:w-auto">
                Contact Us
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class WebsiteSizeGuideComponent {
  activeTab: SizeTab = 'men';
  unit: 'inches' | 'cm' = 'inches';

  tabs = [
    { id: 'men' as SizeTab, label: 'Men', icon: 'bi bi-gender-male' },
    { id: 'women' as SizeTab, label: 'Women', icon: 'bi bi-gender-female' },
    { id: 'kids' as SizeTab, label: 'Kids', icon: 'bi bi-emoji-smile' },
    { id: 'shoes' as SizeTab, label: 'Shoes', icon: 'bi bi-egg' }, 
    { id: 'accessories' as SizeTab, label: 'Accessories', icon: 'bi bi-gem' },
  ];

  menSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  menClothingData = [
    { 
      label: 'Chest', 
      values: { 
        inches: ['34-36', '36-38', '38-40', '40-42', '42-44', '44-46', '46-48'], 
        cm: ['86-91', '91-96', '96-101', '101-106', '106-111', '111-117', '117-122'] 
      } 
    },
    { 
      label: 'Waist', 
      values: { 
        inches: ['28-30', '30-32', '32-34', '34-36', '36-38', '38-40', '40-42'], 
        cm: ['71-76', '76-81', '81-86', '86-91', '91-96', '96-101', '101-106'] 
      } 
    },
    { 
      label: 'Hip', 
      values: { 
        inches: ['34-36', '36-38', '38-40', '40-42', '42-44', '44-46', '46-48'], 
        cm: ['86-91', '91-96', '96-101', '101-106', '106-111', '111-117', '117-122'] 
      } 
    },
    { 
      label: 'Shoulder', 
      values: { 
        inches: ['16', '17', '18', '19', '20', '21', '22'], 
        cm: ['40.6', '43.2', '45.7', '48.3', '50.8', '53.3', '55.9'] 
      } 
    }
  ];

  womenSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  womenClothingData = [
    { 
      label: 'Chest', 
      values: { 
        inches: ['31-33', '33-35', '35-37', '37-40', '40-43', '43-46'], 
        cm: ['78-83', '83-89', '89-94', '94-101', '101-109', '109-117'] 
      } 
    },
    { 
      label: 'Waist', 
      values: { 
        inches: ['24-26', '26-28', '28-30', '30-33', '33-36', '36-39'], 
        cm: ['61-66', '66-71', '71-76', '76-84', '84-91', '91-99'] 
      } 
    },
    { 
      label: 'Hip', 
      values: { 
        inches: ['34-36', '36-38', '38-40', '40-43', '43-46', '46-49'], 
        cm: ['86-91', '91-96', '96-101', '101-109', '109-117', '117-124'] 
      } 
    }
  ];

  kidsSizes = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'];
  kidsClothingData = [
    { 
      label: 'Height', 
      values: { 
        inches: ['38-41', '41-45', '45-49', '49-53', '53-57'], 
        cm: ['98-104', '104-116', '116-128', '128-140', '140-152'] 
      } 
    },
    { 
      label: 'Chest', 
      values: { 
        inches: ['20-21.5', '21.5-23', '23-24.5', '24.5-26.5', '26.5-28.5'], 
        cm: ['51-54', '54-58', '58-62', '62-67', '67-72'] 
      } 
    },
    { 
      label: 'Waist', 
      values: { 
        inches: ['19.5-20.5', '20.5-21.5', '21.5-22.5', '22.5-24', '24-25.5'], 
        cm: ['50-52', '52-54', '54-57', '57-61', '61-65'] 
      } 
    }
  ];

  shoesUS = ['6', '7', '8', '9', '10', '11', '12', '13'];
  shoesUK = ['5', '6', '7', '8', '9', '10', '11', '12'];
  shoesEU = ['39', '40', '41', '42', '43', '44', '45', '46'];
  shoesLength = ['24.5', '25.5', '26.5', '27.5', '28.5', '29.5', '30.5', '31.5'];

  setActiveTab(tab: SizeTab) {
    this.activeTab = tab;
  }

  setUnit(unit: 'inches' | 'cm') {
    this.unit = unit;
  }
}
