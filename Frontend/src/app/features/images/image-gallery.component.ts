import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../core/models/shop.model';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';

type Tab = { id: string; label: string; icon: string; route: string; featureKey?: string };

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, HasFeatureDirective],
  template: `
    <div class="flex flex-col h-full bg-[#f5f7fa]">

      <!-- ── Page Header ── -->
      <div class="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Image Gallery</h1>
          <p class="text-sm text-gray-500 mt-0.5">Apni sabhi images ek jagah manage karein</p>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <i class="bi bi-images text-2xl text-primary-600"></i>
          <span class="font-normal text-gray-600">Media Manager</span>
        </div>
      </div>

      <!-- ── Cloudinary Setup Banner ── -->
      @if (currentShop && !currentShop.integrations?.cloudinary?.connected) {
        <div class="bg-primary-50 border-b border-primary-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <i class="bi bi-cloud-arrow-up-fill"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-primary-900">Cloudinary is not connected!</p>
              <p class="text-xs text-primary-700">Connect your Cloudinary account to enable fast and optimized image hosting.</p>
            </div>
          </div>
          <button (click)="navigateToSettings()" class="text-xs bg-primary-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            Set Up Now
          </button>
        </div>
      }

      <!-- ── Tabs ── -->
      <div class="bg-white border-b border-gray-200 px-6 shrink-0">
        <nav class="flex gap-1" role="tablist">
          @for (tab of tabs; track tab.id) {
            <button
              *appHasFeature="tab.featureKey || null"
              (click)="navigateToTab(tab)"
              [class.text-primary-600]="activeTab === tab.id"
              [class.border-primary-600]="activeTab === tab.id"
              [class.font-normal]="activeTab === tab.id"
              class="flex items-center gap-2 px-4 py-3.5 text-sm text-gray-500 hover:text-gray-800 border-b-2 border-transparent transition-all -mb-px"
              [id]="'tab-' + tab.id"
            >
              <i [class]="'bi ' + tab.icon"></i>
              <span>{{ tab.label }}</span>
            </button>
          }
        </nav>
      </div>

      <!-- ── Tab Content ── -->
      <div class="flex-1 overflow-auto">
        <router-outlet></router-outlet>
      </div>

    </div>
  `,
})
export class ImageGalleryComponent implements OnInit {
  shopId = '';
  activeTab = 'all';
  currentShop: Shop | null = null;

  tabs: Tab[] = [
    { id: 'all',      label: 'All Images',      icon: 'bi-grid-3x3-gap-fill', route: '' },
    { id: 'shop',     label: 'Shop Images',      icon: 'bi-shop',              route: 'shop' },
    { id: 'website',  label: 'Website Images',   icon: 'bi-globe2',            route: 'website', featureKey: 'web_storefront' },
    { id: 'product',  label: 'Product Images',   icon: 'bi-bag-fill',          route: 'product' },
    { id: 'invoice',  label: 'Invoice PDFs',     icon: 'bi-file-earmark-pdf-fill', route: 'invoice' },
    { id: 'profile',  label: 'Profile Image',    icon: 'bi-person-circle',     route: 'profile' },
    { id: 'customer', label: 'Customer Images',  icon: 'bi-people-fill',       route: 'customer' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private shopService: ShopService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadCurrentShop(user.shopId);
      }
    });

    // detect active tab from URL
    this.router.events.subscribe(() => this.detectActiveTab());
    this.detectActiveTab();
  }

  private loadCurrentShop(shopId: string) {
    this.shopService.getShop(shopId).subscribe({
      next: (res) => {
        this.currentShop = res.data || null;
      },
      error: (err) => {
        console.error('Failed to load shop for image gallery:', err);
        this.currentShop = null;
      },
    });
  }

  private detectActiveTab() {
    const url = this.router.url;
    if (url.includes('/images/shop'))          this.activeTab = 'shop';
    else if (url.includes('/images/website'))  this.activeTab = 'website';
    else if (url.includes('/images/product'))  this.activeTab = 'product';
    else if (url.includes('/images/invoice'))  this.activeTab = 'invoice';
    else if (url.includes('/images/profile'))  this.activeTab = 'profile';
    else if (url.includes('/images/customer')) this.activeTab = 'customer';
    else                                        this.activeTab = 'all';
  }


  navigateToTab(tab: Tab) {
    this.activeTab = tab.id;
    if (tab.route === '') {
      this.router.navigate(['/', this.shopId, 'images']);
    } else {
      this.router.navigate(['/', this.shopId, 'images', tab.route]);
    }
  }

  navigateToSettings() {
    if (!this.shopId) return;
    this.router.navigate(['/', this.shopId, 'settings', 'integrations']);
  }
}
