import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../core/services/admin-api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

interface ApiCostProfile {
  endpoint: string;
  method: string;
  calls: number;
  avgReads: number;
  maxReads: number;
  avgTime: number;
  hitRate: number;
  dailyCost: number;
  monthlyCost: number;
  classification: 'safe' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

@Component({
  selector: 'app-firestore-cost-monitor',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <div class="flex-1 px-6 py-5 flex justify-between items-center min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              Firestore Cost Monitor
            </h2>
            <p class="text-xs text-gray-500 mt-1">
              Real-time database cost profiles, API usage optimization analysis, and billing protections.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="loadMetrics()" [disabled]="loading" class="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50">
              <i class="bi bi-arrow-clockwise" [class.animate-spin]="loading"></i>
              <span>{{ loading ? 'Analyzing...' : 'Refresh Metrics' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50 space-y-6">
          
          <!-- Loading State -->
          <div *ngIf="loading && profiles.length === 0" class="py-32 text-center text-gray-400 flex flex-col items-center justify-center">
            <app-loading-spinner size="lg" className="mb-4"></app-loading-spinner>
            <p class="text-sm font-semibold text-gray-500">Analyzing Firestore logs and calculating cost impact...</p>
          </div>

          <!-- Main Dashboard Content -->
          <ng-container *ngIf="!loading || profiles.length > 0">
            <!-- KPI Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Est Monthly Cost -->
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Monthly Cost</span>
                  <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><i class="bi bi-currency-dollar text-lg"></i></div>
                </div>
                <div class="mt-4 flex flex-col">
                  <span class="text-2xl font-black text-gray-900 font-mono">₹{{ totalMonthlyCost | number:'1.2-2' }}</span>
                  <span class="text-[10px] text-gray-400 font-medium">Daily run rate: ₹{{ totalDailyCost | number:'1.2-2' }}</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
              </div>

              <!-- Highest Reads API -->
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Highest Reads API</span>
                  <div class="p-2 bg-orange-50 text-orange-500 rounded-lg"><i class="bi bi-database-fill-up text-lg"></i></div>
                </div>
                <div class="mt-4 flex flex-col">
                  <span class="text-2xl font-black text-gray-900 font-mono">{{ maxReads }} Reads</span>
                  <span class="text-[10px] text-gray-400 font-medium truncate">{{ maxReadsEndpoint || 'None' }}</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
              </div>

              <!-- Avg Latency -->
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Latency (Heavy)</span>
                  <div class="p-2 bg-rose-50 text-rose-500 rounded-lg"><i class="bi bi-clock-history text-lg"></i></div>
                </div>
                <div class="mt-4 flex flex-col">
                  <span class="text-2xl font-black text-gray-900 font-mono">{{ maxLatency }} ms</span>
                  <span class="text-[10px] text-gray-400 font-medium truncate">{{ maxLatencyEndpoint || 'None' }}</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
              </div>

              <!-- Avg Cache Hit Rate -->
              <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Cache Hit Rate</span>
                  <div class="p-2 bg-blue-50 text-blue-500 rounded-lg"><i class="bi bi-lightning-charge-fill text-lg"></i></div>
                </div>
                <div class="mt-4 flex flex-col">
                  <span class="text-2xl font-black text-gray-900 font-mono">{{ avgCacheHitRate | number:'1.1-1' }}%</span>
                  <span class="text-[10px] text-gray-400 font-medium">Cache coverage across APIs</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
              </div>
            </div>

            <!-- Top 10 Expensive APIs section -->
            <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <div class="p-4 border-b border-gray-100 shrink-0 flex gap-4 flex-col md:flex-row items-center justify-between bg-gray-50">
                <h3 class="text-sm font-bold text-gray-900 flex flex-col uppercase tracking-wider">
                  Top 10 Most Expensive APIs
                  <span class="text-[10px] text-gray-500 mt-1 capitalize font-medium tracking-normal">Endpoints ranked by estimated daily billing impact.</span>
                </h3>
              </div>

              <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                      <th class="px-5 py-3">API Endpoint</th>
                      <th class="px-5 py-3">Classification</th>
                      <th class="px-5 py-3 text-right">Avg Reads</th>
                      <th class="px-5 py-3 text-right">Max Reads</th>
                      <th class="px-5 py-3 text-right">Avg Latency</th>
                      <th class="px-5 py-3 text-right">Cache Hit %</th>
                      <th class="px-5 py-3 text-right">Invocations</th>
                      <th class="px-5 py-3 text-right">Est. Daily Cost</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 font-mono text-xs text-gray-700">
                    <tr *ngFor="let p of topTen" class="hover:bg-gray-50/60 transition-colors group animate-fade-in">
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-black tracking-wider"
                                [ngClass]="{
                                  'bg-blue-50 text-blue-600 border border-blue-100': p.method === 'GET',
                                  'bg-emerald-50 text-emerald-600 border border-emerald-100': p.method === 'POST',
                                  'bg-amber-50 text-amber-600 border border-amber-100': p.method === 'PUT',
                                  'bg-purple-50 text-purple-600 border border-purple-100': p.method === 'PATCH',
                                  'bg-rose-50 text-rose-600 border border-rose-100': p.method === 'DELETE'
                                }">{{ p.method }}</span>
                          <span class="font-sans font-medium text-gray-900 truncate">{{ p.endpoint }}</span>
                        </div>
                      </td>
                      <td class="px-5 py-3.5">
                        <span [class]="'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ' + getClassificationClass(p.classification)">
                          {{ p.classification }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right font-semibold text-gray-700">{{ p.avgReads | number:'1.0-0' }}</td>
                      <td class="px-5 py-3.5 text-right font-semibold text-gray-500">{{ p.maxReads }}</td>
                      <td class="px-5 py-3.5 text-right font-semibold text-gray-600">{{ p.avgTime }}ms</td>
                      <td class="px-5 py-3.5 text-right font-semibold text-gray-600">{{ p.hitRate | number:'1.0-0' }}%</td>
                      <td class="px-5 py-3.5 text-right font-semibold text-gray-500">{{ p.calls }}</td>
                      <td class="px-5 py-3.5 text-right font-extrabold text-gray-900">₹{{ p.dailyCost | number:'1.2-4' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Recommendations Center -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- All API Profiles with recommendations -->
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                  API Cost Classifications
                  <span class="block text-[10px] text-gray-400 tracking-normal capitalize font-medium mt-1">Status profiles and optimization guidance.</span>
                </h3>

                <div class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  <div *ngFor="let p of profiles" class="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black tracking-wider"
                              [ngClass]="{
                                'bg-blue-50 text-blue-600 border border-blue-100': p.method === 'GET',
                                'bg-emerald-50 text-emerald-600 border border-emerald-100': p.method === 'POST',
                                'bg-amber-50 text-amber-600 border border-amber-100': p.method === 'PUT',
                                'bg-purple-50 text-purple-600 border border-purple-100': p.method === 'PATCH',
                                'bg-rose-50 text-rose-600 border border-rose-100': p.method === 'DELETE'
                              }">{{ p.method }}</span>
                        <span class="text-sm font-bold text-gray-900 font-mono truncate block">{{ p.endpoint }}</span>
                      </div>
                      <div class="flex items-center gap-4 text-[11px] text-gray-500">
                        <span>Reads: <strong class="text-gray-700">{{ p.avgReads | number:'1.0-0' }}</strong></span>
                        <span>Latency: <strong class="text-gray-700">{{ p.avgTime }}ms</strong></span>
                        <span>Daily: <strong class="text-gray-700">₹{{ p.dailyCost | number:'1.2-4' }}</strong></span>
                      </div>
                    </div>
                    <div class="shrink-0 flex items-center gap-3">
                      <span [class]="'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ' + getClassificationClass(p.classification)">
                        {{ p.classification }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Smart Recommendations Dashboard -->
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Smart Recommendations
                  <span class="block text-[10px] text-gray-400 tracking-normal capitalize font-medium mt-1">Cost-reduction strategies based on active API profiles.</span>
                </h3>

                <div class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  <div *ngFor="let rec of recommendations" class="p-4 bg-primary-50/50 border border-primary-100 rounded-xl flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                      <i class="bi bi-lightbulb-fill text-sm"></i>
                    </div>
                    <div class="flex-1 space-y-1.5">
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-bold text-gray-600 font-mono">{{ rec.endpoint }}</span>
                        <span class="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-bold border border-orange-200">Cost Factor</span>
                      </div>
                      <p class="text-[13px] font-bold text-gray-900">{{ rec.message }}</p>
                      <ul class="text-[11px] text-gray-500 list-disc pl-4 space-y-0.5">
                        <li *ngFor="let step of rec.details">{{ step }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FirestoreCostMonitorComponent implements OnInit {
  profiles: ApiCostProfile[] = [];
  topTen: ApiCostProfile[] = [];
  recommendations: Array<{ endpoint: string; message: string; details: string[] }> = [];

  loading = true;
  totalDailyCost = 0;
  totalMonthlyCost = 0;
  maxReads = 0;
  maxReadsEndpoint = '';
  maxLatency = 0;
  maxLatencyEndpoint = '';
  avgCacheHitRate = 100;

  private api = inject(AdminApiService);

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.loading = true;
    this.api.getObservabilityMetrics().subscribe({
      next: (res) => {
        const endpoints = res.data?.endpoints || [];
        const costSettings = res.data?.costSettings || { safeReads: 50, warningReads: 150, highReads: 300, criticalReads: 500 };
        this.processMetrics(endpoints, costSettings);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  private processMetrics(endpoints: any[], costSettings: any) {
    const rawProfiles: ApiCostProfile[] = endpoints.map((e: any) => {
      const calls = e.calls || 1;
      const avgReads = e.totalReads / calls;
      const avgTime = Math.round(e.totalResponseTime / calls);
      const hitRate = (e.cacheHits + e.cacheMisses) > 0 
        ? (e.cacheHits / (e.cacheHits + e.cacheMisses)) * 100 
        : 100;

      // Est reads cost: $0.06 per 100,000 reads = $0.0000006 per read
      // Est writes cost: $0.18 per 100,000 writes = $0.0000018 per write
      // We estimate a conversion factor to local currency (e.g. ₹83 per USD)
      const usdCost = (e.totalReads * 0.0000006) + (e.totalWrites * 0.0000018);
      const dailyCost = usdCost * 83; // Estimated cost in INR
      const monthlyCost = dailyCost * 30;

      let classification: 'safe' | 'medium' | 'high' | 'critical' = 'safe';
      if (avgReads > costSettings.highReads) {
        classification = 'critical';
      } else if (avgReads > costSettings.warningReads) {
        classification = 'high';
      } else if (avgReads > costSettings.safeReads) {
        classification = 'medium';
      }

      // Generate dynamic recommendations
      const recommendations: string[] = [];
      if (hitRate < 75 && avgReads > 20) {
        recommendations.push('Enable caching to protect database against redundant reads.');
      }
      if (avgReads > 100) {
        recommendations.push('Reduce collection scans by filtering queries using indexed where clauses.');
        recommendations.push('Add pagination to load records incrementally.');
      }
      if (avgTime > 400 && avgReads > 50) {
        recommendations.push('Batch Firestore queries into parallel lookup operations.');
        recommendations.push('Avoid N+1 query patterns when loading relations.');
      }
      if (e.cacheHits > 0 && e.cacheMisses > e.cacheHits) {
        recommendations.push('Remove duplicate reads.');
        recommendations.push('Implement lazy loading for static detail structures.');
      }

      return {
        endpoint: e.endpoint,
        method: e.method,
        calls,
        avgReads,
        maxReads: e.maxReads || 0,
        avgTime,
        hitRate,
        dailyCost,
        monthlyCost,
        classification,
        recommendations
      };
    });

    // Calculate totals
    this.totalDailyCost = rawProfiles.reduce((acc, p) => acc + p.dailyCost, 0);
    this.totalMonthlyCost = this.totalDailyCost * 30;

    // Highest reads API
    const highestReadsProfile = [...rawProfiles].sort((a, b) => b.maxReads - a.maxReads)[0];
    this.maxReads = highestReadsProfile?.maxReads || 0;
    this.maxReadsEndpoint = highestReadsProfile ? `${highestReadsProfile.method} ${highestReadsProfile.endpoint}` : 'None';

    // Highest latency API
    const highestLatencyProfile = [...rawProfiles].sort((a, b) => b.avgTime - a.avgTime)[0];
    this.maxLatency = highestLatencyProfile?.avgTime || 0;
    this.maxLatencyEndpoint = highestLatencyProfile ? `${highestLatencyProfile.method} ${highestLatencyProfile.endpoint}` : 'None';

    // Avg cache hit rate
    const totalCalls = rawProfiles.reduce((acc, p) => acc + p.calls, 0);
    if (totalCalls > 0) {
      const sumHitRates = rawProfiles.reduce((acc, p) => acc + (p.hitRate * p.calls), 0);
      this.avgCacheHitRate = sumHitRates / totalCalls;
    } else {
      this.avgCacheHitRate = 100;
    }

    // Sort by daily cost desc
    this.profiles = [...rawProfiles].sort((a, b) => b.dailyCost - a.dailyCost);
    this.topTen = this.profiles.slice(0, 10);

    // Extract smart recommendations
    this.recommendations = [];
    this.profiles.forEach(p => {
      if (p.recommendations.length > 0) {
        this.recommendations.push({
          endpoint: `${p.method} ${p.endpoint}`,
          message: p.classification === 'critical' ? 'Urgent Optimization Required' : 'Recommended Adjustments',
          details: p.recommendations
        });
      }
    });
  }

  getMethodClass(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getClassificationClass(classification: string): string {
    switch (classification) {
      case 'critical': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'high': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'safe': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
