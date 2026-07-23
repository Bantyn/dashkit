import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    data: {
      seo: {
        title: 'Dashkit - All-in-One Boutique POS & Retail Management Software',
        description: 'Supercharge your apparel retail store with Dashkit. Features modern boutique POS billing, size-color inventory matrix, multi-branch syncing, and integrated retail CRM.',
        keywords: 'boutique billing software, clothing store POS system, retail inventory tracker, boutique management app, garment POS'
      }
    }
  },
  {
    path: 'whats-new',
    loadComponent: () => import('./pages/whats-new/whats-new.component').then((m) => m.WhatsNewComponent),
    data: {
      seo: {
        title: 'Latest Updates & New Retail Features | Dashkit',
        description: 'Discover the newest feature additions to Dashkit: WhatsApp automated invoicing, advanced customer retention programs, multi-color matrix search, and optimized checkout workflows.',
        keywords: 'Dashkit features, boutique billing updates, cloud pos latest version, retail POS upgrades'
      }
    }
  },
  {
    path: 'blogs',
    loadComponent: () => import('./pages/blogs/blogs.component').then((m) => m.BlogsComponent),
    data: {
      seo: {
        title: 'Retail Boutique Growth Tips, Trends & Success Stories | Dashkit Blog',
        description: 'Explore expert insights, how-to guides, boutique inventory matrix strategies, and success stories on scaling your clothing store operations and boosting sales.',
        keywords: 'apparel retail blog, boutique business tips, how to grow fashion boutique, cloud pos software guide'
      }
    }
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    data: {
      seo: {
        title: 'About Us - Our Mission to Empower Fashion Retailers | Dashkit',
        description: 'Learn the story of Dashkit. We build modern, lightning-fast retail management software to help boutique owners digitize billing, control stocks, and engage customers.',
        keywords: 'Dashkit story, apparel billing creators, about Dashkit software, cloud billing developers'
      }
    }
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
    data: {
      seo: {
        title: 'Contact Dashkit - 24/7 Boutique POS Technical Support',
        description: 'Need help setting up your barcode scanner, receipt printer, or syncing inventory? Reach out to the Dashkit support team for free onboarding sessions.',
        keywords: 'contact Dashkit support, boutique billing customer care, retail software demo request'
      }
    }
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing.component').then((m) => m.PricingComponent),
    data: {
      seo: {
        title: 'Simple, Transparent Pricing Plans for Boutiques | Dashkit',
        description: 'Choose from our Free, Professional, or Multi-Branch subscription plans tailored to boutiques and clothing brands of all sizes. No setup fees, cancel anytime.',
        keywords: 'apparel POS pricing, boutique billing system cost, retail billing software price, boutique app subscription'
      }
    }
  },
  {
    path: 'checkout/:planId',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
    data: {
      seo: {
        title: 'Secure Checkout - Upgrade Your Dashkit Plan',
        description: 'Complete your subscription upgrade securely. Unlock features like barcode generation, multi-branch tracking, and automated WhatsApp billing.',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    data: {
      seo: {
        title: 'Merchant Portal Login - Manage Your Boutique | Dashkit',
        description: 'Log in to your Dashkit admin dashboard to monitor live sales counters, check stock metrics, edit catalog products, and run SMS campaigns.',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'how-to-install',
    loadComponent: () => import('./pages/how-to-install/how-to-install').then((m) => m.HowToInstall),
    data: {
      seo: {
        title: 'Step-by-Step Boutique POS Installation Guide | Dashkit',
        description: 'Learn how to easily set up Dashkit in under 30 minutes. Complete hardware compatibility list for thermal printers, barcode scanners, and tablet mounts.',
        keywords: 'how to setup boutique pos, connect thermal receipt printer, barcode reader installation, Dashkit desktop app'
      }
    }
  },
  {
    path: 'billing-and-pos',
    loadComponent: () => import('./pages/billing-and-pos/billing-and-pos').then((m) => m.BillingAndPosComponent),
    data: {
      seo: {
        title: 'Lightning-Fast Boutique Billing & Offline Cloud POS | Dashkit',
        description: 'Bill customers in under 30 seconds with our optimized boutique POS. Supports offline billing queue, custom catalog searches, and digital WhatsApp receipt sharing.',
        keywords: 'boutique billing app, offline POS software, whatsapp receipt billing, retail point of sale'
      }
    }
  },
  {
    path: 'staff-management',
    loadComponent: () => import('./pages/staff-management/staff-management').then((m) => m.StaffManagementComponent),
    data: {
      seo: {
        title: 'Boutique Staff Permissions & Cashier Tracking | Dashkit',
        description: 'Track sales performance by staff member, assign secure role-based access levels, and audit cashier registers to eliminate boutique inventory discrepancies.',
        keywords: 'cashier tracking software, boutique staff permission, retail user roles, cashier logging'
      }
    }
  },
  {
    path: 'inventory-tracker',
    loadComponent: () => import('./pages/inventory-tracker/inventory-tracker').then((m) => m.InventoryTrackerComponent),
    data: {
      seo: {
        title: 'Size & Color Matrix Apparel Inventory Tracker | Dashkit',
        description: 'Track garments using a multi-dimensional size/color matrix. Monitor stock levels, set low-stock thresholds, and generate custom barcode stickers.',
        keywords: 'clothing size matrix, boutique inventory tracker, barcode generation software, apparel matrix stock'
      }
    }
  },
  {
    path: 'customer-crm',
    loadComponent: () => import('./pages/customer-crm/customer-crm').then((m) => m.CustomerCrmComponent),
    data: {
      seo: {
        title: 'Integrated Retail CRM & Boutique Loyalty Programs | Dashkit',
        description: 'Record customer size preferences, store transaction histories, and run targeted SMS campaigns. Seamless loyalty points calculation at POS checkout.',
        keywords: 'boutique customer database, apparel loyalty program, retail sms marketing, customer profile app'
      }
    }
  },
  {
    path: 'reports-analytics',
    loadComponent: () => import('./pages/reports-analytics/reports-analytics').then((m) => m.ReportsAnalyticsComponent),
    data: {
      seo: {
        title: 'Boutique Sales Reports & Advanced Retail Analytics | Dashkit',
        description: 'Get actionable insights with live sales charts, profit margin analytics, dead stock locators, and automated tax compilation reports.',
        keywords: 'boutique profit report, clothing shop analytics, dead stock finder, apparel sales charts'
      }
    }
  },
  {
    path: 'website-builder',
    loadComponent: () => import('./pages/website-builder/website-builder').then((m) => m.WebsiteBuilderComponent),
    data: {
      seo: {
        title: "Launch Your Boutique's E-commerce Site in One Click | Dashkit",
        description: 'Instantly launch your boutique website. Seamlessly sync inventory, receive online orders, and accept secure payments via integrated payment gateway.',
        keywords: 'create clothing website, boutique online store maker, sync offline online inventory, ecommerce boutique website'
      }
    }
  },
  {
    path: 'multi-branch',
    loadComponent: () => import('./pages/multi-branch/multi-branch').then((m) => m.MultiBranchComponent),
    data: {
      seo: {
        title: 'Multi-Branch Boutique Syncing & Centralized Inventory | Dashkit',
        description: 'Manage multiple retail outlets. Transfer stock between showrooms, monitor cross-branch sales, and consolidate financial sheets in one dashboard.',
        keywords: 'multi boutique software, branch inventory transfer, consolidated retail reports, multi location showroom'
      }
    }
  },
  {
    path: '**',
    redirectTo: '',
  },
];
