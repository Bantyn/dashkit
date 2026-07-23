import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

function getStoredAdminShopId(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const stored = localStorage.getItem('user_session_admin');
    if (!stored) {
      return undefined;
    }

    const parsed = JSON.parse(stored) as { shopId?: string } | null;
    return parsed?.shopId;
  } catch {
    return undefined;
  }
}

function waitForAuthRestore(auth: Auth): Promise<void> {
  if (typeof auth.authStateReady === 'function') {
    return auth.authStateReady().then(() => undefined);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      () => {
        unsubscribe();
        resolve();
      },
      () => resolve(),
    );
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Allow requests that don't match our API URLs to pass through
  if (!req.url.startsWith(environment.apiUrl) && (!environment.publicApiUrl || !req.url.startsWith(environment.publicApiUrl))) {
    return next(req);
  }

  // Auto-rewrite specific public routes to use publicApiUrl instead of apiUrl (which is /admin)
  let url = req.url;
  if (url.startsWith(environment.apiUrl)) {
    const path = url.substring(environment.apiUrl.length);
    const publicRoutes = ['/payment', '/plans', '/announcements', '/support', '/website', '/auth/register', '/auth/login', '/auth/send-otp', '/auth/verify-otp'];
    if (publicRoutes.some(r => path.startsWith(r))) {
      url = environment.publicApiUrl + path;
      req = req.clone({ url });
    }
  }

  const auth = inject(Auth);

  // Wait for Firebase to restore persisted auth before reading currentUser on first load.
  return from(waitForAuthRestore(auth)).pipe(
    switchMap(() => from(auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null))),
    switchMap((token) => {
      let headers = req.headers;

      // Programmatically bypass localtunnel warning screen for API requests
      headers = headers.set('bypass-tunnel-reminder', 'true');

      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }

      const shopId = getStoredAdminShopId();
      if (shopId && !headers.has('x-shop-id')) {
        headers = headers.set('x-shop-id', shopId);
      }

      return next(req.clone({ headers }));
    }),
  );
};
