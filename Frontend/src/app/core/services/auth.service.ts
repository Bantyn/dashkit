import { Auth, authState } from '@angular/fire/auth';
import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  inject,
  PLATFORM_ID,
  Inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import { OnlineCustomer } from '../models/online-customer.model';
import { TenantService } from './tenant.service';

export interface CustomerAddress {
  id?: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: 'shop_owner' | 'customer' | 'admin' | 'online_customer' | 'staff';
  mobile?: string;
  phone?: string;
  shopId?: string;
  subscriptionPlan?: string;
  features?: string[];
  featureStates?: Record<string, string>;
  address?: string; // Legacy
  addresses?: CustomerAddress[];
  name?: string;
  roles?: string[];
  permissions?: string[];
  isActive?: boolean;
  createdAt: Date;
  tags?: string[];
  dateOfBirth?: string;
  wishlist?: string[];
};

type BackendProfileEnvelope = {
  success: boolean;
  message: string;
  data: {
    profile: Record<string, any>;
    shopId?: string;
    subscriptionPlan?: string;
    features?: string[];
    featureStates?: Record<string, string>;
    roles?: string[];
    permissions?: string[];
  };
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredProfile());
  public currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  private initialized = new BehaviorSubject<boolean>(false);
  public initialized$ = this.initialized.asObservable();

  private readonly apiUrl = environment.apiUrl;
  private readonly publicApiUrl = environment.publicApiUrl;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private injector: Injector,
    private tenantService: TenantService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Listen to auth state changes using stable observable
      // We use onAuthStateChanged for the initial wait to be 100% sure we've checked persistence
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        // Initial state received — we are now "initialized"
        if (!this.initialized.value) {
          this.initialized.next(true);
        }
        unsubscribe(); // only need the first one to set initialized
      });

      authState(this.auth).subscribe({
        next: async (user) => {
          if (user) {
            // Wrap in injection context to avoid warnings
            let profile = await runInInjectionContext(this.injector, () =>
              this.getUserProfile(user.uid),
            );

            // If profile fetch failed (e.g. network error) but we have a valid cached profile, use it
            if (!profile) {
              const cached = this.getStoredProfile();
              if (cached && cached.uid === user.uid) {
                console.warn('Using cached profile due to fetch failure');
                profile = cached;
              }
            }

            if (profile && profile.isActive === false) {
              await signOut(this.auth);
              this.updateProfile(null);
              if (!window.location.pathname.includes('/login')) {
                window.location.href = 'http://localhost:4202';
              }
              return;
            }

            this.updateProfile(profile);
          } else {
            this.updateProfile(null);
          }
        },
        error: (error) => {
          console.error('Auth state error:', error);
          if (!this.initialized.value) {
            this.initialized.next(true);
          }
        },
      });
    } else {
      this.initialized.next(true);
    }
  }

  async getIdToken(): Promise<string | undefined> {
    return this.auth.currentUser?.getIdToken();
  }

  private stripUndefined<T extends Record<string, any>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as T;
  }

  private parseCreatedAt(value: unknown): Date {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (
      value &&
      typeof value === 'object' &&
      'seconds' in value &&
      typeof (value as { seconds?: unknown }).seconds === 'number'
    ) {
      const parsed = new Date((value as { seconds: number }).seconds * 1000);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date();
  }

  private normalizeRole(legacyRole?: string, roles: string[] = []): UserProfile['role'] {
    if (legacyRole === 'online_customer') return 'online_customer';
    if (legacyRole === 'customer') return 'customer';
    if (legacyRole === 'staff') return 'staff';
    if (legacyRole === 'admin') return 'admin';
    if (legacyRole === 'shop_owner') return 'shop_owner';

    if (roles.includes('owner')) return 'shop_owner';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('staff')) return 'staff';
    if (roles.includes('customer')) return 'customer';

    return 'shop_owner';
  }

  private normalizeProfile(raw: Record<string, any> | null | undefined): UserProfile | null {
    if (!raw?.['uid'] || !raw?.['email']) {
      return null;
    }

    const roles = Array.isArray(raw['roles']) ? raw['roles'] : [];
    const permissions = Array.isArray(raw['permissions']) ? raw['permissions'] : [];

    return {
      uid: String(raw['uid']),
      email: String(raw['email']),
      displayName: String(raw['displayName'] || raw['name'] || raw['email']),
      name: raw['name'] ? String(raw['name']) : undefined,
      role: this.normalizeRole(raw['role'], roles),
      roles,
      permissions,
      mobile: raw['mobile'] ? String(raw['mobile']) : undefined,
      phone: raw['phone'] ? String(raw['phone']) : undefined,
      shopId: raw['shopId'] ? String(raw['shopId']) : undefined,
      subscriptionPlan: raw['subscriptionPlan'] ? String(raw['subscriptionPlan']) : 'free',
      features: Array.isArray(raw['features']) ? raw['features'] : [],
      featureStates: raw['featureStates'] || {},
      address: raw['address'] ? String(raw['address']) : undefined,
      isActive: raw['isActive'] !== false,
      createdAt: this.parseCreatedAt(raw['createdAt']),
    };
  }

  private async getAuthenticatedHeaders(
    extraHeaders: Record<string, string> = {},
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = { ...extraHeaders };
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const shopId = this.currentUserSubject.value?.shopId || this.getStoredProfile()?.shopId;
    if (shopId) {
      headers['x-shop-id'] = shopId;
    }

    return headers;
  }

  private async registerUserWithBackend(payload: {
    uid: string;
    email: string;
    displayName: string;
    role?: string;
    mobile?: string;
    shopId?: string;
    shopName?: string;
    ownerName?: string;
    gstIn?: string;
    pickupAddress?: { address?: string; city?: string; state?: string; pincode?: string };
    branchCount?: number;
    planCode?: string;
    reqId?: string;
    token?: string;
  }): Promise<void> {
    const response = await fetch(`${this.publicApiUrl}/auth/register`, {
      method: 'POST',
      headers: await this.getAuthenticatedHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(this.stripUndefined(payload)),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.message || 'Failed to sync user with backend');
    }
  }

  private async fetchAdminProfile(): Promise<UserProfile | null> {
    const response = await fetch(`${this.apiUrl}/auth/profile`, {
      method: 'GET',
      headers: await this.getAuthenticatedHeaders(),
    });

    const body = (await response.json().catch(() => null)) as BackendProfileEnvelope | null;
    if (!response.ok || !body?.data?.profile) {
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      throw new Error(body?.message || 'Failed to load profile');
    }

    return this.normalizeProfile({
      ...body.data.profile,
      shopId: body.data.shopId || body.data.profile['shopId'],
      subscriptionPlan: body.data.subscriptionPlan || body.data.profile['subscriptionPlan'],
      features: body.data.features || body.data.profile['features'] || [],
      featureStates: body.data.featureStates || body.data.profile['featureStates'] || {},
      roles: body.data.roles || [],
      permissions: body.data.permissions || [],
    });
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    displayName: string,
    role: 'shop_owner' | 'customer' = 'shop_owner',
    mobile?: string,
    pickupAddress?: { address?: string; city?: string; state?: string; pincode?: string },
    branchCount?: number,
    skipRedirect?: boolean,
    planCode?: string,
    reqId?: string,
    token?: string,
    ownerName?: string,
    gstIn?: string,
  ) {
    console.log('Registering user:', { email, displayName, role, mobile, planCode, ownerName }); // Debug log
    try {
      let user = this.auth.currentUser;

      if (password) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        user = userCredential.user;
      }

      if (!user) {
        throw new Error('Authentication failed. No user context found.');
      }

      // Derive shopId locally (same formula used by backend) — do NOT write to Firestore here.
      // The backend /auth/register endpoint is the SOLE creator of the shop document so that
      // the correct subscriptionPlan ('trial'), branchLimit, and trialExpiresAt are set atomically.
      const shopId = role === 'shop_owner' ? `shop_${user.uid}` : undefined;

      await this.registerUserWithBackend({
        uid: user.uid,
        email,
        displayName,
        shopName: displayName,
        ownerName,
        gstIn,
        mobile,
        shopId,
        role,
        pickupAddress,
        branchCount,
        planCode,
        reqId,
        token,
      });

      const userProfile =
        (await this.getUserProfile(user.uid)) ||
        this.normalizeProfile({
          uid: user.uid,
          email,
          displayName,
          mobile,
          shopId,
          role,
          roles: role === 'shop_owner' ? ['owner'] : [role],
          permissions: role === 'shop_owner' ? ['*'] : [],
          createdAt: new Date(),
        });

      this.updateProfile(userProfile);
      if (userProfile && !skipRedirect) {
        await this.redirectToDashboard(userProfile.role);
      }

      return { success: true, user: userProfile };
    } catch (error: any) {
      console.error('Registration error:', error);

      const code: string = error?.code || '';
      let errorMessage = error?.message || 'Registration failed';

      // Extract inner error message if present in customData
      if (
        error.customData &&
        error.customData._tokenResponse &&
        error.customData._tokenResponse.error
      ) {
        errorMessage = error.customData._tokenResponse.error.message;
      } else if (error.customData && error.customData.message) {
        errorMessage = error.customData.message;
      }

      // Map common error codes
      if (errorMessage.includes('EMAIL_EXISTS')) {
        errorMessage = 'This email is already registered. Please sign in.';
      } else if (errorMessage.includes('WEAK_PASSWORD')) {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (errorMessage.includes('INVALID_EMAIL')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in.';
      } else if (code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign-in is not enabled in Firebase.';
      } else if (code === 'auth/network-request-failed') {
        errorMessage =
          'Firebase sign-up failed. Please verify Email/Password auth and localhost domain in Firebase Console.';
      }

      return { success: false, error: errorMessage };
    }
  }

  async sendRegistrationEmailOtp(email: string): Promise<any> {
    try {
      const response = await fetch(`${this.publicApiUrl}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response.');
      }
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to send verification code');
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send verification code');
    }
  }

  async verifyRegistrationEmailOtp(email: string, otp: string): Promise<any> {
    try {
      const response = await fetch(`${this.publicApiUrl}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response.');
      }
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Verification failed');
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Verification failed');
    }
  }

  async registerWithPayment(
    email: string,
    password: string,
    displayName: string,
    role: 'shop_owner',
    mobile: string | undefined,
    shopName: string,
    pickupAddress:
      | { address?: string; city?: string; state?: string; pincode?: string }
      | undefined,
    paymentData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
      planCode: string;
      billingCycle: string;
      branchCount?: number;
    },
    ownerName?: string,
    gstIn?: string,
  ) {
    try {
      let user = this.auth.currentUser;

      if (password) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        // 1. Create Firebase Auth User
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        user = userCredential.user;
      }

      if (!user) {
        throw new Error('Authentication failed. No user context found.');
      }

      // 2. Call backend to verify payment AND register shop/profile in DB
      const response = await fetch(`${this.publicApiUrl}/auth/register-with-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          this.stripUndefined({
            uid: user.uid,
            email,
            displayName,
            mobile,
            shopName,
            ownerName,
            gstIn,
            role,
            pickupAddress,
            ...paymentData,
          }),
        ),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || 'Failed to sync user with backend after payment');
      }

      // 3. Update local profile state
      const shopId = `shop_${user.uid}`;
      const userProfile = this.normalizeProfile({
        uid: user.uid,
        email,
        displayName,
        mobile,
        shopId,
        role,
        roles: ['owner'],
        permissions: ['*'],
        createdAt: new Date(),
        subscriptionPlan: paymentData.planCode,
      });

      this.updateProfile(userProfile);
      if (userProfile) {
        await this.redirectToDashboard(userProfile.role);
      }

      return { success: true, user: userProfile };
    } catch (error: any) {
      console.error('Registration with payment error:', error);

      // If backend sync failed, we might want to delete the Firebase user here
      // or instruct them to contact support.
      try {
        const user = this.auth.currentUser;
        if (user) {
          await user.delete();
        }
      } catch (e) {
        console.error('Could not cleanup firebase auth after backend failure', e);
      }

      let errorMessage = error?.message || 'Registration failed';
      if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = 'This email is already registered. Please sign in.';
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register customer (Complete Profile after OTP)
   */
  async registerCustomer(email: string, displayName: string, mobile: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    await this.registerUserWithBackend({
      uid: user.uid,
      email,
      displayName,
      mobile,
      role: 'customer',
    });

    const userProfile =
      (await this.getUserProfile(user.uid)) ||
      this.normalizeProfile({
        uid: user.uid,
        email,
        displayName,
        mobile,
        role: 'customer',
        roles: ['customer'],
        permissions: [],
        createdAt: new Date(),
      });

    this.updateProfile(userProfile);
    return { success: true, user: userProfile };
  }

  /**
   * Login user
   */
  async login(email: string, password: string, rememberMe: boolean = true) {
    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(this.auth, persistence);

      // 1. Call backend server-side progressive lockout & account status verification
      const response = await fetch(`${this.publicApiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (body?.code === 'ACCOUNT_LOCKED') {
          return {
            success: false,
            code: 'ACCOUNT_LOCKED',
            lockUntil: body.lockUntil,
            remainingSeconds: body.remainingSeconds || 120,
            message: body.message || 'Too many failed login attempts. Please try again later.',
          };
        }

        if (body?.code === 'ACCOUNT_SUSPENDED') {
          return {
            success: false,
            code: 'ACCOUNT_SUSPENDED',
            message:
              body.message ||
              'Your shop has been temporarily suspended due to multiple unsuccessful login attempts. Please contact the DashKit Team to reactivate your account.',
          };
        }

        if (body?.code === 'ACCOUNT_DISABLED' || body?.code === 'ACCOUNT_ARCHIVED' || body?.code === 'ACCOUNT_DELETED') {
          return {
            success: false,
            code: body.code,
            message: body.message,
          };
        }

        return {
          success: false,
          error: body?.message || 'Invalid email or password.',
          failedLoginAttempts: body?.failedLoginAttempts,
          remainingAttempts: body?.remainingAttempts,
        };
      }


      // 2. Perform Firebase Auth Sign-in once server validates credentials
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const profile = await runInInjectionContext(this.injector, () =>
        this.getUserProfile(user.uid),
      );

      if (profile && profile.isActive === false) {
        await signOut(this.auth);
        return { success: false, inactive: true, shopId: profile.shopId, email: profile.email };
      }

      this.updateProfile(profile);

      if (profile) {
        await this.redirectToDashboard(profile.role);
      }

      return { success: true, user: profile };
    } catch (error: any) {
      console.error('Detailed login error:', error);
      const code: string = error?.code || '';
      const msg: string = error?.message || '';

      let errorMessage = 'Invalid email or password.';

      if (code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else {
        // According to Security Requirements: "Return identical authentication errors for invalid email/password combinations."
        errorMessage = 'Invalid email or password.';
      }

      return { success: false, error: errorMessage };
    }
  }



  /**
   * Refresh the current user profile from the backend.
   * Useful after a plan upgrade or setting change.
   */
  async refreshProfile(): Promise<UserProfile | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    const profile = await runInInjectionContext(this.injector, () => this.getUserProfile(user.uid));
    this.updateProfile(profile);
    return profile;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await signOut(this.auth);
      this.updateProfile(null);
      this.router.navigate(['/login']);
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Login with Google
   */
  async loginWithGoogleProvider() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);

      const profile = await runInInjectionContext(this.injector, () =>
        this.getUserProfile(userCredential.user.uid),
      );

      // If user profile exists, log them in fully
      if (profile) {
        if (profile.isActive === false) {
          await signOut(this.auth);
          return { success: false, inactive: true, shopId: profile.shopId, email: profile.email };
        }
        this.updateProfile(profile);
        return {
          success: true,
          user: profile,
          isNewUser: false,
          firebaseUser: userCredential.user,
        };
      }

      // If no profile, they are a new user signing up via Google
      return { success: true, isNewUser: true, firebaseUser: userCredential.user };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      const code: string = error?.code || '';
      let errorMessage = error?.message || 'Google Sign-In failed.';

      if (code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google Sign-In was cancelled. Please try again.';
      } else if (code === 'auth/cancelled-popup-request') {
        errorMessage = 'Google Sign-In popup was cancelled due to a new request.';
      } else if (code === 'auth/popup-blocked') {
        errorMessage =
          'Google Sign-In popup was blocked by your browser. Please allow popups for this site.';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete current auth user
   */
  async deleteAuthUser(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await deleteUser(user);
        this.updateProfile(null);
        this.router.navigate(['/login']);
        return { success: true };
      }
      return { success: false, error: 'No user logged in' };
    } catch (error: any) {
      console.error('Delete user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile in Firestore

   */
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
    try {
      await setDoc(doc(this.firestore, 'users', uid), this.stripUndefined(data), { merge: true });
      const current = this.getCurrentUser();
      if (current && current.uid === uid) {
        this.updateProfile({ ...current, ...data });
      }
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Register online customer (Website)
   */
  async registerOnlineCustomer(
    email: string,
    displayName: string,
    mobile: string,
    shopId?: string,
  ) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    const onlineCustomer: OnlineCustomer = {
      id: user.uid,
      email: email,
      displayName: displayName,
      mobile: mobile,
      role: 'online_customer',
      shopId: shopId,
      createdAt: new Date(),
    };

    // Save to distinct collection 'online_customers'
    await setDoc(
      doc(this.firestore, 'online_customers', user.uid),
      this.stripUndefined(onlineCustomer),
    );

    // Map to UserProfile for internal app state compatibility
    const userProfile: UserProfile = {
      uid: onlineCustomer.id,
      email: onlineCustomer.email,
      displayName: onlineCustomer.displayName,
      mobile: onlineCustomer.mobile,
      role: 'online_customer',
      shopId: onlineCustomer.shopId,
      createdAt: onlineCustomer.createdAt,
    };

    this.updateProfile(userProfile);
    return { success: true, user: userProfile };
  }

  /**
   * Register new Online Customer (Email/Password)
   */
  async registerOnlineUser(email: string, password: string, displayName: string, mobile?: string) {
    try {
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const onlineCustomer: OnlineCustomer = {
        id: user.uid,
        email: email,
        displayName: displayName,
        mobile: mobile || '',
        role: 'online_customer',
        createdAt: new Date(),
      };

      await setDoc(
        doc(this.firestore, 'online_customers', user.uid),
        this.stripUndefined(onlineCustomer),
      );

      // Map to UserProfile
      const userProfile: UserProfile = {
        uid: onlineCustomer.id,
        email: onlineCustomer.email,
        displayName: onlineCustomer.displayName,
        mobile: onlineCustomer.mobile,
        role: 'online_customer',
        createdAt: onlineCustomer.createdAt,
      };

      this.updateProfile(userProfile);
      return { success: true, user: userProfile };
    } catch (error: any) {
      console.error('Online Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user profile from Firestore (Users or OnlineCustomers)
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // Determine Context
      const isPublicSite =
        !!this.tenantService.getSubdomainSlug() || !!this.tenantService.getPathSlug();

      // 1. If Public Site (e.g. /shop/:slug or subdomain), prioritize Online Customers
      // AND STRICTLY IGNORE Shop Owner sessions (per user request)
      if (isPublicSite) {
        try {
          const customerDoc = await getDoc(doc(this.firestore, 'online_customers', uid));
          if (customerDoc.exists()) {
            const data = customerDoc.data() as OnlineCustomer;
            return {
              uid: data.id,
              email: data.email,
              displayName: data.displayName,
              mobile: data.mobile,
              role: 'online_customer',
              shopId: data.shopId,
              createdAt: data.createdAt,
              tags: (data as any).tags || [],
            };
          }
        } catch (error: any) {
          // If permission denied (or other error), just treat as Guest
          console.warn(
            'Failed to fetch online_customer profile (likely Shop Owner session):',
            error.code,
          );
        }

        // If on public site and no online_customer profile found (or error), return null.
        // This effectively "masks" the Shop Owner session if they are logged in via Firebase Auth.
        return null;
      }

      // 2. If Admin/Main App Context (localhost:4200/dashboard etc)
      try {
        const profile = await this.fetchAdminProfile();
        if (profile) {
          return profile;
        }
      } catch (error) {
        console.warn('Backend profile fetch failed, falling back to Firestore profile', error);
      }

      // Fallback for partially migrated sessions
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        return this.normalizeProfile(userDoc.data() as Record<string, any>);
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Create default shop for new shop owner
   */
  private async createDefaultShop(
    ownerId: string,
    shopName: string,
    pickupAddress?: { address?: string; city?: string; state?: string; pincode?: string },
  ): Promise<string> {
    const shopId = `shop_${ownerId}`;
    const shopData: any = {
      id: shopId,
      ownerId: ownerId,
      shopName: shopName,
      slug: shopName.toLowerCase().replace(/\s+/g, '-'),
      displayName: shopName,
      status: 'active',
      createdAt: new Date(),
      subscriptionPlan: 'free',
    };

    if (
      pickupAddress &&
      (pickupAddress.address || pickupAddress.city || pickupAddress.state || pickupAddress.pincode)
    ) {
      shopData.pickupAddress = {
        address: pickupAddress.address || '',
        city: pickupAddress.city || '',
        state: pickupAddress.state || '',
        pincode: pickupAddress.pincode || '',
      };
    }

    await setDoc(doc(this.firestore, 'shops', shopId), this.stripUndefined(shopData));

    return shopId;
  }

  /**
   * Redirect based on user role
   */
  private async redirectToDashboard(role: string) {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'customer':
        this.router.navigate(['/customer/profile']);
        break;
      case 'online_customer':
        // Do nothing, let the caller handle redirect (e.g. WebsiteLoginComponent -> Shop Home)
        break;
      case 'shop_owner':
      default:
        const user = this.getCurrentUser();
        if (user && user.shopId) {
          this.router.navigate(['/', user.shopId, 'dashboard']);
        } else {
          // Fallback if no shopId (shouldn't happen for valid shop owners)
          this.router.navigate(['/dashboard']);
        }
        break;
    }
  }

  /**
   * Setup reCAPTCHA verifier.
   * Uses the 'normal' (visible) widget as recommended by Firebase for reliability.
   * The widgetId is stored globally on window so grecaptcha.reset() can be called
   * on failure, as described in the Firebase phone auth guide.
   *
   * @param elementId  - ID of the DOM element to render the widget into
   * @param onExpired  - Optional callback when reCAPTCHA expires
   */
  setupRecaptcha(elementId: string, onExpired?: () => void): RecaptchaVerifier {
    // Set language to auto-detect from browser
    this.auth.languageCode = null; // null = use device language

    const verifier = new RecaptchaVerifier(this.auth, elementId, {
      size: 'normal', // visible widget — most reliable across browsers
      callback: (_response: any) => {
        // reCAPTCHA solved — signInWithPhoneNumber can now proceed
      },
      'expired-callback': () => {
        // Token expired — reset the widget so the user solves it again
        if (onExpired) onExpired();
      },
    });

    // Pre-render the widget and store widgetId on window for grecaptcha.reset()
    verifier
      .render()
      .then((widgetId: number) => {
        (window as any)['recaptchaWidgetId'] = widgetId;
      })
      .catch(() => {
        /* ignore pre-render errors */
      });

    return verifier;
  }

  /**
   * Reset the reCAPTCHA widget after a failed OTP send.
   * Per Firebase guide: call this after signInWithPhoneNumber fails.
   */
  resetRecaptcha(verifier?: RecaptchaVerifier): void {
    try {
      const widgetId = (window as any)['recaptchaWidgetId'];
      if (widgetId !== undefined && (window as any)['grecaptcha']) {
        (window as any)['grecaptcha'].reset(widgetId);
      } else if (verifier) {
        // Fallback: re-render the verifier
        verifier
          .render()
          .then((id: number) => {
            (window as any)['recaptchaWidgetId'] = id;
          })
          .catch(() => {});
      }
    } catch (e) {
      // Ignore reset errors
    }
  }

  /**
   * Send OTP to the given E.164 phone number.
   * Wraps signInWithPhoneNumber and resets reCAPTCHA on failure.
   */
  async sendPhoneOtp(
    phoneNumber: string,
    appVerifier: RecaptchaVerifier,
  ): Promise<ConfirmationResult> {
    try {
      return await signInWithPhoneNumber(this.auth, phoneNumber, appVerifier);
    } catch (error) {
      // Firebase guide: reset reCAPTCHA on error so user can try again
      this.resetRecaptcha(appVerifier);
      throw error;
    }
  }

  /**
   * Sign in with Phone Number (legacy — use sendPhoneOtp instead)
   */
  async signInWithPhoneNumber(
    phoneNumber: string,
    appVerifier: RecaptchaVerifier,
  ): Promise<ConfirmationResult> {
    return this.sendPhoneOtp(phoneNumber, appVerifier);
  }

  // ---------------------------------------------------------------------------
  // Email OTP Authentication (alternative to Firebase Phone Auth)
  // ---------------------------------------------------------------------------

  /**
   * Request a 4-digit OTP to be sent to the given email via backend.
   * Returns { otp } in dev mode (visible in response for testing).
   */
  async sendEmailOtp(email: string): Promise<{ devOtp?: string; expiresIn: number }> {
    const res = await fetch(`${this.apiUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Failed to send OTP');
    }
    return { devOtp: body.data?.otp, expiresIn: body.data?.expiresIn ?? 300 };
  }

  /**
   * Verify a 4-digit OTP against the backend.
   * On success, signs the user into Firebase using the returned custom token
   * and loads their profile — fully auto-login.
   */
  async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const body = await res.json();

      if (!res.ok) {
        return { success: false, error: body.message || 'OTP verification failed' };
      }

      const { customToken, profile } = body.data;

      // Sign into Firebase with the custom token from backend
      const { signInWithCustomToken, setPersistence, browserLocalPersistence } =
        await import('firebase/auth');
      await setPersistence(this.auth, browserLocalPersistence);
      const credential = await signInWithCustomToken(this.auth, customToken);

      // Update local profile state
      const userProfile =
        profile ??
        (await runInInjectionContext(this.injector, () =>
          this.getUserProfile(credential.user.uid),
        ));
      this.updateProfile(userProfile);

      if (userProfile) {
        await this.redirectToDashboard(userProfile.role);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[EmailOTP] verify error:', err);
      return { success: false, error: err.message || 'Verification failed. Please try again.' };
    }
  }

  /**
   * Check if user exists by email or phone
   */
  async checkUserExists(
    identifier: string,
  ): Promise<{ exists: boolean; method: 'email' | 'phone' | 'unknown' }> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const usersRef = collection(this.firestore, 'users');
        const onlineCustomersRef = collection(this.firestore, 'online_customers');

        // Check users collection (for Admin/Shop Owner)
        // Check by Email
        try {
          const qEmail = query(usersRef, where('email', '==', identifier));
          const emailSnapshot = await getDocs(qEmail);
          if (!emailSnapshot.empty) {
            return { exists: true, method: 'email' as const };
          }
        } catch (e) {
          // Ignore individual query error
        }

        // Check by Phone
        try {
          const qPhone = query(usersRef, where('mobile', '==', identifier));
          const phoneSnapshot = await getDocs(qPhone);
          if (!phoneSnapshot.empty) {
            return { exists: true, method: 'phone' as const };
          }
        } catch (e) {
          // Ignore individual query error
        }

        try {
          const qPhone = query(usersRef, where('phone', '==', identifier));
          const phoneSnapshot = await getDocs(qPhone);
          if (!phoneSnapshot.empty) {
            return { exists: true, method: 'phone' as const };
          }
        } catch (e) {
          // Ignore individual query error
        }

        // Check online_customers collection (for Website Users)
        // Check by Email
        try {
          const qEmail = query(onlineCustomersRef, where('email', '==', identifier));
          const emailSnapshot = await getDocs(qEmail);
          if (!emailSnapshot.empty) {
            return { exists: true, method: 'email' as const };
          }
        } catch (e: any) {
          if (
            e.code === 'permission-denied' ||
            e.message?.includes('Missing or insufficient permissions')
          )
            throw e;
        }

        // Check by Phone
        try {
          const qPhone = query(onlineCustomersRef, where('mobile', '==', identifier));
          const phoneSnapshot = await getDocs(qPhone);
          if (!phoneSnapshot.empty) {
            return { exists: true, method: 'phone' as const };
          }
        } catch (e: any) {
          if (
            e.code === 'permission-denied' ||
            e.message?.includes('Missing or insufficient permissions')
          )
            throw e;
        }

        return { exists: false, method: 'unknown' as const };
      } catch (error: any) {
        if (
          error.code === 'permission-denied' ||
          error.message?.includes('Missing or insufficient permissions')
        ) {
          throw error; // Rethrow to allow optimistic fallback in UI
        }

        console.error('Error checking user existence:', error);
        return { exists: false, method: 'unknown' as const };
      }
    }); // End runInInjectionContext
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get the current user profile (cached)
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get the current shop profile (cached)
   */
  getShopSync(shopId: string): any {
    const injector = this.injector;
    const shopService = injector.get(TenantService); // Or ShopService if you prefer
    // Note: This relies on the shop being available in some cache or state.
    // For now, let's assume we can get it from the profile if shopId matches.
    const user = this.getCurrentUser();
    if (user && user.shopId === shopId) {
      return {
        id: user.shopId,
        subscriptionPlan: user.subscriptionPlan || 'free',
        features: user.features || [],
      };
    }
    return null;
  }

  /**
   * Check user role
   */
  hasRole(role: 'shop_owner' | 'customer' | 'admin'): boolean {
    const user = this.currentUserSubject.value;
    if (!user) {
      return false;
    }

    if (user.role === role) {
      return true;
    }

    if (role === 'shop_owner') {
      return user.roles?.includes('owner') ?? false;
    }

    return user.roles?.includes(role) ?? false;
  }

  /**
   * Helper to update profile and sync with storage
   */
  public updateProfile(profile: UserProfile | null) {
    if (typeof window !== 'undefined') {
      const key = this.getStorageKey();
      if (profile) {
        localStorage.setItem(key, JSON.stringify(profile));
      } else {
        localStorage.removeItem(key);
      }
    }
    this.currentUserSubject.next(profile);
  }

  /**
   * Helper to get stored profile from localStorage
   */
  private getStoredProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const key = this.getStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
    return null;
  }

  /**
   * Determine Storage Key based on Context (Admin vs Public)
   * This ensures we don't share sessions across tabs for different apps on localhost
   */
  private getStorageKey(): string {
    if (typeof window === 'undefined') return 'user_profile';

    // 1. Check Subdomain
    const hostname = window.location.hostname;
    const isLocalhost = hostname.includes('localhost');
    const parts = hostname.split('.');
    let hasSubdomain = false;

    if (isLocalhost) {
      // patel.localhost
      hasSubdomain = parts.length >= 2 && parts[0] !== 'localhost';
    } else {
      // patel.clothify.app
      hasSubdomain = parts.length >= 3;
      // We should check reserved subdomains too if needed, but safe to assume public for now
    }

    if (hasSubdomain) return 'user_session_public';

    // 2. Check Path (for /shop/:slug)
    const pathname = window.location.pathname;
    if (pathname.startsWith('/shop/')) {
      return 'user_session_public';
    }

    // Default to Admin/Main App
    return 'user_session_admin';
  }
}
