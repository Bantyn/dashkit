import { Injectable, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser, DOCUMENT } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { BehaviorSubject, distinctUntilChanged, filter } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class TenantService {
  private currentSlugSubject = new BehaviorSubject<string | null>(null);
  currentSlug$ = this.currentSlugSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  // Reserved subdomains that are NOT shops
  private readonly RESERVED_SUBDOMAINS = [
    "www",
    "admin",
    "api",
    "auth",
    "clothify",
    "app",
    "dashkit",
    "dashkiit",
    "dashkit-server",
    "dashkit-admin",
    "storefront",
    "dashboard"
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.init();
    }
  }

  private init() {
    // 1. Check Subdomain first (Pro Plan)
    const subdomainSlug = this.getSubdomainSlug();
    if (subdomainSlug) {
      this.currentSlugSubject.next(subdomainSlug);
    } else {
      // 2. Fallback to Route Path (Plus Plan)
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          const pathSlug = this.getPathSlug();
          if (!subdomainSlug && pathSlug) {
            this.currentSlugSubject.next(pathSlug);
          }
        });
    }
  }

  getSubdomainSlug(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const hostname = this.document.location.hostname.toLowerCase();
    const domainParts = hostname.split(".");
    let subdomain = "";

    if (hostname.includes("localhost")) {
      if (domainParts.length >= 2 && domainParts[0] !== "localhost") {
        subdomain = domainParts[0];
      }
    } else if (hostname.includes("nip.io")) {
      if (domainParts.length > 6) {
        subdomain = domainParts[0];
      }
    } else if (
      hostname.includes("vercel.app") ||
      hostname.includes("clothify.com") ||
      hostname.includes("clothify.in") ||
      hostname.includes("dashkit.com")
    ) {
      // Platform domains (e.g. shop.dashkiiit.vercel.app or zara.dashkit.com)
      if (domainParts.length >= 3) {
        subdomain = domainParts[0];
      }
    } else {
      // It's a custom domain (e.g. zarastore.com), return full hostname
      subdomain = hostname;
    }

    if (subdomain) {
      const subLower = subdomain.toLowerCase();
      const isReserved =
        this.RESERVED_SUBDOMAINS.includes(subLower) ||
        subLower.includes("dashkit") ||
        subLower.includes("storefront") ||
        subLower.includes("dashboard");
      if (!isReserved) {
        return subLower;
      }
    }

    return null;
  }

  getPathSlug(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const url = this.router.url;
    const match = url.match(/^\/(?:shop|store)\/([^\/]+)/);

    if (match && match[1]) {
      return match[1];
    }
    return null;
  }
}
