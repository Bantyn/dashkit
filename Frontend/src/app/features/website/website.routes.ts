import { Routes } from '@angular/router';
import { WebsiteLayoutComponent } from './layout/website-layout.component';

export const websiteRoutes: Routes = [
  {
    path: '',
    component: WebsiteLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.WebsiteHomeComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then((m) => m.WebsiteProductsComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (m) => m.WebsiteProductDetailComponent,
          ),
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('./pages/offers/offers.component').then((m) => m.WebsiteOffersComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/components/website-login.component').then((m) => m.WebsiteLoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/components/website-signup.component').then(
            (m) => m.WebsiteSignupComponent,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then((m) => m.WebsiteContactComponent),
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./pages/my-account/my-account.component').then(
            (m) => m.MyAccountComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/order-history/order-history.component').then(
            (m) => m.OrderHistoryComponent,
          ),
      },
      {
        path: 'orders/:id', // Detail view can reuse tracking or separate component. Using tracking for now.
        redirectTo: 'track/:id',
      },
      {
        path: 'track/:id',
        loadComponent: () =>
          import('./pages/order-tracking/order-tracking.component').then(
            (m) => m.OrderTrackingComponent,
          ),
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
          import('./pages/size-guide/size-guide.component').then(
            (m) => m.WebsiteSizeGuideComponent,
          ),
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./auth/website-auth.component').then((m) => m.WebsiteAuthComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/components/website-login.component').then((m) => m.WebsiteLoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/components/website-signup.component').then(
            (m) => m.WebsiteSignupComponent,
          ),
      },
    ],
  },
  {
    path: 'track/:id/print',
    loadComponent: () =>
      import('../invoices/invoice-print-page.component').then(
        (m) => m.InvoicePrintPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
