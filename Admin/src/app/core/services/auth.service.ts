import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export type AdminProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin';
  roles: string[];
  permissions: string[];
  createdAt: Date;
};

type ProfileEnvelope = ApiResponse<{
  profile: Record<string, unknown>;
  roles?: string[];
  permissions?: string[];
}>;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'clothify_admin_session';
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private currentUserSubject = new BehaviorSubject<AdminProfile | null>(this.getStoredProfile());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private initializedSubject = new BehaviorSubject<boolean>(false);
  readonly initialized$ = this.initializedSubject.asObservable();

  constructor() {
    authState(this.auth).subscribe({
      next: async (firebaseUser) => {
        if (!firebaseUser) {
          this.setProfile(null);
          this.initializedSubject.next(true);
          return;
        }

        try {
          const profile = await this.fetchProfile();
          this.setProfile(profile);
        } catch (error) {
          console.error('Failed to load admin profile', error);
          this.setProfile(this.getStoredProfile());
        } finally {
          this.initializedSubject.next(true);
        }
      },
      error: (error) => {
        console.error('Admin auth state error', error);
        this.initializedSubject.next(true);
      },
    });
  }

  private parseDate(value: unknown) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (value && typeof value === 'object' && 'seconds' in value) {
      const seconds = (value as { seconds?: unknown }).seconds;
      if (typeof seconds === 'number') {
        const parsed = new Date(seconds * 1000);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    const parsed = new Date(String(value || ''));
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private normalizeProfile(raw: Record<string, unknown>, roles: string[], permissions: string[]) {
    return {
      uid: String(raw['uid'] || ''),
      email: String(raw['email'] || ''),
      displayName: String(raw['displayName'] || raw['name'] || raw['email'] || 'Admin'),
      role: 'admin' as const,
      roles,
      permissions,
      createdAt: this.parseDate(raw['createdAt']),
    };
  }

  private getStoredProfile(): AdminProfile | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as Omit<AdminProfile, 'createdAt'> & {
        createdAt: string | Date;
      };

      return {
        ...parsed,
        createdAt: this.parseDate(parsed.createdAt),
      };
    } catch {
      return null;
    }
  }

  private setProfile(profile: AdminProfile | null) {
    this.currentUserSubject.next(profile);

    if (typeof window === 'undefined') {
      return;
    }

    if (!profile) {
      localStorage.removeItem(this.storageKey);
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(profile));
  }

  async fetchProfile(): Promise<AdminProfile | null> {
    const response = await firstValueFrom(this.http.get<ProfileEnvelope>(`${this.apiUrl}/profile`));
    const roles = Array.isArray(response.data.roles) ? response.data.roles : [];
    const permissions = Array.isArray(response.data.permissions) ? response.data.permissions : [];
    const profile = this.normalizeProfile(response.data.profile || {}, roles, permissions);

    const isAdmin = profile.roles.includes('admin') || profile.permissions.includes('admin.access');
    if (!isAdmin) {
      return null;
    }

    return profile;
  }

  async login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      console.error('Detailed login error:', error);
      const code: string = error?.code || '';
      const msg: string = error?.message || '';
      const suffix = code ? ` (Error: ${code})` : '';

      if (code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.' + suffix);
      } else if (code === 'auth/user-not-found') {
        throw new Error('Email not found. Please check your email.' + suffix);
      } else if (code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials.' + suffix);
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.' + suffix);
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.' + suffix);
      } else if (code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.' + suffix);
      } else if (code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.' + suffix);
      } else if (msg.includes('auth/wrong-password')) {
        throw new Error('Incorrect password. Please try again.' + suffix);
      } else if (msg.includes('auth/user-not-found')) {
        throw new Error('Email not found. Please check your email.' + suffix);
      } else if (msg.includes('auth/invalid-credential')) {
        throw new Error('Invalid email or password. Please check your credentials.' + suffix);
      } else {
        throw new Error((msg || 'Failed to sign in. Please try again.') + suffix);
      }
    }

    const profile = await this.fetchProfile();

    if (!profile) {
      await signOut(this.auth);
      throw new Error('This account does not have admin access.');
    }

    this.setProfile(profile);
    return profile;
  }

  async logout() {
    await signOut(this.auth);
    this.setProfile(null);
    await this.router.navigate(['/login']);
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  isAuthenticated() {
    return !!this.currentUserSubject.value;
  }
}
