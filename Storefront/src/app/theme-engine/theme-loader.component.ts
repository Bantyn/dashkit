import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  inject,
  ChangeDetectorRef,
  ComponentRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsiteService } from '../core/services/website.service';
import { TenantService } from '../core/services/tenant.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-theme-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading" class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-semibold text-gray-500">Loading storefront...</span>
      </div>
    </div>

    <ng-container #themeContainer></ng-container>
  `
})
export class ThemeLoaderComponent implements OnInit, OnDestroy {
  @ViewChild('themeContainer', { read: ViewContainerRef }) themeContainer!: ViewContainerRef;

  private readonly websiteService = inject(WebsiteService);
  private readonly tenantService = inject(TenantService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  activeThemeId = 'default';
  private subscription?: Subscription;
  private currentComponentRef?: ComponentRef<any>;

  ngOnInit() {
    this.subscription = this.tenantService.currentSlug$.subscribe((slug) => {
      this.loadThemeConfig();
    });
  }

  async loadThemeConfig() {
    this.loading = true;
    try {
      const config = await this.websiteService.getConfig().toPromise().catch(() => null);
      this.activeThemeId = config?.theme?.id || config?.themeId || 'default';
    } catch (err) {
      this.activeThemeId = 'default';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      await this.renderActiveTheme();
    }
  }

  async renderActiveTheme() {
    if (!this.themeContainer) return;
    this.themeContainer.clear();

    try {
      let component: any;
      switch (this.activeThemeId) {
        case 'fashion':
          const fashionModule = await import('../themes/fashion/fashion-layout.component');
          component = fashionModule.FashionLayoutComponent;
          break;
        case 'minimal':
          const minimalModule = await import('../themes/minimal/minimal-layout.component');
          component = minimalModule.MinimalLayoutComponent;
          break;
        case 'default':
        default:
          const defaultModule = await import('../themes/default/default-layout.component');
          component = defaultModule.DefaultLayoutComponent;
          break;
      }

      if (component) {
        this.currentComponentRef = this.themeContainer.createComponent(component);
      }
    } catch (err) {
      console.error('Failed to dynamically load active theme:', this.activeThemeId, err);
      const defaultModule = await import('../themes/default/default-layout.component');
      this.currentComponentRef = this.themeContainer.createComponent(defaultModule.DefaultLayoutComponent);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.currentComponentRef) {
      this.currentComponentRef.destroy();
    }
  }
}
