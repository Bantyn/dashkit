import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { BranchContextService } from '../services/branch-context.service';
import { BranchService } from '../services/branch.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

function getModuleFromUrl(url: string): string | null {
  const parts = url.split('?')[0].split('/');
  const resource = parts[2];
  if (!resource) return null;
  if (resource.startsWith('pos')) return 'pos';
  if (resource.startsWith('orders') || resource.startsWith('sales')) return 'pos';
  if (resource.startsWith('invoices') || resource.startsWith('payments') || resource.startsWith('credit-notes')) return 'invoices';
  if (resource.startsWith('transactions')) return 'transactions';
  if (resource.startsWith('products') || resource.startsWith('categories') || resource.startsWith('reviews')) return 'products';
  if (resource.startsWith('inventory')) return 'inventory';
  if (resource.startsWith('purchases')) return 'purchases';
  if (resource.startsWith('tailoring')) return 'tailoring';
  if (resource.startsWith('customers')) return 'customers';
  if (resource.startsWith('offers')) return 'offers';
  if (resource.startsWith('promotions')) return 'promotions';
  if (resource.startsWith('branches')) return 'branches';
  if (resource.startsWith('shipping')) return 'integrations';
  if (resource.startsWith('staff')) return 'staff';
  if (resource.startsWith('reports')) return 'reports';
  if (resource.startsWith('accounting')) return 'transactions';
  if (resource.startsWith('crm')) return 'customers';
  if (resource.startsWith('analytics')) return 'analytics';
  if (resource.startsWith('website')) return 'website';
  if (resource.startsWith('images')) return 'products';
  if (resource.startsWith('notifications')) return 'promotions';
  if (resource.startsWith('audit')) return 'staff';
  if (resource.startsWith('expenses')) return 'pos';
  if (resource.startsWith('settings')) return 'settings';
  return null;
}

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const branchContext = inject(BranchContextService);
  const branchService = inject(BranchService);
  const router = inject(Router);

  const requiredPermission = route.data['permission'] as string;
  const user = authService.getCurrentUser();
  const shopId = user?.shopId;
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // 1. Check user permission
  if (requiredPermission && !permissionService.hasPermission(requiredPermission)) {
    router.navigate(['/', shopId, 'access-denied'], {
      queryParams: {
        denialType: 'permission',
        blockedPath: state.url.split('?')[0].split('/').slice(2).join('/'),
        requiredPermission,
      },
    });
    return false;
  }

  // 2. Check branch allowed modules
  const info = branchContext.getActiveBranchInfo();
  if (info.type === 'child' && info.id && shopId) {
    return branchService.getBranchById(shopId, info.id).pipe(
      map((res) => {
        const branch = res.data;
        const module = getModuleFromUrl(state.url);
        if (module && branch?.allowedModules && !branch.allowedModules.includes(module)) {
          router.navigate(['/', shopId, 'access-denied'], {
            queryParams: {
              denialType: 'branch_permission',
              blockedPath: state.url.split('?')[0].split('/').slice(2).join('/'),
              requiredModule: module,
            },
          });
          return false;
        }
        return true;
      }),
      catchError(() => of(true))
    );
  }

  return true;
};
