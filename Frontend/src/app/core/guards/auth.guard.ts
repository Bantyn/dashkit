import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }),
  );
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
      }

      const requiredRole = route.data['role'] as 'shop_owner' | 'customer' | 'admin';
      const user = authService.getCurrentUser();

      const hasRequiredRole =
        !!user &&
        (user.role === requiredRole ||
          (requiredRole === 'shop_owner' && user.roles?.includes('owner')) ||
          (requiredRole === 'admin' && user.roles?.includes('admin')) ||
          (requiredRole === 'customer' && user.roles?.includes('customer')));

      if (user && hasRequiredRole) {
        if (requiredRole === 'shop_owner') {
          const routeShopId = route.paramMap.get('shopId');
          if (routeShopId && user.shopId !== routeShopId) {
            router.navigate([user.shopId, 'dashboard']);
            return false;
          }
        }
        return true;
      }

      router.navigate(['/unauthorized']);
      return false;
    }),
  );
};
