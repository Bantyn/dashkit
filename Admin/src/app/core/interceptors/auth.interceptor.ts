import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  if (!req.url.startsWith(environment.apiUrl) && !req.url.startsWith(environment.publicApiUrl)) {
    return next(req);
  }

  const auth = inject(Auth);

  return from(waitForAuthRestore(auth)).pipe(
    switchMap(() => from(auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null))),
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
