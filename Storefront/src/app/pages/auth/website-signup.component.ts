import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-website-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
  <div class="w-full max-w-md">

    <div class="text-center mb-8" *ngIf="shopConfig$ | async as config">
      <a [routerLink]="routePrefix" class="inline-block mb-6">
        <img *ngIf="config.theme?.logo" [src]="config.theme?.logo" [alt]="config.displayName" class="h-10 mx-auto object-contain" />
        <span *ngIf="!config.theme?.logo" class="text-xl font-bold text-gray-900 tracking-tight">{{ config.displayName || config.shopName }}</span>
      </a>
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Create your account</h1>
      <p class="mt-2 text-sm text-gray-500">Complete your profile to get started</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <form (ngSubmit)="onSubmit()" class="space-y-4">

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
          <input type="text" [(ngModel)]="displayName" name="name" required placeholder="Enter your full name"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
          <input type="email" [(ngModel)]="email" name="email" required placeholder="Enter your email"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Number</label>
          <input type="tel" [(ngModel)]="mobile" name="mobile" placeholder="10-digit mobile number"
            [readonly]="mobileReadonly" [class.bg-gray-50]="mobileReadonly"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
        </div>

        <div *ngIf="!mobileReadonly">
          <label class="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
          <input type="password" [(ngModel)]="password" name="password" required placeholder="Create a password (min 6 chars)"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
        </div>

        <div *ngIf="error" class="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 text-center">{{ error }}</div>

        <button type="submit" [disabled]="loading"
          class="w-full py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2">
          {{ loading ? 'Creating Account...' : 'Sign Up' }}
        </button>

      </form>
    </div>

    <p class="text-center text-sm text-gray-500 mt-6">
      Already have an account?
      <a [routerLink]="[...routePrefix, 'auth', 'login']" class="text-gray-900 font-semibold hover:underline">Sign In</a>
    </p>

  </div>
</div>
  `,
})
export class WebsiteSignupComponent implements OnInit {
  shopConfig$;
  displayName = '';
  email = '';
  mobile = '';
  password = '';
  mobileReadonly = false;
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private tenantService: TenantService,
    private shopContext: ShopContextService,
  ) {
    this.shopConfig$ = this.shopContext.shopConfig$;
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['mobile']) {
        this.mobile = params['mobile'];
        this.mobileReadonly = true;
      }
    });
  }

  async onSubmit() {
    this.loading = true;
    this.error = '';
    try {
      if (this.mobileReadonly) {
        // User came from phone OTP — just create profile for current Firebase user
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) { this.error = 'Session expired. Please try signing in again.'; this.loading = false; return; }
        const db = getFirestore();
        await setDoc(doc(db, 'online_customers', user.uid), {
          uid: user.uid,
          name: this.displayName,
          email: this.email || user.email || '',
          mobile: this.mobile,
          role: 'customer',
          createdAt: new Date(),
        });
        const profile = await this.authService.getUserProfile(user.uid);
        this.authService.updateProfile(profile);
        this.router.navigate(this.routePrefix);
      } else {
        const res = await this.authService.register(this.email, this.password, {
          name: this.displayName,
          mobile: this.mobile,
          role: 'customer',
        });
        if (!res.success) {
          this.error = res.error || 'Registration failed.';
        } else {
          this.router.navigate(this.routePrefix);
        }
      }
    } catch (e: any) {
      this.error = e.message || 'An error occurred.';
    } finally {
      this.loading = false;
    }
  }
}
