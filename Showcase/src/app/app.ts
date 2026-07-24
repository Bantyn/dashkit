import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FaqTabsComponent } from './components/faq-tabs/faq-tabs.component';
import { BannerComponent } from './components/banner.component';
import { SeoService } from './services/seo.service';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';

import { UiLogoComponent } from './components/ui-logo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FaqTabsComponent, BannerComponent, UiLogoComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  dashboardUrl = environment.dashboardUrl;
  isMobileMenuOpen = signal(false);
  announcements = signal<any[]>([]);
  private seoService = inject(SeoService);
  private http = inject(HttpClient);

  constructor() {
    this.seoService.init();
    this.setGlobalSchemas();
    this.loadTheme();
    this.loadAnnouncements();
  }

  private getApiUrl(): string {
    const windowEnv = (window as any)?.__env?.API_URL;
    if (windowEnv) return windowEnv;
    return environment.apiUrl;
  }

  private loadTheme() {
    this.http.get<any>(`${this.getApiUrl()}/themes`).subscribe({
      next: (res) => {
        if (res.success && res.data?.website) {
          this.applyWebsiteTheme(res.data.website);
        }
      },
      error: (err) => console.warn('Failed to load website theme settings', err)
    });
  }

  private loadAnnouncements() {
    this.http.get<any>(`${this.getApiUrl()}/announcements?status=published`).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const platformAnnouncements = res.data.filter((a: any) => a.target?.type === 'platform');
          this.announcements.set(platformAnnouncements);
        }
      },
      error: (err) => console.warn('Failed to load announcements', err)
    });
  }

  private applyWebsiteTheme(theme: any) {
    if (!theme) return;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--bg-card', theme.surfaceColor);
    root.style.setProperty('--font-family-base', theme.fontFamily || 'Inter');
    root.style.setProperty('--radius-xl', theme.radius || '24px');

    if (theme.primaryColor) {
      const hex = theme.primaryColor;

      const adjustColor = (color: string, amount: number) => {
        return (
          '#' +
          color
            .replace(/^#/, '')
            .replace(/../g, (c) =>
              ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2),
            )
        );
      };

      root.style.setProperty('--color-primary-50', adjustColor(hex, 200));
      root.style.setProperty('--color-primary-100', adjustColor(hex, 160));
      root.style.setProperty('--color-primary-200', adjustColor(hex, 80));
      root.style.setProperty('--color-primary-300', adjustColor(hex, 60));
      root.style.setProperty('--color-primary-400', adjustColor(hex, 40));
      root.style.setProperty('--color-primary-500', adjustColor(hex, 20));
      root.style.setProperty('--color-primary-600', hex);
      root.style.setProperty('--color-primary-700', adjustColor(hex, -20));
      root.style.setProperty('--color-primary-800', adjustColor(hex, -40));
      root.style.setProperty('--color-primary-900', adjustColor(hex, -60));
    }
  }

  private setGlobalSchemas() {
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'DashKit',
      'url': 'https://dashkit.js.org',
      'logo': 'https://dashkit.js.org/favicon.png',
      'sameAs': [
        'https://twitter.com/dashkit',
        'https://facebook.com/dashkit',
        'https://instagram.com/dashkit'
      ],
      'description': 'All-in-One Retail & E-commerce Management Platform for modern businesses and stores.'
    }, 'org-schema');

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Dashkit',
      'url': 'https://Dashkit.co'
    }, 'website-schema');
  }

  faqCategories = {
    "pos": "Billing & POS",
    "inventory": "Inventory Control", 
    "marketing": "CRM & Marketing",
    "support": "Setup & Support"
  };

  faqData = {
    "pos": [
      {
        question: "Does Dashkit POS support offline billing?",
        answer: "Yes! Dashkit POS has an offline mode that queues transactions locally and uploads them automatically once internet connectivity is restored, ensuring you never stop billing."
      },
      {
        question: "Can I generate digital bills and send them to WhatsApp?",
        answer: "Absolutely. Dashkit integrates with WhatsApp to send digital PDF invoices directly to customer phone numbers, reducing paper receipt printing costs."
      },
      {
        question: "Does the POS support custom discount calculations?",
        answer: "Yes, you can apply percentage discounts, flat discounts, or store-wide promotional loyalty codes directly at checkout in just one click."
      }
    ],
    "inventory": [
      {
        question: "How does the size and color matrix work?",
        answer: "Dashkit allows you to group variants under a single item. You can track stocks of a specific apparel across multiple size ranges (S, M, L, XL) and color codes dynamically."
      },
      {
        question: "Can I generate and print barcodes through Dashkit?",
        answer: "Yes, Dashkit has a built-in barcoding engine that designs and prints custom 1D/2D barcodes on thermal labels for your clothing racks."
      },
      {
        question: "Will I get notifications when inventory runs low?",
        answer: "Yes, you can set custom safety-stock thresholds for each item variant. Dashkit triggers automated alerts when stock drops below your set limit."
      }
    ],
    "marketing": [
      {
        question: "Can I track customer purchase history?",
        answer: "Yes. Every invoice is linked to a customer profile, showing their apparel size history, brand preferences, transaction logs, and accumulated loyalty points."
      },
      {
        question: "How do customers redeem loyalty points?",
        answer: "During checkout, cashiers can view available loyalty points and apply them as a discount code based on your custom point-redemption rules."
      },
      {
        question: "Does Dashkit support bulk SMS campaigns?",
        answer: "Yes, our built-in CRM lets you run targeted SMS campaigns for birthdays, holidays, or seasonal store clearances to drive repeat footfalls."
      }
    ],
    "support": [
      {
        question: "How long does it take to set up Dashkit in my boutique?",
        answer: "It takes less than 30 minutes! You can upload your inventory catalog via Excel sheets and configure your POS receipt printer immediately."
      },
      {
        question: "Can I use Dashkit on multiple devices?",
        answer: "Yes, Dashkit runs on secure cloud servers, meaning you can access your sales dashboard and track inventory from your browser, tablet, or mobile phone."
      },
      {
        question: "Do you provide onboarding training for store cashiers?",
        answer: "Yes, we offer free onboarding training sessions for your staff and cashiers, along with 24/7 dedicated customer support."
      }
    ]
  };

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
