import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }

      router.navigate(['/login'], {
        queryParams: {
          returnUrl: state.url,
        },
      });
      return false;
    }),
  );
};
