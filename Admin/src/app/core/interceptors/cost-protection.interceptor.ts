import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { ModalService } from '../services/modal.service';
import { AdminApiService } from '../services/admin-api.service';
import { from, Observable, of, throwError } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Cache for cost settings and endpoint metrics loaded from the backend
let costSettings: any = null;
let endpointsCostProfile: any[] = [];
let isFetchingMetrics = false;

// Cache the last responses for repeated execution checks
const lastExecutions = new Map<string, { timestamp: number; response: any }>();

function loadCostMetrics(api: AdminApiService) {
  if (costSettings || isFetchingMetrics) return;
  isFetchingMetrics = true;

  api.getObservabilityMetrics().subscribe({
    next: (res) => {
      if (res.data) {
        costSettings = res.data.costSettings;
        endpointsCostProfile = res.data.endpoints || [];
      }
      isFetchingMetrics = false;
    },
    error: () => {
      isFetchingMetrics = false;
    }
  });
}

export const costProtectionInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept requests directed to our backends
  if (!req.url.startsWith(environment.apiUrl) && !req.url.startsWith(environment.publicApiUrl)) {
    return next(req);
  }

  const apiService = inject(AdminApiService);
  const modalService = inject(ModalService);

  // Trigger loading metrics in background
  loadCostMetrics(apiService);

  const urlObj = new URL(req.url, window.location.origin);
  const path = urlObj.pathname;
  const method = req.method;
  const apiKey = `${method}:${path}`;

  // 1. Identify Exempt Routes
  // Exclude Login, Checkout, POS Invoice checkout, Payments, Background Sync, Auth verification
  const isExempt = 
    path.includes('/auth') || 
    path.includes('/login') || 
    path.includes('/checkout') || 
    path.includes('/payments') || 
    path.includes('/sync') ||
    (path.includes('/invoices') && method === 'POST');

  if (isExempt) {
    return next(req);
  }

  // 2. Identify target paths (Analytics, Reports, Large exports, Rebuilds, Settings, etc.)
  const isTarget =
    path.includes('/observability') ||
    path.includes('/analytics') ||
    path.includes('/reports') ||
    path.includes('/settings') ||
    path.includes('/export') ||
    path.includes('/bulk') ||
    path.includes('/historical') ||
    path.includes('/rebuild') ||
    path.includes('/debug') ||
    path.includes('/developer');

  if (!isTarget) {
    return next(req);
  }

  // 3. Find cost profile for this API endpoint
  const profile = endpointsCostProfile.find(p => p.method === method && path.endsWith(p.endpoint));

  // Determine thresholds
  const warningReads = costSettings?.warningReads ?? 150;
  const highReads = costSettings?.highReads ?? 300;

  const estReads = profile ? Math.round(profile.totalReads / (profile.calls || 1)) : 0;
  const estTime = profile ? Math.round(profile.totalResponseTime / (profile.calls || 1)) : 0;

  // Repeated Request check (within 5 minutes)
  const lastCall = lastExecutions.get(apiKey);
  const isRepeated = lastCall && (Date.now() - lastCall.timestamp < 5 * 60 * 1000);

  // Observable creator to send request and cache response
  const executeRequest = (): Observable<any> => {
    return next(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          lastExecutions.set(apiKey, {
            timestamp: Date.now(),
            response: event.clone()
          });
        }
      })
    );
  };

  // Logic flow using RxJS from promise
  return from(Promise.resolve()).pipe(
    switchMap(async () => {
      // 4. Repeated Execution Protection
      if (isRepeated && estReads >= warningReads) {
        const useCached = await modalService.open({
          title: '🔄 Repeated Operation Detected',
          message: 'This operation was executed recently. Would you like to reuse cached data instead to protect database pricing?',
          confirmLabel: 'Use Cached Data',
          cancelLabel: 'Refresh Anyway',
          confirmBtnClass: 'bg-primary-600 hover:bg-primary-700'
        });

        if (useCached) {
          return { type: 'use_cached' };
        }
      }
      return { type: 'proceed' };
    }),
    switchMap((action) => {
      if (action.type === 'use_cached') {
        const cached = lastExecutions.get(apiKey)?.response;
        if (cached) {
          return of(cached);
        }
      }

      // 5. High / Critical Reads Prompts
      if (estReads >= highReads) {
        // Critical Warning (Needs second text typing verification)
        return from(modalService.open({
          title: '🚨 Critical Cost Warning',
          message: `This operation is one of the most expensive API calls in the system.\n\nEstimated Reads: ${estReads}\nEstimated Cost Impact: High\n\nThis action should only be used when necessary.`,
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          confirmBtnClass: 'bg-red-600 hover:bg-red-700',
          isInputConfirm: true
        })).pipe(
          switchMap(confirmed => {
            if (confirmed) {
              return executeRequest();
            } else {
              return throwError(() => new Error('Critical operation cancelled by user.'));
            }
          })
        );
      } else if (estReads >= warningReads) {
        // High reads confirmation
        return from(modalService.open({
          title: '⚠️ High Firestore Read Operation',
          message: `This action is estimated to consume approximately ${estReads} Firestore reads.\n\nEstimated execution time: ${estTime} ms\n\nThis operation may increase Firebase costs. Do you want to continue?`,
          confirmLabel: 'Continue',
          cancelLabel: 'Cancel',
          confirmBtnClass: 'bg-orange-500 hover:bg-orange-600'
        })).pipe(
          switchMap(confirmed => {
            if (confirmed) {
              return executeRequest();
            } else {
              return throwError(() => new Error('High read operation cancelled by user.'));
            }
          })
        );
      }

      // Safe reads
      return executeRequest();
    })
  );
};
