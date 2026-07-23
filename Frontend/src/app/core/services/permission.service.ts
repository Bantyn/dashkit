import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly authService = inject(AuthService);
  private readonly permissionsState = signal<string[]>([]);

  readonly permissions = computed(() => this.permissionsState());

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      // Shop owners and admins always have full access to their own scoped routes
      if (user?.role === 'shop_owner' || user?.role === 'admin') {
        this.permissionsState.set(['*']);
      } else {
        this.permissionsState.set(user?.permissions || []);
      }
    });
  }

  getPermissionsSnapshot() {
    return this.permissionsState();
  }

  hasPermission(permission?: string | null) {
    if (!permission) {
      return true;
    }

    const permissions = this.permissionsState();
    if (permissions.includes('*') || permissions.includes(permission)) {
      return true;
    }

    const [resource] = permission.split('.');
    return permissions.includes(`${resource}.*`);
  }

  hasAnyPermission(permissions: string[] = []) {
    if (!permissions.length) {
      return true;
    }

    return permissions.some((permission) => this.hasPermission(permission));
  }
}
