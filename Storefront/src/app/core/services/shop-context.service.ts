import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TenantService } from './tenant.service';
import { BehaviorSubject, Observable, combineLatest, of, shareReplay } from 'rxjs';
import { catchError, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ShopConfig {
  id: string;
  shopName: string;
  displayName: string;
  slug: string;
  subdomainEnabled: boolean;
  subscriptionPlan: 'free' | 'plus' | 'pro' | 'custom';
  cartEnabled?: boolean;
  description: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logo?: string;
    banner?: string;
    homepageSettings?: any;
    removeBgEnabled?: boolean;
  };
  pages: {
    home: boolean;
    products: boolean;
    offers: boolean;
    contact: boolean;
    shippingPolicy?: boolean;
    returnPolicy?: boolean;
    termsAndConditions?: boolean;
    privacyPolicy?: boolean;
    shippingPolicyContent?: string;
    returnPolicyContent?: string;
    termsAndConditionsContent?: string;
    privacyPolicyContent?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  address: string;
  contactEmail: string;
  contactPhone: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  invoiceConfig?: any;
  websiteEnabled?: boolean;
  paymentModes?: {
    cod: boolean;
    online: boolean;
    bankTransfer: boolean;
  };
  orderAcceptance?: 'auto' | 'manual' | 'paused';
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  };
  upiDetails?: {
    upiId: string;
    accountName: string;
  };
  razorpay?: {
    keyId: string;
    connected: boolean;
  };
  googleAnalytics?: {
    measurementId: string;
    connected: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ShopContextService {
  private readonly configRequestCache = new Map<string, Observable<ShopConfig | null>>();
  private shopConfigSubject = new BehaviorSubject<ShopConfig | null>(null);
  shopConfig$ = this.shopConfigSubject.asObservable();
  private workspaceShopIdSubject = new BehaviorSubject<string | null>(null);
  workspaceShopId$ = this.workspaceShopIdSubject.asObservable().pipe(distinctUntilChanged());
  currentShopId$ = combineLatest([this.shopConfig$, this.workspaceShopId$]).pipe(
    map(([config, workspaceShopId]) => workspaceShopId || config?.id || null),
    distinctUntilChanged(),
  );

  isCartEnabled(): boolean {
    const config = this.shopConfigSubject.value;
    if (config?.cartEnabled !== undefined) {
      return config.cartEnabled;
    }
    const plan = config?.subscriptionPlan;
    return plan === 'pro' || plan === 'custom';
  }

  getShopSync(): ShopConfig | null {
    return this.shopConfigSubject.value;
  }

  private isPublicSiteSubject = new BehaviorSubject<boolean>(true);
  isPublicSite$ = this.isPublicSiteSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tenantService: TenantService,
  ) {
    this.tenantService.currentSlug$.subscribe((slug) => {
      this.isPublicSiteSubject.next(true);
      if (slug) {
        this.loadShopConfig(slug).subscribe();
      } else {
        this.shopConfigSubject.next(null);
      }
    });
  }

  loadShopConfig(slug?: string): Observable<ShopConfig | null> {
    const currentSlug =
      slug || this.tenantService.getSubdomainSlug() || this.tenantService.getPathSlug();

    if (!currentSlug) return of(null);

    const cached = this.configRequestCache.get(currentSlug);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<{ data: ShopConfig }>(`${environment.apiUrl}/website/config`, {
        params: { subdomain: currentSlug },
      })
      .pipe(
        map((res) => {
          const config = res.data;
          if (config.subdomainEnabled === undefined && (config as any).subscriptionPlan) {
            const plan = (config as any).subscriptionPlan;
            config.subdomainEnabled = plan === 'pro' || plan === 'custom';
          }
          return config;
        }),
        tap((config) => {
          this.shopConfigSubject.next(config);
          this.applyTheme(config.theme);
        }),
        catchError((err) => {
          if (err?.status === 404) {
            console.warn('Shop config not found for slug', currentSlug);
          } else {
            console.error('Failed to load shop config', err);
          }
          this.shopConfigSubject.next(null);
          return of(null);
        }),
        shareReplay({ bufferSize: 1, refCount: false, windowTime: 300_000 }),
      );

    this.configRequestCache.set(currentSlug, request$);
    return request$;
  }

  applyTheme(theme: any) {
    if (!theme) return;
    const root = document.documentElement;

    root.style.setProperty('--primary-color', theme.primaryColor || '#000000');
    root.style.setProperty('--secondary-color', theme.secondaryColor || '#ffffff');
    if (theme.fontFamily) {
      root.style.setProperty('--font-family', theme.fontFamily);
    }

    if (theme.primaryColor) {
      const hex = theme.primaryColor;

      const adjustColor = (color: string, amount: number) => {
        return (
          '#' +
          color
            .replace(/^#/, '')
            .replace(/../g, (c) =>
              ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2),
            )
        );
      };

      root.style.setProperty('--color-primary', hex);
      root.style.setProperty('--color-primary-600', hex);
      root.style.setProperty('--color-primary-700', adjustColor(hex, -20));
      root.style.setProperty('--color-primary-800', adjustColor(hex, -40));
      root.style.setProperty('--color-primary-900', adjustColor(hex, -60));
      root.style.setProperty('--color-primary-500', adjustColor(hex, 20));
      root.style.setProperty('--color-primary-400', adjustColor(hex, 40));
      root.style.setProperty('--color-primary-300', adjustColor(hex, 60));
      root.style.setProperty('--color-primary-200', adjustColor(hex, 80));
      root.style.setProperty('--color-primary-100', adjustColor(hex, 160));
      root.style.setProperty('--color-primary-50', adjustColor(hex, 200));
    }
  }
}
