import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { costProtectionInterceptor } from './core/interceptors/cost-protection.interceptor';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Database, ChevronDown, ChevronLeft, ChevronRight, Calendar, Terminal, CheckSquare } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, costProtectionInterceptor])),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideAnimations(),
    importProvidersFrom(LucideAngularModule.pick({ Database, ChevronDown, ChevronLeft, ChevronRight, Calendar, Terminal, CheckSquare }))
  ],
};
