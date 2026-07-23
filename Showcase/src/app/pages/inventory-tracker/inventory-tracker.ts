import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-inventory-tracker',
  imports: [ScrollRevealDirective],
  templateUrl: './inventory-tracker.html',
  styleUrl: './inventory-tracker.css',
})
export class InventoryTrackerComponent {
}
