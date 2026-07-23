import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApiService, LeadRecord } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <!-- Left Header -->
        <div class="flex-1 px-6 py-5 flex justify-between items-center border-r border-gray-200 min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Leads & Inquiries</h2>
            <p class="text-xs text-gray-500 mt-1">Track and respond to Contact Messages and Free Demo Requests.</p>
          </div>
          <div class="flex gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              Total: {{ leads.length }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
              Pending: {{ getCount('pending') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel Content (List) -->
        <div class="w-full md:w-[65%] flex flex-col min-w-0 bg-gray-50 transition-all duration-300 border-r border-gray-200 overflow-hidden">
          
          <!-- Filters & Search -->
          <div class="p-4 bg-white border-b border-gray-100 shrink-0 space-y-4">
            <div class="flex flex-col gap-3">
              <!-- Type Switcher -->
              <div class="flex bg-gray-50 p-1 rounded-xl border border-gray-200 w-full overflow-x-auto custom-scrollbar">
                <button
                  (click)="filterType = ''; applyFilters()"
                  class="flex-1 whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                  [class.bg-white]="filterType === ''"
                  [class.text-[var(--color-primary-600)]]="filterType === ''"
                  [class.shadow-sm]="filterType === ''"
                  [class.text-gray-500]="filterType !== ''"
                >
                  All
                </button>
                <button
                  (click)="filterType = 'contact'; applyFilters()"
                  class="flex-1 whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                  [class.bg-white]="filterType === 'contact'"
                  [class.text-[var(--color-primary-600)]]="filterType === 'contact'"
                  [class.shadow-sm]="filterType === 'contact'"
                  [class.text-gray-500]="filterType !== 'contact'"
                >
                  Contact
                </button>
                <button
                  (click)="filterType = 'demo'; applyFilters()"
                  class="flex-1 whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                  [class.bg-white]="filterType === 'demo'"
                  [class.text-[var(--color-primary-600)]]="filterType === 'demo'"
                  [class.shadow-sm]="filterType === 'demo'"
                  [class.text-gray-500]="filterType !== 'demo'"
                >
                  Demo
                </button>
                <button
                  (click)="filterType = 'enterprise'; applyFilters()"
                  class="flex-1 whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                  [class.bg-white]="filterType === 'enterprise'"
                  [class.text-[var(--color-primary-600)]]="filterType === 'enterprise'"
                  [class.shadow-sm]="filterType === 'enterprise'"
                  [class.text-gray-500]="filterType !== 'enterprise'"
                >
                  Enterprise
                </button>
              </div>

              <!-- Status Filter -->
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status:</span>
                <select
                  [(ngModel)]="filterStatus"
                  (change)="applyFilters()"
                  class="flex-1 text-sm font-medium px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            @if (loading) {
              <div class="p-8 text-center text-gray-400 text-sm">
                <i class="bi bi-arrow-repeat animate-spin inline-block text-xl mb-2"></i><br/>
                Loading leads...
              </div>
            } @else if (filteredLeads.length === 0) {
              <div class="p-8 text-center text-gray-400 text-sm">
                <i class="bi bi-inbox text-3xl mb-2 block text-gray-300"></i>
                <span class="font-bold">No leads match your filters.</span>
              </div>
            } @else {
              @for (lead of filteredLeads; track lead.id) {
                <div
                  (click)="selectLead(lead)"
                  class="p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm"
                  [class.bg-[var(--color-gray-50)]]="selectedLead?.id === lead.id"
                  [class.border-[var(--color-primary-200)]]="selectedLead?.id === lead.id"
                  [class.bg-white]="selectedLead?.id !== lead.id"
                  [class.border-gray-100]="selectedLead?.id !== lead.id"
                >
                  <div class="flex justify-between items-start mb-2">
                    <span
                      class="text-[9px] font-bold uppercase tracking-wider"
                    >
                      <span *ngIf="lead.type === 'contact'" class="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">Contact</span>
                      <span *ngIf="lead.type === 'demo'" class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">Demo</span>
                      <span *ngIf="lead.type === 'enterprise'" class="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">Enterprise</span>
                    </span>
                    <span
                      class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      [class.bg-amber-50]="lead.status === 'pending'"
                      [class.text-amber-700]="lead.status === 'pending'"
                      [class.border-amber-100]="lead.status === 'pending'"
                      [class.bg-blue-50]="lead.status === 'contacted'"
                      [class.text-blue-700]="lead.status === 'contacted'"
                      [class.border-blue-100]="lead.status === 'contacted'"
                      [class.bg-green-50]="lead.status === 'resolved'"
                      [class.text-green-700]="lead.status === 'resolved'"
                      [class.border-green-100]="lead.status === 'resolved'"
                    >
                      {{ lead.status }}
                    </span>
                  </div>
                  <h4 class="font-bold text-gray-900 text-sm truncate" [class.text-primary-700]="selectedLead?.id === lead.id">{{ lead.name }}</h4>
                  <p class="text-[11px] text-gray-500 mt-0.5 truncate font-medium">{{ lead.email }}</p>
                  <div class="text-[10px] text-gray-400 mt-2 text-right font-medium">
                    {{ formatDate(lead.createdAt) }}
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Right Panel (Details) -->
        <div class="w-full md:w-[35%] hidden md:flex flex-col bg-white overflow-hidden transition-all duration-300 transform translate-x-0 relative">
          @if (!selectedLead) {
            <div class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
              <i class="bi bi-person-lines-fill text-6xl mb-4 text-gray-200"></i>
              <h3 class="text-sm font-bold text-gray-600 mb-1">No Lead Selected</h3>
              <p class="text-xs text-gray-400">Select a lead from the list to view details and update status.</p>
            </div>
          } @else {
            <!-- Lead Header -->
            <div class="bg-white p-6 border-b border-gray-100 shrink-0 z-10">
              <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                    <i class="bi text-2xl text-gray-500" [class.bi-envelope-paper]="selectedLead.type === 'contact'" [class.bi-play-circle]="selectedLead.type === 'demo'"></i>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-900">{{ selectedLead.name }}</h2>
                    <div class="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                      <a href="mailto:{{ selectedLead.email }}" class="hover:text-primary-600 flex items-center gap-1.5 transition-colors"><i class="bi bi-envelope"></i> {{ selectedLead.email }}</a>
                      @if (selectedLead.phone) {
                        <span class="text-gray-300">&bull;</span>
                        <a href="tel:{{ selectedLead.phone }}" class="hover:text-primary-600 flex items-center gap-1.5 transition-colors"><i class="bi bi-telephone"></i> {{ selectedLead.phone }}</a>
                      }
                    </div>
                  </div>
                </div>
                
                <button
                  (click)="deleteLead(selectedLead.id!)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                  title="Delete Lead"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
              
              <div class="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div class="flex-1 min-w-[120px]">
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company</span>
                  <span class="text-sm font-bold text-gray-900">{{ selectedLead.shopName || 'Not provided' }}</span>
                </div>
                <div class="flex-1 min-w-[120px]">
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Request Type</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                        [ngClass]="{
                          'bg-purple-50 text-purple-700 border-purple-100': selectedLead.type === 'contact',
                          'bg-blue-50 text-blue-700 border-blue-100': selectedLead.type === 'demo',
                          'bg-orange-50 text-orange-700 border-orange-100': selectedLead.type === 'enterprise'
                        }">
                    {{ selectedLead.type }}
                  </span>
                </div>
                <div class="flex-1 min-w-[120px]">
                  <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted</span>
                  <span class="text-sm font-bold text-gray-900">{{ formatDate(selectedLead.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Lead Content -->
            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30">
              <div class="max-w-3xl space-y-6">
                <!-- Message Section -->
                <div>
                  <h3 class="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i class="bi bi-chat-square-text text-gray-400"></i>
                    Message from User
                  </h3>
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p class="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed font-medium">{{ selectedLead.message || 'No message provided.' }}</p>
                  </div>
                </div>

                <!-- Status Update Section -->
                <div>
                  <h3 class="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i class="bi bi-arrow-repeat text-gray-400"></i>
                    Update Lead Status
                  </h3>
                  
                  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-3">
                    <button
                      (click)="updateStatus('pending')"
                      class="flex-1 min-w-[120px] px-4 py-3 rounded-xl border transition-all text-sm font-bold flex flex-col items-center gap-1.5"
                      [class.bg-amber-50]="selectedLead.status === 'pending'"
                      [class.border-amber-200]="selectedLead.status === 'pending'"
                      [class.text-amber-700]="selectedLead.status === 'pending'"
                      [class.shadow-sm]="selectedLead.status === 'pending'"
                      [class.bg-white]="selectedLead.status !== 'pending'"
                      [class.border-gray-200]="selectedLead.status !== 'pending'"
                      [class.text-gray-500]="selectedLead.status !== 'pending'"
                      [class.hover:bg-gray-50]="selectedLead.status !== 'pending'"
                    >
                      <i class="bi bi-hourglass-split text-lg mb-0.5" [class.text-amber-500]="selectedLead.status === 'pending'"></i>
                      Pending
                    </button>
                    
                    <button
                      (click)="updateStatus('contacted')"
                      class="flex-1 min-w-[120px] px-4 py-3 rounded-xl border transition-all text-sm font-bold flex flex-col items-center gap-1.5"
                      [class.bg-blue-50]="selectedLead.status === 'contacted'"
                      [class.border-blue-200]="selectedLead.status === 'contacted'"
                      [class.text-blue-700]="selectedLead.status === 'contacted'"
                      [class.shadow-sm]="selectedLead.status === 'contacted'"
                      [class.bg-white]="selectedLead.status !== 'contacted'"
                      [class.border-gray-200]="selectedLead.status !== 'contacted'"
                      [class.text-gray-500]="selectedLead.status !== 'contacted'"
                      [class.hover:bg-gray-50]="selectedLead.status !== 'contacted'"
                    >
                      <i class="bi bi-telephone text-lg mb-0.5" [class.text-blue-500]="selectedLead.status === 'contacted'"></i>
                      Contacted
                    </button>
                    
                    <button
                      (click)="updateStatus('resolved')"
                      class="flex-1 min-w-[120px] px-4 py-3 rounded-xl border transition-all text-sm font-bold flex flex-col items-center gap-1.5"
                      [class.bg-green-50]="selectedLead.status === 'resolved'"
                      [class.border-green-200]="selectedLead.status === 'resolved'"
                      [class.text-green-700]="selectedLead.status === 'resolved'"
                      [class.shadow-sm]="selectedLead.status === 'resolved'"
                      [class.bg-white]="selectedLead.status !== 'resolved'"
                      [class.border-gray-200]="selectedLead.status !== 'resolved'"
                      [class.text-gray-500]="selectedLead.status !== 'resolved'"
                      [class.hover:bg-gray-50]="selectedLead.status !== 'resolved'"
                    >
                      <i class="bi bi-check-circle text-lg mb-0.5" [class.text-green-500]="selectedLead.status === 'resolved'"></i>
                      Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminLeadsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  leads: LeadRecord[] = [];
  filteredLeads: LeadRecord[] = [];
  
  filterType: string = '';
  filterStatus: string = '';
  loading = false;
  selectedLead: LeadRecord | null = null;

  ngOnInit() { this.loadLeads(); }

  async loadLeads() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.adminApi.getLeads(this.filterType, this.filterStatus));
      this.leads = res.data || [];
      this.applyFilters();
    } catch { } finally { this.loading = false; }
  }

  applyFilters() {
    this.filteredLeads = this.leads.filter(l => 
      (this.filterType ? l.type === this.filterType : true) &&
      (this.filterStatus ? l.status === this.filterStatus : true)
    );
    if (this.selectedLead && !this.filteredLeads.find(l => l.id === this.selectedLead?.id)) {
      this.selectedLead = null;
    }
  }

  selectLead(lead: LeadRecord) {
    this.selectedLead = lead;
  }

  async updateStatus(newStatus: 'pending' | 'contacted' | 'resolved') {
    if (!this.selectedLead || this.selectedLead.status === newStatus) return;
    try {
      await firstValueFrom(this.adminApi.updateLeadStatus(this.selectedLead.id!, newStatus));
      this.selectedLead.status = newStatus;
      const index = this.leads.findIndex(l => l.id === this.selectedLead?.id);
      if (index > -1) this.leads[index].status = newStatus;
      this.applyFilters();
    } catch {
      alert('Failed to update status');
    }
  }

  async deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return;
    try {
      await firstValueFrom(this.adminApi.deleteLead(id));
      this.selectedLead = null;
      await this.loadLeads();
    } catch {
      alert('Failed to delete lead');
    }
  }

  getCount(status: string) {
    return this.leads.filter(l => l.status === status).length;
  }

  formatDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
