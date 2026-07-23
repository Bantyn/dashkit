import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar.component';
import { AuthService, UserProfile } from './core/services/auth.service';
import { ShopContextService } from './core/services/shop-context.service';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header.component';
import { ToastComponent } from './shared/components/toast.component';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal.component';
import { PrintPreviewModalComponent } from './shared/components/print-preview-modal.component';
import { ReadOnlyDialogComponent } from './shared/components/read-only-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent, ConfirmationModalComponent, PrintPreviewModalComponent, CommonModule, ReadOnlyDialogComponent],
  template: `
    @if (currentUser && !isAuthPage && !isPublicSite) {
      <div class="flex h-screen bg-white">
        <app-sidebar />
        <div class="flex-1 ml-64 flex flex-col min-h-screen bg-white">
          <app-header />
          <div
            class="flex-1 overflow-y-auto bg-primary-50 rounded-tl-[3rem] border border-gray-100 border-b-0 border-r-0 shadow-inner"
          >
            <router-outlet />
          </div>
        </div>
      </div>
    } @else {
      <div class="h-full overflow-y-auto">
        <router-outlet />
      </div>
    }
    <app-toast />
    <app-confirmation-modal />
    <app-print-preview-modal />
    <!-- Read-Only Mode Upgrade Dialog — global, auto-subscribes to ReadOnlyService.showUpgradeDialog$ -->
    <app-read-only-dialog />
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }
      @media print {
        app-sidebar,
        app-header {
          display: none !important;
        }
        .ml-64 {
          margin-left: 0 !important;
        }
        .flex.h-screen {
          height: auto !important;
          display: block !important;
        }
        .overflow-y-auto {
          overflow: visible !important;
          height: auto !important;
        }
      }
    `,
  ],
})
export class App implements OnInit {
  currentUser: UserProfile | null = null;
  isAuthPage = true;
  isPublicSite = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private shopContext: ShopContextService,
  ) {}

  ngOnInit() {
    // Load platform theme settings immediately on startup
    this.shopContext.loadPlatformTheme().subscribe();

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.shopContext.isPublicSite$.subscribe((isPublic) => {
      this.isPublicSite = isPublic;
    });

    // SSR-safe way to check for current URL
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIfAuthPage(event.urlAfterRedirects);
        // Also ensure public site check is up to date if needed, though subscription handles it
      });

    // Initial check
    this.checkIfAuthPage(this.router.url);
  }

  private checkIfAuthPage(url: string) {
    const authPages = ['/login', '/register', '/forgot-password'];
    // Also hide layout for print pages
    const isPrintPage = url.includes('/print');

    // Website Auth pages (should be handled by isPublicSite, but just in case)
    const isWebsiteAuth = url.includes('/auth/login') || url.includes('/auth/register');

    this.isAuthPage = authPages.some((page) => url.includes(page)) || isPrintPage || isWebsiteAuth;
  }
}
