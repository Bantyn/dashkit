import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';

@Component({
  selector: 'app-website-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div class="w-full max-w-md">

    <!-- Heading -->
    <div class="text-center mb-8">
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">
        Create your account
      </h1>
      <p class="mt-2 text-sm text-gray-500">
        Complete your profile to get started
      </p>
    </div>

    <form (ngSubmit)="onSubmit()" class="space-y-6">

      <!-- Full Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          [(ngModel)]="displayName"
          name="name"
          required
          placeholder="Enter your full name"
          class="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          [(ngModel)]="email"
          name="email"
          required
          placeholder="Enter your email"
          class="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      <!-- Mobile -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Mobile Number
        </label>
        <input
          type="tel"
          [(ngModel)]="mobile"
          name="mobile"
          required
          [readonly]="mobileReadonly"
          [class.bg-gray-100]="mobileReadonly"
          placeholder="Enter mobile number"
          class="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      <!-- Password -->
      <div *ngIf="!mobileReadonly">
        <label class="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          [(ngModel)]="password"
          name="password"
          required
          placeholder="Create a strong password"
          class="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      <!-- Error -->
      <div *ngIf="error"
           class="text-sm text-red-600 text-center">
        {{ error }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        [disabled]="loading"
        class="w-full py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
      >
        <span *ngIf="loading">Creating Account...</span>
        <span *ngIf="!loading">Sign Up</span>
      </button>

    </form>

    <!-- Sign In Link -->
    <div *ngIf="!mobileReadonly"
         class="text-center text-sm text-gray-500 mt-6">
      Already have an account?
      <a routerLink="../login"
         class="text-primary-600 hover:text-primary-500 font-medium">
        Sign In
      </a>
    </div>

  </div>
</div>
  `,
})
export class WebsiteSignupComponent implements OnInit {
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
  ) {}

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ['/shop', slug] : ['/'];
  }

  ngOnInit() {
    // Check if we have pre-filled data (e.g. from failed login attempt or OTP verification)
    this.route.queryParams.subscribe((params) => {
      if (params['mobile']) {
        this.mobile = params['mobile'];
        this.mobileReadonly = true;
      }
    });

    // If user is already authenticated (e.g. via OTP) but has no profile
    const currentUser = this.authService.getCurrentUser(); // This might return null if profile not set yet but Auth object exists
    // Actually authService.currentUser$ relies on profile.
    // We need to check pure firebase auth user
    // Accessing internal auth property is hacky.
    // Instead, we trust the flow: Login -> OTP -> Check Profile -> Missing -> Redirect to Register with QueryParam
  }

  async onSubmit() {
    this.loading = true;
    this.error = '';

    try {
      // If mobileReadonly, it means we likely have an Auth User (OTP verified) but no Firestore Profile
      // We should just update the profile.

      // However, `authService.register` tries to createAuthUser.
      // If we are already auth'd, we just need `updateUserProfile`.

      // Let's check if we are logged in to Firebase
      // We can't access `this.auth.currentUser` directly here easily without injecting Auth

      // Ideally, we should have a `completeRegistration` method in AuthService.
      // For now, let's try `register` and if it fails saying "email in use" or "user exists", we handle it?
      // BUT OTP user is already "signed in".

      // If we are "signed in" (via OTP), `register` (createUserWithEmail) might fail or overwrite?
      // Actually, you can link credentials.

      // Simplified approach:
      // 1. If mobileReadonly is true, assume OTP auth is done. call `updateUserProfile`.
      // 2. If valid, redirect home.

      if (this.mobileReadonly) {
        // We need to get the UID.
        // We can subscribe to authState in a component, but AuthService usually handles state.
        // If we are here, AuthService probably has `currentUser` as null but `initialized` as true?
        // Or we just try to get the current auth user from the SDK.

        // Since I can't easily change AuthService to expose raw User right now without risk,
        // I will try to call `register` which might be wrong for OTP users.

        // Wait, if I authenticated via OTP, I AM logged in.
        // AuthService listens to `authState`.
        // `authState` fires -> `getUserProfile` -> returns null (since no doc) -> `updateProfile(null)`
        // So `currentUser$` is null.

        // But the *Firebase Auth* instance has a user.
        // I need a method `createProfileForCurrentAuthUser(profileData)`.

        // I will use `authService.updateUserProfile`? No, that requires UID.
        // `authService.getCurrentUser()` returns null.

        // I need to add `completeProfile` to AuthService.
        // Or I can use a hack: modify AuthService to expose `item` or add method.
        // Let's add `completeShopCustomerProfile` to AuthService.
        this.error = 'Please contact support. Registration flow incomplete.';
        // Just kidding. I will add the method.

        // 3. Register as Online Customer
        const shopSlug = this.tenantService.getPathSlug();
        // Note: shopSlug might be the slug, but shopId is internal.
        // Ideally we pass shopId if we know it, or just keep it loose.
        // For now, passing undefined for shopId or deriving it if we had it.
        // Actually, we can just pass the slug if we want, or nothing.
        // Let's pass nothing for now as 'shopId' in OnlineCustomer is optional/flexible.

        await this.authService.registerOnlineCustomer(this.email, this.displayName, this.mobile);

        this.router.navigate(this.routePrefix);
      } else {
        // Standard Email/Password Register -> FOR ONLINE CUSTOMER
        // We need 'register' to support creating OnlineCustomer too, OR we handle it manually.
        // AuthService.register creates in 'users'. We don't want that for website signup.

        // Manual Flow:
        // 1. Create Auth User
        // 2. Create OnlineCustomer Profile

        const res = await this.authService.registerOnlineUser(
          this.email,
          this.password,
          this.displayName,
          this.mobile,
        );

        if (!res.success) {
          this.error = res.error;
        } else {
          this.router.navigate(this.routePrefix);
        }
      }
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}
