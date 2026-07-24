import { Routes } from '@angular/router';
import { ThemeLoaderComponent } from './theme-engine/theme-loader.component';
import { WebsiteHomeComponent } from './pages/home/home.component';
import { WebsiteProductsComponent } from './pages/products/products.component';
import { WebsiteProductDetailComponent } from './pages/product-detail/product-detail.component';
import { WebsiteCartComponent } from './pages/cart/cart.component';
import { WebsiteCheckoutComponent } from './pages/checkout/checkout.component';
import { WebsiteOffersComponent } from './pages/offers/offers.component';
import { WebsiteOrderTrackingComponent } from './pages/order-tracking/order-tracking.component';

const childRoutes = [
  { path: '', component: WebsiteHomeComponent },
  { path: 'products', component: WebsiteProductsComponent },
  { path: 'products/:id', component: WebsiteProductDetailComponent },
  { path: 'cart', component: WebsiteCartComponent },
  { path: 'checkout', component: WebsiteCheckoutComponent },
  { path: 'offers', component: WebsiteOffersComponent },
  { path: 'order-tracking/:id', component: WebsiteOrderTrackingComponent },
  { path: 'track/:id', component: WebsiteOrderTrackingComponent },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./pages/auth/website-login.component').then((m) => m.WebsiteLoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./pages/auth/website-signup.component').then((m) => m.WebsiteSignupComponent),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/my-account/my-account.component').then((m) => m.MyAccountComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.component').then((m) => m.WebsiteContactComponent),
  },
  {
    path: 'shipping-policy',
    loadComponent: () =>
      import('./pages/shipping-policy/shipping-policy.component').then(
        (m) => m.WebsiteShippingPolicyComponent,
      ),
  },
  {
    path: 'return-policy',
    loadComponent: () =>
      import('./pages/return-policy/return-policy.component').then(
        (m) => m.WebsiteReturnPolicyComponent,
      ),
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () =>
      import('./pages/terms-and-conditions/terms-and-conditions.component').then(
        (m) => m.WebsiteTermsComponent,
      ),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy.component').then(
        (m) => m.WebsitePrivacyPolicyComponent,
      ),
  },
  {
    path: 'size-guide',
    loadComponent: () =>
      import('./pages/size-guide/size-guide.component').then((m) => m.WebsiteSizeGuideComponent),
  },
];

export const routes: Routes = [
  // Subdomain / Custom Domain Root Mode
  {
    path: '',
    component: ThemeLoaderComponent,
    children: childRoutes,
  },

  // Plus Plan Path-Based Mode (/shop/:slug)
  {
    path: 'shop/:slug',
    component: ThemeLoaderComponent,
    children: childRoutes,
  },

  { path: '**', redirectTo: '' },
];
