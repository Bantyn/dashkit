import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-logs.html',
  styleUrl: './notification-logs.css',
})
export class NotificationLogs implements OnInit {
  protected readonly Math = Math;
  logs: any[] = [];
  shopId = '';
  isLoading = false;
  searchQuery = '';
  selectedType = '';
  selectedStatus = '';

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadLogs();
      }
    });
  }

  loadLogs() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.notificationService.getLogs(this.shopId).subscribe({
      next: (res) => {
        this.logs = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notification logs:', err);
        this.isLoading = false;
      },
    });
  }

  get filteredLogs(): any[] {
    let list = this.logs;
    const q = this.searchQuery.toLowerCase().trim();

    if (q) {
      list = list.filter(
        (l) =>
          l.recipient.toLowerCase().includes(q) ||
          l.content.toLowerCase().includes(q) ||
          (l.subject && l.subject.toLowerCase().includes(q))
      );
    }

    if (this.selectedType) {
      list = list.filter((l) => l.type === this.selectedType);
    }

    if (this.selectedStatus) {
      list = list.filter((l) => l.status === this.selectedStatus);
    }

    return list;
  }
}
