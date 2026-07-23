import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { TenantService } from '../services/tenant.service';

export const hasSubdomainGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const tenantService = inject(TenantService);
  const subdomain = tenantService.getSubdomainSlug();
  return !!subdomain;
};
export const noSubdomainGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const tenantService = inject(TenantService);
  const subdomain = tenantService.getSubdomainSlug();
  return !subdomain;
};
