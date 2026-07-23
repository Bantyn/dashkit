import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-templates.html',
  styleUrl: './email-templates.css',
})
export class EmailTemplates implements OnInit {
  templates: any[] = [];
  shopId = '';
  isLoading = false;
  selectedTemplate: any = null;

  // Live editor / preview variables
  testRecipient = '';
  isSendingTest = false;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadTemplates();
      }
    });
  }

  loadTemplates() {
    if (!this.shopId) return;
    this.isLoading = true;
    this.notificationService.getTemplates(this.shopId).subscribe({
      next: (res) => {
        // filter for email templates
        this.templates = (res.data || []).filter((t) => t.type === 'email');
        if (this.templates.length > 0) {
          this.selectTemplate(this.templates[0]);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading email templates:', err);
        this.isLoading = false;
      },
    });
  }

  selectTemplate(tmpl: any) {
    // Clone to prevent direct mutations before saving
    this.selectedTemplate = JSON.parse(JSON.stringify(tmpl));
  }

  get compiledPreview(): string {
    if (!this.selectedTemplate || !this.selectedTemplate.content) return '';
    let preview = this.selectedTemplate.content;

    // Substitute dummy variables for preview
    const dummyVars: Record<string, string> = {
      customerName: 'John Doe',
      orderNumber: 'ORD-5489',
      totalAmount: '4,599.00',
      paymentMethod: 'UPI',
      status: 'SHIPPED',
    };

    for (const [key, val] of Object.entries(dummyVars)) {
      preview = preview.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val);
    }
    return preview;
  }

  saveTemplate() {
    if (!this.selectedTemplate || !this.selectedTemplate.id) return;
    this.isLoading = true;
    this.notificationService
      .updateTemplate(this.selectedTemplate.id, this.selectedTemplate)
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Template saved successfully!');
          // update local list
          const idx = this.templates.findIndex((t) => t.id === this.selectedTemplate.id);
          if (idx !== -1) {
            this.templates[idx] = JSON.parse(JSON.stringify(this.selectedTemplate));
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error saving template:', err);
          this.toastService.showError('Error saving template');
          this.isLoading = false;
        },
      });
  }

  sendTest() {
    if (!this.testRecipient) {
      this.toastService.showWarning('Please enter a test email address.');
      return;
    }
    this.isSendingTest = true;
    const payload = {
      shopId: this.shopId,
      type: 'email',
      recipient: this.testRecipient,
      subject: this.selectedTemplate.subject,
      content: this.compiledPreview,
    };

    this.notificationService.sendTestNotification(payload).subscribe({
      next: () => {
        this.toastService.showSuccess('Test email dispatched! Check details in Notification Logs.');
        this.isSendingTest = false;
      },
      error: (err) => {
        this.toastService.showError(`Failed to send test email: ${err.error?.error?.message || err.message}`);
        this.isSendingTest = false;
      },
    });
  }
}
