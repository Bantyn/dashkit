import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminApiService } from '../../core/services/admin-api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-platform-health',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="p-6 xl:p-10 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">Platform Health</h1>
          <p class="text-sm text-gray-500 mt-1">High-level summary of system service health and availability.</p>
        </div>
        <button (click)="loadHealth()" class="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2">
          <i class="bi bi-arrow-clockwise" [class.animate-spin]="loading"></i>
          Refresh Status
        </button>
      </div>

      <div *ngIf="loading" class="py-20 flex justify-center">
        <app-loading-spinner size="lg"></app-loading-spinner>
      </div>

      <div *ngIf="!loading && healthData" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                 [ngClass]="healthData.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
              <i class="bi bi-heart-pulse-fill text-2xl"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">System Status</p>
              <h3 class="text-2xl font-black text-gray-900 capitalize">{{ healthData.status }}</h3>
              <p class="text-xs text-gray-400 mt-1">Last checked: {{ healthData.lastChecked | date:'shortTime' }}</p>
            </div>
          </div>
          
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <i class="bi bi-cpu-fill text-2xl"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">CPU Usage</p>
              <h3 class="text-2xl font-black text-gray-900">{{ healthData.systemMetrics?.cpuUsage }}</h3>
            </div>
          </div>
          
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <i class="bi bi-memory text-2xl"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Memory Usage</p>
              <h3 class="text-2xl font-black text-gray-900">{{ healthData.systemMetrics?.memoryUsage }}</h3>
            </div>
          </div>
        </div>

        <!-- Services Grid -->
        <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h3 class="text-lg font-bold text-gray-900">Service Dependencies</h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div *ngFor="let service of healthData.services" class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full"
                     [ngClass]="{
                       'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]': service.status === 'healthy',
                       'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]': service.status === 'degraded',
                       'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]': service.status === 'down'
                     }"></div>
                <div>
                  <h4 class="font-bold text-gray-900 text-sm">{{ service.name }}</h4>
                  <p class="text-xs text-gray-500">{{ service.message }}</p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right">
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Latency</p>
                  <p class="text-sm font-bold text-gray-700">{{ service.latency }}ms</p>
                </div>
                <div class="w-24">
                  <span class="inline-flex items-center justify-center w-full px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                        [ngClass]="{
                          'bg-emerald-50 text-emerald-700 border-emerald-100': service.status === 'healthy',
                          'bg-orange-50 text-orange-700 border-orange-100': service.status === 'degraded',
                          'bg-red-50 text-red-700 border-red-100': service.status === 'down'
                        }">
                    {{ service.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlatformHealthComponent implements OnInit {
  healthData: any = null;
  loading = false;

  private apiService = inject(AdminApiService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.loadHealth();
  }

  loadHealth() {
    this.loading = true;
    this.apiService.getPlatformHealth().subscribe({
      next: (res) => {
        this.healthData = res.data;
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load platform health metrics');
        this.loading = false;
      }
    });
  }
}
