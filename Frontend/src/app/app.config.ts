import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  LucideAngularModule,
  ChevronDown,
  Layers,
  Shirt,
  Briefcase,
  Smartphone,
  Home,
  User,
  Settings,
  LogOut,
  Search,
  Plus,
  Trash,
  Edit,
  Save,
  X,
  Check,
  Bell,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Terminal,
  CheckSquare
} from 'lucide-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { branchInterceptor } from './core/interceptors/branch.interceptor';
import { enforcementInterceptor } from './core/interceptors/enforcement.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, branchInterceptor, enforcementInterceptor])),

    // Firebase Providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    provideStorage(() => getStorage()),

    // Charts
    provideCharts(withDefaultRegisterables()),

    provideAnimations(),
    ...(LucideAngularModule.pick({
      ChevronDown,
      Layers,
      Shirt,
      Briefcase,
      Smartphone,
      Home,
      User,
      Settings,
      LogOut,
      Search,
      Plus,
      Trash,
      Edit,
      Save,
      X,
      Check,
      Bell,
      Filter,
      Calendar,
      ChevronLeft,
      ChevronRight,
      Terminal,
      CheckSquare
    }).providers || []),
  ],
};
