import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-8 max-w-full mx-auto min-h-screen">
      <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-600)] p-8 text-white">
          <h1 class="text-3xl font-bold mb-2">Help & Support</h1>
          <p class="opacity-90">Need assistance? Report an issue or ask a question directly to our support team.</p>
        </div>
        
        <div class="p-8">
          <form (ngSubmit)="submitTicket()" class="space-y-6 max-w-full">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                name="subject"
                [(ngModel)]="form.subject"
                required
                placeholder="Briefly describe your issue..."
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] rounded-xl text-sm transition-all outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Details</label>
              <textarea
                name="description"
                [(ngModel)]="form.description"
                required
                rows="6"
                placeholder="Provide as much detail as possible so we can assist you better..."
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] rounded-xl text-sm transition-all outline-none resize-y"
              ></textarea>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="submit"
                [disabled]="loading || !form.subject || !form.description"
                class="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                @if (loading) {
                  <i class="bi bi-arrow-repeat animate-spin"></i>
                  Submitting...
                } @else {
                  <i class="bi bi-send-fill"></i>
                  Submit Ticket
                }
              </button>
            </div>
          </form>
        </div>
        
        <div class="bg-gray-50 border-t border-gray-100 p-6 flex items-start gap-4 text-sm text-gray-600">
          <i class="bi bi-info-circle-fill text-xl text-blue-500 shrink-0"></i>
          <p>
            When you submit a ticket, our support team will be notified immediately. We typically respond within 24 hours. 
            Replies will be sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  `
})
export class HelpComponent {
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly tenant = inject(TenantService);

  form = {
    subject: '',
    description: ''
  };
  loading = false;

  submitTicket() {
    if (!this.form.subject.trim() || !this.form.description.trim()) {
      this.toast.showError('Please fill out all fields');
      return;
    }

    this.loading = true;
    
    // We get the shop context and current user
    const user = this.auth.getCurrentUser();
    const shopId = user?.shopId;

    if (!shopId || !user) {
      this.toast.showError('Authentication error. Please login again.');
      this.loading = false;
      return;
    }

    const payload = {
      shopId: shopId,
      shopName: user.shopId || 'Shop', // If shopName is accessible elsewhere you can use it
      reporterEmail: user.email,
      subject: this.form.subject,
      description: this.form.description
    };

    this.shopService.createSupportTicket(payload).subscribe({
      next: () => {
        this.toast.showSuccess('Support ticket submitted successfully!');
        this.form = { subject: '', description: '' };
        this.loading = false;
      },
      error: (err) => {
        console.error('Ticket error:', err);
        this.toast.showError(err.error?.message || 'Failed to submit ticket');
        this.loading = false;
      }
    });
  }
}
