import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Shop } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-website-domain',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="flex-1 overflow-y-auto bg-primary-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Domain</h2>
            <p class="text-sm text-gray-500 mt-1">Set your shop's unique subdomain on Clothify.</p>
          </div>
          <button
            (click)="onSave()"
            [disabled]="form.invalid || saving || loading || !!subdomainError"
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
          <!-- Current Domain Banner -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <i class="bi bi-shop text-primary-600 text-2xl"></i>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-lg">{{ shop?.shopName || 'Live Storefront' }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <a [href]="currentUrl" target="_blank" class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 transition-colors text-sm">
                      {{ currentUrl }}
                      <i class="bi bi-box-arrow-up-right text-xs"></i>
                    </a>
                  </div>
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-3">
                 <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                   <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                   Live
                 </span>
                 <a [href]="currentUrl" target="_blank" class="px-4 py-2 bg-primary-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200 inline-flex items-center gap-2">
                   Visit Store
                 </a>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div class="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <i class="bi bi-link-45deg text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Subdomain</h3>
                <p class="text-xs text-gray-500">
                  Pick a unique subdomain — customers will visit your shop at this address.
                </p>
              </div>
            </div>

            <form [formGroup]="form" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Your subdomain</label>
                <div class="flex items-stretch">
                  <input
                    type="text"
                    formControlName="subdomain"
                    placeholder="your-shop-name"
                    class="flex-1 px-4 py-2.5 border border-r-0 border-gray-200 rounded-l-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <span
                    class="px-4 py-2.5 bg-primary-50 border border-gray-200 rounded-r-xl text-sm text-gray-500 font-medium whitespace-nowrap"
                    >.dashkit.com</span
                  >
                </div>
                <div class="mt-1.5 h-4">
                  @if (subdomainError) {
                    <p class="text-red-500 text-xs flex items-center gap-1">
                      <i class="bi bi-x-circle-fill"></i> {{ subdomainError }}
                    </p>
                  } @else if (subdomainAvailable) {
                    <p class="text-green-600 text-xs flex items-center gap-1">
                      <i class="bi bi-check-circle-fill"></i> Subdomain is available!
                    </p>
                  } @else if (checking) {
                    <p class="text-gray-400 text-xs flex items-center gap-1">
                      <span
                        class="inline-block animate-spin h-3 w-3 border border-gray-400 border-b-transparent rounded-full"
                      ></span>
                      Checking availability...
                    </p>
                  }
                </div>
              </div>

              <div class="p-4 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1">
                <p class="font-semibold">Naming rules:</p>
                <ul class="list-disc list-inside space-y-0.5 text-blue-600">
                  <li>Lowercase letters, numbers, and hyphens only</li>
                  <li>Must start and end with a letter or number</li>
                  <li>3–63 characters</li>
                </ul>
              </div>
            </form>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 mt-6">
            <div class="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <i class="bi bi-globe text-purple-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Custom Domain</h3>
                <p class="text-xs text-gray-500">
                  Connect your own domain (e.g. www.yourbrand.com)
                </p>
              </div>
            </div>

            <form [formGroup]="form" class="space-y-4">
              @if (isTrial(shop)) {
                <div class="p-4 bg-amber-50 rounded-xl flex items-center justify-between border border-amber-200 shadow-sm">
                  <div class="flex items-center gap-3">
                    <i class="bi bi-lock-fill text-amber-600 text-xl"></i>
                    <div>
                      <h4 class="font-semibold text-amber-900 text-sm">Locked in Free Trial</h4>
                      <p class="text-xs text-amber-700 mt-0.5">Custom domains are locked during Free Trial. Upgrade or start billing to connect custom domain.</p>
                    </div>
                  </div>
                  <a [routerLink]="['/', shopId, 'subscription']" class="px-3.5 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap">
                    Start Billing
                  </a>
                </div>
              } @else if (hasFeature('web_domain')) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
                  <div class="flex items-stretch">
                    <input
                      type="text"
                      formControlName="customDomain"
                      placeholder="www.yourbrand.com"
                      class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    To connect your domain, please point your DNS A record to our server IP.
                  </p>
                </div>
              } @else {
                <div class="p-4 bg-purple-50 rounded-xl flex items-center justify-between border border-purple-100">
                  <div>
                    <h4 class="font-medium text-purple-900 text-sm">Upgrade to Plus</h4>
                    <p class="text-xs text-purple-700 mt-1">Custom domains are available on the Plus plan.</p>
                  </div>
                  <a [routerLink]="['/', shopId, 'subscription']" class="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">
                    Upgrade
                  </a>
                </div>
              }
            </form>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 mt-6">
            <div class="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <i class="bi bi-key text-orange-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Headless API Access</h3>
                <p class="text-xs text-gray-500">
                  Generate a Public API Key to fetch your products via REST API from your own custom frontend.
                </p>
              </div>
            </div>

            <div class="space-y-4">
              @if (hasFeature('intg_api_access')) {
                <div *ngIf="(shop | keyvalue) && (shop | keyvalue)?.length && $any(shop).publicApiKey" class="p-4 bg-primary-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Public API Key</label>
                    <code class="text-sm font-mono text-gray-900 mt-1 block">{{ $any(shop).publicApiKey }}</code>
                  </div>
                </div>
                <p *ngIf="!(shop | keyvalue) || !$any(shop).publicApiKey" class="text-sm text-gray-500">
                  No API key generated yet.
                </p>
                
                <button 
                  type="button"
                  (click)="generateApiKey()"
                  [disabled]="generatingKey"
                  class="px-4 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
                >
                  @if (generatingKey) {
                    <div class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"></div>
                  }
                  {{ $any(shop)?.publicApiKey ? 'Regenerate API Key' : 'Generate API Key' }}
                </button>
              } @else {
                <div class="p-4 bg-orange-50 rounded-xl flex items-center justify-between border border-orange-100">
                  <div>
                    <h4 class="font-medium text-orange-900 text-sm">Upgrade to Pro</h4>
                    <p class="text-xs text-orange-700 mt-1">Headless API access is available on the Pro plan.</p>
                  </div>
                  <a routerLink="/settings/billing" class="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors">
                    Upgrade
                  </a>
                </div>
              }
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class WebsiteDomainComponent implements OnInit {
  shopId: string | null = null;
  shop: Shop | null = null;
  form: FormGroup;
  loading = true;
  saving = false;
  checking = false;
  subdomainError: string | null = null;
  subdomainAvailable = false;
  generatingKey = false;

  isTrial(shop: any): boolean {
    if (!shop) return false;
    const plan = String(shop.subscriptionPlan || '').toLowerCase();
    const status = String(shop.subscriptionStatus || '').toLowerCase();
    const payment = String(shop.paymentStatus || '').toLowerCase();
    return plan === 'trial' || status === 'trial' || payment === 'trial';
  }

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toastService: ToastService,
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      subdomain: [
        '',
        [Validators.required, Validators.pattern(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)],
      ],
      customDomain: [''],
    });

    this.form
      .get('subdomain')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        if (value && this.form.get('subdomain')?.valid && value !== this.shop?.slug) {
          this.checkSubdomain(value);
        } else {
          this.subdomainAvailable = false;
          this.subdomainError = null;
          this.checking = false;
        }
      });
  }

  get currentUrl(): string {
    if (!this.shop) return environment.storefrontUrl;
    
    if (this.shop.customDomain) {
      return `https://${this.shop.customDomain}`;
    }
    
    return `${environment.storefrontUrl}/shop/${this.shop.slug}`;
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
        this.form.patchValue({ 
          subdomain: this.shop?.slug || '',
          customDomain: (this.shop as any)?.customDomain || ''
        });
        
        if (!this.hasFeature('web_domain')) {
          this.form.get('customDomain')?.disable();
        }
        
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.showError(err?.error?.message || 'Failed to load domain settings.');
      },
    });
  }

  checkSubdomain(subdomain: string) {
    this.checking = true;
    this.subdomainError = null;
    this.subdomainAvailable = false;
    this.http.post(`${environment.apiUrl}/shops/check-subdomain`, { subdomain }).subscribe({
      next: () => {
        this.checking = false;
        this.subdomainAvailable = true;
      },
      error: () => {
        this.checking = false;
        this.subdomainAvailable = false;
        this.subdomainError = 'This subdomain is already taken.';
        this.form.get('subdomain')?.setErrors({ unavailable: true });
      },
    });
  }

  onSave() {
    if (this.form.invalid || !this.shopId || this.subdomainError) return;
    this.saving = true;
    const payload = { 
      slug: this.form.value.subdomain,
      customDomain: this.form.value.customDomain?.trim() || null
    };
    
    this.shopService.updateShop(this.shopId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.showSuccess('Domain settings updated successfully!');
        if (this.shop) {
          this.shop.slug = payload.slug;
          (this.shop as any).customDomain = payload.customDomain;
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.toastService.showError(err?.error?.message || 'Failed to update domain settings.');
      },
    });
  }

  generateApiKey() {
    if (!this.shopId) return;
    this.generatingKey = true;
    this.http.post<{ data: { publicApiKey: string } }>(`${environment.apiUrl}/shops/${this.shopId}/generate-api-key`, {}).subscribe({
      next: (res) => {
        if (this.shop) {
          (this.shop as any).publicApiKey = res.data.publicApiKey;
        }
        this.generatingKey = false;
        this.toastService.showSuccess('Public API Key generated successfully!');
      },
      error: (err: any) => {
        this.generatingKey = false;
        this.toastService.showError(err?.error?.message || 'Failed to generate API Key.');
      }
    });
  }

  hasFeature(featureKey: string): boolean {
    return (this.shop as any)?.features?.includes(featureKey) ?? false;
  }
}
