import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type SizeTab = 'men' | 'women' | 'kids' | 'shoes' | 'accessories';

@Component({
  selector: 'app-website-size-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="bg-white min-h-screen pb-24">
  <div class="max-w-5xl mx-auto px-6 py-12">
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight mb-2">Size Guide</h1>
      <p class="text-sm text-gray-500">Find your perfect fit using our size charts.</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto">
      <button *ngFor="let tab of tabs" (click)="setActiveTab(tab.id)"
        [class.border-b-2]="activeTab === tab.id" [class.border-gray-900]="activeTab === tab.id"
        [class.text-gray-900]="activeTab === tab.id"
        class="px-5 py-3 text-sm font-semibold text-gray-500 whitespace-nowrap hover:text-gray-900 transition-colors">
        <i [class]="tab.icon + ' mr-1.5'"></i>{{ tab.label }}
      </button>
    </div>

    <!-- Unit Toggle -->
    <div class="flex gap-2 mb-6">
      <button (click)="setUnit('inches')" [class.bg-gray-900]="unit==='inches'" [class.text-white]="unit==='inches'"
        class="px-4 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 transition-all">Inches</button>
      <button (click)="setUnit('cm')" [class.bg-gray-900]="unit==='cm'" [class.text-white]="unit==='cm'"
        class="px-4 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 transition-all">Centimeters</button>
    </div>

    <!-- MEN -->
    <div *ngIf="activeTab === 'men'" class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Measurement</th>
            <th *ngFor="let size of menSizes" class="px-4 py-3 text-center font-bold text-gray-700 border border-gray-200">{{ size }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of menClothingData; let i = index" [class.bg-gray-50]="i % 2 === 0">
            <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">{{ row.label }}</td>
            <td *ngFor="let val of row.values[unit]" class="px-4 py-3 text-center text-gray-600 border border-gray-200">{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- WOMEN -->
    <div *ngIf="activeTab === 'women'" class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Measurement</th>
            <th *ngFor="let size of womenSizes" class="px-4 py-3 text-center font-bold text-gray-700 border border-gray-200">{{ size }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of womenClothingData; let i = index" [class.bg-gray-50]="i % 2 === 0">
            <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">{{ row.label }}</td>
            <td *ngFor="let val of row.values[unit]" class="px-4 py-3 text-center text-gray-600 border border-gray-200">{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- KIDS -->
    <div *ngIf="activeTab === 'kids'" class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Measurement</th>
            <th *ngFor="let size of kidsSizes" class="px-4 py-3 text-center font-bold text-gray-700 border border-gray-200">{{ size }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of kidsClothingData; let i = index" [class.bg-gray-50]="i % 2 === 0">
            <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">{{ row.label }}</td>
            <td *ngFor="let val of row.values[unit]" class="px-4 py-3 text-center text-gray-600 border border-gray-200">{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SHOES -->
    <div *ngIf="activeTab === 'shoes'" class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">US Size</th>
            <th *ngFor="let s of shoesUS" class="px-4 py-3 text-center font-bold text-gray-700 border border-gray-200">{{ s }}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="bg-gray-50">
            <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">UK</td>
            <td *ngFor="let s of shoesUK" class="px-4 py-3 text-center text-gray-600 border border-gray-200">{{ s }}</td>
          </tr>
          <tr>
            <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">EU</td>
            <td *ngFor="let s of shoesEU" class="px-4 py-3 text-center text-gray-600 border border-gray-200">{{ s }}</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">Foot Length (cm)</td>
            <td *ngFor="let s of shoesLength" class="px-4 py-3 text-center text-gray-600 border border-gray-200">{{ s }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ACCESSORIES -->
    <div *ngIf="activeTab === 'accessories'" class="text-sm text-gray-600">
      <p class="mb-4">Accessories such as caps, belts, and bags are typically one-size-fits-all. For specific products, refer to the product description.</p>
      <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-4 py-3 text-left font-bold text-gray-700 border border-gray-200">Item</th>
              <th class="px-4 py-3 text-center font-bold text-gray-700 border border-gray-200">Size</th>
              <th class="px-4 py-3 text-center font-bold text-gray-700 border border-gray-200">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">Cap / Hat</td>
              <td class="px-4 py-3 text-center text-gray-600 border border-gray-200">One Size (55–60 cm head)</td>
              <td class="px-4 py-3 text-center text-gray-500 border border-gray-200">Adjustable strap</td>
            </tr>
            <tr class="bg-gray-50">
              <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">Belt</td>
              <td class="px-4 py-3 text-center text-gray-600 border border-gray-200">S (28-32"), M (32-36"), L (36-40")</td>
              <td class="px-4 py-3 text-center text-gray-500 border border-gray-200">Waist measurement</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-semibold text-gray-900 border border-gray-200">Scarf / Dupatta</td>
              <td class="px-4 py-3 text-center text-gray-600 border border-gray-200">One Size</td>
              <td class="px-4 py-3 text-center text-gray-500 border border-gray-200">Free-flowing</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Help Block -->
    <div class="bg-gray-50 rounded-2xl p-6 mt-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h3 class="text-sm font-bold text-gray-900 mb-1">Still unsure about your size?</h3>
        <p class="text-xs text-gray-500">Our team is here to help you find the perfect fit.</p>
      </div>
      <a routerLink="/contact" class="bg-black text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors w-full md:w-auto text-center">Contact Us</a>
    </div>
  </div>
</div>
  `,
  styles: [`
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
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
    { label: 'Chest', values: { inches: ['34-36','36-38','38-40','40-42','42-44','44-46','46-48'], cm: ['86-91','91-96','96-101','101-106','106-111','111-117','117-122'] } },
    { label: 'Waist', values: { inches: ['28-30','30-32','32-34','34-36','36-38','38-40','40-42'], cm: ['71-76','76-81','81-86','86-91','91-96','96-101','101-106'] } },
    { label: 'Hip', values: { inches: ['34-36','36-38','38-40','40-42','42-44','44-46','46-48'], cm: ['86-91','91-96','96-101','101-106','106-111','111-117','117-122'] } },
    { label: 'Shoulder', values: { inches: ['16','17','18','19','20','21','22'], cm: ['40.6','43.2','45.7','48.3','50.8','53.3','55.9'] } },
  ];

  womenSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  womenClothingData = [
    { label: 'Chest', values: { inches: ['31-33','33-35','35-37','37-40','40-43','43-46'], cm: ['78-83','83-89','89-94','94-101','101-109','109-117'] } },
    { label: 'Waist', values: { inches: ['24-26','26-28','28-30','30-33','33-36','36-39'], cm: ['61-66','66-71','71-76','76-84','84-91','91-99'] } },
    { label: 'Hip', values: { inches: ['34-36','36-38','38-40','40-43','43-46','46-49'], cm: ['86-91','91-96','96-101','101-109','109-117','117-124'] } },
  ];

  kidsSizes = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'];
  kidsClothingData = [
    { label: 'Height', values: { inches: ['38-41','41-45','45-49','49-53','53-57'], cm: ['98-104','104-116','116-128','128-140','140-152'] } },
    { label: 'Chest', values: { inches: ['20-21.5','21.5-23','23-24.5','24.5-26.5','26.5-28.5'], cm: ['51-54','54-58','58-62','62-67','67-72'] } },
    { label: 'Waist', values: { inches: ['19.5-20.5','20.5-21.5','21.5-22.5','22.5-24','24-25.5'], cm: ['50-52','52-54','54-57','57-61','61-65'] } },
  ];

  shoesUS = ['6', '7', '8', '9', '10', '11', '12', '13'];
  shoesUK = ['5', '6', '7', '8', '9', '10', '11', '12'];
  shoesEU = ['39', '40', '41', '42', '43', '44', '45', '46'];
  shoesLength = ['24.5', '25.5', '26.5', '27.5', '28.5', '29.5', '30.5', '31.5'];

  setActiveTab(tab: SizeTab) { this.activeTab = tab; }
  setUnit(unit: 'inches' | 'cm') { this.unit = unit; }
}
