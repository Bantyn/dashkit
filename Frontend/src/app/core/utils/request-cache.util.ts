import { Observable, shareReplay } from 'rxjs';

type CacheEntry<T> = {
  expiresAt: number;
  value$: Observable<T>;
};

export class RequestCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private static readonly instances = new Set<RequestCache<any>>();

  constructor() {
    RequestCache.instances.add(this);
  }

  static clearAll() {
    for (const instance of RequestCache.instances) {
      instance.clear();
    }
  }

  getOrSet(key: string, factory: () => Observable<T>, ttlMs: number): Observable<T> {
    const now = Date.now();
    const cached = this.store.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value$;
    }

    const value$ = factory().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.store.set(key, {
      expiresAt: now + ttlMs,
      value$,
    });

    return value$;
  }

  invalidate(key: string) {
    this.store.delete(key);
  }

  invalidateByPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}
