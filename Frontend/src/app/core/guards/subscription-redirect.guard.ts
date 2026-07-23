import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const subscriptionRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      const user = authService.getCurrentUser();

      if (user && user.shopId) {
        router.navigate([user.shopId, 'subscription']);
        return false;
      }

      return true;
    }),
  );
};
