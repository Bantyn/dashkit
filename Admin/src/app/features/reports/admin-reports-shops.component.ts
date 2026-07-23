import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, SupportTicket } from '../../core/services/admin-api.service';
import { UiInputComponent } from '../../shared/components/ui-input.component';

@Component({
  selector: 'app-admin-reports-shops',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiInputComponent],
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#f5f7fa]">
      <div class="px-6 pt-6 bg-white border-b border-gray-200 shrink-0">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">Platform Reports</h2>
        <p class="text-sm text-gray-500 mb-6">Analytics and reporting for the entire Clothify platform.</p>
        
      </div>

      <div class="flex-1 overflow-auto p-6 space-y-6">
        <!-- Sub Tabs -->
        <div class="flex gap-3 bg-white p-1 rounded-xl w-fit border border-gray-200 shadow-sm">
          <button (click)="activeTab = 'stats'" class="px-5 py-2 text-sm font-semibold rounded-lg transition-colors" [class.bg-[var(--color-gray-50)]]="activeTab === 'stats'" [class.text-[var(--color-primary-700)]]="activeTab === 'stats'" [class.text-gray-500]="activeTab !== 'stats'">Growth Stats</button>
          <button (click)="activeTab = 'support'" class="px-5 py-2 text-sm font-semibold rounded-lg transition-colors" [class.bg-[var(--color-gray-50)]]="activeTab === 'support'" [class.text-[var(--color-primary-700)]]="activeTab === 'support'" [class.text-gray-500]="activeTab !== 'support'">Support Tickets
            @if (getPendingCount() > 0) {
              <span class="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ getPendingCount() }}</span>
            }
          </button>
        </div>

        @if (activeTab === 'stats') {
          <!-- Stat Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Total Shops</h3>
              <div class="text-3xl font-bold text-gray-900">0</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Active Shops</h3>
              <div class="text-3xl font-bold text-gray-900">0</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Churn Rate</h3>
              <div class="text-3xl font-bold text-gray-900">0%</div>
            </div>
          </div>
          <!-- Chart Placeholder -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px] text-gray-400">
            <i class="bi bi-graph-up text-6xl mb-4 text-gray-200"></i>
            <p class="text-sm font-medium text-gray-600">Shop growth data will appear here.</p>
          </div>
        } @else {
          <!-- Support Tickets -->
          <div class="flex-1 flex flex-col md:flex-row gap-6 h-[600px]">
            <!-- Left panel: Tickets List -->
            <div class="w-full md:w-1/3 flex flex-col border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="p-4 border-b border-gray-100 shrink-0">
                <app-ui-input [(ngModel)]="search" placeholder="Search tickets..."></app-ui-input>
              </div>
              <div class="flex-1 overflow-y-auto p-3 space-y-2">
                @if (tickets.length === 0) {
                  <div class="p-8 text-center text-gray-400">No support tickets found.</div>
                } @else {
                  @for (t of tickets; track t.id) {
                    <div (click)="selectTicket(t)" class="p-4 rounded-xl border cursor-pointer hover:bg-gray-50 transition-colors" [class.bg-blue-50]="selectedTicket?.id === t.id" [class.border-blue-200]="selectedTicket?.id === t.id" [class.border-gray-100]="selectedTicket?.id !== t.id">
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full" [class.bg-amber-100]="t.status === 'open'" [class.text-amber-700]="t.status === 'open'" [class.bg-blue-100]="t.status === 'replied'" [class.text-blue-700]="t.status === 'replied'" [class.bg-gray-100]="t.status === 'closed'" [class.text-gray-600]="t.status === 'closed'">{{ t.status | titlecase }}</span>
                        <span class="text-[10px] text-gray-400">{{ formatDate(t.createdAt) }}</span>
                      </div>
                      <h4 class="text-sm font-bold text-gray-900 truncate">{{ t.subject }}</h4>
                      <p class="text-xs text-gray-500 mt-1 truncate">{{ t.shopName }}</p>
                    </div>
                  }
                }
              </div>
            </div>
            
            <!-- Right Panel: Ticket details & Reply -->
            <div class="w-full md:w-2/3 border border-gray-200 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden relative">
              @if (!selectedTicket) {
                <div class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                  <i class="bi bi-chat-square-text text-6xl mb-4 text-gray-200"></i>
                  <p class="text-sm">Select a support ticket to view and reply.</p>
                </div>
              } @else {
                <div class="p-6 border-b border-gray-100 shrink-0 flex justify-between items-start">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">{{ selectedTicket.subject }}</h3>
                    <p class="text-sm text-gray-500 mt-1">From: <span class="font-medium text-gray-700">{{ selectedTicket.shopName }}</span> &lt;<a href="mailto:{{selectedTicket.reporterEmail}}" class="text-primary-600 hover:underline">{{ selectedTicket.reporterEmail }}</a>&gt;</p>
                  </div>
                  @if (selectedTicket.status !== 'closed') {
                    <button (click)="closeTicket(selectedTicket.id)" class="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close Ticket</button>
                  }
                </div>
                
                <div class="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
                  <!-- Original Message -->
                  <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold shrink-0 text-xs">{{ selectedTicket.shopName.charAt(0) }}</div>
                    <div class="flex-1">
                      <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ selectedTicket.description }}</p>
                      </div>
                      <span class="text-[10px] text-gray-400 ml-1 mt-1 block">{{ formatDate(selectedTicket.createdAt) }}</span>
                    </div>
                  </div>

                  <!-- Admin Reply -->
                  @if (selectedTicket.adminReply) {
                    <div class="flex gap-4 flex-row-reverse">
                      <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold shrink-0 text-xs">A</div>
                      <div class="flex-1 flex flex-col items-end">
                        <div class="bg-primary-50 p-4 rounded-2xl rounded-tr-none border border-primary-100 shadow-sm text-left">
                          <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ selectedTicket.adminReply }}</p>
                        </div>
                        <span class="text-[10px] text-gray-400 mr-1 mt-1 block">{{ formatDate(selectedTicket.repliedAt) }}</span>
                      </div>
                    </div>
                  }
                </div>
                
                @if (selectedTicket.status !== 'closed') {
                  <div class="p-4 border-t border-gray-200 bg-white shrink-0">
                    <textarea [(ngModel)]="replyText" rows="3" placeholder="Type your reply to the shop owner... (This will send an email)" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none resize-none mb-3"></textarea>
                    <div class="flex justify-end">
                      <button (click)="sendReply()" [disabled]="!replyText.trim() || sending" class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                        @if (sending) { <i class="bi bi-arrow-repeat animate-spin"></i> }
                        <i class="bi bi-send-fill"></i> Send Reply
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminReportsShopsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  activeTab: 'stats' | 'support' = 'stats';
  
  tickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;
  search = '';
  replyText = '';
  sending = false;

  ngOnInit() {
    this.loadTickets();
  }

  async loadTickets() {
    try {
      const res = await firstValueFrom(this.adminApi.getSupportTickets());
      this.tickets = res.data || [];
      if (this.selectedTicket) {
        this.selectedTicket = this.tickets.find(t => t.id === this.selectedTicket?.id) || null;
      }
    } catch (e) {
      console.error(e);
    }
  }

  selectTicket(ticket: SupportTicket) {
    this.selectedTicket = ticket;
    this.replyText = '';
  }

  async sendReply() {
    if (!this.selectedTicket || !this.replyText.trim()) return;
    this.sending = true;
    try {
      await firstValueFrom(this.adminApi.replyToTicket(this.selectedTicket.id, this.replyText));
      await this.loadTickets();
      this.replyText = '';
      alert('Reply sent successfully. An email has been dispatched to the shop owner.');
    } catch (e) {
      console.error(e);
      alert('Failed to send reply');
    } finally {
      this.sending = false;
    }
  }

  async closeTicket(id: string) {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    try {
      await firstValueFrom(this.adminApi.closeTicket(id));
      await this.loadTickets();
    } catch (e) {
      console.error(e);
      alert('Failed to close ticket');
    }
  }

  getPendingCount() {
    return this.tickets.filter(t => t.status === 'open').length;
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
