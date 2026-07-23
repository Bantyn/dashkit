import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

interface FeatureHighlight {
  id: number;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  illustrationType: 'sync' | 'packages' | 'vendors';
}

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-whats-new',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRevealDirective],
  templateUrl: './whats-new.component.html',
})
export class WhatsNewComponent {
  private readonly http = inject(HttpClient);

  // Form states
  loading = false;
  submittedSuccess = false;
  submittedError = '';

  form = {
    name: '',
    email: '',
    phone: '',
    shopName: '',
    message: '',
  };

  features: FeatureHighlight[] = [
    {
      id: 1,
      tagline: 'Planned Features',
      title: 'Inter-outlet operations',
      subtitle: 'Provide a seamless experience',
      description: 'Employ customer reward points synchronization to sync client profiles, accounts, and loyalty index metrics across all locations in real-time. Make sure your customers feel at home, no matter which branch they visit.',
      illustrationType: 'sync'
    },
    {
      id: 2,
      tagline: 'Planned Features',
      title: 'Customized packages',
      subtitle: 'Power of Personalization',
      description: 'This feature allows you to create personalized pack-packages related to specific client styles and sizes. Bundle up sizes, matching items, and colors to maximize client checkout ticket sizes.',
      illustrationType: 'packages'
    },
    {
      id: 3,
      tagline: 'Planned Features',
      title: 'Vendors communications',
      subtitle: 'Simplify inventory management',
      description: 'Send purchase orders, stock requests, and size matrix logs to suppliers automatically. Keep your stock healthy and minimize manual communication errors between your outlet and vendors.',
      illustrationType: 'vendors'
    }
  ];

  private getApiUrl(): string {
    return environment.apiUrl;
  }

  submitForm(formDirective: any) {
    if (formDirective.invalid) return;

    this.loading = true;
    this.submittedError = '';

    const payload = {
      ...this.form,
      type: 'demo', // Always submit as a demo request from this form
    };

    // Post to backend public endpoint (leads)
    this.http.post(`${this.getApiUrl()}/leads`, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.submittedSuccess = true;
        this.form = {
          name: '',
          email: '',
          phone: '',
          shopName: '',
          message: '',
        };
        formDirective.resetForm();
      },
      error: (err) => {
        this.loading = false;
        this.submittedError = err.error?.error?.message || 'Failed to submit request. Please check if backend is running.';
        console.error('Lead submission failed', err);
      },
    });
  }
}
