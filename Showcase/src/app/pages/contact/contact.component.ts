import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRevealDirective],
  templateUrl: './contact.component.html',
})
export class ContactComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  leadType: 'contact' | 'demo' = 'contact';
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

  ngOnInit() {
    // Check if demo query param is set
    this.route.queryParams.subscribe((params) => {
      if (params['demo'] === 'true') {
        this.leadType = 'demo';
      }
    });
  }

  setLeadType(type: 'contact' | 'demo') {
    this.leadType = type;
    this.submittedSuccess = false;
    this.submittedError = '';
  }

  private getApiUrl(): string {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3003/api/v1';
    }
    return 'https://dashkit-server.onrender.com/api/v1';
  }

  submitForm(formDirective: any) {
    if (formDirective.invalid) return;

    this.loading = true;
    this.submittedError = '';

    const payload = {
      ...this.form,
      type: this.leadType,
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
