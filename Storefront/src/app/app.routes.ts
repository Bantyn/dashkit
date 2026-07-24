import { Routes } from '@angular/router';
import { ThemeLoaderComponent } from './theme-engine/theme-loader.component';
import { WebsiteHomeComponent } from './pages/home/home.component';
import { WebsiteProductsComponent } from './pages/products/products.component';
import { WebsiteProductDetailComponent } from './pages/product-detail/product-detail.component';
import { WebsiteCartComponent } from './pages/cart/cart.component';
import { WebsiteCheckoutComponent } from './pages/checkout/checkout.component';
import { WebsiteOffersComponent } from './pages/offers/offers.component';
import { WebsiteOrderTrackingComponent } from './pages/order-tracking/order-tracking.component';

export const routes: Routes = [
  // Subdomain / Custom Domain Root Mode
  {
    path: '',
    component: ThemeLoaderComponent,
    children: [
      { path: '', component: WebsiteHomeComponent },
      { path: 'products', component: WebsiteProductsComponent },
      { path: 'products/:id', component: WebsiteProductDetailComponent },
      { path: 'cart', component: WebsiteCartComponent },
      { path: 'checkout', component: WebsiteCheckoutComponent },
      { path: 'offers', component: WebsiteOffersComponent },
      { path: 'order-tracking/:id', component: WebsiteOrderTrackingComponent },
    ]
  },

  // Plus Plan Path-Based Mode (/shop/:slug)
  {
    path: 'shop/:slug',
    component: ThemeLoaderComponent,
    children: [
      { path: '', component: WebsiteHomeComponent },
      { path: 'products', component: WebsiteProductsComponent },
      { path: 'products/:id', component: WebsiteProductDetailComponent },
      { path: 'cart', component: WebsiteCartComponent },
      { path: 'checkout', component: WebsiteCheckoutComponent },
      { path: 'offers', component: WebsiteOffersComponent },
      { path: 'order-tracking/:id', component: WebsiteOrderTrackingComponent },
    ]
  },

  { path: '**', redirectTo: '' }
];
