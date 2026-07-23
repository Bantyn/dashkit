import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AdminApiService } from './core/services/admin-api.service';
import { ThemeService } from './core/services/theme.service';
import { AdminSidebarComponent } from './shared/components/admin-sidebar.component';
import { AdminHeaderComponent } from './shared/components/admin-header.component';
import { ModalComponent } from './shared/components/modal.component';
import { ModalService } from './core/services/modal.service';
import { ToastComponent } from './shared/components/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent, AdminHeaderComponent, ModalComponent, ToastComponent],
  template: `
    @if (!isAuthPage && authService.isAuthenticated()) {
      <div class="flex h-screen bg-white">
        <app-admin-sidebar />
        <div class="flex-1 ml-64 flex flex-col min-h-screen bg-white">
          <app-admin-header />
          <div
            class="flex-1 overflow-y-auto bg-[var(--bg-page)] rounded-tl-[3rem] border border-gray-100 border-b-0 border-r-0 shadow-inner"
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

    <!-- Global Modal Container -->
    <app-modal
      [isOpen]="modalService.isOpen"
      [title]="modalService.options.title"
      [confirmLabel]="modalService.options.confirmLabel || 'Confirm'"
      [cancelLabel]="modalService.options.cancelLabel || 'Cancel'"
      [confirmBtnClass]="modalService.options.confirmBtnClass || 'bg-primary-600 hover:bg-primary-700'"
      [showFooter]="modalService.options.showFooter !== false"
      [confirmDisabled]="modalService.confirmDisabled"
      (confirmed)="modalService.confirm()"
      (closed)="modalService.cancel()"
    >
      <div class="text-gray-500 text-sm leading-relaxed" *ngIf="modalService.options.message">
        {{ modalService.options.message }}
      </div>
      <div *ngIf="modalService.options.isInputConfirm" class="mt-4">
        <input
          type="text"
          class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white font-semibold text-gray-900 text-sm"
          placeholder="Type CONFIRM to proceed"
          [value]="modalService.confirmText()"
          (input)="modalService.updateConfirmText($event)"
        />
      </div>
    </app-modal>
    <app-toast />
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }
      @media print {
        app-admin-sidebar,
        app-admin-header {
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
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly adminApi = inject(AdminApiService);
  private readonly themeService = inject(ThemeService);
  readonly modalService = inject(ModalService);
  isAuthPage = true;

  ngOnInit() {
    // Load admin theme settings immediately on startup
    this.adminApi.getPublicThemeSettings().subscribe({
      next: (response) => this.themeService.applyAdminTheme(response.data.admin),
      error: (error) => console.warn('Admin theme settings not loaded', error),
    });

    // Check auth page on route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIfAuthPage(event.urlAfterRedirects);
      });

    // Initial check
    this.checkIfAuthPage(this.router.url);
  }

  private checkIfAuthPage(url: string) {
    const authPages = ['/login'];
    this.isAuthPage = authPages.some((page) => url.includes(page));
  }
}
