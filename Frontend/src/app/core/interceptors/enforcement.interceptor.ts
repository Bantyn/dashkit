import { inject } from '@angular/core';
import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { getWorkspaceBlockedPath } from '../utils/workspace-route.utils';
import { ReadOnlyService } from '../services/read-only.service';

export const REQUIRED_PERMISSION = new HttpContextToken<string | null>(() => null);

export function withRequiredPermission(permission: string) {
  return new HttpContext().set(REQUIRED_PERMISSION, permission);
}

export const enforcementInterceptor: HttpInterceptorFn = (req, next) => {
  const requiredPermission = req.context.get(REQUIRED_PERMISSION);
  const router = inject(Router);
  const authService = inject(AuthService);
  const readOnlyService = inject(ReadOnlyService);

  const nextRequest = requiredPermission
    ? req.clone({
        setHeaders: {
          'X-Required-Permission': requiredPermission,
        },
      })
    : req;

  return next(nextRequest).pipe(
    catchError((error) => {
      // ── Read-Only Mode: show upgrade dialog instead of generic error ───────
      if (error.status === 403 && error.error?.errorCode === 'SHOP_READ_ONLY') {
        readOnlyService.showUpgradeDialog$.next();
        // Suppress the error so downstream error handlers don't also fire
        return throwError(() => ({ ...error, handled: true }));
      }

      if (error.status === 403) {
        // Only redirect on GET requests where a permission was explicitly required.
        // This prevents POST/PUT/DELETE forms from forcefully redirecting the user when business logic (like limits) throws a 403.
        // It also prevents un-annotated background requests (like fetching dropdown data) from breaking the page.
        if (req.method === 'GET' && requiredPermission) {
          const shopId = authService.getCurrentUser()?.shopId;

          if (shopId) {
            void router.navigate(['/', shopId, 'access-denied'], {
              queryParams: {
                denialType: 'permission',
                blockedPath: getWorkspaceBlockedPath(router.url),
                requiredPermission: requiredPermission,
              },
            });
          }
        }
      }

      return throwError(() => error);
    }),
  );
};
