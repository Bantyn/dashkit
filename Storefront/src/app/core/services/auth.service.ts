import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  signInWithCustomToken,
  deleteUser,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  uid: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  role?: string;
  shopId?: string;
  subscriptionPlan?: string;
  features?: string[];
  wishlist?: string[];
  tags?: string[];
  addresses?: any[];
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private app = getApps().length
    ? getApps()[0]
    : initializeApp(environment.firebase);
  private auth: Auth = getAuth(this.app);
  private firestore: Firestore = getFirestore(this.app);
  private apiUrl = environment.publicApiUrl;

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  private injector = inject(Injector);

  constructor() {
    // Restore from localStorage on startup
    const stored = this.getStoredProfile();
    if (stored) {
      this.currentUserSubject.next(stored);
    }

    // Firebase auth state listener
    onAuthStateChanged(this.auth, async (user: any) => {
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        this.updateProfile(profile);
      } else {
        this.updateProfile(null);
      }
    });
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // Check 'online_customers' collection first (public users)
      const custDoc = await getDoc(doc(this.firestore, 'online_customers', uid));
      if (custDoc.exists()) {
        return { uid, ...custDoc.data() } as UserProfile;
      }
      // Fallback to 'users' collection
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        return { uid, ...userDoc.data() } as UserProfile;
      }
      return { uid };
    } catch (err) {
      console.error('getUserProfile error:', err);
      return null;
    }
  }

  async register(
    email: string,
    password: string,
    profile: Partial<UserProfile>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = credential.user.uid;
      const userProfile: UserProfile = {
        uid,
        email,
        role: 'customer',
        ...profile,
        createdAt: new Date(),
      };
      await setDoc(doc(this.firestore, 'online_customers', uid), userProfile);
      this.updateProfile(userProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: this.parseFirebaseError(err.code) };
    }
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(this.auth, identifier, password);
      const profile = await this.getUserProfile(credential.user.uid);
      this.updateProfile(profile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: this.parseFirebaseError(err.code) };
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: string; isNew?: boolean }> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      const uid = credential.user.uid;
      let profile = await this.getUserProfile(uid);
      let isNew = false;
      if (!profile || !profile.name) {
        isNew = true;
        profile = {
          uid,
          email: credential.user.email || '',
          name: credential.user.displayName || '',
          role: 'customer',
          createdAt: new Date(),
        };
        await setDoc(doc(this.firestore, 'online_customers', uid), profile);
      }
      this.updateProfile(profile);
      return { success: true, isNew };
    } catch (err: any) {
      return { success: false, error: this.parseFirebaseError(err.code) };
    }
  }

  setupRecaptcha(containerId: string, onExpired?: () => void): RecaptchaVerifier {
    const verifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': onExpired || (() => {}),
    });
    return verifier;
  }

  resetRecaptcha(verifier: RecaptchaVerifier | null) {
    try {
      verifier?.render().then((widgetId: any) => {
        if (typeof (window as any).grecaptcha !== 'undefined') {
          (window as any).grecaptcha.reset(widgetId);
        }
      });
    } catch (e) {}
  }

  async sendPhoneOtp(
    phone: string,
    recaptchaVerifier: RecaptchaVerifier,
  ): Promise<ConfirmationResult> {
    return signInWithPhoneNumber(this.auth, phone, recaptchaVerifier);
  }

  async sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.apiUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) return { success: false, error: body.message || 'Failed to send OTP' };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send OTP' };
    }
  }

  async verifyEmailOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const body = await res.json();
      if (!res.ok) return { success: false, error: body.message || 'OTP verification failed' };

      const { customToken, profile } = body.data;
      await setPersistence(this.auth, browserLocalPersistence);
      const credential = await signInWithCustomToken(this.auth, customToken);
      const userProfile =
        profile ?? (await this.getUserProfile(credential.user.uid));
      this.updateProfile(userProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed.' };
    }
  }

  async checkUserExists(
    identifier: string,
  ): Promise<{ exists: boolean; method: 'email' | 'phone' | 'unknown' }> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const onlineCustomersRef = collection(this.firestore, 'online_customers');
        const usersRef = collection(this.firestore, 'users');

        for (const ref of [onlineCustomersRef, usersRef]) {
          try {
            const qEmail = query(ref, where('email', '==', identifier));
            const snap = await getDocs(qEmail);
            if (!snap.empty) return { exists: true, method: 'email' as const };
          } catch {}

          try {
            const qPhone = query(ref, where('mobile', '==', identifier));
            const snap = await getDocs(qPhone);
            if (!snap.empty) return { exists: true, method: 'phone' as const };
          } catch {}
        }

        return { exists: false, method: 'unknown' as const };
      } catch (error: any) {
        if (error.code === 'permission-denied') throw error;
        return { exists: false, method: 'unknown' as const };
      }
    });
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(this.firestore, 'online_customers', uid), updates as any);
    const current = this.currentUserSubject.value;
    if (current?.uid === uid) {
      this.updateProfile({ ...current, ...updates });
    }
  }

  async deleteAuthUser(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await deleteUser(user);
        this.updateProfile(null);
        return { success: true };
      }
      return { success: false, error: 'No user signed in' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  logout() {
    this.auth.signOut();
    this.updateProfile(null);
  }

  updateProfile(profile: UserProfile | null) {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem('user_session_public', JSON.stringify(profile));
      } else {
        localStorage.removeItem('user_session_public');
      }
    }
    this.currentUserSubject.next(profile);
  }

  private getStoredProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('user_session_public');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('user_session_public');
      }
    }
    return null;
  }

  private parseFirebaseError(code: string): string {
    const map: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid credentials. Please try again.',
    };
    return map[code] || 'An error occurred. Please try again.';
  }
}
