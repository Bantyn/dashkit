import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ScrollRevealDirective],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  subdomain = '';
  redirecting = signal(false);
  targetUrl = '';

  handleRedirect() {
    this.redirecting.set(true);
    
    const domainPart = this.subdomain.trim().toLowerCase();
    const baseUrl = environment.dashboardUrl;
    
    if (domainPart) {
      if (baseUrl.includes('localhost')) {
        this.targetUrl = `http://${domainPart}.localhost:4200/login`;
      } else {
        const cleanHost = baseUrl.replace(/^https?:\/\//, '');
        this.targetUrl = `https://${domainPart}.${cleanHost}/login`;
      }
    } else {
      this.targetUrl = `${baseUrl}/login`;
    }

    setTimeout(() => {
      window.location.href = this.targetUrl;
    }, 1500);
  }
}
