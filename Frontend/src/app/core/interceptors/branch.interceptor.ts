import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BranchContextService } from '../services/branch-context.service';
import { environment } from '../../../environments/environment';

export const branchInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const branchContextService = inject(BranchContextService);
  const activeBranch = branchContextService.getActiveBranch();

  if (activeBranch) {
    const headers = req.headers.set('x-branch-id', activeBranch);
    return next(req.clone({ headers }));
  }

  return next(req);
};
