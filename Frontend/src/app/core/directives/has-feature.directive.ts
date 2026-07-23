import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { FeatureGuardService } from '../services/feature-guard.service';

@Directive({
  selector: '[appHasFeature]',
  standalone: true,
})
export class HasFeatureDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);
  private readonly featureGuard = inject(FeatureGuardService);

  readonly featureKey = input<string | null>(null, {
    alias: 'appHasFeature',
  });

  private hasView = false;
  private currentUser = toSignal(this.authService.currentUser$);

  constructor() {
    effect(() => {
      const key = this.featureKey();
      // Track the user signal so the effect re-runs when user profile updates
      const user = this.currentUser(); 
      
      let allowed = false;
      if (key) {
        // Evaluate using the guard sync method which now checks the user's features
        allowed = this.featureGuard.hasFeatureSync(null, key);
      } else {
        allowed = true;
      }

      if (allowed && !this.hasView) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
        return;
      }

      if (!allowed && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
