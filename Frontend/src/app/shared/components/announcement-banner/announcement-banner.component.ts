import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerComponent } from '../ui/banner.component';

@Component({
  selector: 'app-announcement-banner',
  standalone: true,
  imports: [CommonModule, BannerComponent],
  template: `
    <div *ngIf="announcements && announcements.length > 0">
      <app-banner 
        *ngFor="let announcement of announcements; let i = index"
        [id]="'ann-' + (announcement._id || i)"
        variant="rainbow"
        class="block relative -top-8"
      >
        <div class="flex flex-col items-center">
          <span class="font-medium text-sm">{{ announcement.title }}</span>
          <span class="text-xs opacity-90">{{ announcement.message }}</span>
        </div>
      </app-banner>
    </div>
  `
})
export class AnnouncementBannerComponent {
  @Input() announcements: any[] = [];
}
