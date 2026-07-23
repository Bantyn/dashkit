import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  readonly requiredPermission = input<string | string[] | null>(null, {
    alias: 'hasPermission',
  });

  readonly elseTemplate = input<TemplateRef<unknown> | null>(null, {
    alias: 'hasPermissionElse',
  });

  private hasView = false;

  constructor() {
    effect(() => {
      const permission = this.requiredPermission();
      const allowed = Array.isArray(permission)
        ? this.permissionService.hasAnyPermission(permission)
        : this.permissionService.hasPermission(permission);

      if (allowed && !this.hasView) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
        return;
      }

      if (!allowed) {
        this.viewContainer.clear();
        const fallbackTemplate = this.elseTemplate();
        if (fallbackTemplate) {
          this.viewContainer.createEmbeddedView(fallbackTemplate);
        }
        this.hasView = false;
      }
    });
  }
}
