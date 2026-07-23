import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { filter, map } from 'rxjs/operators';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  canonicalUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private document = inject(DOCUMENT);

  private readonly defaultTitle = 'Clothify - All-in-One Retail & E-commerce Management Platform';
  private readonly defaultDesc = 'Supercharge your clothing store with Clothify. Dynamic boutique billing POS, size-color inventory matrix, multi-branch tracking, and built-in retail CRM.';
  private readonly defaultKeywords = 'boutique pos billing system, clothing store billing, retail inventory matrix, boutique management software, apparel inventory tracker';
  private readonly defaultOgImage = 'https://clothify.co/og-card.png';
  private readonly baseDomain = 'https://clothify.co';

  init() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.data;
      })
    ).subscribe(data => {
      const seoData = data['seo'] || {};
      this.applySeo(seoData);
    });
  }

  applySeo(seo: SeoMetadata) {
    const title = seo.title || this.defaultTitle;
    const desc = seo.description || this.defaultDesc;
    const keywords = seo.keywords || this.defaultKeywords;
    const robots = seo.robots || 'index, follow';
    
    // 1. Title
    this.titleService.setTitle(title);

    // 2. Meta Tags
    this.updateMeta('description', desc);
    this.updateMeta('keywords', keywords);
    this.updateMeta('robots', robots);

    // 3. Open Graph Tags
    const ogTitle = seo.ogTitle || title;
    const ogDesc = seo.ogDescription || desc;
    const ogImage = seo.ogImage || this.defaultOgImage;
    const ogType = seo.ogType || 'website';
    
    const currentUrl = seo.canonicalUrl || (this.baseDomain + this.router.url.split('?')[0]);
    
    this.updateMetaProperty('og:title', ogTitle);
    this.updateMetaProperty('og:description', ogDesc);
    this.updateMetaProperty('og:image', ogImage);
    this.updateMetaProperty('og:type', ogType);
    this.updateMetaProperty('og:url', currentUrl);

    // 4. Twitter Card Tags
    const twitterCard = seo.twitterCard || 'summary_large_image';
    const twitterTitle = seo.twitterTitle || ogTitle;
    const twitterDesc = seo.twitterDescription || ogDesc;
    const twitterImage = seo.twitterImage || ogImage;

    this.updateMeta('twitter:card', twitterCard);
    this.updateMeta('twitter:title', twitterTitle);
    this.updateMeta('twitter:description', twitterDesc);
    this.updateMeta('twitter:image', twitterImage);

    // 5. Canonical Link
    this.setCanonicalUrl(currentUrl);
  }

  private updateMeta(name: string, content: string) {
    if (content) {
      this.metaService.updateTag({ name, content });
    } else {
      this.metaService.removeTag(`name="${name}"`);
    }
  }

  private updateMetaProperty(property: string, content: string) {
    if (content) {
      this.metaService.updateTag({ property, content });
    } else {
      this.metaService.removeTag(`property="${property}"`);
    }
  }

  setCanonicalUrl(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setJsonLd(schema: any, schemaId = 'seo-jsonld') {
    this.clearJsonLd(schemaId);
    
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = schemaId;
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  clearJsonLd(schemaId = 'seo-jsonld') {
    const existingScript = this.document.getElementById(schemaId);
    if (existingScript) {
      existingScript.remove();
    }
  }
}
