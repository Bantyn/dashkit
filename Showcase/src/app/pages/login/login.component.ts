import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ScrollRevealDirective],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  subdomain = '';
  redirecting = signal(false);
  targetUrl = '';

  handleRedirect() {
    this.redirecting.set(true);
    
    // Construct the redirection target URL.
    // If a subdomain is entered (e.g. "my-shop"), we can redirect to "http://my-shop.localhost:4200/login" 
    // or just "http://localhost:4200/login". The user states:
    // 'login karte wakt direct registerd shop ke dashboard par redirect hona chaiye you can redirect direct anaother like "http://localhost:4200/login"'
    const domainPart = this.subdomain.trim().toLowerCase();
    
    if (domainPart) {
      // Direct to shop domain (using localhost:4200 for local development)
      this.targetUrl = `http://${domainPart}.localhost:4200/login`;
    } else {
      // Fallback
      this.targetUrl = 'http://localhost:4200/login';
    }

    setTimeout(() => {
      window.location.href = this.targetUrl;
    }, 1500);
  }
}
