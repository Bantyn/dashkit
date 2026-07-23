import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-website-builder',
  imports: [ScrollRevealDirective],
  templateUrl: './website-builder.html',
  styleUrl: './website-builder.css',
})
export class WebsiteBuilderComponent {
}
