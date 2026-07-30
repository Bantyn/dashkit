import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Shop } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-website-overview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-primary-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Your Website</h2>
            <p class="text-sm text-gray-500 mt-1">Control your public-facing shop website.</p>
          </div>
          <button
            (click)="onSave()"
            [disabled]="saving || loading"
            class="px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
          >
            @if (saving) {
              <div
                class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"
              ></div>
            }
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

        @if (loading) {
          <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        } @else {
          <!-- Enable / Disable Toggle -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <i class="bi bi-globe text-blue-600 text-lg"></i>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Enable Public Website</p>
                  <p class="text-sm text-gray-500">
                    Allow customers to discover and visit your shop online.
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer" [formGroup]="form">
                <input type="checkbox" formControlName="websiteEnabled" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>

            @if (shop?.websiteEnabled && shop?.slug) {
              <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <p class="text-sm text-gray-500">Your website is live at:</p>
                <a
                  [href]="'https://' + shop!.slug + '.clothify.com'"
                  target="_blank"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {{ shop!.slug }}.clothify.com
                  <i class="bi bi-box-arrow-up-right text-xs"></i>
                </a>
              </div>
            }
          </div>

          <!-- Quick Links -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (card of quickLinks; track card.label) {
              <a
                [routerLink]="card.route"
                class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center ' + card.bg">
                  <i [class]="'bi ' + card.icon + ' text-lg ' + card.color"></i>
                </div>
                <div>
                  <p
                    class="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors"
                  >
                    {{ card.label }}
                  </p>
                  <p class="text-xs text-gray-400">{{ card.desc }}</p>
                </div>
              </a>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class WebsiteOverviewComponent implements OnInit {
  shopId: string | null = null;
  shop: Shop | null = null;
  form: FormGroup;
  loading = true;
  saving = false;

  quickLinks = [
    {
      label: 'Theme',
      desc: 'Colors & fonts',
      icon: 'bi-palette-fill',
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      route: '../website/theme',
    },
    {
      label: 'Pages',
      desc: 'Enable / disable pages',
      icon: 'bi-file-earmark-text-fill',
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      route: '../website/pages',
    },
    {
      label: 'Domain',
      desc: 'Subdomain settings',
      icon: 'bi-link-45deg',
      bg: 'bg-green-50',
      color: 'text-green-600',
      route: '../website/domain',
    },
    {
      label: 'Settings',
      desc: 'Plan & visibility',
      icon: 'bi-sliders',
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      route: '../website/settings',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({ websiteEnabled: [false] });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.load();
    });
  }

  load() {
    if (!this.shopId) return;
    this.loading = true;
    this.shopService.getShop(this.shopId).subscribe({
      next: (res: any) => {
        this.shop = res.data;
        this.form.patchValue({ websiteEnabled: this.shop?.websiteEnabled ?? false });
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.showError(err?.error?.message || 'Failed to load website settings.');
      },
    });
  }

  onSave() {
    if (!this.shopId) return;
    this.saving = true;
    this.shopService.updateShop(this.shopId, this.form.value).subscribe({
      next: () => {
        this.saving = false;
        if (this.shop) this.shop.websiteEnabled = this.form.value.websiteEnabled;
        this.toastService.showSuccess('Website status updated successfully!');
      },
      error: (err: any) => {
        this.saving = false;
        this.toastService.showError(err?.error?.message || 'Failed to update website status.');
      },
    });
  }
}
