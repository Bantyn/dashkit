import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-website-auth',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screenflex flex-col justify-center">
      <div class="bg-white shadow sm:rounded-lg sm:px-10">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class WebsiteAuthComponent {}
